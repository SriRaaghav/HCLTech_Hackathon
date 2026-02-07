import os
import json
import joblib
import numpy as np
from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from groq import Groq

# =======================
# ENVIRONMENT
# =======================
load_dotenv()

# =======================
# FASTAPI APP
# =======================
app = FastAPI(title="Customer Value Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =======================
# LLM CLIENT
# =======================
client = Groq()

# =======================
# LOAD TRAINED MODEL (REQUIRED)
# =======================
MODEL_PATH = "model.pkl"

try:
    model = joblib.load(MODEL_PATH)
    print(f"✅ Model loaded successfully (expects {model.n_features_in_} features)")
except Exception as e:
    raise RuntimeError(f"❌ Failed to load model: {e}")

# =======================
# SYSTEM PROMPT (LLM)
# =======================
SYSTEM_PROMPT = """
You are a retail analytics expert.

Given a customer's predicted future spend and purchase likelihood
over the next 30 days, generate a structured business interpretation.

Respond with a valid JSON object containing EXACTLY these keys:
- "customer_id"
- "predicted_future_spend_30d"
- "customer_segment" (Low Value, Medium Value, High Value)
- "insight"
- "recommended_action"

Do NOT invent numeric values.
Do NOT output anything outside the JSON object.
"""

# =======================
# SCHEMAS
# =======================
class CustomerPredictionRequest(BaseModel):
    customer_id: str = Field(..., min_length=1)
    features: List[float] = Field(..., min_items=1)

class CustomerPredictionResponse(BaseModel):
    customer_id: str
    predicted_future_spend_30d: float
    purchase_probability_30d: float
    customer_segment: str
    insight: str
    recommended_action: str

# =======================
# MODEL INFERENCE (ADAPTER)
# =======================
def run_model(features: List[float]) -> float:
    """
    Model expects features in the following order:
    [
        recency_days,
        frequency (num_transactions),
        total_spend,
        avg_spend
    ]

    API provides features in this order:
    [
        total_spend,
        avg_spend,
        num_transactions,
        total_units,
        unique_products,
        recency_days
    ]
    """

    if len(features) < 6:
        raise HTTPException(
            status_code=400,
            detail="Expected 6 features: total_spend, avg_spend, num_transactions, total_units, unique_products, recency_days"
        )

    # 🔑 Explicit feature mapping (NO ambiguity)
    X = np.array([
        features[5],  # recency_days
        features[2],  # frequency
        features[0],  # total_spend
        features[1],  # avg_spend
    ], dtype=float).reshape(1, -1)

    prediction = model.predict(X)
    return float(prediction[0])


# =======================
# PURCHASE PROBABILITY (HEURISTIC)
# =======================
def purchase_probability_30d(features: List[float]) -> float:
    """
    Heuristic probability of customer making at least one purchase
    in the next 30 days (recency + frequency based).
    """

    num_txns = features[2]
    recency_days = features[5]

    freq_score = min(num_txns / 10, 1.0)
    recency_score = max(0.0, 1.0 - (recency_days / 45))

    probability = 0.6 * recency_score + 0.4 * freq_score
    return round(min(max(probability, 0.05), 0.95), 2)

# =======================
# LLM MESSAGE BUILDER
# =======================
def build_messages(payload: dict) -> list:
    user_content = (
        "Here is the customer prediction data:\n"
        f"{json.dumps(payload)}\n"
        "Return only the required JSON."
    )

    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]

# =======================
# LLM CALL
# =======================
def call_llm(messages, model_name="llama-3.3-70b-versatile"):
    try:
        response = client.chat.completions.create(
            model=model_name,
            messages=messages,
            temperature=0.0,
            max_tokens=400,
            response_format={"type": "json_object"},
        )
        return response.choices[0].message.content
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"LLM call failed: {str(e)}"
        )

# =======================
# API ENDPOINT
# =======================
@app.post(
    "/predict_customer_value",
    response_model=CustomerPredictionResponse
)
def predict_customer_value(data: CustomerPredictionRequest):

    # 1️⃣ Model prediction
    future_spend = run_model(data.features)

    # 2️⃣ Purchase probability
    probability = purchase_probability_30d(data.features)

    # 3️⃣ LLM input
    llm_input = {
        "customer_id": data.customer_id.strip(),
        "predicted_future_spend_30d": round(future_spend, 2),
        "purchase_probability_30d": probability
    }

    messages = build_messages(llm_input)

    # 4️⃣ LLM call
    llm_output = call_llm(messages)

    # 5️⃣ Parse response
    try:
        parsed = json.loads(llm_output)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=502,
            detail={"error": "Invalid JSON from LLM", "raw": llm_output}
        )

    required_keys = {
        "customer_id",
        "predicted_future_spend_30d",
        "customer_segment",
        "insight",
        "recommended_action"
    }

    if not required_keys.issubset(parsed.keys()):
        raise HTTPException(
            status_code=502,
            detail={"error": "Missing keys in LLM response", "raw": parsed}
        )

    # 🔒 Enforce source of truth
    parsed["customer_id"] = data.customer_id.strip()
    parsed["predicted_future_spend_30d"] = round(future_spend, 2)
    parsed["purchase_probability_30d"] = probability

    return parsed


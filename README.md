# Short term - Customer Lifetime Value (CLV) Prediction Model

This repository contains the **backend service** for predicting **customer future spend** and **purchase likelihood** using transaction-derived features.
The service exposes a REST API built with **FastAPI**, integrates a **trained machine learning model**, and augments predictions with **LLM-based business insights**.

---

## 👥 Contributors

This project was developed collaboratively with clearly defined responsibilities:

* **M D Sri Raaghav**
  *Prediction Models (Lasso Regression (R2))*

  * Engineered time-aware RFM features for ~N customers to predict 30-day future spend
  * Trained & compared 4 models — Baseline, Lasso (RMSE ≈ 3400), Random Forest, XGBoost (RMSE ≈ 5250, R² < 0)
  * Selected Random Forest due to best generalization on noisy retail data (lower RMSE than boosting models)
  * Used RMSE & R² evaluation to justify model choice instead of relying on complexity
  * Exported production-ready .pkl model for backend inference API

* **Lakshya Tiwari**
  *Backend Development, Deployment & System Integration*

  * Designed and implemented the FastAPI backend
  * Integrated ML inference and LLM-based insights
  * Handled cloud deployment and end-to-end integration

* **Paghallavan**
  *Presentation*

  * Designed presentation and demo narrative

---

## Features

* Predicts **future spend over the next 30 days**
* Estimates **probability of purchase in the next 30 days**
* Uses a **trained ML regression model** (`model.pkl`)
* Applies a **heuristic-based intent signal** (recency + frequency)
* Generates **business-friendly insights and recommended actions** using an LLM
* Production-ready FastAPI architecture
* Deployed on **Render**

---

# 🧠 Customer Future Spend Prediction (30-Day)

Predict how much an active customer will spend in the next 30 days using historical purchase behavior.

---

## 📌 Problem Framing

We formulate this as a **supervised regression problem**:

| Component | Meaning |
|--------|------|
| Input (X) | Past customer purchase behavior |
| Output (y) | Spend in next 30 days |

### Business Objective
- Identify high-value customers
- Support targeted marketing
- Estimate short-term revenue

---

## 🗂 Data Preparation

### Cleaning Raw Transactions

```python
df.columns = df.columns.str.strip()

df = df.rename(columns={
    'Customer ID': 'CustomerID',
    'Invoice': 'InvoiceNo',
    'Price': 'UnitPrice'
})

df['CustomerID'] = pd.to_numeric(df['CustomerID'], errors='coerce')
df['Quantity'] = pd.to_numeric(df['Quantity'], errors='coerce')
df['UnitPrice'] = pd.to_numeric(df['UnitPrice'], errors='coerce')

df = df.dropna(subset=['CustomerID'])
df = df[df['Quantity'] > 0]
df = df[df['UnitPrice'] > 0]

df['InvoiceDate'] = pd.to_datetime(df['InvoiceDate'])
df['TotalPrice'] = df['Quantity'] * df['UnitPrice']
```

---

## ⏳ Time-Aware Modeling (Preventing Data Leakage)

Instead of randomly splitting rows, we split the dataset by **time** so the model only learns from the past.

```python
cutoff_date = df['InvoiceDate'].quantile(0.8)
```

| Period | Purpose |
|------|------|
| Before cutoff | Feature creation |
| After cutoff | Future spend calculation |

---

## 👥 Active Customer Definition

We model only recently active customers.

```python
active_cutoff = cutoff_date - pd.Timedelta(days=90)

active_customers = df[df['InvoiceDate'] >= active_cutoff]['CustomerID'].unique()
df_active = df[df['CustomerID'].isin(active_customers)]
```

Active customer = at least one purchase in last 90 days.

---

## 🧩 Feature Engineering (Customer Level)

We convert transaction data into behavioral features.

| Feature | Description |
|------|------|
| Recency | Days since last purchase |
| Frequency | Number of transactions |
| Total Spend | Historical total spend |
| Avg Spend | Average purchase value |

```python
past_data = df_active[df_active['InvoiceDate'] < cutoff_date]

features = past_data.groupby('CustomerID').agg(
    recency=('InvoiceDate', lambda x: (cutoff_date - x.max()).days),
    frequency=('InvoiceNo', 'nunique'),
    total_spent=('TotalPrice', 'sum'),
    avg_spent=('TotalPrice', 'mean')
).reset_index()
```

Each row now represents one customer.

---

## 🎯 Target Variable — Future Spend

We calculate customer spend after the cutoff date.

```python
future_data = df_active[df_active['InvoiceDate'] >= cutoff_date]

target = future_data.groupby('CustomerID')['TotalPrice'].sum().reset_index()
target.columns = ['CustomerID', 'future_spend_30d']

data = features.merge(target, on='CustomerID', how='left')
data['future_spend_30d'] = data['future_spend_30d'].fillna(0)
```

Customers with no purchases → future spend = **0**

---

## 📊 Observations from Data

- Highly right-skewed spending distribution
- Majority customers spend very little
- Small group contributes most revenue
- Short-term spend contains behavioral randomness (noise)

---

## 🤖 Train/Test Split

```python
X = data[['recency','frequency','total_spent','avg_spent']]
y = data['future_spend_30d']

from sklearn.model_selection import train_test_split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
```

---

## 📈 Final Model — Lasso Regression

Scaled linear regression with L1 regularization.

```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import Lasso

lasso_pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('lasso', Lasso(alpha=0.1))
])

lasso_pipeline.fit(X_train, y_train)
```

---

## 📏 Evaluation Metrics

```python
from sklearn.metrics import mean_squared_error, r2_score

preds = lasso_pipeline.predict(X_test)

rmse = mean_squared_error(y_test, preds, squared=False)
r2 = r2_score(y_test, preds)

rmse, r2
```

### Result
**Lasso Regression RMSE ≈ 3477**

---

## 🧠 Why Lasso Performed Best

Short-term customer spend depends on factors not present in data:
- promotions
- seasonal purchases
- one-time buying events
- random behavior

Complex models attempted to fit this noise.  
Lasso captured stable patterns and generalized better.

---

## 💾 Model Export

```python
import joblib
joblib.dump(lasso_pipeline, "model.pkl")
```

---

## 🔌 Inference Input Format

Model expects features in this exact order:

```
recency, frequency, total_spent, avg_spent
```

---

## 🏁 Pipeline Summary

1. Clean transaction data
2. Apply time-aware split
3. Select active customers
4. Engineer behavioral features
5. Create future spend target
6. Train regression model
7. Evaluate performance
8. Export inference model


---

## Architecture

1. Client (Frontend / Postman) sends customer features
2. FastAPI backend:

   * Maps input features to model-expected format
   * Runs ML prediction
   * Computes purchase probability (heuristic)
3. Prediction + probability are passed to an LLM
4. LLM returns:

   * Customer segment
   * Business insight
   * Recommended action
5. Structured JSON response returned to client

---

## 📦 Tech Stack

* **FastAPI** – API framework
* **scikit-learn** – ML model inference
* **NumPy** – numerical processing
* **Groq LLM API** – insight generation
* **Uvicorn** – ASGI server
* **Render** – cloud deployment

---

## 📁 Project Structure

```
backend/
├── app.py                # FastAPI application
├── model/
│   └── model.pkl         # Trained ML model
├── requirements.txt
├── .env                  # Environment variables
└── README.md
```

---

## ⚙️ Environment Variables

Create a `.env` file with:

```env
GROQ_API_KEY=your_groq_api_key
```

---

## ▶️ Running Locally

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Start the server

```bash
uvicorn app:app --reload
```

### 3. Open API docs

```
http://127.0.0.1:8000/docs
```

---

## 🌐 Production Deployment (Render)

**Start Command**

```bash
uvicorn app:app --host 0.0.0.0 --port $PORT
```

The backend listens on the port provided by Render and is publicly accessible.

---

## 🔗 API Endpoint

### `POST /predict_customer_value`

#### Request Body

```json
{
  "customer_id": "13085",
  "features": [345.7, 49.3, 7, 12, 5, 4]
}
```

#### Feature Order

```
[
  total_spend,
  avg_spend,
  num_transactions,
  total_units,
  unique_products,
  recency_days
]
```

---

#### Response

```json
{
  "customer_id": "13085",
  "predicted_future_spend_30d": 512.4,
  "purchase_probability_30d": 0.83,
  "customer_segment": "High Value",
  "insight": "Customer shows strong recent engagement and high spending potential.",
  "recommended_action": "Offer personalized promotions or loyalty rewards."
}
```

---

## 📊 Purchase Probability Logic

Purchase probability is computed using a deterministic heuristic:

* **Recency decay** – recent customers are more likely to return
* **Frequency boost** – frequent buyers have higher intent

This signal complements spend prediction by capturing **customer intent**, not just value.

---

## 🧪 Testing

* API tested via **Postman**
* Multiple customer archetypes validated:

  * High-value active
  * At-risk churn
  * New customer
  * Habitual buyer
  * Low-value inactive

---

## 🧩 Design Decisions

* **Model-agnostic API** – inference layer adapts to model features
* **Explicit feature mapping** – avoids silent mismatches
* **Forward-compatible schema** – allows future feature expansion
* **Business guardrails** – prevents unrealistic outputs

---

## 🏁 Summary

This backend demonstrates:

* End-to-end ML inference
* Production-ready API design
* Clear separation of concerns
* Business-aligned outputs
* Cloud deployment best practices

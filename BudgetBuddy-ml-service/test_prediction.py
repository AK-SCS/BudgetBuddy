import pandas as pd
import joblib
from utils.feature_engineering import add_engineered_features

# Your test input
test_data = {
    "month": 11,
    "monthly_income": 3200,
    "rent": 900,
    "loan_repayment": 120,
    "insurance": 40,
    "subscriptions": 25,
    "groceries": 260,
    "travel": 80,
    "going_out": 120,
    "entertainment": 45,
    "utilities": 150,
    "healthcare": 30,
    "education": 0,
    "miscellaneous": 60
}

# Load model
data = joblib.load('models/xgb_pipeline.joblib')
model = data["model"]
features = data["features"]

# Create dataframe
df = pd.DataFrame([test_data])
print("Input data:")
print(df.T)

# Add engineered features
df = add_engineered_features(df)
print(f"\nAfter feature engineering: {len(df.columns)} columns")

# Reindex to match model features
X = df.reindex(columns=features, fill_value=0)
print(f"\nModel expects {len(features)} features")
print(f"Features: {features}")

# Check for any missing values
if X.isnull().any().any():
    print("\n⚠️ Warning: Missing values found:")
    print(X.isnull().sum()[X.isnull().sum() > 0])

# Make prediction
prediction = model.predict(X)
print(f"\n🔮 Predicted Total Expenses: ${prediction[0]:,.2f}")

# Calculate actual total from input
actual_total = sum([
    test_data["rent"], test_data["loan_repayment"], test_data["insurance"],
    test_data["subscriptions"], test_data["groceries"], test_data["travel"],
    test_data["going_out"], test_data["entertainment"], test_data["utilities"],
    test_data["healthcare"], test_data["education"], test_data["miscellaneous"]
])
print(f"💰 Actual Total from inputs: ${actual_total:,.2f}")

import joblib

data = joblib.load('models/xgb_pipeline.joblib')
print(f"Model: {data.get('model_name', 'Unknown')}")
print(f"Total features: {len(data['features'])}")
print("\nAll features:")
for i, feat in enumerate(data['features'], 1):
    print(f"{i}. {feat}")

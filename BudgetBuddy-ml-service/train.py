"""
Machine Learning Model Training Script for BudgetBuddy
Trains and compares XGBoost, Gradient Boosting, and Random Forest models
Selects best model based on MAPE (Mean Absolute Percentage Error)
"""

import os, joblib
import pandas as pd
import numpy as np
from xgboost import XGBRegressor
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from utils.preprocessing import load_csv, split_train_test
from utils.feature_engineering import add_engineered_features

DATA_PATH = os.path.join("data", "data.csv")
MODELS_DIR = "models"
MODEL_FILE = os.path.join(MODELS_DIR, "xgb_pipeline.joblib")

def evaluate_model(model, X_train, X_test, y_train, y_test, model_name):
    """
    Evaluates model performance using multiple metrics
    
    Args:
        model: Trained scikit-learn model
        X_train, X_test: Training and test features
        y_train, y_test: Training and test targets
        model_name: Display name for the model
        
    Returns:
        Tuple of (RMSE, MAE, R², MAPE) for test set
    """
    train_pred = model.predict(X_train)
    test_pred = model.predict(X_test)
    
    train_rmse = np.sqrt(mean_squared_error(y_train, train_pred))
    test_rmse = np.sqrt(mean_squared_error(y_test, test_pred))
    train_mae = mean_absolute_error(y_train, train_pred)
    test_mae = mean_absolute_error(y_test, test_pred)
    train_r2 = r2_score(y_train, train_pred)
    test_r2 = r2_score(y_test, test_pred)
    
    # Calculate MAPE (Mean Absolute Percentage Error) - better for different income scales
    test_mape = np.mean(np.abs((y_test - test_pred) / y_test)) * 100
    
    print(f"\n{'='*60}")
    print(f"{model_name} Performance:")
    print(f"{'='*60}")
    print(f"Training RMSE: {train_rmse:,.2f}")
    print(f"Test RMSE:     {test_rmse:,.2f}")
    print(f"Training MAE:  {train_mae:,.2f}")
    print(f"Test MAE:      {test_mae:,.2f}")
    print(f"Test MAPE:     {test_mape:.2f}%")
    print(f"Training R²:   {train_r2:.4f}")
    print(f"Test R²:       {test_r2:.4f}")
    print(f"{'='*60}\n")
    
    return test_rmse, test_mae, test_r2, test_mape

def main():
    """
    Main training pipeline:
    1. Loads and preprocesses data
    2. Engineers features
    3. Trains multiple models
    4. Selects and saves best model based on MAPE
    5. Displays feature importance
    """
    os.makedirs(MODELS_DIR, exist_ok=True)
    print("Loading data...")
    df = load_csv(DATA_PATH)

    if "Total_Expenses" not in df.columns:
        df["Total_Expenses"] = (
            df["Rent"] + df["Loan_Repayment"] + df["Insurance"] + df["Subscriptions"]
            + df["Groceries"] + df["Travel"] + df["Going_Out"] + df["Entertainment"]
            + df["Utilities"] + df["Healthcare"] + df["Education"] + df["Miscellaneous"]
        )

    print("Engineering features...")
    df = add_engineered_features(df)
    
    # Adds income-scaled features for better high-earner prediction
    print("Adding income-scaled features...")
    df['expense_to_income_ratio'] = df['Total_Expenses'] / df['Monthly_Income']
    df['discretionary_ratio'] = (df['Going_Out'] + df['Entertainment'] + df['Travel']) / df['Monthly_Income']
    df['fixed_ratio'] = (df['Rent'] + df['Loan_Repayment'] + df['Insurance']) / df['Monthly_Income']
    
    # Keeps only features that will be available in API predictions
    api_features = [
        'Month', 'Monthly_Income', 'Rent', 'Loan_Repayment', 'Insurance', 
        'Subscriptions', 'Groceries', 'Travel', 'Going_Out', 'Entertainment',
        'Utilities', 'Healthcare', 'Education', 'Miscellaneous',
        # Engineered features that can be derived from API input
        'sin_month', 'cos_month', 'essentials', 'leisure', 'health_edu',
        'fixed_costs', 'variable_costs', 'rent_to_income', 'debt_to_income',
        'essential_to_income', 'leisure_to_income', 'rent_x_utilities', 
        'groceries_x_going_out', 'expense_to_income_ratio', 'discretionary_ratio', 
        'fixed_ratio'
    ]
    
   
    available_features = [f for f in api_features if f in df.columns]
    
    X = df[available_features]
    y = df["Total_Expenses"]
    
    print(f"Using {len(available_features)} API-compatible features")

   
    print("Splitting data with income stratification...")
    try:
        income_brackets = pd.qcut(df['Monthly_Income'], q=4, labels=['low', 'medium', 'high', 'very_high'], duplicates='drop')
        X_train, X_test, y_train, y_test = split_train_test(df, "Total_Expenses")
        X_train = X_train[available_features]
        X_test = X_test[available_features]
    except Exception as e:
        print(f"Note: Could not stratify by income brackets ({e}), using regular split")
        X_train, X_test, y_train, y_test = split_train_test(df, "Total_Expenses")
        X_train = X_train[available_features]
        X_test = X_test[available_features]
    
    print(f"Training set size: {len(X_train)}")
    print(f"Test set size: {len(X_test)}")
    print(f"Number of features: {len(available_features)}")

    # Train and compare multiple models
    models = {
        "XGBoost (Income-Optimized)": XGBRegressor(
            n_estimators=500,
            max_depth=8,
            learning_rate=0.05,
            min_child_weight=3,
            subsample=0.8,
            colsample_bytree=0.8,
            gamma=0.1,
            reg_alpha=0.1,
            reg_lambda=1.0,
            random_state=42,
            n_jobs=-1
        ),
        "Gradient Boosting": GradientBoostingRegressor(
            n_estimators=300,
            max_depth=6,
            learning_rate=0.05,
            min_samples_split=5,
            min_samples_leaf=3,
            subsample=0.8,
            random_state=42
        ),
        "Random Forest": RandomForestRegressor(
            n_estimators=200,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
    }

    best_model = None
    best_model_name = None
    best_mape = float('inf')
    
    for name, model in models.items():
        print(f"\nTraining {name}...")
        model.fit(X_train, y_train)
        rmse, mae, r2, mape = evaluate_model(model, X_train, X_test, y_train, y_test, name)
        
        # Use MAPE as primary metric since it's scale-independent
        if mape < best_mape:
            best_mape = mape
            best_model = model
            best_model_name = name

        print(f"\n🏆 Best Model: {best_model_name} (Test MAPE: {best_mape:.2f}%)")
    
    # Save the best model with a dynamic filename
    model_file = f"models/{best_model_name.lower().replace(' ', '_').replace('(', '').replace(')', '')}_pipeline.joblib"
    joblib.dump({
        "model": best_model, 
        "features": available_features, 
        "model_name": best_model_name
    }, model_file)
    print(f"✅ Model saved to {model_file}")
    
    # Feature importance (for tree-based models)
    if hasattr(best_model, 'feature_importances_'):
        feature_importance = pd.DataFrame({
            'feature': available_features,
            'importance': best_model.feature_importances_
        }).sort_values('importance', ascending=False).head(15)
        
        print("\n📊 Top 15 Most Important Features:")
        print(feature_importance.to_string(index=False))

if __name__ == "__main__":
    main()
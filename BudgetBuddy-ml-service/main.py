"""
BudgetBuddy ML Service - FastAPI microservice for financial predictions
Provides endpoints for expense prediction and spare cash allocation recommendations
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
import os
import joblib
import traceback
from typing import Optional
from utils.feature_engineering import add_engineered_features

app = FastAPI(title="BudgetBuddy ML Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5206"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictInput(BaseModel):
    """Input schema for expense prediction requests"""
    month: int
    monthly_income: float
    rent: float
    loan_repayment: float
    insurance: float
    subscriptions: float
    groceries: float
    travel: float
    going_out: float
    entertainment: float
    utilities: float
    healthcare: float
    education: float
    miscellaneous: float

class AllocateSpareInput(BaseModel):
    """Input schema for spare cash allocation recommendations"""
    spare_cash: float
    current_expenses: dict
    monthly_income: float
    financial_goals: list = []

MODELS_DIR = "models"
MODEL_FILE = os.path.join(MODELS_DIR, "random_forest_pipeline.joblib")

MODEL = None
FEATURES = None

def load_model():
    """
    Loads the trained Random Forest model from disk at startup
    Initializes MODEL and FEATURES global variables
    """
    global MODEL, FEATURES
    try:
        data = joblib.load(MODEL_FILE)
        MODEL = data["model"]
        FEATURES = data["features"]
        print(f"✅ Model loaded with {len(FEATURES)} features")
    except Exception as e:
        print("⚠️ Model not loaded:", e)

load_model()

@app.get("/")
def root():
    """
    Root endpoint providing service information and available endpoints
    """
    return {
        "message": "BudgetBuddy ML Service is running!",
        "endpoints": {
            "health": "/health",
            "predict": "/predict",
            "allocate_spare_cash": "/allocate-spare-cash"
        }
    }

@app.get("/health")
def health():
    """
    Health check endpoint for monitoring service status
    Returns model loading status and feature count
    """
    return {
        "status": "ok", 
        "model_loaded": MODEL is not None, 
        "num_features": len(FEATURES or [])
    }

@app.post("/predict")
def predict(payload: PredictInput):
    """
    Predicts total monthly expenses using Random Forest machine learning model
    Applies feature engineering and returns prediction with confidence metrics
    
    Args:
        payload: Budget data with income and individual expense categories
        
    Returns:
        Prediction with confidence level and accuracy metrics
    """
    try:
        df = pd.DataFrame([{
            'Month': payload.month,
            'Monthly_Income': payload.monthly_income,
            'Rent': payload.rent,
            'Loan_Repayment': payload.loan_repayment,
            'Insurance': payload.insurance,
            'Subscriptions': payload.subscriptions,
            'Groceries': payload.groceries,
            'Travel': payload.travel,
            'Going_Out': payload.going_out,
            'Entertainment': payload.entertainment,
            'Utilities': payload.utilities,
            'Healthcare': payload.healthcare,
            'Education': payload.education,
            'Miscellaneous': payload.miscellaneous
        }])
        
        # Calculate actual total expenses
        actual_total = (
            payload.rent + payload.loan_repayment + payload.insurance + 
            payload.subscriptions + payload.groceries + payload.travel + 
            payload.going_out + payload.entertainment + payload.utilities + 
            payload.healthcare + payload.education + payload.miscellaneous
        )
        
        # Add Total_Expenses for ratio calculations
        df['Total_Expenses'] = actual_total
        
      
        df = add_engineered_features(df)
        
        
        df['expense_to_income_ratio'] = df['Total_Expenses'] / df['Monthly_Income']
        df['discretionary_ratio'] = (df['Going_Out'] + df['Entertainment'] + df['Travel']) / df['Monthly_Income']
        df['fixed_ratio'] = (df['Rent'] + df['Loan_Repayment'] + df['Insurance']) / df['Monthly_Income']
        
        # Select only the features the model expects
        X = df.reindex(columns=FEATURES, fill_value=0)
        
        # Ensure no NaN values
        X = X.fillna(0)
        
        # Make prediction
        y_pred = MODEL.predict(X)
        predicted_value = float(y_pred[0])
        
        # Calculate accuracy metrics
        difference = predicted_value - actual_total
        percentage_diff = abs(difference / actual_total * 100) if actual_total > 0 else 0
        
        return {
            "predicted_total_expenses": round(predicted_value, 2),
            "actual_total_expenses": round(actual_total, 2),
            "difference": round(difference, 2),
            "percentage_difference": round(percentage_diff, 2),
            "confidence_level": "high" if percentage_diff < 10 else "medium" if percentage_diff < 20 else "low"
        }
    except Exception as e:
        return {"error": str(e), "trace": traceback.format_exc()}

@app.post("/allocate-spare-cash")
def allocate_spare_cash(payload: AllocateSpareInput):
    """
    Generates smart allocation recommendations for spare cash
    Uses priority-based algorithm considering emergency fund, debt, investments, and goals
    
    Args:
        payload: Spare cash amount, current expenses, income, and financial goals
        
    Returns:
        Prioritized allocation breakdown with reasons and actionable advice
    """
    try:
        spare = payload.spare_cash
        
        total_current = sum(payload.current_expenses.values())
        expense_ratio = total_current / payload.monthly_income if payload.monthly_income > 0 else 0
        
        allocations = []
        emergency_fund_target = payload.monthly_income * 3  # 3 months minimum
        emergency_allocation = min(spare * 0.3, spare)  # 30% or all if small amount
        allocations.append({
            "category": "Emergency Fund",
            "amount": round(emergency_allocation, 2),
            "percentage": round((emergency_allocation / spare) * 100, 1),
            "reason": "Build 3-6 months of expenses for financial security",
            "priority": "High"
        })
        
        remaining = spare - emergency_allocation
        
        # Priority 2: Debt Payoff (if loan_repayment exists)
        if payload.current_expenses.get("loan_repayment", 0) > 0:
            debt_allocation = min(remaining * 0.4, remaining)
            allocations.append({
                "category": "Extra Debt Payment",
                "amount": round(debt_allocation, 2),
                "percentage": round((debt_allocation / spare) * 100, 1),
                "reason": "Pay off high-interest debt faster and save on interest",
                "priority": "High"
            })
            remaining -= debt_allocation
        
        # Priority 3: Retirement/Investment (20-30% of spare)
        if remaining > 0:
            investment_allocation = min(remaining * 0.3, remaining)
            allocations.append({
                "category": "Retirement/Investment",
                "amount": round(investment_allocation, 2),
                "percentage": round((investment_allocation / spare) * 100, 1),
                "reason": "Grow wealth through compound interest over time",
                "priority": "Medium"
            })
            remaining -= investment_allocation
        
        # Priority 4: Short-term Goals (vacation, new gadget, etc.)
        if remaining > 0:
            goal_allocation = remaining * 0.5
            allocations.append({
                "category": "Short-term Goals",
                "amount": round(goal_allocation, 2),
                "percentage": round((goal_allocation / spare) * 100, 1),
                "reason": "Save for vacation, electronics, or personal treats",
                "priority": "Medium"
            })
            remaining -= goal_allocation
        
        # Priority 5: Buffer/Flexible spending
        if remaining > 0:
            allocations.append({
                "category": "Flexible Buffer",
                "amount": round(remaining, 2),
                "percentage": round((remaining / spare) * 100, 1),
                "reason": "Keep some flexibility for unexpected opportunities",
                "priority": "Low"
            })
        
        return {
            "total_spare_cash": spare,
            "allocations": allocations,
            "summary": f"Smart allocation of £{spare:.2f} across {len(allocations)} categories",
            "tip": "Consider automating these transfers on payday to avoid spending temptation!"
        }
        
    except Exception as e:
        return {"error": str(e), "trace": traceback.format_exc()}
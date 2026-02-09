"""
BudgetBuddy ML Service - Production-ready FastAPI microservice
Provides endpoints for expense prediction and spare cash allocation recommendations
"""

import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, validator
import pandas as pd
import numpy as np
import joblib
from typing import Optional
from dotenv import load_dotenv
from utils.feature_engineering import add_engineered_features

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("logs/ml-service.log")
    ]
)
logger = logging.getLogger(__name__)

# Model globals
MODEL = None
FEATURES = None
MODELS_DIR = os.getenv("MODEL_PATH", "models")
MODEL_FILE = os.path.join(MODELS_DIR, "random_forest_pipeline.joblib")


def load_model():
    """Loads the trained Random Forest model from disk"""
    global MODEL, FEATURES
    try:
        if not os.path.exists(MODEL_FILE):
            logger.warning(f"Model file not found at {MODEL_FILE}")
            return False
        
        data = joblib.load(MODEL_FILE)
        MODEL = data["model"]
        FEATURES = data["features"]
        logger.info(f"✅ Model loaded successfully with {len(FEATURES)} features")
        return True
    except Exception as e:
        logger.error(f"Failed to load model: {e}", exc_info=True)
        return False


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info("Starting BudgetBuddy ML Service...")
    os.makedirs("logs", exist_ok=True)
    load_model()
    yield
    # Shutdown
    logger.info("Shutting down BudgetBuddy ML Service...")


app = FastAPI(
    title="BudgetBuddy ML Service",
    version="1.0.0",
    description="AI-powered financial predictions with multi-region support",
    lifespan=lifespan
)

# CORS Configuration
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5206").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc) if os.getenv("ENVIRONMENT") == "development" else "An error occurred",
            "timestamp": pd.Timestamp.now().isoformat()
        }
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
    region: Optional[str] = "GB"  # GB or IN
    
    @validator('month')
    def validate_month(cls, v):
        if not 1 <= v <= 12:
            raise ValueError('Month must be between 1 and 12')
        return v
    
    @validator('monthly_income', 'rent', 'loan_repayment', 'insurance', 
               'subscriptions', 'groceries', 'travel', 'going_out', 
               'entertainment', 'utilities', 'healthcare', 'education', 
               'miscellaneous')
    def validate_positive(cls, v):
        if v < 0:
            raise ValueError('Value must be non-negative')
        return v
    
    @validator('region')
    def validate_region(cls, v):
        if v not in ['GB', 'IN']:
            raise ValueError('Region must be either GB or IN')
        return v


class AllocateSpareInput(BaseModel):
    """Input schema for spare cash allocation recommendations"""
    spare_cash: float
    current_expenses: dict
    monthly_income: float
    financial_goals: list = []
    region: Optional[str] = "GB"
    
    @validator('spare_cash', 'monthly_income')
    def validate_positive(cls, v):
        if v < 0:
            raise ValueError('Value must be non-negative')
        return v
    
    @validator('region')
    def validate_region(cls, v):
        if v not in ['GB', 'IN']:
            raise ValueError('Region must be either GB or IN')
        return v


@app.get("/")
def root():
    """Root endpoint providing service information"""
    return {
        "service": "BudgetBuddy ML Service",
        "version": "1.0.0",
        "status": "running",
        "model_loaded": MODEL is not None,
        "supported_regions": ["GB", "IN"],
        "endpoints": {
            "health": "/health",
            "predict": "/predict",
            "allocate_spare_cash": "/allocate-spare-cash"
        }
    }


@app.get("/health")
def health():
    """Health check endpoint for monitoring"""
    is_healthy = MODEL is not None
    return {
        "status": "healthy" if is_healthy else "unhealthy", 
        "model_loaded": MODEL is not None, 
        "num_features": len(FEATURES or []),
        "timestamp": pd.Timestamp.now().isoformat()
    }


@app.post("/predict")
def predict(payload: PredictInput):
    """
    Predicts total monthly expenses based on input features
    
    Args:
        payload: PredictInput with expense categories and region
    
    Returns:
        Predicted total expenses with confidence interval
    """
    if MODEL is None:
        logger.error("Model not loaded - cannot make prediction")
        raise HTTPException(status_code=503, detail="Model not loaded. Please contact administrator.")
    
    try:
        logger.info(f"Prediction request for region: {payload.region}")
        
        # Convert payload to DataFrame
        input_dict = payload.dict()
        region = input_dict.pop('region')
        df = pd.DataFrame([input_dict])
        
        # Add engineered features
        df = add_engineered_features(df)
        
        # Ensure all model features are present
        for feat in FEATURES:
            if feat not in df.columns:
                df[feat] = 0
        
        df = df[FEATURES]
        
        # Make prediction
        prediction = float(MODEL.predict(df)[0])
        
        # Calculate confidence interval (rough estimate)
        confidence_margin = prediction * 0.1  # ±10%
        
        # Regional adjustments (example: India might have different patterns)
        if region == "IN":
            # Could apply region-specific adjustments if needed
            logger.info("Applied India region context")
        
        logger.info(f"Prediction successful: {prediction:.2f}")
        
        return {
            "predicted_total_expenses": round(prediction, 2),
            "confidence_interval": {
                "lower": round(prediction - confidence_margin, 2),
                "upper": round(prediction + confidence_margin, 2)
            },
            "region": region,
            "currency": "GBP" if region == "GB" else "INR",
            "timestamp": pd.Timestamp.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Prediction error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.post("/allocate-spare-cash")
def allocate_spare_cash(payload: AllocateSpareInput):
    """
    Provides smart allocation recommendations for spare cash
    
    Args:
        payload: AllocateSpareInput with spare cash amount and goals
    
    Returns:
        Allocation recommendations based on goals and region
    """
    try:
        logger.info(f"Allocation request for {payload.spare_cash} in region: {payload.region}")
        
        spare = payload.spare_cash
        goals = payload.financial_goals
        region = payload.region
        
        # Regional defaults
        emergency_fund_percentage = 0.20  # 20% to emergency fund
        if region == "IN":
            # India might prioritize savings differently
            emergency_fund_percentage = 0.25  # 25% for India
        
        # Base allocation strategy
        allocations = []
        remaining = spare
        
        # 1. Emergency fund (top priority)
        emergency_allocation = min(spare * emergency_fund_percentage, remaining)
        if emergency_allocation > 0:
            allocations.append({
                "category": "Emergency Fund",
                "amount": round(emergency_allocation, 2),
                "percentage": round((emergency_allocation / spare) * 100, 1),
                "priority": "High"
            })
            remaining -= emergency_allocation
        
        # 2. Goal-based allocation
        if goals and remaining > 0:
            per_goal = remaining * 0.5 / len(goals) if len(goals) > 0 else 0
            for goal in goals[:3]:  # Top 3 goals
                goal_allocation = min(per_goal, remaining)
                if goal_allocation > 0:
                    allocations.append({
                        "category": f"Goal: {goal.get('name', 'Unnamed')}",
                        "amount": round(goal_allocation, 2),
                        "percentage": round((goal_allocation / spare) * 100, 1),
                        "priority": "Medium"
                    })
                    remaining -= goal_allocation
        
        # 3. Investment (if remaining)
        if remaining > 0:
            investment_allocation = remaining * 0.6
            allocations.append({
                "category": "Investments" if region == "GB" else "Investments/Fixed Deposits",
                "amount": round(investment_allocation, 2),
                "percentage": round((investment_allocation / spare) * 100, 1),
                "priority": "Medium"
            })
            remaining -= investment_allocation
        
        # 4. Discretionary
        if remaining > 0:
            allocations.append({
                "category": "Discretionary/Enjoyment",
                "amount": round(remaining, 2),
                "percentage": round((remaining / spare) * 100, 1),
                "priority": "Low"
            })
        
        logger.info(f"Allocation successful: {len(allocations)} categories")
        
        return {
            "total_spare_cash": round(spare, 2),
            "allocations": allocations,
            "region": region,
            "currency": "GBP" if region == "GB" else "INR",
            "timestamp": pd.Timestamp.now().isoformat(),
            "note": f"Allocations optimized for {region} region"
        }
    
    except Exception as e:
        logger.error(f"Allocation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Allocation failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host=host, port=port, log_level="info")

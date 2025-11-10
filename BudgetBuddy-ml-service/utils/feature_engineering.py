"""
Feature engineering utilities for BudgetBuddy ML models
Creates derived features including ratios, seasonal patterns, and category groupings
"""

import numpy as np
import pandas as pd

def add_engineered_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Engineers features from raw budget data to improve model performance
    
    Creates:
    - Seasonal features (sin/cos encoding of month)
    - Expense category groupings (essentials, leisure, health/edu)
    - Financial ratios (rent-to-income, debt-to-income)
    - Interaction features between related categories
    - Age-based features if available
    
    Args:
        df: DataFrame with budget data
        
    Returns:
        DataFrame with additional engineered features
    """
    df = df.copy()
    
    col_map = {col.lower(): col for col in df.columns}
    
    def get_col(name: str):
        lower_name = name.lower()
        return df[col_map[lower_name]]
    
    month_col = get_col("month")
    df["sin_month"] = np.sin(2*np.pi*month_col/12)
    df["cos_month"] = np.cos(2*np.pi*month_col/12)
    
    rent = get_col("rent")
    loan_repayment = get_col("loan_repayment")
    insurance = get_col("insurance")
    subscriptions = get_col("subscriptions")
    groceries = get_col("groceries")
    travel = get_col("travel")
    going_out = get_col("going_out")
    entertainment = get_col("entertainment")
    utilities = get_col("utilities")
    healthcare = get_col("healthcare")
    education = get_col("education")
    miscellaneous = get_col("miscellaneous")
    
    # Category groupings
    df["essentials"] = rent + groceries + utilities + insurance
    df["leisure"] = going_out + entertainment + travel
    df["health_edu"] = healthcare + education
    df["fixed_costs"] = rent + loan_repayment + insurance + subscriptions
    df["variable_costs"] = groceries + travel + going_out + entertainment + miscellaneous
    
    # Ratios and percentages (if monthly_income exists)
    if "monthly_income" in col_map:
        monthly_income = get_col("monthly_income")
        # Avoid division by zero
        monthly_income_safe = monthly_income.replace(0, 1)
        df["rent_to_income"] = rent / monthly_income_safe
        df["debt_to_income"] = loan_repayment / monthly_income_safe
        df["essential_to_income"] = df["essentials"] / monthly_income_safe
        df["leisure_to_income"] = df["leisure"] / monthly_income_safe
    
    # Interaction features
    df["rent_x_utilities"] = rent * utilities
    df["groceries_x_going_out"] = groceries * going_out
    
    # Age-based features (if age exists)
    if "age" in col_map:
        age = get_col("age")
        df["age_squared"] = age ** 2
        df["age_group"] = pd.cut(age, bins=[0, 25, 35, 50, 100], labels=[0, 1, 2, 3]).astype(int)
    
    # Dependents features (if dependents exists)
    if "dependents" in col_map:
        dependents = get_col("dependents")
        df["has_dependents"] = (dependents > 0).astype(int)
    
    df = df.fillna(0.0)
    return df

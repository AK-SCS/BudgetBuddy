"""
Data preprocessing utilities for BudgetBuddy ML pipeline
Handles CSV loading, missing value cleanup, and train-test splitting
"""

import pandas as pd
from sklearn.model_selection import train_test_split

def load_csv(path: str) -> pd.DataFrame:
    """
    Loads CSV file and performs basic preprocessing
    
    - Drops rows with missing values
    - Removes non-predictive ID columns
    - Encodes categorical features
    
    Args:
        path: Path to CSV file
        
    Returns:
        Preprocessed DataFrame ready for feature engineering
    """
    df = pd.read_csv(path)
    df = df.dropna().reset_index(drop=True)
    
    if "Unique_User_ID" in df.columns:
        df = df.drop(columns=["Unique_User_ID"])
    
    categorical_cols = df.select_dtypes(include=['object']).columns
    for col in categorical_cols:
        df[col] = pd.factorize(df[col])[0]
    
    return df

def split_train_test(df: pd.DataFrame, target_col: str):
    """
    Splits data into training and test sets
    
    Args:
        df: Complete dataset
        target_col: Name of target variable column
        
    Returns:
        Tuple of (X_train, X_test, y_train, y_test)
    """
    X = df.drop(columns=[target_col])
    y = df[target_col]
    return train_test_split(X, y, test_size=0.2, random_state=42)

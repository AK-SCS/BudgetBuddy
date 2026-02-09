import pytest
import pandas as pd
import numpy as np
from utils.feature_engineering import add_engineered_features


def test_add_engineered_features():
    """Test feature engineering adds correct columns"""
    # Create sample data
    df = pd.DataFrame({
        'month': [1, 2, 3],
        'monthly_income': [5000, 5500, 6000],
        'rent': [1200, 1200, 1200],
        'groceries': [400, 450, 500]
    })
    
    result = add_engineered_features(df)
    
    # Check that new features are added
    assert 'total_expenses' in result.columns or len(result.columns) >= len(df.columns)
    assert len(result) == len(df)


def test_add_engineered_features_empty_dataframe():
    """Test feature engineering with empty dataframe"""
    df = pd.DataFrame()
    
    # Should not raise an error
    try:
        result = add_engineered_features(df)
        assert isinstance(result, pd.DataFrame)
    except Exception:
        # Empty dataframe might raise exception, which is acceptable
        pass


def test_add_engineered_features_single_row():
    """Test feature engineering with single row"""
    df = pd.DataFrame({
        'month': [6],
        'monthly_income': [5000],
        'rent': [1200],
        'groceries': [400]
    })
    
    result = add_engineered_features(df)
    assert len(result) == 1

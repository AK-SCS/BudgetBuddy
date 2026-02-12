import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';

/**
 * Enhanced error handling utilities
 */

export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

export const handleApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{
      message?: string;
      errors?: Record<string, string[]>;
    }>;

    // Network error
    if (!axiosError.response) {
      return {
        message: 'Network error. Please check your connection.',
        status: 0,
      };
    }

    // Server error with message
    if (axiosError.response.data?.message) {
      return {
        message: axiosError.response.data.message,
        status: axiosError.response.status,
        errors: axiosError.response.data.errors,
      };
    }

    // HTTP status errors
    const status = axiosError.response.status;
    const statusMessages: Record<number, string> = {
      400: 'Invalid request. Please check your input.',
      401: 'Unauthorized. Please log in again.',
      403: 'You do not have permission to perform this action.',
      404: 'The requested resource was not found.',
      429: 'Too many requests. Please try again later.',
      500: 'Server error. Please try again later.',
      503: 'Service temporarily unavailable.',
    };

    return {
      message: statusMessages[status] || 'An error occurred.',
      status,
    };
  }

  // Generic error
  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  return {
    message: 'An unexpected error occurred.',
  };
};

export const showErrorToast = (error: unknown) => {
  const apiError = handleApiError(error);
  toast.error(apiError.message);
};

export const showSuccessToast = (message: string) => {
  toast.success(message);
};

export const showInfoToast = (message: string) => {
  toast(message, { icon: 'ℹ️' });
};

/**
 * Retry logic for failed requests
 */
export const retryRequest = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) {
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryRequest(fn, retries - 1, delay * 2);
  }
};

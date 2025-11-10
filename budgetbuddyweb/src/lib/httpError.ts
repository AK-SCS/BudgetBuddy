import axios, { AxiosError } from 'axios';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

export function getErrorMessage(err: unknown, fallback = 'Request failed'): string {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<unknown>;
    const data = ax.response?.data;

    if (typeof data === 'string') return data;
    if (isRecord(data) && typeof data.message === 'string') return data.message;

    return ax.message || fallback;
  }
  if (err instanceof Error) return err.message || fallback;
  return fallback;
}

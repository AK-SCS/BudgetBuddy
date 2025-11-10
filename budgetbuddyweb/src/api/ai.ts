import { api } from './axios';

export async function predictAdvice(payload: Record<string, number|string>) {
  const { data } = await api.post('/api/AIModel/predict', payload);
  return data; // { recommendationText, allocations? }
}

export async function getRecommendations() {
  const { data } = await api.get('/api/AIRecommendations');
  return data as Array<{ id:number; userId:number; recommendationText:string; generatedAt:string }>;
}

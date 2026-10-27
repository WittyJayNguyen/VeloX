export const MODEL_ENDPOINTS = { MODELS: '/models', CATALOG: '/models/catalog' } as const;
export const MODEL_TYPES = ['chat', 'image', 'video', 'code', 'embedding', 'audio'] as const;
export const MODEL_PROVIDERS = ['openai', 'anthropic', 'google', 'midjourney', 'runway', 'luma', 'stability', 'deepseek', 'mistral', 'cohere'] as const;

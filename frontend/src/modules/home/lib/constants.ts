// ============================================
// Home Module — Constants & Config
// ============================================

/** Provider logos */
export const AI_PROVIDERS = [
  'OpenAI', 'Anthropic', 'Google AI', 'Midjourney',
  'Runway', 'Luma AI', 'Stability AI', 'DeepSeek',
  'Cohere', 'Mistral',
] as const;

/** Stats display config */
export const HOME_STATS = [
  { key: 'models', value: '100+', suffix: '' },
  { key: 'users', value: '12K+', suffix: '' },
  { key: 'uptime', value: '99.9', suffix: '%' },
  { key: 'requests', value: '2.8M+', suffix: '' },
] as const;

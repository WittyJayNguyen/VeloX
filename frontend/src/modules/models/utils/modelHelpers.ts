/** Calculate profit margin */
export const calcMargin = (cost: number, price: number): number => price > 0 ? Math.round(((price - cost) / price) * 100) : 0;

/** Get model type icon */
export const getModelTypeEmoji = (type: string): string => {
  const map: Record<string, string> = { chat: '💬', image: '🖼️', video: '🎬', code: '💻', embedding: '🔢', audio: '🎵' };
  return map[type] || '🤖';
};

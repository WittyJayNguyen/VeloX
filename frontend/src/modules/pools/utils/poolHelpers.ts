/** Mask API key for display */
export const maskKey = (key: string): string => key.length > 12 ? `${key.slice(0, 6)}...${key.slice(-4)}` : '••••••••';

/** Get pool health color */
export const getPoolHealthColor = (percent: number): string => percent >= 75 ? '#10b981' : percent >= 40 ? '#f59e0b' : '#f43f5e';

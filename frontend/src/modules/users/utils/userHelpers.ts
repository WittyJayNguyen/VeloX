/** Get role badge color */
export const getRoleBadge = (role: string) => {
  const map: Record<string, { bg: string; color: string }> = {
    ROLE_SUPER_ADMIN: { bg: 'rgba(244,63,94,0.12)', color: '#f43f5e' },
    ROLE_ADMIN: { bg: 'rgba(99,102,241,0.12)', color: '#6366f1' },
    ROLE_OPERATOR: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    ROLE_USER: { bg: 'rgba(16,185,129,0.12)', color: '#10b981' },
  };
  return map[role] || map.ROLE_USER;
};

/** Format credit amount */
export const formatCredits = (credits: number): string => credits >= 1_000_000 ? `${(credits / 1_000_000).toFixed(1)}M` : credits >= 1_000 ? `${(credits / 1_000).toFixed(0)}K` : credits.toString();

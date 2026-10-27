// ============================================
// Auth Module — Utility Helpers
// ============================================

import { PASSWORD_RULES } from '../lib/constants';

/** Validate email format */
export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/** Validate password strength */
export const isValidPassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (password.length < PASSWORD_RULES.MIN_LENGTH) errors.push(`Tối thiểu ${PASSWORD_RULES.MIN_LENGTH} ký tự`);
  if (PASSWORD_RULES.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) errors.push('Cần ít nhất 1 chữ hoa');
  if (PASSWORD_RULES.REQUIRE_NUMBER && !/\d/.test(password)) errors.push('Cần ít nhất 1 số');
  if (PASSWORD_RULES.REQUIRE_SPECIAL && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('Cần ít nhất 1 ký tự đặc biệt');
  return { valid: errors.length === 0, errors };
};

/** Extract initials from full name */
export const getInitials = (name: string): string =>
  name.split(' ').map((n) => n.charAt(0).toUpperCase()).slice(0, 2).join('');

/** Check if JWT token is expired */
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
};

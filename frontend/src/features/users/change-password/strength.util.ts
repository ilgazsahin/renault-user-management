export interface StrengthResult {
  score: 0 | 1 | 2 | 3;
  label: string;
  color: string;
}

export function evaluateStrength(password: string): StrengthResult {
  if (!password) return { score: 0, label: '', color: '' };

  let points = 0;
  if (password.length >= 8)           points++;
  if (password.length >= 12)          points++;
  if (/[A-Z]/.test(password))         points++;
  if (/[a-z]/.test(password))         points++;
  if (/[0-9]/.test(password))         points++;
  if (/[^A-Za-z0-9]/.test(password))  points++;

  if (points <= 2) return { score: 1, label: 'Weak',   color: '#D32F2F' };
  if (points <= 4) return { score: 2, label: 'Medium', color: '#F57C00' };
  return            { score: 3, label: 'Strong', color: '#2E7D32' };
}

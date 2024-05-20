export const normalizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

export const normalizeFloat = (amount: string | number): number => {
  return parseFloat(parseFloat(amount.toString()).toFixed(2));
};
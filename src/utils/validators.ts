export const isValidEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const isPositiveNumber = (value: any): boolean => {
  return typeof value === "number" && value >= 0;
};

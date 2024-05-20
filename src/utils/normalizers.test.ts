import { normalizeEmail, normalizeFloat } from "./normalizers";

describe("normalizeEmail", () => {
  it("should handle emails with no whitespace", () => {
    const email = "testemail@example.com";
    const expected = "testemail@example.com";
    expect(normalizeEmail(email)).toBe(expected);
  });

  it("should handle emails with mixed case and whitespace", () => {
    const email = " TestEmail@Example.com ";
    const expected = "testemail@example.com";
    expect(normalizeEmail(email)).toBe(expected);
  });
});

describe("normalizeFloat", () => {
  it("should correctly round float values to two decimal places", () => {
    const amount = 123.45678;
    const expected = 123.46;
    expect(normalizeFloat(amount)).toBeCloseTo(expected, 2);
  });

  it("should handle string input and convert to number", () => {
    const amount = "123.45678";
    const expected = 123.46;
    expect(normalizeFloat(amount)).toBeCloseTo(expected, 2);
  });

  it("should handle negative float values", () => {
    const amount = -123.45678;
    const expected = -123.46;
    expect(normalizeFloat(amount)).toBeCloseTo(expected, 2);
  });

  it("should handle zero", () => {
    const amount = 0;
    const expected = 0;
    expect(normalizeFloat(amount)).toBeCloseTo(expected, 2);
  });
});

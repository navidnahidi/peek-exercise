import { isValidEmail, isPositiveNumber } from "./validators";

describe("isValidEmail", () => {
  it("should return true for valid emails", () => {
    expect(isValidEmail("example@gmail.com")).toBeTruthy();
    expect(isValidEmail("user.name@domain.co.uk")).toBeTruthy();
  });

  it("should return false for invalid emails", () => {
    expect(isValidEmail("invalid_email")).toBeFalsy();
    expect(isValidEmail("@gmail.com")).toBeFalsy();
    expect(isValidEmail("example..com")).toBeFalsy();
  });

  it("should allow emails with periods in domain names", () => {
    expect(isValidEmail("user.name@sub.domain.co.uk")).toBeTruthy();
  });

  it("should reject emails with spaces", () => {
    expect(isValidEmail(" user.name@domain.co.uk ")).toBeFalsy();
  });
});

describe("isPositiveNumber", () => {
  it("should return true for positive numbers", () => {
    expect(isPositiveNumber(42)).toBeTruthy();
    expect(isPositiveNumber(0)).toBeTruthy(); // Zero is considered positive
  });

  it("should return false for negative numbers", () => {
    expect(isPositiveNumber(-42)).toBeFalsy();
  });

  it("should return false for non-number inputs", () => {
    expect(isPositiveNumber("abc")).toBeFalsy();
    expect(isPositiveNumber(true)).toBeFalsy();
    expect(isPositiveNumber(null)).toBeFalsy();
  });

  it("should return false for NaN values", () => {
    expect(isPositiveNumber(NaN)).toBeFalsy();
  });
});

import { normalizeEmail } from "./normalizers";

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

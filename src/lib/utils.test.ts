jest.mock("nanoid", () => ({
  nanoid: jest.fn(() => "mocked-nanoid"),
}));

import { generateId, generateJoinCode, now } from "./utils";

describe("utils", () => {
  test("generateId returns a non-empty string", () => {
    const id = generateId();

    expect(id).toBe("mocked-nanoid");
  });

  test("generateJoinCode returns 6 allowed characters", () => {
    const code = generateJoinCode();

    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
  });

  test("now returns an ISO date string", () => {
    const value = now();

    expect(new Date(value).toISOString()).toBe(value);
  });
});

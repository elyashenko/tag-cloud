import { cookies } from "next/headers";
import { getOrCreateViewerId, getViewerId } from "./session";

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

jest.mock("./utils", () => ({
  generateId: jest.fn(() => "generated-viewer-id"),
}));

describe("session", () => {
  const cookiesMock = cookies as jest.MockedFunction<typeof cookies>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns existing viewer id if cookie is already set", async () => {
    const get = jest.fn().mockReturnValue({ value: "existing-viewer-id" });
    const set = jest.fn();
    cookiesMock.mockResolvedValue({ get, set } as never);

    const viewerId = await getOrCreateViewerId();

    expect(viewerId).toBe("existing-viewer-id");
    expect(set).not.toHaveBeenCalled();
  });

  test("creates viewer id and sets cookie when absent", async () => {
    const get = jest.fn().mockReturnValue(undefined);
    const set = jest.fn();
    cookiesMock.mockResolvedValue({ get, set } as never);

    const viewerId = await getOrCreateViewerId();

    expect(viewerId).toBe("generated-viewer-id");
    expect(set).toHaveBeenCalledWith(
      "viewer_id",
      "generated-viewer-id",
      expect.objectContaining({
        httpOnly: true,
        maxAge: 86400,
        path: "/",
        sameSite: "strict",
      }),
    );
  });

  test("getViewerId returns null when cookie is missing", async () => {
    const get = jest.fn().mockReturnValue(undefined);
    cookiesMock.mockResolvedValue({ get } as never);

    await expect(getViewerId()).resolves.toBeNull();
  });
});

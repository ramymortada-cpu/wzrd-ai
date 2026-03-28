import { describe, it, expect, vi, beforeEach } from "vitest";
import { login } from "./api";

describe("login", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("sends correct payload to auth endpoint", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: "tok",
        refresh_token: "ref",
        token_type: "bearer",
      }),
    } as Response);

    const result = await login("demo", "user@test.sa", "pass123");
    expect(result.access_token).toBe("tok");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/v1/auth/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          workspace_slug: "demo",
          email: "user@test.sa",
          password: "pass123",
        }),
      })
    );
  });

  it("throws on invalid credentials", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);
    await expect(login("x", "y", "z")).rejects.toThrow("Invalid credentials");
  });
});

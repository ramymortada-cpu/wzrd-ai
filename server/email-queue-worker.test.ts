import { describe, it, expect, vi } from "vitest";

vi.mock("./db/index", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

import { processEmailQueueOnce } from "./emailQueueWorker";

describe("processEmailQueueOnce", () => {
  it("returns zeros when database is unavailable", async () => {
    const r = await processEmailQueueOnce();
    expect(r).toEqual({ processed: 0, sent: 0, skipped: 0, failed: 0 });
  });
});

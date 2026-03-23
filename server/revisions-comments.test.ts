import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db functions
vi.mock("./db", async () => {
  const actual = await vi.importActual("./db");
  
  // In-memory stores for testing
  let revisions: any[] = [];
  let comments: any[] = [];
  let revisionIdCounter = 1;
  let commentIdCounter = 1;
  
  return {
    ...actual,
    // Revision mocks
    createDeliverableRevision: vi.fn(async (data: any) => {
      const rev = { id: revisionIdCounter++, ...data, createdAt: new Date() };
      revisions.push(rev);
      return rev;
    }),
    getDeliverableRevisions: vi.fn(async (deliverableId: number) => {
      return revisions
        .filter(r => r.deliverableId === deliverableId)
        .sort((a, b) => b.version - a.version);
    }),
    getLatestRevisionVersion: vi.fn(async (deliverableId: number) => {
      const matching = revisions.filter(r => r.deliverableId === deliverableId);
      if (matching.length === 0) return 0;
      return Math.max(...matching.map(r => r.version));
    }),
    // Comment mocks
    createDeliverableComment: vi.fn(async (data: any) => {
      const comment = { id: commentIdCounter++, ...data, isResolved: 0, resolvedAt: null, createdAt: new Date(), updatedAt: new Date() };
      comments.push(comment);
      return comment;
    }),
    getDeliverableComments: vi.fn(async (deliverableId: number) => {
      return comments
        .filter(c => c.deliverableId === deliverableId)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    }),
    resolveDeliverableComment: vi.fn(async (id: number) => {
      const comment = comments.find(c => c.id === id);
      if (comment) {
        comment.isResolved = 1;
        comment.resolvedAt = new Date();
      }
    }),
    deleteDeliverableComment: vi.fn(async (id: number) => {
      comments = comments.filter(c => c.id !== id);
    }),
    // Portal token mock for public endpoints (router hashes token before lookup)
    getPortalTokenByToken: vi.fn(async (token: string) => {
      const { hashToken } = await import("./_core/tokenSecurity");
      const validHash = hashToken("valid-test-token");
      if (token === "valid-test-token" || token === validHash) {
        return {
          id: 1,
          projectId: 100,
          clientId: 200,
          token: "valid-test-token",
          isActive: 1,
          expiresAt: new Date(Date.now() + 86400000),
          lastAccessedAt: null,
          createdAt: new Date(),
        };
      }
      return null;
    }),
    updatePortalToken: vi.fn(async () => {}),
    getDeliverablesByProject: vi.fn(async (projectId: number) => {
      if (projectId === 100) {
        return [
          { id: 1, projectId: 100, title: "Test Deliverable", description: "Test", stage: "design", status: "delivered", content: "Test content", fileUrl: null, imageUrls: null, sortOrder: 0, aiGenerated: 0, qualityScore: null, qualityChecklist: null, reviewNotes: null, fileKey: null, fileType: null, createdAt: new Date(), updatedAt: new Date() },
        ];
      }
      return [];
    }),
  };
});

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("Deliverable Revisions", () => {
  let adminCaller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    adminCaller = appRouter.createCaller(createAdminContext());
  });

  it("creates a revision with auto-incrementing version", async () => {
    const result = await adminCaller.revisions.create({
      deliverableId: 1,
      content: "Initial content",
      changeType: "initial",
      changeSummary: "First version",
      changedBy: "Admin",
    });

    expect(result).toBeDefined();
    expect(result!.deliverableId).toBe(1);
    expect(result!.version).toBeGreaterThan(0);
    expect(result!.changeType).toBe("initial");
    expect(result!.changeSummary).toBe("First version");
    expect(result!.changedBy).toBe("Admin");
  });

  it("creates subsequent revisions with incrementing versions", async () => {
    const rev1 = await adminCaller.revisions.create({
      deliverableId: 2,
      content: "Version 1 content",
      changeType: "initial",
      changeSummary: "First version",
    });

    const rev2 = await adminCaller.revisions.create({
      deliverableId: 2,
      content: "Version 2 content",
      changeType: "manual_edit",
      changeSummary: "Updated content",
    });

    expect(rev2!.version).toBeGreaterThan(rev1!.version);
  });

  it("lists revisions for a deliverable in descending version order", async () => {
    // Create some revisions first
    await adminCaller.revisions.create({
      deliverableId: 3,
      content: "v1",
      changeType: "initial",
    });
    await adminCaller.revisions.create({
      deliverableId: 3,
      content: "v2",
      changeType: "ai_regenerated",
    });

    const revisions = await adminCaller.revisions.list({ deliverableId: 3 });
    expect(revisions).toBeDefined();
    expect(Array.isArray(revisions)).toBe(true);
    // Should be sorted by version descending
    if (revisions.length >= 2) {
      expect(revisions[0].version).toBeGreaterThan(revisions[1].version);
    }
  });

  it("supports all change types", async () => {
    const changeTypes = ["initial", "ai_regenerated", "manual_edit", "client_revision", "quality_update"] as const;
    for (const changeType of changeTypes) {
      const result = await adminCaller.revisions.create({
        deliverableId: 4,
        content: `Content for ${changeType}`,
        changeType,
        changeSummary: `Test ${changeType}`,
      });
      expect(result!.changeType).toBe(changeType);
    }
  });
});

describe("Deliverable Comments (Threaded)", () => {
  let adminCaller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    adminCaller = appRouter.createCaller(createAdminContext());
  });

  it("creates a top-level comment", async () => {
    const result = await adminCaller.comments.create({
      deliverableId: 1,
      comment: "This looks great!",
      authorType: "owner",
      authorName: "Admin User",
    });

    expect(result).toBeDefined();
    expect(result!.comment).toBe("This looks great!");
    expect(result!.authorType).toBe("owner");
    expect(result!.authorName).toBe("Admin User");
    expect(result!.parentId).toBeUndefined();
  });

  it("creates a reply to an existing comment", async () => {
    const parent = await adminCaller.comments.create({
      deliverableId: 5,
      comment: "Please review this section",
      authorType: "owner",
      authorName: "Admin",
    });

    const reply = await adminCaller.comments.create({
      deliverableId: 5,
      parentId: parent!.id,
      comment: "I've reviewed it, looks good",
      authorType: "team",
      authorName: "Team Member",
    });

    expect(reply!.parentId).toBe(parent!.id);
  });

  it("lists comments with threaded structure", async () => {
    const threads = await adminCaller.comments.list({ deliverableId: 5 });
    expect(threads).toBeDefined();
    expect(Array.isArray(threads)).toBe(true);
    // Each thread should have a replies array
    for (const thread of threads) {
      expect(thread).toHaveProperty("replies");
      expect(Array.isArray(thread.replies)).toBe(true);
    }
  });

  it("resolves a comment thread", async () => {
    const comment = await adminCaller.comments.create({
      deliverableId: 6,
      comment: "Fix the spacing here",
      authorType: "owner",
      authorName: "Admin",
    });

    const result = await adminCaller.comments.resolve({ id: comment!.id });
    expect(result).toEqual({ success: true });
  });

  it("deletes a comment", async () => {
    const comment = await adminCaller.comments.create({
      deliverableId: 7,
      comment: "Temporary comment",
      authorType: "owner",
      authorName: "Admin",
    });

    const result = await adminCaller.comments.delete({ id: comment!.id });
    expect(result).toEqual({ success: true });
  });

  it("supports version-linked comments", async () => {
    const result = await adminCaller.comments.create({
      deliverableId: 1,
      comment: "This version needs work",
      authorType: "owner",
      authorName: "Admin",
      version: 3,
    });

    expect(result!.version).toBe(3);
  });
});

describe("Public Portal - Revisions", () => {
  let publicCaller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    publicCaller = appRouter.createCaller(createPublicContext());
  });

  it("returns revisions for valid token and deliverable", async () => {
    const revisions = await publicCaller.revisions.publicList({
      token: "valid-test-token",
      deliverableId: 1,
    });
    expect(revisions).toBeDefined();
    expect(Array.isArray(revisions)).toBe(true);
  });

  it("rejects invalid portal token", async () => {
    await expect(
      publicCaller.revisions.publicList({
        token: "invalid-token",
        deliverableId: 1,
      })
    ).rejects.toThrow("Invalid or expired portal link");
  });

  it("rejects deliverable not in project", async () => {
    await expect(
      publicCaller.revisions.publicList({
        token: "valid-test-token",
        deliverableId: 999,
      })
    ).rejects.toThrow("Deliverable not found in this project");
  });
});

describe("Public Portal - Comments", () => {
  let publicCaller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    publicCaller = appRouter.createCaller(createPublicContext());
  });

  it("returns comments for valid token and deliverable", async () => {
    const comments = await publicCaller.comments.publicList({
      token: "valid-test-token",
      deliverableId: 1,
    });
    expect(comments).toBeDefined();
    expect(Array.isArray(comments)).toBe(true);
  });

  it("allows client to post a comment via portal", async () => {
    const result = await publicCaller.comments.publicCreate({
      token: "valid-test-token",
      deliverableId: 1,
      comment: "Client feedback here",
      authorName: "Client Name",
    });

    expect(result).toBeDefined();
    expect(result!.authorType).toBe("client");
    expect(result!.authorName).toBe("Client Name");
  });

  it("allows client to reply to a comment via portal", async () => {
    // First create a comment
    const parent = await publicCaller.comments.publicCreate({
      token: "valid-test-token",
      deliverableId: 1,
      comment: "Initial question",
      authorName: "Client",
    });

    const reply = await publicCaller.comments.publicCreate({
      token: "valid-test-token",
      deliverableId: 1,
      parentId: parent!.id,
      comment: "Follow-up reply",
      authorName: "Client",
    });

    expect(reply!.parentId).toBe(parent!.id);
  });

  it("rejects client comment with invalid token", async () => {
    await expect(
      publicCaller.comments.publicCreate({
        token: "invalid-token",
        deliverableId: 1,
        comment: "Should fail",
        authorName: "Client",
      })
    ).rejects.toThrow("Invalid or expired portal link");
  });
});

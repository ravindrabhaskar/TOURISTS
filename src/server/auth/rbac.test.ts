import { describe, expect, it } from "vitest";
import { can } from "./rbac";

describe("can()", () => {
  it("grants SUPER_ADMIN everything implicitly", () => {
    for (const permission of ["cms.publish", "users.manage", "audit.read"] as const) {
      expect(can("SUPER_ADMIN", permission)).toBe(true);
    }
  });

  it("denies tourists staff permissions", () => {
    expect(can("TOURIST", "admin.dashboard")).toBe(false);
    expect(can("TOURIST", "moderation.reviews")).toBe(false);
    expect(can(undefined, "cms.write")).toBe(false);
    expect(can(null, "catalog.write")).toBe(false);
  });

  it("scopes moderator access to moderation only", () => {
    expect(can("MODERATOR", "moderation.reviews")).toBe(true);
    expect(can("MODERATOR", "admin.dashboard")).toBe(true);
    expect(can("MODERATOR", "cms.publish")).toBe(false);
    expect(can("MODERATOR", "partners.approve")).toBe(false);
  });

  it("lets editors write but not publish content", () => {
    expect(can("EDITOR", "cms.write")).toBe(true);
    expect(can("EDITOR", "cms.publish")).toBe(false);
  });

  it("keeps district admins scoped to alerts", () => {
    expect(can("DISTRICT_ADMIN", "alerts.manage")).toBe(true);
    expect(can("DISTRICT_ADMIN", "stays.verify")).toBe(false);
  });
});

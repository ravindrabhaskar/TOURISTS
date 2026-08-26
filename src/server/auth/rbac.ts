export const ROLES = [
  "TOURIST",
  "PARTNER",
  "EDITOR",
  "MODERATOR",
  "DISTRICT_ADMIN",
  "TOURISM_ADMIN",
  "SUPER_ADMIN",
] as const;

export type Role = (typeof ROLES)[number];

export const PERMISSIONS = {
  "cms.write": ["EDITOR", "TOURISM_ADMIN", "SUPER_ADMIN"],
  "cms.publish": ["TOURISM_ADMIN", "SUPER_ADMIN"],
  "moderation.reviews": ["MODERATOR", "TOURISM_ADMIN", "SUPER_ADMIN"],
  "catalog.write": ["EDITOR", "TOURISM_ADMIN", "SUPER_ADMIN"],
  "partners.approve": ["TOURISM_ADMIN", "SUPER_ADMIN"],
  "stays.verify": ["TOURISM_ADMIN", "SUPER_ADMIN"],
  "users.manage": ["TOURISM_ADMIN", "SUPER_ADMIN"],
  "alerts.manage": ["DISTRICT_ADMIN", "TOURISM_ADMIN", "SUPER_ADMIN"],
  "admin.dashboard": [
    "MODERATOR",
    "EDITOR",
    "DISTRICT_ADMIN",
    "TOURISM_ADMIN",
    "SUPER_ADMIN",
  ],
  "config.write": ["TOURISM_ADMIN", "SUPER_ADMIN"],
  "audit.read": ["TOURISM_ADMIN", "SUPER_ADMIN"],
  "ai.usage.read": ["TOURISM_ADMIN", "SUPER_ADMIN"],
  "partner.portal": ["PARTNER", "TOURISM_ADMIN", "SUPER_ADMIN"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  if (role === "SUPER_ADMIN") return true;
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

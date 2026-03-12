import type { MembershipRole, PlatformRole } from "@prisma/client";

const roleRank: Record<MembershipRole, number> = {
  OWNER: 4,
  MANAGER: 3,
  DESIGNER: 2,
  DRIVER: 1,
  STAFF: 0,
};

export function hasPlatformAdminAccess(platformRole: PlatformRole) {
  return platformRole === "PLATFORM_ADMIN";
}

export function hasMinimumMembershipRole(
  role: MembershipRole | null | undefined,
  minimumRole: MembershipRole,
) {
  if (!role) {
    return false;
  }

  return roleRank[role] >= roleRank[minimumRole];
}

export function canManageShop(platformRole: PlatformRole, role: MembershipRole | null | undefined) {
  return hasPlatformAdminAccess(platformRole) || hasMinimumMembershipRole(role, "MANAGER");
}

export function canManageOrders(platformRole: PlatformRole, role: MembershipRole | null | undefined) {
  return hasPlatformAdminAccess(platformRole) || hasMinimumMembershipRole(role, "DESIGNER");
}

export function canHandleDeliveries(platformRole: PlatformRole, role: MembershipRole | null | undefined) {
  return hasPlatformAdminAccess(platformRole) || hasMinimumMembershipRole(role, "DRIVER");
}

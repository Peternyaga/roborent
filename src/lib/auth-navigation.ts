type UserRole = "CLIENT" | "OWNER" | "ADMIN";

export function dashboardPathForRoles(roles: UserRole[] | string[]) {
  if (roles.includes("OWNER") || roles.includes("ADMIN")) {
    return "/dashboard/owner";
  }

  return "/dashboard/client";
}

export function loginPath(nextPath: string) {
  return `/auth/login?next=${encodeURIComponent(nextPath)}`;
}

export function isSafeRedirectPath(value: string | undefined): value is string {
  return Boolean(
    value &&
      value.startsWith("/") &&
      !value.startsWith("//") &&
      !value.startsWith("/auth/"),
  );
}

export function safeRedirectPath(value: string | string[] | undefined, fallback: string) {
  const nextPath = Array.isArray(value) ? value[0] : value;

  if (!isSafeRedirectPath(nextPath)) {
    return fallback;
  }

  return nextPath;
}

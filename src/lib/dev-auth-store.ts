type DevUserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  avatarUrl: string | null;
  roles: ("CLIENT" | "OWNER" | "ADMIN")[];
  verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  identityDocumentUrl: string | null;
  preferredCurrency: string;
  createdAt: Date;
};

const globalForDevAuth = globalThis as unknown as {
  roborentDevUsers?: Map<string, DevUserRecord>;
};

function users() {
  if (!globalForDevAuth.roborentDevUsers) {
    globalForDevAuth.roborentDevUsers = new Map();
  }

  return globalForDevAuth.roborentDevUsers;
}

export function shouldUseDevAuthStore() {
  return process.env.NODE_ENV !== "production" && !process.env.DATABASE_URL;
}

export function findDevUserByEmail(email: string) {
  const normalizedEmail = email.toLowerCase();

  return Array.from(users().values()).find((user) => user.email === normalizedEmail) ?? null;
}

export function findDevUserById(id: string) {
  return users().get(id) ?? null;
}

export function createDevUser(input: {
  email: string;
  fullName: string;
  passwordHash: string;
  roles: ("CLIENT" | "OWNER")[];
}) {
  const normalizedEmail = input.email.toLowerCase();

  if (findDevUserByEmail(normalizedEmail)) {
    return null;
  }

  const user: DevUserRecord = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    passwordHash: input.passwordHash,
    fullName: input.fullName,
    avatarUrl: null,
    roles: input.roles,
    verificationStatus: "UNVERIFIED",
    identityDocumentUrl: null,
    preferredCurrency: "USD",
    createdAt: new Date(),
  };

  users().set(user.id, user);

  return user;
}

export function updateDevUserIdentity(id: string, identityDocumentUrl: string) {
  const user = users().get(id);

  if (!user) {
    return null;
  }

  user.identityDocumentUrl = identityDocumentUrl;
  user.verificationStatus = "PENDING";
  users().set(id, user);

  return user;
}

export function serializeDevUser(user: DevUserRecord) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    roles: user.roles,
    verificationStatus: user.verificationStatus,
    identityDocumentUrl: user.identityDocumentUrl,
    preferredCurrency: user.preferredCurrency,
    createdAt: user.createdAt,
  };
}

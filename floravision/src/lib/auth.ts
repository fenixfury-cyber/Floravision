import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionSecret } from "@/lib/env";

const SESSION_COOKIE = "floravision_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

type SessionPayload = {
  userId: string;
  expiresAt: number;
};

export type CurrentSession = Awaited<ReturnType<typeof getCurrentSession>>;
export type ShopSession = NonNullable<CurrentSession>;
export type ShopMembership = ShopSession["user"]["memberships"][number];

function base64url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function encodeSession(payload: SessionPayload) {
  const encodedPayload = base64url(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function decodeSession(token: string): SessionPayload | null {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  const isValid =
    signature.length === expectedSignature.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

  if (!isValid) {
    return null;
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as SessionPayload;

  if (payload.expiresAt < Date.now()) {
    return null;
  }

  return payload;
}

export function createPasswordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, passwordHash: string) {
  const [salt, storedHash] = passwordHash.split(":");

  if (!salt || !storedHash) {
    return false;
  }

  const computedHash = scryptSync(password, salt, 64).toString("hex");

  return (
    storedHash.length === computedHash.length &&
    timingSafeEqual(Buffer.from(storedHash), Buffer.from(computedHash))
  );
}

export async function createUserSession(userId: string) {
  const cookieStore = await cookies();
  const token = encodeSession({
    userId,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearUserSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const payload = decodeSession(token);

  if (!payload) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      memberships: {
        include: {
          shop: true,
          staffMember: true,
        },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!user) {
    return null;
  }

  return {
    user,
    defaultMembership: user.memberships[0] ?? null,
  };
}

export async function requireCurrentSession() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/");
  }

  return session;
}

export async function requireShopAccess(shopSlug: string) {
  const session = await requireCurrentSession();

  if (session.user.platformRole === "PLATFORM_ADMIN") {
    return session;
  }

  const membership = session.user.memberships.find((entry: ShopMembership) => entry.shop.slug === shopSlug);

  if (!membership) {
    redirect("/");
  }

  return {
    ...session,
    membership,
  };
}

export function getMembershipForShop(access: ShopSession, shopSlug: string) {
  return access.user.memberships.find((entry: ShopMembership) => entry.shop.slug === shopSlug) ?? null;
}

import prisma from "./prisma";
import { Prisma, VerificationEntity } from "../../prisma/output/prismaclient";

export type FieldDiff = { oldValue: unknown; newValue: unknown };
export type ChangeDiff = Record<string, FieldDiff>;

const deepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (typeof a === "object" && typeof b === "object") {
    const ka = Object.keys(a as object);
    const kb = Object.keys(b as object);
    if (ka.length !== kb.length) return false;
    return ka.every((k) => deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
  }
  return false;
};

/**
 * Compute a diff of verification-required fields between current and incoming values.
 * Returns only fields that actually changed.
 */
export const computeDiff = (
  current: Record<string, unknown>,
  incoming: Record<string, unknown>,
  fields: string[]
): ChangeDiff => {
  const diff: ChangeDiff = {};
  for (const f of fields) {
    if (!(f in incoming)) continue;
    const oldV = current[f] ?? null;
    const newV = incoming[f] ?? null;
    if (!deepEqual(oldV, newV)) {
      diff[f] = { oldValue: oldV, newValue: newV };
    }
  }
  return diff;
};

/**
 * Upsert a pending verification request for a given entity.
 * One PENDING row per (userId, entityType, entityId) is maintained â€” new diff is merged into it.
 * Passing an empty diff with an existing pending row will delete that row (student reverted changes).
 */
export const upsertVerificationRequest = async (params: {
  userId: number;
  entityType: VerificationEntity;
  entityId?: string | null;
  diff: ChangeDiff;
}): Promise<{ id: string | null; pendingCount: number }> => {
  const { userId, entityType, entityId = null, diff } = params;

  const existing = await prisma.verificationRequest.findFirst({
    where: {
      userId,
      entityType,
      entityId: entityId ?? null,
      status: "PENDING",
    },
  });

  if (Object.keys(diff).length === 0) {
    if (existing) {
      await prisma.verificationRequest.delete({ where: { id: existing.id } });
    }
    return { id: null, pendingCount: 0 };
  }

  if (existing) {
    const merged = { ...((existing.changes as ChangeDiff) ?? {}), ...diff };
    const updated = await prisma.verificationRequest.update({
      where: { id: existing.id },
      data: {
        changes: merged as unknown as Prisma.InputJsonValue,
        reviewedById: null,
        remarks: null,
        reviewedAt: null,
      },
    });
    return { id: updated.id, pendingCount: Object.keys(merged).length };
  }

  const created = await prisma.verificationRequest.create({
    data: {
      userId,
      entityType,
      entityId,
      changes: diff as unknown as Prisma.InputJsonValue,
      status: "PENDING",
    },
  });
  return { id: created.id, pendingCount: Object.keys(diff).length };
};

export const getPendingVerification = async (
  userId: number,
  entityType: VerificationEntity,
  entityId?: string | null
) => {
  return prisma.verificationRequest.findFirst({
    where: {
      userId,
      entityType,
      entityId: entityId ?? null,
      status: "PENDING",
    },
    select: {
      id: true,
      changes: true,
      entityType: true,
      entityId: true,
      status: true,
      createdAt: true,
    },
  });
};

export const cancelVerification = async (params: {
  requestId: string;
  userId: number;
}): Promise<boolean> => {
  const existing = await prisma.verificationRequest.findFirst({
    where: { id: params.requestId, userId: params.userId, status: "PENDING" },
  });
  if (!existing) return false;
  await prisma.verificationRequest.delete({ where: { id: existing.id } });
  return true;
};

export const PROFILE_VERIFICATION_FIELDS = [
  "fullName",
  "legalName",
  "studentId",
  "department",
  "academicYear",
] as const;

export const PROFILE_DIRECT_FIELDS = [
  "contactNo",
  "parentsContactNo",
  "skills",
  "socialProfile",
  "profilePic",
  "resumeUrl",
] as const;

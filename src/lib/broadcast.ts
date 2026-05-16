import { Resend } from "resend";
import prisma from "./prisma";
import logger from "@/lib/logger";
import { BroadcastType } from "../../prisma/output/prismaclient";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "TPO Vishwaniketan <noreply@example.com>";

const BATCH_SIZE = 100;
const BATCH_DELAY_MS = 350; // ~3 batches/sec (under Resend's 5/sec limit)
const MAX_RETRIES_PER_CHUNK = 3;

interface EnqueueArgs {
  type: BroadcastType;
  subject: string;
  htmlBody: string;
  recipientIds: number[];
  createdById?: number;
}

interface Failure {
  userId: number;
  email: string;
  error: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const chunk = <T>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
};

export const enqueueBroadcast = async (args: EnqueueArgs): Promise<string> => {
  if (args.recipientIds.length === 0) {
    logger.info({ type: args.type }, "Broadcast skipped - no recipients");
    return "";
  }

  const job = await prisma.broadcastJob.create({
    data: {
      type: args.type,
      subject: args.subject,
      htmlBody: args.htmlBody,
      recipientIds: args.recipientIds,
      totalCount: args.recipientIds.length,
      createdById: args.createdById,
      status: "PENDING",
    },
  });

  // Fire-and-forget; do not await
  processBroadcast(job.id).catch((err) => {
    logger.error({ err, jobId: job.id }, "Broadcast processing threw");
  });

  return job.id;
};

const processBroadcast = async (jobId: string): Promise<void> => {
  const job = await prisma.broadcastJob.findUnique({ where: { id: jobId } });
  if (!job || job.status !== "PENDING") return;

  await prisma.broadcastJob.update({
    where: { id: jobId },
    data: { status: "PROCESSING", startedAt: new Date(), attempts: { increment: 1 } },
  });

  const recipients = await prisma.user.findMany({
    where: { id: { in: job.recipientIds } },
    select: { id: true, emailId: true, fullName: true },
  });

  const emailMap = new Map(recipients.map((r) => [r.id, r]));
  const chunks = chunk(job.recipientIds, BATCH_SIZE);

  let sentCount = 0;
  let failedCount = 0;
  const failures: Failure[] = [];

  for (const chunkIds of chunks) {
    const emails = chunkIds
      .map((id) => emailMap.get(id))
      .filter((r): r is { id: number; emailId: string; fullName: string } => !!r)
      .map((r) => ({
        from: FROM_EMAIL,
        to: r.emailId,
        subject: job.subject,
        html: job.htmlBody.replace(/\{\{fullName\}\}/g, r.fullName),
      }));

    let chunkSuccess = false;
    let lastErr: string | undefined;

    for (let attempt = 1; attempt <= MAX_RETRIES_PER_CHUNK; attempt++) {
      try {
        const { data, error } = await resend.batch.send(emails);
        if (error) {
          lastErr = JSON.stringify(error);
          logger.warn({ error, attempt, jobId }, "Batch send error, retrying");
          await sleep(500 * attempt);
          continue;
        }
        sentCount += emails.length;
        chunkSuccess = true;
        logger.info({ jobId, chunkSize: emails.length, batchId: data }, "Chunk sent");
        break;
      } catch (err: any) {
        lastErr = err?.message || String(err);
        logger.warn({ err, attempt, jobId }, "Batch send threw, retrying");
        await sleep(500 * attempt);
      }
    }

    if (!chunkSuccess) {
      failedCount += emails.length;
      for (const id of chunkIds) {
        const r = emailMap.get(id);
        if (r) {
          failures.push({ userId: r.id, email: r.emailId, error: lastErr ?? "unknown" });
        }
      }
    }

    // Live progress update
    await prisma.broadcastJob.update({
      where: { id: jobId },
      data: { sentCount, failedCount, failures: failures as any },
    });

    await sleep(BATCH_DELAY_MS);
  }

  const finalStatus = failedCount === 0 ? "COMPLETED" : sentCount === 0 ? "FAILED" : "PARTIAL";

  await prisma.broadcastJob.update({
    where: { id: jobId },
    data: {
      status: finalStatus,
      sentCount,
      failedCount,
      failures: failures as any,
      completedAt: new Date(),
      lastError: failures[0]?.error,
    },
  });

  logger.info({ jobId, sentCount, failedCount, status: finalStatus }, "Broadcast completed");
};

import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { LEARNING_ERROR_MESSAGES } from "./portal-read";

export const LEARNING_READ_VERSION = "bd-learning-read.v1";
export function learningRequestId() { return randomUUID(); }

/** Log allowlisted diagnostics only: no Error objects, URLs, body text or driver data. */
export function learningDiagnostic(error: unknown, stage: string, requestId: string, fallback = "LEARNING_UNAVAILABLE") {
  const value = error !== null && typeof error === "object" ? error as Record<string, unknown> : {};
  const code = typeof value.code === "string" && LEARNING_ERROR_MESSAGES[value.code] ? value.code : fallback;
  const safeIdentifier = (input: unknown) => typeof input === "string" && /^[a-zA-Z0-9_]{1,80}$/.test(input) ? input : undefined;
  const result = {
    version: LEARNING_READ_VERSION, requestId, stage, code,
    operation: safeIdentifier(value.operation),
    httpStatus: typeof value.httpStatus === "number" ? value.httpStatus : undefined,
    exception: safeIdentifier(value.exception), errorcode: safeIdentifier(value.errorcode),
  };
  console.error("[BD_LEARNING_READ]", result);
  return { code, requestId, version: LEARNING_READ_VERSION };
}

export function learningFailure(error: unknown, stage: string, requestId: string, status = 502, fallback = "LEARNING_UNAVAILABLE") {
  const details = learningDiagnostic(error, stage, requestId, fallback);
  return NextResponse.json({ error: LEARNING_ERROR_MESSAGES[details.code] || LEARNING_ERROR_MESSAGES.LEARNING_UNAVAILABLE, ...details }, { status, headers: { "Cache-Control": "private, no-store" } });
}

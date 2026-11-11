/** Safe failures for critical Moodle reads. Never retain upstream messages or URLs. */
export type MoodleReadErrorCode =
  | "MOODLE_CONFIG"
  | "MOODLE_COURSE_CONFIG"
  | "MOODLE_HTTP"
  | "MOODLE_TIMEOUT"
  | "MOODLE_NETWORK"
  | "MOODLE_JSON"
  | "MOODLE_PAYLOAD"
  | "MOODLE_ACCESS";

function safeShortCode(value: unknown): string | undefined {
  return typeof value === "string" && /^[a-z][a-z0-9_]{0,63}$/i.test(value)
    ? value
    : undefined;
}

export class MoodleReadError extends Error {
  readonly code: MoodleReadErrorCode;
  readonly operation: string;
  readonly httpStatus?: number;
  readonly exception?: string;
  readonly errorcode?: string;

  constructor(
    code: MoodleReadErrorCode,
    operation: string,
    details: { httpStatus?: number; exception?: unknown; errorcode?: unknown } = {}
  ) {
    super(`Moodle read failed (${code}).`);
    this.name = "MoodleReadError";
    this.code = code;
    this.operation = safeShortCode(operation) ?? "moodle_read";
    if (Number.isInteger(details.httpStatus) && details.httpStatus! >= 100 && details.httpStatus! <= 599) {
      this.httpStatus = details.httpStatus;
    }
    this.exception = safeShortCode(details.exception);
    this.errorcode = safeShortCode(details.errorcode);
  }
}

export const MOODLE_CRITICAL_READ_TIMEOUT_MS = 8000;
export const MOODLE_OPTIONAL_READ_TIMEOUT_MS = 1500;
export const MOODLE_OPTIONAL_BODY_LIMIT_BYTES = 512 * 1024;

/** Do not await stream cancellation: even a broken optional source must be bounded. */
function cancelReader(reader: ReadableStreamDefaultReader<Uint8Array>) {
  void reader.cancel().catch(() => undefined);
}

async function boundedText(response: Response, operation: string, signal: AbortSignal): Promise<string> {
  const length = Number(response.headers.get("content-length"));
  if (Number.isFinite(length) && length > MOODLE_OPTIONAL_BODY_LIMIT_BYTES) {
    throw new MoodleReadError("MOODLE_PAYLOAD", operation);
  }
  if (!response.body) return "";
  const reader = response.body.getReader();
  const onAbort = () => cancelReader(reader);
  signal.addEventListener("abort", onAbort, { once: true });
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  try {
    if (signal.aborted) throw new MoodleReadError("MOODLE_TIMEOUT", operation);
    while (true) {
      const { done, value } = await reader.read();
      if (signal.aborted) throw new MoodleReadError("MOODLE_TIMEOUT", operation);
      if (done) return text + decoder.decode();
      bytes += value.byteLength;
      if (bytes > MOODLE_OPTIONAL_BODY_LIMIT_BYTES) {
        cancelReader(reader);
        throw new MoodleReadError("MOODLE_PAYLOAD", operation);
      }
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    signal.removeEventListener("abort", onAbort);
    reader.releaseLock();
  }
}

async function read(
  url: string,
  operation: string,
  format: "json" | "text",
  timeoutMs: number
): Promise<unknown> {
  const controller = new AbortController();
  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      timedOut = true;
      // Actually terminate fetch/body IO, not merely stop awaiting it.
      controller.abort();
      reject(new MoodleReadError("MOODLE_TIMEOUT", operation));
    }, timeoutMs);
  });
  const request = (async () => {
    // Authenticated redirects are never followed to another host.
    const response = await fetch(url, { signal: controller.signal, redirect: "manual" });
    if (!response.ok) {
      controller.abort();
      throw new MoodleReadError("MOODLE_HTTP", operation, { httpStatus: response.status });
    }
    if (format === "text") return boundedText(response, operation, controller.signal);
    // The deadline remains active through the entire response body, not just headers.
    const text = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      throw new MoodleReadError("MOODLE_JSON", operation);
    }
    if (data && typeof data === "object" && !Array.isArray(data)) {
      const envelope = data as Record<string, unknown>;
      if ("exception" in envelope || "errorcode" in envelope) {
        throw new MoodleReadError("MOODLE_ACCESS", operation, {
          exception: envelope.exception,
          errorcode: envelope.errorcode,
        });
      }
    }
    return data;
  })();
  try {
    return await Promise.race([request, deadline]);
  } catch (error) {
    if (timedOut) throw new MoodleReadError("MOODLE_TIMEOUT", operation);
    // Cancel any unread/oversized body. Never expose the original exception/cause.
    controller.abort();
    if (error instanceof MoodleReadError) throw error;
    throw new MoodleReadError("MOODLE_NETWORK", operation);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

/** Critical reads have a fixed 8-second budget; no runtime environment override. */
export function moodleReadJson(url: string, operation: string): Promise<unknown> {
  return read(url, operation, "json", MOODLE_CRITICAL_READ_TIMEOUT_MS);
}

/** Optional HTML has a fixed production budget; tests can explicitly shorten it. */
export async function moodleReadOptionalText(
  url: string,
  operation = "moodle_optional_html",
  timeoutMs = MOODLE_OPTIONAL_READ_TIMEOUT_MS
): Promise<string> {
  const budget = Number.isFinite(timeoutMs) && timeoutMs > 0
    ? Math.min(timeoutMs, MOODLE_OPTIONAL_READ_TIMEOUT_MS)
    : MOODLE_OPTIONAL_READ_TIMEOUT_MS;
  return await read(url, operation, "text", budget) as string;
}

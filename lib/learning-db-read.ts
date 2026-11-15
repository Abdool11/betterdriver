/** Bound read-only PostgREST queries; callers retain all existing scope filters. */
export async function learningDbRead<T>(query: (signal: AbortSignal) => PromiseLike<T>): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error("Learning database read timed out."));
      controller.abort();
    }, 8000);
  });
  try { return await Promise.race([Promise.resolve(query(controller.signal)), deadline]); }
  finally { if (timer) clearTimeout(timer); controller.abort(); }
}

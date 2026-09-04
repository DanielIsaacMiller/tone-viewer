export function onceAsync<T>(fn: () => Promise<T>): () => Promise<T> {
  let promise: Promise<T> | null = null
  return () => {
    if (!promise) {
      promise = fn().catch((error: unknown) => {
        promise = null
        throw error
      })
    }
    return promise
  }
}

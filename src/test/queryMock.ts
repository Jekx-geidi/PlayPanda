import { vi } from 'vitest'

export interface QueryCall {
  method: string
  args: unknown[]
}

/**
 * A chainable stand-in for a supabase-js query builder. Every builder method
 * records itself and returns the chain; awaiting the chain (or calling
 * single/maybeSingle) resolves to `result`. `calls` lets tests assert on the
 * exact filters and payloads a service sent.
 */
export function queryMock(result: { data?: unknown; error?: unknown }) {
  const calls: QueryCall[] = []
  const resolved = { data: result.data ?? null, error: result.error ?? null }
  const chain: Record<string, unknown> = {}
  for (const method of ['select', 'insert', 'update', 'delete', 'eq', 'order']) {
    chain[method] = vi.fn((...args: unknown[]) => {
      calls.push({ method, args })
      return chain
    })
  }
  for (const method of ['single', 'maybeSingle']) {
    chain[method] = vi.fn((...args: unknown[]) => {
      calls.push({ method, args })
      return Promise.resolve(resolved)
    })
  }
  chain.then = (onFulfilled: (value: typeof resolved) => unknown, onRejected?: (e: unknown) => unknown) =>
    Promise.resolve(resolved).then(onFulfilled, onRejected)
  return { chain, calls }
}

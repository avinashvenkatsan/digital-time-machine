import type { ArchiveResult, Snapshot } from '../types'
import { normalizeWebsiteUrl } from '../utils/url'

const CDX_ENDPOINT = 'https://web.archive.org/cdx/search/cdx'
const cache = new Map<string, Promise<ArchiveResult>>()

/**
 * Searches the Internet Archive CDX index. Results are real API responses,
 * not generated sample dates. The API may be unavailable or rate limited.
 */
export async function searchSnapshots(input: string, forceRefresh = false): Promise<ArchiveResult> {
  const normalizedUrl = normalizeWebsiteUrl(input)
  const cacheKey = normalizedUrl.toLowerCase()
  if (!forceRefresh && cache.has(cacheKey)) return cache.get(cacheKey)!

  const request = (async () => {
    const query = new URLSearchParams({
      url: normalizedUrl,
      output: 'json',
      fl: 'timestamp,original,statuscode,digest,length',
      filter: 'statuscode:200',
      collapse: 'timestamp:4',
      from: '1990',
      to: String(new Date().getFullYear()),
      limit: '5000',
    })
    const endpoint = `${CDX_ENDPOINT}?${query.toString()}`
    let response: Response
    try {
      response = await fetch(endpoint, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
      })
    } catch {
      throw new Error('Could not reach the Internet Archive. Check your connection and try again.')
    }

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('The Internet Archive is receiving too many requests. Wait a moment and retry.')
      }
      throw new Error(`The Internet Archive returned an error (${response.status}). Please retry later.`)
    }

    let rows: unknown
    try {
      rows = await response.json()
    } catch {
      throw new Error('The archive returned an unreadable response. Please retry.')
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return { url: input, normalizedUrl, snapshots: [] }
    }

    const snapshots: Snapshot[] = []
    for (const row of rows.slice(1)) {
      if (!Array.isArray(row) || typeof row[0] !== 'string' || !/^\d{14}$/.test(row[0])) continue
      snapshots.push({
        timestamp: row[0],
        original: typeof row[1] === 'string' ? row[1] : normalizedUrl,
        status: typeof row[2] === 'string' ? row[2] : '200',
        digest: typeof row[3] === 'string' ? row[3] : undefined,
        length: typeof row[4] === 'string' ? row[4] : undefined,
      })
    }
    snapshots.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    return { url: input, normalizedUrl, snapshots }
  })()

  cache.set(cacheKey, request)
  try {
    return await request
  } catch (error) {
    cache.delete(cacheKey)
    throw error
  }
}

export function archiveUrl(snapshot: Snapshot, originalUrl?: string): string {
  const target = originalUrl ?? snapshot.original
  return `https://web.archive.org/web/${snapshot.timestamp}/${target}`
}

export function clearSnapshotCache(): void {
  cache.clear()
}
export interface Snapshot {
  timestamp: string
  original: string
  status: string
  digest?: string
  length?: string
}

export interface ArchiveResult {
  url: string
  normalizedUrl: string
  snapshots: Snapshot[]
}

export interface WebsiteItem {
  name: string
  domain: string
  category: string
  description: string
}
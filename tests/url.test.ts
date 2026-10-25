import { describe, expect, it } from 'vitest'
import { formatTimestamp, getDomain, normalizeWebsiteUrl, yearFromTimestamp } from '../src/utils/url'

describe('normalizeWebsiteUrl', () => {
  it('adds HTTPS to a bare domain', () => {
    expect(normalizeWebsiteUrl('example.com')).toBe('https://example.com')
  })
  it('preserves an HTTP scheme and path', () => {
    expect(normalizeWebsiteUrl('http://example.com/about')).toBe('http://example.com/about')
  })
  it('rejects non-HTTP protocols', () => {
    expect(() => normalizeWebsiteUrl('javascript:alert(1)')).toThrow('Only HTTP and HTTPS')
  })
  it('rejects blank values', () => {
    expect(() => normalizeWebsiteUrl('  ')).toThrow('Enter a website URL')
  })
  it('removes URL fragments', () => {
    expect(normalizeWebsiteUrl('https://example.com/page#section')).toBe('https://example.com/page')
  })
})

describe('date utilities', () => {
  it('formats CDX timestamps', () => {
    expect(formatTimestamp('20000102123456')).not.toBe('20000102123456')
  })
  it('gets the year', () => {
    expect(yearFromTimestamp('20000102123456')).toBe('2000')
  })
  it('extracts a domain without www', () => {
    expect(getDomain('https://www.example.com/path')).toBe('example.com')
  })
})
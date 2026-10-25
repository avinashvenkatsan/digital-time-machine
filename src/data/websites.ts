import type { WebsiteItem } from '../types'

export const featuredWebsites: WebsiteItem[] = [
  { name: 'Google', domain: 'google.com', category: 'Search Engines', description: 'The evolution of the world’s most visited search experience.' },
  { name: 'YouTube', domain: 'youtube.com', category: 'Video & Entertainment', description: 'From a simple video-sharing site to a global media platform.' },
  { name: 'Wikipedia', domain: 'wikipedia.org', category: 'Education', description: 'Explore the changing face of the free online encyclopedia.' },
  { name: 'Amazon', domain: 'amazon.com', category: 'Shopping & E-commerce', description: 'Trace the transformation from online bookstore to marketplace.' },
  { name: 'Apple', domain: 'apple.com', category: 'Technology Brands', description: 'See how product storytelling and brand design evolved.' },
  { name: 'BBC', domain: 'bbc.com', category: 'News & Media', description: 'Discover how digital journalism changed across decades.' },
  { name: 'NASA', domain: 'nasa.gov', category: 'Government Websites', description: 'Browse the history of a leading public science website.' },
  { name: 'GitHub', domain: 'github.com', category: 'Technology Brands', description: 'Explore the evolution of tools for software developers.' },
  { name: 'Reddit', domain: 'reddit.com', category: 'Social Media', description: 'See the changing design of community-driven discussions.' },
  { name: 'Steam', domain: 'steampowered.com', category: 'Gaming', description: 'Travel through the history of PC gaming storefronts.' },
  { name: 'MIT', domain: 'mit.edu', category: 'Education', description: 'Explore an academic institution’s changing web presence.' },
  { name: 'The Guardian', domain: 'theguardian.com', category: 'News & Media', description: 'Follow the evolution of digital news presentation.' },
]

export const categories = [
  'All websites', 'Search Engines', 'Social Media', 'Video & Entertainment',
  'Shopping & E-commerce', 'News & Media', 'Education', 'Technology Brands',
  'Government Websites', 'Gaming', 'Personal Websites and Blogs',
]
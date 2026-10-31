import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site'

// Search engines may index the public pages; AI training crawlers may not take anything
const AI_CRAWLERS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'Google-Extended',
  'CCBot',
  'anthropic-ai',
  'ClaudeBot',
  'Claude-Web',
  'PerplexityBot',
  'Bytespider',
  'Applebot-Extended',
  'meta-externalagent',
  'FacebookBot',
  'Diffbot',
  'Omgilibot',
  'cohere-ai',
  'ImagesiftBot',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, disallow: '/' })),
      // Members' photos and videos aren't for search results either
      { userAgent: '*', allow: '/', disallow: ['/api/', '/admin', '/chat', '/settings', '/wallet'] },
    ],
    sitemap: undefined,
    host: siteUrl(),
  }
}

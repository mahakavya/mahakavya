# Mahakavya Developer API Documentation

## Getting Started

The Mahakavya API allows developers to build applications that integrate with the Mahakavya platform.

### Installation

\`\`\`bash
npm install @mahakavya/sdk
\`\`\`

### Quick Start

\`\`\`typescript
import { MahakavyaSDK } from '@mahakavya/sdk'

const sdk = new MahakavyaSDK({
  apiKey: process.env.MAHAKAVYA_API_KEY,
  environment: 'production'
})

// List posts
const posts = await sdk.posts.list({ limit: 10 })
console.log(posts.data)
\`\`\`

## SDK Languages

Official SDKs available for:
- JavaScript/TypeScript (Node.js & Browser)
- Python
- Ruby
- PHP
- Go
- Java

## Authentication

All API requests require an API key. Generate keys from your organization dashboard.

\`\`\`typescript
const sdk = new MahakavyaSDK({
  apiKey: 'mk_1234567890abcdef'
})
\`\`\`

## Core Resources

### Posts

\`\`\`typescript
// Create a post
const post = await sdk.posts.create({
  content: 'Hello from the API!',
  media: ['https://example.com/image.jpg']
})

// Get a post
const post = await sdk.posts.get('post-id')

// List posts
const posts = await sdk.posts.list({ limit: 20, offset: 0 })

// Like a post
await sdk.posts.like('post-id')

// Delete a post
await sdk.posts.delete('post-id')
\`\`\`

### Users

\`\`\`typescript
// Get user profile
const user = await sdk.users.get('user-id')

// Search users
const users = await sdk.users.search('John Doe')

// List users
const users = await sdk.users.list({ limit: 10 })
\`\`\`

### Campaigns

\`\`\`typescript
// Create a fundraising campaign
const campaign = await sdk.campaigns.create({
  title: 'Help Build a School',
  description: 'Fundraising for education',
  goalAmount: 100000,
  endsAt: '2024-12-31'
})

// Get campaign
const campaign = await sdk.campaigns.get('campaign-id')

// Donate to campaign
await sdk.campaigns.donate('campaign-id', 5000)
\`\`\`

## Webhooks

Receive real-time notifications for events.

### Event Types

- `post.created`
- `post.updated`
- `post.deleted`
- `campaign.created`
- `campaign.completed`
- `donation.received`
- `user.verified`

### Webhook Payload

\`\`\`json
{
  "event": "post.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "post-123",
    "content": "New post content",
    "authorId": "user-456"
  }
}
\`\`\`

### Verifying Webhooks

\`\`\`typescript
const isValid = sdk.webhooks.verify(
  req.body,
  req.headers['x-mahakavya-signature'],
  process.env.WEBHOOK_SECRET
)

if (!isValid) {
  return res.status(401).json({ error: 'Invalid signature' })
}
\`\`\`

## Analytics

Track custom events and metrics.

\`\`\`typescript
await sdk.analytics.track('button_clicked', {
  button_name: 'donate_now',
  campaign_id: 'campaign-123',
  amount: 5000
})
\`\`\`

## Error Handling

\`\`\`typescript
const result = await sdk.posts.create({ content: 'Test' })

if (!result.success) {
  console.error(result.error.code) // 'RATE_LIMIT_EXCEEDED'
  console.error(result.error.message) // 'Rate limit exceeded'
}
\`\`\`

### Error Codes

- `UNAUTHORIZED` - Invalid API key
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input
- `INTERNAL_ERROR` - Server error

## Rate Limits

Rate limits are returned in response headers:

\`\`\`
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1234567890
\`\`\`

## Pagination

List endpoints support pagination:

\`\`\`typescript
const posts = await sdk.posts.list({
  limit: 20,
  offset: 40
})

console.log(posts.meta.total) // Total count
console.log(posts.meta.page) // Current page
\`\`\`

## SDK Examples

### Node.js

See [examples/nodejs](./examples/nodejs) for complete examples.

### Browser

\`\`\`html
<script src="https://cdn.mahakavya.com/sdk/v1/mahakavya.min.js"></script>
<script>
  const sdk = new MahakavyaSDK({
    apiKey: 'your-api-key'
  })
  
  sdk.posts.list().then(posts => {
    console.log(posts.data)
  })
</script>
\`\`\`

## Support

- GitHub: https://github.com/mahakavya/sdk
- Documentation: https://docs.mahakavya.com
- Support: api-support@mahakavya.com
- Status: https://status.mahakavya.com

---

**API Version:** v1  
**Last Updated:** January 2024

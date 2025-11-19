# Mahakavya API Documentation

## Overview

The Mahakavya API provides RESTful endpoints for all platform features. All endpoints require authentication unless otherwise specified.

## Base URL

\`\`\`
Production: https://your-domain.com/api
Development: http://localhost:3000/api
\`\`\`

## Authentication

All authenticated endpoints require a valid session cookie set by Supabase Auth.

### Headers

\`\`\`
Cookie: sb-access-token=<token>
Content-Type: application/json
\`\`\`

---

## Posts API

### GET /api/posts

Retrieve paginated posts feed.

**Query Parameters:**
- `limit` (optional): Number of posts to return (default: 10, max: 50)
- `cursor` (optional): Pagination cursor (ISO timestamp)
- `tab` (optional): Feed type - `for-you` or `following` (default: `for-you`)

**Response:**
\`\`\`json
{
  "items": [
    {
      "id": "uuid",
      "content": "string",
      "media_urls": ["url"],
      "tags": ["tag1", "tag2"],
      "likes_count": 0,
      "comments_count": 0,
      "created_at": "ISO timestamp",
      "viewerLike": false,
      "author": {
        "id": "uuid",
        "name": "string",
        "avatar_url": "url"
      }
    }
  ],
  "nextCursor": "ISO timestamp",
  "hasMore": boolean
}
\`\`\`

**Status Codes:**
- `200`: Success
- `401`: Unauthorized
- `500`: Server error

### POST /api/posts

Create a new post.

**Request Body:**
\`\`\`json
{
  "content": "string (required)",
  "media_url": "string (optional)",
  "media_urls": ["string"] (optional),
  "tags": ["string"] (optional)
}
\`\`\`

**Response:**
\`\`\`json
{
  "id": "uuid",
  "content": "string",
  "created_at": "ISO timestamp",
  ...
}
\`\`\`

**Status Codes:**
- `201`: Created
- `400`: Bad request
- `401`: Unauthorized
- `500`: Server error

**Rate Limit:** 20 posts per hour

---

## Reels API

### GET /api/reels

Retrieve video reels feed.

**Query Parameters:**
- `limit` (optional): Number of reels (default: 10, max: 30)
- `cursor` (optional): Pagination cursor

**Response:**
\`\`\`json
{
  "items": [
    {
      "id": "uuid",
      "video_url": "string",
      "thumbnail_url": "string",
      "title": "string",
      "views_count": 0,
      "likes_count": 0,
      "created_at": "ISO timestamp",
      "author": {...}
    }
  ]
}
\`\`\`

### POST /api/reels

Upload a new reel.

**Request Body (multipart/form-data):**
- `video`: File (max 100MB)
- `title`: string
- `description`: string (optional)

**Rate Limit:** 5 uploads per hour

---

## Campaigns API (Fundraising)

### GET /api/campaigns

List fundraising campaigns.

**Query Parameters:**
- `status` (optional): Filter by status - `active`, `completed`, `pending`
- `limit` (optional): Number of campaigns (default: 20)
- `offset` (optional): Pagination offset

### POST /api/campaigns

Create a fundraising campaign.

**Request Body:**
\`\`\`json
{
  "title": "string (required)",
  "description": "string (required)",
  "goal_amount": number (required),
  "end_date": "ISO date (required)",
  "category": "string (optional)",
  "images": ["url"] (optional)
}
\`\`\`

**Rate Limit:** 3 campaigns per day

---

## Messaging API

### GET /api/chat/conversations

List user's conversations.

**Response:**
\`\`\`json
{
  "conversations": [
    {
      "id": "uuid",
      "name": "string",
      "type": "direct | group",
      "last_message": {...},
      "unread_count": 0,
      "members": [...]
    }
  ]
}
\`\`\`

### POST /api/chat/messages

Send a message.

**Request Body:**
\`\`\`json
{
  "conversation_id": "uuid (required)",
  "content": "string (required)",
  "attachments": ["url"] (optional)
}
\`\`\`

**Rate Limit:** 100 messages per minute

---

## Admin API

All admin endpoints require `is_admin` flag on user profile.

### GET /api/admin/users

List and filter users.

**Query Parameters:**
- `status`: Filter by status
- `search`: Search by name/email
- `page`: Page number
- `limit`: Items per page

### POST /api/admin/users/bulk-action

Perform bulk actions on users.

**Request Body:**
\`\`\`json
{
  "action": "suspend | activate | delete",
  "user_ids": ["uuid"]
}
\`\`\`

---

## Rate Limits

- **Authentication**: 10 requests/minute
- **Content Creation**: 20 posts/hour, 10 comments/minute
- **Social Interactions**: 100 likes/minute, 50 follows/hour
- **Payments**: 10 requests/minute
- **Admin Operations**: 100 requests/minute

Rate limit headers are included in all responses:
\`\`\`
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
\`\`\`

---

## Error Responses

All errors follow this format:

\`\`\`json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {...}
}
\`\`\`

### Common Error Codes

- `UNAUTHORIZED`: Missing or invalid authentication
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid input data
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error

---

## Webhooks

### Payment Webhooks

Razorpay sends payment notifications to:
\`\`\`
POST /api/payments/razorpay/webhook
\`\`\`

**Security:** Verified using Razorpay signature

---

## SDK Examples

### JavaScript/TypeScript

\`\`\`typescript
// Fetch posts
const response = await fetch('/api/posts?limit=20', {
  credentials: 'include'
})
const { items } = await response.json()

// Create post
const newPost = await fetch('/api/posts', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'Hello world!',
    tags: ['update']
  })
})
\`\`\`

### cURL

\`\`\`bash
# Get posts
curl -X GET 'https://your-domain.com/api/posts?limit=10' \
  -H 'Cookie: sb-access-token=<token>'

# Create post
curl -X POST 'https://your-domain.com/api/posts' \
  -H 'Cookie: sb-access-token=<token>' \
  -H 'Content-Type: application/json' \
  -d '{"content":"Hello world!"}'
\`\`\`

---

## Support

For API support:
- Email: api-support@mahakavya.com
- Documentation: https://docs.mahakavya.com
- Status Page: https://status.mahakavya.com

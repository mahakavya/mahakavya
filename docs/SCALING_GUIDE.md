# Infrastructure Scaling Guide

This guide provides strategies and best practices for scaling Mahakavya to handle millions of users.

## Current Architecture

- **Frontend**: Next.js 14 on Vercel Edge Network
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **CDN**: Vercel CDN + Supabase CDN

## Scaling Milestones

### Stage 1: 0-10K Users (Current)
- Single database instance
- No caching needed
- Basic monitoring

### Stage 2: 10K-100K Users
- Implement Redis caching
- Database connection pooling
- CDN for all media
- Load balancer for API

### Stage 3: 100K-1M Users
- Read replicas for database
- Separate write/read operations
- Queue system for background jobs
- Advanced caching strategies

### Stage 4: 1M+ Users
- Database sharding
- Microservices architecture
- Multi-region deployment
- Advanced CDN strategies

## Database Scaling

### Connection Pooling
Already configured in Supabase. For additional control:

\`\`\`typescript
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})
\`\`\`

### Read Replicas
Configure read replicas in `scripts/04-infrastructure-scaling.sql`:

\`\`\`sql
INSERT INTO read_replicas (name, connection_string, weight)
VALUES 
  ('replica-1', 'postgresql://...', 2),
  ('replica-2', 'postgresql://...', 1);
\`\`\`

Use in code:
\`\`\`typescript
// For read operations
const replicaUrl = await getReadReplica()
const supabase = createClient(replicaUrl, anonKey)
\`\`\`

### Query Optimization
- Use materialized views (already set up)
- Add appropriate indexes
- Monitor slow queries:
  \`\`\`sql
  SELECT * FROM get_slow_queries(1000);
  \`\`\`

## Caching Strategy

### Level 1: Browser Cache
- Next.js automatically caches static assets
- Configure cache headers for API routes

### Level 2: CDN Cache
- Vercel Edge Network caches responses
- Configure in `next.config.js`:
  \`\`\`javascript
  headers: [
    {
      source: '/api/public/:path*',
      headers: [
        { key: 'Cache-Control', value: 's-maxage=60, stale-while-revalidate' }
      ]
    }
  ]
  \`\`\`

### Level 3: Redis Cache
Install Redis (Upstash recommended for serverless):

\`\`\`typescript
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

// Cache user data
await redis.setex(`user:${userId}`, 3600, JSON.stringify(userData))
const cached = await redis.get(`user:${userId}`)
\`\`\`

## CDN Optimization

### Images
Use Next.js Image with CDN:
\`\`\`typescript
import Image from 'next/image'

<Image
  src={imageUrl || "/placeholder.svg"}
  width={500}
  height={300}
  loading="lazy"
/>
\`\`\`

### Videos
Use HLS streaming with CDN:
- Upload to Supabase Storage
- Generate HLS manifest
- Serve via CDN

## Load Balancing

### API Load Balancing
Vercel automatically load balances serverless functions.

For custom servers:
\`\`\`nginx
upstream api_servers {
  server api1.example.com weight=3;
  server api2.example.com weight=2;
  server api3.example.com;
}

server {
  location /api/ {
    proxy_pass http://api_servers;
  }
}
\`\`\`

## Background Jobs

### Queue System
Implement job queue for heavy operations:

\`\`\`typescript
import Queue from 'bull'

const emailQueue = new Queue('emails', process.env.REDIS_URL)

// Add job
await emailQueue.add('send-notification', {
  userId: '123',
  type: 'new-follower'
})

// Process job
emailQueue.process('send-notification', async (job) => {
  await sendEmail(job.data)
})
\`\`\`

## Monitoring & Alerts

### Performance Monitoring
- Vercel Analytics (already integrated)
- Sentry for errors (already configured)
- Custom metrics:
  \`\`\`typescript
  await monitoring.trackMetric('api_response_time', duration)
  \`\`\`

### Alerts
Configure alerts in monitoring.ts:
\`\`\`typescript
if (errorRate > 0.05) {
  await sendAlert('High error rate detected')
}
\`\`\`

## Multi-Region Deployment

### Stage 1: CDN
- Already handled by Vercel Edge Network
- Content served from nearest location

### Stage 2: Database Replicas
- Set up replicas in target regions
- Route reads to nearest replica

### Stage 3: Full Multi-Region
- Deploy app in multiple regions
- Region-aware routing
- Data replication strategy

## Cost Optimization

### Database
- Use connection pooling
- Clean up old data regularly
- Archive inactive data

### Storage
- Implement CDN caching
- Compress images/videos
- Delete unused media

### Compute
- Optimize serverless function duration
- Use edge functions for simple operations
- Cache expensive computations

## Security at Scale

### Rate Limiting
Already implemented in `lib/rate-limit-enhanced.ts`

Adjust limits based on load:
\`\`\`typescript
const limits = {
  default: { requests: 100, window: 60 },
  authenticated: { requests: 200, window: 60 },
}
\`\`\`

### DDoS Protection
- Vercel provides basic DDoS protection
- Add Cloudflare for advanced protection
- Implement CAPTCHA for sensitive endpoints

## Performance Benchmarks

Target metrics:
- **API Response Time**: < 200ms (p95)
- **Page Load Time**: < 2s (p95)
- **Database Queries**: < 50ms (p95)
- **Uptime**: > 99.9%

## Scaling Checklist

- [ ] Set up database read replicas
- [ ] Implement Redis caching
- [ ] Configure CDN for all media
- [ ] Set up job queue system
- [ ] Add performance monitoring
- [ ] Configure auto-scaling
- [ ] Set up backup strategy
- [ ] Implement disaster recovery
- [ ] Load test critical paths
- [ ] Document scaling procedures

## Resources

- [Vercel Scaling Guide](https://vercel.com/docs/concepts/solutions/scale)
- [Supabase Performance Tuning](https://supabase.com/docs/guides/platform/performance)
- [PostgreSQL Scaling](https://www.postgresql.org/docs/current/high-availability.html)

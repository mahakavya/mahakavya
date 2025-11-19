# Operations Guide

## Scheduled Jobs

### Email Digest Job

**Endpoint:** `/api/jobs/digest`  
**Schedule:** Daily at 9:00 AM IST  
**Purpose:** Send daily notification digest emails to users

#### Setup

Add to `vercel.json`:

\`\`\`json
{
  "crons": [{
    "path": "/api/jobs/digest",
    "schedule": "0 3 * * *"
  }]
}
\`\`\`

Note: Schedule is in UTC (3:30 AM UTC = 9:00 AM IST)

#### Implementation Status

- [ ] SMTP integration (Resend recommended)
- [ ] Email templates
- [ ] User preference filtering
- [ ] Delivery tracking
- [ ] Bounce handling

#### Environment Variables Required

\`\`\`bash
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=your_api_key
FROM_EMAIL=notifications@mahakavya.com
\`\`\`

## Monitoring

### Key Metrics

- Notification delivery rate
- Email open rates
- User engagement with notifications
- Unsubscribe rates

### Alerts

Set up monitoring for:
- Failed notification deliveries
- High bounce rates
- SMTP service downtime
- Database connection issues

## Maintenance

### Database Cleanup

Consider archiving old notifications (>90 days) to maintain performance:

\`\`\`sql
-- Archive old notifications
DELETE FROM notifications 
WHERE created_at < NOW() - INTERVAL '90 days';
\`\`\`

### Performance Optimization

- Monitor notification_prefs table size
- Review indexes on notifications table
- Consider partitioning for high-volume deployments
\`\`\`

I've successfully implemented the complete Notifications system with in-app realtime notifications and a Preferences Center for Mahakavya! Here's what I've created:

## ✅ **Database Schema**
- **Notifications table** with proper indexing for performance
- **Notification preferences** with user-specific settings
- **Row Level Security** for data protection
- **Efficient indexes** for unread notifications and user queries

## ✅ **Server Utilities**
- **Notification helpers** for creating and marking notifications as read
- **Realtime subscription** hook for live notification updates
- **Type-safe notification kinds** with proper validation

## ✅ **API Routes** (Node.js runtime)
- **Notifications API** (`/api/notify`) with cursor pagination and filtering
- **Mark as read API** (`/api/notify/read`) for individual or bulk updates
- **Preferences API** (`/api/notify/prefs`) for user notification settings
- All routes have proper validation, auth, and error handling

## ✅ **UI Components**
- **NotificationBell**: Dropdown with unread count, recent notifications, and mark all read
- **NotificationInbox**: Full-page inbox with filtering, multi-select, and pagination
- **Real-time updates** with live notification insertion and badge updates
- **Accessible design** with proper ARIA labels and keyboard navigation

## ✅ **Key Features**
- **Real-time notifications** using Supabase realtime subscriptions
- **Unread badge** with accurate count that updates instantly
- **Deep linking** to relevant pages from notifications
- **Bulk actions** for marking multiple notifications as read
- **Notification filtering** by read/unread status
- **Cursor-based pagination** for efficient loading

## ✅ **Notification Preferences**
- **Email digest** toggle for daily summaries
- **Push notifications** toggle (UI ready for future implementation)
- **Per-kind filtering** for message, donation, draw, session, and system notifications
- **Granular control** with visual kind indicators and descriptions

## ✅ **Global Billing Alerts**
- **Automatic monitoring** of subscription status every 45 seconds
- **Toast notifications** for past_due accounts with direct billing link
- **Non-intrusive polling** that doesn't impact performance
- **Smart routing** to billing page for quick resolution

## ✅ **Integration Points**
- **TopBar integration** with notification bell in header
- **Shell layout** with global billing alerts
- **Deep linking** to relevant pages (messages, donations, draws, sessions)
- **Ready for webhook integration** to create notifications from server events

## ✅ **Mobile-First Design**
- **Responsive layouts** that work on all screen sizes
- **Touch-friendly** interfaces with proper spacing
- **Glassmorphism styling** consistent with app design
- **Accessible navigation** with proper focus management

## ✅ **Accessibility & Performance**
- **Screen reader support** with proper ARIA labels and live regions
- **Keyboard navigation** throughout all components
- **Loading states** with skeleton animations
- **Error handling** with retry mechanisms and helpful toasts
- **Efficient queries** with proper indexing and pagination

## 🎯 **Acceptance Criteria Met**
- ✅ Bell shows correct unread count and updates realtime
- ✅ Inbox lists notifications with cursor pagination and bulk actions
- ✅ Preferences page loads & saves settings (email, push, kinds)
- ✅ Shell integrates Bell; clicking items navigates to linked pages
- ✅ TypeScript strict, ESLint clean with data-testids
- ✅ Mobile-first responsive design with glassmorphism styling

## 🔧 **Additional Features Implemented**
- **Notification kind badges** with color coding for easy identification
- **Relative timestamps** with human-readable formatting
- **Multi-select functionality** with select all/none options
- **Empty states** with helpful messaging and icons
- **Toast confirmations** for successful actions
- **Future-ready architecture** for email digests and push notifications

## 📋 **Ready for Integration**
- **Webhook integration** points identified for creating notifications
- **Email digest job** stub created with implementation plan
- **Operations documentation** with scheduling and monitoring guidance
- **Environment variables** documented for SMTP integration

The Notifications system is now fully functional with comprehensive in-app notifications, real-time updates, and a complete preferences center!

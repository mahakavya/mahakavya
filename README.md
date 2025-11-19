# Mahakavya Social Platform

A comprehensive social platform that brings communities together through meaningful connections, fundraising campaigns, peer support, and engaging content sharing.

## 🌟 Features

- **Social Feed**: Share moments and connect with your community
- **Fundraising**: Create and support meaningful causes
- **Peer Support (Sahaya)**: Get help from trained listeners
- **Video Reels**: Share and discover engaging video content
- **Lucky Draws**: Participate in community draws and win prizes
- **Real-time Chat**: Connect with friends and supporters
- **Safe & Secure**: Advanced safety features and content moderation

## 🚀 Quick Start

### Demo Mode
The application runs in demo mode by default, allowing you to explore all features without any setup:

\`\`\`bash
npm install
npm run dev
\`\`\`

Visit `http://localhost:3000` to see the platform in action!

### Production Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Set up environment variables**:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`
   
   Add your Supabase credentials:
   \`\`\`env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   NEXT_PUBLIC_DEMO_MODE=false
   \`\`\`

3. **Run database migrations**:
   \`\`\`bash
   npm run db:migrate
   \`\`\`

4. **Start the application**:
   \`\`\`bash
   npm run build
   npm start
   \`\`\`

## 🏗️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS + shadcn/ui
- **Real-time**: Supabase Realtime
- **Payments**: Razorpay (optional)
- **Deployment**: Vercel

## 📁 Project Structure

\`\`\`
├── app/                    # Next.js app directory
│   ├── (shell)/           # Authenticated routes
│   ├── api/               # API routes
│   └── auth/              # Authentication pages
├── components/            # Reusable UI components
├── lib/                   # Utility functions and configurations
├── hooks/                 # Custom React hooks
├── config/                # Environment and app configuration
├── supabase/              # Database migrations and SQL files
└── scripts/               # Utility scripts
\`\`\`

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks

### Database Management

- `npm run db:migrate` - Run database migrations
- `npm run db:reset` - Reset database (development only)
- `npm run db:seed` - Seed database with sample data

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

### Manual Deployment

1. **Build the application**:
   \`\`\`bash
   npm run build
   \`\`\`

2. **Set up environment variables** on your hosting platform

3. **Deploy** the `.next` folder and `package.json`

## 🔒 Environment Variables

### Required for Production

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
\`\`\`

### Optional

\`\`\`env
# Payment Integration
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:your-email@example.com
\`\`\`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Report bugs and request features via GitHub Issues
- **Community**: Join our community discussions

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Database and auth by [Supabase](https://supabase.com/)
- Icons by [Lucide](https://lucide.dev/)

---

**Made with ❤️ for stronger communities**

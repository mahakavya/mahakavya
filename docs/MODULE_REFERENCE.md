# Mahakavya Application - Complete Module Reference

## Core Framework Modules

### Next.js Framework
- `next` - Main Next.js framework
- `next/headers` - Server-side headers (cookies, etc.)
- `next/navigation` - Client-side navigation (useRouter, usePathname)
- `next/image` - Optimized image component
- `next/link` - Client-side navigation component
- `next/font/google` - Google Fonts integration
- `next/dynamic` - Dynamic imports
- `next/server` - Server utilities (NextRequest, NextResponse)

### React Core
- `react` - Main React library
- `react-dom` - React DOM rendering
- `react/jsx-runtime` - JSX runtime (automatic)

## Database & Backend

### Supabase
- `@supabase/supabase-js` - Main Supabase client
- `@supabase/ssr` - Server-side rendering utilities
  - `createBrowserClient` - Browser client creation
  - `createServerClient` - Server client creation

### Authentication
- `@supabase/auth-helpers-nextjs` - Next.js auth helpers (if used)

## UI Framework & Components

### Radix UI Primitives
- `@radix-ui/react-alert-dialog` - Alert dialog component
- `@radix-ui/react-avatar` - Avatar component
- `@radix-ui/react-checkbox` - Checkbox component
- `@radix-ui/react-dialog` - Dialog/modal component
- `@radix-ui/react-dropdown-menu` - Dropdown menu component
- `@radix-ui/react-form` - Form components
- `@radix-ui/react-label` - Label component
- `@radix-ui/react-progress` - Progress bar component
- `@radix-ui/react-scroll-area` - Scroll area component
- `@radix-ui/react-select` - Select dropdown component
- `@radix-ui/react-separator` - Separator/divider component
- `@radix-ui/react-sheet` - Sheet/drawer component
- `@radix-ui/react-slot` - Slot component for composition
- `@radix-ui/react-switch` - Toggle switch component
- `@radix-ui/react-tabs` - Tabs component
- `@radix-ui/react-toast` - Toast notification component

### Styling & CSS
- `tailwindcss` - Utility-first CSS framework
- `tailwindcss-animate` - Animation utilities for Tailwind
- `tailwind-merge` - Utility for merging Tailwind classes
- `class-variance-authority` - CVA for component variants
- `clsx` - Conditional class name utility
- `autoprefixer` - CSS autoprefixer
- `postcss` - CSS post-processor

### Theming
- `next-themes` - Theme switching for Next.js

## Form Handling & Validation

### Forms
- `react-hook-form` - Form state management
- `@hookform/resolvers` - Form validation resolvers

### Validation
- `zod` - TypeScript-first schema validation

## Icons & Graphics
- `lucide-react` - Icon library

## Payment Processing
- `razorpay` - Razorpay payment gateway SDK

## Push Notifications
- `web-push` - Web push notifications

## Charts & Analytics
- `recharts` - Chart library for React

## File Processing & Documents
- `jspdf` - PDF generation
- `jszip` - ZIP file creation/manipulation

## Date & Time
- `date-fns` - Date utility library

## Data Fetching
- `swr` - Data fetching with caching

## Intersection Observer
- `react-intersection-observer` - Intersection Observer hook

## Development Tools

### TypeScript
- `typescript` - TypeScript compiler
- `@types/node` - Node.js type definitions
- `@types/react` - React type definitions
- `@types/react-dom` - React DOM type definitions
- `@types/web-push` - Web Push type definitions

### Build Tools
- `tsx` - TypeScript execution for Node.js
- `eslint` - JavaScript/TypeScript linting
- `eslint-config-next` - Next.js ESLint configuration

### Bundle Analysis
- `@next/bundle-analyzer` - Bundle size analysis

## Node.js Built-in Modules

### File System
- `fs` - File system operations
  - `readFileSync` - Synchronous file reading
  - `writeFileSync` - Synchronous file writing
  - `existsSync` - Check if file exists
  - `mkdirSync` - Create directories

### Path
- `path` - Path utilities
  - `join` - Join path segments
  - `resolve` - Resolve absolute path
  - `dirname` - Get directory name
  - `basename` - Get file name

### Crypto
- `crypto` - Cryptographic functionality
  - `randomBytes` - Generate random bytes
  - `createHash` - Create hash
  - `createHmac` - Create HMAC

### URL
- `url` - URL utilities
  - `URL` - URL constructor
  - `URLSearchParams` - URL search parameters

### Process
- `process` - Process information
  - `process.env` - Environment variables
  - `process.cwd()` - Current working directory

## Custom Module Exports

### Application Modules
- `@/components/ui/*` - UI component library
- `@/lib/supabase` - Supabase client utilities
- `@/lib/utils` - General utility functions
- `@/lib/db` - Database utilities
- `@/lib/auth` - Authentication utilities
- `@/hooks/use-auth` - Authentication hook
- `@/hooks/use-toast` - Toast notification hook
- `@/config/*` - Configuration modules

### Script Modules
- `./production-readiness-check` - Production readiness checker
- `./fix-production-issues` - Automated issue fixer
- `./deployment-checklist` - Deployment checklist generator

## Environment Variables (Not modules, but important references)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `RAZORPAY_KEY_ID` - Razorpay key ID
- `RAZORPAY_KEY_SECRET` - Razorpay secret key
- `VAPID_PUBLIC_KEY` - VAPID public key for push notifications
- `VAPID_PRIVATE_KEY` - VAPID private key for push notifications
- `NODE_ENV` - Node environment (development/production)

## Import Patterns Used

### Named Imports
\`\`\`typescript
import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
\`\`\`

### Default Imports
\`\`\`typescript
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
\`\`\`

### Namespace Imports
\`\`\`typescript
import * as React from 'react'
import * as fs from 'fs'
\`\`\`

### Dynamic Imports
\`\`\`typescript
const Component = dynamic(() => import('./Component'))
\`\`\`

### Type-only Imports
\`\`\`typescript
import type { NextRequest } from 'next/server'
import type { Database } from '@/lib/database.types'
\`\`\`

## Common Import Aliases
- `@/` - Root directory alias (configured in tsconfig.json)
- `~/` - Alternative root alias (if configured)

This reference covers all modules used in the Mahakavya application. All imports should use these exact module names to avoid resolution errors.

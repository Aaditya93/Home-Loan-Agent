---
trigger: always_on
description: Directory Visualization
---

bukxe/
├── actions/              # Server Actions (grouped by feature)
│   ├── admin/            # Admin-specific actions
│   ├── auth/             # Authentication logic (OTP, Google, etc.)
│   ├── projects/         # Project management actions
│   └── site-visit.ts     # General feature actions
├── app/                  # Next.js App Router (Routes & Layouts)
│   ├── (nav-bar)/        # Route grouping for shared navigation
│   ├── admin/            # Admin dashboard routes
│   ├── api/              # Route Handlers (API endpoints)
│   └── layout.tsx        # Root layout
├── components/           # UI Components (grouped by feature)
│   ├── auth/             # Auth-specific components
│   ├── home/             # Home page sections
│   ├── project/          # Project detail/list components
│   ├── ui/               # Base Shadcn/Radix components
│   └── theme/            # Theme-related components
├── config/               # Static site & docs configuration
├── db/                   # Database-related files
│   ├── models/           # Mongoose Schema & Model definitions
│   └── connection.ts     # MongoDB connection utility
├── hooks/                # Reusable React hooks
├── lib/                  # Utilities, core logic, and validation
├── mail/                 # Email templates
├── public/               # Static assets (images, fonts, icons)
├── types/                # Project-wide TypeScript definitions
├── routes.ts             # Centralized route definitions
└── auth.ts               # NextAuth configuration
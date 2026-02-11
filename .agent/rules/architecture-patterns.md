---
trigger: model_decision
description: Core development structure for DB, actions, auth, UI, and styling.
---

Database Operations
Always call await dbConnect() from @/db/connection
Define and import models from @/db/models/
Server Actions
Store in actions/ grouped by feature
Use ActionResponse<T> type
Authentication
Server-side: auth()
Client-side: useSession()
Phone Auth: Firebase OTP + backend sync
Middleware protection via middleware.ts + routes.ts
UI Components
Group components by feature
Keep schemas in schema.ts
Do not modify components/ui/ directly
Forms use react-hook-form + zodResolver
Styling
Tailwind CSS 4 utility-first
Mobile-first, dark mode, container queries
Use Radix + Shadcn building blocks
Use cn utility
HugeIcons standard usage
Use typography components only, no extra text sizing classes
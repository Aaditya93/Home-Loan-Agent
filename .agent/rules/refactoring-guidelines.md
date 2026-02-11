---
trigger: model_decision
description: Use this document as your primary source of truth when refactoring or implementing features. Follow the "Gold Standard" structure strictly.
---

# Project Architecture & Refactoring Guidelines

> **Instruction for Agent**: Use this document as your primary source of truth when refactoring or implementing features. Follow the "Gold Standard" structure strictly.

---

## 🏗️ 1. The Gold Standard Architecture

Every feature (e.g., "Contact Us", "Project Details", "Admin Dashboard") must follow this 4-layer architecture:

### Layer 1: Data & Types (The Foundation)
- **Location**: `types/<feature>/index.ts` & `db/models/<Model>.ts`
- **Rule**: Types flow downwards. DB Schemas define the raw data, Zod schemas validate inputs/outputs, and TypeScript interfaces enforce strict usage.
- **Strictness**: NO `any`. NO `as` casting unless absolutely necessary.

### Layer 2: Core Logic (Server Actions)
- **Location**: `actions/<feature>/<action-name>.ts`
- **Rule**: All database interactions happen here. Check authentication, validate inputs with Zod, handle errors gracefully, and return `ActionResponse<T>`.
- **Validation**: Inputs MUST be validated using Zod schemas defined in `lib/validations/<feature>.ts`.

### Layer 3: UI Components (Building Blocks)
- **Location**: `components/<feature>/<component-name>.tsx`
- **Rule**: 
    - **Server Components**: Fetch data, render initial HTML.
    - **Client Components**: Handle interactivity (clicks, forms). Keep them small & focused.
    - **Styling**: Use `components/ui` primitives (Shadcn/UI) + Tailwind classes. No custom CSS classes in globals.

### Layer 4: Pages (The Assembly)
- **Location**: `app/(nav-bar)/<feature>/page.tsx`
- **Rule**: Pure Server Components. They act as "Controllers" - fetching data via Actions and passing it to Components.
- **SEO**: Every page must export `generateMetadata`.

---

## 📂 2. Standard File Structure

For a hypothetical feature **"Reviews"**:

```
/
├── types/
│   └── reviews/
│       ├── index.ts          # Core types (IReview)
│       └── dto.ts            # Data Transfer Objects (CreateReviewInput)
├── db/models/
│   └── Review.ts             # Mongoose Schema
├── lib/validations/
│   └── review.ts             # Zod schemas (createReviewSchema)
├── actions/
│   └── reviews/
│       ├── get-reviews.ts    # Fetch logic
│       └── create-review.ts  # Mutation logic
├── components/
│   └── reviews/
│       ├── review-list.tsx   # Display list
│       ├── review-card.tsx   # Individual item
│       └── review-form.tsx   # Submission form (Client Component)
└── app/
    └── (nav-bar)/
        └── reviews/
            └── page.tsx      # Composition Root
```

---

## ✅ 3. Refactoring Checklist (Per Feature)

When tasked to "Improve [Feature] Page", follow this exact sequence:

1.  **Audit Data Layer**:
    - [ ] Check `types/` for duplication. Consolidate into `types/<feature>`.
    - [ ] Ensure DB Model exists and uses correct types.
    - [ ] Create `lib/validations/<feature>.ts` for Zod schemas.

2.  **Refactor Server Actions**:
    - [ ] Move logic to `actions/<feature>/`.
    - [ ] Add `use server` directive.
    - [ ] IMPLEMENT INPUT VALIDATION (Zod).
    - [ ] Implement error handling (`try/catch` -> standard error format).
    - [ ] Remove any `console.log`.

3.  **Refactor Components**:
    - [ ] Split large components (> 150 lines).
    - [ ] Separate Client (interactivity) vs. Server (rendering).
    - [ ] Replace `any` in props with strict types.
    - [ ] Ensure accessibility (aria-labels, semantic HTML).

4.  **Polish Page**:
    - [ ] Ensure `page.tsx` is a Server Component.
    - [ ] Move data fetching to `page.tsx`.
    - [ ] Add `generateMetadata`.
    - [ ] Add `<Suspense>` boundaries for slow data.

---

5. Coding Rules (Strict)
NO any: Use unknown if you must, but define shapes.
NO console.log: Use a logger or remove before proper release.
Client Boundaries: Put 'use client' at the very top, only when hooks (useState, useEffect) are used.
Import Aliases: Always use @/components/..., @/actions/..., NOT ../../components.
Shadcn UI: Do not modify components/ui/*. Wrap them if needed.


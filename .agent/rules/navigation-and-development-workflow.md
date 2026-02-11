---
trigger: model_decision
description: Provides a step-by-step workflow for introducing new functionality, covering models, server actions, schemas, UI components, and routing in a consistent way.
---

## Adding a New Feature

1.  **Define Model**: Add a new Mongoose model in `db/models/` if needed.
2.  **Create Actions**: Add server actions in a new subdirectory under `actions/`.
3.  **Define Schema**: Create a Zod schema in `components/[feature]/schema.ts` if a form is involved.
4.  **Build Components**: Create necessary components in `components/[feature]/`.
5.  **Create Route**: Add a new page in `app/`.

### Entry Points

- **Root Layout**: `app/layout.tsx`
- **Main Page**: `app/(nav-bar)/page.tsx`
- **Auth Config**: `auth.ts` and `routes.ts`.

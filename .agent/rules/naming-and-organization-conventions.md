---
trigger: model_decision
description: Outlines folder, file, and symbol naming standards (kebab-case, PascalCase, camelCase) along with import practices to ensure clean and predictable project structure.
---

- **Folders**: `kebab-case` (e.g., `onboarding-project`).
- **Filenames (Components/Utilities)**: `kebab-case.tsx` or `kebab-case.ts` (e.g., `login-form.tsx`, `utils.ts`).
- **Filenames (Models/Types)**: Often `PascalCase.ts` for database models (e.g., `User.ts`) or `kebab-case.ts` for type files (e.g., `layout-types.ts`).
- **Symbol Naming**:
  - **Components**: `PascalCase` (e.g., `export const LoginForm = ...`).
  - **Hooks/Utils**: `camelCase` (e.g., `useSession()`, `dbConnect()`).
  - **Server Actions**: `camelCase` (e.g., `export const emailLogin = ...`).
- **Imports**: Use the `@/` alias (e.g., `import { ... } from "@/components/ui/button"`).

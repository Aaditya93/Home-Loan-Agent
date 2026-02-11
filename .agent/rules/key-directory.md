---
trigger: model_decision
description: Overview of the main project folders and their roles in organizing server actions, routes, UI components, database models, and shared utilities.
---


### `actions/`

- **Purpose**: Houses all Next.js Server Actions.
- **Pattern**: Grouped by feature folders. Each file should export functions returning `ActionResponse<T>`.
- **Convention**: Always call `await dbConnect()` at the start of actions interacting with the database.

### `app/`

- **Purpose**: Defines the application's routing and layout structure.
- **Pattern**: Uses Route Groups (e.g., `(nav-bar)`) to organize routes without affecting the URL structure.
- **Convention**: Keep page logic minimal; delegate complex UI to `components/`.

### `components/`

- **Purpose**: Home for all React components.
- **Subdirectories**:
  - `ui/`: Fundamental, low-level components (mostly Shadcn).
  - `[feature]/`: Feature-specific components (e.g., `components/project/`).
- **Patterns**: Each feature folder often contains a `schema.ts` for Zod validations specific to that feature's forms.

### `db/`

- **Purpose**: Database configuration and ODM models.
- **`models/`**: PascalCase files (e.g., `User.ts`, `Project.ts`) defining Mongoose schemas.

### `lib/`

- **Purpose**: Utility functions, core logic wrappers, and global validation schemas.
- **Key Files**: `utils.ts` (contains the `cn` utility).

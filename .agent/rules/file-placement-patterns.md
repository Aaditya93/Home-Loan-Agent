---
trigger: model_decision
description: Defines standard rules for where configs, models, schemas, server actions, and styles should live to keep the codebase consistent and easy to navigate.
---


- **Configuration Files**: Root level (`next.config.ts`, `postcss.config.mjs`) or `config/` for app-specific settings.
- **Model Definitions**: Always in `db/models/`.
- **Validation Schemas**:
  - Feature-specific: `components/[feature]/schema.ts`.
  - Global/Shared: `lib/validations/`.
- **Server Actions**: `actions/[feature]/[action-name].ts`.
- **Styles**: Global styles in `app/globals.css`, Tailwind classes in components.
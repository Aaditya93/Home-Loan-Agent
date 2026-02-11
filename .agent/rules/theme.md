---
trigger: model_decision
description: Theme Summary (for AI Agent)  This project uses a **premium Tailwind + shadcn token-based theme** with full **light/dark mode support**.
---

## Theme Summary (for AI Agent)

This project uses a **premium Tailwind + shadcn token-based theme** with full **light/dark mode support**.

---

### Core Setup

* TailwindCSS base
* shadcn/ui styling layer
* tw-animate for animations

---

### Design System Rules

All UI styling must use **theme tokens**, not hardcoded colors:

* `bg-background`
* `text-foreground`
* `border-border`
* `ring-ring`

These map to CSS variables like `--primary`, `--surface`, etc.

---

### Light Mode

* Soft off-white background
* Charcoal text (no pure black)
* Deep navy primary branding

---

### Dark Mode

* Rich charcoal/blue-grey background
* Soft white text (no pure white)
* Subtle borders + navy glow rings

---

### Key Additions

* **Surface token** (`--surface`) for layered sections
* **Soft premium shadows** (`shadow-soft-*`)
* **Tactile badge utility**:

```css
.badge-tactile {
  @apply shadow-tactile rounded-full text-xs font-semibold;
}
```

---

### Agent Rules

✅ Use tokens only
❌ No hardcoded colors
✅ Prefer `surface` for elevated UI
✅ Keep soft shadows + rounded premium style consistent

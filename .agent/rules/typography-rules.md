---
trigger: model_decision
description: Always use our Typography components instead of raw HTML tags in the frontend. Look it this before Generating any frontend code
---

## ✅ Typography Rule (Short)

Always use our Typography components instead of raw HTML tags in the frontend.

❌ Don’t write:

```tsx
<h1>Title</h1>
<p>Text</p>
```

✅ Always write:

```tsx
<TypographyH1>Title</TypographyH1>
<TypographyP>Text</TypographyP>
```

### Use Components:

* `TypographyH1–H4` → Headings
* `TypographyP`, `TypographyLead` → Paragraphs
* `TypographyMuted`, `TypographySmall`, `TypographyLarge` → Supporting text
* `TypographyBlockquote`, `TypographyInlineCode`, `TypographyList` → Special text

### Import:

```tsx
import { TypographyH1, TypographyP } from "@/components/ui/typography";
```

**Rule: Never use raw `<h*>`, `<p>`, `<small>`, etc. Always use Typography components.**

# Web Interface Guidelines (copia local)

Fuente: https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md

## Accessibility
- Icon-only buttons need `aria-label`
- Form controls need `<label>` or `aria-label`
- Interactive elements need keyboard handlers
- `<button>` for actions, `<a>` for navigation (not `<div onClick>`)
- Images need `alt` (or `alt=""` if decorative)
- Decorative icons need `aria-hidden="true"`
- Async updates (toasts, validation) need `aria-live="polite"`
- Use semantic HTML before ARIA
- Headings hierarchical h1–h6; include skip link for main content
- `scroll-margin-top` on heading anchors
- Meaningful media needs captions, transcripts, or descriptions

## Focus States
- Interactive elements need visible focus
- Never `outline-none` without focus replacement
- Use `:focus-visible` over `:focus`
- Sticky headers must not cover focused element

## Forms
- Inputs need `autocomplete` and meaningful `name`
- Use correct `type` and `inputmode`
- Never block paste
- Labels clickable
- Disable spellcheck on emails, codes, usernames
- Submit button stays enabled until request starts
- Errors inline next to fields; focus first error on submit
- Placeholders end with `…` and show example pattern
- `autocomplete="off"` on non-auth fields

## Animation
- Honor `prefers-reduced-motion`
- Animate `transform`/`opacity` only
- Never `transition: all`
- Set correct `transform-origin`
- Animations interruptible

## Typography
- `…` not `...`; curly quotes
- Non-breaking spaces for measurements, brand names
- `text-wrap: balance` on headings

## Content Handling
- Text containers handle long content; flex children need `min-w-0`; handle empty states

## Images
- `<img>` needs explicit `width` and `height`
- Below-fold images: `loading="lazy"`

## Performance
- `<link rel="preconnect">` for CDN domains
- Critical fonts: preload with `font-display: swap`

## Touch & Interaction
- `touch-action: manipulation`
- `-webkit-tap-highlight-color` set intentionally

## Safe Areas & Layout
- Full-bleed layouts need `env(safe-area-inset-*)`
- Avoid unwanted scrollbars

## Dark Mode & Theming
- `color-scheme` on `<html>`; `<meta name="theme-color">` matches page background

## Hover & Interactive States
- Buttons/links need `hover:` state

## Content & Copy
- Active voice, specific button labels, errors include fix/next step, second person

## Anti-patterns (flag these)
- `user-scalable=no` or `maximum-scale=1`
- `onPaste` with `preventDefault`
- `transition: all`
- `outline-none` without replacement
- `<div>`/`<span>` with click handlers
- Images without dimensions
- Form inputs without labels
- Icon buttons without `aria-label`
- `autoFocus` without justification
- Gesture-only actions

## Output Format
Group by file using `file:line` format. State issue + location tersely. Skip explanation unless fix non-obvious.

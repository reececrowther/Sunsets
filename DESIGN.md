# DESIGN.md — Afterglow

<!-- impeccable:design-schema 1 · seed c8d3c766 · IMPECCABLE'S PICK -->

## Visual world

**Turner Sky** — JMW Turner's late atmospheric oil paintings. Light is the subject, not the canvas. The gradient sky IS the interface; the score floats over it like a naturalist's notation over a living atmosphere. No card-grid hero shell. No cold blue anywhere.

## Palette

| Token | Value | Use |
|---|---|---|
| `--ground` | `#0C0908` | Page background, section fills |
| `--surface` | `#181008` | Panel backgrounds |
| `--surface-2` | `#221608` | Sidebar, secondary panels |
| `--text` | `#EDE0C0` | Primary text, warm off-white |
| `--text-2` | `#9A8060` | Secondary text |
| `--text-3` | `#5A4030` | Tertiary, muted labels |
| `--text-4` | `#2E1C10` | Near-invisible, footer |
| `--accent` | `#C8701A` | Amber — primary accent, great quality |
| `--accent-bright` | `#F0B830` | Gold — excellent quality, highlights |
| `--border` | `rgba(200,140,60,0.08)` | Warm amber, barely-there |

Quality colours: excellent `#F0B830`, great `#C8701A`, good `#5FAA88`, fair `#8890B8`, poor `#504840`.

## Typography

| Role | Face | Variable |
|---|---|---|
| Display | Bodoni Moda — italic, 700/900 | `--font-display` |
| Body | Work Sans — 300–700 | `--font-sans` |
| Data/times | JetBrains Mono — 400/500/700 | `--font-mono` |

The score is always Bodoni Moda italic. The quality label is Work Sans 600, small caps letterSpacing. Times are always JetBrains Mono.

## Hero (homepage)

Full-viewport layered gradient sky — eight-stop Turner palette from deep umber at the zenith through crimson to gold at the horizon. The gradient changes with forecast quality:

- **Excellent:** `#0A0806 → #140C18 → #3C1010 → #7A2C14 → #B85018 → #D8801E → #ECA828 → #F0B830`
- **Great:** muted amber variant
- **Good:** deep green gradient
- **Fair:** cold slate gradient (intentional — fair weather is not warm)
- **Poor:** near-black umber

On top of the gradient: atmospheric horizon glow (radial, animates on `horizon-breathe`), two atmospheric wisps, three layered mountain silhouettes (warm umber SVG paths), top/bottom fades in warm umber.

The score sits in the centre panel in `.hero-score-num` — `clamp(88px, 14vw, 188px)` Bodoni Moda italic. No border, no card, no enclosing chrome. It floats.

Three-column overlay layout:
- **Left sidebar** — dark glassmorphism (`rgba(12,8,4,0.72)`, amber border), location list, search
- **Centre** — score, quality label, atmospheric quote in Bodoni Moda italic, three times in JetBrains Mono
- **Right panel** — conditions breakdown, colour probability bar, reasons/warnings

## Location detail page (`/sunset/[slug]/`)

Hero driven by `HeroControls` → `SunScene` (real-time astronomical simulation) with the same Forecast Window language as the homepage. SunScene paints its own sky canvas on top of a quality-based `HERO_BG` fallback gradient.

Hero content matches the homepage centre panel exactly:
- Location name in Bodoni Moda italic 900, `clamp(2.2rem, 5.5vw, 3.4rem)`
- Score in Bodoni Moda italic 700, `clamp(72px, 11vw, 140px)` — quality colour, no ring
- Quality label in Work Sans 600, small caps, quality colour, 0.72 opacity
- First forecast reason as Bodoni Moda italic atmospheric quote in `rgba(237,224,192,0.42)`
- Three times (Golden Hour / Sunset / Blue Hour) in JetBrains Mono with amber pipe dividers

Below-fold panels use `var(--surface)` / `var(--border)` tokens. All text uses warm umber tokens (`--text-3` for muted labels, `--text-4` for near-invisible). No cold blue in static elements. Progress bar fills use `transform: scaleX()` (not `width`) to avoid layout thrash.

## Film grain

`.grain::after` applies an SVG fractalNoise texture at opacity 0.11 with `soft-light` blend mode. This pushes the CSS gradient sky from "clean gradient" towards "painted atmosphere". Applied to both hero sections.

## Brand

**Name:** Afterglow  
**Tagline:** "Is tonight's sky worth watching?"  
**Logo:** Setting Sun mark + split wordmark. Mark: 30×20 SVG — a perfect circle (r=10) centred on the horizon (y=15), clipped so only the upper half is visible above the horizon line; radial gradient from `#FCD84A` centre → `#F0B830` → `#C0601A` edge; atmospheric glow bloom behind. Ground strip below horizon in `#0D0806`. Horizon line `#C8701A` at 0.55 opacity. Wordmark: "After" in `#EDE0C0`, "glow" in `#F0B830`, Bodoni Moda italic 700, `1.10rem`, `−0.02em` tracking. Nav header: transparent at rest, `rgba(12,9,8,0.80)` glassmorphism on scroll — no gradient.

## Finish review

Review conducted in-thread (degraded mode — `impeccable-finish-reviewer` agent type unavailable in this harness).  
**disposition: fix** — five material fixes applied (PRODUCT.md staleness, data display clamp, grain strength, slug page cold-blue, DESIGN.md).  
All fidelity matrix elements: match or acceptable adaptation. No contradicted elements. Floor: pass.

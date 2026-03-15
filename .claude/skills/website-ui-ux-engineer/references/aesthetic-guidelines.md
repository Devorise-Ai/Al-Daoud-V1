# Aesthetic Guidelines

## Choosing an Aesthetic Direction

The aesthetic must serve the project's purpose and audience. Here are proven directions with guidance on when each works best:

### Dark Luxury / Industrial
**Best for**: Dashboards, admin panels, sports/gaming, fintech, developer tools
- Deep blacks (#050505-#0e0e0e) with subtle borders (white/4%)
- Emerald, amber, or violet accent colors at low opacity
- Zinc color hierarchy for text (white → zinc-400 → zinc-600)
- Gradient accent buttons with hover lifts and shadows
- Uppercase tracking-wider labels

### Minimalist Editorial
**Best for**: Portfolios, blogs, content-heavy sites, luxury brands
- Generous whitespace, asymmetric layouts
- Strong typographic hierarchy with display fonts
- Monochromatic with one sharp accent
- Large-scale imagery, editorial grid
- Restrained animation — only on meaningful interactions

### Warm Organic
**Best for**: Health/wellness, food, community, education
- Warm neutrals (cream, sand, terracotta)
- Rounded corners, soft shadows
- Hand-drawn or organic textures
- Serif headings, approachable body text
- Gentle fade-in animations

### Brutalist / Raw
**Best for**: Creative agencies, art, counterculture, experimental
- High contrast, raw edges
- Monospace or display fonts
- Visible grid, exposed structure
- Intentional "roughness" in spacing and alignment
- Bold color blocks, minimal gradients

### Retro-Futuristic
**Best for**: Tech startups, crypto, gaming, creative tools
- Neon accents on dark backgrounds
- Grid patterns, scanlines, glitch effects
- Mono or geometric fonts
- Terminal-inspired UI elements
- Animated gradients and particle effects

### Soft / Pastel
**Best for**: Consumer apps, social platforms, lifestyle, children's products
- Light backgrounds with pastel accents
- Rounded everything — corners, fonts, icons
- Playful micro-interactions
- Friendly sans-serif typography
- Subtle gradients and glassmorphism

## Typography Pairing

Distinctive typography is the single highest-impact design choice. Rules:

1. **Never default to system fonts or Inter/Roboto** — these signal "generic AI output"
2. **Pair a display font with a body font** — contrast creates hierarchy
3. **Match font personality to aesthetic** — geometric for modern, serif for editorial, mono for technical

### Recommended Pairings (examples, not defaults)
- **Outfit + DM Sans** — Modern, clean, slightly geometric
- **Playfair Display + Source Sans Pro** — Editorial elegance
- **Space Mono + Work Sans** — Technical, developer-friendly
- **Fraunces + Inter** — Warm, approachable with readable body
- **Clash Display + Satoshi** — Bold, contemporary startup feel
- **Instrument Serif + Instrument Sans** — Refined, cohesive family

Vary your choices between projects. Using the same pairing repeatedly defeats the purpose.

## Color Theory

### Building a Palette
1. **Start with the primary** — one color that carries the brand emotion
2. **Add a surface system** — background, card, elevated, overlay (3-5 levels)
3. **Define text hierarchy** — primary, secondary, tertiary, disabled (4 levels)
4. **Add semantic colors** — success, warning, error, info
5. **Create accent variations** — at 10%, 20%, 40% opacity for backgrounds/borders

### Dark Theme Specifics
- Never use pure #000000 — it's too harsh. Use #050505-#0a0a0a
- Card surfaces at #0e0e0e-#141414
- Borders at white/4%-8% — subtle enough to define edges without visual noise
- Text at white (primary), zinc-400 (secondary), zinc-600 (tertiary)
- Accent colors at reduced opacity for backgrounds (10-20%)

### Light Theme Specifics
- Never use pure #FFFFFF for backgrounds — use #FAFAFA or #F8F8F8
- Card surfaces slightly elevated from background
- Borders at black/5%-10%
- Text at zinc-900 (primary), zinc-600 (secondary), zinc-400 (tertiary)

## Spatial Composition

### Breaking the Grid
- Overlap elements to create depth
- Use asymmetric margins for visual interest
- Let some elements break column boundaries
- Generous negative space is better than cramped layouts

### Visual Hierarchy
1. Size — larger elements attract first
2. Contrast — higher contrast draws attention
3. Position — top-left (LTR) or top-right (RTL) gets scanned first
4. Isolation — elements with space around them stand out
5. Motion — animated elements catch the eye (use sparingly)

## Animation Principles

### High-Impact Moments
Focus animation budget on:
1. **Page load** — staggered reveals with `animation-delay` create delight
2. **State transitions** — smooth changes between loading/loaded/error
3. **Scroll triggers** — elements appearing as user scrolls
4. **Hover states** — subtle lifts, glows, or color shifts

### Technical Guidelines
- Use CSS transitions for simple state changes (hover, focus)
- Use CSS animations for entrance effects
- Use Framer Motion / Motion library for complex React animations
- Always wrap in `@media (prefers-reduced-motion: no-preference)` or check the media query
- Keep durations between 150ms-400ms — faster for small elements, slower for large
- Use ease-out for entrances, ease-in for exits, ease-in-out for state changes

## Backgrounds & Atmosphere

Don't default to flat solid colors. Create depth:

- **Gradient meshes** — subtle multi-stop gradients that create atmosphere
- **Noise textures** — grain overlays at 2-5% opacity add tactile quality
- **Geometric patterns** — dot grids, line patterns at very low opacity
- **Ambient glows** — large blurred circles of accent color at 2-5% opacity
- **Layered transparency** — overlapping semi-transparent elements
- **Dramatic shadows** — colored shadows that match the accent palette

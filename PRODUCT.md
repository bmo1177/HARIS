# HARIS — product context

Captured for the visual redesign, so the reasoning behind the current design
survives past the commit that introduced it.

## What it is

A cybersecurity awareness trainer. A student pastes a message, or works through
a scenario, or sits through a simulated scam call, and learns to recognise the
warning signs themselves rather than being told about them.

## Who it is for

**Primary: cybersecurity master's students.** This is the audience the visual
design is tuned for, and it drives most of the decisions below.

Secondary: secondary-school students (K11–K12), which is what the original brief
named and what the bilingual content and gamified XP loop are built around.

These two are not the same, and the tension is worth naming rather than
averaging away. A K11 audience rewards play; a master's audience rewards
precision. The resolution here is to make the surface instrument-grade and let
the reward loop carry the playfulness — XP, levels and the clue-reveal mechanic
are the game, and they are unchanged.

### What a master's student actually wants

- **Signal density.** They are used to tools that show a lot at once. Dashes are
  not decoration; they are untrustworthy.
- **Evidence.** A verdict with no visible reasoning is marketing. The clue-reveal
  structure is the product, not a flourish.
- **Legitimacy.** The aesthetic should read as security tooling, because that is
  what earns trust in a verdict. Anything that looks like a consumer "security
  app" undercuts the advice.
- **Bilingual, genuinely.** Arabic is not decoration. `lang` and `dir` are
  correct, and Arabic typography is a first-class concern (see below).

## Design principles

1. **Instrument, not toy.** The visual language is a diagnostic console. Restrained
   dark surfaces, one accent, semantic status colour carrying real meaning. No
   scanlines, no glitch, no neon glow — those read as costume and this audience
   will notice.
2. **The score is the hero.** Risk scoring is the thing being communicated.
   Typography, spacing and colour all defer to it.
3. **Monospace means data.** Reserved for measurements, counts, scores and
   identifiers. Never as decoration. This is the line between "instrument" and
   "hacker aesthetic", and it is not negotiable.
4. **Type is load-bearing.** The app teaches through prose as well as through
   interaction, so long-form readability outranks trendiness. One superfamily:
   IBM Plex Sans, IBM Plex Sans Arabic, IBM Plex Mono.
5. **Colour means status, never decoration.** Green / amber / red only ever mean
   safe / suspicious / dangerous. All three are solved numerically to clear 4.5:1
   against their own surface in both themes.
6. **Both themes are first-class.** Dark is the default because the audience works
   in dark rooms; light is fully supported, not an afterthought.
7. **Arabic is a different typographic problem, not a mirror.** Plex Sans Arabic
   has different metrics and rhythm. Latin digits are kept in Arabic UI because in
   a security tool the numbers carry meaning. Attack-type names stay in English
   because they are the exact strings the model returns.

## Constraints carried from the engineering side

These are not aesthetic preferences and must not be traded away for a look.

- Contrast: body text ≥ 4.5:1, large text ≥ 3:1, in **both** themes. Verified
  numerically, not by eye.
- `prefers-reduced-motion` is honoured globally.
- Keyboard reachable throughout; visible focus rings everywhere.
- RTL must not overflow at 320px in either language.
- The bundle is a budget. Fonts are self-hosted via `@fontsource`, subset
  woff2, no external CDN request — a school network and a privacy consideration
  both argue against a third-party font host.

## What this is not

Not a gamified consumer security app. Not a CTF. Not a neon cyberpunk
aesthetic. The XP system is the game; the rest of the surface is an instrument.

# CrungoDice

A first playable prototype for the Hebrew dice-and-decipher game, built with React, TypeScript, Vite, Three.js, and `@react-three/fiber`.

## Included in this prototype

- Eight interactive 3D Hebrew letter dice
- Click to select dice in sequence
- Double-click an unselected die to spend a reroll
- Submit valid prototype spellings and consume their dice
- Cached spelling stacks in a retractable left repository
- One generated meaning card per produced copy
- Retractable decipher deck at the bottom
- Match a meaning card to a spelling stack to consume both and score
- Minimalist incremental-game presentation

The vocabulary is intentionally hand-curated for the prototype. It is not yet a general Hebrew dictionary.

## Run locally

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## Current interaction model

- **Click a die:** add/remove it from the current spelling
- **Double-click a die:** reroll that individual die, if it is not selected
- **Submit:** consume selected dice and create a cached spelling plus meaning card
- **Select meaning card, then word stack:** attempt a decipher match
- **Repository tab / deck tab:** retract or expand the panels

## Current constraints

- The first prototype uses a tiny hard-coded word set.
- Dice animation is presentational rather than rigid-body physics.
- Meaning cards currently use emoji placeholders.
- Round targets, relics, shops, builds, progression, and a full Hebrew lexical dataset are not implemented yet.

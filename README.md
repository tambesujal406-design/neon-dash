# Neon Dash: a game on a custom ECS engine

A tiny game engine built on an Entity Component System, written in strict TypeScript. A small platformer is being built on top of it.

## How it works

- Entities are just IDs.
- Components are plain typed data (`Position`, `Velocity`, `Sprite`).
- Systems are functions that run every frame over the entities that have the components they need.
- Resources are world-wide singletons, like the score and lives (`world.getResource(GameState)`).

```ts
for (const [entity, pos, vel] of world.query(Position, Velocity)) {
  pos.x += vel.x * dt; // pos and vel are fully typed
}
```

The game loop uses a fixed timestep for logic and renders once per frame.

## Look and feel

- Neon dusk scene: gradient sky, twinkling stars, moon, shooting star, fireflies and three parallax layers that slide as the player moves
- Glowing platforms and a synthwave floor, spinning coins, a robot player with squash and stretch, wobbling enemies, a rippling goal flag
- Particles for dust, coin sparkles, stomps and a confetti burst on winning, plus screen shake on hits
- Animated HUD with a counting score, hearts for lives and a star rating on the end screen
- Effects are ordinary ECS parts: `Particle`, `Squash` and `Facing` components, `Time` and `Camera` resources, and systems that update them

## TypeScript features used

- Generics and variadic tuple types for the typed `query()`
- Branded types for `Entity`
- Interfaces for `System`, classes for components and systems
- `strict`, `noUncheckedIndexedAccess` and `verbatimModuleSyntax`

## Run it

```bash
npm install
npm run dev        # start the dev server
npm test           # unit tests
npm run typecheck  # type check only
npm run build      # production build in dist/
```

## Deploy

Push to `main`. The workflow in `.github/workflows/deploy.yml` tests, builds and publishes to GitHub Pages. In the repo settings, set Pages > Source to GitHub Actions.

## Roadmap

- [x] World, typed queries, game loop
- [x] Movement and render systems
- [x] Keyboard input system (arrow keys or A/D)
- [x] Gravity, jumping and collision with platforms
- [x] Coins, patrolling enemies, goal flag, score, lives and restart
- [x] Neon visual polish (parallax, particles, animation, HUD)
- [ ] Debug overlay (hitboxes, entity inspector)

# PokeDex

Live site: https://pokedex.aprameyak.workers.dev

A small Pokédex that runs on Cloudflare Workers. Search Pokémon by name or number, browse the full list, and build trainer teams of up to six.

## Features

- Search by name or Pokédex number
- Browse the full Pokédex
- Trainer team builder backed by Cloudflare D1

## Stack

- Cloudflare Workers with static assets
- Cloudflare D1
- Plain HTML, CSS and JavaScript

## API

| Endpoint | Description |
| --- | --- |
| `GET /api/pokemon?name=` | Search by name or id |
| `GET /api/pokedex?search=` | Browse, or list all when empty |
| `GET /api/team?trainer=` | List a trainer's team |
| `POST /api/team` | Add a Pokémon, body `{ "trainer", "pokemon" }` |

## Development

```sh
npm install
npx wrangler d1 execute pokedex-db --local --file migrations/0001_init.sql
npx wrangler dev
```

Deploy with `npx wrangler deploy`.

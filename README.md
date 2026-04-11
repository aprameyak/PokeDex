# Pokedex Online

A web-based Pokedex built with Flask. Search for Pokemon, manage trainer teams, browse sprites, and pull live stats from external APIs.

## Features

- **Pokemon Search** — search the National Pokedex by name
- **Team Builder** — create and look up trainer teams stored in a local database
- **Pokedex Browser** — server-rendered search results page
- **Sprite Upload** — upload custom Pokemon sprites to the gallery
- **Battle Stats** — fetch live stat data from an external Pokedex API

## Setup

**Requirements:** Python 3.10+

```bash
pip install -r requirements.txt
python init_db.py
python app.py
```

The app runs on `http://localhost:8080` by default.

## Project Structure

```
.
├── app.py              # Flask application and API routes
├── init_db.py          # Database initialization script
├── pokedex.csv         # Pokedex data (Gen 1–8)
├── pokedex.db          # SQLite database (created on first run)
├── requirements.txt
├── static/
│   ├── app.js          # Frontend logic
│   └── style.css       # Styles
├── templates/
│   ├── index.html      # Main page
│   └── search.html     # Search results page
└── uploads/            # Uploaded sprites
```

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pokemon?name=<name>` | Search Pokedex by name |
| POST | `/api/team` | Add a Pokemon to a trainer's team |
| GET | `/api/team?trainer=<name>` | Get a trainer's team |
| GET | `/api/pokedex?search=<query>` | Server-rendered Pokedex search |
| POST | `/api/upload-sprite` | Upload a sprite image |
| GET | `/api/stats?pokemon=<url>` | Fetch stats from an external API |

## Data

Pokemon data sourced from the public domain Pokedex CSV dataset (Gen 1–8, 800+ entries). All Pokemon names, types, and stats are property of Nintendo / Game Freak. This is an unofficial fan project.

import sqlite3

conn = sqlite3.connect("pokedex.db")
c = conn.cursor()

c.execute("""
CREATE TABLE IF NOT EXISTS pokemon (
    id INTEGER PRIMARY KEY,
    name TEXT,
    type1 TEXT,
    type2 TEXT,
    hp INTEGER,
    attack INTEGER,
    defense INTEGER,
    speed INTEGER
)
""")

c.execute("""
CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trainer TEXT,
    pokemon TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
""")

c.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    password TEXT,
    role TEXT DEFAULT 'trainer'
)
""")

pokemon_data = [
    (1, "bulbasaur", "grass", "poison", 45, 49, 49, 45),
    (4, "charmander", "fire", None, 39, 52, 43, 65),
    (7, "squirtle", "water", None, 44, 48, 65, 43),
    (25, "pikachu", "electric", None, 35, 55, 40, 90),
    (39, "jigglypuff", "normal", "fairy", 115, 45, 20, 20),
    (52, "meowth", "normal", None, 40, 45, 35, 90),
    (94, "gengar", "ghost", "poison", 60, 65, 60, 110),
    (130, "gyarados", "water", "flying", 95, 125, 79, 81),
    (143, "snorlax", "normal", None, 160, 110, 65, 30),
    (150, "mewtwo", "psychic", None, 106, 110, 90, 130),
    (151, "mew", "psychic", None, 100, 100, 100, 100),
]

c.executemany(
    "INSERT OR IGNORE INTO pokemon (id, name, type1, type2, hp, attack, defense, speed) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    pokemon_data
)

c.execute("INSERT OR IGNORE INTO users (username, password, role) VALUES ('ash', 'pikachu123', 'trainer')")
c.execute("INSERT OR IGNORE INTO users (username, password, role) VALUES ('admin', 'sup3rs3cr3t', 'admin')")
c.execute("INSERT OR IGNORE INTO users (username, password, role) VALUES ('misty', 'starmie', 'trainer')")

conn.commit()
conn.close()
print("Database initialized.")

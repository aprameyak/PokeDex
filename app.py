import os
import sqlite3
import urllib.request
from flask import Flask, request, jsonify, render_template, send_from_directory
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = "uploads"
os.makedirs("uploads", exist_ok=True)

DB_PATH = "pokedex.db"


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ── Frontend ──────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


# ── 1. Command Injection ──────────────────────────────────────────────────────
# GET /api/pokemon?name=pikachu
# Vulnerable: unsanitised input passed directly to shell via os.system
@app.route("/api/pokemon")
def get_pokemon():
    name = request.args.get("name", "")
    output_file = "/tmp/pokedex_result.txt"
    # VULNERABLE: name is not sanitised before being interpolated into the shell command
    os.system(f"grep -i {name} pokedex.csv > {output_file} 2>&1")
    try:
        with open(output_file) as f:
            raw = f.read().strip()
    except FileNotFoundError:
        raw = ""

    results = []
    for line in raw.splitlines():
        parts = line.split(",")
        if len(parts) >= 8:
            results.append({
                "id": parts[0],
                "name": parts[1],
                "type1": parts[2],
                "type2": parts[3],
                "hp": parts[4],
                "attack": parts[5],
                "defense": parts[6],
                "speed": parts[7],
            })

    # raw_output is included so injected command output is visible in the response
    return jsonify({"query": name, "results": results, "raw_output": raw})


# ── 2. SQL Injection ──────────────────────────────────────────────────────────
# POST /api/team  body: {"trainer": "ash", "pokemon": "pikachu"}
# Vulnerable: trainer/pokemon values concatenated raw into SQL
@app.route("/api/team", methods=["POST"])
def add_to_team():
    data = request.get_json(force=True) or {}
    trainer = data.get("trainer", "")
    pokemon = data.get("pokemon", "")

    conn = get_db()
    try:
        # VULNERABLE: raw string concatenation — no parameterisation
        query = f"INSERT INTO teams (trainer, pokemon) VALUES ('{trainer}', '{pokemon}')"
        conn.execute(query)
        conn.commit()
        return jsonify({"status": "ok", "message": f"{pokemon} added to {trainer}'s team"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400
    finally:
        conn.close()


@app.route("/api/team", methods=["GET"])
def get_team():
    trainer = request.args.get("trainer", "")
    conn = get_db()
    try:
        # VULNERABLE: same raw concat pattern on GET
        query = f"SELECT * FROM teams WHERE trainer = '{trainer}'"
        rows = conn.execute(query).fetchall()
        return jsonify({"trainer": trainer, "team": [dict(r) for r in rows]})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400
    finally:
        conn.close()


# ── 3. Reflected XSS ─────────────────────────────────────────────────────────
# GET /api/pokedex?search=<input>
# Vulnerable: search term reflected into HTML without escaping
@app.route("/api/pokedex")
def pokedex_search():
    search = request.args.get("search", "")
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM pokemon WHERE name LIKE ?", (f"%{search}%",)
    ).fetchall()
    conn.close()

    results = [dict(r) for r in rows]

    # VULNERABLE: search passed to template with | safe — XSS via Jinja2 autoescaping bypass
    return render_template("search.html", search=search, count=len(results), results=results)


# ── 4. Unrestricted File Upload ───────────────────────────────────────────────
# POST /api/upload-sprite  multipart form field: "sprite"
# Vulnerable: no extension or MIME-type validation
@app.route("/api/upload-sprite", methods=["POST"])
def upload_sprite():
    if "sprite" not in request.files:
        return jsonify({"status": "error", "message": "No file provided"}), 400

    file = request.files["sprite"]
    if file.filename == "":
        return jsonify({"status": "error", "message": "Empty filename"}), 400

    # VULNERABLE: accepts any file type, no MIME or extension check
    filename = secure_filename(file.filename)
    save_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(save_path)

    return jsonify({
        "status": "ok",
        "message": "Sprite uploaded successfully",
        "path": f"/uploads/{filename}",
    })


@app.route("/uploads/<path:filename>")
def uploaded_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


# ── 5. SSRF ───────────────────────────────────────────────────────────────────
# GET /api/stats?pokemon=http://pokeapi.co/api/v2/pokemon/pikachu
# Vulnerable: user-supplied URL fetched server-side without restriction
@app.route("/api/stats")
def get_stats():
    url = request.args.get("pokemon", "")
    if not url:
        return jsonify({"status": "error", "message": "No pokemon URL provided"}), 400

    try:
        # VULNERABLE: fetches any URL the user provides — internal network reachable
        with urllib.request.urlopen(url, timeout=5) as resp:
            content_type = resp.headers.get("Content-Type", "")
            body = resp.read(4096).decode("utf-8", errors="replace")
        return jsonify({"status": "ok", "content_type": content_type, "data": body})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if not os.path.exists(DB_PATH):
        import init_db  # noqa: F401
    app.run(host="0.0.0.0", port=8080, debug=True)

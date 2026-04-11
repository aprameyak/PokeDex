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


# ── GET /api/pokemon?name=pikachu ─────────────────────────────────────────────
@app.route("/api/pokemon")
def get_pokemon():
    name = request.args.get("name", "")
    output_file = "/tmp/pokedex_result.txt"
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

    return jsonify({"query": name, "results": results, "raw_output": raw})


# ── POST /api/team  body: {"trainer": "ash", "pokemon": "pikachu"} ────────────
@app.route("/api/team", methods=["POST"])
def add_to_team():
    data = request.get_json(force=True) or {}
    trainer = data.get("trainer", "")
    pokemon = data.get("pokemon", "")

    conn = get_db()
    try:
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
        query = f"SELECT * FROM teams WHERE trainer = '{trainer}'"
        rows = conn.execute(query).fetchall()
        return jsonify({"trainer": trainer, "team": [dict(r) for r in rows]})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400
    finally:
        conn.close()


# ── GET /api/pokedex?search=<query> ──────────────────────────────────────────
@app.route("/api/pokedex")
def pokedex_search():
    search = request.args.get("search", "")
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM pokemon WHERE name LIKE ?", (f"%{search}%",)
    ).fetchall()
    conn.close()

    results = [dict(r) for r in rows]
    return render_template("search.html", search=search, count=len(results), results=results)


# ── POST /api/upload-sprite  multipart field: "sprite" ───────────────────────
@app.route("/api/upload-sprite", methods=["POST"])
def upload_sprite():
    if "sprite" not in request.files:
        return jsonify({"status": "error", "message": "No file provided"}), 400

    file = request.files["sprite"]
    if file.filename == "":
        return jsonify({"status": "error", "message": "Empty filename"}), 400

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


# ── GET /api/stats?pokemon=<url> ─────────────────────────────────────────────
@app.route("/api/stats")
def get_stats():
    url = request.args.get("pokemon", "")
    if not url:
        return jsonify({"status": "error", "message": "No pokemon URL provided"}), 400

    try:
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

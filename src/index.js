import pokemon from "./pokemon.json";

const NAME_PATTERN = /^[\p{L}\p{N} .'-]{1,40}$/u;
const MAX_TEAM_SIZE = 6;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

const search = (term) => {
  const q = term.trim().toLowerCase();
  if (!q) return [];
  return pokemon.filter((p) => p.name.includes(q) || String(p.id) === q);
};

async function handleTeam(request, env, url) {
  if (request.method === "GET") {
    const trainer = (url.searchParams.get("trainer") || "").trim();
    if (!NAME_PATTERN.test(trainer)) {
      return json({ status: "error", message: "Invalid trainer name" }, 400);
    }
    const { results } = await env.DB.prepare(
      "SELECT trainer, pokemon, created_at FROM teams WHERE trainer = ? ORDER BY id"
    )
      .bind(trainer)
      .all();
    return json({ trainer, team: results });
  }

  if (request.method === "POST") {
    let data;
    try {
      data = await request.json();
    } catch {
      return json({ status: "error", message: "Invalid JSON" }, 400);
    }
    const trainer = String(data?.trainer ?? "").trim();
    const name = String(data?.pokemon ?? "").trim().toLowerCase();
    if (!NAME_PATTERN.test(trainer)) {
      return json({ status: "error", message: "Invalid trainer name" }, 400);
    }
    const match = pokemon.find((p) => p.name === name);
    if (!match) {
      return json({ status: "error", message: "Unknown Pokémon" }, 400);
    }
    const count = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM teams WHERE trainer = ?"
    )
      .bind(trainer)
      .first("n");
    if (count >= MAX_TEAM_SIZE) {
      return json({ status: "error", message: "Team is full" }, 400);
    }
    await env.DB.prepare("INSERT INTO teams (trainer, pokemon) VALUES (?, ?)")
      .bind(trainer, match.name)
      .run();
    return json({
      status: "ok",
      message: `${match.name} added to ${trainer}'s team`,
    });
  }

  return json({ status: "error", message: "Method not allowed" }, 405);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/pokemon" && request.method === "GET") {
      const name = url.searchParams.get("name") || "";
      return json({ query: name, results: search(name) });
    }

    if (url.pathname === "/api/pokedex" && request.method === "GET") {
      const term = (url.searchParams.get("search") || "").trim().toLowerCase();
      const results = term ? search(term) : pokemon;
      return json({ search: term, count: results.length, results });
    }

    if (url.pathname === "/api/team") {
      return handleTeam(request, env, url);
    }

    if (url.pathname.startsWith("/api/")) {
      return json({ status: "error", message: "Not found" }, 404);
    }

    return env.ASSETS.fetch(request);
  },
};

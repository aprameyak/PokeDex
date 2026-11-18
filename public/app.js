const el = (id) => document.getElementById(id);

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);

const typeTag = (type) => {
  if (!type) return "";
  const safe = String(type).toLowerCase().replace(/[^a-z]/g, "");
  return `<span class="tag tag-${safe}">${escapeHtml(type)}</span>`;
};

const statBar = (label, val, max = 160) => {
  const pct = Math.min(100, Math.round((Number(val) / max) * 100));
  return `
    <div class="stat-row">
      <span class="stat-label">${escapeHtml(label)}</span>
      <div class="stat-bar-wrap"><div class="stat-bar" style="width:${pct}%"></div></div>
      <span class="stat-val">${escapeHtml(val)}</span>
    </div>`;
};

const pokemonCard = (p) => `
  <div class="result-item">
    <strong>#${escapeHtml(p.id)} ${escapeHtml(p.name)}</strong>
    ${typeTag(p.type1)}${typeTag(p.type2)}
    ${statBar("HP", p.hp)}
    ${statBar("Attack", p.attack)}
    ${statBar("Defense", p.defense)}
    ${statBar("Speed", p.speed)}
  </div>`;

const message = (cls, text) => `<p class="${cls}">${escapeHtml(text)}</p>`;
const muted = (text) => `<p style="color:#aaa">${escapeHtml(text)}</p>`;

async function getJson(url, options) {
  const res = await fetch(url, options);
  return res.json();
}

async function searchPokemon() {
  const name = el("searchName").value.trim();
  if (!name) return;
  el("searchResults").innerHTML = muted("Searching...");
  try {
    const data = await getJson(`/api/pokemon?name=${encodeURIComponent(name)}`);
    el("searchResults").innerHTML = data.results.length
      ? data.results.map(pokemonCard).join("")
      : muted("No Pokémon found.");
  } catch (e) {
    el("searchResults").innerHTML = message("status-err", `Error: ${e.message}`);
  }
}

async function addToTeam() {
  const trainer = el("trainerName").value.trim();
  const pokemon = el("pokemonName").value.trim();
  if (!trainer || !pokemon) return;
  try {
    const data = await getJson("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trainer, pokemon }),
    });
    el("teamResults").innerHTML = message(
      data.status === "ok" ? "status-ok" : "status-err",
      data.message
    );
  } catch (e) {
    el("teamResults").innerHTML = message("status-err", `Error: ${e.message}`);
  }
}

async function lookupTeam() {
  const trainer = el("lookupTrainer").value.trim();
  if (!trainer) return;
  try {
    const data = await getJson(`/api/team?trainer=${encodeURIComponent(trainer)}`);
    if (data.status === "error") {
      el("teamResults").innerHTML = message("status-err", data.message);
      return;
    }
    el("teamResults").innerHTML = data.team.length
      ? data.team
          .map(
            (t) =>
              `<div class="result-item"><strong>${escapeHtml(t.trainer)}</strong> &rarr; ${escapeHtml(t.pokemon)} <span style="color:#777;font-size:.78rem">${escapeHtml(t.created_at)}</span></div>`
          )
          .join("")
      : muted("No team found.");
  } catch (e) {
    el("teamResults").innerHTML = message("status-err", `Error: ${e.message}`);
  }
}

async function dexSearch() {
  const term = el("dexSearch").value.trim();
  el("dexResults").innerHTML = muted("Loading...");
  try {
    const data = await getJson(`/api/pokedex?search=${encodeURIComponent(term)}`);
    el("dexResults").innerHTML = `<p style="color:#aaa">${escapeHtml(data.count)} found</p>${data.results
      .map(
        (p) =>
          `<div class="result-item"><strong>#${escapeHtml(p.id)} ${escapeHtml(p.name)}</strong> ${typeTag(p.type1)}${typeTag(p.type2)}</div>`
      )
      .join("")}`;
  } catch (e) {
    el("dexResults").innerHTML = message("status-err", `Error: ${e.message}`);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  el("searchName")?.addEventListener("keydown", (e) => e.key === "Enter" && searchPokemon());
  el("pokemonName")?.addEventListener("keydown", (e) => e.key === "Enter" && addToTeam());
  el("lookupTrainer")?.addEventListener("keydown", (e) => e.key === "Enter" && lookupTeam());
  el("dexSearch")?.addEventListener("keydown", (e) => e.key === "Enter" && dexSearch());
});

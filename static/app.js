/* ── Helpers ──────────────────────────────────────────────── */
function el(id) { return document.getElementById(id); }

function typeTag(type) {
  if (!type || type === "None") return "";
  return `<span class="tag tag-${type.toLowerCase()}">${type}</span>`;
}

function statBar(label, val, max = 160) {
  const pct = Math.min(100, Math.round((val / max) * 100));
  return `
    <div class="stat-row">
      <span class="stat-label">${label}</span>
      <div class="stat-bar-wrap"><div class="stat-bar" style="width:${pct}%"></div></div>
      <span class="stat-val">${val}</span>
    </div>`;
}

/* ── 1. Pokemon search (command injection endpoint) ──────── */
async function searchPokemon() {
  const name = el("searchName").value.trim();
  if (!name) return;
  el("searchResults").innerHTML = '<p style="color:#aaa">Searching...</p>';
  try {
    const res = await fetch(`/api/pokemon?name=${encodeURIComponent(name)}`);
    const data = await res.json();
    if (!data.results || data.results.length === 0) {
      el("searchResults").innerHTML = '<p style="color:#aaa">No Pok\u00e9mon found.</p>';
      return;
    }
    el("searchResults").innerHTML = data.results.map(p => `
      <div class="result-item">
        <strong>#${p.id} ${p.name}</strong>
        ${typeTag(p.type1)}${typeTag(p.type2)}
        ${statBar("HP",      p.hp)}
        ${statBar("Attack",  p.attack)}
        ${statBar("Defense", p.defense)}
        ${statBar("Speed",   p.speed)}
      </div>`).join("");
  } catch (e) {
    el("searchResults").innerHTML = `<p class="status-err">Error: ${e.message}</p>`;
  }
}

/* ── 2. Team builder (SQL injection endpoint) ────────────── */
async function addToTeam() {
  const trainer = el("trainerName").value.trim();
  const pokemon = el("pokemonName").value.trim();
  if (!trainer || !pokemon) return;
  try {
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trainer, pokemon }),
    });
    const data = await res.json();
    el("teamResults").innerHTML = `<p class="${data.status === "ok" ? "status-ok" : "status-err"}">${data.message}</p>`;
  } catch (e) {
    el("teamResults").innerHTML = `<p class="status-err">Error: ${e.message}</p>`;
  }
}

async function lookupTeam() {
  const trainer = el("lookupTrainer").value.trim();
  if (!trainer) return;
  try {
    const res = await fetch(`/api/team?trainer=${encodeURIComponent(trainer)}`);
    const data = await res.json();
    if (!data.team || data.team.length === 0) {
      el("teamResults").innerHTML = '<p style="color:#aaa">No team found.</p>';
      return;
    }
    el("teamResults").innerHTML = data.team.map(t =>
      `<div class="result-item"><strong>${t.trainer}</strong> &rarr; ${t.pokemon} <span style="color:#777;font-size:.78rem">${t.created_at || ""}</span></div>`
    ).join("");
  } catch (e) {
    el("teamResults").innerHTML = `<p class="status-err">Error: ${e.message}</p>`;
  }
}

/* ── 3. Pokedex browser (reflected XSS endpoint) ─────────── */
function dexSearch() {
  const term = el("dexSearch").value;
  // Opens the XSS-vulnerable server-rendered page in an iframe
  const iframe = document.createElement("iframe");
  iframe.src = `/api/pokedex?search=${encodeURIComponent(term)}`;
  iframe.style.cssText = "width:100%;height:300px;border:none;border-radius:6px;margin-top:10px;background:#fff";
  const container = el("dexResults");
  container.innerHTML = "";
  container.appendChild(iframe);
}

/* ── 4. Sprite upload (unrestricted upload endpoint) ─────── */
async function uploadSprite() {
  const fileInput = el("spriteFile");
  if (!fileInput.files.length) return;
  const formData = new FormData();
  formData.append("sprite", fileInput.files[0]);
  try {
    const res = await fetch("/api/upload-sprite", { method: "POST", body: formData });
    const data = await res.json();
    if (data.status === "ok") {
      el("uploadResult").innerHTML = `
        <p class="status-ok">${data.message}</p>
        <p>Saved to: <code>${data.path}</code></p>`;
    } else {
      el("uploadResult").innerHTML = `<p class="status-err">${data.message}</p>`;
    }
  } catch (e) {
    el("uploadResult").innerHTML = `<p class="status-err">Error: ${e.message}</p>`;
  }
}

/* ── 5. Stats fetcher (SSRF endpoint) ───────────────────── */
async function fetchStats() {
  const url = el("statsUrl").value.trim();
  if (!url) return;
  el("statsResult").innerHTML = '<p style="color:#aaa">Fetching...</p>';
  try {
    const res = await fetch(`/api/stats?pokemon=${encodeURIComponent(url)}`);
    const data = await res.json();
    if (data.status === "ok") {
      let preview = data.data;
      try {
        const parsed = JSON.parse(data.data);
        preview = JSON.stringify(parsed, null, 2);
      } catch (_) {}
      el("statsResult").innerHTML = `
        <p class="status-ok">Fetched (<code>${data.content_type}</code>)</p>
        <pre>${preview.slice(0, 2000)}</pre>`;
    } else {
      el("statsResult").innerHTML = `<p class="status-err">${data.message}</p>`;
    }
  } catch (e) {
    el("statsResult").innerHTML = `<p class="status-err">Error: ${e.message}</p>`;
  }
}

/* ── Enter key support ────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  el("searchName")   ?.addEventListener("keydown", e => e.key === "Enter" && searchPokemon());
  el("pokemonName")  ?.addEventListener("keydown", e => e.key === "Enter" && addToTeam());
  el("lookupTrainer")?.addEventListener("keydown", e => e.key === "Enter" && lookupTeam());
  el("dexSearch")    ?.addEventListener("keydown", e => e.key === "Enter" && dexSearch());
  el("statsUrl")     ?.addEventListener("keydown", e => e.key === "Enter" && fetchStats());
});

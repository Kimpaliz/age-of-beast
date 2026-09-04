/* [Aufgabe: Prüfwesen] Der eine Weg zu GitHub — Token, Repo, Aufrufe.

   Warum eine eigene Datei: Der Zugang ist die einzige Stelle im ganzen
   Skill, die mit einem fremden Dienst spricht. Sie steht getrennt, damit
   `vorgaenge.mjs` nur noch die **Formen** kennt und `pruefe-vorgaenge.mjs`
   ohne Netz laufen kann, indem es diese Datei schlicht nicht lädt.

   ── Woher der Token kommt, in dieser Reihenfolge ────────────────────

   1. `GITHUB_TOKEN` aus der Umgebung — was ein Arbeitsablauf setzt.
   2. `gh auth token` — wenn das GitHub-Kommando installiert ist.
   3. `git credential fill` — der Anmeldespeicher von Git selbst.
      Plattformübergreifend: Windows-Anmeldeinformationen, macOS-Schlüssel-
      bund, libsecret. **Das ist der Weg, der ohne Zusatzwerkzeug geht.**

   Der Token wird **nie** ausgegeben, nie in eine Datei geschrieben und
   nie in eine Fehlermeldung gehängt — auch nicht gekürzt. Ein Token in
   einem Protokoll ist ein Token in der Git-Historie.

   ── Arbeitet zusammen mit ───────────────────────────────────────────

   `vorgaenge.mjs` (legt Vorgänge an) und `pruefe-vorgaenge.mjs` (nur mit
   `--online`). `helfer.mjs` wird hier bewusst **nicht** geladen: Diese
   Datei soll auch außerhalb eines eingerichteten Projekts laufen. */

import { spawnSync } from "node:child_process";

/* Ein Befehl, dessen Ausgabe wir brauchen. Schlägt er fehl, ist das kein
   Fehler, sondern eine Antwort: „diesen Weg gibt es hier nicht." */
const still = (befehl, argumente, eingabe) => {
  const r = spawnSync(befehl, argumente, { encoding: "utf8", input: eingabe });
  return r.status === 0 ? (r.stdout || "").trim() : null;
};

/* Das Repository aus der Git-Fernstelle. Beide Schreibweisen kommen vor:
   https://github.com/owner/name.git und git@github.com:owner/name.git */
export function repoBestimmen(vorgabe) {
  if (vorgabe) return vorgabe;
  const url = still("git", ["remote", "get-url", "origin"]);
  if (!url) return null;
  const t = url.match(/github\.com[/:]([^/]+)\/(.+?)(?:\.git)?$/);
  return t ? `${t[1]}/${t[2]}` : null;
}

export function tokenHolen() {
  if (process.env.GITHUB_TOKEN) return { token: process.env.GITHUB_TOKEN, quelle: "GITHUB_TOKEN" };

  const ausGh = still("gh", ["auth", "token"]);
  if (ausGh) return { token: ausGh, quelle: "gh auth token" };

  /* Git fragt seinen eigenen Anmeldespeicher. Die Antwort ist ein Block
     aus `schlüssel=wert`-Zeilen; uns interessiert `password`. */
  const antwort = still("git", ["credential", "fill"],
    "protocol=https\nhost=github.com\n\n");
  if (antwort) {
    const zeile = antwort.split(/\r?\n/).find((z) => z.startsWith("password="));
    if (zeile) return { token: zeile.slice("password=".length), quelle: "git credential" };
  }
  return { token: null, quelle: null };
}

/* Ein Aufruf an die GitHub-Schnittstelle.

   Wirft bei einem Fehlschlag eine Ausnahme mit Status und Meldung von
   GitHub — aber **ohne** den Token und ohne die gesendeten Kopfzeilen. */
export async function api(pfad, { token, methode = "GET", rumpf } = {}) {
  const antwort = await fetch("https://api.github.com" + pfad, {
    method: methode,
    headers: {
      Authorization: "Bearer " + token,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "alpha-code"
    },
    body: rumpf ? JSON.stringify(rumpf) : undefined
  });
  const text = await antwort.text();
  if (!antwort.ok) {
    let meldung = text.slice(0, 300);
    try { meldung = JSON.parse(text).message || meldung; } catch { /* Rohtext */ }
    const f = new Error(`GitHub ${antwort.status}: ${meldung}`);
    f.status = antwort.status;
    throw f;
  }
  return text ? JSON.parse(text) : null;
}

/* Alle Seiten einer Liste. GitHub gibt höchstens 100 je Seite; wer das
   vergisst, misst ein Projekt mit 150 Vorgängen als eines mit 100
   (Fehlerbuch B3: ein zu ordentliches Ergebnis ist ein Verdacht). */
export async function alleSeiten(pfad, zugang) {
  const raus = [];
  for (let seite = 1; seite <= 20; seite++) {
    const teil = await api(`${pfad}${pfad.includes("?") ? "&" : "?"}per_page=100&page=${seite}`, zugang);
    if (!Array.isArray(teil) || teil.length === 0) break;
    raus.push(...teil);
    if (teil.length < 100) break;
  }
  return raus;
}

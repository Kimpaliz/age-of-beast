/**
 * Liest und schreibt die Weltdaten direkt im GitHub-Repository.
 *
 * Damit braucht das Wiki keinen Server und keinen Datenbankanbieter mehr.
 * Die Wahrheit liegt als Datei im Repository, jede Aenderung ist ein Commit
 * – mit vollstaendiger Geschichte und jederzeit ruecknehmbar.
 *
 * Reine Logik ueber `fetch`, kein DOM. Dadurch laeuft dieses Modul im
 * Browser und in Node und laesst sich mit `pruefe-github.mjs` pruefen,
 * ohne dass dabei irgendetwas geschrieben wird.
 *
 * ------------------------------------------------------------------
 * Warum ein Schluessel und keine Anmeldung mit Knopf
 * ------------------------------------------------------------------
 * GitHub Pages liefert nur Dateien aus; dort laeuft kein Programm, das ein
 * Geheimnis verwahren koennte. Eine richtige GitHub-Anmeldung ist im Browser
 * ausserdem gar nicht abschliessbar: Der Anmelde-Endpunkt von GitHub erlaubt
 * keine Browser-Anfragen. Nachgeprueft am 25.08.2026.
 *
 * Deshalb der Schluessel. Er sollte fein zugeschnitten sein:
 *   - nur dieses eine Repository
 *   - nur "Contents: Read and write"
 * Dann kann er nichts anderes anfassen, und jede Aenderung ist ohnehin ein
 * Commit, den man zuruecknehmen kann.
 */

export const REPO = {
  besitzer: 'Kimpaliz',
  name: 'age-of-beast',
  zweig: 'main',
};

const API = 'https://api.github.com';
const VERSION = '2022-11-28';
const WELT_DATEIEN = ['daten/quelle.json', 'daten/welt.json', 'daten/welt.js'];
const QUELLEN_PFAD = WELT_DATEIEN[0];

/* ------------------------------------------------------------------ *
 * Zeichen und Base64
 * ------------------------------------------------------------------ */

/** Text zu Base64 – auch fuer Umlaute und grosse Dateien. */
export function alsBase64(text) {
  const bytes = new TextEncoder().encode(text);
  // In Stuecken, sonst ueberlaeuft bei grossen Dateien der Aufrufstapel.
  const STUECK = 0x8000;
  let roh = '';
  for (let i = 0; i < bytes.length; i += STUECK) {
    roh += String.fromCharCode(...bytes.subarray(i, i + STUECK));
  }
  return btoa(roh);
}

/** Base64 zurueck zu Text. GitHub bricht die Zeilen um; das faellt hier weg. */
export function ausBase64(base64) {
  const roh = atob(String(base64 ?? '').replace(/\s/g, ''));
  const bytes = Uint8Array.from(roh, (zeichen) => zeichen.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/* ------------------------------------------------------------------ *
 * Anfragen
 * ------------------------------------------------------------------ */

/** Ein Fehler, der die Meldung von GitHub mitfuehrt. */
export class GitHubFehler extends Error {
  constructor(nachricht, status, antwort) {
    super(nachricht);
    this.name = 'GitHubFehler';
    this.status = status;
    this.antwort = antwort;
  }
}

async function anfragen(token, weg, einstellungen = {}) {
  const antwort = await fetch(API + weg, {
    ...einstellungen,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': VERSION,
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...(einstellungen.body ? { 'Content-Type': 'application/json' } : {}),
      ...(einstellungen.headers || {}),
    },
  });

  const text = await antwort.text();
  let inhalt = null;
  try { inhalt = text ? JSON.parse(text) : null; } catch { inhalt = text; }

  if (!antwort.ok) {
    const grund = (inhalt && inhalt.message) || antwort.statusText || 'unbekannt';
    throw new GitHubFehler(deutlicherGrund(antwort.status, grund), antwort.status, inhalt);
  }
  return inhalt;
}

/** Uebersetzt die haeufigsten Faelle in einen brauchbaren Satz. */
function deutlicherGrund(status, grund) {
  if (status === 401) return 'Der Schlüssel wird nicht anerkannt. Ist er abgelaufen oder widerrufen?';
  if (status === 403 && /rate limit/i.test(grund)) return 'GitHub bremst gerade wegen zu vieler Anfragen. In einer Minute noch einmal versuchen.';
  if (status === 403) return 'Der Schlüssel darf das nicht. Fehlt ihm „Contents: Read and write" für dieses Repository?';
  if (status === 404) return 'Nicht gefunden. Darf der Schlüssel auf dieses Repository zugreifen?';
  if (status === 409) return 'In der Zwischenzeit wurde etwas anderes gespeichert. Bitte die Seite neu laden.';
  if (status === 422) return 'GitHub hat die Änderung abgelehnt: ' + grund;
  return 'GitHub meldet ' + status + ': ' + grund;
}

/* ------------------------------------------------------------------ *
 * Lesen
 * ------------------------------------------------------------------ */

/**
 * Prueft einen Schluessel und gibt den Kontonamen zurueck.
 *
 * Fein zugeschnittene Schluessel duerfen `/user` nicht immer abfragen.
 * Deshalb wird zuerst das Repository geholt – das muss ohnehin gehen –
 * und der Name nur zusaetzlich versucht.
 */
export async function schluesselPruefen(token) {
  const repo = await anfragen(token, `/repos/${REPO.besitzer}/${REPO.name}`);
  if (!repo?.permissions?.push) {
    throw new GitHubFehler(
      'Der Schlüssel darf dieses Repository nur lesen, nicht beschreiben. ' +
        'Er braucht „Contents: Read and write".',
      403,
      null,
    );
  }
  let konto = REPO.besitzer;
  try {
    const nutzer = await anfragen(token, '/user');
    if (nutzer?.login) konto = nutzer.login;
  } catch { /* nicht schlimm: der Name ist nur fuer die Anzeige */ }
  return { konto, repo: repo.full_name };
}

/**
 * Holt eine Datei aus dem Repository.
 *
 * @returns {{text: string, sha: string}} `sha` ist die Kennung genau dieses
 *   Inhalts. Sie wird beim Speichern gebraucht, um zu erkennen, ob in der
 *   Zwischenzeit jemand anders etwas geaendert hat.
 */
export async function dateiLesen(token, pfad) {
  const antwort = await anfragen(
    token,
    `/repos/${REPO.besitzer}/${REPO.name}/contents/${pfad}?ref=${REPO.zweig}`,
  );
  if (!antwort || antwort.type !== 'file') {
    throw new GitHubFehler('„' + pfad + '" ist keine Datei.', 500, antwort);
  }
  return { text: ausBase64(antwort.content), sha: antwort.sha };
}

/* ------------------------------------------------------------------ *
 * Schreiben
 * ------------------------------------------------------------------ */

/** Lehnt unvollständige oder nicht zum Weltvertrag passende Aufträge ab. */
function schreibauftragPruefen(dateien, erwarteteSha, erwartetePfad) {
  if (!dateien || typeof dateien !== 'object' || Array.isArray(dateien)) {
    throw new GitHubFehler(
      'Der Schreibauftrag muss genau die drei Weltdateien enthalten.',
      400,
      null,
    );
  }

  const pfade = Object.keys(dateien);
  const hatGenauWeltDateien =
    pfade.length === WELT_DATEIEN.length &&
    WELT_DATEIEN.every((pfad) => Object.prototype.hasOwnProperty.call(dateien, pfad));
  if (!hatGenauWeltDateien) {
    throw new GitHubFehler(
      'Der Schreibauftrag muss genau daten/quelle.json, daten/welt.json und daten/welt.js enthalten.',
      400,
      null,
    );
  }

  for (const pfad of WELT_DATEIEN) {
    if (typeof dateien[pfad] !== 'string') {
      throw new GitHubFehler('Die Weltdatei „' + pfad + '“ muss Text enthalten.', 400, null);
    }
  }

  if (typeof erwarteteSha !== 'string' || !erwarteteSha.trim()) {
    throw new GitHubFehler(
      'Die Quellenkennung fehlt. Bitte die Seite neu laden, bevor du speicherst.',
      409,
      null,
    );
  }

  if (erwartetePfad !== QUELLEN_PFAD) {
    throw new GitHubFehler(
      'Die Quellenkennung gehört nicht zu daten/quelle.json. Bitte die Seite neu laden.',
      409,
      null,
    );
  }
}

/**
 * Legt mehrere Dateien in EINEM Commit ab.
 *
 * Warum nicht einfach dreimal einzeln speichern: Die drei Dateien unter
 * `daten/` muessen zueinander passen. Nach einem Commit, der nur eine davon
 * enthaelt, waere das Repository widerspruechlich – und die Pruefung im
 * Veroeffentlichungslauf wuerde zu Recht meckern. Deshalb der Umweg ueber
 * die Git-Schnittstelle: ein Commit, alle Dateien, oder gar nichts.
 *
 * @param {string} token
 * @param {object} auftrag
 * @param {Object<string,string>} auftrag.dateien   Pfad -> Inhalt
 * @param {string} auftrag.nachricht                Commit-Nachricht
 * @param {string} auftrag.erwarteteSha             Blob-Kennung der Quelldatei,
 *   so wie sie beim Laden war. Weicht sie ab, wird nicht geschrieben.
 * @param {'daten/quelle.json'} auftrag.erwartetePfad Zu welcher Datei die Kennung gehört
 * @returns {{commit: string, kurz: string}}
 */
export async function dateienSchreiben(token, auftrag) {
  const { dateien, nachricht, erwarteteSha, erwartetePfad } = auftrag || {};
  const basis = `/repos/${REPO.besitzer}/${REPO.name}`;

  // 0. Erst den vollständigen Schreibvertrag prüfen. Bei einem ungültigen
  //    Auftrag darf nicht einmal eine schreibende GitHub-Anfrage entstehen.
  schreibauftragPruefen(dateien, erwarteteSha, erwartetePfad);

  // 1. Wo steht der Zweig gerade?
  const verweis = await anfragen(token, `${basis}/git/ref/heads/${REPO.zweig}`);
  const letzterCommit = verweis.object.sha;

  // 2. Welchen Baum hat dieser Commit?
  const commit = await anfragen(token, `${basis}/git/commits/${letzterCommit}`);

  // 3. Die erwartete Quellen-SHA muss zum Baum genau dieses Heads gehören.
  //    Ein früherer Contents-Abruf wäre hier nicht ausreichend: Zwischen ihm
  //    und dem Commit-Aufbau könnte der Zweig weitergelaufen sein.
  const kopfBaum = await anfragen(token, `${basis}/git/trees/${commit.tree.sha}?recursive=1`);
  const quelleImKopf = Array.isArray(kopfBaum?.tree)
    ? kopfBaum.tree.find((eintrag) => eintrag.path === QUELLEN_PFAD && eintrag.type === 'blob')
    : null;
  if (!quelleImKopf || quelleImKopf.sha !== erwarteteSha) {
    throw new GitHubFehler(
      'In der Zwischenzeit wurde an anderer Stelle gespeichert. ' +
        'Bitte die Seite neu laden, damit nichts überschrieben wird.',
      409,
      null,
    );
  }

  // 4. Für jede Datei einen Blob anlegen
  const eintraege = [];
  for (const pfad of WELT_DATEIEN) {
    const inhalt = dateien[pfad];
    const blob = await anfragen(token, `${basis}/git/blobs`, {
      method: 'POST',
      body: JSON.stringify({ content: alsBase64(inhalt), encoding: 'base64' }),
    });
    eintraege.push({ path: pfad, mode: '100644', type: 'blob', sha: blob.sha });
  }

  // 5. Einen neuen Baum auf den alten aufsetzen
  const baum = await anfragen(token, `${basis}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({ base_tree: commit.tree.sha, tree: eintraege }),
  });

  // 6. Commit erzeugen
  const neuerCommit = await anfragen(token, `${basis}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({ message: nachricht, tree: baum.sha, parents: [letzterCommit] }),
  });

  // 7. Zweig weiterschieben. Ohne `force`: Ist inzwischen ein anderer Commit
  //    dazugekommen, lehnt GitHub ab, statt ihn zu ueberschreiben.
  await anfragen(token, `${basis}/git/refs/heads/${REPO.zweig}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: neuerCommit.sha, force: false }),
  });

  return { commit: neuerCommit.sha, kurz: neuerCommit.sha.slice(0, 7) };
}

/* ------------------------------------------------------------------ *
 * Veroeffentlichung beobachten
 * ------------------------------------------------------------------ */

/**
 * Fragt, ob der Veroeffentlichungslauf zu einem Commit schon fertig ist.
 *
 * @returns {{zustand: 'laeuft'|'fertig'|'fehlgeschlagen'|'unbekannt', adresse?: string}}
 */
export async function veroeffentlichungStand(token, commitSha) {
  try {
    const laeufe = await anfragen(
      token,
      `/repos/${REPO.besitzer}/${REPO.name}/actions/runs?head_sha=${commitSha}&per_page=1`,
    );
    const lauf = laeufe?.workflow_runs?.[0];
    if (!lauf) return { zustand: 'unbekannt' };
    if (lauf.status !== 'completed') return { zustand: 'laeuft', adresse: lauf.html_url };
    if (lauf.conclusion === 'success') return { zustand: 'fertig', adresse: lauf.html_url };
    return { zustand: 'fehlgeschlagen', adresse: lauf.html_url };
  } catch {
    return { zustand: 'unbekannt' };
  }
}

/* ===================================================================
   Age of Beast — die Kartendaten an einer Stelle
   [Aufgabe: Spielkarten]

   -------------------------------------------------------------------
   Lädt die Spielkarten (Domänen, Abstammungen, Gemeinschaften,
   Unterklassen) und die Gegenstände (Waffen, Rüstungen, Fundstücke) und
   macht sie über ihren Namen auffindbar.

   **Warum ein eigenes Modul:** Die Kartenseite und der Charakterbogen
   brauchen dieselben Daten. Lüde jede Seite sie für sich, liefen beide
   Auswertungen auseinander, sobald eine von ihnen ein Feld anders
   versteht.

   **Die Suche geht über den Namen, nicht über eine Kennung.** Auf einem
   Charakterbogen steht „Gambeson", nicht `ruestung-gambeson-armor-3`.
   Deshalb wird beim Nachschlagen normalisiert: Gross- und Kleinschrift
   egal, ein angehängtes „Armor" egal, Apostrophe egal.

   ⚠️ **Nicht jeder Gegenstand eines Bogens steht im Regelwerk.** Auf den
   Bögen der Runde stehen „Machete" und „Shortsword" — beide gibt es in
   Daggerheart nicht. `finde()` liefert dann `null`, und der Aufrufer
   zeigt das an, statt so zu tun, als gäbe es eine Karte.
   =================================================================== */

let geladen = null;

/* Für den Vergleich wird der Name auf seinen Kern gebracht. „Gambeson
   Armor", „gambeson" und „Gambeson-Rüstung" sollen dasselbe finden. */
function kern(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[’'`]/g, '')
    .replace(/\s*(armor|armour|rüstung|ruestung)\s*$/u, '')
    .replace(/[^a-z0-9äöüß]+/gu, '');
}

/**
 * Lädt beide Datensätze. Mehrfaches Aufrufen kostet nichts — das
 * Versprechen wird gemerkt.
 */
export function ladeKarten() {
  if (geladen) return geladen;

  geladen = (async () => {
    const holen = async (pfad) => {
      const antwort = await fetch(new URL(pfad, import.meta.url));
      if (!antwort.ok) throw new Error(pfad + ': HTTP ' + antwort.status);
      return antwort.json();
    };

    /* Beide Dateien parallel: Die Gegenstände sind klein, die Karten
       gross — nacheinander wäre die Summe, nebeneinander das Maximum. */
    const [karten, dinge] = await Promise.all([
      holen('../daten/daggerheart-karten.json').catch(() => ({ karten: [] })),
      holen('../daten/daggerheart-gegenstaende.json').catch(() => ({ gegenstaende: [] })),
    ]);

    const alle = [
      ...(karten.karten || []).map((k) => ({ ...k, quelleTyp: 'karte' })),
      ...(dinge.gegenstaende || []).map((g) => ({ ...g, quelleTyp: 'gegenstand' })),
    ];

    /* Bei Namensgleichheit gewinnt der erste Treffer. Das ist hier
       unkritisch: In den 393 Einträgen kommt kein Name zweimal vor —
       geprüft von `werkzeuge/pruefe-gegenstaende.mjs`. */
    const nachName = new Map();
    for (const e of alle) {
      const k = kern(e.name);
      if (k && !nachName.has(k)) nachName.set(k, e);
    }
    return { alle, nachName };
  })();

  return geladen;
}

/**
 * Sucht eine Karte oder einen Gegenstand über den Namen.
 * @returns {object|null} `null`, wenn es dazu nichts gibt.
 */
export async function finde(name) {
  if (!name) return null;
  const { nachName } = await ladeKarten();
  return nachName.get(kern(name)) || null;
}

/** Alles, was es gibt — für die Kartenseite. */
export async function alleEintraege() {
  return (await ladeKarten()).alle;
}

export { kern as namensKern };

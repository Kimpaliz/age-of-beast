/* [Aufgabe: Bearbeiten]
   Beschreibt neue Wiki-Einträge als reine Daten.

   Die Vorlage wird vom Browser und vom Prüfwächter gelesen. Deshalb stehen
   hier weder DOM-Zugriffe noch Node-Importe: Eine Stelle legt die Felder
   fest, damit Formular und Prüfung nicht auseinanderlaufen.
*/

/* Diese Schlüssel kommen in `daten/daggerheart-gegenstaende.json` als
   tatsächliche Gegenstandswerte vor. `id` und `name` sind Kennung bzw.
   Anzeigename eines Datensatzes und gehören deshalb nicht in diese Liste. */
export const GEGENSTAND_QUELLFELDER = Object.freeze([
  "art",
  "abStufe",
  "attribut",
  "reichweite",
  "schaden",
  "traglast",
  "merkmal",
  "wirkung",
  "quelle",
  "unsicher",
  "schwellen",
  "score",
  "schwellenStufen",
  "scoreStufen",
  "wurf",
]);

export const VORLAGEN = Object.freeze([
  {
    kennung: "npc",
    anzeigename: "NPC",
    zielkategorie: "characters",
    symbol: "☗",
    felder: [
      {
        schluessel: "name", beschriftung: "Name", art: "text", pflicht: true,
        hilfe: "Der Name, unter dem die Figur im Wiki erscheint.", ziel: "name",
      },
      {
        schluessel: "beschreibung", beschriftung: "Kurzbeschreibung", art: "mehrzeilig", pflicht: true,
        hilfe: "Ein kurzer Anriss für die Eintragsübersicht.", ziel: "beschreibung",
      },
      {
        schluessel: "volk", beschriftung: "Volk", art: "verweis", pflicht: false,
        hilfe: "Optional: die ID eines bestehenden Spezies-Eintrags.", speicherfeld: "species", alsAttribut: true,
      },
      {
        schluessel: "rolleBeruf", beschriftung: "Rolle/Beruf", art: "text", pflicht: false,
        hilfe: "Zum Beispiel Heilerin, Späher oder Wirt.", speicherfeld: "role", alsAttribut: true,
      },
      {
        schluessel: "fraktion", beschriftung: "Fraktion", art: "verweis", pflicht: false,
        hilfe: "Optional: die ID eines bestehenden Fraktions-Eintrags.", speicherfeld: "factionId", alsAttribut: true,
      },
      {
        schluessel: "motiv", beschriftung: "Motiv", art: "mehrzeilig", pflicht: false,
        hilfe: "Was die Figur gerade erreichen oder verhindern will.", speicherfeld: "motive", alsPanel: true,
      },
      {
        schluessel: "auftreten", beschriftung: "Auftreten", art: "mehrzeilig", pflicht: false,
        hilfe: "Erscheinung, Stimme, Manierismen und erster Eindruck.", speicherfeld: "traits", alsPanel: true,
      },
      {
        schluessel: "geheimnis", beschriftung: "Geheimnis", art: "mehrzeilig", pflicht: false,
        hilfe: "Etwas, das nicht jede Figur in der Welt wissen soll.", speicherfeld: "secret", alsPanel: true,
      },
      {
        schluessel: "verbindungen", beschriftung: "Verbindungen", art: "mehrzeilig", pflicht: false,
        hilfe: "Beziehungen, Schulden, Feindschaften oder gemeinsame Geschichte.", speicherfeld: "connectionsNote", alsPanel: true,
      },
    ],
  },
  {
    kennung: "ort",
    anzeigename: "Ort",
    zielkategorie: "places",
    symbol: "⌂",
    felder: [
      {
        schluessel: "name", beschriftung: "Name", art: "text", pflicht: true,
        hilfe: "Der Name des Ortes im Wiki.", ziel: "name",
      },
      {
        schluessel: "beschreibung", beschriftung: "Kurzbeschreibung", art: "mehrzeilig", pflicht: true,
        hilfe: "Ein kurzer Anriss für die Eintragsübersicht.", ziel: "beschreibung",
      },
      {
        schluessel: "art", beschriftung: "Art des Ortes", art: "auswahl", pflicht: true,
        hilfe: "Die grobe Einordnung hilft beim Wiederfinden.", speicherfeld: "type", alsAttribut: true,
        werte: ["Siedlung", "Gebäude", "Wildnis", "Ruine", "Gebiet"],
      },
      {
        schluessel: "region", beschriftung: "Region", art: "verweis", pflicht: false,
        hilfe: "Optional: die ID eines übergeordneten Orts- oder Regionen-Eintrags.", speicherfeld: "regionId", alsAttribut: true,
      },
      {
        schluessel: "einwohner", beschriftung: "Einwohner", art: "zahl", pflicht: false,
        hilfe: "Bei unbekannter Zahl leer lassen.", speicherfeld: "inhabitants", alsAttribut: true, minimum: 0,
      },
      {
        schluessel: "wahrzeichen", beschriftung: "Wahrzeichen", art: "mehrzeilig", pflicht: false,
        hilfe: "Was den Ort unverwechselbar macht.", speicherfeld: "landmark", alsPanel: true,
      },
      {
        schluessel: "gefahren", beschriftung: "Gefahren", art: "mehrzeilig", pflicht: false,
        hilfe: "Drohungen, Sperren oder Risiken vor Ort.", speicherfeld: "dangers", alsPanel: true,
      },
    ],
  },
  {
    kennung: "poi",
    anzeigename: "POI",
    zielkategorie: "places",
    symbol: "⌖",
    felder: [
      {
        schluessel: "name", beschriftung: "Name", art: "text", pflicht: true,
        hilfe: "Der Name des interessanten Orts.", ziel: "name",
      },
      {
        schluessel: "beschreibung", beschriftung: "Kurzbeschreibung", art: "mehrzeilig", pflicht: true,
        hilfe: "Ein knapper Anriss, warum dieser Punkt wichtig ist.", ziel: "beschreibung",
      },
      {
        schluessel: "art", beschriftung: "Art", art: "auswahl", pflicht: true,
        hilfe: "Die Art des interessanten Orts.", speicherfeld: "type", alsAttribut: true,
        werte: ["Fundort", "Wahrzeichen", "Ruine", "Höhle", "Gefahrenort", "Grenzzeichen"],
      },
      {
        schluessel: "ort", beschriftung: "Wo genau?", art: "verweis", pflicht: false,
        hilfe: "Optional: die ID des Orts, zu dem dieser POI gehört.", speicherfeld: "locationId", alsAttribut: true,
      },
      {
        schluessel: "fund", beschriftung: "Was findet man dort?", art: "mehrzeilig", pflicht: false,
        hilfe: "Fund, Hinweis, Begegnung oder sichtbares Detail.", speicherfeld: "function", alsPanel: true,
      },
      {
        schluessel: "zustand", beschriftung: "Zustand", art: "auswahl", pflicht: false,
        hilfe: "Der Zustand zum Zeitpunkt des Eintrags.", speicherfeld: "condition", alsAttribut: true,
        werte: ["Unversehrt", "Beschädigt", "Verfallen", "Gefährlich", "Unbekannt"],
      },
    ],
  },
  {
    kennung: "gegenstand",
    anzeigename: "Gegenstand",
    zielkategorie: "items",
    symbol: "⚔",
    felder: [
      {
        schluessel: "name", beschriftung: "Name", art: "text", pflicht: true,
        hilfe: "Der Name des Gegenstands im Wiki.", ziel: "name",
      },
      {
        schluessel: "beschreibung", beschriftung: "Kurzbeschreibung", art: "mehrzeilig", pflicht: true,
        hilfe: "Ein kurzer Anriss für die Eintragsübersicht.", ziel: "beschreibung",
      },
      {
        schluessel: "art", beschriftung: "Art", art: "auswahl", pflicht: true,
        hilfe: "Exakt die fünf Arten aus den vorhandenen Daggerheart-Gegenständen.", speicherfeld: "art", alsAttribut: true, quellschluessel: "art",
        werte: ["primaerwaffe", "sekundaerwaffe", "ruestung", "gegenstand", "verbrauch"],
      },
      {
        schluessel: "attribut", beschriftung: "Attribut", art: "auswahl", pflicht: false,
        hilfe: "Nur bei Gegenständen mit Attribut; Werte entsprechen den Rohdaten.", speicherfeld: "attribut", alsAttribut: true, quellschluessel: "attribut",
        werte: ["Agility", "Strength", "Finesse", "Instinct", "Presence", "Knowledge"],
      },
      {
        schluessel: "reichweite", beschriftung: "Reichweite", art: "auswahl", pflicht: false,
        hilfe: "Nur bei Gegenständen mit Reichweite; Werte entsprechen den Rohdaten.", speicherfeld: "reichweite", alsAttribut: true, quellschluessel: "reichweite",
        werte: ["Melee", "Very Close", "Close", "Far", "Very Far"],
      },
      {
        schluessel: "schaden", beschriftung: "Schaden", art: "text", pflicht: false,
        hilfe: "Die Schreibweise aus dem Datensatz übernehmen, zum Beispiel „d8 phy“.", speicherfeld: "schaden", alsAttribut: true, quellschluessel: "schaden",
      },
      {
        schluessel: "traglast", beschriftung: "Traglast", art: "auswahl", pflicht: false,
        hilfe: "Die sechs tatsächlich vorkommenden Schreibweisen bleiben unverändert wählbar.", speicherfeld: "traglast", alsAttribut: true, quellschluessel: "traglast",
        werte: ["Einhändig", "Zweihändig", "Zwei-/Einhändig", "Ein-/Zweihändig", "zweihändig", "einhändig"],
      },
      {
        schluessel: "merkmal", beschriftung: "Merkmal", art: "text", pflicht: false,
        hilfe: "Regelname oder besonderes Merkmal des Gegenstands.", speicherfeld: "merkmal", alsAttribut: true, quellschluessel: "merkmal",
      },
      {
        schluessel: "wirkung", beschriftung: "Wirkung", art: "mehrzeilig", pflicht: false,
        hilfe: "Die konkrete Regelwirkung, falls der Gegenstand eine hat.", speicherfeld: "wirkung", alsPanel: true, quellschluessel: "wirkung",
      },
      {
        schluessel: "score", beschriftung: "Rüstungswert", art: "zahl", pflicht: false,
        hilfe: "In den Rohdaten heißt dieser Wert „score“.", speicherfeld: "score", alsAttribut: true, quellschluessel: "score", minimum: 0,
      },
      {
        schluessel: "schwellen", beschriftung: "Schwellen", art: "text", pflicht: false,
        hilfe: "Die Grundschwellen als „schwer / ernst“, zum Beispiel „5 / 11“.", speicherfeld: "schwellen", alsAttribut: true, quellschluessel: "schwellen",
      },
      {
        schluessel: "scoreStufen", beschriftung: "Rüstungswert je Stufe", art: "text", pflicht: false,
        hilfe: "Für die in den Rohdaten vorkommenden Stufenwerte.", speicherfeld: "scoreStufen", alsAttribut: true, quellschluessel: "scoreStufen",
      },
      {
        schluessel: "schwellenStufen", beschriftung: "Schwellen je Stufe", art: "text", pflicht: false,
        hilfe: "Für die in den Rohdaten vorkommenden Stufen-Schwellen.", speicherfeld: "schwellenStufen", alsAttribut: true, quellschluessel: "schwellenStufen",
      },
      {
        schluessel: "rarity", beschriftung: "Seltenheit", art: "text", pflicht: false,
        hilfe: "Eigenes Wiki-Feld: Die vorhandenen 123 Daggerheart-Rohdatensätze führen keine Seltenheit.", speicherfeld: "rarity", alsAttribut: true,
      },
      {
        schluessel: "abStufe", beschriftung: "Ab Stufe", art: "zahl", pflicht: false,
        hilfe: "Die niedrigste Stufe, ab der der Gegenstand vorkommt.", speicherfeld: "abStufe", alsAttribut: true, quellschluessel: "abStufe", minimum: 1,
      },
      {
        schluessel: "wurf", beschriftung: "Beutewurf", art: "zahl", pflicht: false,
        hilfe: "Nur bei Gegenständen mit einem tatsächlich geführten Beutewurf.", speicherfeld: "wurf", alsAttribut: true, quellschluessel: "wurf", minimum: 0,
      },
      {
        schluessel: "quelle", beschriftung: "Regelquelle", art: "text", pflicht: false,
        hilfe: "Die Quelle wird in allen vorhandenen Gegenstandsdatensätzen geführt.", speicherfeld: "source", alsAttribut: true, quellschluessel: "quelle",
      },
      {
        schluessel: "unsicher", beschriftung: "Prüfhinweis", art: "mehrzeilig", pflicht: false,
        hilfe: "Nur ausfüllen, wenn ein Wert bewusst als unsicher markiert werden soll.", speicherfeld: "unsicher", alsPanel: true, quellschluessel: "unsicher",
      },
    ],
  },
]);

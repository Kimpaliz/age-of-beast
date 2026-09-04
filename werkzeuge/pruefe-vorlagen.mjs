/* [Aufgabe: Bearbeiten]
   Prüft die Datenvorlagen und ihren Weg bis durch den Welt-Umwandler.

   Die Prüfung liest die echte Gegenstandsdatei, statt Werte zu duplizieren.
   Dadurch wird eine neue oder umbenannte Daggerheart-Spalte sichtbar, bevor
   der Item-Ersteller etwas Unpassendes anbietet.
*/

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { GEGENSTAND_QUELLFELDER, VORLAGEN } from "./vorlagen.mjs";
import { umwandeln } from "./welt-umwandeln.mjs";

const HIER = dirname(fileURLToPath(import.meta.url));
const WURZEL = join(HIER, "..");
const DATEN_DATEI = join(HIER, "vorlagen.mjs");
const RUNTIME_DATEI = join(WURZEL, "runtime", "vorlagen.js");
const QUELLE_DATEI = join(WURZEL, "daten", "quelle.json");
const GEGENSTAENDE_DATEI = join(WURZEL, "daten", "daggerheart-gegenstaende.json");
const FELD_ARTEN = new Set(["text", "mehrzeilig", "zahl", "auswahl", "verweis"]);
const KATEGORIEN = new Set(["wiki", "factions", "species", "characters", "items", "places", "events", "lore", "werkstatt", "regeln"]);
const fehler = [];

function fordere(bedingung, text) {
  if (!bedingung) fehler.push(text);
}

function menge(werte) {
  return new Set(werte.filter((wert) => wert !== null && wert !== undefined));
}

function mengenGleich(links, rechts) {
  return links.size === rechts.size && [...links].every((wert) => rechts.has(wert));
}

function feld(vorlage, schluessel) {
  return vorlage.felder.find((eintrag) => eintrag.schluessel === schluessel);
}

function beispielwerte(vorlage) {
  const werte = {};
  for (const eintrag of vorlage.felder) {
    if (eintrag.schluessel === "name") werte[eintrag.schluessel] = "Prüfung " + vorlage.kennung;
    else if (eintrag.schluessel === "beschreibung") werte[eintrag.schluessel] = "Ein ausführlicher Prüfentwurf für die Umwandlung.";
    else if (eintrag.art === "auswahl") werte[eintrag.schluessel] = eintrag.werte[0];
    else if (eintrag.art === "zahl") werte[eintrag.schluessel] = String(eintrag.minimum ?? 1);
    else if (eintrag.art === "verweis") werte[eintrag.schluessel] = "";
    else werte[eintrag.schluessel] = "Prüfwert für " + eintrag.beschriftung;
  }
  return werte;
}

function runtimeLaden() {
  const text = readFileSync(RUNTIME_DATEI, "utf8");
  const kontext = { window: {} };
  kontext.window.window = kontext.window;
  vm.runInNewContext(text, kontext, { filename: RUNTIME_DATEI });
  return kontext.window.aobVorlagen;
}

function vorlagenformPruefen() {
  const datenText = readFileSync(DATEN_DATEI, "utf8");
  fordere(!/from\s+["']node:/u.test(datenText), "werkzeuge/vorlagen.mjs darf keine Node-Bausteine importieren.");
  fordere(VORLAGEN.length >= 4, "Es müssen mindestens vier Vorlagen vorhanden sein.");

  const kennungen = new Set();
  for (const vorlage of VORLAGEN) {
    for (const schluessel of ["kennung", "anzeigename", "zielkategorie", "symbol"]) {
      fordere(typeof vorlage[schluessel] === "string" && vorlage[schluessel].trim(),
        "Vorlage ohne " + schluessel + ".");
    }
    fordere(KATEGORIEN.has(vorlage.zielkategorie),
      "Vorlage „" + vorlage.kennung + "“ hat eine unbekannte Zielkategorie.");
    fordere(Array.isArray(vorlage.felder) && vorlage.felder.length > 0,
      "Vorlage „" + vorlage.kennung + "“ hat keine Feldliste.");
    fordere(!kennungen.has(vorlage.kennung), "Vorlagenkennung doppelt: " + vorlage.kennung + ".");
    kennungen.add(vorlage.kennung);

    const schluessel = new Set();
    for (const eintrag of vorlage.felder || []) {
      for (const pflicht of ["schluessel", "beschriftung", "art", "hilfe"]) {
        fordere(typeof eintrag[pflicht] === "string" && eintrag[pflicht].trim(),
          "Vorlage „" + vorlage.kennung + "“ hat ein Feld ohne " + pflicht + ".");
      }
      fordere(typeof eintrag.pflicht === "boolean",
        "Feld „" + eintrag.schluessel + "“ braucht ein boolesches pflicht.");
      fordere(FELD_ARTEN.has(eintrag.art),
        "Feld „" + eintrag.schluessel + "“ hat eine unbekannte Art.");
      fordere(!schluessel.has(eintrag.schluessel),
        "Vorlage „" + vorlage.kennung + "“ hat den Feldschlüssel „" + eintrag.schluessel + "“ doppelt.");
      schluessel.add(eintrag.schluessel);
      if (eintrag.art === "auswahl") {
        fordere(Array.isArray(eintrag.werte) && eintrag.werte.length > 0,
          "Auswahl „" + eintrag.schluessel + "“ hat keine Werte.");
        fordere(new Set(eintrag.werte || []).size === (eintrag.werte || []).length,
          "Auswahl „" + eintrag.schluessel + "“ enthält doppelte Werte.");
      }
    }
  }
}

function gegenstandPruefen() {
  const daten = JSON.parse(readFileSync(GEGENSTAENDE_DATEI, "utf8"));
  const gegenstaende = Array.isArray(daten.gegenstaende) ? daten.gegenstaende : [];
  const vorlage = VORLAGEN.find((eintrag) => eintrag.kennung === "gegenstand");
  fordere(gegenstaende.length > 0, "daten/daggerheart-gegenstaende.json enthält keine Gegenstände.");
  fordere(Boolean(vorlage), "Die Gegenstandsvorlage fehlt.");
  if (!vorlage || !gegenstaende.length) return { gegenstaende, quellfelder: new Set() };

  const quellfelder = menge(gegenstaende.flatMap((eintrag) => Object.keys(eintrag)));
  const abgedeckt = new Set(vorlage.felder.map((eintrag) => eintrag.quellschluessel).filter(Boolean));
  const unerwartet = [...quellfelder].filter((schluessel) => !["id", "name"].includes(schluessel)
    && !GEGENSTAND_QUELLFELDER.includes(schluessel));
  fordere(unerwartet.length === 0,
    "Neue Gegenstands-Wertfelder ohne Vorlage: " + unerwartet.join(", ") + ".");

  for (const schluessel of GEGENSTAND_QUELLFELDER) {
    fordere(quellfelder.has(schluessel), "Erwartetes Gegenstands-Wertfeld fehlt in den Rohdaten: " + schluessel + ".");
    fordere(abgedeckt.has(schluessel), "Gegenstandsvorlage deckt „" + schluessel + "“ nicht ab.");
  }

  for (const schluessel of ["art", "attribut", "reichweite", "traglast"]) {
    const eingabe = feld(vorlage, schluessel);
    const echteWerte = menge(gegenstaende.map((eintrag) => eintrag[schluessel]));
    fordere(eingabe?.art === "auswahl", "„" + schluessel + "“ muss eine Auswahl sein.");
    fordere(mengenGleich(echteWerte, new Set(eingabe?.werte || [])),
      "Auswahl „" + schluessel + "“ stimmt nicht mit den Rohdaten überein.");
  }

  const seltenheit = feld(vorlage, "rarity");
  fordere(Boolean(seltenheit) && seltenheit.speicherfeld === "rarity",
    "Die von Jannik gewünschte Seltenheit muss als Wiki-Feld rarity vorhanden sein.");
  fordere(!quellfelder.has("rarity"),
    "Die Rohdaten führen jetzt rarity; die Gegenstandsvorlage braucht eine aktualisierte Quellenzuordnung.");
  return { gegenstaende, quellfelder };
}

function umwandlungPruefen() {
  const quelle = JSON.parse(readFileSync(QUELLE_DATEI, "utf8"));
  const runtime = runtimeLaden();
  fordere(typeof runtime?.erzeugeEintrag === "function", "runtime/vorlagen.js stellt erzeugeEintrag nicht bereit.");
  if (typeof runtime?.erzeugeEintrag !== "function") return;

  for (const vorlage of VORLAGEN) {
    const eintrag = runtime.erzeugeEintrag(vorlage, beispielwerte(vorlage));
    for (const schluessel of ["id", "module", "name", "description", "fields", "attributeRows", "customPanels", "panelOrder"]) {
      fordere(Object.hasOwn(eintrag, schluessel),
        "Erzeugter „" + vorlage.kennung + "“-Eintrag hat kein " + schluessel + ".");
    }
    fordere(eintrag.module === vorlage.zielkategorie,
      "Erzeugter „" + vorlage.kennung + "“-Eintrag hat die falsche Zielkategorie.");
    fordere(eintrag.panelOrder.includes("core-connections") && eintrag.panelOrder.includes("references"),
      "Erzeugter „" + vorlage.kennung + "“-Eintrag enthält die festen Panels nicht.");
    fordere(eintrag.customPanels.every((panel) => eintrag.panelOrder.includes(panel.id)),
      "Erzeugter „" + vorlage.kennung + "“-Eintrag ordnet nicht jedes eigene Panel ein.");

    const kopie = JSON.parse(JSON.stringify(quelle));
    if (!kopie.elements[eintrag.module]) kopie.elements[eintrag.module] = {};
    kopie.elements[eintrag.module][eintrag.id] = eintrag;
    const welt = umwandeln(kopie).welt;
    fordere(welt.eintraege.some((weltEintrag) => weltEintrag.id === eintrag.id),
      "welt-umwandeln.mjs verarbeitet den erzeugten „" + vorlage.kennung + "“-Eintrag nicht.");
  }
}

try {
  vorlagenformPruefen();
  const { gegenstaende } = gegenstandPruefen();
  umwandlungPruefen();
  if (fehler.length) {
    console.error("Vorlagenprüfung fehlgeschlagen:");
    for (const eintrag of fehler) console.error("- " + eintrag);
    process.exitCode = 1;
  } else {
    console.log("Vorlagen: " + VORLAGEN.length + "; Felder: "
      + VORLAGEN.map((vorlage) => vorlage.anzeigename + " " + vorlage.felder.length).join(", ") + ".");
    console.log("Gegenstandsdaten: " + gegenstaende.length + " Einträge, "
      + GEGENSTAND_QUELLFELDER.length + " Wertfelder vollständig abgedeckt.");
    console.log("Vorlagenprüfung grün.");
  }
} catch (fehlerBeimLauf) {
  console.error("Vorlagenprüfung konnte nicht laufen:", fehlerBeimLauf.message);
  process.exitCode = 1;
}

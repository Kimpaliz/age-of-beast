/**
 * Der Kampagnenrahmen als Wiki-Eintrag.  [Aufgabe: Weltdaten]
 *
 * Herausgelöst aus `welt-umwandeln.mjs`. Das war keine Kür: Regel 10
 * führt diese Datei als Altlast mit einem Ratchet — sie darf schrumpfen,
 * nie wachsen. Wer sie fachlich anfasst, zahlt ein Stück ihrer Ablösung.
 * Der Rahmen ist dafür der saubere Schnitt, weil er die einzige Quelle
 * ist, die nicht aus `elements` kommt, sondern erst zu einem Element
 * gemacht wird.
 *
 * ⚠️ Diese Datei läuft im Browser **und** in Node. Keine Node-Bausteine,
 * keine Abhängigkeiten — sonst bricht `pruefe-gleichstand.mjs`.
 *
 * `alsAbsaetze` wird **übergeben**, nicht importiert: Ein Import aus
 * `welt-umwandeln.mjs` wäre ein Ringbezug, weil jene Datei ihrerseits
 * `mitRahmen` von hier holt.
 *
 * Arbeitet zusammen mit: `welt-umwandeln.mjs` (einziger Aufrufer).
 *
 */

/* ------------------------------------------------------------------ *
 * Kampagnenrahmen zu Einträgen machen
 *
 * Die Rahmen der Daggerheart-Werkstatt liegen als Rohform unter `rahmen`.
 * Anders als bei den übrigen Inhalten wird daraus nicht einmalig ein
 * Eintrag gemacht, sondern bei jedem Aufbereiten neu — sonst gäbe es die
 * Struktur zum Bearbeiten und die Abschnitte zum Lesen als zwei getrennte
 * Stände, die auseinanderlaufen.
 * ------------------------------------------------------------------ */

const BILD_VORGABE = {
  color: 'gold', fit: 'contain', frame: 'simple',
  positionX: 50, positionY: 50, zoom: 100,
};

/** Fügt beschriftete Angaben zu einem Absatztext zusammen. */
function angaben(paare) {
  return paare
    .filter(([, wert]) => String(wert ?? '').trim())
    .map(([b, w]) => (b ? b + ': ' + String(w).trim() : String(w).trim()))
    .join('\n\n');
}

function rahmenPanelRoh(id, titel, text, alsAbsaetze) {
  const roh = String(text ?? '').trim();
  if (!roh) return null;
  return {
    id, image: '', imageSettings: { ...BILD_VORGABE }, kind: 'text',
    text: roh,
    textFields: [{ html: alsAbsaetze(roh), id: 'text-' + id, label: 'Text', text: roh }],
    textLayout: 'single', title: titel,
  };
}

/** Baut aus einem Rahmen den Eintrag, wie das Wiki ihn zeigt. */
function rahmenAlsElement(eintrag, alsAbsaetze) {
  /* Kurzname mit der alten Signatur: Dadurch mussten die acht Aufrufe
     unten nicht angefasst werden — der Umbau bleibt damit an den Bytes
     der erzeugten Welt nachweisbar. */
  const rahmenPanel = (id, titel, text) => rahmenPanelRoh(id, titel, text, alsAbsaetze);
  const p = eintrag.inhalt || {};
  const id = eintrag.id;

  const besonderheiten = (p.distinctions || [])
    .filter((d) => d && (d.name || d.description))
    .map((d) => angaben([[null, d.name], ['Beschreibung', d.description], ['Im Alltag', d.everydayImpact]]))
    .join('\n\n');

  const fraktionen = (p.factions || [])
    .filter((f) => f && f.name)
    .map((f) => angaben([[null, f.name], ['Ziel', f.goal], ['Machtmittel', f.leverage], ['Verhältnis', f.relationship]]))
    .join('\n\n');

  const panels = [
    rahmenPanel('panel-' + id + '-kern', 'Kern der Kampagne', angaben([
      ['Grundgedanke', p.core?.concept],
      ['Wiederkehrende Tätigkeit', p.core?.recurringActivity],
      ['Was auf dem Spiel steht', p.core?.centralStakes],
    ])),
    rahmenPanel('panel-' + id + '-stimmung', 'Ton und Stimmung', angaben([
      ['Ton', p.mood?.tone], ['Themen', p.mood?.themes], ['Vorbilder', p.mood?.touchstones],
    ])),
    rahmenPanel('panel-' + id + '-ueberblick', 'Wie es zur heutigen Lage kam', angaben([
      ['Vorher', p.overview?.before], ['Der Wandel', p.overview?.change],
      ['Heute', p.overview?.today], ['Die Kräfte', p.overview?.forces],
      ['Warum die Figuren zählen', p.overview?.charactersMatter],
    ])),
    rahmenPanel('panel-' + id + '-motor', 'Motor der Geschichten', angaben([
      ['Wiederkehrende Lage', p.engine?.recurringSituation],
      ['Steigender Druck', p.engine?.risingPressure],
      ['Bedeutsame Entscheidungen', p.engine?.meaningfulChoices],
      ['Folgen', p.engine?.consequences],
    ])),
    rahmenPanel('panel-' + id + '-besonderheiten', 'Besonderheiten der Welt', besonderheiten),
    rahmenPanel('panel-' + id + '-fraktionen', 'Fraktionen im Rahmen', fraktionen),
    rahmenPanel('panel-' + id + '-figuren', 'Anknüpfung der Figuren', angaben([
      ['Gemeinsamer Anlass', p.characterHooks?.sharedReason],
      ['Zu den Gemeinschaften', p.characterHooks?.communityNotes],
    ])),
    rahmenPanel('panel-' + id + '-eroeffnung', 'Eröffnung', p.opening),
  ].filter(Boolean);

  const attributeRows = [
    { id: 'attribute-' + id + '-art', key: 'werkstattArt', label: 'Art' },
    { id: 'attribute-' + id + '-schritt', key: 'werkstattSchritt', label: 'Bearbeitungsschritt' },
  ];
  const fields = {
    werkstattArt: 'Kampagnenrahmen',
    werkstattSchritt: String(eintrag.schritt || 1) + ' von 9',
  };

  return {
    attributeRows,
    createdAt: eintrag.angelegtAm,
    customPanels: panels,
    description: [p.tagline, p.pitch].filter((t) => t && t.trim() && t.trim() !== 'X').join(' — '),
    descriptionPanelIds: panels.map((x) => x.id),
    fields,
    id,
    image: '',
    imageSettings: { ...BILD_VORGABE },
    module: 'werkstatt',
    name: p.title || 'Kampagnenrahmen',
    panelHeights: {},
    panelOrder: ['core-connections', 'references', ...panels.map((x) => x.id)],
    panelWidths: {},
    richText: {},
    updatedAt: eintrag.geaendertAm,
  };
}

/** Die Elemente des Rohstands, ergänzt um die erzeugten Rahmen. */
export function mitRahmen(roh, alsAbsaetze) {
  const elemente = roh.elements || {};
  const rahmen = roh.rahmen || {};
  if (!Object.keys(rahmen).length) return elemente;

  const werkstatt = { ...(elemente.werkstatt || {}) };
  for (const eintrag of Object.values(rahmen)) {
    if (!eintrag || !eintrag.id) continue;
    werkstatt[eintrag.id] = rahmenAlsElement(eintrag, alsAbsaetze);
  }
  return { ...elemente, werkstatt };
}

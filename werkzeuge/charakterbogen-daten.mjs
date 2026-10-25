/* [Aufgabe: Charakterbogen]
   Pure entry-type and print-data helpers shared by creation and rendering.
   A blank print is a new object, never a mutation of saved campaign data. */

export const SHEET_TYPE = 'character-sheet';
export const SHEET_TRAITS = [
  ['agility', 'Beweglichkeit'], ['strength', 'Stärke'], ['finesse', 'Finesse'],
  ['instinct', 'Instinkt'], ['presence', 'Präsenz'], ['knowledge', 'Wissen'],
];

export function isCharacterSheet(entry) {
  if (!entry) return false;
  const fields = entry.fields || entry;
  return fields.entryType === SHEET_TYPE || fields.spielwerte?.system === 'Daggerheart';
}

export function emptySheetValues() {
  return {
    system: 'Daggerheart', stufe: null, proficiency: null, player: '',
    abstammung: '', gemeinschaft: '', klasse: '', unterklasse: '', fuerwort: '',
    evasion: null, hp: null, stress: null, hoffnung: { start: null, max: 6 },
    attribute: Object.fromEntries(SHEET_TRAITS.map(([key]) => [key, null])),
    ruestung: {}, waffen: [], erfahrungen: [], karten: [], domaenen: [], offen: [],
  };
}

export function sheetForPrint(entry, blank = false) {
  const source = entry.spielwerte || entry.fields?.spielwerte || {};
  const values = blank ? emptySheetValues() : structuredClone(source);
  if (blank) {
    for (const key of ['player', 'fuerwort', 'abstammung', 'gemeinschaft',
      'klasse', 'klasseDe', 'unterklasse', 'unterklasseDe']) {
      if (source[key] !== undefined) values[key] = source[key];
    }
  }
  return { name: entry.name || '', icon: entry.icon || '', iconColor: entry.iconColor || '',
    blank, values };
}

export function sheetProficiency(values) {
  return Number.isFinite(values.proficiency) ? values.proficiency
    : values.stufe === 1 ? 1 : null;
}

export function preserveUnknownSheetValues(result, values) {
  for (const key of ['evasion', 'hp', 'stress']) {
    if (!Number.isFinite(values[key])) result.werte[key].endwert = null;
  }
  for (const [key] of SHEET_TRAITS) {
    if (!Number.isFinite(values.attribute?.[key])) result.werte[key].endwert = null;
  }
  // Resolved equipment may provide missing inputs from its rule card.
  const armor = result.ausruestung.find((item) => item.rolle === 'ruestung');
  const worn = armor?.angelegt !== false;
  if (!armor || (worn && !Number.isFinite(armor.score))) result.werte.ruestungswert.endwert = null;
  for (const [key, source] of [['schwelleSchwer', 'schwer'], ['schwelleErnst', 'ernst']]) {
    if (!Number.isFinite(values.stufe) || !armor || (worn && !Number.isFinite(armor.schwellen?.[source]))) {
      result.werte[key].endwert = null;
    }
  }
  return result;
}

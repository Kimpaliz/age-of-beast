/* [Aufgabe: Charakterbogen]
   Two A4 sheets built from the same calculated values as the screen.
   Blank mode omits private/free values before rendering, not merely via CSS. */
import { SHEET_TRAITS, sheetForPrint, sheetProficiency } from '../werkzeuge/charakterbogen-daten.mjs';

export function escapeSheet(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const signed = (value) => value == null ? '' : value > 0 ? '+' + value : String(value);
const field = (label, value, className = '') =>
  '<div class="print-field ' + className + '"><span>' + escapeSheet(label)
  + '</span><strong>' + escapeSheet(value) + '</strong></div>';
const block = (label, contents, icon, symbol) =>
  '<section class="print-block"><h3>' + symbol(icon) + escapeSheet(label) + '</h3>' + contents + '</section>';
const lines = (count = 3) => '<div class="print-lines">' + '<div></div>'.repeat(count) + '</div>';

function track(label, capacity, filled, blank) {
  const count = blank ? (label === 'Hoffnung' ? 6 : 10)
    : Number.isInteger(capacity) ? Math.max(0, Math.min(30, capacity)) : 10;
  return '<div class="print-track"><div><strong>' + escapeSheet(label) + '</strong><span>Maximum '
    + (blank || !Number.isFinite(capacity) ? '____' : capacity) + '</span></div><div class="print-boxes">'
    + Array.from({ length: count }, (_, index) => '<i' + (!blank && index < filled ? ' class="filled"' : '') + '></i>').join('')
    + '</div></div>';
}

export function renderPrintSheet(entry, result, { blank = false, symbol = () => '' } = {}) {
  const data = sheetForPrint(entry, blank);
  const w = data.values;
  const raw = entry.spielwerte || {};
  const values = result?.werte || {};
  const number = (key, source = raw[key]) => !blank && Number.isFinite(source) ? values[key]?.endwert : '';
  const resolvedArmor = blank ? null : result?.ausruestung?.find((item) => item.rolle === 'ruestung');
  const armorKnown = resolvedArmor && Number.isFinite(values.ruestungswert?.endwert);
  const threshold = (key) => !blank && resolvedArmor && Number.isFinite(raw.stufe)
    && Number.isFinite(values[key]?.endwert) ? values[key].endwert : '';
  const header = (subtitle) => '<header class="print-header"><div><span>Daggerheart · Charakterbogen</span><h1>'
    + escapeSheet(data.name) + '</h1><p>' + escapeSheet(subtitle) + '</p></div>'
    + field('Stufe', w.stufe, 'print-level') + '</header>';
  const startPage = (index, subtitle) => '<article class="sheet-print-page" data-page="' + index + '">'
    + header(subtitle);
  const endPage = (index) => '<footer class="print-footer"><span>'
    + escapeSheet(data.name) + '</span><span>Daggerheart · ' + index + ' / 2</span></footer></article>';
  const identity = '<div class="print-identity">' + [
    field('Spieler', w.player), field('Pronomen', w.fuerwort),
    field('Abstammung', w.abstammung), field('Gemeinschaft', w.gemeinschaft),
    field('Klasse', w.klasseDe || w.klasse), field('Unterklasse', w.unterklasseDe || w.unterklasse),
  ].join('') + '</div>';
  const traits = '<div class="print-traits">' + SHEET_TRAITS.map(([key, label]) =>
    field(label, signed(number(key, raw.attribute?.[key])), 'print-number')).join('') + '</div>';
  const defenses = '<div class="print-defenses">'
    + field('Ausweichen', number('evasion'), 'print-number')
    + field('Rüstung', armorKnown ? values.ruestungswert?.endwert : '', 'print-number')
    + field('Schwere Schwelle', threshold('schwelleSchwer'), 'print-number')
    + field('Ernste Schwelle', threshold('schwelleErnst'), 'print-number')
    + '</div><p class="print-rule">Schaden: unter schwer = 1 TP · ab schwer = 2 TP · ab ernst = 3 TP</p>';
  const supplies = track('Trefferpunkte', number('hp'), 0, blank)
    + track('Stress', number('stress'), 0, blank)
    + track('Hoffnung', w.hoffnung?.max, 0, blank)
    + '<p class="print-rule">Hoffnung bei Erschaffung: ' + escapeSheet(w.hoffnung?.start ?? '____')
    + ' · Kästchen für den aktuellen Spielstand.</p>';
  const xp = [...(w.erfahrungen || [])];
  while (xp.length < 3) xp.push({});
  const experience = xp.map((item) => '<div class="print-experience"><span>'
    + escapeSheet(item.name) + (item.vorlaeufig ? ' <small>(vorläufig)</small>' : '')
    + '</span><strong>' + escapeSheet(signed(item.bonus)) + '</strong></div>').join('');
  const gear = blank ? [] : (result?.ausruestung || []).filter((item) => item.rolle === 'waffe');
  while (gear.length < 2) gear.push({});
  const equipment = '<div class="print-proficiency">' + field('Übung / Proficiency', sheetProficiency(w)) + '</div>'
    + gear.map((item, index) => '<div class="print-weapon">'
      + field(item.hand === 'sekundär' || (!item.hand && index === 1) ? 'Nebenwaffe' : 'Hauptwaffe', item.name)
      + '<div class="print-pair">' + field('Attribut / Reichweite', [item.attribut, item.reichweite].filter(Boolean).join(' · '))
      + field('Schaden', item.schaden) + '</div>' + field('Merkmal', item.merkmal)
      + (!blank && item.name && !(item.schaden && item.attribut && item.reichweite) ? '<small>Waffenwerte noch offen</small>' : '')
      + (!blank && item.angelegt === false ? '<small>Abgelegt</small>' : '') + '</div>').join('');
  const armor = field('Rüstung', w.ruestung?.name) + '<div class="print-pair">'
    + field('Grundschwellen', resolvedArmor?.schwellen
      ? (resolvedArmor.schwellen.schwer ?? '____') + ' / ' + (resolvedArmor.schwellen.ernst ?? '____') : '')
    + field('Grund-Rüstungswert', resolvedArmor?.score) + '</div>'
    + field('Merkmal', resolvedArmor ? [resolvedArmor.merkmal, resolvedArmor.wirkung].filter(Boolean).join(': ') : '');
  const first = startPage(1, 'Werte und Ausrüstung') + identity + traits + defenses
    + '<div class="print-columns"><div>' + block('Ressourcen', supplies, 'potion', symbol)
    + block('Erfahrungen', experience, 'scroll', symbol)
    + block('Rüstung', armor, 'shield', symbol) + '</div><div>'
    + block('Waffen', equipment, 'sword', symbol)
    + block('Gold', '<div class="print-gold">' + field('Handvoll', w.gold?.handfuls)
      + field('Beutel', w.gold?.bags) + field('Truhe', w.gold?.chests) + '</div>', 'crown', symbol)
    + '</div></div>' + endPage(1);
  const features = field('Domänen', (w.domaenen || []).join(' · '))
    + field('Zauberattribut', w.zauberattribut) + field('Klassenfertigkeit', w.klassenfertigkeit)
    + field('Hoffnungsfertigkeit', w.hoffnungsfertigkeit) + lines(3);
  const cards = (w.karten || []).map((name) => '<p class="print-card">' + escapeSheet(name) + '</p>').join('') + lines(3);
  const inventory = [w.klassengegenstand, ...(w.vorrat || [])].filter(Boolean).join(' · ');
  const open = (w.offen || []).map((text) => '<li>' + escapeSheet(text) + '</li>').join('');
  const second = startPage(2, 'Fähigkeiten, Inventar und Notizen')
    + '<div class="print-columns"><div>' + block('Klasse und Fähigkeiten', features, 'star', symbol)
    + block('Fähigkeitskarten', cards, 'book', symbol) + '</div><div>'
    + block('Inventar', '<p>' + escapeSheet(inventory) + '</p>' + lines(5), 'key', symbol)
    + block('Noch festzulegen', (open ? '<ul>' + open + '</ul>' : '') + lines(3), 'scroll', symbol)
    + '</div></div>' + block('Notizen', lines(8), 'scroll', symbol) + endPage(2);
  return first + second;
}

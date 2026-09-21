/* [Aufgabe: Prüfwesen]
   Hält die zwei Spielfiguren als eindeutige, sichtbare Daggerheart-Bögen fest.

   Die Rohdaten sind maßgeblich. Die erzeugte Welt wird zusätzlich geprüft,
   damit eine richtige Quelle nicht neben veralteten Wiki-Dateien liegt.
*/

import { liesDatei, macheMelder } from './helfer.mjs';

const quelle = JSON.parse(liesDatei('daten/quelle.json'));
const welt = JSON.parse(liesDatei('daten/welt.json'));
const { melde, ende } = macheMelder();

const figuren = quelle.elements?.characters || {};
const werkstatt = quelle.elements?.werkstatt || {};
const brix = figuren['character-aob-xeno-sc'];
const lukas = figuren['character-aob-lukas-sc'];
const alleElemente = Object.values(quelle.elements || {}).flatMap((gruppe) => Object.values(gruppe || {}));
const weltFiguren = welt.eintraege.filter((eintrag) => eintrag.spielwerte);

melde(Boolean(brix), 'Brix Borin hat einen kanonischen Figuren-Eintrag.');
melde(Boolean(lukas), 'Lukas’ Figur hat einen kanonischen Figuren-Eintrag.');
melde(alleElemente.filter((eintrag) => eintrag.name === 'Brix Borin').length === 1,
  'Brix Borin existiert in der Quelle genau einmal.');
melde(!werkstatt['werkstatt-figur-brix-borin'],
  'Die frühere Werkstatt-Dublette von Brix Borin ist entfernt.');
melde(lukas?.name === 'Aktuell noch ohne Namen',
  'Lukas’ Figur trägt ihren ehrlichen Platzhalternamen.');

for (const [name, figur] of [['Brix Borin', brix], ['Aktuell noch ohne Namen', lukas]]) {
  melde(figur?.fields?.characterType === 'sc', name + ' ist als Spielfigur gekennzeichnet.');
  melde(figur?.fields?.spielwerte?.system === 'Daggerheart', name + ' besitzt einen Daggerheart-Bogen.');
  melde(Array.isArray(figur?.fields?.spielwerte?.erfahrungen)
      && figur.fields.spielwerte.erfahrungen.length === 2
      && figur.fields.spielwerte.erfahrungen.every((erfahrung) => erfahrung.bonus === 2),
    name + ' besitzt zwei Erfahrungen mit je +2.');
  const panelTitel = new Set((figur?.customPanels || []).map((panel) => panel.title));
  melde(panelTitel.has('Spielwerte'), name + ' zeigt die Spielwerte im Wiki-Eintrag.');
  melde(panelTitel.has('Erfahrungen und Fähigkeitskarten'),
    name + ' zeigt Erfahrungen und Fähigkeitskarten im Wiki-Eintrag.');
}

melde(brix?.fields?.spielwerte?.evasion === 13, 'Brix Borins Ausweichen ist 13.');
melde(brix?.fields?.spielwerte?.hp === 6 && brix?.fields?.spielwerte?.stress === 6,
  'Brix Borin besitzt 6 Trefferpunkte und 6 Stressfelder.');
melde(brix?.fields?.spielwerte?.erfahrungen?.map((eintrag) => eintrag.name).join('|') === 'Taschendieb|Pokerface',
  'Brix Borins vorläufige Erfahrungen folgen seinen bekannten Angaben.');
melde(brix?.customPanels?.some((panel) => panel.title === 'Herkunfts- und Klassenmerkmale'),
  'Brix Borins Herkunfts- und Klassenmerkmale sind sichtbar.');
melde(!brix?.fields?.connections?.some((verbindung) => verbindung.targetId === 'werkstatt-figur-brix-borin'),
  'Brix Borin verweist nicht mehr auf seine entfernte Dublette.');
melde(!JSON.stringify(brix || {}).includes('Ihr eigener Name steht noch aus'),
  'Brix Borin enthält keinen falschen Hinweis auf einen fehlenden Namen.');
melde(JSON.stringify(brix || {}).includes('Ausdenken 3'),
  'Die unklare ältere Notiz „Ausdenken 3“ bleibt zur Klärung erhalten.');

const frame = quelle.elements?.wiki?.['wiki-sturmwende-kampagnenframe'];
melde(frame?.textLinks?.['unbenannte spielfigur von lukas']?.id === 'character-aob-lukas-sc',
  'Der gepflegte Verweis auf Lukas’ unbenannte Figur zeigt auf Lukas’ Eintrag.');
melde(frame?.textLinks?.['aktuell noch ohne namen']?.id === 'character-aob-lukas-sc',
  'Der neue Platzhaltername ist als Verweis auf Lukas’ Eintrag gepflegt.');

melde(weltFiguren.length === 2, 'Die erzeugte Welt enthält genau zwei Charakterbögen.');
melde(welt.eintraege.filter((eintrag) => eintrag.name === 'Brix Borin').length === 1,
  'Die erzeugte Welt enthält Brix Borin genau einmal.');
melde(welt.eintraege.some((eintrag) => eintrag.id === 'character-aob-lukas-sc'
    && eintrag.name === 'Aktuell noch ohne Namen'),
  'Die erzeugte Welt enthält Lukas’ Figur unter dem neuen Namen.');

ende();

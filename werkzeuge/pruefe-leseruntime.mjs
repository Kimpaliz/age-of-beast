/**
 * [Aufgabe: Prüfwesen]
 * Vertragstest für die klassische Leseruntime. Kein Browser, kein Netzwerk.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const wurzel = join(dirname(fileURLToPath(import.meta.url)), '..');
const dateien = ['runtime/symbole.js', 'runtime/datenindex.js', 'runtime/ansichten.js', 'runtime/interaktion.js', 'runtime/routing.js', 'wiki.js'];
// Alle Runtime-Dateien ausser dem Bootstrap wiki.js.
const bausteinDateien = dateien.slice(0, -1);
let pruefungen = 0;
const fehler = [];
function pruefe(wert, text) { pruefungen += 1; if (!wert) fehler.push(text); }
const quelltext = Object.fromEntries(dateien.map((datei) => [datei, readFileSync(join(wurzel, datei), 'utf8')]));
const laufzeitprobe = spawnSync(process.execPath, [join(wurzel, 'werkzeuge', 'pruefe-rahmen-routen.mjs')], { encoding: 'utf8' });
pruefe(laufzeitprobe.status === 0, 'Die VM-Laufzeitprobe für alle fünf klassischen Dateien ist fehlgeschlagen: ' + (laufzeitprobe.stderr || laufzeitprobe.stdout).trim());

for (const datei of bausteinDateien) {
  pruefe(quelltext[datei].includes('window.__aobLeserBausteine'), datei + ': registriert ausschließlich den internen Baustein.');
}
pruefe(!quelltext['runtime/symbole.js'].includes('document.'), 'Symbole fasst kein DOM an und liefert nur Zeichenketten.');
pruefe(quelltext['runtime/ansichten.js'].includes('bausteine.symbole') && quelltext['runtime/ansichten.js'].includes("symbolvorrat ? symbolvorrat.symbol"), 'Ansichten holt die Symbole und bleibt ohne sie lauffaehig.');
pruefe(!quelltext['runtime/datenindex.js'].includes('seiteZeichnen'), 'Datenindex darf keine Seite zeichnen.');
pruefe(!quelltext['runtime/ansichten.js'].includes("addEventListener('hashchange'"), 'Ansichten darf kein Hash-Routing besitzen.');
pruefe(!quelltext['runtime/interaktion.js'].includes("addEventListener('hashchange'"), 'Interaktion darf kein Hash-Routing besitzen.');
pruefe(quelltext['runtime/datenindex.js'].includes('volltext') && quelltext['runtime/datenindex.js'].includes('verbundenVon') && quelltext['runtime/datenindex.js'].includes('verweiseSetzen'), 'Datenindex enthält Volltext, Verbindungen und Verweislogik.');
pruefe(quelltext['runtime/ansichten.js'].includes('startseiteZeichnen') && quelltext['runtime/ansichten.js'].includes('kategorieZeichnen') && quelltext['runtime/ansichten.js'].includes('eintragZeichnen') && quelltext['runtime/ansichten.js'].includes('werkstattZeichnen'), 'Ansichten enthält alle Leserouten.');
pruefe(quelltext['runtime/interaktion.js'].includes('themaSetzen') && quelltext['runtime/interaktion.js'].includes('datenindex.suchen') && quelltext['runtime/interaktion.js'].includes('vorschau'), 'Interaktion enthält Theme, Suche und Vorschau.');
pruefe(quelltext['runtime/routing.js'].includes("addEventListener('hashchange', seiteZeichnen)") && quelltext['runtime/routing.js'].includes('renderGeneration'), 'Routing besitzt den einzigen Hash-Listener und Generationen.');
pruefe(quelltext['wiki.js'].includes('window.ageOfBeast = runtime.fassade') && quelltext['wiki.js'].indexOf('window.ageOfBeast = runtime.fassade') < quelltext['wiki.js'].indexOf('runtime.start()'), 'Fassade wird vor dem ersten Render installiert.');
for (const mitglied of ['rahmenZeichnen', 'weltSetzen', 'weltHolen', 'beiNeuZeichnen', 'rahmenRendererRegistrieren']) pruefe(quelltext['runtime/routing.js'].includes(mitglied), 'Fassade enthält ' + mitglied + '.');
pruefe((quelltext['runtime/routing.js'].match(/seiteZeichnen\(\);/g) || []).length >= 2, 'Routing zeichnet initial und bei Welt-/Rahmenwechsel erneut.');
pruefe(!quelltext['wiki.js'].includes('seiteZeichnen'), 'Bootstrap zeichnet nicht selbst.');
pruefe(quelltext['runtime/routing.js'].includes("if (typeof rueckruf !== 'function') return;"), 'Ungültige Nachrender-Rückrufe bleiben ein stiller No-op.');
pruefe(quelltext['wiki.js'].includes('Die Weltdaten konnten nicht geladen werden.'), 'Fehlende Weltdaten erhalten die sichtbare Bestandsfehlermeldung.');

if (fehler.length) { console.error('Leseruntime fehlgeschlagen:\n- ' + fehler.join('\n- ')); process.exitCode = 1; } else { console.log('Age-of-Beast-Wiki – Leseruntime geprüft'); console.log('Prüfungen: ' + pruefungen); console.log('Ergebnis: klassische Bausteine, Fassade, Routing und getrennte Verantwortungen sind erfüllt.'); }

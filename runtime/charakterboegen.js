/* [Aufgabe: Charakterbogen]
   Mounts the shared interactive sheet inside character entries.
   Async catalogue loading never replaces a newer route or an active form. */
import { bogen } from '../karte/bogen-layout.js';
import { bogenVerdrahten, katalogLaden, rechnerFuer } from '../karte/bogen-werte.js';
import { sheetPrintClear, sheetPrintInstall } from '../karte/bogen-drucken.js';

let generation = 0;
async function mountSheet() {
  const ticket = ++generation;
  const host = document.querySelector('[data-character-sheet]');
  if (!host) { sheetPrintClear(); return; }
  const world = window.ageOfBeast.weltHolen();
  const entry = world.eintraege.find((item) => item.id === host.dataset.characterSheet);
  if (!entry) return;
  try { await katalogLaden(); } catch { /* Saved values remain available offline. */ }
  if (ticket !== generation || !host.isConnected) return;
  const calculator = rechnerFuer(entry);
  const options = {
    wikiEintrag: (id) => '#/eintrag/' + encodeURIComponent(id),
    wikiVerweisFuer(name) {
      const key = String(name).trim().toLocaleLowerCase('de-DE');
      const found = world.eintraege.find((item) => item.kategorie === 'items'
        && [item.name, ...(item.aliase || [])].some((value) => value.toLocaleLowerCase('de-DE') === key));
      return { href: found ? '#/eintrag/' + encodeURIComponent(found.id)
        : '#/neu/items/' + encodeURIComponent(name), ziel: found?.id || '', fehlend: !found,
        icon: window.aobSymbole?.eintragSymbol(found?.icon, 'items', 'bogen-verweis-icon', found?.iconColor) || '' };
    },
  };
  host.innerHTML = bogen(entry, calculator, options);
  bogenVerdrahten(host, calculator, entry, options);
  sheetPrintInstall(host, () => ({ entry, result: calculator.ergebnis() }));
}

window.ageOfBeast?.beiNeuZeichnen(mountSheet);

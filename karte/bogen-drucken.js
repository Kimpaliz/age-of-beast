/* [Aufgabe: Charakterbogen]
   A4 preview and native print controller. No storage or network writes.
   One current sheet provider prevents stale or duplicate characters in print. */
import { renderPrintSheet } from './bogen-druck.mjs';

let active = null;
let output = null;
let dialog = null;
let blank = false;
let installed = false;

function markup() {
  const snapshot = active?.get();
  if (!snapshot?.entry || !active?.host.isConnected) return '';
  return renderPrintSheet(snapshot.entry, snapshot.result, { blank,
    symbol: (name) => window.aobSymbole?.eintragSymbol(name, 'characters', 'sheet-section-icon') || '' });
}

function refresh() {
  if (!output) return;
  const html = markup();
  output.innerHTML = html;
  document.body.classList.toggle('sheet-print-active', Boolean(html));
  if (dialog?.open) dialog.querySelector('[data-print-preview]').innerHTML = html;
}

function ensureUI() {
  if (installed) return;
  installed = true;
  output = document.createElement('div');
  output.id = 'sheet-print-output';
  output.setAttribute('aria-hidden', 'true');
  document.body.append(output);
  dialog = document.createElement('dialog');
  dialog.className = 'sheet-print-dialog';
  dialog.setAttribute('aria-labelledby', 'sheet-print-title');
  dialog.innerHTML = '<form method="dialog" class="sheet-print-toolbar"><h2 id="sheet-print-title">A4-Druckvorschau</h2>'
    + '<fieldset><legend>Inhalt</legend><label><input type="radio" name="printMode" value="filled" checked>Ausgefüllt</label>'
    + '<label><input type="radio" name="printMode" value="blank">Nur Basisdaten</label></fieldset>'
    + '<button type="button" data-print-now>Drucken / PDF</button>'
    + '<button value="close" aria-label="Druckvorschau schließen" title="Schließen">×</button></form>'
    + '<p class="sheet-print-note">Basisdaten: Name, Spieler, Pronomen, Herkunft und Klasse. Alle übrigen Felder bleiben zum Ausfüllen frei.</p>'
    + '<div class="sheet-print-preview" data-print-preview></div>';
  document.body.append(dialog);
  dialog.addEventListener('change', (event) => {
    if (event.target.name !== 'printMode') return;
    blank = event.target.value === 'blank';
    refresh();
  });
  dialog.querySelector('[data-print-now]').addEventListener('click', () => {
    refresh();
    window.print();
  });
  window.addEventListener('beforeprint', refresh);
  window.addEventListener('hashchange', () => {
    if (dialog.open) dialog.close();
    refresh();
  });
}

export function sheetPrintClear() {
  active = null;
  if (dialog?.open) dialog.close();
  refresh();
}

export function sheetPrintInstall(host, get) {
  ensureUI();
  active = { host, get };
  refresh();
  for (const button of host.querySelectorAll('[data-sheet-print]:not([data-print-wired])')) {
    button.dataset.printWired = 'true';
    button.addEventListener('click', () => {
      if (!active?.host.isConnected) return;
      dialog.showModal();
      refresh();
    });
  }
}

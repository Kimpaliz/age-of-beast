/* [Aufgabe: Bearbeiten]
   Explicit sheet editing through the existing authenticated write context.
   Save is deliberate; print mode and reading never enter the write path. */
import { emptySheetValues, isCharacterSheet, SHEET_TYPE } from '../werkzeuge/charakterbogen-daten.mjs';
import { readSheetPath, sheetFormFields, valuesFromSheetForm } from '../werkzeuge/charakterbogen-formular.mjs';
import { escapeSheet } from '../karte/bogen-druck.mjs';

const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function inputMarkup([path, label, type, min, max], values) {
  const value = readSheetPath(values, path);
  const attr = ' name="' + path + '"';
  if (type === 'checkbox') return '<label class="sheet-check"><input type="checkbox"' + attr
    + (value ? ' checked' : '') + '>' + escapeSheet(label) + '</label>';
  const control = type === 'lines' ? '<textarea' + attr + '>'
    + escapeSheet((value || []).join('\n')) + '</textarea>' : '<input' + attr + ' type="' + type
    + '" value="' + escapeSheet(value) + '"' + (type === 'number' ? ' step="1" min="' + min
      + '" max="' + max + '"' : ' maxlength="160"') + '>';
  return '<label><span>' + escapeSheet(label) + '</span>' + control + '</label>';
}

function section(title, fields, values) {
  return '<fieldset><legend>' + escapeSheet(title) + '</legend>'
    + fields.map((field) => inputMarkup(field, values)).join('') + '</fieldset>';
}

export function sheetEditingInstall(context) {
  let dialog = null;
  function openEditor(entry, category, convert = false) {
    dialog?.remove();
    const original = structuredClone(entry.fields?.spielwerte || emptySheetValues());
    const definitions = sheetFormFields(original);
    const matching = (prefixes) => definitions.filter(([key]) => prefixes.some((prefix) => key === prefix || key.startsWith(prefix + '.')));
    const identity = matching(['player', 'fuerwort', 'abstammung', 'gemeinschaft', 'klasse', 'unterklasse']);
    const numbers = matching(['stufe', 'proficiency', 'evasion', 'hp', 'stress', 'hoffnung', 'attribute']);
    const gear = matching(['ruestung', 'waffen', 'klassengegenstand']);
    const skills = matching(['erfahrungen', 'zauberattribut', 'klassenfertigkeit', 'hoffnungsfertigkeit', 'domaenen', 'karten', 'vorrat', 'offen']);
    dialog = document.createElement('dialog');
    dialog.className = 'sheet-edit-dialog';
    dialog.setAttribute('aria-labelledby', 'sheet-edit-title');
    dialog.innerHTML = '<form><header class="sheet-edit-toolbar"><h2 id="sheet-edit-title">'
      + escapeSheet(entry.name) + ' · Charakterbogen</h2><button type="submit">Speichern</button>'
      + '<button type="button" data-sheet-cancel>Abbrechen</button></header>'
      + '<p role="status" class="sheet-edit-message"></p><div class="sheet-edit-fields">'
      + section('Basisdaten', identity, original) + section('Spielwerte', numbers, original)
      + section('Ausrüstung', gear, original) + section('Erfahrungen und Fähigkeiten', skills, original)
      + '</div></form>';
    document.body.append(dialog);
    const currentDialog = dialog;
    const form = dialog.querySelector('form');
    const status = dialog.querySelector('[role="status"]');
    dialog.querySelector('[data-sheet-cancel]').addEventListener('click', () => currentDialog.close());
    dialog.addEventListener('close', () => currentDialog.remove(), { once: true });
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const buttons = [...form.querySelectorAll('button')];
      try {
        const fields = Object.fromEntries(new FormData(form));
        for (const [path, , type] of definitions) if (type === 'checkbox') fields[path] = form.elements.namedItem(path).checked;
        const next = valuesFromSheetForm(original, fields);
        const latest = context.rohStand()?.elements?.[category]?.[entry.id];
        if (!latest) throw new Error('Dieser Eintrag ist nicht mehr vorhanden.');
        const changes = {};
        const base = 'elements/' + category + '/' + entry.id + '/';
        for (const [key, value] of Object.entries(next)) {
          if (!convert && equal(value, original[key])) continue;
          if (!convert && !equal(latest.fields?.spielwerte?.[key], original[key])) {
            throw new Error('Die Spielwerte wurden inzwischen geändert. Bitte den Bogen erneut öffnen.');
          }
          changes[base + 'fields/spielwerte/' + key] = value;
        }
        // Removed display translations must not override a newly entered class.
        for (const key of ['klasseDe', 'unterklasseDe']) {
          if (original[key] && !next[key]) changes[base + 'fields/spielwerte/' + key] = '';
        }
        if (convert) {
          changes[base + 'fields/entryType'] = SHEET_TYPE;
          changes[base + 'fields/characterType'] = 'sc';
        }
        if (!Object.keys(changes).length) { currentDialog.close(); return; }
        const now = new Date().toISOString();
        changes[base + 'updatedAt'] = now;
        changes.updatedAt = now;
        buttons.forEach((button) => { button.disabled = true; });
        status.textContent = 'Wird gespeichert …';
        await context.schreiben(changes, entry.name + ': Charakterbogen');
        currentDialog.close();
        context.neuZeichnen();
      } catch (error) {
        status.textContent = error.message || 'Der Bogen konnte nicht gespeichert werden.';
      } finally { buttons.forEach((button) => { button.disabled = false; }); }
    });
    dialog.showModal();
  }

  function mount() {
    document.querySelectorAll('.sheet-editor-launch').forEach((node) => node.remove());
    if (document.documentElement.dataset.bearbeiten !== 'an') return;
    const article = document.querySelector('.artikel[data-kategorie="characters"]');
    if (!article) return;
    const entry = context.rohStand()?.elements?.characters?.[article.dataset.eintrag];
    if (!entry) return;
    const sheet = isCharacterSheet(entry);
    const bar = document.createElement('div');
    bar.className = 'sheet-editor-launch';
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = sheet ? 'Spielwerte bearbeiten' : 'Als Charakterbogen führen';
    button.addEventListener('click', () => openEditor(entry, 'characters', !sheet));
    bar.append(button);
    article.querySelector('.eintrag-titel')?.after(bar);
    const lore = article.querySelector('.sheet-lore');
    if (lore) lore.open = true;
  }
  context.runtimeHolen()?.beiNeuZeichnen(mount);
  document.addEventListener('bearbeiten-umgeschaltet', mount);
}

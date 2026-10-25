/* [Aufgabe: Prüfwesen]
   Real Chromium acceptance: wiki sheets, blank/filled A4, mobile, and local editing.
   External requests are blocked in an isolated browser profile. No live writes. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { browserPfad, starteServer, withBrowser } from './browser-messen.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const artifactArg = process.argv.indexOf('--artifacts');
const artifacts = artifactArg >= 0 ? resolve(process.argv[artifactArg + 1]) : null;
if (artifacts) mkdirSync(artifacts, { recursive: true });
let checks = 0;
const check = (value, message) => { checks += 1; assert.ok(value, message); };
const tracked = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' });
const files = new Set(tracked.split(/\r?\n/).filter((path) => /\.(?:html|css|js|mjs|json)$/.test(path)));
const source = JSON.parse(readFileSync(join(root, 'daten/quelle.json'), 'utf8'));
const testPage = '/__character-sheet-qa.html';
const fixture = () => readFileSync(join(root, 'wiki.html'), 'utf8').replace('<head>', `<head><script>
  const savedFetch = window.fetch;
  window.fetch = (input, options) => {
    const url = new URL(typeof input === 'string' ? input : input.url, location.href);
    return url.origin === location.origin ? savedFetch(input, options)
      : Promise.reject(new Error('External requests disabled in local QA'));
  };
  window.sheetErrors = [];
  window.addEventListener('error', (event) => window.sheetErrors.push(event.message));
  </script>`);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
const pause = (ms) => new Promise((done) => setTimeout(done, ms));

if (!browserPfad()) {
  if (process.env.CI) console.log('Browserprüfung nicht ausgeführt: Chromium fehlt auf diesem Rechner.');
  else throw new Error('Chromium fehlt für die Charakterbogen-Prüfung.');
} else {
  const server = await starteServer({ hilfsseite: fixture, wurzel: root, dateien: files, typen: types, seite: testPage });
  try {
    const url = 'http://127.0.0.1:' + server.address().port + testPage + '?w=age-of-beast#/eintrag/character-aob-xeno-sc';
    await withBrowser(url, async (cdp) => {
      const evaluate = async (expression) => {
        const response = await cdp.ruf('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
        if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || 'Browser script failed');
        return response.result?.value;
      };
      const wait = async (expression) => {
        for (let attempt = 0; attempt < 600; attempt += 1) {
          if (await evaluate(expression)) return;
          await pause(25);
        }
        throw new Error('Browser condition timed out: ' + expression + ' / ' + JSON.stringify(await evaluate('window.sheetErrors')));
      };
      await wait('document.querySelector("[data-character-sheet] .bogen")');
      await cdp.ruf('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
      check(await evaluate('document.querySelector("[data-character-sheet] [data-wert=evasion]").textContent === "13"'), 'Brix evasion is visible');
      check(await evaluate('document.querySelector("[data-character-sheet]").textContent.includes("vorläufig")'), 'Unconfirmed experience labels are visible');
      check(await evaluate('document.querySelectorAll("[data-character-sheet] .attribut").length === 6'), 'Six dedicated trait boxes');
      check(await evaluate('document.querySelectorAll("[data-character-sheet] .sheet-section-icon").length >= 6'), 'Meaningful section icons');
      check(await evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), 'Desktop has no horizontal overflow');
      const worldBefore = await evaluate('JSON.stringify(window.ageOfBeast.weltHolen())');
      if (artifacts) {
        const image = await cdp.ruf('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
        writeFileSync(join(artifacts, 'bogen-desktop.png'), Buffer.from(image.data, 'base64'));
      }
      for (const [id, name] of [['character-aob-xeno-sc', 'brix'], ['character-aob-lukas-sc', 'lukas']]) {
        await evaluate('location.hash = "#/eintrag/' + id + '"');
        await wait('document.querySelector("[data-character-sheet]")?.dataset.characterSheet === "' + id + '" && document.querySelector("[data-character-sheet] .bogen")');
        for (const mode of ['filled', 'blank']) {
          await evaluate('document.querySelector("[data-character-sheet] [data-sheet-print]").click()');
          check(await evaluate('document.querySelector(".sheet-print-dialog").open'), name + ': preview opens');
          await evaluate(`(() => { const radio = document.querySelector('.sheet-print-dialog [value="${mode}"]'); radio.checked = true; radio.dispatchEvent(new Event('change', {bubbles:true})); })()`);
          check(await evaluate('document.querySelectorAll(".sheet-print-preview .sheet-print-page").length === 2'), name + ': two preview sheets');
          if (mode === 'blank') {
            check(await evaluate('!document.querySelector("#sheet-print-output").textContent.includes("' + (name === 'brix' ? 'Gambeson' : 'Lederrüstung') + '")'), name + ': printable DOM genuinely omits values');
          }
          const pdf = await cdp.ruf('Page.printToPDF', { preferCSSPageSize: true, displayHeaderFooter: false, printBackground: false });
          const bytes = Buffer.from(pdf.data, 'base64');
          const text = bytes.toString('latin1');
          const pages = (text.match(/\/Type\s*\/Page\b/g) || []).length;
          check(pages === 2, name + ' ' + mode + ': exactly two PDF pages, got ' + pages);
          const box = /\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/.exec(text);
          check(box && Math.abs(Number(box[1]) - 595.28) < 1 && Math.abs(Number(box[2]) - 841.89) < 1, 'PDF uses portrait A4');
          if (artifacts) writeFileSync(join(artifacts, name + '-' + mode + '.pdf'), bytes);
          await evaluate('document.querySelector(".sheet-print-dialog").close()');
        }
      }
      check(await evaluate('JSON.stringify(window.ageOfBeast.weltHolen())') === worldBefore, 'All print operations leave campaign values unchanged');
      await cdp.ruf('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
      await evaluate('window.dispatchEvent(new HashChangeEvent("hashchange"))');
      await wait('document.querySelector("[data-character-sheet] .bogen") && document.querySelector("#rahmen").classList.contains("leiste-zu")');
      check(await evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), 'Mobile has no horizontal page overflow');
      check(await evaluate('document.querySelector(".bogen-kopf-text").getBoundingClientRect().width > 250'), 'Mobile character identity keeps a readable full-width row');
      if (artifacts) {
        const image = await cdp.ruf('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
        writeFileSync(join(artifacts, 'bogen-mobile.png'), Buffer.from(image.data, 'base64'));
      }
      // Use the real edit module with an in-memory writer, never Firebase.
      await evaluate(`(async () => {
        const { strukturEinrichten } = await import('./struktur-bedienung.js');
        const { umwandeln } = await import('./werkzeuge/welt-umwandeln.mjs');
        window.testSource = ${JSON.stringify(source)};
        window.testWrites = 0;
        strukturEinrichten({
          rohStand: () => window.testSource, runtimeHolen: () => window.ageOfBeast,
          melden: () => {}, neuZeichnen: () => window.ageOfBeast.weltSetzen(umwandeln(window.testSource).welt, true),
          schreiben: async (changes) => {
            if (window.testWriteError) throw new Error('Speichern fehlgeschlagen');
            window.testWrites++;
            for (const [path, value] of Object.entries(changes)) {
              const keys = path.split('/'); let node = window.testSource;
              for (const key of keys.slice(0, -1)) { node[key] ||= {}; node = node[key]; }
              node[keys.at(-1)] = structuredClone(value);
            }
          },
        });
        document.documentElement.dataset.bearbeiten = 'an';
        document.dispatchEvent(new Event('bearbeiten-umgeschaltet'));
      })()`);
      await wait('document.querySelector(".sheet-editor-launch button")');
      await evaluate('document.querySelector(".sheet-editor-launch button").click()');
      check(await evaluate('document.querySelector(".sheet-edit-dialog").open'), 'Sheet editor opens in edit mode');
      await evaluate('document.querySelector(".sheet-edit-dialog [name=hp]").value = "7"');
      await pause(2600);
      check(await evaluate('document.querySelector(".sheet-edit-dialog")?.open && document.querySelector(".sheet-edit-dialog [name=hp]").value === "7"'), 'Typing is not interrupted by background saves');
      await evaluate('document.querySelector(".sheet-edit-dialog form").requestSubmit()');
      await wait('!document.querySelector(".sheet-edit-dialog")');
      check(await evaluate('window.testSource.elements.characters["character-aob-lukas-sc"].fields.spielwerte.hp === 7'), 'Structured sheet values are saved');
      check(await evaluate('window.testSource.elements.characters["character-aob-xeno-sc"].fields.spielwerte.hp === 6'), 'Saving Lukas does not change Brix');
      await wait('document.querySelector(".sheet-editor-launch button")');
      const writesBefore = await evaluate('window.testWrites');
      await evaluate('document.querySelector(".sheet-editor-launch button").click(); document.querySelector(".sheet-edit-dialog form").requestSubmit()');
      await wait('!document.querySelector(".sheet-edit-dialog")');
      check(await evaluate('window.testWrites') === writesBefore, 'Saving an unchanged sheet performs no write');
      await evaluate('document.querySelector(".sheet-editor-launch button").click(); document.querySelector(".sheet-edit-dialog [name=hp]").value = "8"; window.testSource.elements.characters["character-aob-lukas-sc"].fields.spielwerte.hp = 9; document.querySelector(".sheet-edit-dialog form").requestSubmit()');
      check(await evaluate('document.querySelector(".sheet-edit-dialog").open && document.querySelector(".sheet-edit-message").textContent.includes("inzwischen")'), 'Concurrent changes keep the editor open with a conflict message');
      check(await evaluate('window.testSource.elements.characters["character-aob-lukas-sc"].fields.spielwerte.hp === 9'), 'Concurrent stored values are not overwritten');
      await evaluate('window.testSource.elements.characters["character-aob-lukas-sc"].fields.spielwerte.hp = 7; window.testWriteError = true; document.querySelector(\'.sheet-edit-dialog [name="ruestung.score"]\').value = "4"; document.querySelector(".sheet-edit-dialog form").requestSubmit()');
      await wait('document.querySelector(".sheet-edit-message").textContent.includes("fehlgeschlagen")');
      check(await evaluate('document.querySelector(".sheet-edit-dialog").open && document.querySelector(".sheet-edit-dialog [name=hp]").value === "8"'), 'Failed save preserves the entered values');
      await evaluate('window.testWriteError = false; document.querySelector(".sheet-edit-dialog form").requestSubmit()');
      await wait('!document.querySelector(".sheet-edit-dialog") && document.querySelector("[data-character-sheet] [data-wert=ruestungswert]")?.textContent === "4"');
      check(await evaluate('window.testSource.elements.characters["character-aob-lukas-sc"].fields.spielwerte.hp === 8'), 'Retry saves the retained draft');
      check(await evaluate('document.querySelector("[data-character-sheet] [data-wert=ruestungswert]").textContent === "4"'), 'Editing known armor updates the displayed calculated value');
      await evaluate('location.hash = "#/bogen-neu"');
      await wait('document.querySelector("[data-neuer-eintrag]")');
      check(await evaluate('document.querySelector("[data-neuer-eintrag]").elements.entryType.value === "character-sheet"'), 'New-sheet route preselects type');
      await evaluate('document.querySelector("[data-neuer-eintrag]").elements.name.value = "QA Neue Figur"; document.querySelector("[data-neuer-eintrag]").requestSubmit()');
      await wait('document.querySelector("[data-character-sheet] .bogen")?.textContent.includes("QA Neue Figur")');
      check(await evaluate('document.querySelector("[data-character-sheet] [data-wert=evasion]").textContent === "—"'), 'New unknown values are not shown as zero');
      check(await evaluate('document.querySelectorAll("[data-character-sheet] .attribut").length === 6'), 'New sheet has all trait fields');
      await evaluate('location.hash = "#/kategorie/characters"');
      await wait('!document.querySelector("[data-character-sheet]")');
      check(await evaluate('!document.body.classList.contains("sheet-print-active")'), 'Leaving a sheet clears its print state');
      check((await evaluate('window.sheetErrors')).length === 0, 'No browser errors');
    });
  } finally {
    server.closeAllConnections();
    await new Promise((done) => server.close(done));
  }
  console.log(checks + ' Browserprüfungen bestanden: Wiki, A4, Mobilansicht, Bearbeitung.');
}

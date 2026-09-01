/* Age-of-Beast-Wiki – klassische Kompatibilitätsfassade und Bootstrap. */
(function () {
  'use strict';
  const bausteine = window.__aobLeserBausteine;
  if (!bausteine || typeof bausteine.routing !== 'function') {
    document.getElementById('inhalt').innerHTML = '<div class="hinweis"><strong>Die Leseruntime konnte nicht geladen werden.</strong></div>';
    return;
  }
  const datenindex = typeof bausteine.datenindex === 'function' ? bausteine.datenindex() : null;
  if (!datenindex || !window.AGE_OF_BEAST_WELT || !Array.isArray(window.AGE_OF_BEAST_WELT.eintraege)) {
    document.getElementById('inhalt').innerHTML = '<div class="hinweis"><strong>Die Weltdaten konnten nicht geladen werden.</strong><br>Die Datei <code>daten/welt.js</code> fehlt oder ist beschädigt. Sie lässt sich mit <code>node werkzeuge/welt-aufbereiten.mjs</code> neu erzeugen.</div>';
    return;
  }
  datenindex.weltSetzen(window.AGE_OF_BEAST_WELT);
  const ansichten = typeof bausteine.ansichten === 'function' ? bausteine.ansichten(datenindex) : null;
  const interaktion = typeof bausteine.interaktion === 'function' ? bausteine.interaktion(datenindex, ansichten) : null;
  if (!ansichten || !interaktion || typeof ansichten.navigationZeichnen !== 'function' || typeof interaktion.einmalInstallieren !== 'function') {
    document.getElementById('inhalt').innerHTML = '<div class="hinweis"><strong>Die Leseruntime ist unvollständig.</strong></div>';
    return;
  }
  const runtime = bausteine.routing({ ansichten, datenindex, interaktion });
  if (!runtime || typeof runtime.start !== 'function') {
    document.getElementById('inhalt').innerHTML = '<div class="hinweis"><strong>Die Leseruntime ist unvollständig.</strong></div>';
    return;
  }
  window.ageOfBeast = runtime.fassade;
  interaktion?.einmalInstallieren();
  runtime.start();
})();

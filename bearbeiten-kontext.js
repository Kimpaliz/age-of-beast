/* ===================================================================
   [Aufgabe: Bearbeiten]
   Age-of-Beast-Wiki – Bearbeitungskontext
   -------------------------------------------------------------------
   Die drei Bearbeitungsmodule erhalten keine Browser-Globals und keine
   Speicherimplementierung mehr direkt. Dieser kleine, eingefrorene Vertrag
   reicht ihnen nur die notwendigen Operationen weiter.

   Wichtig: runtimeHolen() ruft den übergebenen Leser bei jedem Zugriff neu
   auf. Der Runtime-Host wird also nicht beim Anmelden oder Einrichten
   zwischengespeichert und darf später ausgetauscht werden.
   =================================================================== */

const PFLICHT_RUECKRUFE = [
  'rohStand',
  'schreiben',
  'neuZeichnen',
  'melden',
  'runtimeHolen',
];

/** Ein kontrollierter Fehler für unvollständige Kontext-Übergaben. */
export class BearbeitungskontextFehler extends Error {
  constructor(nachricht) {
    super(nachricht);
    this.name = 'BearbeitungskontextFehler';
  }
}

/**
 * Baut den einzigen Vertrag zwischen Speicher-/Runtime-Schicht und den
 * Bearbeitungsmodulen.
 *
 * @param {object} rueckrufe
 * @returns {Readonly<{
 *   rohStand: Function,
 *   schreiben: Function,
 *   neuZeichnen: Function,
 *   melden: Function,
 *   runtimeHolen: Function,
 * }>}
 */
export function bearbeitungskontextErstellen(rueckrufe) {
  if (!rueckrufe || typeof rueckrufe !== 'object' || Array.isArray(rueckrufe)) {
    throw new BearbeitungskontextFehler('Der Bearbeitungskontext braucht ein Objekt mit Rückrufen.');
  }

  const gepruefteRueckrufe = {};
  for (const name of PFLICHT_RUECKRUFE) {
    if (typeof rueckrufe[name] !== 'function') {
      throw new BearbeitungskontextFehler(
        'Der Bearbeitungskontext braucht einen gültigen Rückruf für „' + name + '“.',
      );
    }
    gepruefteRueckrufe[name] = rueckrufe[name];
  }

  Object.freeze(gepruefteRueckrufe);

  return Object.freeze({
    rohStand: (...werte) => gepruefteRueckrufe.rohStand(...werte),
    schreiben: (...werte) => gepruefteRueckrufe.schreiben(...werte),
    neuZeichnen: (...werte) => gepruefteRueckrufe.neuZeichnen(...werte),
    melden: (...werte) => gepruefteRueckrufe.melden(...werte),
    runtimeHolen: () => gepruefteRueckrufe.runtimeHolen(),
  });
}

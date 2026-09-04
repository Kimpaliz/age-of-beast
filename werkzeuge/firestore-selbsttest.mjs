/**
 * Die absichtlichen Beschaedigungen des Trennungswaechters.  [Aufgabe: Prüfwesen]
 *
 * Herausgeloest aus `pruefe-firestore-trennung.mjs` — `docs/ALTLASTEN.md`
 * hatte genau diesen Schnitt vorgesehen: „Die sechs absichtlichen
 * Beschaedigungen, mit denen die Wirksamkeit belegt ist, koennen neben
 * die Blockpruefung."
 *
 * **Warum es sie gibt:** Ein Waechter, der nie rot war, prueft womoeglich
 * nichts. Jede Probe beschaedigt die Regeldatei auf eine Weise, die im
 * Betrieb wirklich vorkommen kann, und der Waechter muss anschlagen —
 * mit einer Meldung, die das `stichwort` enthaelt. Eine Probe, die
 * *irgendeine* Meldung ausloest, genuegt nicht: Dann traefe die Pruefung
 * etwas anderes als den erzeugten Schaden.
 *
 * Die Hilfsfunktionen werden uebergeben statt importiert — sie leben im
 * Waechter, und ein Import von dort waere ein Ringbezug.
 *
 * Kein Browser, kein Netzwerk. Es wird nichts geschrieben.
 */
export function probenBauen({ maskiere, blockLesen, sammlungMuster, opfer }) {
  return [
    {
      name: 'Scotophobias Block match /' + opfer + '/ entfernt',
      brauchtVergleich: true,
      stichwort: opfer,
      aendere: (text) => {
        const maske = maskiere(text);
        const b = blockLesen(text, maske, sammlungMuster(opfer));
        return b ? text.slice(0, b.start) + text.slice(b.ende) : text;
      },
    },
    {
      /* Der gefaehrlichere Fall: Der Block bleibt stehen, nur eine Bedingung
         wird entschaerft. Das faellt beim Lesen niemandem auf. */
      name: 'Bedingung in match /' + opfer + '/ still entschaerft',
      brauchtVergleich: true,
      stichwort: 'weicht von Scotophobias Fassung ab',
      aendere: (text) => {
        const maske = maskiere(text);
        const b = blockLesen(text, maske, sammlungMuster(opfer));
        if (!b) return text;
        return text.slice(0, b.start) + b.text.replace(/if\s+/u, 'if true || ') + text.slice(b.ende);
      },
    },
    {
      name: 'wiki_welt ruft Scotophobias istFreigeschaltet() auf',
      stichwort: 'istFreigeschaltet',
      aendere: (text) => text.replace('if istWikiSchreiber()', 'if istFreigeschaltet()'),
    },
    {
      name: 'Riegel auf if true gestellt',
      stichwort: 'Riegel',
      aendere: (text) => {
        const maske = maskiere(text);
        const b = blockLesen(text, maske, /match\s+\/\{document=\*\*\}\s*\{/u);
        if (!b) return text;
        return text.slice(0, b.start) + b.text.replace('if false', 'if true') + text.slice(b.ende);
      },
    },
    {
      name: 'Wiki-Sammlung ohne Praefix (wiki_welt zu weltdaten)',
      stichwort: 'weltdaten',
      aendere: (text) => text.split('wiki_welt').join('weltdaten'),
    },
    {
      name: 'oeffentliches Lesen der Weltdaten entfernt',
      stichwort: 'Besucher',
      aendere: (text) => text.replace('allow read: if true;', 'allow read: if istWikiSchreiber();'),
    },
  ];
}

/**
 * Bloecke aus einer Firestore-Regeldatei schneiden.  [Aufgabe: Prüfwesen]
 *
 * Herausgeloest aus `pruefe-firestore-trennung.mjs` — `docs/ALTLASTEN.md`
 * hatte diesen Schnitt als naechsten vorgesehen.
 *
 * **Der Kniff steckt in `maskiere()`:** Geklammert wird auch in Pfaden
 * (`match /zugriffsanfragen/{konto}`) und in Kommentaren. Deshalb wird
 * der Text zuerst maskiert — Kommentar- und Zeichenketteninhalte werden
 * durch Leerzeichen ersetzt, **jede Position bleibt erhalten**. Gezaehlt
 * wird auf der Maske, geschnitten aus dem Original; so stehen Kommentare
 * noch im Ergebnis.
 *
 * Kein Browser, kein Netzwerk, keine Datei. Reine Textarbeit.
 */
/* ------------------------------------------------------------------ *
   Werkzeug: Bloecke aus einer Regeldatei schneiden

   Geklammert wird auch in Pfaden (match /zugriffsanfragen/{konto}) und in
   Kommentaren. Deshalb wird der Text zuerst maskiert: Kommentar- und
   Zeichenketteninhalte werden durch Leerzeichen ersetzt, jede Position
   bleibt erhalten. Gezaehlt wird auf der Maske, geschnitten wird aus dem
   Original — so bleiben Kommentare im Ergebnis erhalten.
   ------------------------------------------------------------------ */

export function maskiere(text) {
  const aus = text.split('');
  let i = 0;
  while (i < text.length) {
    const zwei = text.slice(i, i + 2);
    if (zwei === '/*') {
      const ende = text.indexOf('*/', i + 2);
      const bis = ende === -1 ? text.length : ende + 2;
      for (let k = i; k < bis; k += 1) if (aus[k] !== '\n') aus[k] = ' ';
      i = bis;
      continue;
    }
    if (zwei === '//') {
      let ende = text.indexOf('\n', i);
      if (ende === -1) ende = text.length;
      for (let k = i; k < ende; k += 1) aus[k] = ' ';
      i = ende;
      continue;
    }
    const c = text[i];
    if (c === "'" || c === '"') {
      let k = i + 1;
      while (k < text.length && text[k] !== c) {
        if (text[k] === '\\') k += 1;
        k += 1;
      }
      for (let m = i; m <= Math.min(k, text.length - 1); m += 1) if (aus[m] !== '\n') aus[m] = ' ';
      i = k + 1;
      continue;
    }
    i += 1;
  }
  return aus.join('');
}

/* Schneidet den Block, dessen Kopf auf `muster` passt. Das Muster muss mit
   der oeffnenden Klammer des Rumpfes enden — dadurch zaehlen Klammern im
   Kopf wie {konto} nicht mit. */
export function blockLesen(text, maske, muster) {
  const t = new RegExp(muster.source, 'u').exec(maske);
  if (!t) return null;
  const oeffnung = t.index + t[0].length - 1;
  let tiefe = 0;
  for (let i = oeffnung; i < maske.length; i += 1) {
    if (maske[i] === '{') tiefe += 1;
    else if (maske[i] === '}') {
      tiefe -= 1;
      if (tiefe === 0) return { start: t.index, ende: i + 1, text: text.slice(t.index, i + 1) };
    }
  }
  return null;
}

export function funktionMuster(name) {
  return new RegExp('function\\s+' + name + '\\s*\\([^)]*\\)\\s*\\{', 'u');
}

export function sammlungMuster(name) {
  return new RegExp('match\\s+/' + name + '/\\{[A-Za-z0-9_]+\\}\\s*\\{', 'u');
}

/* Namen aller Sammlungen, auf die die Datei Regeln legt. Der Datenbankpfad
   selbst und der Riegel /{document=**} sind keine Sammlungen. */
/**
 * Die Namen der Sammlungen auf **oberster** Ebene.
 *
 * Untersammlungen bleiben aussen vor, und zwar aus dem Grund, aus dem es
 * die Praefixregel ueberhaupt gibt: Sie soll verhindern, dass zwei
 * Anwendungen sich denselben Namen greifen. Eine Untersammlung liegt
 * unter ihrem Elterndokument und kann mit nichts kollidieren —
 * `wiki_projekte/{id}/welt` ist eindeutig, auch ohne Praefix am `welt`.
 * Wuerde man sie mitzaehlen, muesste jede kuenftige Untersammlung
 * `wiki_` heissen, was die Pfade nur laenger und nicht sicherer macht.
 *
 * Gezaehlt wird ueber die Klammertiefe innerhalb des `match /databases`-
 * Blocks: Tiefe 1 ist oberste Ebene.
 */
export function sammlungenLesen(maske) {
  const namen = [];
  const muster = /match\s+\/([A-Za-z0-9_-]+)\/\{/gu;
  let t;
  while ((t = muster.exec(maske)) !== null) {
    if (t[1] === 'databases') continue;
    /* Wie viele offene `match`-Bloecke stehen vor dieser Stelle? Der
       Block `match /databases/...` zaehlt dabei nicht mit. */
    const davor = maske.slice(0, t.index);
    let tiefe = 0;
    for (const zeichen of davor) {
      if (zeichen === '{') tiefe += 1;
      else if (zeichen === '}') tiefe -= 1;
    }
    /* service{ + match /databases{ = 2 offene Klammern auf oberster
       Sammlungsebene. Alles darueber ist eine Untersammlung. */
    if (tiefe <= 2) namen.push(t[1]);
  }
  return namen;
}

export function funktionsnamenLesen(maske) {
  const namen = [];
  const muster = /function\s+([A-Za-z0-9_]+)\s*\(/gu;
  let t;
  while ((t = muster.exec(maske)) !== null) namen.push(t[1]);
  return namen;
}

/* Zeilenenden und reine Einrueckung duerfen sich unterscheiden — das ist
   Formatierung. Alles andere muss zeichengleich sein. */
export function normalisiere(text) {
  return text
    .replace(/\r\n/gu, '\n')
    .split('\n')
    .map((z) => z.replace(/[ \t]+$/u, '').replace(/^[ \t]+/u, ''))
    .join('\n');
}

/* Ruft dieser Text die genannte Funktion auf? Die Klammer davor verhindert,
   dass istAdmin in istWikiAdmin gefunden wird. */
export function ruftAuf(text, name) {
  return new RegExp('(?<![A-Za-z0-9_])' + name + '\\s*\\(', 'u').test(text);
}

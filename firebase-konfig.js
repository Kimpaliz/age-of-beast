/* ===================================================================
   Age-of-Beast-Wiki – Zugangsdaten des Firebase-Projekts
   -------------------------------------------------------------------
   Diese Werte sind **keine Geheimnisse**. Der Browser muss sie kennen,
   um sich überhaupt anmelden zu können; sie stehen in jeder Firebase-
   Web-Anwendung offen im Quelltext. Geschützt werden die Daten durch
   `firestore.rules` und die Anmeldung, nicht durch das Verstecken
   dieser Zeilen.

   Das Wiki teilt sich das Projekt `kampagnenrahmen-jt` mit anderen
   Anwendungen — unter anderem mit dem Spiel Scotophobia. Getrennt sind
   sie durch eigene Sammlungen (`wiki_*`) und eigene Regelblöcke. Wer
   bei Scotophobia freigeschaltet ist, darf dadurch **nicht** das Wiki
   bearbeiten.

   Warum kein eigenes Firebase-Projekt: Ein zweites Projekt wäre die
   deutlichere Trennung, aber Jannik verwaltet dann zwei Konsolen, zwei
   Kostenübersichten und zwei Anmeldeeinstellungen. Innerhalb eines
   Projekts leisten getrennte Sammlungen dasselbe, solange die Regeln
   sie nicht vermischen — und genau das prüft
   `werkzeuge/pruefe-firestore-trennung.mjs` bei jeder Veröffentlichung.
   =================================================================== */

export const FIREBASE = {
  apiKey: 'AIzaSyAJ8dXU-Jzn_8JK-Jb4Qw-r-butAQnTlYE',
  authDomain: 'kampagnenrahmen-jt.firebaseapp.com',
  projectId: 'kampagnenrahmen-jt',
  storageBucket: 'kampagnenrahmen-jt.firebasestorage.app',
  messagingSenderId: '971944384167',
  appId: '1:971944384167:web:94518864ee402fa6f96d82',
};

/** Nur dieses Konto darf ohne weitere Freigabe bearbeiten. Dieselbe
    Bedingung steht in `firestore.rules` — hier ist sie nur die Anzeige,
    dort ist sie die Sicherung. */
export const ADMIN_EMAIL = 'kimpaliz1989@gmail.com';

/** Fassung des Firebase-SDK. Wird nur beim Anmelden geladen; wer das
    Wiki bloß liest, holt keine einzige fremde Datei. */
export const SDK = 'https://www.gstatic.com/firebasejs/12.0.0';

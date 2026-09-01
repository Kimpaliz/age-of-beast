# Age of Beast – QA-Matrix

Diese Matrix trennt klar zwischen dem, was heute automatisch geschützt ist,
und dem, was bei einem Upgrade zusätzlich getestet werden muss.

## Bestehende lokale Gates

| Befehl | Aktuell geschützter Vertrag | Bewusste Lücke |
| --- | --- | --- |
| node werkzeuge/pruefe-gleichstand.mjs | Quelle erzeugt die angezeigte JSON-Welt. | Kein vollständiger Schema-/Referenzvertrag. |
| node werkzeuge/pruefe-schreibweise.mjs | Sichtbarer Text bleibt beim Umwandeln erhalten. | Kein Browser-Bedienpfad. |
| node werkzeuge/pruefe-bearbeiten.mjs | Bearbeitbare Felder lassen sich lesen, schreiben und umwandeln. | Kein echter GitHub-Write und kein DOM-Test. |
| node werkzeuge/pruefe-struktur.mjs | Anlegen, Löschen und Sortieren lässt keine Rohdatenreste. | Kein Assistenten- oder UI-Test. |
| node werkzeuge/pruefe-github.mjs | Base64, Drei-Dateien-Erzeugung und Determinismus. | Keine echte API-, CORS- oder Berechtigungsprüfung. |
| node werkzeuge/pruefe-server-sicherheit.mjs | Öffentliche Server-Dateien, Methoden, Sperren, HEAD und Vorschau-Loopback. | Kein Angriffstest mit lokalem Schreibzugriff zwischen realpath und readFile. |

Zusätzlich vor jedem Upgrade-Paket:

~~~text
node --check wiki.js
node --check daten/welt.js
~~~

Die vier Browser-ES-Module prüft die CI über temporäre .mjs-Kopien. Lokal
werden sie mit derselben Methode geprüft, nicht durch eine globale
package.json-Konfiguration.

## Fehlende, aber geplante Gates

| Gate | Auslöser | Abnahme |
| --- | --- | --- |
| Datenvertrag | Vor jeder Schema- oder Kategorieerweiterung | IDs, Kategorien, Referenzen, Panels, Rahmen und Bildpfade grün. |
| Routen-Smoke | Vor Änderungen an wiki.js oder rahmen-assistent.js | Start, Eintrag, Kategorie, Werkstatt und Rahmen per Direktaufruf und normaler Navigation. |
| Asynchroner Routenwechsel | Vor Erweiterung des Rahmen-Assistenten | Ein verspäteter Ladevorgang darf keine neue Route überschreiben. |
| Cache-Artefakt | Vor Änderung einer Browser-Abhängigkeit | Jede veränderliche Browser-Ressource trägt die Ziel-SHA oder ist ausdrücklich unveränderlich. |
| Visuelle Abnahme | Vor CSS-Trennung oder Werkstatt-Änderung | Desktop, 1024 px und 640 px; hell/dunkel; Wiki, Bearbeiten, Werkstatt und Rahmen. |
| Live-Abnahme | Erst nach autorisiertem main-Push | Actions für Ziel-SHA grün, frischer Browser und konkrete Upgrade-Funktion geprüft. |

## Ausführungsreihenfolge

1. Node 22 verwenden, wenn ein Ergebnis die GitHub-Action abbilden soll.
2. Syntax prüfen.
3. Alle sechs bestehenden Prüfscripts ausführen.
4. Paketbezogene neue Tests ausführen.
5. Erst danach einen Review oder einen ausdrücklich freigegebenen Push
   vorbereiten.

Das Projekt braucht aktuell keinen Paketmanager. Falls später ein
Browser-Testwerkzeug wirklich notwendig wird, wird es als separates Paket mit
pnpm eingeführt; bis dahin wird kein künstliches Node-Projekt angelegt.

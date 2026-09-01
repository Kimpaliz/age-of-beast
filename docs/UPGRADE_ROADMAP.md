# Age of Beast – Upgrade-Fahrplan

**Ausgangspunkt:** v2.7.0 ist funktionsfähig und der veröffentlichte Anker.
Die folgende Reihenfolge schützt Daten, Links und Bearbeitung, bevor Dateien
optisch oder organisatorisch aufgeteilt werden.

Jedes Paket erhält einen eigenen Branch, einen kleinen Commit-Satz, alle
passenden Gates und einen klaren Rücksprung über Revert. Kein Paket verändert
ungefragt Weltinhalte.

## Paket A – Lokale Server und ausgelieferte Dateien begrenzen

**Priorität:** P1
**Status:** Lokal umgesetzt und geprüft, noch nicht veröffentlicht.
**Ziel:** Eine lokale Vorschau bleibt lokal; Netzwerk-Server liefern nur
öffentliche Wiki-Dateien.

| Umfang | Nicht Umfang |
| --- | --- |
| Vorschau explizit an 127.0.0.1 binden; feste Freigabeliste für Browser-Dateien und Karten-SVGs; versteckte, vertrauliche und ausbrechende Pfade sperren; Heim-Server mit derselben Freigabe. | Keine Änderung an Wiki-Daten, GitHub-API oder Pages. |

**Abnahme:** index.html, CSS, JavaScript, daten/welt.js und ein SVG liefern
200; .env, .git, .claude, Credential-/ADC-Dateinamen und kodiertes Traversal
liefern 403. Nicht vorhandene unverdächtige Pfade liefern 404. Vorschau bindet
Loopback; Heim-Server bleibt nur bewusst im NetBird-Modus erreichbar. Der
automatisierte Nachweis ist pruefe-server-sicherheit.mjs.

## Paket B – Routen und Rahmen-Assistent stabilisieren

**Priorität:** P1
**Ziel:** Jeder gültige Deep Link funktioniert bei einem frischen Seitenaufruf;
ein verspäteter Assistent überschreibt keine neue Route.

| Umfang | Nicht Umfang |
| --- | --- |
| Öffentliche Fassade vor Initialrender, registrierter Rahmen-Renderer, Render-Generation oder Abbruchsignal, erneutes Zeichnen nach erfolgreicher Freischaltung. | Kein Umzug von Daten, keine Änderung des Speichervorgangs. |

**Abnahme:** #/, #/eintrag/<id>, #/kategorie/<id>, #/werkstatt und
#/rahmen/<id> funktionieren bei harter Navigation und Hashwechsel. Ein
bewusst verzögertes Laden des Assistenten darf nach Routewechsel nicht in
#inhalt schreiben.

## Paket C – Datenvertrag als lesender Wächter

**Priorität:** P1
**Ziel:** Neue Kategorien, IDs, Verweise, Panels, Rahmen und Bildpfade können
nicht mehr still ungültig werden.

| Umfang | Nicht Umfang |
| --- | --- |
| Neuer rein lesender Prüfer pruefe-datenvertrag.mjs, Legacy-v0-Unterstützung, in CI und lokale QA aufgenommen. | Noch kein Schreiben von datenvertragVersion: 1, keine Datenmigration. |

**Abnahme:** Aktueller Bestand ist grün; jede absichtlich verletzte Regel
scheitert mit einem eindeutigen Fehler; bestehende fünf Prüfer bleiben grün.

## Paket D – GitHub-Schreibvertrag und Konfliktschutz härten

**Priorität:** P1
**Ziel:** Ein veralteter Bearbeitungsstand kann nicht nach einer Lücke im
Optimistic Locking gespeichert werden.

| Umfang | Nicht Umfang |
| --- | --- |
| Quellen-SHA verpflichtend machen, gegen den tatsächlich gelesenen Head prüfen, genau drei Weltdateien zulassen, Konflikt testbar abbrechen lassen. | Kein echter GitHub-Schreibtest ohne ausdrückliche Autorisierung; keine Änderung der fachlichen Daten. |

**Entscheidungspunkt:** Schlüssel nur für die Sitzung oder optional dauerhaft
speichern. Diese UX-Entscheidung wird vor der Umsetzung explizit getroffen.

**Abnahme:** Fehlende oder alte SHA führt vor dem Schreiben zu einem
kontrollierten Fehler; nur Quelle plus beide Ableitungen können im Weltpfad
gespeichert werden; bestehender GitHub-Attrappentest bleibt grün.

## Paket E – Branch-QA und vollständiger Cache-Graph

**Priorität:** P1
**Ziel:** Ein strukturelles Paket scheitert vor main und lädt keine Mischung
aus neuen Startdateien und alten importierten Modulen.

| Umfang | Nicht Umfang |
| --- | --- |
| Nicht veröffentlichender QA-Workflow für Branch oder Pull Request; Artefakt-Prüfung für alle veränderlichen Browser-Abhängigkeiten. | Kein automatischer Push, kein automatisches Deploy. |

**Abnahme:** Der QA-Lauf veröffentlicht nie; fehlende SHA-Kennung für eine
veränderliche Abhängigkeit schlägt fehl; der main-Lauf bleibt der einzige
Pages-Deploypfad.

## Paket F – Bearbeitungskontext explizit machen

**Priorität:** P2
**Ziel:** Text-, Struktur- und Rahmenmodule haben eine klar beschriebene
Schnittstelle statt verdeckter Global- und DOM-Abhängigkeiten.

| Umfang | Nicht Umfang |
| --- | --- |
| Kontext für Rohstand lesen, Änderung anfordern, neu zeichnen, Fehler melden und Runtime lesen. | Kein neues Datenformat und keine externe Anmeldung. |

**Abnahme:** Modus an/aus, Textänderung, Strukturänderung, Seitenwechsel,
Rahmen-Freischaltung und Fehlerfall funktionieren ohne doppelte Listener.

## Paket G – Leseruntime nach Verantwortung teilen

**Priorität:** P2
**Ziel:** wiki.js wird eine schmale Kompatibilitätsfassade statt eine
Sammeldatei.

**Reihenfolge:** Zuerst Datenindex, dann Routing/Ansichten, dann
Interaktionen. Nach jedem Teil bleibt window.ageOfBeast kompatibel.

**Abnahme:** Genau ein Initialrender, keine doppelten Event-Listener, alle
Hash-Routen und die bestehenden Bearbeitungstests grün.

## Paket H – Styles nach Feature trennen und visuell absichern

**Priorität:** P2
**Ziel:** Stilregeln sind nachvollziehbar, ohne aktuelle Darstellung zu
verändern.

**Reihenfolge:** Tokens/Layout → Wiki → Bearbeitung → Werkstatt/Rahmen →
erst dann nachgewiesen tote Selektoren entfernen.

**Abnahme:** Desktop, 1024 px und 640 px; hell/dunkel; Wiki, Bearbeitung,
Werkstatt und Rahmen ohne horizontalen Überlauf. Der gewünschte
Werkstatt-Farbkontext wird an Übersicht und Assistent explizit geprüft.

## Erst danach: fachliche Erweiterungen

Neue Regelwiki-Bereiche, Kategorien, Rahmenfelder, Karten oder Inhalte
beginnen erst nach Paket C. Dann wird jede Fachänderung zugleich mit
Datenvertrag, Transformation, Anzeige, Asset-Zuordnung und passenden
Prüffällen geplant.

## Leistungsgrenze

Bei 58 Einträgen, 347 Abschnitten und 234 SVG-Wappen ist keine
Performance-Umschreibung gerechtfertigt. Erst bei messbar wachsender
Datenmenge wird gezielt geprüft:

- vorkleingeschriebene Suchtexte statt Suche über alle Rohtexte pro Eingabe,
- einmalige Werkstattzahlen pro Render,
- Pointer-Effekte über requestAnimationFrame,
- Größen- und Request-Budget für neue Asset-Sammlungen.

Das sind Beobachtungspunkte, keine voreiligen Optimierungen.

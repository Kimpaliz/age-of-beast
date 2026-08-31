# Age of Beast – Datenvertrag

**Gültig für den aktuellen Bestand:** Vertragsstand v0
**Geplante Weiterentwicklung:** Ein separates Feld datenvertragVersion: 1,
ohne die vorhandene Rohdatenversion 42 umzudeuten.

## Kanonische Quelle und Ableitungen

~~~text
daten/quelle.json
       │ weltDateien() und Aufbereitung
       ├─ daten/welt.json
       └─ daten/welt.js → window.AGE_OF_BEAST_WELT
~~~

| Datei | Status | Regel |
| --- | --- | --- |
| daten/quelle.json | kanonisch | Ausschließlich diese Datei fachlich bearbeiten. |
| daten/welt.json | abgeleitet | Muss byte- und inhaltlich aus derselben Aufbereitung stammen. |
| daten/welt.js | abgeleitet | Muss dieselbe Welt als Browser-Global ausliefern. |
| daten/rahmen-felder.json | separater UI-Descriptor | Beschreibt Schritte und Felder des Assistenten, ist nicht Teil des Welt-Dreierpakets. |

## Gegenwärtige Struktur

quelle.json besitzt die Top-Level-Felder createdAt, elements, project, tools,
updatedAt, version und rahmen. Der aktuelle Bestand enthält 57 Roh-Einträge,
einen Kampagnenrahmen und 58 sichtbare abgeleitete Wiki-Einträge.

Die heute bekannten Kategorien sind wiki, factions, species, characters,
items, werkstatt und regeln. Neue Kategorien müssen gleichzeitig
Transformation, Validierung, Anzeige und falls erforderlich Asset-Mapping
erhalten. Ein bloßes neues Objekt in elements reicht nicht.

## Identitäts- und Integritätsregeln

Der künftige Prüfer pruefe-datenvertrag soll mindestens diese Regeln
maschinenlesbar durchsetzen:

1. Der Map-Schlüssel elements[category][id] entspricht immer element.id.
2. IDs sind global eindeutig, auch gegenüber rahmen[id].
3. Jede Kategorie ist dem Transformator bekannt.
4. Jeder Eintrag hat nur eindeutige Panel-IDs; panelOrder verweist genau auf
   die erlaubten Panels.
5. Jede attributeRows-Kennung besitzt den passenden fields-Eintrag.
6. Referenzen und connections.targetId zeigen auf existierende globale IDs.
7. Bildpfade sind lokale Pfade unter daten/ und enthalten keinen
   Verzeichnis-Ausbruch.
8. Ein Rahmen darf keinen vorhandenen Werkstatt-Eintrag verdrängen.
9. Der Rahmen-Descriptor besitzt eine eigene Versionskennung, eine
   Pfad-Allowlist und nachvollziehbare Validierungsregeln.

Der Validator muss den aktuellen vertragslosen Bestand als Legacy-v0 lesen
können. Erst wenn er für v0 grün ist, wird datenvertragVersion: 1 in einer
kontrollierten Drei-Dateien-Änderung ergänzt.

## Bearbeiten und GitHub-Persistenz

~~~text
Browser lädt quelle.json + Blob-SHA
  → Bearbeitung arbeitet auf einer Kopie des Rohstands
  → weltDateien(Kopie) erzeugt Quelle, welt.json und welt.js
  → GitHub-Git-Data-API legt drei Blobs, Baum und Commit an
  → nicht erzwungenes Ref-Update veröffentlicht den gesamten Commit
  → Browser lädt die Quelle erneut und zeichnet neu
~~~

Der sichtbare Branchwechsel ist atomar: main zeigt entweder auf den alten
Commit oder auf einen Commit mit allen drei Daten-Dateien. Vor dem finalen
Ref-Update können unverknüpfte Git-Objekte entstehen; sie zeigen keinen
partiellen Stand auf main.

## Regeln für den Speicheradapter

1. Der Adapter akzeptiert für Weltänderungen ausschließlich genau die drei
   Vertragsdateien.
2. Eine erwartete Quellen-SHA ist Pflicht. Fehlt sie nach einem fehlgeschlagenen
   Nachladen, wird nicht gespeichert.
3. Nach dem Lesen des aktuellen Branch-Head wird die erwartete Quellen-SHA
   gegen diesen Head geprüft. So wird das Zeitfenster zwischen erster Prüfung
   und Commit-Aufbau geschlossen.
4. Das finale Ref-Update bleibt nicht erzwungen. Jeder Konflikt endet ohne
   Überschreiben mit einer verständlichen Neulade-Aufforderung.
5. Lokale Schlüsselverwaltung wird als eigene Sicherheitsentscheidung
   behandelt; ein Schreibschlüssel gehört weder in Quelldaten noch in Tests.

## Nicht verwenden

- welt-holen.mjs --wirklich ist ein historischer Rückweg und kein normaler
  Teil eines Upgrades. Er darf nur mit klarer, gesonderter Entscheidung
  eingesetzt werden.
- Abgeleitete Dateien niemals manuell reparieren.
- Den Rahmen-Descriptor nicht wie freien Weltinhalt behandeln; neue Pfade
  müssen vor dem Schreiben erlaubt und validiert sein.

Die Abfolge vom Validator bis zur harten Persistenz steht im Upgrade-Fahrplan.

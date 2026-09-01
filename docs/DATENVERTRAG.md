# Age of Beast – Datenvertrag

**Gültig für den aktuellen Bestand:** Legacy-v0. Der Vertrag ist umgesetzt in
`werkzeuge/pruefe-datenvertrag.mjs`, rein lesend und ohne Netz oder temporäre
Dateien. Eine `datenvertragVersion` wird weder verlangt noch geschrieben.

## Kanonische Quelle und Ableitungen

~~~text
daten/quelle.json
       │ weltDateien() und Aufbereitung
       ├─ daten/welt.json
       └─ daten/welt.js → window.AGE_OF_BEAST_WELT
~~~

| Datei | Status | Regel |
| --- | --- | --- |
| `daten/quelle.json` | kanonisch | Ausschließlich diese Datei fachlich bearbeiten. |
| `daten/welt.json` | abgeleitet | Muss gemeinsam mit der Quelle aus derselben Aufbereitung entstehen. |
| `daten/welt.js` | abgeleitet | Liefert dieselbe Welt als Browser-Global aus. |
| `daten/rahmen-felder.json` | separater UI-Descriptor | Beschreibt Schritte und Felder des Assistenten, ist nicht Teil des Welt-Dreierpakets. |

## Was Legacy-v0 konkret schützt

Der Wächter prüft den vorhandenen, absichtlich noch nicht migrierten Bestand:

1. Map-Schlüssel und `element.id` stimmen überein; IDs sind global eindeutig,
   auch gegenüber `rahmen`.
2. Kategorien sind im Transformator bekannt. Der aktuelle Bestand darf aber
   weiterhin Legacy-Einträge ohne optionale Panels, Reihenfolgen oder Attribute
   enthalten.
3. Vorhandene Panel-IDs, `panelOrder`, `attributeRows` und `fields` sind
   eindeutig und miteinander konsistent.
4. Direkte Referenzfelder, `connections.targetId` und nichtleere
   `textLinks[].id` zeigen nur auf existierende globale IDs.
5. Bildpfade liegen lokal unter `daten/`; kodierte oder normale
   Verzeichnis-Ausbrüche sind unzulässig.
6. Rahmen-IDs stimmen mit ihren Map-Schlüsseln überein und verdrängen keinen
   Werkstatt-Eintrag.
7. Der Rahmen-Descriptor besitzt die echte Legacy-Lesekennung `gelesenAm`,
   Schritte, eine vollständige Feld- und Listen-Allowlist sowie die je Pfad
   erwartete Schritt- und Eingabeart.

Der reale Bestand und 18 isolierte Mutationsproben müssen grün sein. Eine
spätere Versionierung ist eine eigene, kontrollierte Datenänderung – kein
Nebenprodukt einer Runtime- oder Stiländerung.

## Bearbeiten und GitHub-Persistenz

~~~text
Browser lädt quelle.json + Blob-SHA
  → Bearbeitung arbeitet auf einer Kopie des Rohstands
  → weltDateien(Kopie) erzeugt Quelle, welt.json und welt.js
  → GitHub-Git-Data-API legt drei Blobs, Baum und Commit an
  → nicht erzwungenes Ref-Update veröffentlicht den gesamten Commit
  → Browser lädt die Quelle erneut und zeichnet neu
~~~

Der sichtbare Branchwechsel ist atomar: `main` zeigt entweder auf den alten
Commit oder auf einen Commit mit allen drei Welt-Dateien. Vor dem finalen
Ref-Update können unverknüpfte Git-Objekte entstehen; sie zeigen keinen
partiellen Stand auf `main`.

## Regeln für den Speicheradapter

1. Der Adapter akzeptiert für Weltänderungen ausschließlich genau
   `daten/quelle.json`, `daten/welt.json` und `daten/welt.js`.
2. Eine erwartete Quellen-SHA ist Pflicht. Fehlt sie nach einem fehlgeschlagenen
   Nachladen, wird nicht gespeichert.
3. Nach dem Lesen des aktuellen Branch-Head wird die erwartete Quellen-SHA
   gegen diesen Head geprüft. Das schließt das Zeitfenster zwischen erster
   Prüfung und Commit-Aufbau.
4. Das finale Ref-Update bleibt nicht erzwungen. Jeder Konflikt endet ohne
   Überschreiben mit einer verständlichen Neulade-Aufforderung.
5. Der Fine-grained-Token liegt ausschließlich in `sessionStorage`; eine
   frühere gleichnamige `localStorage`-Ablage wird beim Start entfernt.

## Nicht verwenden

- `werkzeuge/welt-holen.mjs --wirklich` ist ein historischer Rückweg und kein
  normaler Teil eines Upgrades.
- Abgeleitete Weltdateien niemals manuell reparieren.
- Den Rahmen-Descriptor nicht wie freien Weltinhalt behandeln: Neue Pfade,
  Schritte oder Eingabearten benötigen gleichzeitig Assistent, Quelle,
  Datenvertrag und Prüffall.

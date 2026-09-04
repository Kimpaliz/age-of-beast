# Vorlagen für neue Wiki-Einträge

`vorlagen.html` ist die Vorbereitung für neue Einträge. Sie speichert nichts,
meldet niemanden an und verändert keine Weltdaten. Nach dem Ausfüllen zeigt
sie nur ein fertig geformtes JSON-Objekt zum Kopieren. Der spätere Schreibweg
ist bewusst nicht Teil dieser Seite.

## Starten und benutzen

Die Seite benötigt den lokalen Vorschau-Server, weil sie ihre Vorlagendaten
als Browser-Modul lädt:

```powershell
node werkzeuge/vorschau-server.mjs
```

Danach `http://localhost:4173/vorlagen.html` öffnen, eine Vorlage wählen,
die markierten Pflichtfelder ausfüllen und **Objekt erzeugen** drücken. Ein
leeres Pflichtfeld bleibt am Feld sichtbar markiert. **JSON kopieren** legt
den sichtbaren Entwurf in die Zwischenablage; es entsteht dadurch kein neuer
Eintrag im Wiki.

Ein Feld vom Typ **Verweis** erwartet die ID eines schon vorhandenen
Eintrags, etwa eine Spezies-, Fraktions- oder Orts-ID. Die Seite kann diese
IDs noch nicht durchsuchen, weil sie absichtlich keinen Daten- oder
Anmeldungsweg öffnet.

## Was die Vorlagen erzeugen

Alle Vorlagen führen zu einem Objekt mit `id`, `module`, `name`,
`description`, `fields`, `attributeRows`, `customPanels` und `panelOrder`.
Das entspricht der Rohform in `daten/quelle.json`: kurze Werte stehen in der
Attributliste, längere Texte als eigene Panels. `connections` startet leer;
eine direkte Verbindungsbearbeitung kommt erst mit dem späteren Schreibweg.

Die vier Vorlagen sind in [werkzeuge/vorlagen.mjs](../werkzeuge/vorlagen.mjs)
definiert:

- **NPC** für Volk, Rolle/Beruf, Fraktion, Motiv, Auftreten, Geheimnis und
  Verbindungen.
- **Ort** für Ortsart, Region, Einwohner, Wahrzeichen und Gefahren.
- **POI** für einen konkreten interessanten Punkt mit Ort, Fund und Zustand.
- **Gegenstand** für die Daggerheart-Werte und Wiki-Einordnung.

## Gegenstands-Werte

Die Gegenstandsvorlage ist gegen
`daten/daggerheart-gegenstaende.json` abgesichert. Auswahlfelder übernehmen
die dort tatsächlich vorkommenden Werte für Art, Attribut, Reichweite und
Traglast unverändert. Die weiteren Rohwerte – darunter Schaden, Merkmal,
Wirkung, Rüstungswert (`score`), Schwellen, Stufenwerte, Beutewurf,
Regelquelle und Prüfhinweis – erhalten passende Eingabefelder.

**Seltenheit** heißt im Wiki-Feldformat `rarity`. Die vorhandene
Daggerheart-Datei führt dafür keinen eigenen Wert; das Feld ist daher
optional und ausdrücklich eine eigene Wiki-Einordnung, nicht ein behaupteter
Regelwert.

## Prüfung

```powershell
node werkzeuge/pruefe-vorlagen.mjs
```

Der Wächter prüft die Datenform, eindeutige Feldschlüssel und Auswahlwerte.
Er liest die Gegenstandsdatei bei jedem Lauf, prüft die Abdeckung ihrer
Wertfelder und gibt für jede Vorlage einen Testeintrag an
`welt-umwandeln.mjs` weiter.

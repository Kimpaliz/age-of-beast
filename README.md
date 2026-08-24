# Sturmwende – Weltwiki

Ein Nachschlagewerk zur Daggerheart-Welt **Sturmwende**: Kampagnenübersicht,
Fraktionen, Spezies, Figuren und Gegenstände. Verlinkte Begriffe zeigen beim
Überfahren mit der Maus eine Kurzfassung, ohne dass man die Seite wechseln muss.

**Stand der Weltdaten:** 22. August 2026 · **29 Einträge** · 103 Abschnitte

---

## Wiki ansehen

**Der einfachste Weg:** Doppelklick auf `index.html`. Das Wiki läuft ohne
Installation und ohne Internetverbindung direkt im Browser.

**Wie später im Netz:** einen kleinen lokalen Server starten.

```bash
node werkzeuge/vorschau-server.mjs
```

Danach `http://localhost:4173` im Browser öffnen. Beenden mit `Strg + C`.

---

## Was das Wiki kann

| Funktion | Beschreibung |
| --- | --- |
| **Verweise im Text** | Namen anderer Einträge werden im Fließtext automatisch verlinkt. |
| **Vorschau beim Überfahren** | Die Maus über einen Verweis halten zeigt Kategorie, Kurztext und Anzahl der Verknüpfungen. Auf dem Handy genügt ein Antippen. |
| **Verknüpfungen** | Jede Seite zeigt, womit der Eintrag fest verbunden ist – und wo er sonst noch erwähnt wird. |
| **Suche** | Sucht in Namen, anderen Bezeichnungen und im gesamten Fließtext. Taste `/` springt ins Suchfeld. |
| **Filter** | Auf der Startseite lässt sich nach Kategorie eingrenzen. |
| **Hell und dunkel** | Umschaltbar oben rechts. Dunkel ist die Voreinstellung. |
| **Handy und Tablet** | Vollständig nutzbar; die Seitenleiste klappt ein. |

Alle Inhalte sind Text. Es gibt keine Bilder, keine Werbung, keine
Nachverfolgung und keine Verbindung nach außen.

---

## Aufbau des Projekts

```
index.html                 die Seite selbst
stil.css                   die gesamte Gestaltung
wiki.js                    Navigation, Suche, Verweise, Vorschau
daten/welt.json            die Weltdaten (gut lesbar, gut vergleichbar)
daten/welt.js              dieselben Daten für den Betrieb ohne Server
werkzeuge/                 Skripte zum Aktualisieren und Ansehen
```

Bewusst **ohne** Baukasten, ohne `npm install`, ohne Übersetzungsschritt:
Wer die Dateien herunterlädt, kann das Wiki sofort öffnen.

---

## Inhalte aktualisieren

Die Inhalte werden in der **Weltenschmiede** gepflegt, nicht in diesem
Repository. Um den hier abgelegten Stand aufzufrischen, sind zwei Befehle nötig:

```bash
node werkzeuge/welt-holen.mjs
```

```bash
node werkzeuge/welt-aufbereiten.mjs
```

Der erste Befehl **liest** den aktuellen Stand aus der Weltenschmiede. Er
schreibt niemals in die Datenbank. Voraussetzung ist eine einmalige Anmeldung
auf dem eigenen Rechner mit `gcloud auth application-default login`.

Der zweite Befehl wandelt die Rohdaten in das Wiki-Format um und meldet am
Ende genau, wie viele Abschnitte, Attribute und Verknüpfungen entstanden sind.

> **Wichtig:** Änderungen am Text gehören in die Weltenschmiede. Wer die
> Dateien unter `daten/` von Hand bearbeitet, verliert seine Änderungen beim
> nächsten Auffrischen.

---

## Änderungen nachlesen

Es gibt zwei Änderungsprotokolle mit demselben Inhalt in unterschiedlicher
Sprache:

- **[CHANGELOG.md](CHANGELOG.md)** – in normalem Deutsch, ohne Fachbegriffe.
- **[CHANGELOG-TECHNIK.md](CHANGELOG-TECHNIK.md)** – in der üblichen Entwicklerform.

---

## Herkunft der Inhalte

Die Weltdaten stammen aus dem Weltenschmiede-Projekt *Sturmwende*. Die
Spezies-Einträge beruhen auf dem Daggerheart-Grundregelwerk beziehungsweise
der SRD 1.0 sowie den Erweiterungen; die jeweilige Quelle steht auf jeder
Spezies-Seite unter **Herkunft**.

Daggerheart ist ein Produkt von Darrington Press. Dieses Wiki ist ein
privates Hilfsmittel für eine Heimrunde und steht in keiner Verbindung zum
Verlag.

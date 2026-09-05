# Änderungen – einfach erklärt

Hier steht in normalem Deutsch, was sich im Wiki geändert hat. Ohne Fachbegriffe.
Dieselben Änderungen stehen in Entwicklersprache in [CHANGELOG-TECHNIK.md](CHANGELOG-TECHNIK.md).

Das Neueste steht immer oben.

## Zwei Meldungen von dir behoben – 5. September 2026

### „Auf den Karten kann man nicht scrollen"

Du hattest recht, und die Ursache war eine einzige Zeile.

Jede der 393 Karten hat einen Textbereich, der **rollen kann**, falls der
Regeltext einmal nicht in die Karte passt. Daneben stand eine Anweisung:
„und gib die Bewegung nicht an die Seite weiter". Gemeint war: Wer in
einem langen Regeltext blättert, soll nicht aus Versehen die ganze Seite
verschieben.

**Gemessen: Kein einziger der 393 Texte läuft je über** — weder am
Bildschirm noch am Handy. Es gab also 393 Bereiche, die selbst nie rollen,
aber das Weiterrollen der Seite verhindern. Und sie bedecken **zwei
Drittel jeder Karte**. Praktisch hieß das: Du musstest die schmalen
Lücken zwischen den Karten treffen.

Die Anweisung ist weg. Der Textbereich kann weiterhin rollen, falls es
je nötig wird — er gibt die Bewegung jetzt nur weiter.

### „Die Ursprungswerte stehen unten ohne Hintergrund"

Auch das stimmte, und es war mein Fehler von heute Vormittag.

Das Kästchen, das beim Überfahren erscheint, hatte seinen Hintergrund
nicht selbst — den brachte die **Karte darin** mit. Das ging so lange
gut, wie nur Karten darin standen. Die neue Herleitung ist keine Karte,
also stand sie ohne Kästchen frei am Bildschirmrand.

Jetzt trägt das Kästchen den Hintergrund selbst. Damit sieht auch alles
richtig aus, was später einmal hineinkommt.


## Die Regeln im Wiki stehen jetzt in Kapiteln – 5. September 2026

Die 26 Regelartikel standen alphabetisch in einem Raster. Praktisch
heißt das: „Aktionswurf" neben „Angriffe und Ausweichen" neben
„Ausrüstung und Gold" — Wurfregeln zwischen Regeln für die
Spielleitung, und man musste jeden Titel einzeln lesen.

Jetzt sind sie in fünf Blöcken, in der Reihenfolge des Regelwerks:

| | |
| --- | ---: |
| Grundlagen | 6 |
| Charaktere | 5 |
| Konflikte | 7 |
| Spielleitung | 7 |
| Nachschlagen | 1 |

Die Überschrift bleibt beim Blättern oben stehen — so weißt du auch
mitten in den Spielleitungsregeln noch, worin du blätterst. Genau wie
auf der Kartenseite.

**Auch die Spezies sind gegliedert:** 18 Kern-Abstammungen, 6
Erweiterungs-Abstammungen.

**Woher die Gliederung kommt:** Jeder Eintrag trägt seine Art schon
selbst mit sich. Es gibt keine zweite Liste, die jemand nachpflegen
müsste — kommt eine neue Art dazu, entsteht ihr Block von allein.

**Kurze Listen bleiben ungegliedert.** Bei zwei Fraktionen wären zwei
Überschriften mit je einem Eintrag keine Hilfe, sondern Lärm. Gegliedert
wird ab acht Einträgen.


## Die Charakterbögen rechnen jetzt mit – 5. September 2026

Dein Wunsch: *„Die Charakterbögen, die Werte wie Stress, HP, Rüstung
usw. sollen sich automatisch ändern beim An- oder Ablegen von Items. Und
beim Drüberhalten wird angezeigt, was Grundwert und was Bonus oder Malus
ist und wodurch es verursacht wird."*

### Ausrüstung an- und ablegen

Neben jedem Ausrüstungsstück steht ein Kästchen. Tippst du es an, ist
das Stück abgelegt — und **alle Werte oben rechnen sich sofort mit**:
Ausweichen, Rüstung, die Schadensschwellen, die Attribute. Nimmt Brix
den Gambeson ab, fällt sein Rüstungswert von 3 auf 0 und die schwere
Schwelle von 6 auf 1.

Ein abgelegtes Stück **verschwindet nicht** aus der Liste, es wird nur
durchgestrichen. Sonst könntest du es nicht wieder anlegen — und wüsstest
nicht, warum eine Zahl kleiner ist als auf deinem Blatt. Oben am Bogen
steht dann ein Hinweis mit einem Knopf „Alles anlegen".

Was du an- und abgelegt hast, merkt sich dein Gerät. Es steht **nicht**
in den Weltdaten: Was du gerade trägst, ist ein Spielzustand am Tisch und
keine Aussage über die Figur.

### Beim Drüberhalten steht, woher die Zahl kommt

Fahre über eine Zahl (auf dem Handy: antippen), und es erscheint die
Herleitung — Grundwert, jeder Bonus, jeder Malus, und **wodurch**:

> **Ausweichen 13** · Grundwert 13 · −1 durch Dolch · +1 durch Gambeson

Zahlen, hinter denen etwas steckt, sind gepunktet unterstrichen. Werte,
an denen die Ausrüstung etwas geändert hat, sind farbig hervorgehoben.

### Was bewusst *nicht* eingerechnet wird

Von den Gegenständen im Regelwerk sind die wenigsten reine Zahlen. Sätze
wie „1 Stress markieren, um ein weiteres Ziel anzugreifen" hängen an
einer Entscheidung am Tisch — die kann kein Rechner treffen. Solche
Wirkungen stehen jetzt **unter der Ausrüstungsliste als Hinweis** und
werden nicht in die Werte gerechnet. Eine geratene Zahl wäre schlimmer
als keine: Der Bogen zeigte dann etwas, das im Spiel nicht gilt.

### Ein Fund, den du kennen solltest

Beim Nachrechnen ist aufgefallen: In unserer Regelrecherche steht beim
**Dolch** „Heavy: −1 Ausweichen". Das passt nicht zu einem einhändigen
Dolch — und drei weitere Merkmale in derselben Tabelle stehen genau eine
Zeile unter einer Waffe, zu der sie besser passen würden. Es sieht nach
einer verrutschten Spalte aus.

**Ich habe nichts geändert.** Das ist eine Regelfrage, und geraten wird
hier nichts. Es steht als Fehler-Vorgang auf GitHub. Auf dem Bogen siehst
du die Wirkung jetzt direkt am Dolch stehen — schau am Spieltisch nach,
ob sie stimmt.


## Fahrplan, Wünsche und Fehler leben jetzt auf GitHub – 4. September 2026

Bisher standen offene Punkte als Absätze in Dokumenten. Das geht so
lange gut, bis jemand etwas baut und vergisst, den Absatz nachzuziehen —
und dann steht dort monatelang „noch offen", obwohl es längst fertig
ist. Niemand merkt es, weil nichts kaputtgeht.

**Ab jetzt sind es Vorgänge im Projekt selbst.** Auf
<https://github.com/Kimpaliz/age-of-beast/issues> siehst du, was offen
ist — und zwar immer, ohne dass jemand eine Liste pflegen muss.

### Es gibt fünf Sorten

| | wofür |
| --- | --- |
| **Wunsch** | Was du dir wünschst. Dein Wortlaut bleibt darin stehen. |
| **Phase** | Ein größeres Vorhaben aus dem Fahrplan. |
| **Schritt** | Ein Stück Arbeit mit **einem** Kriterium, wann es fertig ist. |
| **Fehler** | Etwas ist kaputt. |
| **Entscheidung** | Eine Frage, die nur du beantworten kannst. |

**Ein Wunsch und eine Phase enthalten selbst keine Arbeit** — die Arbeit
sind ihre Schritte. Du siehst am Balken, wie viele davon erledigt sind.

### Was schon drinsteht

Drei Vorhaben mit sechs Schritten: die Wikis mit eigenen Inhalten, die
mitrechnenden Charakterbögen, und die Gruppierung der Regeleinträge.
Dazu dein Charakterbogen-Wunsch im Wortlaut und der behobene
Filter-Fehler — der ist gleich als erledigt eingetragen, damit man sieht,
wie ein abgeschlossener Vorgang aussieht.

### Du kannst selbst welche anlegen

Auf GitHub unter „New issue" stehen jetzt drei Formulare: **Wunsch**,
**Fehler**, **Entscheidung**. Sie fragen genau das ab, was gebraucht
wird — beim Wunsch ausdrücklich in deinen eigenen Worten, nichts
glattgezogen.

## Aufgeräumt – 4. September 2026

Kein neues Können, nichts sieht anders aus. Aber das Projekt erklärt
sich jetzt selbst, und drei Stellen, an denen es sich stillschweigend
selbst widersprochen hat, sind weg.

**Jede Datei sagt jetzt, wozu sie gehört.** 45 Programmdateien hatten
das nicht. Beim Nachsehen stellte sich heraus: Sie hatten alle längst
eine Erklärung im Kopf — es fehlte nur die eine Zeile, die sie einem
Bereich zuordnet. Die Überschrift der Rückstandsliste sagte „ohne
Erklärung" und versprach damit viel mehr Arbeit, als übrig war.

**Ein Sammelbegriff hat drei Dinge zusammengeworfen.** Der Bereich
„Karte" enthielt die Weltkarte, die Daggerheart-Spielkarten und die
Charakterbögen — drei Sachen, die nichts miteinander zu tun haben und
nur zufällig im selben Ordner liegen. Sie sind jetzt getrennt.

**Fünf Dokumente beschrieben eine Vergangenheit als Gegenwart.** Sie
liegen jetzt in einem Ordner „geschichte" und tragen oben, was
stattdessen gilt. Eins von ihnen behauptete, der Stand sei ein
bestimmter — und war zum Zeitpunkt des Aufräumens schon überholt.

**Neu ist eine Kontrolle dagegen.** Sie schlägt an, sobald ein Dokument
etwas über das Jetzt behauptet („ist live", „noch offen"). Mit Datum
davor ist es erlaubt — dann ist es ein Nachweis und wird nicht falsch,
sondern alt.

## Die Kategorien filtern wieder, und die Karten stehen in Gruppen – 4. September 2026

**Zwei Meldungen von dir, beide zutreffend.**

### „Die Kategorien filtern nichts im Wiki"

Stimmte — und der Grund war unsichtbar. Der Filter hat die ganze Zeit
korrekt gearbeitet: Er hat jeder Kachel, die nicht passt, den Vermerk
„nicht anzeigen" gegeben. Nur hat eine andere Gestaltungsregel diesen
Vermerk übertönt. Gemessen nach einem Klick auf „Spezies": **35 Kacheln
waren als versteckt markiert, und keine einzige davon war weg.**

Es gab keine Fehlermeldung, nichts stürzte ab, und alle Prüfungen waren
grün. Genau deshalb ist es so lange stehen geblieben.

Jetzt gilt für die ganze Seite eine Grundregel, die sich von keiner
anderen mehr übertönen lässt. Nachgemessen: Spezies zeigt 24 Einträge,
Fraktionen 2, Regeln 26, „Alle" wieder alle 59.

### „Die Karten sollen von Anfang an schon gruppiert sein"

Auch richtig, und ich hatte es verwechselt: Die **Filterleiste** war
nach Gruppen sortiert, die **Karten** darunter nicht. Dort standen
**393 Karten in einer einzigen Wand**, davon 189 Domänenkarten am Stück.

Jetzt stehen sie in **17 Blöcken** mit Überschrift: erst die neun
Domänen mit je 21 Karten, dann Abstammungen, Gemeinschaften und
Unterklassen, dann die Ausrüstung. Die Überschrift bleibt beim Blättern
oben stehen, damit du immer weißt, wo du gerade bist.

Filterst du auf eine einzelne Art, fällt die Überschrift weg — der
gedrückte Knopf sagt es dann schon.

## Der Knopf »Zurück ins Wiki« geht wieder ins Wiki – 4. September 2026

Seit das Hauptmenü die Startseite ist, führte der Knopf oben rechts auf
den Unterseiten — Karten, Charakterbogen, Weltkarte, Favoriten, Vorlagen —
**ins Hauptmenü** statt ins Wiki. Zehn Verweise auf fünf Seiten. Nichts
ist dabei abgestürzt, es hat nur jedes Mal etwas anderes getan, als
draufstand.

Das ist mein Fehler von heute Nachmittag: Ich habe das Wiki auf eine
eigene Seite gezogen und die Verweise nicht mitgenommen.

Jetzt zeigen sie fest aufs Wiki. Und weil es später mehrere Wikis geben
soll, wird beim Zurückgehen auch gemerkt, in **welchem** du warst.

Damit das nicht wiederkommt, prüft eine neue Kontrolle jetzt etwas, das
vorher niemand geprüft hat: **ob ein Verweis wirklich dorthin führt, wo
sein Text es verspricht.** Sie liest die Beschriftung und vergleicht sie
mit dem Ziel.

Nebenbei ist dabei aufgefallen, dass die Übersicht aller Kontrollen nicht
mehr stimmte: Sechs fehlten darin, und eine war aufgeführt, die es gar
nicht mehr gibt. Beides korrigiert — und auch das wird jetzt geprüft.

Und noch etwas beim Nachmessen auf dem Handy: Der Knopf war dort nur
**32 Bildpunkte** hoch — zu wenig für einen Finger, üblich sind 44. Auf
Geräten mit Touch ist er jetzt größer; am Rechner mit Maus bleibt alles
wie es war.

## Aufräumen hinter der Reparatur – 4. September 2026

Die Begründung, warum der Farbwächter auf dem Bauserver anders arbeitet,
hat seine Datei über die Grenze von 500 Zeilen gebracht. Der Teil, der
einen Browser startet und fernsteuert, ist deshalb in eine eigene Datei
gewandert — er ist ohnehin ein eigenes Thema und lässt sich beim nächsten
Mal wiederverwenden.

Beim Herauslösen habe ich dreimal nachbessern müssen, und jedes Mal hat
es erst ein echter Lauf gezeigt: fehlende Importe, dann die Messseite,
dann die Serverkonfiguration. **Ein Schnitt ist nicht fertig, wenn er
übersetzt — sondern wenn er läuft.**


## Die Veröffentlichung stand zweimal still – 4. September 2026

Seit dem Nachmittag ist nichts mehr live gegangen, und ich habe es erst
beim Nachsehen gemerkt: Zwei Bauläufe sind fehlgeschlagen, die Seite
zeigte noch den Stand von 17:44 Uhr.

**Der Grund:** Die neue Prüfung der Bogenfarben misst in einem echten
Browser. Auf meinem Rechner gibt es einen — auf dem Bauserver nicht.
Dort war sie deshalb dauerhaft rot und blockierte jede Veröffentlichung.

**Das ist heute schon zum zweiten Mal passiert**, mit einer anderen
Prüfung und derselben Ursache: Ein Wächter verhält sich je nach Umgebung
anders, und ich habe nur einen der beiden Wege ausprobiert.

Jetzt überspringt der Bauserver nur die **Messung**, nicht die Prüfung —
und sagt in der Ausgabe ausdrücklich, dass die Farben dort nicht gemessen
wurden. Auf meinem Rechner bleibt ein fehlender Browser weiterhin ein
Fehler, sonst wäre die Prüfung wertlos. Alle drei Fälle ausprobiert.


## Das bestehende Wiki ist eingetragen – 4. September 2026

**„Age of Beast" steht jetzt im Hauptmenü** und lässt sich anklicken —
auch ohne Anmeldung, weil es als öffentlich lesbar eingetragen ist. Du
bist als Besitzer hinterlegt; sobald du dich anmeldest, taucht es auch
unter „Meine Wikis" auf.

Die Weltdaten liegen zusätzlich im neuen Bereich, **ohne dass die alten
angerührt wurden**. Beide laufen jetzt parallel; umgeschaltet wird erst,
wenn nachweislich dasselbe drinsteht.

**Dabei ist mir ein Rückschritt aufgefallen, den ich selbst eingebaut
hatte:** Das Hauptmenü lud das komplette Firebase-Paket — drei fremde
Skripte — bei **jedem** Besuch, auch für jemanden, der sich nie anmeldet.
Genau das vermeidet das Wiki seit dem 2. September sorgfältig.

Jetzt merkt sich der Browser, ob hier schon einmal jemand angemeldet
war. Wenn nicht, wird gar nichts nachgeladen; der schlimmste Fall ist ein
zusätzlicher Klick beim allerersten Mal. Gemessen: **null fremde Skripte**
für einen neuen Besucher — und die Wikiliste ist trotzdem da.

Damit das nicht zurückfällt, prüft das jetzt ein Wächter mit 20
Prüfungen, zweimal absichtlich rot gemacht.


## Nachtrag zu den Bogenfarben – 4. September 2026

Die Farben der Charakterbögen kommen aus den zwei Domänen jeder Klasse.
Zwei Klassen teilen sich dabei eine Domäne — Waldläufer und Krieger haben
beide „Bone" — und liegen deshalb zwangsläufig nah beieinander.

Der Prüfwert dafür war stillschweigend niedriger angesetzt als der, den
das Wiki für die Kategoriefarben benutzt. Das steht jetzt begründet da,
statt unbemerkt zu bleiben: Man sieht immer nur einen Bogen, und die
Klasse ist auf jedem Bogen ausgeschrieben. Die Farbe ist Wiedererkennung,
nie die einzige Auskunft.


---

<<<<<<< HEAD
## Ein ehrlicher Hinweis statt einer falschen Anzeige – 4. September 2026

Das Hauptmenü verweist auf `wiki.html?w=<name>`. Die Wikiseite zeigt
aber bis auf Weiteres **immer dieselbe Welt** — der Umzug auf mehrere
Welten ist der nächste Schritt.

Wer mit einer fremden Kennung dort landet, bekäme sonst fremde Inhalte
unter dem richtigen Namen zu sehen. Das ist die schlimmste Art von
Fehler, weil ihn niemand bemerkt. Stattdessen steht jetzt ein Hinweis
da, dass diese Welt noch nicht angezeigt werden kann.

---

## Hauptmenü, Handy-Kopfzeile, Rechtsklickmenü – 4. September 2026

**Man landet jetzt zuerst im Hauptmenü.** Dort stehen die Wikis, die du
lesen darfst; angemeldet kommen deine eigenen dazu und der Knopf, um ein
neues anzulegen — mit Namen, Beschreibung, Regelwerken zum Ankreuzen und
der Wahl, ob es öffentlich lesbar ist. Das Wiki selbst liegt jetzt unter
`wiki.html` und hat einen Rückweg ins Menü.

**Ohne Anmeldung ist das Menü nicht leer.** Wer nur lesen will, sieht die
öffentlichen Wikis und kommt mit einem Klick hinein.

**Die Handy-Kopfzeile war unbenutzbar, und zwar messbar:** Bei 390 Pixeln
Fensterbreite war das Suchfeld **66 Pixel breit** — die fünf Knöpfe daneben
hatten es zusammengedrückt. Jetzt bekommt die Suche eine eigene Zeile über
die volle Breite: **366 Pixel, 44 hoch**, also ein Ziel, das ein Finger
trifft.

**Rechtsklick zeigt jetzt ein eigenes Menü** statt des Windows-Menüs: den
Eintrag öffnen, in neuem Tab öffnen, zu den Favoriten, Verweis kopieren —
und bei markiertem Text „im Wiki suchen". Mit gedrückter Umschalttaste
kommt das gewohnte Browsermenü, damit „Bild speichern" nicht verloren
geht. Auf dem Handy ändert sich nichts: Dort gibt es keinen Rechtsklick,
und langes Drücken abzufangen würde das Markieren kaputtmachen.
Die Taste `/` springt in die Suche.

---
## Neue Vorlagen für Wiki-Einträge – 4. September 2026

Du kannst jetzt einen **NPC**, einen **Ort**, einen **POI** oder einen
**Gegenstand** Schritt für Schritt vorbereiten. Die neue Seite fragt nur die
passenden Angaben ab, zeigt fehlende Pflichtfelder direkt am Feld und gibt am
Ende einen fertigen Entwurf zum Kopieren aus.

Der Gegenstand-Ersteller kennt die Werte, die schon bei euren Daggerheart-
Gegenständen vorkommen: Waffenart, Attribut, Reichweite, Schaden, Traglast,
Merkmal, Wirkung, Rüstungswert, Schwellen, Stufenwerte und Beutewurf. Eine
Seltenheit kannst du zusätzlich für euer Wiki eintragen; sie wird in den
vorhandenen Daggerheart-Daten nicht behauptet.

Wichtig: Die Seite schreibt **nichts** in die Welt und meldet niemanden an.
Sie erzeugt nur den Entwurf. Der spätere Weg vom kopierten Entwurf zu einem
gespeicherten Wiki-Eintrag ist bewusst noch offen.

Die Vorlagen lassen sich über den lokalen Vorschau-Server auch auf der neuen
Seite `vorlagen.html` ausprobieren.

## Vorlagen in der Leiste, Handy-Kopfzeile dreizeilig – 4. September 2026

Die Vorlagenseite ist jetzt über die Leiste oben erreichbar. Damit sind es
sechs Knöpfe, und das hat zwei Messungen ausgelöst.

**Am Rechner:** Sechs beschriftete Knöpfe brauchen **1409 Pixel**. Das ist
mehr, als die meisten Notebooks haben — die Beschriftungen erscheinen also
nur noch auf breiten Bildschirmen. **Hier endet dieser Weg:** Ein siebter
Knopf braucht keine neue Schwelle, sondern eine andere Bauart. Das steht so
im Code, damit es niemand übersieht.

**Auf dem Handy** scrollte mit sechs Knöpfen die ganze Kopfzeile — die Marke
wäre aus dem Bild gewandert. Jetzt hat die Leiste eine eigene Zeile: drei
Reihen, alle sechs Knöpfe sichtbar, Suchfeld 351 Pixel breit, und nichts
rutscht mehr.

---

## Stecknadeln auf der Weltkarte – 4. September 2026

Auf der Weltkarte können Orte jetzt mit einer roten Stecknadel auf ihren
Wiki-Eintrag zeigen. Den Namen sieht man beim Darüberfahren; auf dem Handy
öffnet Antippen den Eintrag direkt.

Die elf noch namenlosen Siedlungen bleiben sichtbar, sind aber klar anders
markiert: als helle Kreuze. Je größer die Siedlung, desto dicker ist ihr
Kreuz. Daneben steht jeweils die Koordinate zum Zuordnen.

Ein Klick auf eine freie Stelle der Karte zeigt den passenden Kartenpunkt zum
Abschreiben an. So kann später jeder neue Ort genau dort verknüpft werden.

Zur Veranschaulichung gibt es zwei vorhandene Welt-Einträge mit Stecknadeln:
den Kampagnen-Frame „Age of Beast“ und die Maschinisten. Die Daten enthalten
zurzeit noch keine eigenen Orts- oder Regionseinträge; diese zwei Nadeln sind
deshalb technische Beispiele und keine neu behaupteten Ortsfakten.
=======
## Farben für die Bögen und eine Favoritenliste – 4. September 2026

Jeder Charakterbogen trägt jetzt eine **eigene, zurückhaltende Farbe**,
die aus den beiden Domänen seiner Klasse kommt. Sie sitzt nur an der
Kopfleiste, der Stufe, starken Werten und Domänenmarken. Der Lesetext
bleibt auf seiner ruhigen Fläche. Abstammung und Gemeinschaft bekommen
als unabhängige Kennzeichnung einen kleinen türkisfarbenen Punkt statt
einer zweiten Farbleiste.

Neu gibt es **Meine Favoriten**: Ein Stern bei einem Eintrag, einer Karte
oder einem Bogen legt ihn dort ab. Die Liste trennt Einträge, Karten und
Bögen, führt zurück zur jeweiligen Ansicht und lässt Sterne direkt wieder
entfernen. Sie bleibt nur in deinem Browser und braucht keine Anmeldung.
>>>>>>> paket/bogenfarben

---

## Nachtrag: die Veröffentlichung stand still – 4. September 2026

Der Bau der Seite ist fehlgeschlagen — bei mir lief alles grün. Ursache
war eine Namenskonvention: Drei neue Sicherheitsfunktionen hießen
`darfWikiLesen` statt `wikiDarfLesen`. Der Wächter, der Wiki und
Scotophobia auseinanderhält, ordnet Funktionen nach ihrem Namen zu,
sobald er Scotophobias Datei nicht danebenliegen hat — und auf dem
Bauserver liegt sie nie daneben.

**Der Fehler war meiner, und er ist grundsätzlicher als der Name:** Der
Wächter hat zwei Wege, und ich habe nur einen geprüft. Am Arbeitsplatz
erkennt er Scotophobias Funktionen an ihrem Inhalt, auf dem Bauserver
nur am Namen. Er war also ausgerechnet dort schwächer, wo er mehr weiß.

Behoben und abgesichert: Jede Wiki-Funktion muss jetzt auch am
Arbeitsplatz ein `wiki` im Namen tragen. Damit sagen beide Wege
dasselbe. Der alte Name schlägt jetzt auch hier an — ausprobiert.

---

## Karten beim Überfahren, alle Gegenstände, Sterne – 4. September 2026

**Fahr auf dem Charakterbogen über „Ribbet", „Gambeson" oder „Pick and
Pull"** — die Karte erscheint daneben, mit allen Werten. Auf dem Handy
gibt es kein Überfahren, dort **tippst** du darauf, und die Karte legt
sich unten an den Rand statt unter deinen Finger.

**Alle Gegenstände aus den Regelwerken sind jetzt Karten.** 123 Stück:
67 Primärwaffen, 24 Sekundärwaffen, 27 Rüstungen und die Fundstücke —
je mit Attribut, Reichweite, Schaden, Traglast und Merkmal. Zusammen mit
den bisherigen sind es **393 Karten**.

Sie sind nicht abgetippt, sondern **aus der Regelrecherche ausgelesen**.
Wer einen Wert korrigieren will, ändert die Recherchedatei und lässt das
Werkzeug neu laufen. Nachgeprüft an Stichproben: Longsword d8+3 mit
„Reliable", Gambeson 5/11 und Rüstungswert 3 — genau die Zahlen, mit
denen Brix' Bogen rechnet.

**Zwei ehrliche Lücken:** „Machete" und „Shortsword" stehen auf euren
Bögen, gibt es in Daggerheart aber nicht — weder in den Grundregeln noch
in Hope & Fear. Die Karte sagt das jetzt, statt so zu tun, als wäre
nichts. Sechs Sekundärwaffen tragen einen Hinweis, weil die Recherche
ihren Schadenswürfel selbst als unsicher gekennzeichnet hat.

**Die Filter sind gruppiert:** Karten · Ausrüstung · Fundstücke ·
Domänen. Neun Arten und neun Domänen in einer Reihe wären auf dem Handy
eine endlose Rutschbahn gewesen.

**Ein Bogen je Seite**, mit einer Auswahl darüber. Zwei nebeneinander
sahen auf dem Rechner ordentlich aus — auf dem Handy scrollte man an
einem ganzen Bogen vorbei, um den zweiten zu sehen. Jeder Bogen hat
jetzt eine eigene Adresse und lässt sich verlinken.

**Sterne** an jeder Karte und jedem Bogen. Sie liegen im Browser, nicht
in der Datenbank: Favoriten sind persönlich, und niemand soll sehen
müssen, was der andere sich merkt. Der Preis ist ehrlich — wer an zwei
Geräten spielt, hat zwei Listen.

---

## Grundlage für mehrere Wikis – 4. September 2026

Der erste Schritt zur Plattform, die du beschrieben hast. Sichtbar
ändert sich noch nichts — was jetzt steht, ist das Fundament.

**Eine Vorgabe geht so nicht, und das solltest du wissen:** „ein neues
Wiki mit **eigener Datenbank**" ist auf dem kostenlosen Firebase-Tarif
nicht möglich. Ein Projekt hat dort genau eine Datenbank; eine zweite
kostet Geld. Stattdessen bekommt jedes Wiki einen eigenen abgeschlossenen
Bereich: eigene Inhalte, eigene Mitglieder, eigene Rechte. Für alles am
Spieltisch ist der Unterschied nicht spürbar — nur die Abrechnung läuft
gemeinsam.

**Die wichtigste Entwurfsentscheidung:** Ein neues Wiki anzulegen darf
keine Freischaltung brauchen. Die Sicherheitsregeln sprechen deshalb
allgemein über „ein Wiki" statt über einzelne Namen. Du legst eins an,
und es funktioniert — ohne dass jemand etwas veröffentlichen muss.

**Geprüft, bevor es live ging:** 25 von 25 Fällen im Firebase-Simulator,
darunter elf neue: Ein Fremder kommt nicht in ein privates Wiki. Ein
Leser darf lesen, aber nicht schreiben. Wer ein Wiki anlegt, kann dabei
nicht heimlich andere eintragen. Und Scotophobia, das sich dieselbe
Regeldatei teilt, bleibt unberührt — an der laufenden Seite nachgemessen.

**Der GitHub-Schlüssel ist raus.** Angemeldet wird mit Google, wie du es
gesagt hast. Der alte Weg lag seit dem 2. September ohnehin nur noch als
toter Rückweg herum — keine Seite hat ihn benutzt.

---

## Xenos Figur heißt Brix Borin – 4. September 2026

Der Name war der Schlüssel: **Die Werte lagen längst im Wiki**, als
Werkstattfigur `Brix Borin`, seit dem 1. September. Der Charakterbogen
war leer, weil niemand die beiden Einträge verbunden hatte.

**Brix Borin, Stufe 1:** ein diebischer Ribbet aus dem Underborne,
Schurke und Nachtwandler. Beweglichkeit +1, Stärke −1, Fingerfertigkeit
+2, Instinkt +1. Dolch und Kurzschwert, Gambeson, Fälscherwerkzeug.

**Zwei Zahlen bestätigen sich gegenseitig:** Sein Ausweichen 13 liegt
über der Schurken-Basis von 12 — genau um den einen Punkt, den das
Gambeson mit seinem Merkmal *„Flexible"* gibt. Und seine beiden Karten
*Pick and Pull* und *Deft Deceiver* sind je eine aus seinen zwei Domänen
Midnight und Grace, beide Stufe 1. Dasselbe stimmige Bild wie bei Lukas.

**Ein Fehler in den Daten behoben:** Auf Xenos Figur stand im Steckbrief
„Spieler: Lukas" — ein Rest aus der ursprünglichen Verwechslung. Ebenso
sprachen alle Abschnitte von „sie", obwohl auf seinem Bogen „Er" steht.

**Und ein Rechenfehler, der beide Figuren betraf:** Die Schadensschwellen
standen als 6 / 13 im Bogen. Das sind aber die *Grundwerte* der
Rüstungskarte — die Regel verlangt, die eigene Stufe dazuzuzählen. Der
Bogen rechnet das jetzt selbst und schreibt die Herkunft darunter:
„Lederrüstung 6/13 + Stufe 1". Lukas hat damit **7 / 14** statt 6 / 13,
Brix **6 / 12**.

Dazu aus seinem Baubogen übernommen: Erscheinung (der Piratenhut),
Hintergrund (er hat sein eigenes Dorf bestohlen) — und die zweite Wette
mit Lukas, von der bisher nur eine Hälfte im Wiki stand.

---

## Karten auf schmalen Bildschirmen – 4. September 2026

Nachtrag zum Rollbalken. Auf der veröffentlichten Seite bei 470 Pixeln
Fensterbreite gemessen: Das Raster machte dort **zwei Spalten von
228 Pixeln**, und 25 Karten passten selbst dann nicht, als die Schrift
schon auf 9,3 Pixel geschrumpft war.

**Mein Fehler beim ersten Prüfen:** Ich hatte die Breite am Seiteninhalt
gesetzt statt am Fenster. Die Regel, die das Raster umstellt, folgt aber
dem *Fenster* — sie hat bei meiner Messung nie ausgelöst, und ich habe
den Fall dadurch gar nicht gesehen.

Jetzt bekommt ein schmales Fenster **eine** Spalte. Eine breite Karte
liest sich auf dem Handy ohnehin besser als zwei schmale. Bei zehn
geprüften Fensterbreiten von 375 bis 1920 Pixeln: keine einzige Karte
mit Rollbalken, und die Schrift muss nirgends mehr verkleinert werden.

---

## Echte Charakterbögen für die Spielfiguren – 4. September 2026

Neuer Bereich **Bögen** in der Kopfleiste. Die Spielfiguren stehen dort
als vollständige Daggerheart-Bögen: die sechs Attribute, Ausweichen und
Rüstung, die Schadensschwellen als Balken, Lebenspunkte, Stress und
Hoffnung als Kästchen zum Abhaken, Erfahrungen, Ausrüstung, Domänen und
die Fähigkeitskarten — letztere verlinkt auf die passende Karte.

**Lukas' Figur ist vollständig**, Stufe 1, Faun aus der Seeborne-Gemeinschaft,
Ranger/Wayfinder. Zwei Zahlen dazu haben sich beim Eintragen bestätigt:
Ausweichen 12 ist genau der Startwert eines Rangers, und seine beiden
Karten — *Deft Maneuvers* und *Gifted Tracker* — sind je eine aus seinen
zwei Domänen Bone und Sage, beide Stufe 1. Das ist eine stimmige
Ausrüstung für Stufe 1.

**Xenos Bogen ist fast leer, und das steht auch so da.** Statt Felder
wegzulassen zeigt er überall „noch offen" und listet unten auf, was
fehlt. Am Spieltisch ist eine Lücke, die man sieht, harmlos — eine, die
man für vollständig hält, nicht.

**Die Werte liegen als Daten, nicht als Text.** Sie stehen in der
Weltquelle unter `spielwerte` und werden von dort gezeichnet. Hätte der
Bogen sie aus Absätzen herauslesen müssen, wäre er beim ersten anders
formulierten Satz zerbrochen.

**Nebenbei die Kopfleiste geradegerückt.** Mit dem vierten Knopf brauchte
sie 1221 Pixel, die Regel zum Verkürzen griff aber erst bei 1088 —
dazwischen drängelten sich die Beschriftungen. Gemessen und die Schwelle
nachgezogen; bei sechs geprüften Fensterbreiten von 375 bis 1400 Pixeln
schiebt sich jetzt nichts mehr ineinander.

**Lesbarkeit geprüft, nicht behauptet:** Alle 23 Textstellen der Bögen
liegen in beiden Farbschemata über dem Kontrastwert 4,5 (schwächste 6,07).
Sieben Beschriftungen mussten dafür einen kräftigeren Grauton bekommen.

---

## Keine Karte wird mehr gescrollt – 4. September 2026

**Was war:** Auf einer Karte („Warden of the Elements", Druide, Mastery)
tauchte ein Rollbalken auf. Man musste in der Karte scrollen, um die
Regel zu Ende zu lesen.

**Woran es lag:** Die Schrift auf den Karten richtet sich nach der
Textmenge, damit alle Karten gleich groß bleiben. Diese Abstufung war
aber an Karten von 306 Pixeln Breite eingestellt. Je nach Fensterbreite
werden die Karten schmaler — bei 265 Pixeln, der schmalsten Breite, die
das Raster überhaupt erzeugt, brauchte der Text plötzlich mehr Zeilen.
Genau dort liefen **sechs** Karten über.

**Warum eine feinere Abstufung nicht gereicht hätte:** Die Zeichenzahl
sagt nicht genau genug voraus, wie viel Platz ein Text braucht. Gemessen:
Eine Karte mit 601 Zeichen brauchte eine kleinere Schrift als eine mit
627 Zeichen — Überschriften, Absätze und lange Wörter wiegen schwerer als
die bloße Menge.

**Was jetzt passiert:** Jede Karte sieht selbst nach, ob ihr Text
hineinpasst, und verkleinert die Schrift nur dann, und nur so weit wie
nötig. Von 270 Karten müssen **12** überhaupt etwas tun; das Ganze dauert
**29 Tausendstelsekunden**. Bei allen zehn geprüften Fensterbreiten:
**keine einzige Karte** mit Rollbalken. Wird das Fenster wieder breiter,
wird die Schrift auch wieder größer.

Der Rollbalken bleibt als allerletzter Ausweg bestehen. Text einfach
abzuschneiden wäre schlimmer: Am Spieltisch ist eine Regel, die man nicht
sieht, gefährlicher als eine, die man wegscrollen muss.

---

## Die Spielregeln des Wikis und von Scotophobia beißen sich nicht mehr – 4. September 2026

Das Wiki ist an diesem Tag **viermal** ausgefallen, einmal nur gut eine
Minute nach einer Reparatur. Der Grund war keine davon: Wiki und
Scotophobia liegen in derselben Datenbank, und die hat nur **ein**
Regelblatt. Bei Scotophobia lag eine unvollständige Fassung; jedes Mal,
wenn dort veröffentlicht wurde, verschwanden die Regeln des Wikis. Beim
Veröffentlichen sah alles gut aus — kaputt war es erst beim nächsten
Aufruf der Seite.

**Jetzt haben beide Projekte dasselbe vollständige Regelblatt.** Es ist
egal geworden, wer zuletzt veröffentlicht. Beide Seiten prüfen das
außerdem gegenseitig nach, damit es nicht wieder auseinanderläuft.

---

## Ordnung im Projekt – 4. September 2026

**Am Wiki selbst ändert sich nichts.** Keine Seite sieht anders aus, kein
Knopf tut etwas anderes, kein einziger Text in der Welt ist angefasst
worden. Diese Änderung betrifft nur, wie am Projekt gearbeitet wird.

### Worum es geht

Das Wiki ist in wenigen Wochen von einer Leseseite zu einer Anwendung mit
Anmeldung, Bearbeitung, Assistent und eigenen Bildern gewachsen. Wer neu
dazukommt — Mensch oder Agent — musste sich das bisher zusammensuchen.
Jetzt gibt es einen festen Einstieg: eine Datei, die sagt, was das Projekt
ist und welche Regeln gelten, eine Karte, die zeigt, was mit was
zusammenhängt, und eine Liste, wo man für einen bestimmten Wunsch anfasst.

### Was dabei aufgefallen ist

Beim Nachprüfen der älteren Unterlagen stellte sich heraus, dass **acht
Dokumente veraltet waren**. Sie stammen vom 1. September, also von *vor*
dem Umzug zu Google und Firebase, und behaupteten noch, gespeichert werde
über GitHub und es brauche dafür einen selbst erzeugten Schlüssel. Auch
„noch nicht veröffentlicht" stand darin, obwohl längst alles online ist.
Jedes dieser Dokumente hat jetzt oben einen Kasten, der sagt, was daran
überholt ist — mit dem Befehl zum Nachrechnen daneben.

Das ist die wertvollste Sorte Fund: Eine Anleitung, die etwas anderes
behauptet als das Programm tut, wird geglaubt.

### Die wichtigste Sicherung

Das Wiki teilt sich seine Zugriffsregeln mit dem Spiel *Scotophobia* —
zwangsläufig, denn eine Datenbank hat bei Google genau eine Regeldatei.
**Am 4. September ist genau das schiefgegangen, in beide Richtungen:**
Erst wurden die Wiki-Regeln überschrieben, danach hätte umgekehrt das
Spiel Schaden genommen. Der zweite Fall wurde von einer Prüfung
abgefangen. Beides steht jetzt ausführlich in einem eigenen Dokument, das
man liest, **bevor** man an dieser Datei etwas ändert.

### Neue Prüfungen

Acht Stück, die auf die Arbeitsweise achten statt auf das Wiki: dass keine
Änderung ohne Eintrag hier bleibt, dass niemand versehentlich direkt auf
dem Hauptzweig arbeitet, dass keine Zugangsdaten im Projekt landen — auch
nicht in der Versionsgeschichte, die man später nicht mehr säubern kann.
Jede einzelne wurde vorher absichtlich zum Anschlagen gebracht, damit
sicher ist, dass sie überhaupt etwas prüft.

Dabei kam heraus, dass die Suche nach Zugangsdaten **den halben Bestand
nie angesehen hatte** — 251 Dateien. Behoben; sie sagt jetzt bei jedem
Lauf, wie viele Dateien sie tatsächlich durchsucht hat.

---

## Fassung 3.1.2 – 4. September 2026

**Die Kopfzeile war kaputt, und die Spielfiguren hatten keine Namen.**

### Die Kopfzeile

Mit dem dritten Knopf (Werkstatt, Karten, Karte) passte die Zeile nicht
mehr: gemessen 1736 Bildpunkte Inhalt bei 1265 verfügbaren. Der Rest
rutschte in eine zweite Zeile, die aus dem Kopf herauslief und **die
Navigation überdeckte**.

Die drei Knöpfe sind jetzt eine Leiste — ein Element statt drei. Wird
der Platz knapp, verlieren sie zuerst ihre Beschriftung und stehen als
Zeichen da. Das ist der Unterschied zwischen eng und kaputt.

### Die Figuren heißen jetzt Lukas und Xeno

Als Platzhalter, bis die Figuren eigene Namen bekommen. Vorher standen
sie als „Unbenannter Faun" und „Unbenannte Spielfigur" da und waren
kaum zu finden.

**Warum sie ganz fehlten:** Die Daten lagen zwar in der Datei, aber
nicht in Firebase — und von dort liest die Seite. Nachgetragen.

### Zum dritten Mal: die Firestore-Regeln

Die Wiki-Regeln waren erneut überschrieben, dadurch war die ganze Welt
nicht mehr lesbar. Wiederhergestellt. Die Ursache ist bekannt und
gehört behoben, nicht jedes Mal repariert — siehe die technische
Fassung.

---

## Fassung 3.1.1 – 4. September 2026

**Die Karten waren zu lang gezogen.** Behoben.

### Was los war

Eine Kachel wuchs mit ihrem Text in die Länge. Bei den Unterklassen
wurden daraus Streifen: im Median 868 Zeichen, die längste mit 1785.

### Der eigentliche Fehler

Eine Unterklasse ist im Spiel **nicht eine Karte, sondern drei** —
Foundation, Specialization und Mastery liegen einzeln auf dem Tisch und
werden nacheinander freigeschaltet. Ich hatte alle drei in eine gepackt.

Aufgeteilt sind es aus 18 Karten **54**, und die längste misst statt
1785 nur noch 636 Zeichen — so viel wie eine gewöhnliche Domänenkarte.

### Jetzt haben alle Karten dasselbe Format

Was sich anpasst, ist nicht mehr die Höhe, sondern die Schrift: vier
Stufen, gewählt nach der Textmenge.

| | vorher | jetzt |
| --- | --- | --- |
| Karten | 234 | **270** |
| Höhe | 356 px bis über 700 | **569 px, bei allen gleich** |
| Platz für den Regeltext | 43 % der Karte | **74 %** |
| Karten mit abgeschnittenem Text | 218 von 270 | **0** |

Der Fuß ist weggefallen: Die Quelle stand auf allen 270 Karten
gleich, und die Kartenart nennt schon die Unterzeile. Das waren 32
Bildpunkte, die dem Regeltext fehlten.

---

## Fassung 3.1.0 – 4. September 2026

**Die Welt hat jetzt eine Karte, und die Regeln stehen im Wiki.**

### Die Weltkarte

Deine gezeichnete Karte ist der sichtbare Teil der Spielwelt geworden.
Sie hat eine eigene Seite und wird bei jedem Aufruf neu gerechnet — in
etwa einer Fünftelsekunde.

Deine Umrisse geben die Form vor. Strände, Wiesen, Wälder, Hügel und
Bergketten entstehen daraus: aus dem Abstand zur Küste, einer daraus
abgeleiteten Höhe und der Feuchtigkeit. Die elf Kreuze sind Siedlungen,
ihre Strichstärke bestimmt die Größe — von einem Dorf bis zur Metropole
am Wüstenrand. Ein Knopf würfelt Wälder und Gebirge neu; deine Umrisse
und die Städte bleiben, wo sie sind.

Der Sumpf trägt deine Warnung: **gefährlich**.

### Die Spielkarten

Alle Karten als Kacheln — ohne die offiziellen Illustrationen, dafür
mit Zierrahmen, Eckmarken und dem Wappen dort, wo sonst das Bild wäre.
Stufe und Rückholkosten sitzen als Medaillons in den Ecken, Domäne und
Kartentyp im Titelband.

Was noch fehlt, sind die Regeltexte. Sie liegen **nicht** in der
Daggerheart-Werkstatt: Dort steht genau eine Karte, und die besteht
fast vollständig aus einem eingebetteten Bild.

### Die Regeln

Zwei Nachschlagewerke auf Deutsch: die Grundregeln aus dem offiziellen
Regelwerk und die Erweiterung *Hope & Fear*, für die alle 204 Seiten
gelesen wurden. Jede Angabe dort trägt ihre Seitenzahl.

**Ein Befund, der Arbeit spart:** *Hope & Fear* ändert keine einzige
Grundregel. Es kommt nur etwas dazu.

### Die Spielfiguren

Lukas' Figur ist eingetragen — Faun, Seeborne, Waldläufer und Wegfinder,
mit allen Werten, Erfahrungen und Fähigkeitskarten. Dazu, was am Tisch
gilt: der Wettstreit um die schrecklichste Spezialität, die Frage nach
dem Beutel, die Warnung vor der Goldenen Garde, und dass er nicht in
die Berge geht.

**Richtiggestellt:** Die bereits vorhandene Figur war als Lukas'
angelegt. Sie gehört Xeno.

---

## Fassung 3.0.0 – 2. September 2026

**Anmelden geht jetzt mit dem Google-Konto.** Ein Klick, das gewohnte
Google-Fenster, fertig.

### Warum das nötig war

Bis jetzt brauchte das Bearbeiten einen selbst erzeugten GitHub-Schlüssel:
anlegen, richtig zuschneiden, kopieren, in den Browser einfügen. Der Weg
funktionierte — am 1. September ist darüber gespeichert worden —, aber der
Schlüssel bleibt die Hürde: **Jeder, der je mitschreiben soll, müsste sich
einen eigenen anlegen.**

Ein Google-Knopf ging vorher technisch nicht. GitHub Pages liefert nur Dateien
aus; dort läuft kein Programm, das eine Anmeldung nachprüfen könnte. Ein Knopf
wäre reine Verzierung gewesen.

### Was sich geändert hat

Die Welt liegt jetzt in Firebase — in demselben Projekt, in dem auch das Spiel
*Scotophobia* läuft, aber **vollständig getrennt davon**.

| | vorher | jetzt |
| --- | --- | --- |
| Anmelden | GitHub-Schlüssel selbst anlegen | Klick auf Google |
| Wo die Welt liegt | Datei im Repository | Firebase |
| Nach dem Speichern | etwa eine Minute warten | sofort sichtbar |

### Speichern ist jetzt Veröffentlichen

Das Warten entfällt. Vorher musste GitHub die Seite neu bauen, das dauerte
rund eine Minute. Jetzt liest die Seite die Welt direkt — es gibt nichts mehr
zu bauen.

### Getrennt von Scotophobia

Beide Anwendungen teilen sich ein Firebase-Projekt, berühren sich aber nicht:

- Eigene Ablagen: Das Wiki benutzt `wiki_welt` und `wiki_zugang`, Scotophobia
  seine drei eigenen.
- Eigene Freigaben: Wer bei Scotophobia freigeschaltet ist, darf dadurch
  **nicht** das Wiki bearbeiten. Und umgekehrt.
- **Eine Prüfung wacht darüber.** Firebase erlaubt nur eine einzige
  Regeldatei. Würde jemand die Wiki-Regeln allein veröffentlichen, wäre
  Scotophobia sofort tot — Spielstände und Freigaben unlesbar. Ein Wächter
  verhindert das: Er lässt eine Veröffentlichung nur zu, wenn Scotophobias
  Regeln Wort für Wort enthalten sind.

### Die Seite bleibt sauber

Wer das Wiki nur liest, lädt weiterhin **kein einziges fremdes Skript**. Die
Weltdaten kommen über eine schlichte Abfrage, nicht über Googles
Programmbibliothek. Die wird erst geholt, wenn sich jemand anmeldet.

### Schneller beim zweiten Besuch

Jeder Browser merkt sich die zuletzt geholte Welt. Beim nächsten Aufruf fragt
er zuerst nur nach, ob sich etwas geändert hat — ein Abruf statt zehn.

### Was dabei schiefging — und warum es aufgefallen ist

Zwischen dem Einrichten und dem Veröffentlichen hat jemand Scotophobias
Regeln allein veröffentlicht. **Genau der Fall, vor dem die Prüfung warnt:**
Das Wiki konnte seine Daten nicht mehr lesen.

Umgekehrt wäre es genauso passiert — Scotophobia hatte inzwischen neue Regeln
bekommen, die in meiner Datei fehlten. Die Prüfung hat das abgefangen und den
Deploy verweigert, bis beide Teile aktuell waren.

Beim Zusammenbauen ist mir dann noch ein Fehler unterlaufen: Ich habe mitten
aus einem Kommentar heraus geschnitten. Firebase lehnte die Datei ab, ohne zu
sagen, wo. Die Prüfung merkt jetzt auch das.

### Wer bearbeiten darf

Jannik ist als Verwalter eingetragen und kann sofort loslegen. Jedes andere
Google-Konto kann sich anmelden, legt damit eine Anfrage an und wartet auf
seine Bestätigung.

Entschieden wird das bei Firebase, nicht im Browser. Wer die Seite in seinem
Browser verändert, kann sich den Stift zwar anzeigen lassen — gespeichert
wird trotzdem nichts.

---

## Fassung 2.8.0 – 2. September 2026

**Jede Kachel hat jetzt ein Bildzeichen.** Man sieht auf einen Blick, ob vor
einem eine Fraktion, ein Ort oder ein Gegenstand liegt — ohne den Text lesen
zu müssen.

### Wie es vorher war

Von zehn Kategorien hatten genau zwei eine eigene Farbe: Werkstatt und
Regeln. Die acht Weltkategorien sahen **alle gleich aus**. Der einzige
Unterschied war ein kleines Wort über der Überschrift.

### Die zehn Zeichen

| | | | |
| --- | --- | --- | --- |
| Kampagne | aufgeschlagenes Buch | Orte | Turm mit Zinnen |
| Fraktionen | Standarte | Ereignisse | Sanduhr |
| Spezies | Pfotenabdruck | Wissen | Federkiel |
| Figuren | Kopf und Schultern | Werkstatt | Schmiedehammer |
| Gegenstände | Schwert | Regeln | Waage |

Sie stehen auf den Kacheln, in der Kategorienliste links, auf den
Filterknöpfen, über einer Kategorieseite und über jedem Eintrag.

### Warum gezeichnet und nicht getippt

In den Daten standen schon Schriftzeichen wie ☗ und ⌂. Die waren unbrauchbar:
Keine der verwendeten Schriften enthält sie vollständig. Auf manchen Geräten
erscheint dort ein leeres Kästchen. Ein gezeichnetes Zeichen sieht überall
gleich aus.

### Farben gibt es zusätzlich

Jede Kategorie hat jetzt auch einen eigenen Farbton. Das Zeichen bleibt aber
das Wichtigere — es ist auch dann eindeutig, wenn jemand Farben schlecht
unterscheiden kann.

### Zwei Farben mussten weichen

Beim Nachmessen kamen sich zwei Paare zu nahe: Gegenstände lag zu dicht am
Blau der Regeln, Ereignisse zu dicht am Gold der Werkstatt. Beide wurden
ausgetauscht — nicht nach Gefühl, sondern durch eine Suche über tausende
Kandidaten.

Für die helle Ansicht mussten sogar **sieben von zehn** Tönen neu berechnet
werden. Der Grund: Auf hellem Grund müssen alle Farben dunkel sein, damit man
sie lesen kann — dadurch rücken sie zwangsläufig zusammen. Elf Paare lagen zu
eng beieinander.

### Nachgeprüft

- Alle zehn Zeichen liegen sauber im Feld, keins ist doppelt vergeben.
- Der schwächste Kontrast beträgt 5,4 : 1 — deutlich über der üblichen
  Lesbarkeitsgrenze von 4,5 : 1.
- Kommt später eine elfte Kategorie dazu **ohne** eigenes Zeichen, schlägt
  eine Prüfung an. Vorher wäre das niemandem aufgefallen.

---

## Fassung 2.7.0 – 26. August 2026

**Das Wiki hat jetzt Bilder** — 234 eigene Kartenwappen, erzeugt statt
übernommen.

### Warum eigene statt der Originale

Die Bilder der Werkstatt sind offizielle Illustrationen von Darrington
Press. Sie privat zu nutzen ist eine Sache — sie in einem öffentlichen
Repository zu verbreiten eine andere.

Statt sie einfach wegzulassen, gibt es jetzt Ersatz: **Wappen**. Jede Karte
bekommt eines, aus ihren eigenen Angaben berechnet.

### Was ein Wappen ist

Keine gemalte Illustration — das kann ich nicht. Sondern Farbe, Form und
Muster:

- Die **Farbe** kommt von der Domäne. Arcana bleibt violett, Blade rot.
- Das **Motiv** gehört zur Domäne: Rune, Klinge, Mond, Blatt, Sonne, Schild.
- Das **Sternmuster** wird aus dem Kartennamen berechnet. Keine zwei Karten
  sehen gleich aus, aber alle einer Domäne sehen verwandt aus.
- Der **Domänenname** steht englisch im Bild, so wie im Regelwerk.

### Nebenbei sind sie besser als die Originale

| | Original | Wappen |
| --- | --- | --- |
| je Bild | 28,7 KB | **2,65 KB** |
| alle 234 | 8,4 MB | **621 KB** |
| Schärfe | fest | auf jedem Bildschirm scharf |
| Rechte | Darrington Press | dieses Projekt |

Das ganze Wiki wiegt jetzt 2,6 MB. Die Grenze bei GitHub liegt bei 1 GB.

### Verlässlich

Derselbe Kartenname ergibt **immer** dasselbe Bild. Nachgeprüft: Ein
zweiter Lauf erzeugte 234 bytegleiche Dateien. Es entsteht also kein
Durcheinander, wenn die Bilder neu gebaut werden.

### Zwei Kleinigkeiten dabei

Die Steckbriefzeile **Illustration: Mat Wilma** ist verschwunden. Sie nannte
den Künstler der offiziellen Karte — bei unserem eigenen Wappen wäre das
schlicht falsch.

Und das Bild lädt jetzt sofort statt verzögert. Es steht direkt unter der
Überschrift; verzögertes Laden hätte dort nichts gebracht und die Seite nur
springen lassen.

---

## Fassung 2.6.0 – 26. August 2026

**Die Werkstatt hat jetzt einen eigenen Knopf und eine eigene Seite** — und
die Google-Anmeldung ist daraus verschwunden.

### Der Knopf oben

In der Kopfzeile, rechts neben der Suche, steht jetzt **⚒ Werkstatt**. Ein
Klick führt auf eine Seite, auf der es ausschließlich um die Werkstatt geht —
nicht mehr in der Seitenleiste zwischen den Weltinhalten versteckt.

Auf schmalen Fenstern bleibt nur das Zeichen ⚒ stehen, damit oben nichts
überläuft.

### Die Seite

Vier Felder, jedes zeigt, wie weit die Übernahme ist:

| Bereich | Stand |
| --- | --- |
| **Kampagnenrahmen** | fertig — Assistent öffnen |
| **Regelwiki** | fertig — 26 Einträge |
| **Spielfiguren** | teilweise — Bögen da, Assistent fehlt |
| **Karten** | teilweise — Karten da, Baukasten fehlt |

Die noch nicht fertigen Felder sind gestrichelt umrandet und tragen den
Vermerk **wird noch übernommen**. So siehst du auf einen Blick, was schon
geht und was noch kommt — statt dass es einfach fehlt.

Darunter stehen die Werkstatt-Einträge als Kacheln.

### Google ist raus

Bis eben war auf dieser Seite die alte Werkstatt in einem Rahmen
eingebettet. Die verlangt eine Google-Anmeldung — genau das, wovon sie
gelöst werden soll. Der Rahmen ist entfernt.

**Was das heißt:** Alles, was du auf der Werkstatt-Seite siehst, läuft
vollständig über GitHub. Kein Google, kein Datenbankanbieter.

**Und was noch nicht:** Der Figurenassistent und der Kartenbaukasten sind
noch nicht übernommen. Die alte Werkstatt gibt es weiterhin unter ihrer
eigenen Adresse, solange du sie brauchst — sie ist nur nicht mehr Teil des
Wikis.

### Nebenbei aufgeräumt

Die Zeile **Werkzeuge** unten in der Seitenleiste ist entfallen. Mit dem
Knopf oben gäbe es sonst zwei Wege zum selben Ziel, und das verwirrt mehr,
als es hilft.

Außerdem hieß es vorher „1 Figuren" und „1 Karten". Jetzt heißt es
„1 Figur" und „1 Karte".

---

## Fassung 2.5.0 – 26. August 2026

**Der Kampagnenrahmen-Assistent ist im Wiki** — mit allen neun Schritten und
denselben Fragen wie in der Werkstatt.

Zweiter Schritt der Übernahme. Nach dem Regelwiki kommt damit das erste
richtige *Werkzeug* ins Wiki, nicht nur Text zum Lesen.

### Was du jetzt tun kannst

Öffne den Eintrag **Prototyp**. Oben steht ein neuer Knopf
**Im Assistenten bearbeiten**. Ein Klick, und du bist im Assistenten:

| Schritt | Inhalt |
| --- | --- |
| 1 Grundidee | Name, Unterzeile, Grundidee, was die Gruppe tut |
| 2 Stimmung | Ton, Themen, Vorbilder |
| 3 Überblick | Vorher, Wandel, Heute, Kräfte |
| 4 Motor | Was treibt die Geschichten an |
| 5 Besonderheiten | drei Dinge, die diese Welt ausmachen |
| 6 Fraktionen | wer will was und kann was |
| 7 Anknüpfung | warum die Figuren dabei sind |
| 8 Start | die erste Szene |
| 9 Abschluss | Notizen |

**33 Felder und zwei Listen** — mit den Fragen aus der Werkstatt, nicht mit
dürren Beschriftungen. Statt „Aktivität" steht dort „Was tut die Gruppe
regelmäßig?", darunter der Hilfetext und ein Beispiel.

### Gespeichert wird schrittweise

Unten steht **Diesen Schritt speichern**. Ein Klick schreibt alle geänderten
Felder dieses Schritts auf einmal. So entsteht pro Arbeitsschritt eine
nachvollziehbare Änderung — nicht eine pro Tastendruck.

Danach siehst du **Gespeichert — 2 Felder geändert**, und du bleibst in dem
Schritt, in dem du warst.

### Das Wichtigste unter der Haube

Der Rahmen liegt jetzt **als richtige Struktur** im Repository, nicht mehr
als fertiger Text. Der Wiki-Eintrag wird daraus bei jedem Mal neu erzeugt.

Der Unterschied ist groß: Änderst du im Assistenten den Ton der Kampagne,
steht er **sofort auch im Eintrag**. Es gibt eine Wahrheit, nicht zwei, die
auseinanderlaufen können.

### Ein Fehler, der beim Testen auffiel

Nach dem Speichern zeichnet das Wiki die Seite neu — und die Bestätigung
verschwand dabei sofort wieder. Man klickte und sah nichts. Behoben: Die
Meldung überlebt jetzt den Neuaufbau.

### Wie es weitergeht

Als Nächstes der **Figurenassistent** — der größte Einzelbrocken. Danach die
**Kartenwerkstatt**.

---

## Fassung 2.4.0 – 26. August 2026

**Das Regelwiki der Werkstatt ist jetzt im Wiki** — als eigenes Modul, ohne
Google-Anmeldung, komplett über GitHub.

Das ist der erste Schritt der vollständigen Übernahme. Die Werkstatt wird
Stück für Stück ins Wiki geholt; hier ist der Anfang.

### Was dazugekommen ist

| | |
| --- | --- |
| **25 Regelartikel** | Würfe, Hoffnung und Furcht, Kampf, Schaden, Rast, Spielleitung |
| **43 Glossarbegriffe** | die festen deutschen Begriffe, alphabetisch |
| **254 Abschnitte** | jeder Regelpunkt einzeln |

Sie stehen in der Seitenleiste unter **Regeln**, in ruhigem Blau — damit man
auf einen Blick sieht: das ist Nachschlagewerk, nicht Weltwissen.

### Das Beste daran: Welt und Regeln hängen zusammen

Steht in einer Spezies-Beschreibung das Wort **Stress**, ist es jetzt ein
Verweis auf den Regelartikel dazu. Beim Überfahren siehst du die Kurzfassung,
ein Klick bringt dich hin.

Das passiert bei 15 Spezies automatisch. Du liest über Firbolg, stolperst über
eine Regel — und bist zwei Sekunden später beim Nachschlagen.

### Warum das ohne Firebase geht

Die Regeln sind reiner Text. Sie brauchen keine Datenbank und keine
Anmeldung — sie liegen jetzt einfach im Repository wie alles andere.

### Wie es weitergeht

Die Werkstatt hat noch mehr: den Kartenbaukasten, den Figurenassistenten und
den Kampagnenrahmen. Die sind aufwendiger, weil sie nicht nur Text sind,
sondern Bedienung. Sie kommen als Nächstes — einer nach dem anderen, jeder
einzeln geprüft.

**Live-Sitzungen bleiben draußen.** Gleichzeitiges Bearbeiten zu zweit in
Echtzeit braucht einen Server, der ständig mithört. GitHub kann das nicht.
Das ist keine Frage des Aufwands, sondern eine technische Grenze.

---

## Fassung 2.3.0 – 26. August 2026

**Die Daggerheart-Werkstatt ist jetzt ein Modul des Wikis** — und die
Oberfläche folgt deinem Entwurf genauer.

### Die Werkstatt im Wiki

In der Seitenleiste steht unten ein neuer Bereich **Werkzeuge** mit dem
Eintrag **Daggerheart-Werkstatt**. Ein Klick öffnet sie direkt im Wiki.

Sie ist dabei **nicht nachgebaut, sondern eingebettet**. Das ist Absicht:
Die Werkstatt sind rund 19.000 Zeilen Programm — Kartenbaukasten mit
PDF-Ausgabe, Figurenassistent, Regelwiki, Live-Sitzungen. Sie nachzubauen
wäre ein eigenes Vorhaben von Wochen, und dabei ginge einiges verloren.
Eingebettet behält sie alles, was sie kann, und ist trotzdem aus derselben
Navigation erreichbar.

Daneben steht **In eigenem Tab öffnen**. Das ist kein Beiwerk: Die
Google-Anmeldung öffnet ein eigenes Fenster, und manche Browser sperren
so etwas aus eingebetteten Seiten. Klappt die Anmeldung im Rahmen nicht,
geht sie dort.

### Näher am Entwurf

Der auffälligste Unterschied war: Dein Entwurf kommt **ohne Trennlinien
und ohne eigene Flächen** aus. Kopfzeile und Seitenleiste schwebten dort
über einem durchgehenden Grund, im Wiki waren sie mit Linien abgeteilt.
Das ist jetzt angeglichen — samt der genauen Abstände aus dem Entwurf.

### Warum du die Werkstatt-Einträge nicht gesehen hast

Dein Browser hatte die alte Fassung gespeichert. GitHub erlaubt das für
zehn Minuten. Ab sofort bekommt jede Veröffentlichung ein Kennzeichen an
die Dateinamen — damit kann der Browser gar nicht mehr die alte Fassung
nehmen. Das Problem tritt also nicht wieder auf.

---
## Fassung 2.2.0 – 26. August 2026

**Die Daggerheart-Werkstatt ist als eigenes Modul ins Wiki eingezogen.**

Ihre Inhalte lagen bisher in der Firebase-Datenbank. Jetzt liegen sie im
Repository — genau wie alles andere im Wiki, ohne Datenbankanbieter.

### Was übernommen wurde

| Eintrag | Art |
| --- | --- |
| **Prototyp** | Kampagnenrahmen, 8 Abschnitte |
| **Brix Borin** | Spielfigur mit Werten, Ausrüstung und Hintergrund |
| **Clank** | Karte mit Regeltext und Angaben |

Sie stehen in der Seitenleiste unter **Werkstatt** und haben einen eigenen
Farbton: warmes Gold statt Violett. Der Ton stammt aus deinem eigenen
Design-Entwurf — dort war er angelegt, wurde aber nie benutzt.

Ansonsten verhalten sie sich wie jeder andere Eintrag: Suche, Verweise,
Vorschaufenster und das Bearbeiten funktionieren genauso.

### Drei Dinge sind bewusst **nicht** mitgekommen

**1. Die E-Mail-Adressen deiner Mitspieler.** In den Werkstatt-Daten standen
drei Adressen, zwei davon von anderen Personen, dazu ein echter Name. Das
Repository ist öffentlich — dort stünden sie dauerhaft im Netz, auch in der
Versionsgeschichte, auch nach dem Löschen. Sie wurden entfernt. Ein
eingebauter Prüfschritt bricht ab, falls je wieder eine durchrutscht.

**2. Die Kartengrafik.** Das Bild der Clank-Karte ist offizielle Illustration
von Darrington Press (Mat Wilma). Sie privat zu nutzen ist eine Sache, sie in
einem öffentlichen Repository zu verbreiten eine andere. Text und Angaben der
Karte sind da, das Bild nicht — es liegt unverändert in der Werkstatt.

**3. Live-Sitzungen und Einladungslinks.** Die hängen an der
Firebase-Anmeldung und funktionieren ohne sie nicht. GitHub kann kein
gleichzeitiges Bearbeiten zu zweit.

### Wichtig: Die Werkstatt selbst läuft weiter

Übernommen wurden die **Inhalte**, nicht das Programm. Der Kartenbaukasten mit
seinen 234 Vorlagen, dem Bildzuschnitt und dem PDF-Export ist eine eigene
Anwendung und bleibt, wo er ist. Das Wiki zeigt jetzt, was drinsteht — es
ersetzt das Werkzeug nicht.

Und: **Das Firebase-Projekt darf weiterhin nicht abgeschaltet werden.** Die
Werkstatt hängt daran.

---

## Fassung 2.1.0 – 25. August 2026

**Jetzt lässt sich auch der Aufbau eines Eintrags ändern, nicht nur der Text.**

Bisher konntest du vorhandene Texte überschreiben. Was fehlte: neue Abschnitte
anlegen, überflüssige loswerden, die Reihenfolge ändern und den Steckbrief
rechts pflegen. Genau das kam dazu.

### Was du jetzt tun kannst

Klick auf **Bearbeiten**, dann erscheinen an jedem Abschnitt drei kleine
Knöpfe oben rechts:

| Knopf | Wirkung |
| --- | --- |
| ↑ | Abschnitt eine Stelle nach oben |
| ↓ | Abschnitt eine Stelle nach unten |
| ✕ | Abschnitt löschen (mit Rückfrage) |

Unter dem letzten Abschnitt steht **+ Abschnitt**. Der neue erscheint sofort
mit der Überschrift „Neuer Abschnitt" und dem Satz „Hier steht noch nichts."
Beides überschreibst du mit den Stiften wie gewohnt.

**Im Steckbrief rechts** hat jede Zeile jetzt einen Stift und ein ✕. Der Stift
öffnet ein kleines Feld für Beschriftung und Wert. Darunter legt **+ Zeile**
eine neue an.

### Warum ein neuer Abschnitt nicht leer ist

Das Wiki überspringt Abschnitte ohne Text — sonst stünden überall leere
Überschriften herum. Ein wirklich leerer neuer Abschnitt wäre also unsichtbar
gewesen, und du hättest ins Nichts geklickt. Deshalb bekommt er einen kurzen
Platzhaltersatz, den du gleich ersetzt.

### Für Besucher ändert sich nichts

Ohne Anmeldung ist von alldem nichts zu sehen: keine Knöpfe, keine Stifte,
keine Leisten. Die Seite sieht genauso aus wie vorher.

### Ein Fehler, der beim Testen auffiel

Beim ersten Bauen ließ das Entfernen einer Steckbriefzeile einen unsichtbaren
Rest in den Daten zurück. Man hätte nichts davon gesehen — aber bei jedem
Anlegen und Entfernen wäre ein Rest mehr dazugekommen. Behoben: Entfernen
räumt jetzt wirklich auf. Nachgewiesen an allen 29 Einträgen.

### Nachgeprüft

886 Einzelprüfungen an allen 29 Einträgen. Die wichtigste: Jede Änderung
lässt sich zurücknehmen, und danach sind die Daten **Zeichen für Zeichen**
wieder wie vorher. Dazu wurde die ganze Bedienung im Browser durchgespielt —
verschieben, anlegen, löschen, ändern — ohne dass dabei etwas nach GitHub ging.

---

## Fassung 2.0.1 – 25. August 2026

**Zwei Farben aus dem neuen Entwurf übernommen — und ein Fehler behoben, der
schon länger drin war.**

### Was du siehst

**Türkis für die Einordnung.** Die Zeile über dem Titel („Fraktion · Gilde")
und die Pfadzeile darüber („Age of Beast / Fraktionen / Maschinisten") sind
jetzt türkis statt blassgrau. Das trennt die Frage *„wo bin ich?"* sichtbar
vom eigentlichen Text.

**Verweise ruhen dunkler.** Bisher leuchteten alle Verweise im selben hellen
Ton, egal ob du mit der Maus darauf warst oder nicht. Jetzt sind sie im
Ruhezustand etwas satter und hellen erst beim Überfahren auf — so wie im
Entwurf. Der Text wirkt dadurch ruhiger.

### Der behobene Fehler

Beim Umschalten zwischen hell und dunkel behielten Verweise die Farbe der
**vorherigen** Ansicht. In der hellen Ansicht stand dann ein heller Verweis
auf hellem Grund — kaum lesbar. Erst ein Neuladen brachte es in Ordnung.

Das lag an der weichen Farbüberblendung: Der Browser übernimmt eine geänderte
Farbe nicht, solange für sie eine Überblendung eingerichtet ist. Beim
Umschalten werden die Überblendungen jetzt kurz stillgelegt und sofort danach
wieder freigegeben. Das Aufhellen beim Überfahren bleibt also erhalten.

**Der Fehler war nicht neu** — er steckte schon in der ersten Fassung des
Wikis. Er fiel nur nicht auf, weil die beiden Farben sich vorher kaum
unterschieden.

### Nachgemessen

Alle Farben wurden auf Lesbarkeit geprüft, in beiden Ansichten. Der niedrigste
Wert liegt bei 5,7 zu 1 — nötig wären 4,5 zu 1. Umschalten wurde dreimal
hintereinander geprüft; jedes Mal stimmten alle Farben.

### Was **nicht** geändert wurde

Grundfarbe, Schriftart, Titelgrößen und der Lichtverlauf waren mit dem neuen
Entwurf bereits identisch — daran war nichts zu tun. Kacheln, Aufbau und alle
Inhalte bleiben unverändert.

---

## Fassung 2.0.0 – 25. August 2026

**Das Wiki braucht keinen fremden Dienst mehr.** Deine Welt liegt jetzt als
Datei in deinem eigenen GitHub-Repository, und dort wird auch gespeichert.
Firebase ist raus.

### Was sich für dich ändert

Beim Anmelden fügst du einmal einen **GitHub-Schlüssel** ein statt auf einen
Google-Knopf zu drücken. Einmal pro Gerät, danach merkt es sich das Wiki.
Bearbeiten funktioniert danach genau wie vorher — auch auf dem Handy.

### Warum kein Google-Knopf mehr

Bisher machte Firebase zwei Dinge: Es prüfte, wer du bist, *und* es bewachte
die Daten. Der Google-Knopf war nie der Schutz — der Schutz waren die Regeln
dahinter.

GitHub Pages liefert nur Dateien aus. Dort läuft kein Programm, das
nachprüfen könnte, ob wirklich du auf den Knopf gedrückt hast. Ein Google-Knopf
wäre also reine Verzierung. Was die Tür wirklich öffnet, ist der Schlüssel.

### Wie sicher ist das?

Der Schlüssel wird eng zugeschnitten: **nur dieses eine Repository, nur Dateien
ändern**. Käme er abhanden, kommt damit niemand an dein Konto, deine anderen
Repositories oder irgendwelche Zahlungsdaten. Und weil jede Änderung ein
Commit ist, lässt sich alles zurücknehmen. Widerrufen kannst du ihn jederzeit
mit zwei Klicks bei GitHub.

### Was du geschenkt bekommst

- **Jede Änderung ist ein Commit.** Du siehst, was wann geändert wurde, und
  kannst jederzeit zurück. Das gab es vorher nicht.
- **Die Sicherung ist automatisch.** Deine Welt liegt jetzt auf GitHub, auf
  deinem PC und in jedem Klon — statt nur in einer Datenbank.
- **Kein Auffrischen von Hand mehr.** Vorher musstest du nach jeder Änderung
  zwei Befehle laufen lassen und hochladen. Jetzt macht das Speichern alles
  in einem Zug, und die öffentliche Seite ist nach etwa einer Minute aktuell.
  Das Wiki sagt dir, wann es so weit ist.

### Kein Zwischenzustand

Ein Speichervorgang legt alle drei Datendateien zusammen in **einen** Commit.
Es kann also nie vorkommen, dass die Welt gespeichert ist, die Anzeigefassung
aber noch die alte. Vorher geprüft wird außerdem, ob in der Zwischenzeit
woanders gespeichert wurde — dann wird lieber gar nicht geschrieben und du
wirst gebeten, neu zu laden.

### Die Weltenschmiede ist Geschichte

Sie wird nicht mehr benutzt. Das Werkzeug, das früher von dort geholt hat,
liegt nur noch als Rückweg bei und **weigert sich zu starten**, solange man
nicht ausdrücklich `--wirklich` dazusagt — es würde sonst deine aktuelle Welt
mit dem alten Stand überschreiben.

### Für Besucher ändert sich nichts

Die Seite lädt wie vorher, ohne Anmeldung, ohne dass irgendetwas von Google
oder GitHub nachgeladen wird.

---

## Fassung 1.4.0 – 25. August 2026

> Diese Fassung wurde zusammen mit 2.0.0 veröffentlicht.

**Jetzt kannst du Texte im Wiki ändern.** Angemeldet erscheint oben rechts ein
zweiter Knopf: **Bearbeiten**. Drückst du ihn, bekommt auf jeder Eintragsseite
alles, was du ändern darfst, einen kleinen Stift.

### So geht es

1. Oben rechts auf **Anmelden**, dann auf **Bearbeiten**.
2. Auf den Stift neben dem Text klicken, den du ändern willst.
3. Ändern und auf **Speichern** klicken. Fertig.

Gespeichert wird sofort in der Weltenschmiede. Das Wiki zeigt die Änderung
augenblicklich an, ohne dass die Seite neu lädt — und ohne dass es nach oben
springt.

### Was du ändern kannst

- den **Namen** eines Eintrags
- den **Kurztext** direkt darunter
- die **Überschrift** eines Abschnitts
- den **Text** eines Abschnitts

### Was noch nicht geht

Abschnitte **anlegen, löschen oder umsortieren** geht noch nicht. Ebenso wenig
die Steckbriefzeilen rechts, die Verknüpfungen und das Anlegen neuer Einträge.
Das kommt in den nächsten beiden Fassungen.

### Du tippst kein HTML

In der Weltenschmiede stehen die Texte technisch als HTML — also mit Klammern
wie `<p>` und `<strong>`. Das bekommst du **nicht** zu sehen. Im Bearbeitungsfeld
steht der Text in einer einfachen Schreibweise:

```
## Eine Überschrift

Ein Absatz mit einem **fetten** und einem *kursiven* Wort.

- Ein Listenpunkt
- Noch einer
```

Eine Leerzeile trennt Absätze. Beim Speichern wird daraus wieder das richtige
HTML. Unter dem Feld steht die Kurzfassung dieser Regeln, damit du sie nicht
auswendig lernen musst.

### Warum du dich darauf verlassen kannst

Es wäre ärgerlich, wenn das Hin-und-Zurück-Übersetzen heimlich etwas an deinem
Text verändert. Deshalb wird genau das geprüft — nicht an ein paar Beispielen,
sondern an **allen 206 änderbaren Feldern deiner 29 Einträge**: Einen Text
öffnen und ohne zu tippen wieder speichern muss ihn Zeichen für Zeichen so
lassen, wie er war. Tut es das irgendwo nicht, schlägt die Prüfung fehl.

Zusätzlich wird nachgewiesen, dass eine **echte** Änderung auch wirklich
ankommt. Sonst wäre eine Prüfung, die einfach nichts tut, ja immer zufrieden.

### Eine Sicherheitsleine

Falls du parallel noch in der Weltenschmiede arbeitest und dort Abschnitte
verschiebst, könnte das Wiki sonst in den falschen Abschnitt schreiben. Das
kann nicht passieren: Vor jedem Speichern prüft das Wiki, ob der Abschnitt
noch derselbe ist. Stimmt etwas nicht, wird **nicht** gespeichert, sondern um
ein Neuladen gebeten.

### Für alle anderen ändert sich nichts

Wer nicht angemeldet ist, sieht die Seite genau wie vorher — der
Bearbeiten-Knopf ist gar nicht erst da. Nachgeprüft: Die Eintragsseiten sehen
Zeichen für Zeichen aus wie vor dieser Änderung.

### Noch offen

Die öffentliche Seite zeigt weiterhin die abgelegte Kopie. Wenn du etwas
änderst, musst du sie vorerst noch von Hand auffrischen und hochladen. Das
Veröffentlichen aus dem Wiki heraus kommt in Fassung 1.7.0.

---

## Fassung 1.3.0 – 24. August 2026

**Erster Schritt zum Bearbeiten im Wiki.** Oben rechts gibt es jetzt einen
Knopf **Anmelden**. Meldest du dich mit deinem Google-Konto an, zeigt das Wiki
nicht mehr die gespeicherte Kopie, sondern den **aktuellen Stand direkt aus der
Weltenschmiede**.

### Was jetzt geht

- Anmelden mit Google.
- Angemeldet siehst du den Live-Stand. Oben im Kopf steht dann
  „live aus der Weltenschmiede" statt „aus der Weltenschmiede".
- Das Wiki merkt sich die Anmeldung. Beim nächsten Öffnen bist du noch
  angemeldet, bis du auf **Abmelden** klickst.

### Was noch nicht geht

**Ändern kannst du noch nichts.** Dieser Schritt baut nur die Verbindung auf.
Das eigentliche Bearbeiten kommt als Nächstes — siehe unten.

### Für alle anderen ändert sich nichts

Wer nicht angemeldet ist, sieht die Seite wie bisher: dieselbe Kopie, sofort
da, ohne Anmeldung. Für diese Besucher wird auch **nichts** von Google
nachgeladen — die Anmelde-Technik wird erst geholt, wenn du sie brauchst. Die
Seite bleibt also so schnell und eigenständig wie vorher.

### Dein Konto ist die einzige Tür

Nur `kimpaliz1989@gmail.com` kommt an die Daten. Das ist nicht nur eine
Abfrage in der Seite, die man umgehen könnte: Firebase selbst lässt niemanden
sonst lesen oder schreiben. Meldet sich jemand mit einem anderen Google-Konto
an, wird er sofort wieder abgemeldet und bekommt keine Daten zu sehen.

### Was im Hintergrund passiert ist

Die Umwandlung der Rohdaten ins Wiki-Format lief bisher nur als Skript auf
deinem PC. Jetzt läuft sie auch im Browser — und zwar dieselbe. Das ist
wichtig, damit die Live-Ansicht **exakt** so aussieht wie die gespeicherte
Kopie. Nachgeprüft: Beide erzeugen Zeichen für Zeichen dasselbe Ergebnis.

---

## Inhalt aufgefrischt – 24. August 2026

**Der Kampagnen-Eintrag heißt jetzt auch in der Weltenschmiede „Age of Beast".**
Bisher stand dort noch der alte Name — im Wiki war das an der Überschrift
„Kampagnen-Frame: Sturmwende" zu sehen.

Geändert wurden genau drei sichtbare Stellen: der Name des Eintrags und der
Weltname an zwei Stellen im Text des Kampagnenkastens. Vorher wurde eine
Sicherung des kompletten Eintrags abgelegt unter
`OneDrive\Dokumente\RPG\backups\age-of-beast-umbenennung-20260824`.

Nicht angefasst wurden die internen Kennungen der Datenbank. Die tragen den
alten Namen weiter im Schlüssel — das ist Absicht: Sie sind die Adresse, unter
der die Daten liegen, und ein Ändern würde die Verbindung kappen.

Diese Änderung bekommt keine neue Fassungsnummer, weil sich nur Inhalt geändert
hat und nicht das Wiki selbst.

---

## Fassung 1.2.0 – 24. August 2026

**Das Wiki sieht jetzt aus wie dein Entwurf.** Grundlage ist die Design-Datei
„Aschekodex Wiki", die du geschickt hast. Am Inhalt ändert sich nichts, nur am
Aussehen.

### Was anders aussieht

- **Der Hintergrund** ist nicht mehr neutrales Schwarz, sondern ein dunkles
  Oliv. Oben links liegt ein weiches Licht, so wie im Entwurf.
- **Die Schrift** ist jetzt durchgehend eine Grotesk. Vorher waren die
  Überschriften in einer Serifenschrift gesetzt; dein Entwurf verwendet
  überall dieselbe Schrift.
- **Verlinkte Begriffe** stehen jetzt in hellem Violett mit einer feinen
  Unterlinie. Vorher waren sie kaum von normalem Text zu unterscheiden. Beim
  Überfahren werden sie zusätzlich hinterlegt.
- **Die Kacheln** sind etwas breiter, leicht durchscheinend und heben sich
  beim Überfahren einen Tick stärker an.
- **Die Vorschaufenster** an den Verweisen folgen exakt den Maßen aus dem
  Entwurf.

### Was gleich geblieben ist

Alle 29 Einträge, sämtliche Texte, die Suche, der Kategoriefilter, die
Verknüpfungen und die Bedienung. Es wurde keine Funktion geändert und kein
Inhalt angefasst.

### Lesbarkeit geprüft

Verlinkte Begriffe erreichen einen Kontrast von 11,9 zu 1 im dunklen und
9,5 zu 1 im hellen Thema. Verlangt werden 4,5 zu 1 — beide Werte liegen also
weit darüber.

### Keine Schriftart aus dem Netz

Der Entwurf verwendet die Schrift „Inter". Sie wird benutzt, wenn sie auf dem
Gerät vorhanden ist; sonst nimmt das Wiki die Systemschrift. Nachgeladen wird
nichts. Das Wiki funktioniert weiterhin vollständig ohne Internet.

---

## Fassung 1.1.0 – 24. August 2026

**Die Welt heißt jetzt „Age of Beast".** Vorher hieß sie „Sturmwende". Der neue
Name steht ab sofort überall: im Browser-Tab, in der Kopfzeile der Seite, in der
Beschreibung und in der Anleitung.

### Was sich geändert hat — und was nicht

Geändert hat sich **nur der Name**. Alle 29 Einträge, sämtliche Texte, die
Verweise, die Vorschaufenster und die Suche sind unangetastet. Zur Sicherheit
wurden die Inhalte noch einmal frisch aus der Weltenschmiede geholt und mit dem
bisherigen Stand verglichen: kein einziges Zeichen Unterschied.

### Warum die Weltenschmiede weiter „Sturmwende" sagt

In der Weltenschmiede heißt das Projekt absichtlich weiterhin so. Dort hängen
die Daten an dieser Bezeichnung; ein Umbenennen wäre ein Eingriff in die
laufende Datenbank und hat mit dem Wiki nichts zu tun.

**Das ist der wichtige Teil:** Bisher übernahm das Wiki den Weltnamen einfach
aus der Weltenschmiede. Hätte es das weiter getan, stünde beim nächsten
Auffrischen der Inhalte wieder „Sturmwende" auf der Seite. Deshalb ist
„Age of Beast" jetzt im Wiki selbst hinterlegt. Der Name bleibt also stehen,
egal wie oft die Inhalte aufgefrischt werden.

### Eine kleine Nebenwirkung

Das Wiki merkt sich, ob du die Seitenleiste offen hast und ob du hell oder
dunkel liest. Diese Notiz wurde mit umbenannt. Beim ersten Öffnen nach dieser
Änderung steht deshalb beides wieder auf der Voreinstellung: Seitenleiste
offen, dunkel. Einmal umstellen — danach merkt es sich das wieder wie vorher.

---

## Fassung 1.0.0 – 24. August 2026

**Das Wiki gibt es jetzt.** Bisher lagen die Inhalte nur in der Weltenschmiede.
Dort muss man sich anmelden und sich durch die Bearbeitungsoberfläche klicken.
Jetzt gibt es zusätzlich eine reine Leseseite, die sich schnell öffnet, auf dem
Handy funktioniert und keine Anmeldung braucht.

### Was drin ist

Alle **29 Einträge** aus dem Sturmwende-Projekt:

- die Kampagnenübersicht,
- die beiden Fraktionen **Maschinisten** und **Goldene Garde**,
- alle **24 Spezies**,
- **Lukas' Spielfigur**,
- die **Uniform der Goldenen Garde**.

Dazu 79 Textabschnitte, 106 Angaben in den Steckbriefen und 9 feste
Verbindungen zwischen Einträgen.

### Die wichtigste Neuerung: Verweise mit Vorschau

Wenn im Text der Name eines anderen Eintrags vorkommt, wird er automatisch zu
einem Verweis. Hält man die Maus darüber, klappt ein kleines Fenster auf und
zeigt, worum es bei diesem Eintrag geht — man muss die Seite nicht verlassen.
Auf dem Handy genügt ein Antippen; ein zweites Tippen auf „Öffnen" führt hin.

Insgesamt erkennt das Wiki **45 Begriffe**. Elf davon hattest du selbst in der
Weltenschmiede hinterlegt, die übrigen sind die Namen und Zweitbezeichnungen
der Einträge.

Zwei Regeln sorgen dafür, dass der Text lesbar bleibt:

- Ein Begriff wird pro Seite nur **beim ersten Mal** verlinkt. Sonst wäre bei
  den Maschinisten fast jedes zweite Wort unterstrichen.
- Ein Begriff wird nur verlinkt, wenn er **groß geschrieben** ist. Deutsche
  Hauptwörter sind das immer. Dadurch wird aus der Zahl „elf" kein Verweis auf
  die Spezies „Elf".

### Zwei Begriffe werden mit Absicht nicht verlinkt

- **„Elemental Kin"** gehört gleichzeitig zu vier Spezies (Earthkin, Emberkin,
  Skykin, Tidekin). Ein Verweis müsste sich für eine entscheiden und läge in
  drei von vier Fällen falsch.
- **„Prototyp"** ist eine alte Zweitbezeichnung des Kampagnen-Eintrags. Das Wort
  kommt im Text in ganz anderer Bedeutung vor.

Beide Bezeichnungen stehen weiterhin bei ihren Einträgen — sie werden nur nicht
automatisch verlinkt.

### Was jede Eintragsseite zeigt

Links der Fließtext, rechts ein Steckbrief mit vier Blöcken:

| Block | Inhalt |
| --- | --- |
| **Attribute** | die Kurzangaben, etwa Klassifikation oder Lebenserwartung |
| **Verknüpfungen** | womit der Eintrag fest verbunden ist, mit Erklärung |
| **Erwähnt in** | wo er sonst noch im Text vorkommt |
| **Herkunft** | Regelquelle und wann er zuletzt bearbeitet wurde |

Auf schmalen Bildschirmen rutschen diese Blöcke unter den Text.

### Kein Text ist verlorengegangen

Die Weltenschmiede legt Texte an zwei Stellen ab: in Anzeigefeldern und in
Hintergrundfeldern. Beim Übertragen wurde geprüft, ob wirklich jeder Text im
Wiki ankommt.

Ergebnis: **10 Texte** standen nur in den Hintergrundfeldern. Sie wurden als
eigene Abschnitte ergänzt und sind mit dem Vermerk *aus der Weltenschmiede*
gekennzeichnet. Weitere **75 Texte** waren doppelt vorhanden und wurden nur
einmal übernommen.

Zusätzlich fielen **24 Abschnitte** weg, die wortgleich den Einleitungssatz
darüber wiederholten — das betraf jede Spezies. Der Text ist nicht verloren, er
steht weiterhin als Einleitung ganz oben. Übrig bleiben 79 Abschnitte.

Ebenso wurde bei allen 24 Spezies die Schlusszeile „Regelquelle: …" aus dem
Fließtext genommen. Sie steht jetzt rechts im Steckbrief unter **Herkunft** —
einmal statt zweimal.

### Ein Hinweis auf den Reifegrad

Jede Kachel zeigt unten rechts **ausgebaut** oder **knapp**. Das ist keine
Bewertung, sondern nur eine Messung des Umfangs: mindestens drei Abschnitte und
mehr als 900 Zeichen gelten als ausgebaut. So siehst du auf einen Blick, wo noch
Arbeit wartet.

### Aussehen

Das Wiki folgt deinem Entwurf **„Aschekodex"** aus dem Design-Projekt: sehr
dunkler Hintergrund, Serifenschrift für Überschriften, blauviolette Akzente,
kleine gesperrte Großbuchstaben als Etiketten und ein sanfter Schein, wenn die
Maus über eine Kachel fährt.

Zusätzlich gibt es oben rechts einen Schalter zwischen hell und dunkel. Dunkel
ist voreingestellt.

### Drei Fehler, die beim Bauen auffielen und behoben wurden

1. **Alles war fett.** Beim Übertragen aus der Weltenschmiede gingen die
   schließenden Markierungen verloren, dadurch lief eine Fettschrift bis zum
   Seitenende weiter. Jetzt ist geprüft, dass in allen 29 Einträgen jede
   Auszeichnung sauber geschlossen wird.
2. **Auf dem Handy war der Text unsichtbar.** Wenn die Seitenleiste zugeklappt
   war, bekam der Inhalt eine null Pixel breite Spalte zugewiesen. Behoben.
3. **Der Kopfbereich lief über.** Der lange Untertitel drückte das Suchfeld auf
   null. Jetzt behält die Suche immer mindestens 200 Pixel, und der Untertitel
   weicht bei schmalen Fenstern.

### Womit das Wiki gebaut ist

Mit nichts. Es sind drei Dateien — die Seite, die Gestaltung und die Logik —
dazu die Daten. Kein Baukasten, keine Installation, keine fremden Bausteine,
die man pflegen müsste. Wer den Ordner in fünf Jahren öffnet, kann ihn immer
noch benutzen.

---

## Wie es hier weitergeht

Bei jeder Änderung kommt oben ein neuer Abschnitt dazu. Die Nummer davor
bedeutet:

- **Dritte Stelle** (1.0.**1**): Ein Fehler wurde behoben, sonst nichts.
- **Zweite Stelle** (1.**1**.0): Es ist etwas dazugekommen.
- **Erste Stelle** (**2**.0.0): Etwas funktioniert grundlegend anders als vorher.

Reines Auffrischen der Inhalte aus der Weltenschmiede bekommt keine neue Nummer.

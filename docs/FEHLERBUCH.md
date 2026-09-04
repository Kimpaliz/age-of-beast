# Fehlerbuch

Jannik: *„Du solltest dir andauernd alle Fehler notieren und
dokumentieren, um sie nicht zu wiederholen, und dir den Kontext dazu
notieren, um zu verstehen, warum und wieso."*

Dieses Buch ist die Rohdatensammlung: jeder Fehler mit dem Zustand, in
dem er entstand, und der Zahl, die ihn belegt. Die Fälle mit dem Vermerk
*(Startkapital)* stammen aus dem Scotophobia-Projekt (09/2026) — sie
sind übertragbar und haben dort schon einmal Zeit gekostet; dieses
Projekt muss sie nicht noch einmal bezahlen.

## Wie eingetragen wird

**Sofort, wenn der Fehler auffällt** — nicht am Ende der Arbeit, denn
dann fehlt der Kontext, der ihn erklärt. Vier Zeilen genügen:

| Feld | was hineingehört |
| --- | --- |
| **Was ich tat** | die Handlung, nicht die Absicht |
| **Was herauskam** | die Zahl oder Meldung, die stutzig machte |
| **Warum** | die Ursache, nicht das Symptom |
| **Woran ich es früher merke** | die Gegenprobe für das nächste Mal |

Wer einen Fehler einträgt, prüft, ob seine **Klasse** schon existiert.
Ein neuer Fall unter einer bekannten Klasse ist wertvoller als eine neue
Klasse — er zeigt, dass die Regel noch nicht greift.

---

## A · Die falsche Größe messen

Die naheliegende Zahl misst etwas anderes als das, was ein Mensch sieht.

### A1 · Mittelwert über alles, obwohl die Sache 2 % bedeckt *(Startkapital)*

**Was ich tat:** Drei Stellschrauben gemessen, jeweils als mittlere
Änderung über alle 65.536 Bildpunkte.
**Was herauskam:** Alle drei schienen wirkungslos — 0,08 Stufen.
**Warum:** Die Sache lag auf 2,3 % der Fläche; die übrigen 97,7 %
verdünnten jede Zahl um den Faktor vierzig. Wo sie lag, wirkte sie
längst. Derselbe Fehler passierte am selben Tag noch einmal mit einem
anderen Feld (14.400 Zellen, 200 betroffene).
**Woran ich es früher merke:** Vor jeder Mittelung fragen, **worüber**
gemittelt wird. Deckt die Sache weniger als die Hälfte ab, ist der
Mittelwert über alles die falsche Zahl.

### A2 · Eine feste Messsekunde, obwohl das System schwingt *(Startkapital)*

**Was ich tat:** Einen Füllstand „bei Sekunde 28" gemessen, dreimal mit
verschiedenen Schwellen.
**Was herauskam:** 40 %, 62 %, 65 % — dreimal eine Schwelle gesetzt,
dreimal falsch.
**Warum:** Das System ist zeitperiodisch; der Wert pendelt von selbst.
Eine feste Messsekunde erwischt mal Berg, mal Tal.
**Woran ich es früher merke:** Liefert dieselbe Messung bei zwei Läufen
verschiedene Zahlen, ist die Zeitachse Teil des Problems — dann Spitze
oder Mittel über eine ganze Periode nehmen.

### A3 · Eine fremde Zahl heißt „max" und ist ein Perzentil *(Startkapital)*

**Was ich tat:** Doku-Zahlen gegen einen Messbericht geprüft; 130,1
gegen 130,4 sah nach einer Abweichung aus.
**Warum:** Die Spalte hieß „max" und enthielt das 99,9-Perzentil —
Absicht, aber der Name log.
**Woran ich es früher merke:** Bevor eine fremde Zahl als Abweichung
gilt, nachsehen, **wie** sie gerechnet wird.

---

## B · Eine Messung, die gar nichts misst

Der Aufbau ist so gebaut, dass er das Ergebnis nicht zeigen kann.

### B1 · Eine Ersetzung, die nichts ersetzte *(Startkapital)*

**Was ich tat:** Absichtlich einen Fehler eingebaut, um zu prüfen, ob
eine Wache anschlägt. Sie schlug nicht an — ich hielt sie für blind.
**Warum:** Den Suchtext gab es in der Datei gar nicht; die Gegenprobe
hatte nichts geändert.
**Woran ich es früher merke:** Jede Ersetzung prüft vorher, ob ihre
Marke **vorkommt**, und bricht sonst ab:
`if (!s.includes(MARKE)) process.exit(1);`

### B2 · Fünf Messwerte, fünfmal dieselbe Zahl *(Startkapital)*

**Was ich tat:** Eine Konstante in fünf Stufen gepatcht und je gemessen
— im selben Prozess.
**Warum:** `import()` cached; das Modul wurde einmal geladen.
**Woran ich es früher merke:** Jeder gepatchte Wert braucht einen
**frischen Prozess** (`spawnSync`), sonst ist die Messreihe wertlos.

### B3 · Ein Ergebnis, das zu ordentlich ist, um wahr zu sein *(Startkapital)*

**Was ich tat:** Jeden Export gegen den Suchraum gehalten, um tote zu
finden.
**Was herauskam:** **191 von 191** angeblich ohne Leser — auch die
Konstante, die nachweislich ein Dutzend Dateien importiert.
**Warum:** Das Suchmuster war auf dem Weg durch die Shell kaputtgegangen
(`\\b` wurde zum Backspace-Zeichen) und konnte nichts treffen.
**Woran ich es früher merke:** Ein perfektes Ergebnis ist zuerst ein
Verdacht **gegen die Messung**. Jede Inventur trägt eine Gegenprobe mit
einem Namen, dessen Ergebnis bekannt ist — findet sie ihn nicht, bricht
sie ab, statt eine schöne Liste zu drucken.

---

## C · Werkzeugfallen dieser Umgebung (Windows, Git-Bash, Node)

Nichts davon hat mit einem Projekt zu tun — alles davon hat schon Zeit
gekostet. Diese Fälle gelten auf diesem Rechner **immer**.

### C1 · Die Shell frisst Backslashes und Backticks *(Startkapital)*

`node -e "…"` und Bash-Heredocs werten in doppelten Anführungszeichen
aus: `C:\Users\…` kommt als `UsersJannik…` an, `\\n` wird zu `\n`, ein
Regex mit Backticks trifft nie.
**Woran ich es früher merke:** Alles mit Backslash, Backtick oder Regex
geht als **Datei** ins Scratchpad (mit dem Schreibwerkzeug angelegt),
nie als `-e`-Argument oder Heredoc. Und: Windows-Node versteht den
Git-Bash-Pfad `/c/Users/…` nicht — in Node-Argumenten immer
`C:/Users/…` schreiben.

### C2 · `$1` und `$'` im Ersatztext von `String.replace` *(Startkapital)*

`"$1" + 489` liest JavaScript als Gruppe 14; ein Ersatztext, der `$'`
enthält, fügt **alles nach dem Treffer** ein — eine Datei wuchs so von
6.426 auf 13.020 Zeilen.
**Woran ich es früher merke:** Ein Ersatztext, den ich nicht selbst
kontrolliere, gehört nie als Zeichenkette in `replace` — entweder eine
Funktion als Ersatz oder `slice` und Zusammensetzen. Nach jeder
Ersetzung die Dateigröße ansehen.

### C3 · CRLF gegen LF *(Startkapital)*

Textersetzungen mit `\n`-Suchmustern treffen auf CRLF-Dateien nichts;
in Regexen passt `$` ohne `\r?` davor nie, und `.` trifft kein `\r`.
**Woran ich es früher merke:** Beim Suchen `\r?\n` verwenden oder das
Edit-Werkzeug nehmen. Beim Einfügen die Zeilenenden der Zieldatei
übernehmen.

### C4 · `cat -A` und `grep` zeigen das CR nicht an *(Startkapital)*

Die Textwerkzeuge dieser Git-Bash entfernen das CR, **bevor** sie es
anzeigen. Eine heile CRLF-Datei sah dadurch kaputt aus und wäre beinahe
„repariert" worden; umgekehrt bestand einmal jede Datei eine
CRLF-Prüfung, weil `$'\r'` als leeres Muster ankam.
**Woran ich es früher merke:** Zeilenenden nie mit `grep` oder `cat -A`
beurteilen — `file <datei>` nehmen oder die Bytes zählen. Und
`git show HEAD:datei` liefert den LF-normalisierten Blob, der für
Zeilenenden-Vergleiche unbrauchbar ist.

### C5 · Ein `*/` mitten in einen Kommentarblock gesetzt *(Startkapital)*

Beim Bearbeiten eines langen `/* … */`-Kopfes sieht man den Ausschnitt,
nicht die Klammer darum — ein eingefügtes `*/` machte die Datei zu
ungültigem JavaScript.
**Woran ich es früher merke:** Nach jeder Änderung an einem Dateikopf
`node --check` laufen lassen. Kostet nichts, fängt genau das.

---

## D · Die eigene Erwartung ist falsch, nicht der Code

### D1 · Das Fließgleichgewicht *(Startkapital)*

Ein Wert kehrte nach einer Störung nicht auf 100 % zurück, sondern blieb
bei 62 % — zwei Schwellen wurden gesetzt, beide falsch. 62 % **war** das
Gleichgewicht des Systems; es gab keinen Fehler.
**Woran ich es früher merke:** Bevor eine Zahl als Fehler gilt, fragen,
ob das System sie so **haben muss** — und gegen das im selben Lauf
gemessene Gleichgewicht prüfen, nicht gegen eine geratene Zahl.

### D2 · Die frisch geschriebene rote Prüfung *(Startkapital)*

Drei neue Prüfungen an einem Tag waren beim ersten Lauf rot — alle drei
Male war die Erwartung falsch, nicht der Code.
**Woran ich es früher merke:** Wenn eine frische Prüfung sofort rot ist,
ist die Erwartung der wahrscheinlichere Fehler.

---

## E · Was in keiner Prüfung läuft, geht still kaputt

### E1 · Das Werkzeug außerhalb der Kette *(Startkapital)*

Ein Bauwerkzeug, dessen Ergebnis Menschen benutzten, lief in **null**
Prüfungen mit. Vier Defekte sammelten sich an; der sichtbarste: ein
Knopf tat nichts, ohne jede Fehlermeldung.
**Woran ich es früher merke:** Jedes Werkzeug, dessen Ergebnis jemand
benutzt, gehört in die Prüfkette — und jede Ersetzung prüft ihr
Ergebnis, bevor sie schreibt.

### E2 · Eine Zahl, die neben der Wahrheit steht *(Startkapital)*

`const ARTEN = 3;` stand neben der Liste mit den drei Einträgen. Zwei
Zahlen für dieselbe Sache gehen gut, bis jemand eine ändert — dieselbe
Falle steckt in jeder Prosazahl („zwölf Bytes", „20 Prüfungen"), die
eine Konstante wiederholt.
**Woran ich es früher merke:** Eine Zahl, die aus einer Liste folgt,
**wird berechnet** oder verweist auf die eine Stelle, die sie führt.

### E3 · Der halbe Bestand war von der Geheimnisprüfung ausgenommen

**Was ich tat:** Das Alpha-Code-Gerüst aufgestellt und
`alpha-code.json` so gelassen, wie das Einrichtungsskript es anlegt.
**Was herauskam:** `pruefe-geheimnisse.mjs` meldete grün — und hatte
`docs/` und `daten/` **nie angesehen**. Gemessen: 251 Dateien in
`daten/`, `docs/` und `.github/`, die niemand durchsucht hat.
**Warum:** Die Prüfung las `ausnahmen` aus `alpha-code.json` — dieselbe
Liste, mit der die **Quelldateien** eingegrenzt werden. Dort stehen gute
Gründe, einen Ordner nicht als Quelle zu führen (erzeugte Daten,
Dokumentation), und kein einziger, ihn nicht auf Geheimnisse zu prüfen.
Die Vorlage setzt `daten` und `docs` von sich aus. **Der Fehler steckt in
der Skill-Vorlage und betrifft jedes damit eingerichtete Projekt**; er
war dort schon einmal notiert (Monster Slayer, 04.09.2026) und ist hier
zum zweiten Mal aufgetreten.
**Woran ich es früher merke:** Jede Prüfung meldet mit, **wie viele
Dateien sie wirklich angesehen hat**. `pruefe-geheimnisse.mjs` tut das
jetzt und schlägt bei unter hundert an. Eine Prüfung, die null Dateien
liest, sieht sonst aus wie eine saubere. Die Ausnahmeliste der
Geheimnissuche heißt hier deshalb `geheimnisAusnahmen` und ist von der
Quelldateiliste getrennt.

### E4 · Eine Tabelle, die ein Wächter mitgelesen hat

**Was ich tat:** In `docs/ALTLASTEN.md` unter der Baseline eine zweite
Tabelle angelegt: „Ausdrücklich **keine** Altlasten", mit
`| \`datei\` | Zeilen | Begründung |`.
**Was herauskam:** `pruefe-altlasten.mjs` meldete **neun** geführte
Altlasten statt fünf.
**Warum:** Der Wächter liest jede Zeile der Form
`| \`pfad\` | Zahl |` — er kennt keine Abschnitte. Meine
Gegenbeispiel-Tabelle hatte genau dieses Format und wurde stillschweigend
zur Baseline. Vier Dateien, die ausdrücklich **keine** Altlast sein
sollten, waren plötzlich welche.
**Woran ich es früher merke:** Wer in eine Datei schreibt, die ein
Wächter liest, prüft **sein Format**, nicht nur seinen Sinn. Behoben,
indem die Zeilenzahl in die dritte Spalte wanderte. Dasselbe gilt für
Überschriftenebenen: `pruefe-tags.mjs` liest den Abschnitt „Ohne
Kopfnotiz" bis zur nächsten `##`-Überschrift — eine `###` darunter hätte
die Erinnerungstabelle mit hineingezogen.

---

## F · Zu viel Kontext in einer Sitzung

### F1 · Zwei Besitzer für dieselbe Datei *(Startkapital)*

Einem Agenten wurden zwei Dateien zugewiesen — und zwanzig Minuten
später selbst angefasst. Deshalb gibt es `WORKCLAIM.md`.
**Woran ich es früher merke:** Der Schnitt wird aufgeschrieben, bevor
der erste Agent läuft — und gelesen, bevor ich selbst etwas anfasse.

### F2 · Eine Zahl aus dem Gedächtnis *(Startkapital)*

In einen Agentenauftrag wurde „die letzte Nummer ist 106" geschrieben.
Es war 107. In einer anderen Sitzung wurde ein Werkzeugname genannt,
den es nie gab.
**Woran ich es früher merke:** In einen Auftrag gehört keine Zahl und
kein Dateiname aus dem Gedächtnis — entweder nachzählen oder den
Agenten zählen lassen.

### F3 · Eine zweite Sitzung wechselte den Zweig unter der ersten

**Was ich tat:** Auf `einrichtung/alpha-code` gearbeitet, im gemeinsamen
Arbeitsverzeichnis.
**Was herauskam:** Zwei Stunden später stand `git branch --show-current`
auf `welt/karte-und-figuren`. Das Reflog zeigte, was passiert war:
`checkout: moving from einrichtung/alpha-code to welt/karte-und-figuren`,
danach ein fremder Commit.
**Warum:** Eine zweite Sitzung hat im selben Verzeichnis einen Zweig
angelegt, gewechselt und committet. Offene Änderungen wandern beim
Wechsel mit — **nichts ging verloren**, aber die halbfertige Einrichtung
lag auf einem fremden Zweig, und die Dateien der anderen Sitzung lagen in
meiner Messung (56 statt 60 Quelldateien, je nach Zweig).
**Woran ich es früher merke:** `git branch --show-current` **vor** jedem
Commit und vor jeder Messung, deren Zahl in ein Dokument wandert. Und:
Ein Checkout, ein Zweig — parallele Arbeit gehört in einen eigenen
Worktree. Das Projekt hat elf davon; einer mehr hätte diesen Fall
verhindert.
**Bemerkenswert:** Diese Falle ist zugeschnappt, **während**
`WORKCLAIM.md` entstand und bevor sie zum ersten Mal committet war.
Genau deshalb steht der Fall dort noch einmal ausführlich.

### F4 · „Existiert nicht mehr" — ohne nachzusehen

**Was ich tat:** In eine Korrektur an `docs/UPGRADE_ANALYSE_PLAN.md`
geschrieben, der Integrationsbranch `codex/age-of-beast-upgrade-structure`
„existiert nicht mehr (`git branch -a`)" — und den Befehl gleich
danebengesetzt, ohne ihn ausgeführt zu haben.
**Was herauskam:** Er existiert. Zusammen mit vierzehn weiteren
`codex/aob-*`-Zweigen, von denen elf eigene Arbeitsverzeichnisse belegen.
**Warum:** Die Aussage klang plausibel, weil die Arbeit abgeschlossen
war. Plausibel ist nicht gemessen. Besonders bitter: Der Beleg stand
schon in der Zeile — nur eben als Behauptung, nicht als Ergebnis.
**Woran ich es früher merke:** Wenn ein Befehl als Beleg neben einer
Aussage steht, wurde er ausgeführt. Sonst gehört er nicht dorthin.
Aufgefallen ist es nur, weil derselbe Befehl kurz darauf aus einem
anderen Grund wirklich lief — F4 ist der Fall, den F2 beschreibt, in
seiner gefährlichsten Form: **mit einer Quellenangabe daneben.**

### C6 · `git checkout --` holte meinen eigenen, ungespeicherten Fix zurück

**Was ich tat:** Für den Rot-Beweis eines frischen Wächters den alten
Fehler absichtlich in `karten.html` und `bogen.html` zurückgebaut, den
Wächter anschlagen sehen — und danach mit `git checkout -- <datei>`
„aufgeräumt".
**Was herauskam:** Beide Dateien standen wieder auf dem Stand **vor**
meiner Reparatur. Der Wächter war grün, weil er die Dateien gar nicht
mehr beanstanden konnte — er prüfte einen Zustand, den ich soeben
selbst zerstört hatte.
**Warum:** `git checkout -- <datei>` holt den Stand aus dem **Index**.
Mein Fix lag nur im Arbeitsbaum, war also nie dort angekommen. Der
Befehl tat genau das, was er soll — nur war das Ziel der falsche Stand.
**Woran ich es früher merke:** Ein Rot-Beweis darf nie auf
ungespeicherter Arbeit laufen. Entweder **vorher committen**, oder die
Datei in den Scratchpad sichern und von dort zurückkopieren. Nach jedem
Rot-Beweis gehört ein `cmp` gegen die Sicherung dazu; genau der hat den
zweiten Durchgang belegt.

**Zweiter Vorfall am selben Tag, 04.09.2026.** Beim Rot-Beweis des
Doku-Status-Wächters habe ich `docs/geschichte/INVENTAR.md` mit
`git checkout --` zurückgesetzt — und damit die Verweis-Reparatur
mitgenommen, die zehn Minuten vorher entstanden und nie committet war.
Gefangen hat es `pruefe-verweise` in der Gesamtkette, drei tote
Verweise. **Die Regel greift also nicht nur für die geprüfte Datei,
sondern für jede, die der Rot-Beweis anfasst.** Sicherung im
Scratchpad statt `git checkout`, ausnahmslos.

### C1b · Backticks in einer doppelt gequoteten Shell-Zeichenkette

**Was ich tat:** Einen Changelog-Eintrag über `node -e "…"` geschrieben
und darin den Dateinamen ``wiki.html`` in Backticks gesetzt, wie es die
Markdown-Auszeichnung verlangt.
**Was herauskam:** `bash: wiki.html: Not a directory` — und im
Changelog stand der Satz „Ich habe das Wiki nach ␣ gezogen". Der
Dateiname war spurlos verschwunden, der Satz blieb grammatisch heil.
**Warum:** Die Shell führt Backticks in `"…"` als Befehl aus und setzt
dessen Ausgabe ein. Hier war sie leer. **Derselbe Fehler war am selben
Tag schon in Scotophobia passiert** — dort landete die Konsolenausgabe
eines Werkzeugs mitten in einem Quelltextkommentar.
**Woran ich es früher merke:** Markdown-Text mit Backticks geht nie
durch `node -e` oder ein Heredoc ohne Anführungszeichen, sondern immer
als `.mjs`-Datei im Scratchpad. Klasse C1 hat damit ihren zweiten Fall
— die Regel greift noch nicht.

### D3 · Zwei Rot-Beweise blieben gruen — die Pruefung war blind

**Was ich tat:** Einen frischen Waechter mit zwei Zusicherungen versehen,
die auf Textmuster im Quelltext sahen: kommt `MENUE` vor? kommt
`a[href]` vor? Danach den Rot-Beweis gefahren.
**Was herauskam:** Beide blieben **gruen**, obwohl das geprueften
Verhalten nachweislich kaputt war. Bei `MENUE` stand der Name noch an
einer zweiten Stelle im Code; beim Selektor ignorierte meine
DOM-Attrappe das Argument von `querySelectorAll` und gab immer alle
Verweise zurueck — eine Verengung auf `a[href="wiki.html"]` fiel ihr
deshalb nicht auf.
**Warum:** Beide Zusicherungen lasen die **Schreibweise** statt das
**Verhalten**. Ein Name kann an zwei Stellen stehen; eine Attrappe, die
ihr Argument wegwirft, kann per Bauart nicht merken, dass es sich
geaendert hat.
**Woran ich es frueher merke:** Der Rot-Beweis ist die Messung, nicht
die Formalie — eine Zusicherung, die dabei gruen bleibt, ist Zierde und
gehoert ersetzt, nicht ergaenzt. Und eine Attrappe, die einen Parameter
entgegennimmt und nicht auswertet, ist ein Verdacht gegen sich selbst;
meine wirft jetzt bei einem Selektor, den sie nicht kennt.

### D4 · Ein erdachter kaputter Wert wirft nicht

**Was ich tat:** Pruefen wollen, dass ein `try/catch` um das Lesen der
Adresse noetig ist — mit dem Testwert `?w=%E0%A4%A`, der wie eine
kaputte Prozentkodierung aussieht.
**Was herauskam:** Nichts warf. Die Pruefung blieb gruen, auch als ich
das `try/catch` entfernte.
**Warum:** `URLSearchParams` raeumt kaputte Kodierungen stillschweigend
auf und wirft nie. Der Fall, den das `try/catch` wirklich abfaengt, ist
ein anderer: In einem privaten Fenster **wirft der Zugriff selbst**.
**Woran ich es frueher merke:** Wenn ein Schutz gegen einen Wurf
geprueft wird, muss zuerst belegt sein, **dass** und **wo** etwas wirft.
Der Test benutzt jetzt eine Umgebung, deren `search`-Getter wirft — also
genau die Stelle, die der Kommentar nennt.

### F5 · Die Wegweiser-Tabelle wuchs nicht mit

**Was ich tat:** Nachgesehen, welche Pruefungen in der Kette laufen, und
mit der Tabelle im Kopf von `pruefe-alles.mjs` verglichen.
**Was herauskam:** **Sechs** laufende Pruefungen fehlten dort
(`besucheransicht`, `bogenfarben`, `favoriten`, `karte`, `kartenpins`,
`vorlagen`), und **eine** war aufgefuehrt, die es nicht mehr gibt
(`pruefe-github.mjs`).
**Warum:** Neue Pruefungen werden von der Kette **automatisch**
eingesammelt — die Tabelle ist die einzige Stelle, die von Hand
gepflegt werden muss. Was automatisch laeuft, erinnert niemanden daran.
Die drei Codex-Pakete hatten ihre Zeilen nicht ergaenzt.
**Woran ich es frueher merke:** Nichts wurde rot; die Landkarte wurde
nur still falsch, und sie ist die Datei, die man **zuerst** oeffnet. Die
Vollstaendigkeit wird jetzt in beide Richtungen geprueft
(`pruefe-rueckweg.mjs`) — jede vorhandene Datei steht in der Tabelle,
und jede genannte Datei existiert.


### E9 · Das Attribut stand da, die Wirkung fehlte

**Was ich tat:** Janniks Meldung „Die Kategorien filtern nichts" geprueft,
indem ich nach einem Klick `document.querySelectorAll('.kachel')` nahm und
zaehlte, wie viele `k.hidden` tragen.
**Was herauskam:** 35 von 59 — genau die richtige Zahl. Ich haette daraus
fast geschlossen, der Filter sei in Ordnung und Jannik taeusche sich.
**Warum:** `hidden` wirkt allein ueber die eingebaute Browserregel
`[hidden] { display: none }`, und die ist die **schwaechste Regel
ueberhaupt**. `wiki.css` setzt `.kachel { display: flex }` — eine
Klassenregel schlaegt sie. Gemessen: 35 Kacheln mit dem Attribut,
**0 davon unsichtbar**.
**Woran ich es frueher merke:** Ein Attribut ist eine Absicht, keine
Wirkung. Wer Sichtbarkeit prueft, fragt nach `offsetParent` oder
`getComputedStyle(...).display` — also nach dem, was ein Mensch saehe.
Verwandt mit **D3**: dort las die Pruefung die Schreibweise statt des
Verhaltens, hier den Zustand statt seiner Folge.

### E10 · Ein Modul, das Wiederverwendung verspricht und sie nicht kann

**Was ich tat:** `werkzeuge/browser-messen.mjs` fuer eine zweite Messung
benutzt. Sein Kopfkommentar sagt ausdruecklich, es sei herausgeloest
worden, „weil die naechste Messung es wiederverwenden kann".
**Was herauskam:** „Chromium gab innerhalb von 15 Sekunden kein
Messergebnis aus." Dreimal, mit drei verschiedenen Vermutungen — fehlende
Dateien, zu kurze Wartezeit, kaputtes Skript. Alle falsch.
**Warum:** Die Adresse der Messseite (`/__aob-bogenfarben.html`) und die
Ergebnis-ID waren **fest verdrahtet**. Der Server lieferte meine Seite gar
nicht aus, der Browser suchte eine ID, die es nicht gab. Beides stumm: ein
404 auf eine Seite, die niemand sonst anfordert, und eine Abfrage, die
ewig `undefined` liefert.
**Woran ich es frueher merke:** Ein Modul ist erst wiederverwendbar, wenn
es **einmal wirklich wiederverwendet** wurde — der Kopfkommentar ist eine
Absichtserklaerung, kein Beleg. Und: Eine Messung, die im Fehlerfall nur
„kein Ergebnis" sagt, macht jede Diagnose zum Raten. Die Messseite meldet
jetzt, an welchem Schritt sie haengt.


---

## Was daraus folgt

Die fünf wirksamsten Gewohnheiten aus diesen Fällen:

1. **Vor jeder Mittelung fragen, worüber gemittelt wird.** (Klasse A)
2. **Jede Ersetzung prüft vorher, ob ihre Marke vorkommt.** (Klasse B, C)
3. **Eine rote frische Prüfung ist zuerst ein Verdacht gegen die
   Erwartung**, nicht gegen den Code. (Klasse D)
4. **Jede Prüfung meldet mit, wie viel sie angesehen hat.** Null Dateien
   sehen aus wie null Fehler. (Klasse E)
5. **Ein Befehl neben einer Aussage bedeutet: er lief.** (Klasse F)

# Daggerheart – Regelgrundlagen

**Was das ist:** Eine deutschsprachige Regelreferenz für das Tabletop-Rollenspiel
*Daggerheart* (Darrington Press / Critical Role), erstellt aus dem offiziellen
System Reference Document (SRD 1.0, Mai 2025) und ergänzenden Quellen.
**Warum es sie gibt:** Jannik spielt Daggerheart und will die Regeln „bis ins
kleinste Haar" auf Deutsch nachschlagen können, ohne jedes Mal im englischen
Originaltext suchen zu müssen. `[Aufgabe: Regeln]`

**Stand:** 04.09.2026. Bezieht sich auf **SRD 1.0** (9 Klassen, 9 Domänen –
siehe Hinweis zu SRD 2.0 im Abschnitt „Offen geblieben"). Kein Ersatz für das
gedruckte Kernregelwerk, das zusätzlich Beispiele, Weltinformationen und
Kunst enthält, aber es deckt die mechanischen Regeln vollständig ab.

**Hinweis zur Zuverlässigkeit:** Jede Zahl in diesem Dokument stammt entweder
wörtlich aus der offiziellen SRD-PDF oder ist als Vorbehalt gekennzeichnet.
Wo eine Tabelle aus dem PDF-Layout nicht sauber rekonstruierbar war, steht das
ausdrücklich dabei, statt eine plausible Zahl zu raten.

---

## Inhalt

1. [Der Kernwurf (Duality Dice)](#1-der-kernwurf-duality-dice)
2. [Hope und Fear als Ressourcen](#2-hope-und-fear-als-ressourcen)
3. [Die sechs Attribute](#3-die-sechs-attribute)
4. [Schaden, Stress, Hit Points, Damage Thresholds](#4-schaden-stress-hit-points-damage-thresholds)
5. [Rüstung](#5-rüstung-armor-score-armor-slots)
6. [Evasion](#6-evasion)
7. [Kampfablauf](#7-kampfablauf)
8. [Die neun Klassen](#8-die-neun-klassen)
9. [Die neun Domänen](#9-die-neun-domänen)
10. [Domänenkarten und Loadout](#10-domänenkarten-und-loadout)
11. [Abstammungen und Gemeinschaften](#11-abstammungen-ancestries-und-gemeinschaften-communities)
12. [Experiences](#12-experiences)
13. [Stufenaufstieg (Leveling)](#13-stufenaufstieg-leveling)
14. [Ausrüstung und Waffen](#14-ausrüstung-und-waffen)
15. [Downtime, Rests](#15-downtime-rests)
16. [Death Moves](#16-death-moves)
17. [Gold, Countdowns, GM-Fear, Adversaries, Environments](#17-gold-countdowns-fear-ausgaben-des-spielleiters-adversaries-und-environments)
18. [Woher diese Angaben stammen](#woher-diese-angaben-stammen)
19. [Offen geblieben](#offen-geblieben)

---

## 1. Der Kernwurf (Duality Dice)

Jeder **Action Roll** (Aktionswurf) benutzt die **Duality Dice**: zwei
optisch unterscheidbare d12. Ein Würfel steht für **Hoffnung (Hope)**, der
andere für **Furcht (Fear)**.

**Ablauf (fünf Schritte laut SRD):**

1. **Attribut wählen** – meist von der Fähigkeit/Waffe vorgegeben, sonst legt
   die Spielleitung (GM) es fest oder lässt die Spielerin wählen, wenn mehrere passen.
2. **Schwierigkeit (Difficulty) festlegen** – die GM legt eine Zielzahl fest,
   die sie offenlegen kann oder nicht.
3. **Zusatzwürfel und Modifikatoren anlegen** – Experience nutzen (siehe
   Abschnitt 12), Advantage/Disadvantage, Rally-Würfel usw. Diese müssen
   **vor** dem Wurf angesagt werden, sofern eine Fähigkeit nichts anderes sagt.
4. **Würfeln** – beide Duality Dice plus Zusatzwürfel, Ergebnis ansagen als
   „[Summe] mit Hope/Fear" oder „Critical Success!".
5. **Auflösen** – Spielerin und GM erzählen gemeinsam die Konsequenz.

**Wertung – vier Ergebnisse plus Sonderfall:**

| Ergebnis | Bedingung | Wirkung |
| --- | --- | --- |
| **Success with Hope** | Summe ≥ Difficulty, Hope-Würfel > Fear-Würfel | Erfolg, Spielerin erhält 1 Hope |
| **Success with Fear** | Summe ≥ Difficulty, Fear-Würfel > Hope-Würfel | Erfolg, aber mit Kosten/Komplikation; GM erhält 1 Fear |
| **Failure with Hope** | Summe < Difficulty, Hope-Würfel > Fear-Würfel | Fehlschlag mit kleiner Konsequenz; Spielerin erhält 1 Hope |
| **Failure with Fear** | Summe < Difficulty, Fear-Würfel > Hope-Würfel | Fehlschlag mit großer Konsequenz; GM erhält 1 Fear |
| **Critical Success** | Beide Würfel zeigen denselben Wert (Gleichstand) | Automatischer Erfolg **mit Bonus**, Spielerin erhält 1 Hope **und** löscht 1 Stress. Bei einem Angriffswurf: kritischer Schaden (siehe Abschnitt 4). Ein Critical Success zählt immer als Wurf „mit Hope". |

Bei jedem Wurf passiert **immer** etwas – „nichts passiert" gibt es in
Daggerheart nicht (Prinzip *Failing Forward*).

**Modifikatoren:** Der Attributwert (Trait-Modifier, siehe Abschnitt 3) wird
zur Würfelsumme addiert. Zusätzlich können Boni aus Experiences, Ausrüstung,
Fähigkeiten usw. angelegt werden.

**Advantage und Disadvantage:** Beide werden mit einem zusätzlichen **d6**
gewürfelt.

- **Advantage:** d6 wird zur Summe **addiert**.
- **Disadvantage:** d6 wird von der Summe **subtrahiert**.
- Advantage und Disadvantage im selben Würfelpool **heben sich gegenseitig
  eins zu eins auf** – man würfelt nie beide gleichzeitig im eigenen Pool.
  Kommen sie aus verschiedenen Quellen (z. B. eigener Nachteil plus *Help an
  Ally* eines anderen Spielers), addieren sich die Effekte trotzdem.
- Wer einer verbündeten Person mit *Help an Ally* hilft, würfelt selbst ein
  Advantage-d6, dessen Ergebnis der Handelnden zugutekommt.

**Wann wird gewürfelt?** Nur wenn eine Aktion **schwierig** oder ihr Ausgang
**riskant/ungewiss** ist. Ist Erfolg trivial oder ein Scheitern uninteressant,
gelingt die Aktion automatisch, ohne Wurf.

**Spezielle Würfe:**

- **Trait Roll:** ein Aktionswurf mit angegebenem Attribut, Notation
  „[Attribut] Roll (Schwierigkeit)", z. B. „Agility Roll (12)".
- **Spellcast Roll:** ein Trait Roll mit dem **Spellcast-Attribut** der
  Subklasse. Kann gleichzeitig ein Angriffswurf sein, falls er Schaden verursacht.
- **Attack Roll:** siehe Abschnitt 7.
- **Reaction Roll:** Abwehrwurf gegen einen Angriff oder eine Gefahr. Anders
  als Action Rolls: **erzeugt kein Hope/Fear**, löst **keine** zusätzlichen
  GM-Moves aus, und andere Charaktere können **nicht** mit *Help an Ally*
  helfen. Bei einem Critical Success auf einen Reaction Roll wird **kein**
  Stress gelöscht/Hope gewonnen, stattdessen werden alle Effekte eines
  normalen Erfolgs (z. B. Schaden) komplett ignoriert.
- **Group Action Roll:** Bei einer gemeinsamen Aktion mehrerer PCs führt eine
  Person den Action Roll, alle anderen würfeln Reaction Rolls. Jeder Erfolg
  gibt der Anführerin **+1**, jeder Fehlschlag **−1** auf ihren Wurf.
- **Tag Team Roll:** Einmal pro Sitzung kann eine Spielerin für **3 Hope**
  einen Tag Team Roll mit einer anderen PC starten. Beide würfeln getrennte
  Action Rolls, man wählt gemeinsam, welches Ergebnis zählt. Bei „mit Hope"
  erhalten **alle** beteiligten PCs Hope; bei „mit Fear" erhält die GM **pro
  beteiligter PC** ein Fear. Bei einem erfolgreichen Tag-Team-Angriff werden
  beide Schadenswürfe addiert.

**GM-Würfel:** Die Spielleitung hat **keine** Duality Dice, sondern würfelt
für Angriffe und Sonderwürfe von Gegnern einen einzelnen **d20**.

---

## 2. Hope und Fear als Ressourcen

Hope und Fear sind **Metawährungen**. Hope gehört den Spielerinnen, Fear
gehört der Spielleitung.

### Hope

- Startwert: **2 Hope** pro Charakter bei Charaktererschaffung.
- Obergrenze: **maximal 6 Hope** gleichzeitig.
- Hope bleibt zwischen Sitzungen erhalten (kein Reset).

**Wofür Hope ausgegeben wird:**

| Verwendung | Kosten | Effekt |
| --- | --- | --- |
| **Help an Ally** | – (kostenlos, aber nur einmal je Zug pro Helfer:in) | Advantage-d6 für den Wurf einer verbündeten Person; mehrere Helfer:innen möglich, aber nur der höchste Advantage-Wurf zählt |
| **Utilize an Experience** | 1 Hope je Experience | Addiert den Experience-Modifier zum Wurf; mehrere Hope für mehrere Experiences möglich |
| **Tag Team Roll initiieren** | 3 Hope | siehe Abschnitt 1 |
| **Hope Feature aktivieren** | meist 3 Hope (klassenspezifisch, siehe Abschnitt 8) | klassenspezifischer Effekt |

Wichtige Zusatzregel: Wenn man bei genau dem Wurf „mit Hope" erfolgreich war,
für den man ein Hope Feature einsetzen will, darf man das dabei gewonnene
Hope direkt dafür verwenden.

### Fear

- Startwert einer Kampagne: **1 Fear pro PC** in der Gruppe.
- Obergrenze: **maximal 12 Fear** gleichzeitig.
- Fear bleibt zwischen Sitzungen erhalten.

**Wie die GM an Fear kommt:**

- Ein PC würfelt „mit Fear" (Success with Fear oder Failure with Fear).
- Die Gruppe macht eine Rast (Short Rest: **1d4 Fear**; Long Rest: **1d4 +
  Anzahl der PCs** Fear).
- Eine Fähigkeit oder ein Effekt sagt es ausdrücklich.

**Wofür die GM Fear ausgibt:** siehe Abschnitt 17 (GM-Mechaniken).

---

## 3. Die sechs Attribute

Jeder Charakter hat sechs **Traits** (Attribute), die körperliche, geistige
und soziale Fähigkeiten abbilden:

| Attribut | Deckt ab (Beispielverben) | Beispielhafte Proben |
| --- | --- | --- |
| **Agility** (Beweglichkeit) | Sprint, Leap, Maneuver | Über ein Seil rennen, an einem Seil hochklettern, einer Gefahr ausweichen |
| **Strength** (Stärke) | Lift, Smash, Grapple | Eine Tür aufbrechen, etwas Schweres heben, jemanden festhalten |
| **Finesse** (Fingerfertigkeit) | Control, Hide, Tinker | Feinmechanik bedienen, sich unbemerkt bewegen, präzise zuschlagen |
| **Instinct** (Instinkt) | Perceive, Sense, Navigate | Gefahr wittern, Details bemerken, eine Fährte verfolgen |
| **Presence** (Ausstrahlung) | Charm, Perform, Deceive | Überreden, einschüchtern, die Aufmerksamkeit einer Menge gewinnen |
| **Knowledge** (Wissen) | Recall, Analyze, Comprehend | Fakten deuten, Muster erkennen, sich erinnern |

**Werteverteilung bei Charaktererschaffung:** Die sechs Modifikatoren
**+2, +1, +1, +0, +0, −1** werden in beliebiger Reihenfolge auf die sechs
Attribute verteilt. Damit deckt der Wertebereich bei Stufe 1 **−1 bis +2**
ab; höhere Werte (bis +3 und darüber) entstehen erst durch spätere
Stufenaufstiege (siehe Abschnitt 13, Advancement „zwei Attribute um +1
erhöhen").

Wenn man „mit einem Attribut würfelt", wird dessen Modifikator zur
Würfelsumme addiert.

---

## 4. Schaden, Stress, Hit Points, Damage Thresholds

### Damage Thresholds (Schadensschwellen)

Jeder Charakter hat zwei Schwellen: **Major** und **Severe**. Sie bestimmen,
wie viele Hit Points (HP) ein Treffer kostet:

| Eingehender Schaden (nach Abzügen) | Markierte HP |
| --- | --- |
| unter der Major-Schwelle | **1 HP** |
| ab der Major-Schwelle, aber unter der Severe-Schwelle | **2 HP** |
| ab der Severe-Schwelle | **3 HP** |
| Schaden auf 0 oder darunter reduziert | **0 HP** (kein Effekt) |

**Berechnung:** *„A PC's damage thresholds are calculated by adding their
level to the listed damage thresholds of their equipped armor."* Die
Basis-Schwellen der Rüstung (siehe Abschnitt 5) werden also um die **eigene
Stufe** erhöht.

**Ohne Rüstung:** Armor Score 0, Major-Schwelle = eigene Stufe, Severe-Schwelle
= doppelte eigene Stufe.

**Optionale Regel „Massive Damage":** Nimmt ein Charakter Schaden in Höhe des
**doppelten** Severe-Schwellenwerts oder mehr, markiert er **4 HP** statt 3.

**Kritischer Schaden:** Bei einem Critical Success auf einen Angriffswurf
wird der Schadenswurf normal ausgeführt, **plus der Maximalwert** aller
Schadenswürfel wird addiert. Beispiel: „2d8+1" würde bei einem kritischen
Erfolg zu „2d8+1+16" (die 16 ist 2×8, der Maximalwert beider d8).

**Schadensarten:** Es gibt **physical damage (phy)** und **magic damage
(mag)**. Waffen und unbewaffnete Angriffe sind standardmäßig physisch,
Zaubersprüche magisch, sofern nichts anderes angegeben ist.

- **Resistance:** halbiert eingehenden Schaden dieser Art, **bevor** er mit
  den Schwellen verglichen wird. Mehrere Resistenzen gegen dieselbe
  Schadensart stapeln sich **nicht**.
- **Immunity:** ignoriert eingehenden Schaden dieser Art komplett.
- **Direct Damage** kann **nicht** durch das Markieren von Armor Slots
  reduziert werden.
- Trifft ein Angriff mit gemischtem physisch/magischem Schaden, gilt
  Resistenz/Immunität nur, wenn beide Schadensarten betroffen sind.

### Hit Points (HP)

- HP bilden die körperliche Widerstandskraft ab.
- Startwert: klassenabhängig (siehe Klassentabelle, Abschnitt 8), z. B.
  Bard 5, Druid 6, Guardian 7.
- Wird das **letzte** HP markiert, „fällt" der Charakter und muss einen
  **Death Move** wählen (Abschnitt 16).
- HP können durch Downtime-Moves (Abschnitt 15) oder passende
  Fähigkeiten/Effekte geheilt werden.

### Stress

- Stress bildet mentale, emotionale und körperliche Belastung ab.
- Startwert: **6 Stress-Slots** für alle Klassen bei Charaktererschaffung
  (kann durch Stufenaufstieg erhöht werden).
- Manche Fähigkeiten verlangen, dass die aktivierende Person Stress markiert;
  die GM kann Stress als Konsequenz eines GM-Moves verlangen.
- Wird das **letzte** Stress-Kästchen markiert, erhält der Charakter die
  Bedingung **Vulnerable** (siehe unten), bis mindestens 1 Stress gelöscht wird.
- **Kann kein Stress mehr markiert werden** (alles bereits voll), wird
  stattdessen **1 HP** markiert. Eine Fähigkeit, die Stress verlangt, kann
  dann nicht genutzt werden, wenn der gesamte Stress-Vorrat bereits markiert ist.
- Stress wird durch Downtime-Moves gelöscht (Abschnitt 15).

**Vorbehalt:** Die SRD nennt für Stress und HP keine feste Obergrenze wie
„maximal 12" im Fließtext – die Anzahl wird von der Klasse festgelegt und
wächst durch Stufenaufstieg. Community-Quellen nennen „maximal 12" als
praktische Grenze durch die 12 vorgedruckten Kästchen auf dem offiziellen
Charakterblatt; das ist eine Beobachtung zum Charakterbogen, keine im
SRD-Text ausformulierte Hartregel. Mit Vorbehalt wiedergegeben.

---

## 5. Rüstung (Armor Score, Armor Slots)

- Jede Rüstung hat einen **Namen**, **Basis-Schadensschwellen** (Major/Severe)
  und einen **Basis-Armor-Score**, manche zusätzlich ein **Feature**.
- Der **Armor Score** einer Rüstung entspricht der Anzahl **Armor Slots**,
  die sie ihrer Trägerin verleiht (plus permanente Boni aus anderen Quellen).
  Der Armor Score eines Charakters kann **12 nicht überschreiten**.
- Ein Charakter kann jeweils nur **eine** Rüstung aktiv tragen (kein
  Rüstungs-Inventar); beim An-/Ablegen werden die Schadensschwellen neu berechnet.

**Schaden reduzieren:** Beim Erleiden von Schaden kann **ein** Armor Slot
markiert werden, um die Anzahl der zu markierenden HP **um 1** zu senken.
Ist der Armor Score 0, können keine Armor Slots markiert werden. Erhöht ein
Effekt den Armor Score vorübergehend, stehen entsprechend mehr Armor Slots
zur Verfügung, die mit dem Ende des Effekts wieder verschwinden.

**Tier-1-Rüstungstabelle (Startausrüstung):**

| Rüstung | Basisschwellen (Major/Severe) | Basis-Score | Feature |
| --- | --- | --- | --- |
| Gambeson Armor | 5 / 11 | 3 | Flexible: +1 auf Evasion |
| Leather Armor | 6 / 13 | 3 | – |
| Chainmail Armor | 7 / 15 | 4 | Heavy: −1 auf Evasion |
| Full Plate Armor | 8 / 17 | 4 | Very Heavy: −2 auf Evasion, −1 auf Agility |

Für Tier 2–4 existieren stärkere Rüstungen mit höheren Schwellen/Scores und
teils besonderen Features (z. B. *Warded*: reduziert eingehenden Magieschaden
um den Armor Score; *Resilient*: Chance, vor dem letzten Armor Slot die
Schadensschwere ohne Slot-Verbrauch zu senken; *Reinforced*: erhöht nach dem
letzten Armor Slot vorübergehend die Schadensschwellen). Die exakten
Zahlenwerte höherer Tiers liegen vor, sind aber wegen eines Layout-Problems
in der ausgewerteten PDF-Tabelle nicht zeilenrein den Rüstungsnamen
zuzuordnen – siehe „Offen geblieben".

Repariert wird Rüstung über Downtime-Moves (*Repair Armor* / *Repair All
Armor*, Abschnitt 15).

---

## 6. Evasion

**Evasion** bildet ab, wie gut ein Charakter Angriffen und anderen
unerwünschten Effekten ausweicht.

- **Jeder Wurf gegen einen PC** (z. B. ein Angriff) hat eine **Difficulty
  gleich der Evasion** des Ziels.
- Die **Basis-Evasion** wird durch die **Klasse** festgelegt (siehe
  Klassentabelle, Abschnitt 8) und kann durch Domänenkarten, Ausrüstung,
  Bedingungen und andere Effekte modifiziert werden.
- **Ausnahme:** Ein Angriff gegen einen **Gegner (Adversary)** verwendet
  dessen **Difficulty**-Wert aus dem Statblock, nicht „Evasion" (Gegner haben
  keine Evasion, sondern eine Difficulty).

---

## 7. Kampfablauf

### Keine feste Initiative – das Spotlight

Daggerheart kennt **keine explizite Initiative** und keine feste Anzahl an
Handlungen pro Charakter und Runde. Stattdessen gibt es das **Spotlight**
(die Aufmerksamkeit des Tisches). Es wechselt organisch dorthin, wo:

- **A.** es die Fiktion natürlich hinlenkt,
- **B.** jemand lange nicht dran war, oder
- **C.** ein mechanischer Auslöser es hinlenkt (z. B. ein misslungener Wurf
  gibt der GM automatisch das Spotlight).

**Optionale Variante – Spotlight Tracker:** Wer eine klassischere
Aktionsökonomie will, kann Marker verwenden: Jede Spielerin bekommt zu
Beginn einer Szene/Sitzung eine bestimmte Anzahl Marker (empfohlen: **3**)
und gibt bei jeder Handlung einen ab. Ohne Marker bekommt sie kein Spotlight
mehr, bis alle am Tisch ihre Marker verbraucht haben – dann füllen sich alle
wieder auf.

### Action Rolls, Reaction Rolls, Attack Rolls

- **Action Roll:** siehe Abschnitt 1 – jede riskante/ungewisse Handlung.
- **Reaction Roll:** Abwehr gegen Angriff/Gefahr, siehe Abschnitt 1.
- **Attack Roll:** ein Action Roll, der Schaden zufügen soll. Das
  verwendete Attribut ist durch Waffe/Zauber vorgegeben; unbewaffnete
  Angriffe nutzen **Strength oder Finesse** (Wahl der GM). Die Difficulty
  entspricht (sofern nicht anders angegeben) der **Difficulty/Evasion** des Ziels.

### GM-Moves und Gegneraktionen

Die GM sollte einen **GM-Move** erwägen, wenn eine Spielerin:

- mit Fear würfelt,
- einen Action Roll verpatzt,
- etwas mit unvermeidlichen Konsequenzen tut,
- der GM eine „goldene Gelegenheit" liefert, oder
- den Tisch fragt, was als Nächstes passiert.

Bekommt die GM das Spotlight, kann sie einen **Gegner spotlighten**. Ein
spotlighteter Gegner kann:

- sich innerhalb von **Close Range** bewegen und einen **Standardangriff**
  ausführen,
- sich innerhalb von Close Range bewegen und eine **Adversary Action** nutzen,
- eine Bedingung loswerden,
- innerhalb von **Far/Very Far Range sprinten** (als eigene Aktion),
- oder alles andere tun, was die Fiktion verlangt/die GM für passend hält.

Für **weitere** Gegner im selben GM-Zug muss zusätzliches **Fear** ausgegeben
werden (siehe Abschnitt 17).

### Proficiency und Schadenswürfel

- Bei Waffen entspricht die **Anzahl der Schadenswürfel** der eigenen
  **Proficiency**. Beispiel: Proficiency 2 mit einer „d8+2"-Waffe ergibt
  „2d8+2" Schaden.
- Die Proficiency **vervielfacht nur die Würfelanzahl**, nicht den festen
  Modifikator.
- **Unbewaffnete Angriffe:** `[Proficiency]d4` Schaden.
- Nutzt eine Fähigkeit ausdrücklich das **Spellcast-Attribut** für Schaden,
  wird eine Anzahl Würfel gleich dem **Spellcast-Wert** geworfen (ist der
  Spellcast-Wert 0 oder niedriger, wird nichts gewürfelt).
- Startwert der Proficiency bei Stufe 1: **1**. Erhöht sich über
  Stufenaufstieg (siehe Abschnitt 13).

### Reichweiten (Range)

| Reichweite | Ungefähre Distanz | Bewegung ins Nahfeld unter Gefahr |
| --- | --- | --- |
| **Melee** | wenige Fuß, Berührungsdistanz | – |
| **Very Close** | ca. 5–10 Fuß | kostenlos als Teil der Aktion nach Melee |
| **Close** | ca. 10–30 Fuß | kostenlos als Teil der Aktion nach Melee |
| **Far** | ca. 30–100 Fuß | erfordert einen erfolgreichen Agility Roll |
| **Very Far** | ca. 100–300 Fuß | erfordert einen erfolgreichen Agility Roll |
| **Out of Range** | jenseits von Very Far | i. d. R. nicht anvisierbar |

Auf einem 1-Zoll-Raster (optionale Regel): Melee = 1 Feld, Very Close =
3 Felder, Close = 6 Felder, Far = 12 Felder, Very Far = 13+ Felder.

### Bedingungen (Conditions)

Drei Standardbedingungen:

- **Hidden:** außer Sichtweite aller Gegner. Würfe gegen ein verstecktes
  Ziel haben Disadvantage. Endet, sobald man gesehen wird, ins Sichtfeld
  eines Gegners läuft oder angreift.
- **Restrained:** kann sich nicht bewegen, aber weiterhin Aktionen ausführen.
- **Vulnerable:** alle Würfe gegen dieses Ziel haben **Advantage**.

---

## 8. Die neun Klassen

Jede Klasse legt fest: Zugriff auf zwei **Domänen**, Start-Evasion, Start-HP,
Startgegenstände (Class Items) und ein **Hope Feature** (kostet i. d. R.
3 Hope). Jede Klasse hat **zwei Subklassen**; jede Subklasse legt ein
**Spellcast-Attribut** (falls vorhanden) sowie **Foundation-, Specialization-
und Mastery-Feature** fest.

| Klasse | Domänen | Start-Evasion | Start-HP | Hope Feature (3 Hope, sofern nicht anders angegeben) | Class Feature(s) |
| --- | --- | --- | --- | --- | --- |
| **Bard** | Grace & Codex | 10 | 5 | *Make a Scene*: Ziel in Close Range wird kurzzeitig Distracted (−2 auf Difficulty) | *Rally*: 1×/Sitzung Rally-Würfel (d6, ab Stufe 5 d8) für alle Verbündeten |
| **Druid** | Arcana & Sage | 10 | 6 | *Evolution*: ohne Stress-Kosten in Beastform wechseln, +1 auf ein Attribut in dieser Form | *Beastform* (Stress markieren, in Tier-passendes Tier verwandeln) & *Wildtouch* (harmlose Natureffekte nach Belieben) |
| **Guardian** | Valor & Blade | 9 | 7 | *Frontline Tank*: 2 Armor Slots löschen | *Unstoppable*: 1×/Long Rest Unstoppable-Würfel (d4, ab Stufe 5 d6) aktivieren, reduziert Schadensschwere um eine Stufe, addiert Würfelwert zum Schaden, macht immun gegen Restrained/Vulnerable |
| **Ranger** | Bone & Sage | 12 | 6 | *Hold Them Off*: erfolgreichen Waffenangriff auf 2 zusätzliche Gegner anwenden | *Ranger's Focus*: Hope ausgeben, Ziel markieren („Focus") mit Bonuseffekten gegen dieses Ziel |
| **Rogue** | Midnight & Grace | 12 | 6 | *Rogue's Dodge*: +2 auf Evasion bis zum nächsten erfolgreichen gegnerischen Treffer (oder bis zur nächsten Rast) | *Cloaked* (verbesserte Hidden-Variante) & *Sneak Attack* (zusätzliche d6 gleich der Tier-Stufe bei Angriffen aus dem Verborgenen oder mit Verbündeten in Melee Range) |
| **Seraph** | Splendor & Valor | 9 | 7 | *Life Support*: 1 HP bei einer verbündeten Person in Close Range löschen | *Prayer Dice*: zu Sitzungsbeginn d4-Pool (Anzahl = Spellcast-Attribut) zum Schaden abmildern, Wurf verbessern oder in Hope umwandeln |
| **Sorcerer** | Arcana & Midnight | 10 | 6 | *Volatile Magic*: beliebig viele Schadenswürfel eines Magieangriffs neu würfeln | *Arcane Sense*, *Minor Illusion*, *Channel Raw Power* (Domänenkarte gegen Hope oder Zauberbonus eintauschen) |
| **Warrior** | Blade & Bone | 11 | 6 | *No Mercy*: +1 auf Angriffswürfe bis zur nächsten Rast | *Attack of Opportunity* (Reaction Roll gegen fliehende Gegner in Melee Range) & *Combat Training* (Burden ignorieren, +Schaden gleich der eigenen Stufe) |
| **Wizard** | Codex & Splendor | 11 | 5 | *Not This Time*: Gegner in Far Range zwingt Angriffs-/Schadenswurf neu zu würfeln | *Prestidigitation* (kleine magische Effekte) & *Strange Patterns* (gewählte Zahl auf einem Duality-Würfel gibt Hope oder löscht Stress) |

**Class Items** (Beispiele, je Klasse eine Auswahl von zwei): Bard – Liebesroman
oder ungeöffneter Brief; Druid – Beutel mit Steinen/Knochen oder seltsamer
Anhänger; Guardian – Totem des Mentors oder geheimer Schlüssel; Ranger –
Trophäe des ersten Erlegten oder scheinbar zerbrochener Kompass; Rogue –
Fälscherwerkzeug oder Enterhaken; Seraph – Opfergaben-Bündel oder Siegel des
Gottes; Sorcerer – flüsternde Kugel oder Familienerbstück; Warrior – Zeichnung
einer Geliebten oder Schleifstein; Wizard – zu übersetzendes Buch oder
harmloses Elementarwesen als Haustier.

### Subklassen im Überblick

| Klasse | Subklasse A (Spellcast) | Kernidee A | Subklasse B (Spellcast) | Kernidee B |
| --- | --- | --- | --- | --- |
| Bard | Troubadour (Presence) | Lieder stärken Verbündete (Rally-Würfel verbessern) | Wordsmith (Presence) | Rhetorik, Ansprachen, Hope-Nutzung bei Überzeugung |
| Druid | Warden of the Elements (Instinct) | Elementar-Kanalisierung (Feuer/Erde/Wasser/Luft) | Warden of Renewal (Instinct) | Heilung, Regeneration für die Gruppe |
| Guardian | Stalwart (kein Spellcast) | Schadensschwellen erhöhen, Treffer für Verbündete abfangen | Vengeance (kein Spellcast) | Vergeltung an Angreifern, kritische Trefferchance über Hope-Würfel-Tausch |
| Ranger | Beastbound (kein Spellcast) | Tiergefährte (eigenes Companion-System, siehe unten) | Wayfinder (Agility) | reiner Jäger, Fokus auf tödliche Präzisionsangriffe |
| Rogue | Nightwalker (Finesse) | Schattensprung, Verschleierung des Umfelds | Syndicate (Finesse) | Kontaktnetzwerk, situative Vorteile durch NSC-Hilfe |
| Seraph | Divine Wielder (Strength) | fliegende, zurückkehrende Waffe | Winged Sentinel (Strength) | Flug, zusätzlicher Fallschaden, einschüchternde Erscheinung |
| Sorcerer | Elemental Origin (Instinct) | ein festes Element (Luft/Erde/Feuer/Blitz/Wasser) formen | Primal Origin (Instinct) | Zaubermodifikation (Reichweite, Bonus, Verdopplung, Zusatzziel) |
| Warrior | Call of the Brave (kein Spellcast) | aus Fear-Würfen Hope ziehen, Mut-Rituale | Call of the Slayer (kein Spellcast) | Slayer-Würfel-Pool aus Hope-Würfen, Waffenspezialisierung |
| Wizard | School of Knowledge (Knowledge) | zusätzliche Domänenkarten, effizientere Experience-Nutzung | School of War (Knowledge) | Kampfmagie, Bonusschaden bei „Success with Fear" |

**Ranger-Sonderfall – Companion (nur Beastbound):** Der Tiergefährte hat eine
eigene Evasion (Start **10**), zwei eigene Experiences (Start je **+2**),
einen Schadenswürfel (Start **d6**, Reichweite Melee) und **eigenen Stress**.
Nimmt der Gefährte Schaden, markiert er stattdessen Stress; ist sein Stress
voll, verschwindet er aus der Szene bis zur nächsten Long Rest (kehrt dann
mit 1 gelöschtem Stress zurück). Bei Stufenaufstieg wählt man einen
Verbesserungs-Vorteil (z. B. *Intelligent*, *Armored*, *Vicious*, *Resilient*,
*Bonded*, *Aware*, *Light in the Dark*, *Creature Comfort*).

---

## 9. Die neun Domänen

Der Grundregelsatz enthält **9 Domain Decks**. Jede Klasse hat Zugriff auf
genau **zwei** davon.

| Domäne | Thema | Zugängliche Klassen |
| --- | --- | --- |
| **Arcana** | instinktive/rohe Elementarmagie | Druid, Sorcerer |
| **Blade** | Waffenmeisterschaft | Guardian, Warrior |
| **Bone** | Taktik und Körperbeherrschung | Ranger, Warrior |
| **Codex** | gelehrte, aus Büchern/Schriften studierte Magie | Bard, Wizard |
| **Grace** | Charisma, Täuschung, Sprache | Bard, Rogue |
| **Midnight** | Schatten, Heimlichkeit, Illusionen | Rogue, Sorcerer |
| **Sage** | die natürliche Welt, Naturmagie | Druid, Ranger |
| **Splendor** | Leben, Heilung, Kontrolle über den Tod | Seraph, Wizard |
| **Valor** | Schutz, Verteidigung von Verbündeten | Guardian, Seraph |

---

## 10. Domänenkarten und Loadout

**Aufbau einer Domänenkarte** (sechs Elemente):

1. **Level** – man kann keine Karte über dem eigenen Charakterlevel wählen.
2. **Domäne** (Symbol) – nur Karten aus den zwei Domänen der eigenen Klasse.
3. **Recall Cost** – Anzahl Stress, um die Karte aus dem Vault ins Loadout zu
   tauschen (außerhalb einer Rast).
4. **Titel**.
5. **Typ** – *Ability* (meist nichtmagisch), *Spell* (magisch), oder
   *Grimoire* (nur in der Domäne Codex, Sammlung schwächerer Zaubersprüche).
6. **Feature-Text**.

**Loadout und Vault:**

- Das **Loadout** enthält die aktiven, benutzbaren Karten: maximal **5**
  gleichzeitig.
- Ab der sechsten erworbenen Karte müssen fünf fürs Loadout gewählt werden;
  der Rest liegt im **Vault** (inaktiv).
- Subklassen-, Ancestry- und Community-Karten zählen **nicht** zum Loadout/Vault
  und sind immer aktiv.
- **Zu Beginn einer Rast**, vor den Downtime-Moves, dürfen Karten **kostenlos**
  zwischen Loadout und Vault getauscht werden (Loadout-Maximum bleibt 5).
- **Außerhalb** einer Rast: Um eine Karte vom Vault ins Loadout zu holen, muss
  Stress in Höhe des **Recall Cost** der Karte markiert werden. Ist das
  Loadout voll, muss zusätzlich (kostenlos) eine andere Karte ins Vault
  wandern.
- Bei einem neuen Domänenkarten-Erwerb durch Stufenaufstieg darf sie
  **kostenlos** direkt ins Loadout.

**Erwerb:** Bei Charaktererschaffung werden **zwei Stufe-1-Domänenkarten**
gewählt (eine aus jeder Domäne oder zwei aus derselben). Bei jedem
Stufenaufstieg kommt eine weitere Karte auf oder unter dem eigenen Level
dazu (Abschnitt 13).

---

## 11. Abstammungen (Ancestries) und Gemeinschaften (Communities)

### Ancestries – 18 Stück, je zwei Features

Jede Ancestry gewährt **zwei** feste Features. Für eine **Mixed Ancestry**
(gemischte Abstammung) nimmt man das **erste** Feature einer Ancestry und
das **zweite** Feature einer anderen.

| Ancestry | Feature 1 | Feature 2 |
| --- | --- | --- |
| **Clank** (mechanisches Wesen) | *Purposeful Design*: bei Charaktererschaffung eine Experience wählen, die zum eigenen Erschaffungszweck passt, permanent +1 darauf | *Efficient*: bei einer Short Rest darf stattdessen ein Long-Rest-Move gewählt werden |
| **Drakona** (drachenähnlich) | *Scales*: bei Severe Damage 1 Stress markieren, um 1 HP weniger zu markieren | *Elemental Breath*: gewähltes Element (z. B. elektrisch/Feuer/Eis) als Instinct-Waffe, d8 magischer Schaden mit Proficiency, Reichweite Very Close |
| **Dwarf** | *Thick Skin*: bei Minor Damage 2 Stress statt 1 HP markieren | *Increased Fortitude*: 3 Hope ausgeben, um physischen Schaden zu halbieren |
| **Elf** | *Quick Reactions*: 1 Stress markieren für Advantage auf einen Reaction Roll | *Celestial Trance*: während einer Rast einen zusätzlichen Downtime-Move wählen |
| **Faerie** | *Luckbender*: 1×/Sitzung, 3 Hope, Duality Dice einer verbündeten Person (oder der eigenen) neu würfeln | *Wings*: fliegen; 1 Stress markieren für +2 Evasion gegen einen Angriff |
| **Faun** | *Caprine Leap*: innerhalb Close Range springen wie normale Bewegung | *Kick*: 1 Stress markieren, +2d6 Schaden und Rückstoß ins Very Close Range |
| **Firbolg** | *Charge*: erfolgreicher Agility Roll von Far/Very Far in Melee Range → 1 Stress markieren für 1d12 physischen Schaden an allen Zielen in Melee Range | *Unshakable*: beim Stress-Markieren d6 würfeln, bei 6 kein Stress markieren |
| **Fungril** (Pilzwesen) | *Fungril Network*: Instinct Roll (12), um über beliebige Distanz mit Artgenossen zu kommunizieren | *Death Connection*: 1 Stress markieren, um an einer frischen Leiche eine Erinnerung zu extrahieren |
| **Galapa** (Schildkrötenwesen) | *Shell*: Bonus auf Schadensschwellen gleich der Proficiency | *Retract*: 1 Stress markieren, um sich in den Panzer zurückzuziehen (Resistenz gegen physischen Schaden, Disadvantage auf Action Rolls, keine Bewegung) |
| **Giant** | *Endurance*: zusätzlicher HP-Slot bei Charaktererschaffung | *Reach*: Waffen/Fähigkeiten mit Melee-Reichweite gelten als Very-Close-Reichweite |
| **Goblin** | *Surefooted*: ignoriert Disadvantage auf Agility Rolls | *Danger Sense*: 1×/Rast, 1 Stress markieren, um einen gegnerischen Angriff auf sich/eine Verbündete in Very Close Range neu würfeln zu lassen |
| **Halfling** | *Luckbringer*: zu Sitzungsbeginn erhält die ganze Gruppe je 1 Hope | *Internal Compass*: bei einer 1 auf dem Hope-Würfel darf neu gewürfelt werden |
| **Human** | *High Stamina*: zusätzlicher Stress-Slot bei Charaktererschaffung | *Adaptability*: nach einem misslungenen Wurf mit Experience-Nutzung 1 Stress markieren, um neu zu würfeln |
| **Infernis** (dämonische Abstammung) | *Fearless*: bei „mit Fear" gewürfelt, 2 Stress markieren, um es in „mit Hope" zu verwandeln | *Dread Visage*: Advantage auf Einschüchterungswürfe gegen feindselige Wesen |
| **Katari** (katzenartig) | *Feline Instincts*: 2 Hope ausgeben, um den Hope-Würfel eines Agility Rolls neu zu würfeln | *Retracting Claws*: Agility Roll gegen ein Ziel in Melee Range, bei Erfolg wird das Ziel kurzzeitig Vulnerable |
| **Orc** | *Sturdy*: bei genau 1 verbleibendem HP haben Angriffe gegen einen Disadvantage | *Tusks*: 1 Hope ausgeben für +1d6 Schaden bei erfolgreichem Nahkampfangriff |
| **Ribbet** (froschartig) | *Amphibious*: kann unter Wasser atmen und sich normal bewegen | *Long Tongue*: 1 Stress markieren, um die Zunge als Finesse-Waffe (Close, d12 physisch, mit Proficiency) zu nutzen |
| **Simiah** (affenartig) | *Natural Climber*: Advantage auf Agility Rolls beim Klettern/Balancieren | *Nimble*: permanent +1 auf Evasion bei Charaktererschaffung |

### Communities – 9 Stück, je ein Feature

| Community | Persönlichkeits-Adjektive (Beispiele) | Feature |
| --- | --- | --- |
| **Highborne** (Oberschicht, Reichtum, Einfluss) | amiable, candid, conniving, enterprising, ostentatious, unflappable | *Privilege*: Advantage beim Umgang mit Adligen, Preisverhandlungen oder Nutzung des eigenen Rufs |
| **Loreborne** (Gelehrte, Politik, Wissen) | direct, eloquent, inquisitive, patient, rhapsodic, witty | *Well-Read*: Advantage bei Würfen über Geschichte, Kultur oder Politik einer bekannten Person/eines Ortes |
| **Orderborne** (Disziplin, Glaube, Gemeinschaft) | ambitious, benevolent, pensive, prudent, sardonic, stoic | *Dedicated*: drei eigene Leitsätze notieren; 1×/Rast beim Verkörpern eines davon d20 als Hope-Würfel |
| **Ridgeborne** (Bergbewohner) | bold, hardy, indomitable, loyal, reserved, stubborn | *Steady*: Advantage beim Überqueren gefährlicher Klippen/Gelände und bei Überlebenswissen |
| **Seaborne** (See-/Küstenvolk) | candid, cooperative, exuberant, fierce, resolute, weathered | *Know the Tide*: bei „mit Fear" gewürfelt einen Marker sammeln (max. = eigene Stufe), vor einem Wurf beliebig viele für je +1 einsetzen |
| **Slyborne** (Gesetzlose, Gauner) | calculating, clever, formidable, perceptive, shrewd, tenacious | *Scoundrel*: Advantage beim Verhandeln mit Kriminellen, Lügen erkennen, sichere Verstecke finden |
| **Underborne** (unterirdische Gesellschaft) | composed, elusive, indomitable, innovative, resourceful, unpretentious | *Low-Light Living*: Advantage bei wenig Licht/starkem Schatten beim Verstecken, Untersuchen, Wahrnehmen |
| **Wanderborne** (Nomaden) | inscrutable, magnanimous, mirthful, reliable, savvy, unorthodox | *Nomadic Pack*: 1×/Sitzung, 1 Hope, einen passenden mundanen Gegenstand aus dem „Nomadic Pack" ziehen |
| **Wildborne** (Waldvolk) | hardy, loyal, nurturing, reclusive, sagacious, vibrant | *Lightfoot*: natürlich lautlose Bewegung, Advantage beim unbemerkten Bewegen |

---

## 12. Experiences

- Eine **Experience** ist ein kurzes Wort/eine Phrase, die eine spezifische
  Fähigkeit, Eigenschaft oder Neigung des Charakters zusammenfasst (z. B.
  „Scharfschütze", „Fährtenleser").
- **Start:** **2 Experiences** bei Charaktererschaffung, jede mit **+2**.
- **Anwendung:** 1 Hope ausgeben, um den Modifikator einer passenden
  Experience zu einem Wurf zu addieren. Mehrere Hope für mehrere Experiences
  auf denselben Wurf sind möglich.
- **Grenzen:** Eine Experience darf **nicht zu allgemein** sein (z. B. „Lucky"
  oder „Highly Skilled" sind untauglich, weil praktisch immer anwendbar) und
  darf **keine eigenständigen mechanischen Fähigkeiten** verleihen (z. B.
  „Supersonic Flight" oder „Invulnerable" wären zu mächtig).
- **Wachstum:** Bei Stufenaufstieg (Tier-Erfolge bei Stufe 2/5/8) kommt je
  eine weitere Experience mit +2 hinzu; über Advancements kann eine
  bestehende Experience permanent um +1 gesteigert werden.

---

## 13. Stufenaufstieg (Leveling)

- Die Gruppe steigt gemeinsam auf, wenn die GM einen narrativen Meilenstein
  erreicht sieht (Richtwert: **etwa alle 3 Sitzungen**). Alle Mitglieder
  steigen **gleichzeitig** auf.
- **10 Stufen in 4 Tiers:**

| Tier | Stufen |
| --- | --- |
| Tier 1 | Stufe 1 |
| Tier 2 | Stufen 2–4 |
| Tier 3 | Stufen 5–7 |
| Tier 4 | Stufen 8–10 |

Der eigene Tier beeinflusst Schadensschwellen, Tier-Erfolge und den Zugriff
auf Advancements.

**Ablauf beim Stufenaufstieg (vier Schritte):**

1. **Tier Achievements** (nur bei Erreichen der Stufen 2, 5 und 8): neue
   Experience mit +2, permanente **Proficiency +1**; bei Stufe 5 und 8
   zusätzlich alle markierten Traits löschen.
2. **Zwei Advancements wählen** (siehe Liste unten) aus dem eigenen Tier
   oder darunter, mit noch unmarkiertem Slot. Optionen mit mehreren Slots
   können mehrfach gewählt werden.
3. **Damage Thresholds:** beide Schwellen um **+1** erhöhen.
4. **Domänenkarte:** eine neue Karte auf oder unter dem eigenen Level aus den
   Klassendomänen erwerben (ins Loadout oder Vault); alternativ eine bereits
   besessene Karte gegen eine andere derselben oder niedrigerer Stufe tauschen.

**Verfügbare Advancement-Optionen** (jede kostet einen der zwei
Advancement-„Slots", einige verlangen beide auf einmal):

- Zwei unmarkierte Attribute permanent um **+1** erhöhen und markieren (bis
  zum nächsten Tier gesperrt).
- Einen zusätzlichen **HP-Slot** hinzufügen.
- Einen zusätzlichen **Stress-Slot** hinzufügen.
- Eine bestehende **Experience** permanent um **+1** erhöhen.
- Eine **zusätzliche Domänenkarte** auf/unter dem eigenen Level erwerben
  (bei Multiklassen: auf/unter der halben eigenen Stufe, aufgerundet, aus der
  Multiklassen-Domäne).
- **Evasion** permanent um **+1** erhöhen.
- Eine **verbesserte Subklassen-Karte** nehmen (Foundation → Specialization
  → Mastery).
- **Proficiency** um 1 erhöhen (verbraucht **beide** Advancement-Slots
  gleichzeitig) – erhöht auch die Anzahl der Waffenschadenswürfel.
- **Multiklassen** wählen (verbraucht **beide** Advancement-Slots
  gleichzeitig, siehe unten).

### Multiclassing

- Ab **Stufe 5** als Advancement wählbar.
- Man wählt eine **zusätzliche Klasse**, erhält Zugriff auf **eine** ihrer
  beiden Domänen sowie ihr Class Feature, und nimmt eine **Foundation-Karte**
  einer ihrer Subklassen.
- Neue Domänenkarten aus der gewählten Multiklassen-Domäne dürfen künftig nur
  auf/unter der **halben eigenen Stufe** (aufgerundet) liegen.

---

## 14. Ausrüstung und Waffen

### Grundregeln

- Nur **ausgerüstete** (equipped) Waffen/Rüstungen wirken; man kann nicht mit
  Waffen im Inventar angreifen.
- Man kann keine Ausrüstung mit **höherem Tier** als die eigene Stufe tragen.
- Bis zu **zwei zusätzliche Waffen** dürfen im Inventar mitgeführt werden.
  Ein Wechsel zwischen Inventar- und aktiver Waffe **gleicher Burden** ist
  während einer Rast/ruhigen Momenten kostenlos, sonst kostet er 1 Stress.
- Rüstung kann nur außerhalb von Gefahr an-/abgelegt werden (dann kostenlos).

### Waffenkategorien

- **Category:** **Primary** oder **Secondary** – jeweils nur eine gleichzeitig
  ausgerüstet.
- **Trait:** welches Attribut für den Angriffswurf verwendet wird.
- **Range:** maximale Angriffsreichweite (siehe Reichweitentabelle in
  Abschnitt 7); näher ist immer erlaubt.
- **Damage:** Würfelgröße (Proficiency bestimmt die Anzahl der Würfel) plus
  ggf. fester Modifikator.
- **Damage Type:** physisch oder magisch. Magische Waffen erfordern ein
  **Spellcast-Attribut**.
- **Burden:** wie viele Hände die Waffe belegt – **One-Handed** oder
  **Two-Handed**. Die maximale Burden eines Charakters beträgt **2 Hände**.
- **Feature:** eine besondere Regel, die gilt, solange die Waffe ausgerüstet ist.
- Eine ausgerüstete Waffe kann auf ein Ziel in **Very Close Range** geworfen
  werden (Angriffswurf mit **Finesse**); danach gilt sie bis zum Aufheben als
  nicht mehr ausgerüstet.

### Primärwaffen, Tier 1 (Charaktererschaffung), physisch

| Name | Attribut | Reichweite | Schaden | Burden | Feature |
| --- | --- | --- | --- | --- | --- |
| Broadsword | Agility | Melee | d8 phy | Einhändig | – |
| Longsword | Agility | Melee | d8+3 phy | Zweihändig | Reliable: +1 auf Angriffswürfe |
| Battleaxe | Strength | Melee | d10+3 phy | Zweihändig | – |
| Greatsword | Strength | Melee | d10+3 phy | Zweihändig | – |
| Mace | Strength | Melee | d8+1 phy | Einhändig | Massive: −1 Evasion; zusätzlicher Schadenswürfel, niedrigster wird verworfen |
| Warhammer | Strength | Melee | d12+3 phy | Zweihändig | – |
| Dagger | Finesse | Melee | d8+1 phy | Einhändig | Heavy: −1 Evasion |
| Quarterstaff | Instinct | Melee | d10+3 phy | Zweihändig | – |
| Cutlass | Presence | Melee | d8+1 phy | Einhändig | – |
| Rapier | Presence | Melee | d8 phy | Einhändig | – |
| Halberd | Strength | Very Close | d10+2 phy | Zweihändig | Quick: 1 Stress markieren, um ein weiteres Ziel in Reichweite anzugreifen |
| Spear | Finesse | Very Close | d10+2 phy | Zweihändig | Cumbersome: −1 Finesse |
| Shortbow | Agility | Far | d6+3 phy | Zweihändig | Cumbersome: −1 Finesse |
| Crossbow | Finesse | Far | d6+1 phy | Einhändig | – |
| Longbow | Agility | Very Far | d8+3 phy | Zweihändig | Cumbersome: −1 Finesse |

### Primärwaffen, Tier 1, magisch (erfordern Spellcast-Attribut)

| Name | Attribut | Reichweite | Schaden | Burden | Feature |
| --- | --- | --- | --- | --- | --- |
| Arcane Gauntlets | Strength | Melee | d10+3 mag / d8+1 mag | Zwei-/Einhändig | – |
| Hallowed Axe | Agility | Very Close | d10+1 mag | Zweihändig | – |
| Glowing Rings | Instinct | Very Close | d10 mag | Einhändig | – |
| Hand Runes | Finesse | Close | d8 mag | Einhändig | – |
| Returning Blade | – | – | – | Ein-/Zweihändig | Returning: kehrt nach dem Wurf sofort in die Hand zurück |
| Shortstaff | Instinct | Close | d8+1 mag | Zweihändig | – |
| Dualstaff | Instinct | Far | d6+3 mag | – | – |
| Scepter | Presence | Far | d6 mag | Ein-/Zweihändig | Versatile: alternativ Presence/Melee/d8 nutzbar |
| Wand | Knowledge | Far | d6+1 mag | – | – |
| Greatstaff | Knowledge | Very Far | d6 mag | – | Powerful: zusätzlicher Schadenswürfel, niedrigster wird verworfen |

### Rüstung

Siehe Abschnitt 5 für die Tier-1-Rüstungstabelle.

**Vorbehalt zu Tier 2–4 (Waffen und Rüstung):** Für höhere Tiers existieren in
der SRD vollständige Tabellen mit steigenden Schadenswerten (z. B.
„Improved Broadsword", „Advanced …", „Legendary …") und zusätzlichen
Waffenfeatures (u. a. *Brutal*, *Deadly*, *Scary*, *Reloading*, *Paired*,
*Sheltering*, *Doubled Up*, *Locked On*). Die konkreten Zahlenwerte liegen im
Ausgangsdokument vor, aber die zweispaltige PDF-Tabelle ließ sich beim
Textextrahieren nicht zuverlässig zeilenrein den einzelnen Waffennamen
zuordnen (Name und Zahlenwerte liefen in getrennten Spalten auseinander).
Um keine falschen Zahlen zu erfinden, werden sie hier **nicht** als Tabelle
wiedergegeben – siehe „Offen geblieben".

### Sekundärwaffen (Auswahl, Tier 1)

Sekundärwaffen ergänzen eine Primärwaffe oder ersetzen deren zweite Hand.
Bekannte Tier-1-Sekundärwaffen: **Round Shield** (Strength, Melee, Feature
*Protective*: +1 Armor Score), **Tower Shield** (Strength, Melee), **Small
Dagger** (Finesse, Melee, Feature *Barrier*: +2 Armor Score, aber −1
Evasion), **Whip** (Presence, Very Close), **Grappler** (Finesse, Close,
Feature *Startling*: 1 Stress markieren, um alle Gegner in Melee Range nach
Close Range zurückzudrängen), **Hand Crossbow** (Finesse, Far, Feature
*Hooked*: zieht das Ziel bei Erfolg in Melee Range). Wiederkehrende
Sekundärwaffen-Features: *Protective* (+Armor Score), *Barrier* (+Armor
Score, −Evasion), *Paired* (+Schaden zur Primärwaffe in Melee Range).

**Vorbehalt:** Die genauen Schadenswerte/Attribute jeder einzelnen
Sekundärwaffe (welches Attribut/welcher Würfel zu welchem Namen gehört)
ließen sich aus derselben zweispaltigen Tabellenstruktur nicht zweifelsfrei
rekonstruieren – nur die Feature-Texte und Waffennamen sind sicher belegt.

---

## 15. Downtime, Rests

Zwischen Konflikten kann die Gruppe rasten. Jede PC darf während einer Rast
**bis zu zwei Downtime-Moves** wählen (auch denselben Move zweimal). Die
Gruppe muss sich zwischen **Short Rest** und **Long Rest** entscheiden.

**Regel zur Aneinanderreihung:** Nach **drei Short Rests in Folge** muss die
nächste Rast eine **Long Rest** sein.

Wird eine Short Rest unterbrochen (z. B. durch einen Angriff), erhält die
Gruppe **keine** der Vorteile. Wird eine Long Rest unterbrochen, erhält sie
nur die Vorteile einer Short Rest.

### Short Rest (ca. 1 Stunde in der Spielwelt)

Domänenkarten dürfen kostenlos zwischen Loadout/Vault getauscht werden, dann
zweimal aus dieser Liste wählen:

- **Tend to Wounds:** `1d4 + Tier` HP löschen (bei sich oder einer
  verbündeten Person).
- **Clear Stress:** `1d4 + Tier` Stress löschen.
- **Repair Armor:** `1d4 + Tier` Armor Slots löschen (bei sich oder einer
  verbündeten Person).
- **Prepare:** 1 Hope gewinnen (beschreiben, wie man sich vorbereitet); wenn
  gemeinsam mit anderen Gruppenmitgliedern vorbereitet wird, erhält **jede**
  beteiligte Person 2 Hope.

Am Ende einer Short Rest laufen limitierte Fähigkeiten „pro Rast" ab.

### Long Rest (mehrere Stunden, Lager/Schlaf)

Domänenkarten dürfen kostenlos getauscht werden, dann zweimal wählen:

- **Tend to All Wounds:** alle HP löschen (bei sich oder einer verbündeten Person).
- **Clear All Stress:** allen Stress löschen.
- **Repair All Armor:** alle Armor Slots löschen (bei sich oder einer
  verbündeten Person).
- **Prepare:** wie oben (1 bzw. 2 Hope).
- **Work on a Project:** mit Zustimmung der GM ein Langzeitprojekt verfolgen
  (erhält beim ersten Mal einen Countdown, der entweder automatisch oder per
  Action Roll voranschreitet).

Am Ende einer Long Rest laufen sowohl „pro Rast" als auch „pro Long Rest"
limitierte Effekte ab.

### Downtime Consequences (Kosten für die GM)

- Nach einer Short Rest erhält die GM **1d4 Fear**.
- Nach einer Long Rest erhält die GM **`1d4 + Anzahl der PCs` Fear** und darf
  einen Langzeit-Countdown ihrer Wahl vorantreiben.

---

## 16. Death Moves

Markiert eine PC ihr **letztes HP**, muss sie einen von drei **Death Moves**
wählen:

| Move | Effekt |
| --- | --- |
| **Blaze of Glory** | Der Charakter nimmt den Tod an und geht in einem letzten Moment des Ruhms unter. Eine letzte Aktion wird ausgeführt, die **automatisch kritisch gelingt** (mit Zustimmung der GM). Danach stirbt der Charakter endgültig. |
| **Avoid Death** | Der Charakter weicht dem Tod aus und trägt die Konsequenzen. Er fällt kurzzeitig **bewusstlos** (kann sich nicht bewegen/handeln, kann nicht angegriffen werden), bis eine verbündete Person mindestens 1 HP löscht **oder** die Gruppe eine Long Rest beendet. Danach wird der **Hope-Würfel** geworfen: ist sein Wert **kleiner oder gleich der eigenen Stufe**, entsteht eine **Scar** (Narbe) – ein Hope-Slot wird dauerhaft gestrichen, mit narrativer Bedeutung. Wird der **letzte** Hope-Slot gestrichen, **endet die Geschichte des Charakters**. |
| **Risk It All** | Die Duality Dice werden geworfen. Ist der **Hope-Würfel höher**, bleibt der Charakter auf den Beinen und löscht HP und/oder Stress in Höhe des Hope-Würfel-Werts (frei aufteilbar). Ist der **Fear-Würfel höher**, stirbt der Charakter endgültig. Bei **Gleichstand** bleibt der Charakter stehen und löscht **alle** HP und Stress. |

Stirbt ein Charakter endgültig, wird vor der nächsten Sitzung gemeinsam mit
der GM ein neuer Charakter auf der aktuellen Stufe der übrigen Gruppe erstellt.

---

## 17. Gold, Countdowns, Fear-Ausgaben des Spielleiters, Adversaries und Environments

### Gold

Gold ist eine abstrakte Wohlstandsmessung in drei Stufen: **Handfuls**
(Handvoll), **Bags** (Beutel), **Chests** (Truhen).

- **10 Handfuls = 1 Bag.**
- **10 Bags = 1 Chest.**
- Sind alle Kästchen einer Kategorie voll und man erhält weiteres Gold dieser
  Kategorie, wird ein Kästchen der nächsthöheren Kategorie markiert und die
  aktuelle Kategorie geleert.
- Es kann **nicht mehr als 1 Chest** gehalten werden.
- **Optionale Regel „Gold Coins":** 10 Coins (Münzen) = 1 Handful, als noch
  feinere Untereinheit.

**Beispielpreise:**

| Gegenstand/Dienstleistung | Preis |
| --- | --- |
| Mahlzeiten für eine Abenteurergruppe, eine Nacht | 1 Handful |
| Standard-Gasthauszimmer, eine Nacht | 1 Handful |
| Luxus-Gasthauszimmer, eine Nacht | 1 Bag |
| Kutschfahrt | 2 Handfuls |
| Reittier (Pferd, Maultier etc.) | 3 Bags |
| Spezialwerkzeug | 3 Handfuls |
| Feine Kleidung | 3 Handfuls |
| Luxuskleidung | 1 Bag |
| Tier-1-Ausrüstung (Waffen/Rüstung) | 1–5 Handfuls |
| Tier-2-Ausrüstung | 1–2 Bags |
| Tier-3-Ausrüstung | 5–10 Bags |
| Tier-4-Ausrüstung | 1–2 Chests |

### Countdowns

Ein Countdown beginnt bei einem Startwert und zählt bei jedem „Voranschreiten"
um 1 herunter; erreicht er 0, löst sein Effekt aus.

- **Standard Countdown:** schreitet bei **jedem** Action Roll der Spielenden voran.
- **Dynamic Countdown:** schreitet je nach Wurfergebnis **0 bis 3** Schritte
  voran (siehe Tabelle). Unterarten: **Consequence Countdown** (zu einem
  negativen Effekt) und **Progress Countdown** (zu einem positiven Effekt).

| Wurfergebnis | Progress-Fortschritt | Consequence-Fortschritt |
| --- | --- | --- |
| Failure with Fear | kein Fortschritt | −3 |
| Failure with Hope | kein Fortschritt | −2 |
| Success with Fear | −1 | −1 |
| Success with Hope | −2 | kein Fortschritt |
| Critical Success | −3 | kein Fortschritt |

Weitere Varianten: **Loop Countdowns** (setzen sich nach Auslösen auf den
Startwert zurück), **Increasing/Decreasing Countdowns** (Startwert wächst/sinkt
bei jeder Wiederholung um 1), **verknüpfte** Progress-/Consequence-Countdowns,
**Long-Term Countdowns** (schreiten nach Rasten statt nach Action Rolls voran).

### Fear-Ausgaben des Spielleiters

Die GM startet mit **1 Fear pro PC**, sammelt Fear wie in Abschnitt 2
beschrieben und kann bis **12 Fear** halten. Sie kann Fear ausgeben, um:

- die Spielenden zu unterbrechen und einen GM-Move zu erzwingen,
- einen **zusätzlichen** GM-Move zu machen,
- ein **Fear Feature** eines Gegners oder einer Umgebung zu aktivieren,
- eine passende **Experience** eines Gegners zu einem Wurf hinzuzufügen,
- **zusätzliche Gegner** im selben Zug zu spotlighten.

**Grobe Richtwerte** für Fear-Ausgaben je nach Spannungsgrad der Szene (aus
der SRD-Tabelle, Fear-Spanne pro Szenentyp):

| Szenentyp (Beispiele) | Fear-Spanne |
| --- | --- |
| Beiläufiges Gespräch zwischen PCs | 0–1 |
| Emotional aufgeladene Szene, Informationsbeschaffung, Einkauf, Rast | 1–3 |
| Reisesequenz, kleines Scharmützel mit neuen Gegnern | 2–4 |
| Größerer Kampf mit klarem Ziel, gefährliche Reise, angespannte Verhandlung | 4–8 |
| Großer Kampf gegen einen Solo-/Leader-Gegner, charakterprägende Szene | 6–12 |
| Finalkampf gegen den Hauptantagonisten, großes Setpiece | (oberes Ende der Spanne / Maximum) |

**Soft und Hard Moves:** bei Würfen „mit Hope" eher **sanfte** GM-Moves
(neue Informationen, Reaktionsmöglichkeit), bei Würfen „mit Fear" eher
**harte** Moves (direkter, ohne Gegenwehr-Chance).

### Adversaries (Gegner) in Grundzügen

Ein Gegner-Statblock enthält: **Name, Tier, Type, Beschreibung,
Motive/Taktiken, Difficulty, Damage Thresholds/HP/Stress, Attack Modifier,
Standard Attack, optionale Experience, Features (Actions/Reactions/
Passives), Fear Features.**

**Gegnertypen:**

| Typ | Rolle |
| --- | --- |
| Bruiser | zäh, starke Angriffe |
| Horde | Gruppe identischer Kreaturen als eine Einheit |
| Leader | befehligt/beschwört andere Gegner |
| Minion | leicht besiegt, gefährlich in großer Zahl |
| Ranged | fragil im Nahkampf, starker Fernschaden |
| Skulk | Hinterhalt, Ausnutzen von Gelegenheiten |
| Social | Herausforderung über Gespräch statt Kampf |
| Solo | fordert die ganze Gruppe allein |
| Standard | typischer Vertreter seiner Fraktion |
| Support | verstärkt Verbündete, stört Gegner |

**Angriff eines Gegners:** GM würfelt **d20 + Attack Modifier** gegen die
**Evasion** des Ziels. Bei einer natürlichen 20 gelingt der Angriff
automatisch und der **höchste** mögliche Schadenswürfel-Wert wird zusätzlich
addiert (kritischer Erfolg für Gegner).

**Encounter-Balancing (Battle Points):** Ausgangswert
`(3 × Anzahl der PCs im Kampf) + 2`, mit Anpassungen wie −1 für einen
leichteren/kürzeren Kampf, −2 bei zwei oder mehr Solo-Gegnern, +1 bei einem
Gegner aus niedrigerem Tier, +2 für einen härteren/längeren Kampf usw. Kosten
zum Hinzufügen von Gegnern: 1 Punkt je Minion-Gruppe (Gruppengröße =
Parteigröße), 1 Punkt je Social/Support, 2 Punkte je Horde/Ranged/Skulk/
Standard, 3 Punkte je Leader, 5 Punkte je Solo.

### Environments (Umgebungen) in Grundzügen

Ein Environment-Statblock enthält: **Name, Tier, Type, Beschreibung,
Impulses, Difficulty, potenzielle Gegner, Features, Feature Questions.**

**Vier Szenentypen:** *Explorations* (zu entdeckende Orte), *Socials*
(zwischenmenschliche Herausforderungen), *Traversals* (Fortbewegung selbst
ist die Herausforderung), *Events* (besondere Ereignisse statt physischer Orte).

**Richtwerte nach Tier:**

| | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
| --- | --- | --- | --- | --- |
| Schadenswürfel | 1d6+1 bis 1d8+3 | 2d6+3 bis 2d10+2 | 3d8+3 bis 3d10+1 | 4d8+3 bis 4d10+10 |
| Difficulty | 11 | 14 | 17 | 20 |

---

## Woher diese Angaben stammen

**Primärquelle (für fast alle Zahlen und Zitate in diesem Dokument):**

- **Daggerheart System Reference Document 1.0** (Mai 2025), Darrington Press /
  Critical Role LLC, PDF:
  <https://www.daggerheart.com/wp-content/uploads/2025/05/DH-SRD-May202025.pdf>
  Direkt heruntergeladen und mit `pdftotext -layout` als Text ausgewertet, um
  wörtliche Regeltexte zu zitieren statt sie aus dem Gedächtnis zu
  rekonstruieren. Daraus stammen: Kernwurf-Mechanik, Hope/Fear-Regeln,
  Attribute, Schaden/Stress/HP/Thresholds, Rüstung (Tier 1), Evasion,
  Kampfablauf, alle neun Klassen samt Subklassen, alle neun Domänen,
  Domänenkarten/Loadout, alle 18 Ancestries und 9 Communities, Experiences,
  Stufenaufstieg/Multiclassing, Tier-1-Waffentabellen, Downtime/Rests, Death
  Moves, Gold, Countdowns, GM-Fear-Ökonomie, Adversary- und
  Environment-Grundlagen.

**Ergänzende Quellen (für Einordnung und Gegenprüfung, nicht für
Zahlenwerte):**

- Offizielle SRD-Landingpage: <https://www.daggerheart.com/srd/> – bestätigt,
  dass inzwischen eine **SRD 2.0** existiert (siehe „Offen geblieben").
- Fan-Referenzseite mit derselben SRD-1.0-Struktur (9 Klassen, 18 Ancestries,
  9 Communities, 9 Domänen): <https://daggerheartsrd.com/rules/> – diente zur
  Bestätigung der Sitemap/Vollständigkeit, nicht als Zahlenquelle (eigene
  Kurzfassungen dort waren stellenweise unvollständig).
- Websuche zur Einordnung der Duality-Dice-Grundmechanik (Bestätigung, keine
  Widersprüche zur Primärquelle gefunden): thegamer.com, daggerheart.fandom.com
  (Suchergebnis-Snippet), enworld.org.

## Offen geblieben

1. **SRD 2.0 (Stand August 2026) existiert bereits** und erweitert das
   Klassenangebot auf **13 Klassen** (zusätzlich Assassin, Brawler, Warlock,
   Witch). Dieses Dokument bildet bewusst **SRD 1.0** mit den **neun**
   Klassen und **neun** Domänen ab, wie es der Auftrag verlangt hat. Falls
   Jannik mit der neueren Fassung spielt, sind Klassen, Domänen und
   möglicherweise weitere Details zu ergänzen – das wäre ein eigener
   Rechercheauftrag.
2. **Tier-2- bis Tier-4-Tabellen für Waffen** (Primär- und Sekundärwaffen)
   und für Rüstung: Die konkreten Schadens-/Rüstungswerte je Gegenstand
   liegen im Ausgangsdokument vor, aber der zweispaltige PDF-Tabellensatz
   ließ sich beim automatisierten Textextrahieren nicht immer zeilenrein den
   richtigen Namen zuordnen (Name und Zahlenspalte liefen auseinander).
   Um keine falschen Zahlen zu präsentieren, wurden nur die sicher lesbaren
   Tier-1-Werte sowie die wiederkehrenden Feature-Namen (z. B. *Reliable*,
   *Massive*, *Powerful*, *Brutal*, *Deadly*) übernommen.
3. **Exakte Obergrenzen für HP und Stress** („maximal 12"): im SRD-Fließtext
   nicht als feste Regel formuliert, nur als Ergebnis der 12 vorgedruckten
   Kästchen auf dem offiziellen Charakterblatt plausibel – mit Vorbehalt
   übernommen.
4. **Nicht behandelt, weil außerhalb des Auftrags:** die vollständige
   Domain-Card-Referenz (alle Karten aller neun Domänen einzeln), das
   Witherwild-Kampagnenrahmenkapitel, der Combat-Wheelchair-Regelanhang, die
   vollständigen Adversary-Statblöcke und die vollständige Loot-Tabelle. Für
   diese Bereiche verlangte der Auftrag nur „in Grundzügen" bzw. sie waren
   nicht explizit gefordert.

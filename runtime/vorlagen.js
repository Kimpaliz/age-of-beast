/* [Aufgabe: Bearbeiten]
   Baut aus den reinen Vorlagendaten eine bedienbare Eingabeoberfläche.

   Dieses klassische Skript bleibt eine Fassade unter `window.aobVorlagen`.
   Die Daten lädt es erst beim Start dynamisch, damit die Definitionen auch
   in Node prüfbar bleiben und kein zweiter Vorlagenbestand entsteht.
*/

(function vorlagenFassade() {
  "use strict";

  const DATEN_MODUL = "../werkzeuge/vorlagen.mjs";

  function textwert(wert) {
    return String(wert ?? "").trim();
  }

  function kennungAus(text) {
    const normalisiert = textwert(text)
      .toLocaleLowerCase("de")
      .replace(/ß/g, "ss")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return normalisiert || "neuer-eintrag";
  }

  function htmlSicher(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function absatzHtml(text) {
    return textwert(text)
      .split(/\n{2,}/)
      .map((absatz) => "<p>" + htmlSicher(absatz).replace(/\n/g, "<br>") + "</p>")
      .join("");
  }

  function feldwert(feld, roh) {
    const text = feld.art === "mehrzeilig" ? String(roh ?? "").trim() : textwert(roh);
    if (feld.art !== "zahl" || text === "") return text;
    const zahl = Number(text);
    return Number.isFinite(zahl) ? zahl : text;
  }

  function panelAusFeld(eintragId, feld, wert) {
    const teil = kennungAus(feld.schluessel);
    const text = String(wert);
    return {
      id: "panel-" + eintragId + "-" + teil,
      kind: "text",
      title: feld.panelTitel || feld.beschriftung,
      text,
      textFields: [{
        id: "text-" + eintragId + "-" + teil,
        label: "Text",
        text,
        html: absatzHtml(text),
      }],
      textLayout: "single",
    };
  }

  function erzeugeEintrag(vorlage, werte) {
    const name = textwert(werte?.name) || "Neuer Eintrag";
    const id = vorlage.zielkategorie + "-" + kennungAus(name);
    const fields = { connections: [] };
    const attributeRows = [];
    const customPanels = [];

    for (const feld of vorlage.felder) {
      const wert = feldwert(feld, werte?.[feld.schluessel]);
      if (feld.ziel === "name" || feld.ziel === "beschreibung") continue;

      const speicherfeld = feld.speicherfeld || feld.schluessel;
      fields[speicherfeld] = wert;

      if (feld.alsAttribut) {
        attributeRows.push({
          id: "attribute-" + id + "-" + kennungAus(speicherfeld),
          key: speicherfeld,
          label: feld.beschriftung,
        });
      }

      if (feld.alsPanel && textwert(wert)) {
        customPanels.push(panelAusFeld(id, feld, wert));
      }
    }

    return {
      id,
      module: vorlage.zielkategorie,
      name,
      description: String(werte?.beschreibung ?? "").trim(),
      fields,
      attributeRows,
      customPanels,
      panelOrder: [
        "core-connections",
        "references",
        ...customPanels.map((panel) => panel.id),
      ],
    };
  }

  function element(name, klasse) {
    const knoten = document.createElement(name);
    if (klasse) knoten.className = klasse;
    return knoten;
  }

  function meldungSetzen(halter, text, art) {
    const meldung = halter.querySelector("[data-vorlagenmeldung]");
    if (!meldung) return;
    meldung.textContent = text;
    meldung.hidden = !text;
    meldung.dataset.art = art || "";
  }

  function steuerungFuer(feld) {
    let steuerung;
    if (feld.art === "mehrzeilig") {
      steuerung = element("textarea", "vorlagen-eingabe");
      steuerung.rows = 4;
    } else if (feld.art === "auswahl") {
      steuerung = element("select", "vorlagen-eingabe");
      const leer = element("option");
      leer.value = "";
      leer.textContent = "Bitte wählen";
      steuerung.append(leer);
      for (const wert of feld.werte) {
        const option = element("option");
        option.value = wert;
        option.textContent = wert;
        steuerung.append(option);
      }
    } else {
      steuerung = element("input", "vorlagen-eingabe");
      steuerung.type = feld.art === "zahl" ? "number" : "text";
      if (feld.art === "verweis") {
        steuerung.placeholder = "ID eines bestehenden Eintrags";
        steuerung.autocomplete = "off";
      }
      if (feld.art === "zahl" && Number.isFinite(feld.minimum)) {
        steuerung.min = String(feld.minimum);
      }
    }
    steuerung.name = feld.schluessel;
    steuerung.id = "vorlagen-feld-" + feld.schluessel;
    steuerung.required = Boolean(feld.pflicht);
    return steuerung;
  }

  function feldBauen(feld) {
    const gruppe = element("div", "vorlagen-feld");
    gruppe.dataset.art = feld.art;
    const beschriftung = element("label", "vorlagen-beschriftung");
    beschriftung.htmlFor = "vorlagen-feld-" + feld.schluessel;
    beschriftung.textContent = feld.beschriftung;
    if (feld.pflicht) {
      const pflicht = element("span", "vorlagen-pflicht");
      pflicht.textContent = "Pflichtfeld";
      beschriftung.append(" ", pflicht);
    }

    const hilfe = element("p", "vorlagen-hilfe");
    hilfe.id = "vorlagen-hilfe-" + feld.schluessel;
    hilfe.textContent = feld.hilfe;

    const fehler = element("p", "vorlagen-feldfehler");
    fehler.id = "vorlagen-fehler-" + feld.schluessel;
    fehler.hidden = true;

    const steuerung = steuerungFuer(feld);
    steuerung.setAttribute("aria-describedby", hilfe.id + " " + fehler.id);
    steuerung.addEventListener("input", () => {
      steuerung.removeAttribute("aria-invalid");
      fehler.hidden = true;
      fehler.textContent = "";
    });
    steuerung.addEventListener("change", () => {
      steuerung.removeAttribute("aria-invalid");
      fehler.hidden = true;
      fehler.textContent = "";
    });

    gruppe.append(beschriftung, steuerung, hilfe, fehler);
    return gruppe;
  }

  function werteLesen(formular, vorlage) {
    const werte = {};
    for (const feld of vorlage.felder) {
      const steuerung = formular.elements.namedItem(feld.schluessel);
      werte[feld.schluessel] = steuerung ? steuerung.value : "";
    }
    return werte;
  }

  function formularPruefen(formular, vorlage, werte) {
    let erstesFehlerfeld = null;
    for (const feld of vorlage.felder) {
      const steuerung = formular.elements.namedItem(feld.schluessel);
      const fehler = formular.querySelector("#vorlagen-fehler-" + feld.schluessel);
      const leer = textwert(werte[feld.schluessel]) === "";
      if (feld.pflicht && leer) {
        steuerung.setAttribute("aria-invalid", "true");
        fehler.textContent = feld.beschriftung + " ist ein Pflichtfeld.";
        fehler.hidden = false;
        if (!erstesFehlerfeld) erstesFehlerfeld = steuerung;
      } else {
        steuerung.removeAttribute("aria-invalid");
        fehler.hidden = true;
        fehler.textContent = "";
      }
    }
    if (erstesFehlerfeld) erstesFehlerfeld.focus();
    return !erstesFehlerfeld;
  }

  function ausgabeBauen(halter, vorlage) {
    const ausgabe = element("section", "vorlagen-ausgabe");
    ausgabe.hidden = true;
    ausgabe.setAttribute("aria-live", "polite");
    const titel = element("h2");
    titel.textContent = "Fertiger Entwurf";
    const text = element("p", "vorlagen-ausgabe-hilfe");
    text.textContent = "Das Objekt wurde nicht gespeichert. Du kannst es jetzt kopieren.";
    const code = element("pre", "vorlagen-json");
    code.tabIndex = 0;
    const kopieren = element("button", "vorlagen-kopieren");
    kopieren.type = "button";
    kopieren.textContent = "JSON kopieren";
    const status = element("p", "vorlagen-kopierstatus");
    status.setAttribute("aria-live", "polite");
    kopieren.addEventListener("click", async () => {
      const inhalt = code.textContent || "";
      try {
        await navigator.clipboard.writeText(inhalt);
        status.textContent = "JSON wurde in die Zwischenablage kopiert.";
      } catch {
        status.textContent = "Kopieren nicht möglich. Den JSON-Text bitte manuell markieren.";
      }
    });
    ausgabe.append(titel, text, code, kopieren, status);
    halter.append(ausgabe);
    return { ausgabe, code, status, vorlage };
  }

  function formularBauen(halter, vorlage) {
    const bereich = element("section", "vorlagen-formularbereich");
    const titel = element("h2");
    titel.textContent = vorlage.symbol + " " + vorlage.anzeigename + " anlegen";
    const einleitung = element("p", "vorlagen-formular-einleitung");
    einleitung.textContent = "Pflichtfelder sind markiert. Verweise erwarten die ID eines bestehenden Eintrags.";
    const formular = element("form", "vorlagen-formular");
    formular.noValidate = true;
    const raster = element("div", "vorlagen-feldraster");
    for (const feld of vorlage.felder) raster.append(feldBauen(feld));
    const aktionen = element("div", "vorlagen-aktionen");
    const erzeugen = element("button", "vorlagen-erzeugen");
    erzeugen.type = "submit";
    erzeugen.textContent = "Objekt erzeugen";
    aktionen.append(erzeugen);
    formular.append(raster, aktionen);
    bereich.append(titel, einleitung, formular);
    halter.append(bereich);

    const ausgabe = ausgabeBauen(halter, vorlage);
    formular.addEventListener("submit", (ereignis) => {
      ereignis.preventDefault();
      const werte = werteLesen(formular, vorlage);
      if (!formularPruefen(formular, vorlage, werte)) {
        meldungSetzen(halter, "Bitte fülle die markierten Pflichtfelder aus.", "fehler");
        ausgabe.ausgabe.hidden = true;
        return;
      }
      const eintrag = erzeugeEintrag(vorlage, werte);
      ausgabe.code.textContent = JSON.stringify(eintrag, null, 2);
      ausgabe.status.textContent = "";
      ausgabe.ausgabe.hidden = false;
      meldungSetzen(halter, "Der Entwurf ist bereit zum Kopieren. Es wurde nichts gespeichert.", "erfolg");
      ausgabe.ausgabe.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function oberflaecheZeichnen(halter, vorlagen, aktiveKennung) {
    halter.replaceChildren();
    const auswahl = element("section", "vorlagen-auswahl");
    const titel = element("h2");
    titel.textContent = "Vorlage wählen";
    const text = element("p", "vorlagen-auswahl-hilfe");
    text.textContent = "Die Vorlage bestimmt Kategorie, Werte und die spätere Eintragsform.";
    const raster = element("div", "vorlagen-auswahlraster");
    const aktiv = vorlagen.find((vorlage) => vorlage.kennung === aktiveKennung) || vorlagen[0];

    for (const vorlage of vorlagen) {
      const knopf = element("button", "vorlagen-auswahlknopf");
      knopf.type = "button";
      knopf.setAttribute("aria-pressed", String(vorlage.kennung === aktiv.kennung));
      const symbol = element("span", "vorlagen-symbol");
      symbol.setAttribute("aria-hidden", "true");
      symbol.textContent = vorlage.symbol;
      const name = element("span", "vorlagen-auswahlname");
      name.textContent = vorlage.anzeigename;
      const meta = element("span", "vorlagen-auswahlmeta");
      meta.textContent = vorlage.felder.length + " Felder";
      knopf.append(symbol, name, meta);
      knopf.addEventListener("click", () => oberflaecheZeichnen(halter, vorlagen, vorlage.kennung));
      raster.append(knopf);
    }

    const meldung = element("p", "vorlagen-meldung");
    meldung.hidden = true;
    meldung.dataset.vorlagenmeldung = "";
    auswahl.append(titel, text, raster);
    halter.append(auswahl, meldung);
    formularBauen(halter, aktiv);
  }

  async function starten(halter) {
    if (!halter) throw new Error("Der Platz für die Vorlagen fehlt.");
    halter.setAttribute("aria-busy", "true");
    try {
      const daten = await import(DATEN_MODUL);
      const vorlagen = Array.isArray(daten.VORLAGEN) ? daten.VORLAGEN : [];
      if (!vorlagen.length) throw new Error("Keine Vorlagen wurden gefunden.");
      oberflaecheZeichnen(halter, vorlagen, vorlagen[0].kennung);
    } catch (fehler) {
      halter.replaceChildren();
      const meldung = element("p", "vorlagen-meldung");
      meldung.dataset.art = "fehler";
      meldung.textContent = "Die Vorlagen konnten nicht geladen werden. Bitte die Seite über den Vorschau-Server öffnen.";
      halter.append(meldung);
      throw fehler;
    } finally {
      halter.removeAttribute("aria-busy");
    }
  }

  window.aobVorlagen = Object.freeze({ erzeugeEintrag, starten });
})();

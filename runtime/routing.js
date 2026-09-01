/* Age-of-Beast – Routing, Rendergeneration und öffentliche Kompatibilitätsfassade. */
(function () {

  'use strict';

  const bausteine = window.__aobLeserBausteine = window.__aobLeserBausteine || {};

  bausteine.routing = function routingErstellen( {
    datenindex, ansichten, interaktion
  }) {

    let renderGeneration = 0;

    const nachDemZeichnen = [];

    function route() {
      return location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    }

    function rahmenRouteIstOffen(rahmenId) {
      const teile = route();
      if (teile[0] !== 'rahmen' || !teile[1]) return false;
      if (rahmenId === undefined) return true;
      try {
        return decodeURIComponent(teile[1]) === rahmenId;
      }
      catch (fehler) {
        return false;
      }
    }

    function rahmenSeiteZeichnen(id) {

      const renderer = window.ageOfBeast.rahmenZeichnen;

      if (typeof renderer === 'function') {
        const generation = renderGeneration;
        renderer(ansichten.inhaltHolen(), id, {
          generation, istNochAktuell: () => renderGeneration === generation && rahmenRouteIstOffen(id)
        });
        return;
      }

      ansichten.rahmenHinweisZeichnen();
      document.title = 'Kampagnenrahmen – ' + datenindex.weltHolen().titel;

    }

    function seiteZeichnen() {

      renderGeneration += 1;
      const teile = route();
      interaktion.vorschauVerbergen();

      if (!teile.length) ansichten.startseiteZeichnen();

      else if (teile[0] === 'eintrag' && teile[1]) ansichten.eintragZeichnen(decodeURIComponent(teile[1]), (id) => String(id || '').startsWith('rahmen-'));

      else if (teile[0] === 'kategorie' && teile[1]) ansichten.kategorieZeichnen(decodeURIComponent(teile[1]));

      else if (teile[0] === 'werkstatt') ansichten.werkstattZeichnen();

      else if (teile[0] === 'rahmen' && teile[1]) rahmenSeiteZeichnen(decodeURIComponent(teile[1]));

      else ansichten.nichtGefunden();

      if (window.matchMedia('(max-width: 60rem)').matches) interaktion.leisteSetzen(false);

      window.scrollTo( {
        top: 0, behavior: 'auto'
      });
      interaktion.nachRender();

      for (const rueckruf of nachDemZeichnen) try {
        rueckruf();
      }
      catch (fehler) {
        console.error('Rückruf nach dem Zeichnen:', fehler);
      }

    }

    const fassade = {

      rahmenZeichnen: null,
      weltSetzen(neueWelt, stelleHalten) {
        if (!neueWelt || !Array.isArray(neueWelt.eintraege)) return false;
        const hoehe = window.scrollY;
        datenindex.weltSetzen(neueWelt);
        ansichten.kopfzeileSetzen();
        ansichten.navigationZeichnen();
        seiteZeichnen();
        if (stelleHalten) window.scrollTo( {
          top: hoehe, behavior: 'auto'
        });
        return true;
      },
      weltHolen: () => datenindex.weltHolen(),
      beiNeuZeichnen(rueckruf) {
        if (typeof rueckruf !== 'function') return;
        nachDemZeichnen.push(rueckruf);
        try {
          rueckruf();
        }
        catch (fehler) {
          console.error('Rückruf nach dem Zeichnen:', fehler);
        }
        return () => {
          const stelle = nachDemZeichnen.indexOf(rueckruf);
          if (stelle >= 0) nachDemZeichnen.splice(stelle, 1);
        };
      },
      rahmenRendererRegistrieren(renderer) {
        if (typeof renderer !== 'function') return false;
        fassade.rahmenZeichnen = renderer;
        if (rahmenRouteIstOffen()) seiteZeichnen();
        return true;
      }

    };

    let gestartet = false;

    function start() {
      if (gestartet) return;
      gestartet = true;
      ansichten.kopfzeileSetzen();
      ansichten.navigationZeichnen();
      window.addEventListener('hashchange', seiteZeichnen);
      seiteZeichnen();
    }

    return {
      fassade, start
    };

  };

})();

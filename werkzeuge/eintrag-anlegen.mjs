/* [Aufgabe: Bearbeiten]
   Pure logic for entries created from unresolved wiki links. The module
   knows neither the DOM nor Firebase, so browser code and tests use the
   same safe draft shape. */

function textwert(wert) {
  return String(wert ?? '').replace(/\s+/gu, ' ').trim();
}

function vergleichswert(wert) {
  return textwert(wert).toLocaleLowerCase('de-DE');
}

/** Builds the readable part of an entry ID from its display name. */
export function kennungAusName(name) {
  return textwert(name)
    .toLocaleLowerCase('de-DE')
    .replace(/ß/gu, 'ss')
    .replace(/ä/gu, 'ae')
    .replace(/ö/gu, 'oe')
    .replace(/ü/gu, 'ue')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/gu, '')
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '') || 'eintrag';
}

/** Returns an unused ID and never overwrites an existing entry. */
export function eindeutigeKennung(kategorie, name, vorhandeneIds = new Set()) {
  const praefix = kennungAusName(kategorie);
  const basis = praefix + '-' + kennungAusName(name);
  const belegt = vorhandeneIds instanceof Set ? vorhandeneIds : new Set(vorhandeneIds || []);
  if (!belegt.has(basis)) return basis;
  let nummer = 2;
  while (belegt.has(basis + '-' + nummer)) nummer += 1;
  return basis + '-' + nummer;
}

/** Finds an existing name or alias without case sensitivity. */
export function eintragNachName(roh, name, kategorie = '') {
  const gesucht = vergleichswert(name);
  if (!gesucht) return null;
  for (const [gruppenName, gruppe] of Object.entries(roh?.elements || {})) {
    if (kategorie && gruppenName !== kategorie) continue;
    for (const [id, element] of Object.entries(gruppe || {})) {
      const namen = [element?.name];
      if (typeof element?.fields?.aliases === 'string') {
        namen.push(...element.fields.aliases.split(/[,;]/gu));
      }
      if (!namen.some((wert) => vergleichswert(wert) === gesucht)) continue;
      return { id, kategorie: gruppenName, element };
    }
  }
  return null;
}

/** Creates an intentionally empty but fully editable raw entry. */
export function eintragEntwurf({
  name,
  kategorie,
  icon = '',
  iconColor = '',
  vorhandeneIds = new Set(),
  zeit = new Date().toISOString(),
}) {
  const saubererName = textwert(name);
  const kategorieName = textwert(kategorie);
  const saubereKategorie = kennungAusName(kategorieName);
  if (!saubererName) throw new Error('Der Eintrag braucht einen Namen.');
  if (!kategorieName) throw new Error('Der Eintrag braucht eine Kategorie.');

  const id = eindeutigeKennung(saubereKategorie, saubererName, vorhandeneIds);
  return {
    id,
    module: saubereKategorie,
    name: saubererName,
    description: '',
    icon: textwert(icon),
    iconColor: textwert(iconColor),
    image: '',
    fields: { connections: [] },
    attributeRows: [],
    customPanels: [],
    panelOrder: ['core-connections', 'references'],
    createdAt: zeit,
    updatedAt: zeit,
  };
}

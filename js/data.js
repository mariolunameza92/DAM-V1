// Exports: FOLDERS_DATA, TREE_DATA, FOLDER_IMAGES, INICIO_FOLDER_IDS, INICIO_ASSETS, findNode(), getAncestorIds()
export const FOLDERS_DATA = [
  { id: 'marketing',      name: 'Marketing',      count: '15 archivos',     imageId: 'marketing' },
  { id: 'comunicaciones', name: 'Comunicaciones', count: '952 archivos',    imageId: 'recursospauta' },
  { id: 'legal',          name: 'Legal',          count: '81 archivos',     imageId: 'archivosaprobar' },
  { id: 'agencia',        name: 'Agencia XYZ',    count: '10.5K archivos',  imageId: 'imagenesig' },
  { id: 'eventos',        name: 'Eventos 2025',   count: '342 archivos',    imageId: 'eventofin' },
  { id: 'campania',       name: 'Campaña Q2',     count: '128 archivos',    imageId: 'campana2025' },
];

export const TREE_DATA = [
  { id: 'campana2025', label: 'Campaña 2025', owned: true,  lastEdited: new Date('2026-05-20').getTime(), children: [
    { id: 'briefing', label: 'Briefing inicial', children: [
      { id: 'planmedios', label: 'Plan de medios', children: [
        { id: 'creaciones', label: 'Creaciones', children: [
          { id: 'artesfinales', label: 'Artes finales', children: [
            { id: 'finalfinal',  label: 'Final-Final',     children: [] },
            { id: 'archivosjpg', label: 'Archivos en JPG', children: [] },
            { id: 'recursospng', label: 'Recursos PNG',    children: [] },
          ]},
        ]},
      ]},
    ]},
  ]},
  { id: 'marketing',       label: 'Marketing',              owned: true,  lastEdited: new Date('2026-05-10').getTime(), children: [] },
  { id: 'eventofin',       label: 'Evento Fin de año 2025', owned: true,  lastEdited: new Date('2026-03-15').getTime(), children: [] },
  { id: 'imagenesig',      label: 'Imágenes para IG',       owned: false, lastEdited: new Date('2026-04-28').getTime(), children: [] },
  { id: 'archivosaprobar', label: 'Archivos por aprobar',   owned: false, lastEdited: new Date('2026-05-24').getTime(), children: [] },
  { id: 'recursospauta',   label: 'Recursos Pauta 2026',    owned: false, lastEdited: new Date('2026-05-18').getTime(), children: [] },
];

export const FOLDER_IMAGES = {
  campana2025:     ['imgs/kristin-wilson-z3htkdHUh5w-unsplash.jpg','imgs/annie-spratt-g9KFpAfQ5bc-unsplash.jpg','imgs/compagnons-eTgMFFzroGc-unsplash.jpg','imgs/surface-HJgaV1qjHS0-unsplash.jpg'],
  marketing:       ['imgs/sixteen-miles-out-2oKdzcvs6fE-unsplash.jpg','imgs/dmytro-koplyk-IaXzpSeRWIw-unsplash.jpg','imgs/ahmed-B33BHYfQtIY-unsplash.jpg','imgs/alexis-presa-ggQCbltMcCk-unsplash.jpg'],
  eventofin:       ['imgs/johannes-andersson-UCd78vfC8vU-unsplash.jpg','imgs/kristaps-ungurs-owcJsiIK7UU-unsplash.jpg','imgs/jeremy-bishop-EwKXn5CapA4-unsplash.jpg','imgs/goutham-krishna-h5wvMCdOV3w-unsplash.jpg'],
  imagenesig:      ['imgs/robert-katzki-jbtfM0XBeRc-unsplash.jpg','imgs/felix-dubois-robert-CuEvrPd3NYc-unsplash.jpg','imgs/rodion-kutsaiev-pVoEPpLw818-unsplash.jpg','imgs/alexander-grey-p203ekCK4Ac-unsplash.jpg'],
  archivosaprobar: ['imgs/eleni-afiontzi-gLU8GZpHtRA-unsplash.jpg','imgs/deon-fosu-ZQZrvL7DwiI-unsplash.jpg','imgs/tania-mousinho-YlpfE9uCakE-unsplash.jpg','imgs/tania-mousinho-6tCgnd2xNfI-unsplash.jpg'],
  recursospauta:   ['imgs/evangeline-shaw-nwLTVwb7DbU-unsplash.jpg','imgs/jakob-dalbjorn-cuKJre3nyYc-unsplash.jpg','imgs/headway-F2KRf_QfCqw-unsplash.jpg','imgs/md-duran-rE9vgD_TXgM-unsplash.jpg'],
};

export const INICIO_FOLDER_IDS = ['campana2025', 'marketing', 'eventofin', 'imagenesig', 'archivosaprobar', 'recursospauta'];

export function findNode(id, nodes = TREE_DATA) {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findNode(id, n.children);
    if (found) return found;
  }
  return null;
}

export function getAncestorIds(targetId, nodes = TREE_DATA, path = []) {
  for (const n of nodes) {
    if (n.id === targetId) return path;
    const result = getAncestorIds(targetId, n.children, [...path, n.id]);
    if (result) return result;
  }
  return null;
}

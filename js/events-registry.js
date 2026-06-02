// Exports: FACE_REGISTRY, PHOTO_FACES, FOLDER_IMAGES_EVENTS, annotateDemoFaces
// PHOTO_FACES se deriva automáticamente del naming convention de los selfies:
//   f[N]-num1-num2-....png → ese rostro aparece en las fotos cuyos nombres terminan en esos números.

const CR   = 'fotos%20demo/Color%20Run%202026';
const L42K = 'fotos%20demo/Lima%2042K%202026';
const MMM  = 'fotos%20demo/Mas%20mujeres%20en%20meta%202026';
const OSR  = 'fotos%20demo/On%20Squad%20Race%20Lima%202026';
const RBF  = 'fotos%20demo/Rimac%20Bienestar%20Fest';
const WFL  = 'fotos%20demo/Wings%20for%20life%202026';

// faceId → { name, selfieUrl }
export const FACE_REGISTRY = {
  cr_f2:  { name: 'Carmen López',   selfieUrl: `${CR}/f2-2299.png` },
  cr_f3:  { name: 'Rosa Huanca',    selfieUrl: `${CR}/f3-2257.png` },
  cr_f4:  { name: '',               selfieUrl: `${CR}/f4-2380.png` },    // Carlos Ríos (m)
  cr_f5:  { name: 'Lucía Flores',   selfieUrl: `${CR}/f5-2348.png` },
  cr_f6:  { name: 'Valeria Castro', selfieUrl: `${CR}/f6-2299.png` },
  cr_f7:  { name: 'Roberto Ponce',  selfieUrl: `${CR}/f7-2257.png` },

  l42k_f:   { name: 'Joseph Kiprono Kiptum', selfieUrl: `${L42K}/f-1268-1270-1273-1274.png` },
  l42k_f2:  { name: 'Nider Pecho',          selfieUrl: `${L42K}/f2-1268-1270-1273-1274.png` },
  l42k_f3:  { name: 'Jonathan Molina',      selfieUrl: `${L42K}/f3-1268-1270-1273-1274.png` },
  l42k_f4:  { name: '',                 selfieUrl: `${L42K}/f4-1268-1270-.png` },        // Javier Torres (m)
  l42k_f5:  { name: '',                 selfieUrl: `${L42K}/f5-1268-1270-1273.png` },     // Luis Ríos (m)
  l42k_f6:  { name: 'Milagros Castro',  selfieUrl: `${L42K}/f6-1268-1270-1273.png` },
  l42k_f7:  { name: 'Víctor Salas',     selfieUrl: `${L42K}/f7-1268-1270-.png` },
  l42k_f8:  { name: 'Omar Quispe',      selfieUrl: `${L42K}/f8-2556.png` },
  l42k_f9:  { name: '',                 selfieUrl: `${L42K}/f9-2302-2313.png` },          // Daniel Flores (m)
  l42k_f10: { name: '',                 selfieUrl: `${L42K}/f10-2313-2302.png` },         // Pablo Rojas (m)
  l42k_f11: { name: 'Fernando Vidal',   selfieUrl: `${L42K}/f11-1238-1243-1240-1237-1235.png` },
  l42k_f12: { name: 'Romina Luna',      selfieUrl: `${L42K}/f12-1238-1243-1240-1237-1235.png` },

  mmm_f:    { name: 'Camilo Pérez',     selfieUrl: `${MMM}/f-2712-2721.png` },
  mmm_f2:   { name: '',                 selfieUrl: `${MMM}/f2-2856-2875.png` },           // Natalia Morales (f)

  osr_f:    { name: 'Sebastián Ortiz',  selfieUrl: `${OSR}/f-3262-3263-3273.png` },
  osr_f2:   { name: 'Diego Ruiz',       selfieUrl: `${OSR}/f2-3383.png` },

  rbf_f:    { name: 'Andrea Soto',      selfieUrl: `${RBF}/f-0035-0036.png` },
  rbf_f2:   { name: 'Valentina Cruz',   selfieUrl: `${RBF}/f2-0035-0036.png` },
  rbf_f4:   { name: 'Helena Ramírez',   selfieUrl: `${RBF}/f4-0034.png` },
  rbf_f5:   { name: '',                 selfieUrl: `${RBF}/f5-0033.png` },               // Claudia Herrera (f)
  rbf_f7:   { name: '',                 selfieUrl: `${RBF}/f7-0031.png` },               // Fernando Díaz (m)
  rbf_f8:   { name: 'Patricia Campos',  selfieUrl: `${RBF}/f8-0031.png` },

  wfl_f:    { name: 'Alejandra Lima',   selfieUrl: `${WFL}/f-2292-2293.png` },
  wfl_f2:   { name: '',                 selfieUrl: `${WFL}/f2-2287.png` },               // Mariana Santos (f)
  wfl_f3:   { name: 'Gonzalo Vera',     selfieUrl: `${WFL}/f3-2285.png` },
};

// URLs de fotos por carpeta-evento (mismas claves que FOLDER_IMAGES en data.js)
export const FOLDER_IMAGES_EVENTS = {
  colorrun: [
    `${CR}/LEN_ColorRunNigth26_JOAL_2257.jpg`,
    `${CR}/LEN_ColorRunNigth26_JOAL_2299.jpg`,
    `${CR}/LEN_ColorRunNigth26_JOAL_2348.jpg`,
    `${CR}/LEN_ColorRunNigth26_JOAL_2380.jpg`,
  ],
  lima42k: [
    `${L42K}/LEN_L42K26_adidas-1235.jpg`,
    `${L42K}/LEN_L42K26_adidas-1237.jpg`,
    `${L42K}/LEN_L42K26_adidas-1238.jpg`,
    `${L42K}/LEN_L42K26_adidas-1240.jpg`,
    `${L42K}/LEN_L42K26_adidas-1243.jpg`,
    `${L42K}/LEN_L42K26_adidas-1268.jpg`,
    `${L42K}/LEN_L42K26_adidas-1270.jpg`,
    `${L42K}/LEN_L42K26_adidas-1273.jpg`,
    `${L42K}/LEN_L42K26_adidas-1274.jpg`,
    `${L42K}/PDR_2302.JPG`,
    `${L42K}/PDR_2313.JPG`,
    `${L42K}/PDR_2556.JPG`,
  ],
  masmujeres: [
    `${MMM}/LEN_MMM26_JOAL_2712.jpg`,
    `${MMM}/LEN_MMM26_JOAL_2721.jpg`,
    `${MMM}/LEN_MMM26_JOAL_2856.jpg`,
    `${MMM}/LEN_MMM26_JOAL_2875.jpg`,
  ],
  onsquad: [
    `${OSR}/_DSC3262.JPG`,
    `${OSR}/_DSC3263.JPG`,
    `${OSR}/_DSC3273.JPG`,
    `${OSR}/_DSC3383.JPG`,
  ],
  rimac: [
    `${RBF}/LEN_RIMAC26_JOAL_0031.jpg`,
    `${RBF}/LEN_RIMAC26_JOAL_0033.jpg`,
    `${RBF}/LEN_RIMAC26_JOAL_0034.jpg`,
    `${RBF}/LEN_RIMAC26_JOAL_0035.jpg`,
    `${RBF}/LEN_RIMAC26_JOAL_0036.jpg`,
  ],
  wingslife: [
    `${WFL}/WFL_LEN_CAMRUNPERU-2285.jpg`,
    `${WFL}/WFL_LEN_CAMRUNPERU-2287.jpg`,
    `${WFL}/WFL_LEN_CAMRUNPERU-2292.jpg`,
    `${WFL}/WFL_LEN_CAMRUNPERU-2293.jpg`,
  ],
};

// Deriva { photoUrl → [faceId, ...] } del naming convention de los selfies.
// Selfie: f[N]-num1-num2-....png  → ese rostro está en las fotos cuyos nombres
// terminan en esos números (comparación numérica, ignora ceros a la izquierda).
function _buildPhotoFaces(registry, folderImages) {
  const result = {};

  for (const [faceId, face] of Object.entries(registry)) {
    const selfieUrl  = face.selfieUrl;
    const lastSlash  = selfieUrl.lastIndexOf('/');
    const folderPath = selfieUrl.slice(0, lastSlash);          // URL-encoded folder
    const filename   = selfieUrl.slice(lastSlash + 1);         // e.g. f4-1268-1270-.png

    // Extract the dash-separated number list after the face prefix (f, f2, f11…)
    const m = filename.match(/^f\d*-(.+)\.png$/i);
    if (!m) continue;

    const faceNums = new Set(
      m[1].split('-').filter(s => /^\d+$/.test(s)).map(s => parseInt(s, 10))
    );
    if (!faceNums.size) continue;

    // Walk every photo URL in the same folder
    for (const photos of Object.values(folderImages)) {
      for (const photoUrl of photos) {
        if (!photoUrl.startsWith(folderPath + '/')) continue;

        // Extract trailing number from photo filename (e.g. 2712 from LEN_MMM26_JOAL_2712.jpg)
        const photoFile = photoUrl.split('/').pop();
        const nm = photoFile.match(/(\d+)\.[^.]+$/);
        if (!nm) continue;

        const photoNum = parseInt(nm[1], 10);
        if (faceNums.has(photoNum)) {
          if (!result[photoUrl]) result[photoUrl] = [];
          if (!result[photoUrl].includes(faceId)) result[photoUrl].push(faceId);
        }
      }
    }
  }

  return result;
}

// photo URL → face IDs que aparecen en esa foto (derivado automáticamente)
export const PHOTO_FACES = _buildPhotoFaces(FACE_REGISTRY, FOLDER_IMAGES_EVENTS);

// Anota faceIds en cada asset demo según PHOTO_FACES. Llamar después de initDemoImages.
export function annotateDemoFaces(uploadedAssets) {
  for (const assets of Object.values(uploadedAssets)) {
    for (const asset of assets) {
      if (asset.originalUrl) {
        asset.faceIds = PHOTO_FACES[asset.originalUrl] || [];
      }
    }
  }
}

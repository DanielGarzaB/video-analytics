# 🎥 Guia practica: extraer datos de Tubular Labs (Video Gallery)

> Objetivo: automatizar los clics en "Load more" y exportar la tabla de Video Gallery a CSV con: `video`, `creator_name`, `video_url`, `image_url`, `upload_date`, `views`, `v30`, `duration`, `platform` + columnas normalizadas (`views_num`, `v30_num`, `duration_sec`).

## Indice rapido
- [Requisitos previos](#requisitos-previos)
- [Tabla de parametros](#tabla-de-parametros)
- [Opcion A: scripts separados](#opcion-a-scripts-separados)
  - [Paso 1: auto clic en "Load more"](#paso-1-auto-load-more)
  - [Paso 2: extraer y descargar CSV](#paso-2-extraer-csv)
- [Opcion B: todo en uno](#opcion-b-todo-en-uno)
- [Diagnostico rapido](#diagnostico-rapido)
- [Guia rapida de uso](#guia-rapida-de-uso)
- [Solucion de problemas](#solucion-de-problemas)
- [Notas de mantenimiento](#notas-de-mantenimiento)

---

<a id="requisitos-previos"></a>
## ✅ Requisitos previos

| Requisito | Detalle |
|-----------|---------|
| Navegador | Chrome o Edge (Chromium) |
| Herramienta | DevTools Console (F12 -> Console) |
| Permiso | Escribir `allow pasting` + Enter antes de pegar codigo |
| Pagina | Estar en la vista "Video Gallery" de Tubular Labs |

---

<a id="tabla-de-parametros"></a>
## 📊 Tabla de parametros

| Parametro | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `maxClicks` | number | 500 | Maximo de clics en "Load more" antes de parar |
| `delayMs` | number | 6000 | Milisegundos base de espera entre cada clic |
| `delayJitterMs` | number | 300 | Jitter aleatorio (0-`delayJitterMs`) para que parezca humano (recomendado 300-500 ms) |
| `finalDelay` | number | 3000 | Espera final antes de leer la tabla |
| `normalizeNumbers` | boolean | true | Convertir vistas (K/M/B) a numero y duracion a segundos |
| `downloadFile` | boolean | true | `true` = descarga CSV, `false` = solo portapapeles |
| `promptFileName` | boolean | false | `false` = nombre auto `Tubularlabs_yy_mm_dd_HHmmss.csv` |
| `fileNamePrefix` | string | `Tubular_Videos` | Prefijo para el CSV exportado |

---

<a id="opcion-a-scripts-separados"></a>
## 🅰️ Opcion A: scripts separados

<a id="paso-1-auto-load-more"></a>
### Paso 1: auto clic en "Load more" (selector especifico + jitter humano)
```js
(() => {
  // CONFIGURACION
  const AUTO_CONFIG = {
    maxClicks: 500,
    delayMs: 6000,      // base
    delayJitterMs: 500, // aleatorio 0-500 ms
    finalDelay: 3000,
    autoStart: true     // true = arranca al pegar; false = manual con await autoLoadMore()
  };

  // Selectores ajustados a tu HTML
  const LOAD_MORE_SELECTORS = [
    '.button.full-width[ng-click*="loadMore"]', // especifico
    '.load-more .button',
    '[ng-click*="loadMore"]',
    '.button:contains("Load more")'
  ];

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  function findButton() {
    for (const sel of LOAD_MORE_SELECTORS) {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) return el;
    }
    return null;
  }

  window.autoLoadMore = async function(customOptions = {}) {
    const opts = { ...AUTO_CONFIG, ...customOptions };
    console.log("[AUTO] Iniciando auto-clic...", opts);

    let clickCount = 0;

    for (let i = 0; i < opts.maxClicks; i++) {
      const btn = findButton();

      if (!btn) {
        console.log("[STOP] Botón 'Load more' no encontrado o invisible. Terminando.");
        break;
      }

      btn.scrollIntoView({ block: "center", behavior: "instant" });
      btn.click();
      clickCount++;

      const jitter = Math.floor(Math.random() * ((opts.delayJitterMs || 0) + 1));
      const totalWait = opts.delayMs + jitter;
      if (clickCount % 10 === 0) console.log(`[CLIC] Clic #${clickCount} (Espera: ${totalWait}ms)`);

      await sleep(totalWait);
    }

    console.log(`[OK] Finalizado. Total clics: ${clickCount}. Esperando render final...`);
    await sleep(opts.finalDelay);
    console.log("[LISTO] Listo para extraer.");
  };

  if (AUTO_CONFIG.autoStart) {
    console.log("[OK] Script de clic cargado. Iniciando...");
    autoLoadMore().catch((err) => console.error("[ERROR] autoLoadMore fallo:", err));
  } else {
    console.log("[OK] Script de clic cargado. Escribe: await autoLoadMore();");
  }
})();
```

> Si ves `undefined` en consola despues de pegar el bloque, es normal: es el retorno de la IIFE (no devuelve nada). Si prefieres control manual, pon `autoStart: false` y luego ejecuta `await autoLoadMore();`.

<a id="paso-2-extraer-csv"></a>
### Paso 2: extraer y descargar CSV (miniaturas corregidas)
```js
(() => {
  const EXTRACT_CONFIG = {
    normalizeNumbers: true,
    downloadFile: true,
    fileNamePrefix: "Tubular_Videos"
  };

  const csvEscape = (val) => '"' + String(val || "").replace(/"/g, '""') + '"';

  const parseViews = (txt) => {
    if (!txt || txt === "--") return 0;
    const t = txt.trim().toUpperCase().replace(/,/g, "");
    const mult = t.endsWith("B") ? 1e9 : t.endsWith("M") ? 1e6 : t.endsWith("K") ? 1e3 : 1;
    return Math.round(parseFloat(t) * mult) || 0;
  };

  const parseDuration = (txt) => {
    if (!txt || txt === "--") return 0;
    const parts = txt.split(":").map(n => parseInt(n, 10) || 0);
    return parts.length === 3 ? parts[0]*3600 + parts[1]*60 + parts[2] : 
           parts.length === 2 ? parts[0]*60 + parts[1] : parts[0];
  };

  window.extractVideos = function(customOptions = {}) {
    const opts = { ...EXTRACT_CONFIG, ...customOptions };
    
    const table = Array.from(document.querySelectorAll('unified-table')).find(t => 
      t.innerText.includes('Upload Date') && t.innerText.includes('Views')
    );
    if (!table) return console.error("[ERROR] No se encontró la tabla 'Video Gallery'.");

    const headerRow = table.querySelector('.unified-table-header-row') || 
                      document.querySelector('.unified-table-header-row'); // Fallback global
    
    if (!headerRow) return console.error("[ERROR] No se encontró la fila de encabezados.");

    const headerCells = Array.from(headerRow.querySelectorAll('.unified-table-cell'));
    const colMap = {};
    
    headerCells.forEach((cell, idx) => {
      const txt = cell.innerText.toLowerCase().trim();
      if (txt.includes('upload date')) colMap.upload = idx;
      else if (txt === 'views') colMap.views = idx;
      else if (txt === 'v30') colMap.v30 = idx;
      else if (txt === 'duration') colMap.duration = idx;
      else if (txt === 'platform') colMap.platform = idx;
    });

    console.log("[MAPEO] Mapeo de columnas:", colMap);

    const pinnedRows = Array.from(table.querySelectorAll('.unified-table-pinned-columns .unified-table-data-row'));
    const freeRows = Array.from(table.querySelectorAll('.unified-table-free-columns .unified-table-data-row'));
    
    const rowCount = Math.min(pinnedRows.length, freeRows.length);
    console.log(`[PROCESO] Procesando ${rowCount} videos...`);

    const data = [];

    for (let i = 0; i < rowCount; i++) {
      try {
        const pRow = pinnedRows[i]; // Info fija (título, img, creador)
        const fRow = freeRows[i];   // Métricas (vistas, fecha)
        const fCells = fRow.querySelectorAll('.unified-table-cell');

        // --- Extracción Pinned ---
        const titleEl = pRow.querySelector('.name, .link-video-modal');
        const video = titleEl ? titleEl.innerText.trim() : "";

        const creatorEl = pRow.querySelector('.uploader .link');
        const creator_name = creatorEl ? creatorEl.innerText.trim() : "";

        const urlEl = pRow.querySelector('a.link-platform-watch-page');
        const video_url = urlEl ? urlEl.href : "";

        // Extracción de IMAGEN (background-image) evitando foto de perfil
        const thumbDiv = pRow.querySelector('.video-thumbnail');
        let image_url = "";
        if (thumbDiv) {
            const style = window.getComputedStyle(thumbDiv);
            const bg = style.backgroundImage; // url("...")
            const match = bg.match(/url\(['"]?(https?:\/\/[^'"]+)['"]?\)/);
            if (match) image_url = match[1];
        }
        if (!image_url) {
          const thumbImg = pRow.querySelector('.video-thumbnail img:not([class*="creator"]), img[src*="ytimg"], img[src*="cdninstagram"], img[src*="fbcdn"]');
          image_url = thumbImg?.src || "";
        }

        // Detectar plataforma por icono si no está en columnas
        const iconEl = pRow.querySelector('[class*="platform-identifier"] i');
        let platform = iconEl ? iconEl.className.replace('icon-', '').replace('-sign', '').replace('-play', '') : "";
        platform = platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : "";

        // --- Extracción Free ---
        const upload_date = colMap.upload !== undefined ? fCells[colMap.upload]?.innerText.trim() : "";
        const views = colMap.views !== undefined ? fCells[colMap.views]?.innerText.trim() : "0";
        const v30 = colMap.v30 !== undefined ? fCells[colMap.v30]?.innerText.trim() : "0";
        const duration = colMap.duration !== undefined ? fCells[colMap.duration]?.innerText.trim() : "";
        
        // Si hay columna explicita de plataforma, úsala
        if (colMap.platform !== undefined) {
            const pText = fCells[colMap.platform]?.innerText.trim();
            if (pText) platform = pText;
        }

        const row = {
          video, creator_name, video_url, image_url, platform, upload_date, 
          views, v30, duration
        };

        if (opts.normalizeNumbers) {
          row.views_num = parseViews(views);
          row.v30_num = parseViews(v30);
          row.duration_sec = parseDuration(duration);
        }

        data.push(row);
      } catch (err) {
        console.warn(`Error en fila ${i}`, err);
      }
    }

    // 4. Generar CSV
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.map(csvEscape).join(","),
        ...data.map(row => headers.map(k => csvEscape(row[k])).join(","))
      ].join("\n");

      // Descargar
      if (opts.downloadFile) {
        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const dateStr = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
        link.href = URL.createObjectURL(blob);
        link.download = `${opts.fileNamePrefix}_${dateStr}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      // Copiar al portapapeles
      navigator.clipboard.writeText(csvContent).then(() => console.log("[CLIPBOARD] CSV copiado al portapapeles."));
    }

    console.log(`[OK] ${data.length} videos extraídos exitosamente.`);
    return data;
  };

  console.log("[OK] Script Extractor cargado. Escribe: extractVideos();");
})();
```

---

<a id="opcion-b-todo-en-uno"></a>
## 🅱️ Opcion B: todo en uno (pegar y listo)

```js
(async () => {
  console.log("[START] EXTRACTOR TUBULAR LABS v3.1 - FIXED");
  console.log("=".repeat(60));

  const CONFIG = {
    maxClicks: 500,
    delayMs: 6000,
    delayJitterMs: 400,
    finalDelay: 3000,
    downloadFile: true,
    normalizeNumbers: true
  };

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const pad = n => String(n).padStart(2, "0");
  const generateFileName = () => {
    const now = new Date();
    return `Tubular_${String(now.getFullYear()).slice(-2)}_${pad(now.getMonth() + 1)}_${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.csv`;
  };
  const parseViews = txt => {
    if (!txt || txt === "--") return 0;
    const t = txt.trim().toUpperCase().replace(/,/g, "");
    if (t.endsWith("B")) return Math.round(parseFloat(t) * 1e9);
    if (t.endsWith("M")) return Math.round(parseFloat(t) * 1e6);
    if (t.endsWith("K")) return Math.round(parseFloat(t) * 1e3);
    return Math.round(parseFloat(t)) || 0;
  };
  const durationToSeconds = d => {
    if (!d || d === "--") return 0;
    const parts = d.split(":").map(n => parseInt(n, 10) || 0);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] || 0;
  };

  function findLoadMoreButton() {
    const selectors = [
      '.button.full-width[ng-click*="loadMore"]',
      '.load-more .button[ng-click*="loadMore"]',
      '.load-more .button',
      '[ng-click*="loadMore"]',
      null
    ];
    for (const sel of selectors) {
      if (sel === null) {
        const candidates = Array.from(document.querySelectorAll('button, div.button, a.button'));
        const btn = candidates.find(el => /load\s*more/i.test(el.innerText || "") && el.offsetParent !== null);
        if (btn) return btn;
      } else {
        const btn = document.querySelector(sel);
        if (btn && btn.offsetParent !== null) return btn;
      }
    }
    return null;
  }

  // FASE 1
  console.log(`\n[FASE1] Cargando videos (max ${CONFIG.maxClicks} clics)...`);
  let clicks = 0;
  for (let i = 0; i < CONFIG.maxClicks; i++) {
    const btn = findLoadMoreButton();
    if (!btn) {
      console.log("[OK] No hay mas boton 'Load more' visible");
      break;
    }
    btn.scrollIntoView({ block: "center", behavior: "instant" });
    btn.click();
    clicks++;
    if (clicks % 10 === 0) console.log(`   ... ${clicks} clics`);
    const jitter = Math.floor(Math.random() * (CONFIG.delayJitterMs + 1));
    await sleep(CONFIG.delayMs + jitter);
  }
  console.log(`[OK] Total clics: ${clicks}`);
  await sleep(CONFIG.finalDelay);

  // FASE 2
  console.log("\n[FASE2] Buscando tabla...");
  const table = Array.from(document.querySelectorAll('unified-table'))
    .find(t => /Upload Date/i.test(t.innerText) && /Views/i.test(t.innerText));
  if (!table) return console.error("[ERROR] No se encontro la tabla");
  console.log("[OK] Tabla encontrada");

  // FASE 3 (header corregido)
  console.log("\n[FASE3] Detectando columnas...");
  const floatingHeader = table.querySelector('.unified-table-floating-header');
  const headerRow = floatingHeader?.querySelector('.unified-table-header-row') ||
                    floatingHeader?.querySelector('.unified-table-row');
  if (!headerRow) {
    console.error("[ERROR] No se encontro el header row");
    console.log("[DEBUG] floatingHeader:", floatingHeader);
    return;
  }
  const headerCells = Array.from(headerRow.querySelectorAll('.unified-table-header-cell, .unified-table-cell'));
  const colMap = {};
  headerCells.forEach((cell, idx) => {
    const t = (cell.innerText || "").trim().toLowerCase();
    console.log(`   [${idx}] "${t}"`);
    if (/upload\s*date/i.test(t)) colMap.uploadDate = idx;
    else if (/^views$/i.test(t)) colMap.views = idx;
    else if (/^v30$/i.test(t)) colMap.v30 = idx;
    else if (/duration/i.test(t)) colMap.duration = idx;
    else if (/platform/i.test(t)) colMap.platform = idx;
  });
  console.log("[OK] Mapeo:", colMap);

  // FASE 4
  console.log("\n[FASE4] Extrayendo datos...");
  const pRows = Array.from(table.querySelectorAll('.unified-table-pinned-columns .unified-table-data-row'));
  const fRows = Array.from(table.querySelectorAll('.unified-table-free-columns .unified-table-data-row'));
  const rowCount = Math.min(pRows.length, fRows.length);
  if (!rowCount) return console.error("[ERROR] No hay filas");
  console.log(`   Procesando ${rowCount} filas...`);

  if (fRows.length > 0) {
    const firstRowCells = Array.from(fRows[0].querySelectorAll('.unified-table-cell'));
    console.log("[DEBUG] Primera fila FREE:");
    firstRowCells.forEach((c, i) => console.log(`   [${i}] "${(c.innerText || "").trim()}"`));
  }

  const data = [];
  let errors = 0;
  for (let i = 0; i < rowCount; i++) {
    try {
      const pRow = pRows[i];
      const fRow = fRows[i];
      const cells = Array.from(fRow.querySelectorAll('.unified-table-cell'));

      const titleEl = pRow.querySelector('.name, a.link-video-modal, .video-lockup .name');
      const video = (titleEl?.innerText || "").trim();

      const uploaderEl = pRow.querySelector('.uploader');
      const creator_name = (uploaderEl?.innerText || "").replace(/^\s*by\s*/i, "").trim();

      const videoUrlEl = pRow.querySelector('a.link-platform-watch-page');
      const video_url = videoUrlEl?.href || "";

      let image_url = "";
      const thumbDiv = pRow.querySelector('.video-thumbnail');
      if (thumbDiv) {
        const bg = window.getComputedStyle(thumbDiv).backgroundImage;
        const match = bg.match(/url\(["']?(https?:\/\/[^"')]+)["']?\)/);
        if (match) image_url = match[1];
      }
      if (!image_url) {
        const thumbImg = pRow.querySelector('.video-thumbnail img:not([class*="creator"]), img[src*="ytimg"], img[src*="cdninstagram"], img[src*="fbcdn"]');
        image_url = thumbImg?.src || "";
      }

      const platformEl = pRow.querySelector('[class*="platform-identifier"] i, [class*="platform-"]');
      const platformClass = platformEl?.className || "";
      let platformDetected = "";
      if (/instagram/i.test(platformClass)) platformDetected = "Instagram";
      else if (/youtube/i.test(platformClass)) platformDetected = "YouTube";
      else if (/tiktok/i.test(platformClass)) platformDetected = "TikTok";
      else if (/facebook/i.test(platformClass)) platformDetected = "Facebook";

      const getCell = key => {
        if (colMap[key] === undefined) return "";
        const cell = cells[colMap[key]];
        return (cell?.innerText || "").trim();
      };

      const upload_date = getCell("uploadDate");
      const views = getCell("views");
      const v30 = getCell("v30");
      const duration = getCell("duration");
      const platformFromCol = getCell("platform");
      const platform = platformFromCol || platformDetected;

      const row = { video, creator_name, video_url, image_url, upload_date, views, v30, duration, platform };
      if (CONFIG.normalizeNumbers) {
        row.views_num = parseViews(views);
        row.v30_num = parseViews(v30);
        row.duration_sec = durationToSeconds(duration);
      }
      data.push(row);
    } catch (err) {
      errors++;
      console.warn(`[WARN] Error fila ${i + 1}: ${err.message}`);
    }
  }

  console.log(`[OK] Extraidos: ${data.length} videos`);
  if (errors) console.warn(`[WARN] Errores: ${errors}`);
  if (data.length > 0) {
    console.log("\n[MUESTRA] Primeros 3 registros:");
    console.table(data.slice(0, 3));
  }
  if (!data.length) return console.error("[ERROR] No se extrajo nada");

  // FASE 5
  console.log("\n[FASE5] Generando CSV...");
  const csvEscape = v => '"' + String(v ?? "").replace(/"/g, '""') + '"';
  const headers = Object.keys(data[0]);
  const csvLines = [
    headers.map(csvEscape).join(","),
    ...data.map(row => headers.map(h => csvEscape(row[h])).join(","))
  ];
  const csv = "\ufeff" + csvLines.join("\n");

  try {
    await navigator.clipboard.writeText(csv);
    console.log("[OK] Copiado al portapapeles");
  } catch { console.warn("[WARN] No se pudo copiar"); }

  if (CONFIG.downloadFile) {
    const fileName = generateFileName();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log(`[OK] Descargado: ${fileName}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log(`Videos: ${data.length} | Clics: ${clicks} | Errores: ${errors}`);
  console.log("=".repeat(60));

  return data;
})();
```

Columnas generadas:
- Basicas: `video`, `creator_name`, `video_url`, `image_url`, `upload_date`, `views`, `v30`, `duration`, `platform`
- Con `normalizeNumbers: true`: `views_num`, `v30_num`, `duration_sec`

---

<a id="diagnostico-rapido"></a>
## 🩺 Diagnostico rapido (si deja de funcionar)
Ejecuta este bloque para ver indices y valores de la primera fila; con esa info ajustas los selectores.

```js
(() => {
  console.log("[Diag] Columnas FREE");
  const table = Array.from(document.querySelectorAll('unified-table'))
    .find(t => /Upload Date/i.test(t.innerText) && /Views/i.test(t.innerText));
  if (!table) return console.warn("Tabla no encontrada");

  const freeGroup = table.querySelector('.unified-table-free-columns');
  const floatingHeader = table.querySelector('.unified-table-floating-header, .unified-table-free-columns-wrapper');
  const headerRow = floatingHeader?.querySelector('.unified-table-row, .unified-table-header-row') || floatingHeader || freeGroup;
  if (!headerRow) return console.warn("Header no encontrado");

  const headerCells = Array.from(headerRow.querySelectorAll('.unified-table-header-cell, [class*=\"header-cell\"], .unified-table-cell'));
  const indices = {};
  headerCells.forEach((cell, i) => {
    const txt = (cell.innerText || "").trim();
    console.log(i, `"${txt}"`);
    if (/upload.*date/i.test(txt)) indices.uploadDate = i;
    if (/^views$/i.test(txt)) indices.views = i;
    if (/^v30$/i.test(txt)) indices.v30 = i;
    if (/duration/i.test(txt)) indices.duration = i;
    if (/platform/i.test(txt)) indices.platform = i;
  });
  console.log("Indices detectados:", indices);

  const freeRows = table.querySelectorAll('.unified-table-free-columns .unified-table-data-row');
  const pinnedRows = table.querySelectorAll('.unified-table-pinned-columns .unified-table-data-row');
  if (!freeRows.length || !pinnedRows.length) return console.warn("Sin filas de datos");

  const cells = Array.from(freeRows[0].querySelectorAll('.unified-table-cell, [class*=\"cell\"]'));
  console.log("Fila 1 (free):", cells.map(c => (c.innerText || "").trim()));
  const titleEl = pinnedRows[0].querySelector('.name, a.link-video-modal, .video-lockup .name');
  console.log("Titulo (pinned):", titleEl?.innerText?.trim());
})();
```

---

<a id="guia-rapida-de-uso"></a>
## ⚡ Guia rapida de uso
- Abre DevTools (F12) -> pestaña Console.
- Escribe `allow pasting` y Enter.
- Pega el bloque completo (Opcion A o B). Copia solo lo que está dentro del bloque ```js ... ```.
- Si usas **Opcion A**: ejecuta `await autoLoadMore();` y luego `extractVideos();` (el `await` es necesario porque la función es async).
- Si usas **Opcion B**: con pegar el bloque basta; el script corre solo (ya incluye los `await` internos).

---

<a id="solucion-de-problemas"></a>
## 🛠️ Solucion de problemas

| Problema | Solucion |
|----------|----------|
| Sale `undefined` al pegar | Ejecuta la funcion: `await autoLoadMore();` o `extractVideos();` |
| Error `Unexpected identifier 'generadas'` | Copia solo el bloque de codigo (entre ```js ... ```), sin el texto de la guía |
| No clickea el boton | Revisa que la consola este en el frame "top" y aumenta `delayMs` si la pagina es lenta |
| No encuentra la tabla | Asegurate de estar en "Video Gallery" |
| No copia al portapapeles | Descarga el CSV (se guardara igual) |
| Demasiados clics | Baja `maxClicks` o usa filtros en Tubular |
| Caracteres raros al abrir el CSV en Excel | El CSV lleva BOM UTF-8; si aun asi pasa, usa "Datos > Obtener datos > Desde texto/CSV" y elige UTF-8. |

---

<a id="notas-de-mantenimiento"></a>
## 📝 Notas de mantenimiento

- Si cambian los headers, revisa el bloque de diagnostico y ajusta el mapeo de columnas.
- Si cambian los estilos de plataforma, ajusta la deteccion de `platform`.
- Si cambian el boton de carga, actualiza el selector `.button.full-width[ng-click*="loadMore"]` o agrega otro a la lista.




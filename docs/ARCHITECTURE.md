# Arquitectura de flujo de datos

- Ingesta: el usuario carga CSV/JSON; `js/utils_parsers.js` limpia valores (numeros, duraciones, fechas) y detecta creador segun nombre de archivo.
- Normalizacion: `normalizeRows` en `js/data_normalize.js` convierte filas crudas a objetos uniformes `{title, url, date, views, v30, dur, er, creator, thumb, platform}` y filtra fechas invalidas.
- Estado: `js/app.js` escribe en `window.State` via `State.setFullData`/`setFilteredData` y controla modos de grafico, rangos de duracion y timers de apply.
- Filtros/controles: `js/filters_sliders.js` (rango de vistas y duracion) y `js/filters_toggles.js` (periodos, plataformas) actualizan `State` y disparan re-render.
- Render: `js/charts_config.js` + `js/charts_plugins.js` definen opciones; `js/charts_render.js` crea/destroye instancias Chart.js y pinta en el DOM segun el estado filtrado; `js/ui_topVideos.js` muestra tarjetas destacadas.
- Artefacto de build: `js/bundle-entry.js` es el entry para empaquetar IIFE (por ejemplo con esbuild) cuando se sirve via file://; `js/app.bundle.js` es el resultado generado.

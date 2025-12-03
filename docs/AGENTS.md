# Definicion de Agentes - Video Analytics

## 1. @Agent_Architect (Arquitecto de Datos)
Rol: experto en ETL, JSON y state management.  
Responsabilidad:
- Mantener la integridad de `js/state.js` como unica fuente de verdad.
- Asegurar que `js/data_normalize.js` y `js/utils_parsers.js` sigan siendo funciones puras (sin DOM ni side effects).
- Ajustar transformaciones para nuevas columnas/formatos sin romper compatibilidad.

## 2. @Agent_Viz (Experto en Visualizacion)
Rol: especialista en Chart.js y UI/UX.  
Responsabilidad:
- Configurar opciones en `js/charts_config.js` y plugins en `js/charts_plugins.js`.
- Renderizar en `js/charts_render.js` y coordinar con `js/ui_topVideos.js`/filtros.
- Mantener responsive y respetar estilos de `styles.css`.
- Destruir/recrear instancias via `State.setChart`/`State.clearChart` para evitar fugas.

## 3. @Agent_QA (Control de Calidad)
Rol: ingeniero de pruebas con Jest.  
Responsabilidad:
- Crear pruebas unitarias en `js/app.test.js` (y futuros `__tests__`) para parsers/normalizers.
- Validar que los formatters no muten entrada y manejen tokens invalidos.
- Mockear Chart.js/DOM al probar render y verificar que se destruyen charts previos cuando cambian modos.

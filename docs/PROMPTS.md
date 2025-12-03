# Prompt Library

## Anadir nuevo grafico
> Actua como @Agent_Viz. Necesito anadir un grafico de tipo [TIPO] en la seccion [ID_HTML]. Los datos provienen de [FUENTE_EN_STATE]. Genera la configuracion en `js/charts_config.js` y la funcion de render en `js/charts_render.js`. Asegura que sea responsive y que destruya instancias previas.

## Normalizar nueva fuente de datos
> Actua como @Agent_Architect. Subi un CSV/JSON llamado [NOMBRE_ARCHIVO]. Analiza su estructura y crea una funcion en `js/data_normalize.js` que lo transforme al formato que usa `State`. Agrega un test en `js/app.test.js` con fixtures para validar la transformacion.

## Refactor de UI de filtros
> Actua como @Agent_Viz. Los filtros en `js/filters_sliders.js` estan acoplados al HTML. Refactoriza para generar sliders dinamicamente segun la configuracion en `js/config.js` y actualiza `js/charts_render.js` para escuchar sus cambios.

# Reglas del Proyecto — Preicfes Gratuito Frontend

## ⚡ Regla de Eficiencia (OBLIGATORIA)

Este sistema está diseñado para soportar **+5,000 estudiantes simultáneos**. Por lo tanto, **toda decisión de implementación debe priorizar la eficiencia de red, memoria y procesamiento**. Aplica siempre los siguientes principios:

### HTTP / API
- **Nunca** hacer una petición HTTP por cada acción del usuario (ej: un POST por cada clic en una respuesta). Usa estado local y envía en lote.
- Cargar datos **bajo demanda** (lazy): no pre-cargar bloques que el usuario aún no ha solicitado.
- Usar `trackBy` en todos los `@for` de Angular para evitar re-renderizados innecesarios del DOM.

### Estado y Memoria
- Usar Angular `Signals` para estado reactivo granular. Evitar re-renderizados de componentes completos.
- Liberar recursos en `ngOnDestroy`: cancelar suscripciones, limpiar timers (`clearInterval`/`clearTimeout`), destruir instancias de Chart.js.
- No almacenar en memoria listas completas que no se necesitan (por ejemplo, preguntas de áreas no visitadas).

### Componentes
- Preferir componentes **Standalone** con imports explícitos para que el tree-shaking de Angular sea efectivo.
- Lazy load de rutas para que solo se descargue el código cuando el usuario lo necesita.

### Paleta de Colores (Institución)
- Azul oscuro primario: `#1f2a63`
- Azul secundario: `#2f5fd0`
- Amarillo acento: `#f4c430`
- Fondo: `#f5f7fa`
- Fuente: `Poppins`

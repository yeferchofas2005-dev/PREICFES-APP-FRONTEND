// ─── Área ────────────────────────────────────────────────────────────────────
export interface AreaExamen {
  idArea: number;
  nombre: string;
  totalPreguntas: number;
}

// ─── Preguntas ────────────────────────────────────────────────────────────────
export interface OpcionPregunta {
  idOpcion: number;
  texto: string;
}

export interface PreguntaExamen {
  idPregunta: number;
  enunciado: string;
  rutaImagen: string | null;
  nivelDificultad: number;
  caso: string | null; // texto de lectura crítica si aplica
  opciones: OpcionPregunta[];
}

// ─── Respuestas ───────────────────────────────────────────────────────────────
/** Estado local de una respuesta; nunca sale a la red hasta el envío en lote. */
export interface RespuestaLocal {
  idOpcion: number;
  tiempoRespuestaSegundos: number; // tiempo desde que se mostró la pregunta
}

/** DTO que se envía al backend en cada POST de área. */
export interface RespuestaEnvio {
  idPregunta: number;
  idOpcion: number;
  tiempoRespuestaSegundos: number;
}

export interface GuardarRespuestasBody {
  respuestas: RespuestaEnvio[];
}

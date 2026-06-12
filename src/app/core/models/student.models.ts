export interface EstudianteResumen {
  idEstudiante: number;
  nombres: string;
  apellidos: string;
  simulacrosRealizados: number;
  puntajePromedio: number;
  tiempoPromedioSegundos: number;
}

export interface SimulacroEstudiante {
  idSimulacro: number;
  nombre: string;
  fecha: string; // ISO string date
  estado: 'REALIZADO' | 'PENDIENTE' | string;
  puntaje: number;
  tiempoSegundos: number;
  porcentajeAprobacion: number;
}

export interface DesempenoAsignatura {
  idArea: number;
  asignatura: string;
  puntajePromedio: number;
}

export interface TiempoAsignatura {
  idArea: number;
  asignatura: string;
  tiempoPromedioSegundos: number;
}

export interface ResultadoSimulacroItem {
  idSimulacro: number;
  simulacro: string;
  idArea: number;
  asignatura: string;
  puntaje: number;
}

export interface EstudianteEstadisticas {
  puntajeGlobal: number;
  porcentajeNacional: number;
  tiempoPromedioSegundos: number;
  desempenoPorAsignatura: DesempenoAsignatura[];
  tiempoPorAsignatura: TiempoAsignatura[];
  resultadoSimulacro: ResultadoSimulacroItem[];
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AreaExamen,
  PreguntaExamen,
  GuardarRespuestasBody
} from '../models/exam.models';

@Injectable({ providedIn: 'root' })
export class ExamService {
  private http = inject(HttpClient);
  private base = '/api/estudiante/ejecucion';

  /**
   * Paso 1 — Inicia el simulacro con el código de acceso.
   * POST /api/estudiante/ejecucion/{idSimulacro}/iniciar
   */
  iniciarSimulacro(idSimulacro: number, codigoAcceso: string): Observable<void> {
    return this.http.post<void>(
      `${this.base}/${idSimulacro}/iniciar`,
      { codigoAcceso }
    );
  }

  /**
   * Paso 2 — Obtiene las áreas disponibles del simulacro.
   * GET /api/estudiante/ejecucion/{idSimulacro}/areas
   */
  getAreas(idSimulacro: number): Observable<AreaExamen[]> {
    return this.http.get<AreaExamen[]>(`${this.base}/${idSimulacro}/areas`);
  }

  /**
   * Paso 3 — Carga las preguntas de un área (lazy, solo cuando el usuario la selecciona).
   * GET /api/estudiante/ejecucion/{idSimulacro}/areas/{idArea}/preguntas
   */
  getPreguntas(idSimulacro: number, idArea: number): Observable<PreguntaExamen[]> {
    return this.http.get<PreguntaExamen[]>(
      `${this.base}/${idSimulacro}/areas/${idArea}/preguntas`
    );
  }

  /**
   * Paso 4 — Envía todas las respuestas de un área en lote.
   * POST /api/estudiante/ejecucion/{idSimulacro}/areas/{idArea}/respuestas
   * ⚡ NUNCA llamar por cada clic; solo al cambiar de área o finalizar.
   */
  guardarRespuestasArea(
    idSimulacro: number,
    idArea: number,
    body: GuardarRespuestasBody
  ): Observable<void> {
    return this.http.post<void>(
      `${this.base}/${idSimulacro}/areas/${idArea}/respuestas`,
      body
    );
  }

  /**
   * Paso 5 — Finaliza el simulacro y dispara la calificación en el servidor.
   * POST /api/estudiante/ejecucion/{idSimulacro}/finalizar
   */
  finalizarSimulacro(idSimulacro: number): Observable<void> {
    return this.http.post<void>(`${this.base}/${idSimulacro}/finalizar`, {});
  }
}

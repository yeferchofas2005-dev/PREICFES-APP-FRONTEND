import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EstudianteResumen, SimulacroEstudiante, EstudianteEstadisticas } from '../models/student.models';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private http = inject(HttpClient);
  // Using the proxy mapped in proxy.conf.json
  private apiUrl = '/api/estudiante';

  getResumen(): Observable<EstudianteResumen> {
    return this.http.get<EstudianteResumen>(`${this.apiUrl}/resumen`);
  }

  getSimulacros(): Observable<SimulacroEstudiante[]> {
    return this.http.get<SimulacroEstudiante[]>(`${this.apiUrl}/simulacros`);
  }

  getEstadisticas(): Observable<EstudianteEstadisticas> {
    return this.http.get<EstudianteEstadisticas>(`${this.apiUrl}/estadisticas`);
  }
}

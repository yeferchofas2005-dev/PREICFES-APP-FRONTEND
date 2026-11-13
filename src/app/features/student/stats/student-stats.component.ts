import {
  Component, OnInit, OnDestroy, inject, signal,
  AfterViewInit, ElementRef, ViewChild, ViewChildren, QueryList
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  Chart, RadarController, LineElement, PointElement, RadialLinearScale,
  BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Filler
} from 'chart.js';
import { StudentService } from '../../../core/services/student.service';
import { AuthService } from '../../../core/services/auth.service';
import { EstudianteEstadisticas, ResultadoSimulacroItem } from '../../../core/models/student.models';

Chart.register(
  RadarController, LineElement, PointElement, RadialLinearScale,
  BarController, BarElement, CategoryScale, LinearScale,
  Tooltip, Legend, Filler
);

export interface SimulacroGroup {
  idSimulacro: number;
  simulacro: string;
  items: ResultadoSimulacroItem[];
}

@Component({
  selector: 'app-student-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-stats.component.html',
  styleUrl: './student-stats.component.css'
})
export class StudentStatsComponent implements OnInit, OnDestroy {
  private studentService = inject(StudentService);
  private authService = inject(AuthService);
  private router = inject(Router);

  estadisticas = signal<EstudianteEstadisticas | null>(null);
  isLoading = signal(true);
  simulacroGroups = signal<SimulacroGroup[]>([]);

  private charts: Chart[] = [];

  ngOnInit(): void {
    this.studentService.getEstadisticas().subscribe({
      next: (data) => {
        this.estadisticas.set(data);
        this.isLoading.set(false);
        this.groupSimulacros(data);
        // Defer chart creation until the DOM is updated
        setTimeout(() => this.buildCharts(data), 0);
      },
      error: (err) => {
        console.error('Error loading estadisticas:', err);
        this.isLoading.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.charts.forEach(c => c.destroy());
  }

  private groupSimulacros(data: EstudianteEstadisticas): void {
    const map = new Map<number, SimulacroGroup>();
    for (const item of data.resultadoSimulacro) {
      if (!map.has(item.idSimulacro)) {
        map.set(item.idSimulacro, { idSimulacro: item.idSimulacro, simulacro: item.simulacro, items: [] });
      }
      map.get(item.idSimulacro)!.items.push(item);
    }
    this.simulacroGroups.set(Array.from(map.values()));
  }

  private buildCharts(data: EstudianteEstadisticas): void {
    this.buildRadarChart(data);
    this.buildBarTiempoChart(data);
    this.simulacroGroups().forEach(group => this.buildSimulacroBarChart(group));
  }

  private buildRadarChart(data: EstudianteEstadisticas): void {
    const canvas = document.getElementById('radarAsignaturas') as HTMLCanvasElement;
    if (!canvas) return;
    const labels = data.desempenoPorAsignatura.map(d => this.formatLabel(d.asignatura));
    const values = data.desempenoPorAsignatura.map(d => d.puntajePromedio);
    const chart = new Chart(canvas, {
      type: 'radar',
      data: {
        labels,
        datasets: [{
          label: 'Puntaje promedio',
          data: values,
          backgroundColor: 'rgba(47, 95, 208, 0.18)',
          borderColor: '#2f5fd0',
          borderWidth: 2,
          pointBackgroundColor: '#f4c430',
          pointBorderColor: '#1f2a63',
          pointRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { r: { beginAtZero: true, max: 100, ticks: { stepSize: 20 } } },
        plugins: { legend: { display: false } }
      }
    });
    this.charts.push(chart);
  }

  private buildBarTiempoChart(data: EstudianteEstadisticas): void {
    const canvas = document.getElementById('barTiempo') as HTMLCanvasElement;
    if (!canvas) return;
    const labels = data.tiempoPorAsignatura.map(d => this.formatLabel(d.asignatura));
    const values = data.tiempoPorAsignatura.map(d => d.tiempoPromedioSegundos);
    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Tiempo (segundos)',
          data: values,
          backgroundColor: [
            'rgba(47, 95, 208, 0.75)',
            'rgba(244, 196, 48, 0.75)',
            'rgba(31, 42, 99, 0.75)',
            'rgba(47, 95, 208, 0.5)',
            'rgba(244, 196, 48, 0.55)'
          ],
          borderColor: ['#2f5fd0', '#f4c430', '#1f2a63', '#2f5fd0', '#f4c430'],
          borderWidth: 2,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { callback: (v) => `${v} s` } }
        }
      }
    });
    this.charts.push(chart);
  }

  private buildSimulacroBarChart(group: SimulacroGroup): void {
    const canvas = document.getElementById(`simulacro-canvas-${group.idSimulacro}`) as HTMLCanvasElement;
    if (!canvas) return;
    const labels = group.items.map(i => this.formatLabel(i.asignatura));
    const values = group.items.map(i => i.puntaje);
    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Puntaje',
          data: values,
          backgroundColor: values.map(v => v >= 70 ? 'rgba(22, 163, 74, 0.75)' : v >= 40 ? 'rgba(244, 196, 48, 0.8)' : 'rgba(220, 53, 69, 0.7)'),
          borderColor: values.map(v => v >= 70 ? '#16a34a' : v >= 40 ? '#d97706' : '#dc3545'),
          borderWidth: 2,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, max: 100 } }
      }
    });
    this.charts.push(chart);
  }

  private formatLabel(label: string): string {
    return label.split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  avgPuntaje(items: ResultadoSimulacroItem[]): number {
    if (!items.length) return 0;
    return items.reduce((sum, i) => sum + i.puntaje, 0) / items.length;
  }

  logout(event: Event): void {
    event.preventDefault();
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  goBack(): void {
    this.router.navigate(['/student']);
  }
}

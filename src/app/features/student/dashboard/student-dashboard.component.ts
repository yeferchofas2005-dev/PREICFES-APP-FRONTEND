import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { StudentService } from '../../../core/services/student.service';
import { EstudianteResumen, SimulacroEstudiante } from '../../../core/models/student.models';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.css'
})
export class StudentDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private studentService = inject(StudentService);
  private router = inject(Router);

  resumen = signal<EstudianteResumen | null>(null);
  simulacros = signal<SimulacroEstudiante[]>([]);
  
  isLoadingResumen = signal(true);
  isLoadingSimulacros = signal(true);

  ngOnInit(): void {
    this.loadResumen();
    this.loadSimulacros();
  }

  loadResumen() {
    this.studentService.getResumen().subscribe({
      next: (data) => {
        this.resumen.set(data);
        this.isLoadingResumen.set(false);
      },
      error: (err) => {
        console.error('Error loading student summary:', err);
        this.isLoadingResumen.set(false);
      }
    });
  }

  loadSimulacros() {
    this.studentService.getSimulacros().subscribe({
      next: (data) => {
        this.simulacros.set(data);
        this.isLoadingSimulacros.set(false);
      },
      error: (err) => {
        console.error('Error loading simulacros:', err);
        this.isLoadingSimulacros.set(false);
      }
    });
  }

  logout(event: Event) {
    event.preventDefault();
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  goToStats(id: number) {
    this.router.navigate(['/student/stats']);
  }

  startTest(id: number) {
    this.router.navigate(['/student/exam', id]);
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins} min ${secs} s` : `${secs} s`;
  }
}

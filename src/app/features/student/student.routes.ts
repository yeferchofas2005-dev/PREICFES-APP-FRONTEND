import { Routes } from '@angular/router';

export const STUDENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard/student-dashboard.component').then(m => m.StudentDashboardComponent)
  },
  {
    path: 'stats',
    loadComponent: () => import('./stats/student-stats.component').then(m => m.StudentStatsComponent)
  }
];

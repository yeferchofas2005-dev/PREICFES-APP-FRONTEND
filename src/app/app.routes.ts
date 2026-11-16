import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'student',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ESTUDIANTE'] },
    loadChildren: () => import('./features/student/student.routes').then(m => m.STUDENT_ROUTES)
  },
  {
    path: 'profesor',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['PROFESOR'] },
    loadComponent: () =>
      import('./features/profesor/dashboard/profesor-dashboard.component').then(
        m => m.ProfesorDashboardComponent
      )
  },
  {
    path: 'coordinador',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['DIRECTIVO'] },
    loadComponent: () =>
      import('./features/coordinador/dashboard/coordinador-dashboard.component').then(
        m => m.CoordinadorDashboardComponent
      )
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () =>
      import('./features/admin/dashboard/admin-dashboard.component').then(
        m => m.AdminDashboardComponent
      )
  },
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'auth'
  }
];

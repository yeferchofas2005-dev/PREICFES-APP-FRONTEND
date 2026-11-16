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
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/coordinador/dashboard/coordinador-dashboard.component').then(
            m => m.CoordinadorDashboardComponent
          )
      },
      {
        path: 'usuarios',
        data: { scope: 'directivo' },
        loadComponent: () =>
          import('./features/users/user-management.component').then(
            m => m.UserManagementComponent
          )
      }
    ]
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/admin/dashboard/admin-dashboard.component').then(
            m => m.AdminDashboardComponent
          )
      },
      {
        path: 'usuarios',
        data: { scope: 'admin' },
        loadComponent: () =>
          import('./features/users/user-management.component').then(
            m => m.UserManagementComponent
          )
      }
    ]
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

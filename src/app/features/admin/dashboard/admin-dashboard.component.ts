import { Component } from '@angular/core';
import { RoleHomeShellComponent } from '../../../shared/components/role-home-shell/role-home-shell.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RoleHomeShellComponent],
  template: `
    <app-role-home-shell
      roleLabel="Administrador"
      title="Panel de Administración"
      subtitle="Gestión de parámetros generales, periodos académicos, nodos, agendamiento de simulacros y bancos de preguntas."
    />
  `
})
export class AdminDashboardComponent {}

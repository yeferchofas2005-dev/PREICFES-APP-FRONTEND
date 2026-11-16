import { Component } from '@angular/core';
import { RoleHomeShellComponent } from '../../../shared/components/role-home-shell/role-home-shell.component';

@Component({
  selector: 'app-profesor-dashboard',
  standalone: true,
  imports: [RoleHomeShellComponent],
  template: `
    <app-role-home-shell
      roleLabel="Profesor"
      title="Panel de Profesor"
      subtitle="Consulta de salón asignado, listado de estudiantes del fin de semana y activación de simulacros en clase."
    />
  `
})
export class ProfesorDashboardComponent {}

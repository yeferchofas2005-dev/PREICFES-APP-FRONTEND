import { Component } from '@angular/core';
import { RoleHomeShellComponent } from '../../../shared/components/role-home-shell/role-home-shell.component';

@Component({
  selector: 'app-coordinador-dashboard',
  standalone: true,
  imports: [RoleHomeShellComponent],
  template: `
    <app-role-home-shell
      roleLabel="Coordinador"
      title="Panel de Coordinación de Nodo"
      subtitle="Gestión de salones, asignación de profesores y estudiantes por fin de semana, y consulta de calendario."
    />
  `
})
export class CoordinadorDashboardComponent {}

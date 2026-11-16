import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RoleHomeShellComponent } from '../../../shared/components/role-home-shell/role-home-shell.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RoleHomeShellComponent, RouterLink],
  template: `
    <app-role-home-shell
      roleLabel="Administrador"
      title="Panel de Administración"
      subtitle="Gestión de parámetros generales, periodos académicos, nodos, agendamiento de simulacros y bancos de preguntas."
    >
      <section class="modules-grid">
        <a routerLink="/admin/usuarios" class="module-card">
          <span class="module-tag">Épica 01 · HU-02</span>
          <h3>Gestión de Usuarios</h3>
          <p>Crear, editar, consultar y activar/inactivar cuentas de administradores, coordinadores, profesores y estudiantes.</p>
          <span class="module-cta">Administrar usuarios →</span>
        </a>
      </section>
    </app-role-home-shell>
  `,
  styles: [`
    .modules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
      gap: 1.25rem;
      margin-top: 1.5rem;
    }
    .module-card {
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
      background: #ffffff;
      border-radius: 12px;
      padding: 1.5rem;
      text-decoration: none;
      color: #1f2a63;
      box-shadow: 0 4px 16px rgba(31, 42, 99, 0.08);
      border-top: 4px solid #f4c430;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .module-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 22px rgba(31, 42, 99, 0.13);
    }
    .module-tag {
      font-size: 0.72rem;
      font-weight: 700;
      color: #2f5fd0;
      text-transform: uppercase;
    }
    .module-card h3 {
      margin: 0;
      font-size: 1.15rem;
    }
    .module-card p {
      margin: 0;
      color: #4b5563;
      font-size: 0.9rem;
      line-height: 1.45;
    }
    .module-cta {
      margin-top: 0.5rem;
      font-weight: 600;
      color: #2f5fd0;
      font-size: 0.9rem;
    }
  `]
})
export class AdminDashboardComponent {}

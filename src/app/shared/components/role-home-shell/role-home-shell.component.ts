import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-role-home-shell',
  standalone: true,
  template: `
    <div class="shell-wrapper">
      <header class="shell-header">
        <div class="brand">
          <img src="assets/logo/logo.png" alt="Logo RumboALaU" class="brand-logo" />
          <div>
            <span class="role-badge">{{ roleLabel() }}</span>
            <h1>{{ title() }}</h1>
          </div>
        </div>
        <div class="user-actions">
          @if (user(); as u) {
            <span class="user-name">{{ u.nombres }} {{ u.apellidos }}</span>
          }
          <button type="button" class="btn-logout" (click)="logout()">Cerrar sesión</button>
        </div>
      </header>

      <main class="shell-content">
        <section class="welcome-card">
          <h2>{{ title() }}</h2>
          <p>{{ subtitle() }}</p>
        </section>
        <ng-content />
      </main>
    </div>
  `,
  styles: [`
    .shell-wrapper {
      min-height: 100vh;
      background-color: #f5f7fa;
      font-family: 'Poppins', sans-serif;
      color: #1f2a63;
    }
    .shell-header {
      background-color: #1f2a63;
      color: #ffffff;
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .brand-logo {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #ffffff;
      padding: 2px;
      object-fit: contain;
    }
    .role-badge {
      display: inline-block;
      background-color: #f4c430;
      color: #1f2a63;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.15rem 0.55rem;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .shell-header h1 {
      margin: 0.2rem 0 0;
      font-size: 1.15rem;
      font-weight: 600;
    }
    .user-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .user-name {
      font-size: 0.9rem;
      opacity: 0.92;
    }
    .btn-logout {
      background-color: #2f5fd0;
      color: #ffffff;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-logout:hover {
      background-color: #244db0;
    }
    .shell-content {
      max-width: 1100px;
      margin: 2rem auto;
      padding: 0 1.5rem;
    }
    .welcome-card {
      background: #ffffff;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 4px 16px rgba(31, 42, 99, 0.08);
      border-left: 5px solid #2f5fd0;
    }
    .welcome-card h2 {
      margin: 0 0 0.5rem;
      font-size: 1.35rem;
    }
    .welcome-card p {
      margin: 0;
      color: #4b5563;
    }
  `]
})
export class RoleHomeShellComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  title = input.required<string>();
  subtitle = input.required<string>();
  roleLabel = input.required<string>();

  user = this.authService.currentUser;

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}

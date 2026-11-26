import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-role-home-shell',
  standalone: true,
  template: `
    <div class="shell-wrapper">
      <header class="shell-header">
        <div class="header-brand">
          <img src="assets/logo/logo.png" alt="Logo RumboALaU" class="brand-logo" />
          <div class="brand-text">
            <h1>{{ title() }}</h1>
            <span>RumboALaU · PreICFES Gratuito</span>
          </div>
        </div>

        <div class="header-right">
          @if (user(); as u) {
            <div class="user-chip">
              <div class="user-avatar">{{ initials() }}</div>
              <div class="user-info">
                <span class="user-name">{{ u.nombres }} {{ u.apellidos }}</span>
                <span class="user-role">{{ roleLabel() }}</span>
              </div>
            </div>
          }
          <button type="button" class="btn-logout" (click)="logout()">
            <span aria-hidden="true">⏻</span>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </header>

      <main class="shell-content">
        <section class="hero-banner">
          <div class="hero-copy">
            <span class="hero-badge">{{ roleLabel() }}</span>
            <h2>Bienvenido{{ user() ? ', ' + user()!.nombres : '' }}</h2>
            <p>{{ subtitle() }}</p>
          </div>
        </section>
        <ng-content />
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      font-family: 'Poppins', sans-serif;
      color: #1f2a63;
    }

    .shell-wrapper {
      min-height: 100vh;
      background: linear-gradient(180deg, #eef2fa 0%, #f5f7fa 240px);
    }

    .shell-header {
      background: linear-gradient(90deg, #1f2a63 0%, #2f5fd0 100%);
      color: #ffffff;
      padding: 1rem 5%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
      box-shadow: 0 4px 20px rgba(31, 42, 99, 0.22);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-brand {
      display: flex;
      align-items: center;
      gap: 0.95rem;
    }

    .brand-logo {
      height: 44px;
      width: auto;
      object-fit: contain;
      filter: brightness(0) invert(1);
      opacity: 0.95;
    }

    .brand-text h1 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      line-height: 1.2;
    }

    .brand-text span {
      display: block;
      font-size: 0.78rem;
      opacity: 0.82;
      font-weight: 300;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 0.9rem;
      flex-wrap: wrap;
    }

    .user-chip {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      background: rgba(255, 255, 255, 0.13);
      backdrop-filter: blur(6px);
      border: 1px solid rgba(255, 255, 255, 0.22);
      padding: 0.35rem 0.9rem 0.35rem 0.4rem;
      border-radius: 999px;
    }

    .user-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: #f4c430;
      color: #1f2a63;
      font-weight: 700;
      font-size: 0.82rem;
      display: flex;
      align-items: center;
      justify-content: center;
      text-transform: uppercase;
      flex-shrink: 0;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      line-height: 1.25;
    }

    .user-name {
      font-size: 0.85rem;
      font-weight: 600;
      color: #ffffff;
    }

    .user-role {
      font-size: 0.7rem;
      color: rgba(255, 255, 255, 0.78);
    }

    .btn-logout {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      background: #f4c430;
      color: #1f2a63;
      border: none;
      padding: 0.55rem 1.05rem;
      border-radius: 999px;
      font-family: inherit;
      font-size: 0.86rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.14);
      transition: transform 0.15s ease, background-color 0.15s ease;
    }

    .btn-logout:hover {
      background: #ffd95a;
      transform: translateY(-1px);
    }

    .shell-content {
      max-width: 1180px;
      margin: 1.75rem auto 0;
      padding: 0 1.5rem 3rem;
    }

    .hero-banner {
      background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
      border-radius: 16px;
      padding: 1.65rem 1.85rem;
      box-shadow: 0 8px 24px rgba(31, 42, 99, 0.07);
      border: 1px solid rgba(47, 95, 208, 0.12);
      border-left: 6px solid #f4c430;
    }

    .hero-badge {
      display: inline-block;
      background: #eef3ff;
      color: #2f5fd0;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.2rem 0.65rem;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .hero-banner h2 {
      margin: 0.55rem 0 0.35rem;
      font-size: 1.45rem;
      font-weight: 700;
      color: #1f2a63;
    }

    .hero-banner p {
      margin: 0;
      color: #4b5563;
      font-size: 0.94rem;
      line-height: 1.55;
      max-width: 780px;
    }

    @media (max-width: 640px) {
      .shell-header {
        padding: 0.9rem 1rem;
      }
      .hero-banner {
        padding: 1.25rem;
      }
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

  initials = computed(() => {
    const u = this.user();
    if (!u) return 'U';
    return `${u.nombres.charAt(0)}${u.apellidos.charAt(0)}`.toUpperCase();
  });

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}

import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ParametroGeneral } from '../../../core/models/parametro-general.models';
import { ParametroGeneralService } from '../../../core/services/parametro-general.service';
import { RoleHomeShellComponent } from '../../../shared/components/role-home-shell/role-home-shell.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RoleHomeShellComponent, RouterLink],
  template: `
    <app-role-home-shell
      roleLabel="Administrador"
      title="Panel de Administración"
      subtitle="Control centralizado de usuarios, parámetros operativos, calendario de simulacros y operación institucional."
    >
      <section class="stats-strip" aria-label="Resumen operativo">
        <div class="stat-card">
          <div class="stat-icon stat-icon-blue">⏱</div>
          <div>
            <span class="stat-label">Duración simulacro</span>
            <strong class="stat-value">{{ duracionSimulacro() }}</strong>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon-gold">🏫</div>
          <div>
            <span class="stat-label">Nodos concurrentes / día</span>
            <strong class="stat-value">{{ maxNodosDia() }}</strong>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon-indigo">📦</div>
          <div>
            <span class="stat-label">Checkpoint respuestas</span>
            <strong class="stat-value">{{ tamanoLote() }}</strong>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon-green">⚙</div>
          <div>
            <span class="stat-label">Parámetros activos</span>
            <strong class="stat-value">{{ totalParametros() }}</strong>
          </div>
        </div>
      </section>

      <div class="section-header">
        <div>
          <h3>Módulos habilitados</h3>
          <p>Accede a las herramientas administrativas disponibles en la plataforma.</p>
        </div>
      </div>

      <section class="modules-grid">
        <a routerLink="/admin/usuarios" class="module-card module-card-primary">
          <div class="card-head">
            <div class="module-icon icon-users">👥</div>
            <span class="module-tag">Épica 01 · HU-02</span>
          </div>
          <h4>Gestión de Usuarios</h4>
          <p>
            Administra cuentas de administradores, coordinadores, profesores y estudiantes, carga masiva en Excel, exportación y envío de credenciales.
          </p>
          <div class="card-footer">
            <span class="status-pill">Activo</span>
            <span class="module-cta">Administrar usuarios →</span>
          </div>
        </a>

        <a routerLink="/admin/parametros" class="module-card module-card-gold">
          <div class="card-head">
            <div class="module-icon icon-settings">⚙</div>
            <span class="module-tag">Épica 02 · HU-04</span>
          </div>
          <h4>Parámetros Generales</h4>
          <p>
            Configura duración de simulacros, concurrencia máxima de nodos, checkpoints, caché en RAM, retroalimentación y cuotas de correo SMTP.
          </p>
          <div class="card-footer">
            <span class="status-pill">Activo</span>
            <span class="module-cta">Configurar parámetros →</span>
          </div>
        </a>
      </section>
    </app-role-home-shell>
  `,
  styles: [`
    .stats-strip {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 1rem;
      margin-top: 1.5rem;
    }

    .stat-card {
      background: #ffffff;
      border-radius: 14px;
      padding: 1.1rem 1.2rem;
      display: flex;
      align-items: center;
      gap: 0.9rem;
      box-shadow: 0 4px 16px rgba(31, 42, 99, 0.06);
      border: 1px solid #e7ecf6;
    }

    .stat-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      flex-shrink: 0;
    }

    .stat-icon-blue {
      background: #eaf1ff;
      color: #2f5fd0;
    }

    .stat-icon-gold {
      background: #fef6db;
      color: #b78103;
    }

    .stat-icon-indigo {
      background: #eef0ff;
      color: #3f4bb8;
    }

    .stat-icon-green {
      background: #eaf9f0;
      color: #15803d;
    }

    .stat-label {
      display: block;
      font-size: 0.76rem;
      color: #6b7280;
      font-weight: 500;
    }

    .stat-value {
      font-size: 1.15rem;
      font-weight: 700;
      color: #1f2a63;
    }

    .section-header {
      margin-top: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 1rem;
    }

    .section-header h3 {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 700;
      color: #1f2a63;
    }

    .section-header p {
      margin: 0.2rem 0 0;
      font-size: 0.88rem;
      color: #6b7280;
    }

    .modules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.35rem;
      margin-top: 1.1rem;
    }

    .module-card {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      background: #ffffff;
      border-radius: 16px;
      padding: 1.55rem;
      text-decoration: none;
      color: #1f2a63;
      border: 1px solid #e7ecf6;
      border-top: 4px solid #2f5fd0;
      box-shadow: 0 6px 20px rgba(31, 42, 99, 0.07);
      transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
    }

    .module-card-gold {
      border-top-color: #f4c430;
    }

    .module-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 14px 30px rgba(31, 42, 99, 0.12);
    }

    .card-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
    }

    .module-icon {
      width: 46px;
      height: 46px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
    }

    .icon-users {
      background: #eef3ff;
      color: #2f5fd0;
    }

    .icon-settings {
      background: #fef7dc;
      color: #b78103;
    }

    .module-tag {
      font-size: 0.72rem;
      font-weight: 700;
      color: #2f5fd0;
      background: #eef3ff;
      padding: 0.25rem 0.65rem;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .module-card h4 {
      margin: 0;
      font-size: 1.16rem;
      font-weight: 700;
    }

    .module-card p {
      margin: 0;
      color: #4b5563;
      font-size: 0.9rem;
      line-height: 1.55;
      flex: 1;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.75rem;
      border-top: 1px solid #f1f5f9;
      margin-top: 0.25rem;
    }

    .status-pill {
      font-size: 0.74rem;
      font-weight: 600;
      color: #166534;
      background: #ecfdf3;
      border: 1px solid #bbf7d0;
      padding: 0.18rem 0.55rem;
      border-radius: 999px;
    }

    .module-cta {
      font-weight: 700;
      color: #2f5fd0;
      font-size: 0.88rem;
    }
  `]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private readonly parametroService = inject(ParametroGeneralService);
  private subscription?: Subscription;

  private readonly parametros = signal<ParametroGeneral[]>([]);

  private readonly mapa = computed(() => {
    const map = new Map<string, string>();
    for (const p of this.parametros()) {
      map.set(p.clave, p.valor);
    }
    return map;
  });

  duracionSimulacro = computed(() => {
    const val = this.mapa().get('DURACION_SIMULACRO_MINUTOS');
    return val ? `${val} min` : '—';
  });

  maxNodosDia = computed(() => {
    const val = this.mapa().get('MAX_NODOS_CONCURRENTES_DIA');
    return val ? `${val} nodos` : '—';
  });

  tamanoLote = computed(() => {
    const val = this.mapa().get('TAMANO_LOTE_RESPUESTAS');
    return val ? `Cada ${val} resp.` : '—';
  });

  totalParametros = computed(() => {
    const total = this.parametros().length;
    return total > 0 ? `${total} reglas` : '—';
  });

  ngOnInit(): void {
    this.subscription = this.parametroService.listarParametros().subscribe({
      next: (lista) => this.parametros.set(lista),
      error: () => this.parametros.set([])
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}

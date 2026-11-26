import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  ParametroGeneral,
  TipoParametroGeneral
} from '../../../core/models/parametro-general.models';
import { AuthService } from '../../../core/services/auth.service';
import { ParametroGeneralService } from '../../../core/services/parametro-general.service';

export type CategoriaParametro = 'TODAS' | 'SIMULACROS' | 'OPERACION' | 'CORREO';

interface SliderConfig {
  min: number;
  max: number;
  step: number;
}

export interface GrupoParametros {
  categoria: Exclude<CategoriaParametro, 'TODAS'>;
  titulo: string;
  subtitulo: string;
  items: ParametroGeneral[];
}

const INTEGER_REGEX = /^-?\d+$/;

const POSITIVE_INTEGER_KEYS = new Set([
  'MAX_NODOS_CONCURRENTES_DIA',
  'DURACION_SIMULACRO_MINUTOS',
  'TAMANO_LOTE_RESPUESTAS',
  'CACHE_SIMULACROS_TTL_MINUTOS',
  'MAX_CORREOS_POR_DIA'
]);

const NON_NEGATIVE_INTEGER_KEYS = new Set([
  'JITTER_MAXIMO_CHECKPOINT_MS',
  'TIEMPO_GRACIA_CIERRE_SEGUNDOS',
  'VENTANA_ACTIVACION_PROFESOR_MINUTOS',
  'CORREO_DELAY_ENTRE_ENVIOS_MS'
]);

const PARAMETRO_LABELS: Record<string, string> = {
  MAX_NODOS_CONCURRENTES_DIA: 'Máximo de nodos concurrentes por día',
  DURACION_SIMULACRO_MINUTOS: 'Duración estándar del simulacro',
  TAMANO_LOTE_RESPUESTAS: 'Tamaño de lote para checkpoints',
  MOSTRAR_RETROALIMENTACION_SIMULACRO: 'Retroalimentación al finalizar simulacro',
  PERMITIR_CODOCENCIA_SALON: 'Co-docencia en un mismo salón',
  JITTER_MAXIMO_CHECKPOINT_MS: 'Jitter máximo en checkpoints automáticos',
  TIEMPO_GRACIA_CIERRE_SEGUNDOS: 'Tiempo de gracia al cierre del simulacro',
  VENTANA_ACTIVACION_PROFESOR_MINUTOS: 'Ventana previa de activación docente',
  CACHE_SIMULACROS_TTL_MINUTOS: 'Vigencia del caché de simulacros',
  MAX_CORREOS_POR_DIA: 'Límite diario de correos SMTP',
  CORREO_DELAY_ENTRE_ENVIOS_MS: 'Pausa entre envíos de correo'
};

const PARAMETRO_CATEGORIA: Record<string, Exclude<CategoriaParametro, 'TODAS'>> = {
  MAX_NODOS_CONCURRENTES_DIA: 'SIMULACROS',
  DURACION_SIMULACRO_MINUTOS: 'SIMULACROS',
  TAMANO_LOTE_RESPUESTAS: 'SIMULACROS',
  MOSTRAR_RETROALIMENTACION_SIMULACRO: 'SIMULACROS',
  JITTER_MAXIMO_CHECKPOINT_MS: 'SIMULACROS',
  TIEMPO_GRACIA_CIERRE_SEGUNDOS: 'SIMULACROS',
  PERMITIR_CODOCENCIA_SALON: 'OPERACION',
  VENTANA_ACTIVACION_PROFESOR_MINUTOS: 'OPERACION',
  CACHE_SIMULACROS_TTL_MINUTOS: 'OPERACION',
  MAX_CORREOS_POR_DIA: 'CORREO',
  CORREO_DELAY_ENTRE_ENVIOS_MS: 'CORREO'
};

const PARAMETRO_UNIDAD: Record<string, string> = {
  MAX_NODOS_CONCURRENTES_DIA: 'nodos',
  DURACION_SIMULACRO_MINUTOS: 'min',
  TAMANO_LOTE_RESPUESTAS: 'respuestas',
  JITTER_MAXIMO_CHECKPOINT_MS: 'ms',
  TIEMPO_GRACIA_CIERRE_SEGUNDOS: 'seg',
  VENTANA_ACTIVACION_PROFESOR_MINUTOS: 'min',
  CACHE_SIMULACROS_TTL_MINUTOS: 'min',
  MAX_CORREOS_POR_DIA: 'correos',
  CORREO_DELAY_ENTRE_ENVIOS_MS: 'ms'
};

const SLIDER_CONFIG: Record<string, SliderConfig> = {
  MAX_NODOS_CONCURRENTES_DIA: { min: 1, max: 10, step: 1 },
  DURACION_SIMULACRO_MINUTOS: { min: 30, max: 480, step: 15 },
  TAMANO_LOTE_RESPUESTAS: { min: 1, max: 50, step: 1 },
  JITTER_MAXIMO_CHECKPOINT_MS: { min: 0, max: 10000, step: 250 },
  TIEMPO_GRACIA_CIERRE_SEGUNDOS: { min: 0, max: 600, step: 15 },
  VENTANA_ACTIVACION_PROFESOR_MINUTOS: { min: 0, max: 120, step: 5 },
  CACHE_SIMULACROS_TTL_MINUTOS: { min: 15, max: 1440, step: 15 },
  MAX_CORREOS_POR_DIA: { min: 50, max: 2000, step: 50 },
  CORREO_DELAY_ENTRE_ENVIOS_MS: { min: 0, max: 5000, step: 100 }
};

const CATEGORIA_META: Record<
  Exclude<CategoriaParametro, 'TODAS'>,
  { titulo: string; subtitulo: string; orden: number }
> = {
  SIMULACROS: {
    titulo: 'Simulacros y Concurrencia',
    subtitulo: 'Control de capacidad simultánea, duración de prueba, checkpoints y retroalimentación.',
    orden: 1
  },
  OPERACION: {
    titulo: 'Operación Docente y Caché',
    subtitulo: 'Reglas de salones, ventana de activación para profesores y vigencia de caché en RAM.',
    orden: 2
  },
  CORREO: {
    titulo: 'Mensajería SMTP',
    subtitulo: 'Cuotas y cadencia de envío de credenciales de acceso para evitar bloqueos.',
    orden: 3
  }
};

export function validarValorParametro(
  tipo: TipoParametroGeneral,
  clave: string,
  rawValor: string
): string | null {
  const trimmed = String(rawValor ?? '').trim();
  if (trimmed.length === 0) {
    return 'El valor es obligatorio.';
  }

  if (tipo === 'INTEGER') {
    if (!INTEGER_REGEX.test(trimmed)) {
      return 'Ingresa un número entero válido.';
    }
    const parsed = Number(trimmed);
    if (POSITIVE_INTEGER_KEYS.has(clave) && parsed < 1) {
      return 'Debe ser un entero mayor o igual a 1.';
    }
    if (NON_NEGATIVE_INTEGER_KEYS.has(clave) && parsed < 0) {
      return 'Debe ser un entero mayor o igual a 0.';
    }
    return null;
  }

  if (tipo === 'DECIMAL') {
    return Number.isFinite(Number(trimmed)) ? null : 'Ingresa un número decimal válido.';
  }

  if (tipo === 'BOOLEAN') {
    const lower = trimmed.toLowerCase();
    return lower === 'true' || lower === 'false' ? null : 'El valor debe ser true o false.';
  }

  return trimmed.length <= 255 ? null : 'Máximo 255 caracteres.';
}

@Component({
  selector: 'app-parametros-generales',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './parametros-generales.component.html',
  styleUrl: './parametros-generales.component.css'
})
export class ParametrosGeneralesComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly parametroService = inject(ParametroGeneralService);
  private readonly subscriptions = new Subscription();

  user = this.authService.currentUser;
  userInitials = computed(() => {
    const u = this.user();
    if (!u) return 'AD';
    return `${u.nombres.charAt(0)}${u.apellidos.charAt(0)}`.toUpperCase();
  });

  parametros = signal<ParametroGeneral[]>([]);
  borradoresValor = signal<Record<string, string>>({});
  editandoDescClave = signal<string | null>(null);
  borradorDescripcion = signal('');

  cargando = signal(true);
  guardandoClave = signal<string | null>(null);
  mensajeExito = signal('');
  mensajeError = signal('');

  categoriaActiva = signal<CategoriaParametro>('TODAS');
  busqueda = signal('');

  totalParametros = computed(() => this.parametros().length);
  cambiosPendientes = computed(() =>
    this.parametros().filter((p) => this.tieneCambioValor(p)).length
  );

  parametrosFiltrados = computed(() => {
    const cat = this.categoriaActiva();
    const term = this.busqueda().trim().toLowerCase();

    return this.parametros().filter((p) => {
      if (cat !== 'TODAS' && this.categoriaDe(p.clave) !== cat) {
        return false;
      }
      if (!term) {
        return true;
      }
      const label = this.etiquetaAmigable(p.clave).toLowerCase();
      const desc = (p.descripcion ?? '').toLowerCase();
      return (
        p.clave.toLowerCase().includes(term) ||
        label.includes(term) ||
        desc.includes(term)
      );
    });
  });

  gruposFiltrados = computed<GrupoParametros[]>(() => {
    const ordenCategorias: Exclude<CategoriaParametro, 'TODAS'>[] = [
      'SIMULACROS',
      'OPERACION',
      'CORREO'
    ];
    const items = this.parametrosFiltrados();
    const grupos: GrupoParametros[] = [];

    for (const cat of ordenCategorias) {
      const delGrupo = items.filter((p) => this.categoriaDe(p.clave) === cat);
      if (delGrupo.length > 0) {
        grupos.push({
          categoria: cat,
          titulo: CATEGORIA_META[cat].titulo,
          subtitulo: CATEGORIA_META[cat].subtitulo,
          items: delGrupo
        });
      }
    }
    return grupos;
  });

  ngOnInit(): void {
    this.cargarParametros();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  cargarParametros(): void {
    this.cargando.set(true);
    this.mensajeError.set('');

    const sub = this.parametroService.listarParametros().subscribe({
      next: (items) => {
        this.parametros.set(items);
        const drafts: Record<string, string> = {};
        for (const p of items) {
          drafts[p.clave] = p.valor;
        }
        this.borradoresValor.set(drafts);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        this.mensajeError.set(
          this.extraerMensajeError(err, 'No fue posible cargar los parámetros generales.')
        );
      }
    });
    this.subscriptions.add(sub);
  }

  etiquetaAmigable(clave: string): string {
    return PARAMETRO_LABELS[clave] ?? clave;
  }

  categoriaDe(clave: string): Exclude<CategoriaParametro, 'TODAS'> {
    return PARAMETRO_CATEGORIA[clave] ?? 'OPERACION';
  }

  unidadDe(clave: string): string {
    return PARAMETRO_UNIDAD[clave] ?? '';
  }

  sliderDe(param: ParametroGeneral): SliderConfig | null {
    if (param.tipo !== 'INTEGER') {
      return null;
    }
    return SLIDER_CONFIG[param.clave] ?? { min: 0, max: 1000, step: 1 };
  }

  valorActualDe(param: ParametroGeneral): string {
    return this.borradoresValor()[param.clave] ?? param.valor;
  }

  valorNumericoParaSlider(param: ParametroGeneral): number {
    const cfg = this.sliderDe(param);
    if (!cfg) return 0;
    const parsed = Number(this.valorActualDe(param));
    if (!Number.isFinite(parsed)) return cfg.min;
    return Math.min(cfg.max, Math.max(cfg.min, parsed));
  }

  esBooleanoActivo(param: ParametroGeneral): boolean {
    return this.valorActualDe(param).trim().toLowerCase() === 'true';
  }

  tieneCambioValor(param: ParametroGeneral): boolean {
    return this.valorActualDe(param).trim() !== param.valor.trim();
  }

  errorDeValor(param: ParametroGeneral): string | null {
    return validarValorParametro(param.tipo, param.clave, this.valorActualDe(param));
  }

  equivalenciaHumana(param: ParametroGeneral): string | null {
    if (param.tipo !== 'INTEGER') return null;
    const val = Number(this.valorActualDe(param));
    if (!Number.isFinite(val) || val < 0) return null;

    const unidad = this.unidadDe(param.clave);
    if (unidad === 'min' && val >= 60) {
      const h = Math.floor(val / 60);
      const m = val % 60;
      return m === 0 ? `${h} h` : `${h} h ${m} min`;
    }
    if (unidad === 'seg' && val >= 60) {
      const m = Math.floor(val / 60);
      const s = val % 60;
      return s === 0 ? `${m} min` : `${m} min ${s} s`;
    }
    if (unidad === 'ms' && val >= 1000) {
      return `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 2)} s`;
    }
    return null;
  }

  actualizarBusqueda(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.busqueda.set(target?.value ?? '');
  }

  onValorInput(clave: string, event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.actualizarBorradorValor(clave, target?.value ?? '');
  }

  onToggleBooleano(param: ParametroGeneral, event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const nuevo = target?.checked ? 'true' : 'false';
    this.actualizarBorradorValor(param.clave, nuevo);
  }

  ajustarEntero(param: ParametroGeneral, delta: number): void {
    const cfg = this.sliderDe(param);
    const actual = Number(this.valorActualDe(param));
    const base = Number.isFinite(actual) ? actual : cfg?.min ?? 0;
    const minPermitido = POSITIVE_INTEGER_KEYS.has(param.clave) ? 1 : 0;
    const siguiente = Math.max(minPermitido, base + delta);
    this.actualizarBorradorValor(param.clave, String(siguiente));
  }

  actualizarBorradorValor(clave: string, valor: string): void {
    this.mensajeExito.set('');
    this.mensajeError.set('');
    this.borradoresValor.update((map) => ({
      ...map,
      [clave]: valor
    }));
  }

  descartarValor(param: ParametroGeneral): void {
    this.actualizarBorradorValor(param.clave, param.valor);
  }

  guardarValor(param: ParametroGeneral): void {
    const error = this.errorDeValor(param);
    if (error) {
      this.mensajeError.set(error);
      return;
    }

    const nuevoValor = this.valorActualDe(param).trim();
    this.persistirParametro(param.clave, nuevoValor, param.descripcion ?? '');
  }

  iniciarEdicionDescripcion(param: ParametroGeneral): void {
    this.mensajeExito.set('');
    this.mensajeError.set('');
    this.editandoDescClave.set(param.clave);
    this.borradorDescripcion.set(param.descripcion ?? '');
  }

  onDescripcionInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement | null;
    this.borradorDescripcion.set(target?.value ?? '');
  }

  cancelarEdicionDescripcion(): void {
    this.editandoDescClave.set(null);
    this.borradorDescripcion.set('');
  }

  guardarDescripcion(param: ParametroGeneral): void {
    const desc = this.borradorDescripcion().trim();
    if (desc.length > 500) {
      this.mensajeError.set('La descripción no puede superar los 500 caracteres.');
      return;
    }
    this.persistirParametro(param.clave, param.valor, desc, true);
  }

  private persistirParametro(
    clave: string,
    valor: string,
    descripcion: string,
    cerrarDesc = false
  ): void {
    this.guardandoClave.set(clave);
    this.mensajeError.set('');
    this.mensajeExito.set('');

    const sub = this.parametroService
      .actualizarParametro(clave, {
        valor,
        descripcion
      })
      .subscribe({
        next: (actualizado) => {
          this.parametros.update((lista) =>
            lista.map((item) => (item.clave === actualizado.clave ? actualizado : item))
          );
          this.borradoresValor.update((map) => ({
            ...map,
            [actualizado.clave]: actualizado.valor
          }));
          if (cerrarDesc) {
            this.editandoDescClave.set(null);
            this.borradorDescripcion.set('');
          }
          this.guardandoClave.set(null);
          this.mensajeExito.set(
            `Parámetro "${this.etiquetaAmigable(actualizado.clave)}" guardado e invalidado en caché.`
          );
        },
        error: (err: HttpErrorResponse) => {
          this.guardandoClave.set(null);
          this.mensajeError.set(
            this.extraerMensajeError(err, 'No fue posible actualizar el parámetro.')
          );
        }
      });

    this.subscriptions.add(sub);
  }

  volverAlPanel(): void {
    this.router.navigate(['/admin']);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  private extraerMensajeError(err: HttpErrorResponse, fallback: string): string {
    const apiMessage = err.error?.message;
    if (typeof apiMessage === 'string' && apiMessage.trim().length > 0) {
      return apiMessage;
    }
    return fallback;
  }
}

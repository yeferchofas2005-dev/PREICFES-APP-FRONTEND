import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { EnvioCredencialService } from '../../core/services/envio-credencial.service';
import { UserManagementService } from '../../core/services/user-management.service';
import {
  EnvioCredencialItem,
  EnvioCredencialResumen,
  EstadoEnvioCredencial
} from '../../core/models/envio-credencial.models';
import {
  CargaMasivaUsuariosResponse,
  UserManagementScope,
  UsuarioCatalogos,
  UsuarioItem
} from '../../core/models/user-management.models';

const NOMBRE_PERSONA_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ]+(?:[\s'-][a-zA-ZáéíóúÁÉÍÓÚüÜñÑ]+)*$/;
const DOCUMENTO_REGEX = /^[0-9]{5,20}$/;
const CORREO_REGEX = /^[A-Za-zñÑ0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const TELEFONO_REGEX = /^\+?[0-9]{7,15}$/;

function trimmedRequiredValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const val = control.value;
    if (val === null || val === undefined) {
      return { required: true };
    }
    return String(val).trim().length === 0 ? { required: true } : null;
  };
}

function trimmedPatternValidator(regex: RegExp, errorKey: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = control.value;
    if (raw === null || raw === undefined) {
      return null;
    }
    const trimmed = String(raw).trim();
    if (trimmed.length === 0) {
      return null;
    }
    return regex.test(trimmed) ? null : { [errorKey]: true };
  };
}

function trimmedMinLengthValidator(minLength: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = control.value;
    if (raw === null || raw === undefined) {
      return null;
    }
    const trimmed = String(raw).trim();
    if (trimmed.length === 0) {
      return null;
    }
    return trimmed.length >= minLength ? null : { minlengthTrim: { requiredLength: minLength } };
  };
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css'
})
export class UserManagementComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private userMgmtService = inject(UserManagementService);
  private envioCredencialService = inject(EnvioCredencialService);

  scope = signal<UserManagementScope>('admin');
  isAdmin = computed(() => this.scope() === 'admin');
  currentUserId = computed(() => this.authService.currentUser()?.idUsuario ?? null);

  usuarios = signal<UsuarioItem[]>([]);
  catalogos = signal<UsuarioCatalogos>({ roles: [], nodos: [] });
  paginaActual = signal(0);
  tamanoPagina = signal(10);
  totalElementos = signal(0);
  totalPaginas = signal(0);

  filtroBusqueda = signal('');
  filtroIdRol = signal<number | null>(null);
  filtroIdNodo = signal<number | null>(null);
  filtroActivo = signal<boolean | null>(null);

  cargando = signal(true);
  guardando = signal(false);
  cambiandoEstadoId = signal<number | null>(null);
  errorMensaje = signal('');
  exitoMensaje = signal('');

  modalAbierto = signal(false);
  usuarioEditando = signal<UsuarioItem | null>(null);
  modalError = signal('');
  intentoGuardar = signal(false);

  modalMasivoAbierto = signal(false);
  archivoMasivo = signal<File | null>(null);
  nodoMasivoId = signal<number | null>(null);
  encolarEnvioMasivo = signal(false);
  cargandoMasivo = signal(false);
  descargandoPlantilla = signal(false);
  exportando = signal(false);
  errorMasivo = signal('');
  resultadoMasivo = signal<CargaMasivaUsuariosResponse | null>(null);

  resumenEnvio = signal<EnvioCredencialResumen | null>(null);
  modalMonitorAbierto = signal(false);
  confirmacionSinCorreoTipo = signal<'CREAR' | 'MASIVO' | null>(null);
  registrosEnvio = signal<EnvioCredencialItem[]>([]);
  monitorFiltroEstado = signal<EstadoEnvioCredencial | null>(null);
  monitorPaginaActual = signal(0);
  monitorTotalElementos = signal(0);
  monitorTotalPaginas = signal(0);
  cargandoMonitor = signal(false);
  accionMonitorEnCurso = signal(false);
  mensajeMonitor = signal('');
  errorMonitor = signal('');

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private monitorInterval: ReturnType<typeof setInterval> | null = null;
  private rolSub: Subscription | null = null;

  userForm = this.fb.group({
    nombres: ['', [trimmedRequiredValidator(), Validators.maxLength(100), trimmedPatternValidator(NOMBRE_PERSONA_REGEX, 'formatoNombre')]],
    apellidos: ['', [trimmedRequiredValidator(), Validators.maxLength(100), trimmedPatternValidator(NOMBRE_PERSONA_REGEX, 'formatoNombre')]],
    documento: ['', [trimmedRequiredValidator(), trimmedPatternValidator(DOCUMENTO_REGEX, 'formatoDocumento')]],
    correo: ['', [trimmedRequiredValidator(), Validators.maxLength(150), trimmedPatternValidator(CORREO_REGEX, 'formatoCorreo')]],
    telefono: ['', [trimmedPatternValidator(TELEFONO_REGEX, 'formatoTelefono')]],
    password: [''],
    idRol: [null as number | null, [Validators.required]],
    idNodo: [null as number | null],
    activo: [true],
    enviarCredencialesPorCorreo: [false]
  });

  ngOnInit(): void {
    const routeScope = (this.route.snapshot.data['scope'] as UserManagementScope | undefined) ?? 'admin';
    this.scope.set(routeScope);
    this.rolSub = this.userForm.controls.idRol.valueChanges.subscribe(() => {
      this.actualizarValidadorNodo();
    });
    this.cargarCatalogos();
    this.cargarUsuarios(0);
    this.cargarResumenEnvios();
  }

  ngOnDestroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.rolSub) {
      this.rolSub.unsubscribe();
      this.rolSub = null;
    }
    this.detenerPollingMonitor();
  }

  cargarCatalogos(): void {
    this.userMgmtService.obtenerCatalogos(this.scope()).subscribe({
      next: (data) => this.catalogos.set(data),
      error: () => this.errorMensaje.set('No se pudieron cargar los catálogos de roles y nodos.')
    });
  }

  cargarUsuarios(pagina = this.paginaActual()): void {
    this.cargando.set(true);
    this.errorMensaje.set('');

    this.userMgmtService
      .listar(this.scope(), {
        busqueda: this.filtroBusqueda(),
        idRol: this.filtroIdRol(),
        idNodo: this.filtroIdNodo(),
        activo: this.filtroActivo(),
        page: pagina,
        size: this.tamanoPagina()
      })
      .subscribe({
        next: (res) => {
          this.usuarios.set(res.contenido);
          this.paginaActual.set(res.paginaActual);
          this.totalElementos.set(res.totalElementos);
          this.totalPaginas.set(res.totalPaginas);
          this.cargando.set(false);
        },
        error: (err: unknown) => {
          this.cargando.set(false);
          this.errorMensaje.set(this.extraerMensajeError(err, 'No se pudo cargar el listado de usuarios.'));
        }
      });
  }

  onBusquedaInput(valor: string): void {
    this.filtroBusqueda.set(valor);
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.cargarUsuarios(0);
    }, 350);
  }

  onRolFilterChange(valor: string): void {
    this.filtroIdRol.set(valor ? Number(valor) : null);
    this.cargarUsuarios(0);
  }

  onNodoFilterChange(valor: string): void {
    this.filtroIdNodo.set(valor ? Number(valor) : null);
    this.cargarUsuarios(0);
  }

  onEstadoFilterChange(valor: string): void {
    if (valor === 'true') this.filtroActivo.set(true);
    else if (valor === 'false') this.filtroActivo.set(false);
    else this.filtroActivo.set(null);
    this.cargarUsuarios(0);
  }

  limpiarFiltros(): void {
    this.filtroBusqueda.set('');
    this.filtroIdRol.set(null);
    this.filtroIdNodo.set(null);
    this.filtroActivo.set(null);
    this.cargarUsuarios(0);
  }

  abrirModalCrear(): void {
    this.usuarioEditando.set(null);
    this.modalError.set('');
    this.intentoGuardar.set(false);
    const nodos = this.catalogos().nodos;
    const defaultNodo = !this.isAdmin() && nodos.length > 0 ? nodos[0].idNodo : null;
    const roles = this.catalogos().roles;
    const defaultRol = !this.isAdmin() && roles.length > 0 ? roles[roles.length - 1].idRol : null;

    this.userForm.reset({
      nombres: '',
      apellidos: '',
      documento: '',
      correo: '',
      telefono: '',
      password: '',
      idRol: defaultRol,
      idNodo: defaultNodo,
      activo: true,
      enviarCredencialesPorCorreo: false
    });

    this.userForm.controls.password.setValidators([
      trimmedRequiredValidator(),
      trimmedMinLengthValidator(6),
      Validators.maxLength(100)
    ]);
    this.userForm.controls.password.updateValueAndValidity();
    this.actualizarValidadorNodo();
    this.modalAbierto.set(true);
  }

  abrirModalEditar(usuario: UsuarioItem): void {
    this.usuarioEditando.set(usuario);
    this.modalError.set('');
    this.intentoGuardar.set(false);

    this.userForm.reset({
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      documento: usuario.documento,
      correo: usuario.correo,
      telefono: usuario.telefono ?? '',
      password: '',
      idRol: usuario.rol?.idRol ?? null,
      idNodo: usuario.nodo?.idNodo ?? null,
      activo: usuario.activo,
      enviarCredencialesPorCorreo: false
    });

    this.userForm.controls.password.setValidators([
      trimmedMinLengthValidator(6),
      Validators.maxLength(100)
    ]);
    this.userForm.controls.password.updateValueAndValidity();
    this.actualizarValidadorNodo();
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.confirmacionSinCorreoTipo.set(null);
    this.intentoGuardar.set(false);
    this.modalAbierto.set(false);
    this.modalError.set('');
  }

  guardarUsuario(omitirConfirmacionCorreo = false): void {
    this.actualizarValidadorNodo();
    if (this.userForm.invalid) {
      this.intentoGuardar.set(true);
      this.userForm.markAllAsTouched();
      const faltantes = this.obtenerEtiquetasCamposInvalidos();
      this.modalError.set(
        faltantes.length > 0
          ? `Revisa los siguientes campos antes de continuar: ${faltantes.join(', ')}.`
          : 'Revisa los campos marcados en rojo antes de continuar.'
      );
      return;
    }

    const raw = this.userForm.getRawValue();
    const editando = this.usuarioEditando();
    const passwordTrim = raw.password?.trim() ?? '';

    if (editando && passwordTrim.length > 0 && passwordTrim.length < 6) {
      this.modalError.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (!editando && !raw.enviarCredencialesPorCorreo && !omitirConfirmacionCorreo) {
      this.confirmacionSinCorreoTipo.set('CREAR');
      return;
    }

    this.guardando.set(true);
    this.modalError.set('');
    this.exitoMensaje.set('');

    const payloadBase = {
      nombres: raw.nombres!.trim(),
      apellidos: raw.apellidos!.trim(),
      documento: raw.documento!.trim(),
      correo: raw.correo!.trim(),
      telefono: raw.telefono?.trim() || null,
      idRol: Number(raw.idRol),
      idNodo: raw.idNodo ? Number(raw.idNodo) : null,
      activo: raw.activo ?? true
    };

    const obs$ = editando
      ? this.userMgmtService.actualizar(this.scope(), editando.idUsuario, {
          ...payloadBase,
          password: passwordTrim.length > 0 ? passwordTrim : null
        })
      : this.userMgmtService.crear(this.scope(), {
          ...payloadBase,
          password: passwordTrim,
          enviarCredencialesPorCorreo: Boolean(raw.enviarCredencialesPorCorreo)
        });

    obs$.subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarModal();
        this.exitoMensaje.set(editando ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.');
        this.cargarUsuarios(editando ? this.paginaActual() : 0);
        if (!editando && raw.enviarCredencialesPorCorreo) {
          this.cargarResumenEnvios();
        }
      },
      error: (err: unknown) => {
        this.guardando.set(false);
        this.modalError.set(this.extraerMensajeError(err, 'No se pudo guardar el usuario.'));
      }
    });
  }

  toggleEstado(usuario: UsuarioItem): void {
    const nuevoEstado = !usuario.activo;
    this.cambiandoEstadoId.set(usuario.idUsuario);
    this.errorMensaje.set('');
    this.exitoMensaje.set('');

    this.userMgmtService.cambiarEstado(this.scope(), usuario.idUsuario, nuevoEstado).subscribe({
      next: () => {
        this.cambiandoEstadoId.set(null);
        this.exitoMensaje.set(
          `Usuario ${usuario.nombres} ${nuevoEstado ? 'activado' : 'inactivado'} correctamente.`
        );
        this.cargarUsuarios(this.paginaActual());
      },
      error: (err: unknown) => {
        this.cambiandoEstadoId.set(null);
        this.errorMensaje.set(this.extraerMensajeError(err, 'No se pudo cambiar el estado del usuario.'));
      }
    });
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina < 0 || nuevaPagina >= this.totalPaginas()) return;
    this.cargarUsuarios(nuevaPagina);
  }

  volverAlPanel(): void {
    this.router.navigate([this.isAdmin() ? '/admin' : '/coordinador']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  rolSeleccionadoRequiereNodo(): boolean {
    const idRol = this.userForm.controls.idRol.value;
    if (!idRol) return !this.isAdmin();
    const rol = this.catalogos().roles.find(r => r.idRol === Number(idRol));
    return rol?.nombre !== 'ADMIN';
  }

  errorCampo(
    campo: 'nombres' | 'apellidos' | 'documento' | 'telefono' | 'correo' | 'idRol' | 'idNodo' | 'password'
  ): string {
    const control = this.userForm.controls[campo];
    if (!control || !control.invalid || !(control.touched || this.intentoGuardar())) {
      return '';
    }
    const errors = control.errors;
    if (!errors) return '';

    if (errors['required']) {
      switch (campo) {
        case 'nombres': return 'Los nombres son obligatorios.';
        case 'apellidos': return 'Los apellidos son obligatorios.';
        case 'documento': return 'El documento es obligatorio.';
        case 'correo': return 'El correo electrónico es obligatorio.';
        case 'idRol': return 'Debes seleccionar un rol.';
        case 'idNodo': return 'Debes asignar un nodo para este rol.';
        case 'password': return 'La contraseña es obligatoria.';
        default: return 'Este campo es obligatorio.';
      }
    }
    if (errors['formatoNombre']) {
      return 'Solo debe contener letras y espacios.';
    }
    if (errors['formatoDocumento']) {
      return 'Solo se permiten números (entre 5 y 20 dígitos).';
    }
    if (errors['formatoCorreo']) {
      return 'Ingresa un correo válido (ej: nombre@dominio.com).';
    }
    if (errors['formatoTelefono']) {
      return 'Solo se permiten números (7 a 15 dígitos, opcional + inicial).';
    }
    if (errors['minlengthTrim']) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }
    if (errors['maxlength']) {
      return `Supera la longitud máxima permitida (${errors['maxlength'].requiredLength} caracteres).`;
    }
    return 'Valor inválido.';
  }

  private actualizarValidadorNodo(): void {
    const nodoCtrl = this.userForm.controls.idNodo;
    if (this.rolSeleccionadoRequiereNodo()) {
      nodoCtrl.setValidators([Validators.required]);
    } else {
      nodoCtrl.clearValidators();
    }
    nodoCtrl.updateValueAndValidity({ emitEvent: false });
  }

  private obtenerEtiquetasCamposInvalidos(): string[] {
    const mapa: Array<[keyof typeof this.userForm.controls, string]> = [
      ['nombres', 'Nombres'],
      ['apellidos', 'Apellidos'],
      ['documento', 'Documento'],
      ['telefono', 'Teléfono'],
      ['correo', 'Correo'],
      ['idRol', 'Rol'],
      ['idNodo', 'Nodo'],
      ['password', 'Contraseña']
    ];
    return mapa
      .filter(([key]) => this.userForm.controls[key].invalid)
      .map(([, label]) => label);
  }

  abrirModalMasivo(): void {
    this.archivoMasivo.set(null);
    this.encolarEnvioMasivo.set(false);
    this.errorMasivo.set('');
    this.resultadoMasivo.set(null);
    const nodos = this.catalogos().nodos;
    this.nodoMasivoId.set(!this.isAdmin() && nodos.length > 0 ? nodos[0].idNodo : null);
    this.modalMasivoAbierto.set(true);
  }

  cerrarModalMasivo(): void {
    this.confirmacionSinCorreoTipo.set(null);
    this.modalMasivoAbierto.set(false);
    this.errorMasivo.set('');
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;
    this.archivoMasivo.set(file);
    this.errorMasivo.set('');
  }

  onNodoMasivoChange(valor: string): void {
    this.nodoMasivoId.set(valor ? Number(valor) : null);
  }

  descargarPlantilla(): void {
    this.descargandoPlantilla.set(true);
    this.errorMasivo.set('');

    this.userMgmtService.descargarPlantilla(this.scope()).subscribe({
      next: (blob) => {
        this.descargandoPlantilla.set(false);
        this.dispararDescargaBlob(blob, 'plantilla_carga_estudiantes.xlsx');
      },
      error: (err: unknown) => {
        this.descargandoPlantilla.set(false);
        this.errorMasivo.set(this.extraerMensajeError(err, 'No se pudo descargar la plantilla Excel.'));
      }
    });
  }

  exportarExcel(): void {
    this.exportando.set(true);
    this.errorMensaje.set('');

    this.userMgmtService
      .exportarExcel(this.scope(), {
        busqueda: this.filtroBusqueda(),
        idRol: this.filtroIdRol(),
        idNodo: this.filtroIdNodo(),
        activo: this.filtroActivo()
      })
      .subscribe({
        next: (blob) => {
          this.exportando.set(false);
          const nombreArchivo = this.isAdmin() ? 'usuarios_rumbo_a_la_u.xlsx' : 'usuarios_nodo.xlsx';
          this.dispararDescargaBlob(blob, nombreArchivo);
        },
        error: (err: unknown) => {
          this.exportando.set(false);
          this.errorMensaje.set(this.extraerMensajeError(err, 'No se pudo exportar el archivo Excel.'));
        }
      });
  }

  private dispararDescargaBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  ejecutarCargaMasiva(omitirConfirmacionCorreo = false): void {
    const file = this.archivoMasivo();
    if (!file) {
      this.errorMasivo.set('Selecciona un archivo .xlsx antes de importar.');
      return;
    }
    if (this.isAdmin() && !this.nodoMasivoId()) {
      this.errorMasivo.set('Selecciona el nodo destino para los estudiantes.');
      return;
    }

    if (!this.encolarEnvioMasivo() && !omitirConfirmacionCorreo) {
      this.confirmacionSinCorreoTipo.set('MASIVO');
      return;
    }

    this.cargandoMasivo.set(true);
    this.errorMasivo.set('');
    this.resultadoMasivo.set(null);

    this.userMgmtService
      .cargarMasiva(this.scope(), file, this.nodoMasivoId(), this.encolarEnvioMasivo())
      .subscribe({
        next: (res) => {
          this.cargandoMasivo.set(false);
          this.resultadoMasivo.set(res);
          if (res.exitosos > 0) {
            this.cargarUsuarios(0);
          }
          if (res.encoladosParaEnvio > 0) {
            this.cargarResumenEnvios();
          }
        },
        error: (err: unknown) => {
          this.cargandoMasivo.set(false);
          this.errorMasivo.set(this.extraerMensajeError(err, 'No se pudo procesar el archivo Excel.'));
        }
      });
  }

  cancelarConfirmacionSinCorreo(): void {
    this.confirmacionSinCorreoTipo.set(null);
  }

  continuarSinEnviarCorreo(): void {
    const tipo = this.confirmacionSinCorreoTipo();
    this.confirmacionSinCorreoTipo.set(null);
    if (tipo === 'CREAR') {
      this.guardarUsuario(true);
    } else if (tipo === 'MASIVO') {
      this.ejecutarCargaMasiva(true);
    }
  }

  activarCorreoYContinuar(): void {
    const tipo = this.confirmacionSinCorreoTipo();
    this.confirmacionSinCorreoTipo.set(null);
    if (tipo === 'CREAR') {
      this.userForm.controls.enviarCredencialesPorCorreo.setValue(true);
      this.guardarUsuario(true);
    } else if (tipo === 'MASIVO') {
      this.encolarEnvioMasivo.set(true);
      this.ejecutarCargaMasiva(true);
    }
  }

  cargarResumenEnvios(): void {
    this.envioCredencialService.obtenerResumen(this.scope()).subscribe({
      next: (res) => {
        this.resumenEnvio.set(res);
        if (res.loteEnProceso || this.modalMonitorAbierto()) {
          this.asegurarPollingMonitor();
        } else {
          this.detenerPollingMonitor();
        }
      },
      error: () => {
        // Silencioso en la barra superior para no bloquear la gestion de usuarios
      }
    });
  }

  abrirModalMonitor(): void {
    this.mensajeMonitor.set('');
    this.errorMonitor.set('');
    this.modalMonitorAbierto.set(true);
    this.cargarResumenEnvios();
    this.cargarRegistrosMonitor(0);
    this.asegurarPollingMonitor();
  }

  cerrarModalMonitor(): void {
    this.modalMonitorAbierto.set(false);
    if (!this.resumenEnvio()?.loteEnProceso) {
      this.detenerPollingMonitor();
    }
  }

  cargarRegistrosMonitor(pagina = this.monitorPaginaActual()): void {
    this.cargandoMonitor.set(true);
    this.envioCredencialService
      .listarRegistros(this.scope(), this.monitorFiltroEstado(), pagina, 8)
      .subscribe({
        next: (res) => {
          this.registrosEnvio.set(res.contenido);
          this.monitorPaginaActual.set(res.paginaActual);
          this.monitorTotalElementos.set(res.totalElementos);
          this.monitorTotalPaginas.set(res.totalPaginas);
          this.cargandoMonitor.set(false);
        },
        error: (err: unknown) => {
          this.cargandoMonitor.set(false);
          this.errorMonitor.set(this.extraerMensajeError(err, 'No se pudo cargar el detalle de envíos.'));
        }
      });
  }

  onMonitorEstadoChange(valor: string): void {
    this.monitorFiltroEstado.set(valor ? (valor as EstadoEnvioCredencial) : null);
    this.cargarRegistrosMonitor(0);
  }

  procesarLoteHoy(): void {
    this.accionMonitorEnCurso.set(true);
    this.mensajeMonitor.set('');
    this.errorMonitor.set('');

    this.envioCredencialService.procesarLote(this.scope()).subscribe({
      next: (res) => {
        this.accionMonitorEnCurso.set(false);
        this.mensajeMonitor.set(res.mensaje);
        this.cargarResumenEnvios();
        this.cargarRegistrosMonitor(0);
      },
      error: (err: unknown) => {
        this.accionMonitorEnCurso.set(false);
        this.errorMonitor.set(this.extraerMensajeError(err, 'No se pudo iniciar el lote de envíos.'));
      }
    });
  }

  reintentarFallidos(): void {
    this.accionMonitorEnCurso.set(true);
    this.mensajeMonitor.set('');
    this.errorMonitor.set('');

    this.envioCredencialService.reintentarFallidos(this.scope()).subscribe({
      next: (res) => {
        this.accionMonitorEnCurso.set(false);
        this.mensajeMonitor.set(res.mensaje);
        this.cargarResumenEnvios();
        this.cargarRegistrosMonitor(0);
      },
      error: (err: unknown) => {
        this.accionMonitorEnCurso.set(false);
        this.errorMonitor.set(this.extraerMensajeError(err, 'No se pudieron reencolar los envíos fallidos.'));
      }
    });
  }

  private asegurarPollingMonitor(): void {
    if (this.monitorInterval) return;
    this.monitorInterval = setInterval(() => {
      this.cargarResumenEnvios();
      if (this.modalMonitorAbierto()) {
        this.cargarRegistrosMonitor(this.monitorPaginaActual());
      }
    }, 5000);
  }

  private detenerPollingMonitor(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }

  private extraerMensajeError(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      const valErrors = err.error?.validationErrors;
      if (valErrors && typeof valErrors === 'object') {
        const detalles = Object.values(valErrors).filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
        if (detalles.length > 0) {
          return detalles.join(' · ');
        }
      }
      const msg = err.error?.message;
      if (typeof msg === 'string' && msg.trim().length > 0) {
        return msg;
      }
    }
    return fallback;
  }
}

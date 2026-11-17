import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { UserManagementService } from '../../core/services/user-management.service';
import {
  CargaMasivaUsuariosResponse,
  UserManagementScope,
  UsuarioCatalogos,
  UsuarioItem
} from '../../core/models/user-management.models';

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

  modalMasivoAbierto = signal(false);
  archivoMasivo = signal<File | null>(null);
  nodoMasivoId = signal<number | null>(null);
  cargandoMasivo = signal(false);
  descargandoPlantilla = signal(false);
  exportando = signal(false);
  errorMasivo = signal('');
  resultadoMasivo = signal<CargaMasivaUsuariosResponse | null>(null);

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  userForm = this.fb.group({
    nombres: ['', [Validators.required, Validators.maxLength(100)]],
    apellidos: ['', [Validators.required, Validators.maxLength(100)]],
    documento: ['', [Validators.required, Validators.maxLength(20)]],
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    telefono: ['', [Validators.maxLength(20)]],
    password: [''],
    idRol: [null as number | null, [Validators.required]],
    idNodo: [null as number | null],
    activo: [true]
  });

  ngOnInit(): void {
    const routeScope = (this.route.snapshot.data['scope'] as UserManagementScope | undefined) ?? 'admin';
    this.scope.set(routeScope);
    this.cargarCatalogos();
    this.cargarUsuarios(0);
  }

  ngOnDestroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
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
      activo: true
    });

    this.userForm.controls.password.setValidators([Validators.required, Validators.minLength(6), Validators.maxLength(100)]);
    this.userForm.controls.password.updateValueAndValidity();
    this.modalAbierto.set(true);
  }

  abrirModalEditar(usuario: UsuarioItem): void {
    this.usuarioEditando.set(usuario);
    this.modalError.set('');

    this.userForm.reset({
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      documento: usuario.documento,
      correo: usuario.correo,
      telefono: usuario.telefono ?? '',
      password: '',
      idRol: usuario.rol?.idRol ?? null,
      idNodo: usuario.nodo?.idNodo ?? null,
      activo: usuario.activo
    });

    this.userForm.controls.password.setValidators([Validators.minLength(6), Validators.maxLength(100)]);
    this.userForm.controls.password.updateValueAndValidity();
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.modalError.set('');
  }

  guardarUsuario(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const raw = this.userForm.getRawValue();
    const editando = this.usuarioEditando();
    const passwordTrim = raw.password?.trim() ?? '';

    if (editando && passwordTrim.length > 0 && passwordTrim.length < 6) {
      this.modalError.set('La contraseña debe tener al menos 6 caracteres.');
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
          password: passwordTrim
        });

    obs$.subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarModal();
        this.exitoMensaje.set(editando ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.');
        this.cargarUsuarios(editando ? this.paginaActual() : 0);
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

  abrirModalMasivo(): void {
    this.archivoMasivo.set(null);
    this.errorMasivo.set('');
    this.resultadoMasivo.set(null);
    const nodos = this.catalogos().nodos;
    this.nodoMasivoId.set(!this.isAdmin() && nodos.length > 0 ? nodos[0].idNodo : null);
    this.modalMasivoAbierto.set(true);
  }

  cerrarModalMasivo(): void {
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

  ejecutarCargaMasiva(): void {
    const file = this.archivoMasivo();
    if (!file) {
      this.errorMasivo.set('Selecciona un archivo .xlsx antes de importar.');
      return;
    }
    if (this.isAdmin() && !this.nodoMasivoId()) {
      this.errorMasivo.set('Selecciona el nodo destino para los estudiantes.');
      return;
    }

    this.cargandoMasivo.set(true);
    this.errorMasivo.set('');
    this.resultadoMasivo.set(null);

    this.userMgmtService.cargarMasiva(this.scope(), file, this.nodoMasivoId()).subscribe({
      next: (res) => {
        this.cargandoMasivo.set(false);
        this.resultadoMasivo.set(res);
        if (res.exitosos > 0) {
          this.cargarUsuarios(0);
        }
      },
      error: (err: unknown) => {
        this.cargandoMasivo.set(false);
        this.errorMasivo.set(this.extraerMensajeError(err, 'No se pudo procesar el archivo Excel.'));
      }
    });
  }

  private extraerMensajeError(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      const msg = err.error?.message;
      if (typeof msg === 'string' && msg.trim().length > 0) {
        return msg;
      }
    }
    return fallback;
  }
}

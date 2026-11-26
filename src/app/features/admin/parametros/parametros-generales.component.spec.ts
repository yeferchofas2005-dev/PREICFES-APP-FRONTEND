import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { HttpErrorResponse } from '@angular/common/http';
import { ParametrosGeneralesComponent } from './parametros-generales.component';
import { ParametroGeneralService } from '../../../core/services/parametro-general.service';
import { AuthService } from '../../../core/services/auth.service';
import { ParametroGeneral } from '../../../core/models/parametro-general.models';

describe('ParametrosGeneralesComponent', () => {
  const parametrosMock: ParametroGeneral[] = [
    {
      idParametro: 1,
      clave: 'DURACION_SIMULACRO_MINUTOS',
      valor: '240',
      descripcion: 'Duración estándar',
      tipo: 'INTEGER',
      fechaActualizacion: '2026-11-23T12:00:00'
    },
    {
      idParametro: 2,
      clave: 'MAX_NODOS_CONCURRENTES_DIA',
      valor: '2',
      descripcion: 'Nodos simultáneos',
      tipo: 'INTEGER',
      fechaActualizacion: '2026-11-23T12:00:00'
    },
    {
      idParametro: 3,
      clave: 'JITTER_MAXIMO_CHECKPOINT_MS',
      valor: '2000',
      descripcion: 'Jitter checkpoints',
      tipo: 'INTEGER',
      fechaActualizacion: null
    },
    {
      idParametro: 4,
      clave: 'MOSTRAR_RETROALIMENTACION_SIMULACRO',
      valor: 'false',
      descripcion: 'Mostrar retroalimentación',
      tipo: 'BOOLEAN',
      fechaActualizacion: null
    }
  ];

  let parametroServiceMock: {
    listarParametros: ReturnType<typeof vi.fn>;
    actualizarParametro: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    parametroServiceMock = {
      listarParametros: vi.fn().mockReturnValue(of(parametrosMock)),
      actualizarParametro: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ParametrosGeneralesComponent],
      providers: [
        provideRouter([]),
        { provide: ParametroGeneralService, useValue: parametroServiceMock },
        { provide: AuthService, useValue: { logout: vi.fn(), currentUser: () => null } }
      ]
    }).compileComponents();
  });

  it('debe cargar los parametros y agruparlos al inicializar', () => {
    const fixture = TestBed.createComponent(ParametrosGeneralesComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.cargando()).toBe(false);
    expect(component.totalParametros()).toBe(4);
    expect(component.gruposFiltrados()).toHaveLength(1);
    expect(component.cambiosPendientes()).toBe(0);
  });

  it('debe validar enteros positivos, ajustar con stepper y guardar cambios', () => {
    const actualizado: ParametroGeneral = {
      ...parametrosMock[0],
      valor: '300'
    };
    parametroServiceMock.actualizarParametro.mockReturnValue(of(actualizado));

    const fixture = TestBed.createComponent(ParametrosGeneralesComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.actualizarBorradorValor('DURACION_SIMULACRO_MINUTOS', '0');
    expect(component.errorDeValor(parametrosMock[0])).toBe(
      'Debe ser un entero mayor o igual a 1.'
    );

    component.actualizarBorradorValor('DURACION_SIMULACRO_MINUTOS', '285');
    component.ajustarEntero(parametrosMock[0], 15);
    expect(component.valorActualDe(parametrosMock[0])).toBe('300');
    expect(component.equivalenciaHumana(parametrosMock[0])).toBe('5 h');
    expect(component.tieneCambioValor(parametrosMock[0])).toBe(true);

    component.guardarValor(parametrosMock[0]);

    expect(parametroServiceMock.actualizarParametro).toHaveBeenCalledWith(
      'DURACION_SIMULACRO_MINUTOS',
      { valor: '300', descripcion: 'Duración estándar' }
    );
    expect(component.parametros()[0].valor).toBe('300');
    expect(component.cambiosPendientes()).toBe(0);
    expect(component.mensajeExito()).toContain('guardado e invalidado en caché');
  });

  it('debe permitir cero y rechazar negativos en parametros no negativos como jitter', () => {
    const fixture = TestBed.createComponent(ParametrosGeneralesComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.actualizarBorradorValor('JITTER_MAXIMO_CHECKPOINT_MS', '-5');
    expect(component.errorDeValor(parametrosMock[2])).toBe(
      'Debe ser un entero mayor o igual a 0.'
    );

    component.actualizarBorradorValor('JITTER_MAXIMO_CHECKPOINT_MS', '0');
    expect(component.errorDeValor(parametrosMock[2])).toBeNull();
  });

  it('debe permitir editar y guardar solo la descripcion de un parametro', () => {
    const actualizado: ParametroGeneral = {
      ...parametrosMock[3],
      descripcion: 'Controla visibilidad de respuestas'
    };
    parametroServiceMock.actualizarParametro.mockReturnValue(of(actualizado));

    const fixture = TestBed.createComponent(ParametrosGeneralesComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.iniciarEdicionDescripcion(parametrosMock[3]);
    component.borradorDescripcion.set('Controla visibilidad de respuestas');
    component.guardarDescripcion(parametrosMock[3]);

    expect(parametroServiceMock.actualizarParametro).toHaveBeenCalledWith(
      'MOSTRAR_RETROALIMENTACION_SIMULACRO',
      { valor: 'false', descripcion: 'Controla visibilidad de respuestas' }
    );
    expect(component.editandoDescClave()).toBeNull();
  });

  it('debe mostrar mensaje de error si falla la actualizacion y filtrar por busqueda', () => {
    parametroServiceMock.actualizarParametro.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { message: 'El parámetro debe ser mayor o igual a 1' }
          })
      )
    );

    const fixture = TestBed.createComponent(ParametrosGeneralesComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.actualizarBorradorValor('MAX_NODOS_CONCURRENTES_DIA', '4');
    component.guardarValor(parametrosMock[1]);

    expect(component.guardandoClave()).toBeNull();
    expect(component.mensajeError()).toBe('El parámetro debe ser mayor o igual a 1');

    component.categoriaActiva.set('CORREO');
    expect(component.parametrosFiltrados()).toHaveLength(0);

    component.categoriaActiva.set('SIMULACROS');
    component.busqueda.set('duración');
    expect(component.parametrosFiltrados()).toHaveLength(1);
    expect(component.parametrosFiltrados()[0].clave).toBe('DURACION_SIMULACRO_MINUTOS');
  });
});

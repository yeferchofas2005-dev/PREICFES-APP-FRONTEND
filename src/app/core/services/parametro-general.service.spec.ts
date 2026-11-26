import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ParametroGeneralService } from './parametro-general.service';
import { ParametroGeneral } from '../models/parametro-general.models';

describe('ParametroGeneralService', () => {
  let service: ParametroGeneralService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ParametroGeneralService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe listar todos los parametros desde /api/admin/parametros', () => {
    const mockLista: ParametroGeneral[] = [
      {
        idParametro: 1,
        clave: 'MAX_NODOS_CONCURRENTES_DIA',
        valor: '2',
        descripcion: 'Max nodos',
        tipo: 'INTEGER',
        fechaActualizacion: null
      }
    ];

    let resultado: ParametroGeneral[] = [];
    service.listarParametros().subscribe((data) => (resultado = data));

    const req = httpMock.expectOne('/api/admin/parametros');
    expect(req.request.method).toBe('GET');
    req.flush(mockLista);

    expect(resultado).toEqual(mockLista);
  });

  it('debe actualizar un parametro mediante PUT', () => {
    const actualizado: ParametroGeneral = {
      idParametro: 2,
      clave: 'DURACION_SIMULACRO_MINUTOS',
      valor: '300',
      descripcion: '5 horas',
      tipo: 'INTEGER',
      fechaActualizacion: '2026-11-23T17:00:00'
    };

    let respuesta: ParametroGeneral | undefined;
    service
      .actualizarParametro('DURACION_SIMULACRO_MINUTOS', {
        valor: '300',
        descripcion: '5 horas'
      })
      .subscribe((data) => (respuesta = data));

    const req = httpMock.expectOne('/api/admin/parametros/DURACION_SIMULACRO_MINUTOS');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ valor: '300', descripcion: '5 horas' });
    req.flush(actualizado);

    expect(respuesta).toEqual(actualizado);
  });
});

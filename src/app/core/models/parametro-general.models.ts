export type TipoParametroGeneral = 'INTEGER' | 'DECIMAL' | 'BOOLEAN' | 'STRING';

export interface ParametroGeneral {
  idParametro: number;
  clave: string;
  valor: string;
  descripcion: string | null;
  tipo: TipoParametroGeneral;
  fechaActualizacion: string | null;
}

export interface ActualizarParametroRequest {
  valor: string;
  descripcion?: string;
}

export type CatalogItem = { id: number; name: string; price: number };
export type Modelo = CatalogItem & { description: string };
export type Tamano = CatalogItem & { m2: number };
export type Forma = 'dos_aguas' | 'un_agua' | 'plana';
export type Cubierta = CatalogItem & { forma: Forma };
export type Acabado = CatalogItem & { color: string };

export type Catalog = {
  modelos: Modelo[];
  tamanos: Tamano[];
  cubiertas: Cubierta[];
  acabados: Acabado[];
  currency: string;
};

export type Selection = {
  modelo_id: number;
  tamano_id: number;
  cubierta_id: number;
  acabado_id: number;
};

export type Partner = { id: number; name: string; email: string; phone: string; user: string };

export type Quote = {
  id: number;
  name: string;
  date: string;
  modelo: string;
  tamano: string;
  cubierta: string;
  acabado: string;
  acabado_color: string;
  cubierta_forma: Forma;
  tamano_m2: number;
  amount_total: number;
  stage: string;
};

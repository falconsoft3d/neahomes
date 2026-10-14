export type CatalogItem = { id: number; name: string; price: number };
export type Modelo = CatalogItem & { m2: number; description: string; image_version: number };
export type Forma = 'dos_aguas' | 'un_agua' | 'plana';
export type Cubierta = CatalogItem & { forma: Forma };
export type Acabado = CatalogItem & { color: string };

export type Catalog = {
  modelos: Modelo[];
  cubiertas: Cubierta[];
  acabados: Acabado[];
  currency: string;
};

export type Selection = {
  modelo_id: number;
  cubierta_id: number;
  acabado_id: number;
};

export type Slide = {
  id: number;
  title: string;
  subtitle: string;
  theme: 'claro' | 'oscuro';
  image_version: number;
  button1_text: string;
  button1_url: string;
  button2_text: string;
  button2_url: string;
};

export type Partner = { id: number; name: string; email: string; phone: string; user: string };

export type Quote = {
  id: number;
  name: string;
  date: string;
  modelo: string;
  modelo_id: number;
  modelo_image_version: number;
  cubierta: string;
  acabado: string;
  acabado_color: string;
  cubierta_forma: Forma;
  modelo_m2: number;
  amount_total: number;
  state: 'nuevo' | 'estudio' | 'aceptada' | 'rechazada';
  state_label: string;
};

export type Ticket = {
  id: number;
  ref: string;
  title: string;
  description: string;
  state: 'nuevo' | 'trabajando' | 'resuelto';
  state_label: string;
  date: string;
  quote: string;
};

export type CatalogItem = { id: number; name: string; price: number };
export type Distribucion = { id: number; name: string; max: number };
export type Modelo = CatalogItem & {
  m2: number;
  description: string;
  image_version: number;
  distribuciones: Distribucion[];
  /** Meses de entrega desde hoy (0: no se muestra). */
  delivery_months: number;
};
export type Forma = 'dos_aguas' | 'un_agua' | 'plana' | 'transitable';
export type Cubierta = CatalogItem & { forma: Forma };
export type Acabado = CatalogItem & { color: string };

export type Discount = { code: string; amount: number; date_end: string | null };

export type Credit = {
  id: number;
  name: string;
  tin: number;
  tae: number;
  plazo: number;
  plazo_min: number;
  plazo_max: number;
  is_default: boolean;
};

export type Payment = { tipo: 'contado' } | { tipo: 'financiado'; credito_id: number; plazo: number };

/** Forma de pago guardada en la cotización (TIN, TAE y plazo del momento de cotizar). */
export type QuotePayment =
  | { tipo: 'contado' }
  | { tipo: 'financiado'; credito: string; tin: number; tae: number; plazo: number; cuota: number; intereses: number; total: number };

export type PaymentRow = { mes: number; cuota: number; intereses: number; amortizacion: number; pendiente: number };

export type Catalog = {
  modelos: Modelo[];
  cubiertas: Cubierta[];
  acabados: Acabado[];
  currency: string;
  creditos: Credit[];
};

export type Selection = {
  modelo_id: number;
  cubierta_id: number;
  acabado_id: number;
  /** Cantidad elegida por distribución (id → 0..max). */
  distribuciones?: Record<number, number>;
  pago?: Payment;
  /** Código de descuento (Odoo lo vuelve a validar al guardar). */
  descuento?: string;
  /** Solo para mostrar el descuento en el resumen del registro; Odoo no lo usa. */
  descuento_importe?: number;
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

export type BlogCategory = { id: number; name: string; slug: string; count: number };
export type BlogArticle = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  date: string;
  author: string;
  category: { name: string; slug: string } | null;
  image_version: number;
  comment_count: number;
  allow_comments: boolean;
};
export type BlogComment = { id: number; author: string; body: string; date: string; mine: boolean };
export type BlogArticleDetail = BlogArticle & { body: string; comments: BlogComment[] };

export type Conditions = { id: number; name: string; date: string; body: string };

export type Country = { id: number; name: string; code: string };
export type CountryState = { id: number; name: string };
export type Profile = {
  name: string;
  email: string;
  phone: string;
  mobile: string;
  vat: string;
  street: string;
  street2: string;
  zip: string;
  city: string;
  country_id: number | null;
  state_id: number | null;
};

export type Page = { id: number; title: string; subtitle: string; body: string; image_version: number };
export type UserDocument = { id: number; name: string; size: number; date: string };

export type Partner = { id: number; name: string; email: string; phone: string; user: string; comercial: boolean };

export type Quote = {
  id: number;
  name: string;
  date: string;
  modelo: string;
  modelo_id: number;
  modelo_image_version: number;
  cubierta: string;
  acabado: string;
  distribuciones: { name: string; cantidad: number }[];
  acabado_color: string;
  cubierta_forma: Forma;
  modelo_m2: number;
  amount_total: number;
  state: QuoteState;
  state_label: string;
  comercial: string;
  pago: QuotePayment;
  plan_pagos: PaymentRow[];
  descuento: { code: string; amount: number } | null;
};

export type QuoteState = 'nuevo' | 'estudio' | 'aceptada' | 'rechazada';

/** Cotización vista desde el CRM del comercial: incluye los datos del cliente. */
export type CrmQuote = Quote & { client: { name: string; email: string; phone: string } };

export type TicketMessage = { id: number; author: string; body: string; date: string; mine: boolean };

export type Ticket = {
  id: number;
  ref: string;
  title: string;
  description: string;
  state: 'nuevo' | 'trabajando' | 'resuelto';
  state_label: string;
  date: string;
  quote: string;
  client: string;
  messages: TicketMessage[];
};

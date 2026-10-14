from markupsafe import Markup

from odoo import api, fields, models

from .credito import NOTA_SIMULACION, cuota_mensual, plan_de_pagos

QUOTE_STATES = [
    ('nuevo', 'Nuevo'),
    ('estudio', 'En estudio'),
    ('aceptada', 'Aceptada'),
    ('rechazada', 'Rechazada'),
]


class NeahomesCotizacion(models.Model):
    _name = 'neahomes.cotizacion'
    _inherit = ['mail.thread']
    _description = 'Cotización NeaHomes'
    _order = 'id desc'

    name = fields.Char(string='Referencia', required=True, copy=False, readonly=True, default='Nuevo')
    partner_id = fields.Many2one('res.partner', string='Cliente', required=True, ondelete='cascade')
    modelo_id = fields.Many2one('neahomes.modelo', string='Modelo', required=True)
    cubierta_id = fields.Many2one('neahomes.cubierta', string='Cubierta', required=True)
    acabado_id = fields.Many2one('neahomes.acabado', string='Acabado', required=True)
    # Precios congelados al momento de cotizar.
    price_modelo = fields.Float(string='Precio modelo', digits='Product Price')
    price_cubierta = fields.Float(string='Precio cubierta', digits='Product Price')
    price_acabado = fields.Float(string='Precio acabado', digits='Product Price')
    descuento_id = fields.Many2one('neahomes.descuento', string='Código de descuento', ondelete='set null',
                                   context={'active_test': False})
    descuento_code = fields.Char(string='Código aplicado')
    discount_amount = fields.Float(string='Descuento', digits='Product Price')
    amount_total = fields.Float(string='Total', digits='Product Price',
                                compute='_compute_amount_total', store=True)
    # Forma de pago. Si es financiado se guardan TIN, TAE y plazo del momento de cotizar:
    # cambiar el plan de crédito después no altera esta simulación.
    tipo_pago = fields.Selection([('contado', 'Al contado'), ('financiado', 'Financiado')],
                                 string='Forma de pago', default='contado', required=True, tracking=True)
    credito_id = fields.Many2one('neahomes.credito', string='Plan de crédito', ondelete='set null',
                                 context={'active_test': False})
    credito_tin = fields.Float(string='TIN (%)', digits=(5, 3))
    credito_tae = fields.Float(string='TAE (%)', digits=(5, 3))
    credito_plazo = fields.Integer(string='Plazo (meses)')
    cuota_mensual = fields.Float(string='Cuota mensual', digits='Product Price',
                                 compute='_compute_financiacion', store=True)
    total_intereses = fields.Float(string='Total intereses', digits='Product Price',
                                   compute='_compute_financiacion', store=True)
    total_financiado = fields.Float(string='Importe total a pagar', digits='Product Price',
                                    compute='_compute_financiacion', store=True)
    plan_pago_html = fields.Html(string='Plan de pagos', compute='_compute_plan_pago_html', sanitize=False)
    state = fields.Selection(QUOTE_STATES, string='Estado', default='nuevo', required=True, tracking=True)
    comercial_id = fields.Many2one('res.partner', string='Comercial', tracking=True, ondelete='set null',
                                   domain=[('nea_comercial', '=', True)])
    lead_id = fields.Many2one('crm.lead', string='Oportunidad', ondelete='set null')
    ticket_ids = fields.One2many('neahomes.ticket', 'cotizacion_id', string='Tickets')
    distribucion_ids = fields.One2many('neahomes.cotizacion.distribucion', 'cotizacion_id', string='Distribución')
    aceptacion_ids = fields.One2many('neahomes.condicion.aceptacion', 'cotizacion_id', string='Condiciones aceptadas')
    stage_id = fields.Many2one(related='lead_id.stage_id', string='Etapa')
    company_id = fields.Many2one('res.company', string='Compañía')

    @api.depends('price_modelo', 'price_cubierta', 'price_acabado', 'discount_amount')
    def _compute_amount_total(self):
        for rec in self:
            subtotal = rec.price_modelo + rec.price_cubierta + rec.price_acabado
            rec.amount_total = max(subtotal - rec.discount_amount, 0.0)

    @api.model
    def _next_comercial(self, after=None):
        """Rotación: el comercial siguiente (por id) al último asignado; vuelve al primero al final."""
        comerciales = self.env['res.partner'].sudo().search([('nea_comercial', '=', True)], order='id')
        if not comerciales:
            return comerciales
        if after is None:
            after = self.sudo().search([('comercial_id', '!=', False)], order='id desc', limit=1).comercial_id
        return next((c for c in comerciales if after and c.id > after.id), comerciales[0])

    @api.model_create_multi
    def create(self, vals_list):
        last = None
        for vals in vals_list:
            if vals.get('name', 'Nuevo') == 'Nuevo':
                vals['name'] = self.env['ir.sequence'].sudo().next_by_code('neahomes.cotizacion') or 'Nuevo'
            if 'comercial_id' not in vals:
                last = self._next_comercial(after=last)
                vals['comercial_id'] = last.id or False
        return super().create(vals_list)

    @api.depends('tipo_pago', 'amount_total', 'credito_tin', 'credito_plazo')
    def _compute_financiacion(self):
        for rec in self:
            if rec.tipo_pago == 'financiado' and rec.credito_plazo > 0:
                filas = plan_de_pagos(rec.amount_total, rec.credito_tin, rec.credito_plazo)
                rec.cuota_mensual = round(cuota_mensual(rec.amount_total, rec.credito_tin, rec.credito_plazo), 2)
                rec.total_financiado = round(sum(f[1] for f in filas), 2)
                rec.total_intereses = round(rec.total_financiado - rec.amount_total, 2)
            else:
                rec.cuota_mensual = rec.total_intereses = rec.total_financiado = 0.0

    def _plan_de_pagos(self):
        self.ensure_one()
        if self.tipo_pago != 'financiado' or self.credito_plazo <= 0:
            return []
        return plan_de_pagos(self.amount_total, self.credito_tin, self.credito_plazo)

    @api.depends('tipo_pago', 'amount_total', 'credito_tin', 'credito_plazo')
    def _compute_plan_pago_html(self):
        for rec in self:
            filas = rec._plan_de_pagos()
            if not filas:
                rec.plan_pago_html = False
                continue
            body = ''.join(
                f'<tr><td>{m}</td><td class="text-end">{c:,.2f}</td><td class="text-end">{i:,.2f}</td>'
                f'<td class="text-end">{a:,.2f}</td><td class="text-end">{p:,.2f}</td></tr>'
                for m, c, i, a, p in filas)
            rec.plan_pago_html = Markup(
                f'<p class="text-muted">{NOTA_SIMULACION}</p>'
                '<table class="table table-sm"><thead><tr><th>Mes</th><th class="text-end">Cuota</th>'
                '<th class="text-end">Intereses</th><th class="text-end">Amortización</th>'
                f'<th class="text-end">Pendiente</th></tr></thead><tbody>{body}</tbody></table>')

    @api.model
    def _payment_vals(self, pago):
        """Valida la forma de pago elegida en la web: {'tipo': 'contado'|'financiado', 'credito_id', 'plazo'}."""
        pago = pago or {}
        if not isinstance(pago, dict) or pago.get('tipo', 'contado') == 'contado':
            return {'tipo_pago': 'contado'}
        if pago.get('tipo') != 'financiado':
            raise ValueError('Forma de pago no válida.')
        credito = self.env['neahomes.credito'].sudo().browse(int(pago.get('credito_id') or 0)).exists()
        if not credito or not credito.active:
            raise ValueError('El plan de crédito elegido ya no está disponible.')
        try:
            plazo = int(pago.get('plazo') or credito.plazo)
        except (TypeError, ValueError):
            raise ValueError('Plazo no válido.')
        if not credito.plazo_min <= plazo <= credito.plazo_max:
            raise ValueError(f'El plazo debe estar entre {credito.plazo_min} y {credito.plazo_max} meses.')
        return {
            'tipo_pago': 'financiado', 'credito_id': credito.id,
            'credito_tin': credito.tin, 'credito_tae': credito.tae, 'credito_plazo': plazo,
        }

    def _payment_api_values(self):
        self.ensure_one()
        if self.tipo_pago != 'financiado':
            return {'tipo': 'contado'}
        return {
            'tipo': 'financiado', 'credito': self.credito_id.name or '',
            'tin': self.credito_tin, 'tae': self.credito_tae, 'plazo': self.credito_plazo,
            'cuota': self.cuota_mensual, 'intereses': self.total_intereses, 'total': self.total_financiado,
        }

    def action_estudio(self):
        self.write({'state': 'estudio'})

    def action_aceptar(self):
        self.write({'state': 'aceptada'})

    def action_rechazar(self):
        self.write({'state': 'rechazada'})

    def action_nuevo(self):
        self.write({'state': 'nuevo'})

    def _get_company(self):
        param = self.env['neahomes.parametro'].get_param('ci_company', '1')
        company = self.env['res.company'].sudo().browse(int(param)) if str(param).isdigit() else False
        return company if company and company.exists() else self.env.company

    def _summary(self):
        self.ensure_one()
        return '\n'.join([
            f'Modelo: {self.modelo_id.name} · {self.modelo_id.m2} m² ({self.price_modelo:,.2f})',
            f'Cubierta: {self.cubierta_id.name} ({self.price_cubierta:,.2f})',
            f'Acabado: {self.acabado_id.name} ({self.price_acabado:,.2f})',
            *[f'{d.name}: {d.cantidad}' for d in self.distribucion_ids],
            *([f'Comercial: {self.comercial_id.name}'] if self.comercial_id else []),
            *([f'Descuento {self.descuento_code}: -{self.discount_amount:,.2f}'] if self.discount_amount else []),
            f'Total: {self.amount_total:,.2f}',
            *([f'Financiado: {self.credito_plazo} meses, TIN {self.credito_tin:g} %, TAE {self.credito_tae:g} %, '
               f'cuota {self.cuota_mensual:,.2f}/mes ({NOTA_SIMULACION})']
              if self.tipo_pago == 'financiado' else ['Forma de pago: al contado']),
        ])

    def _lead_salesperson(self, company):
        """Vendedor y equipo de la oportunidad, siempre de la compañía de la oportunidad.

        Si no se indican, Odoo usa el usuario actual, que desde la web es el usuario público
        (de otra compañía) y la creación falla por compañías incompatibles."""
        self.ensure_one()
        user = self.comercial_id.user_ids.filtered(lambda u: not u.share and company in u.company_ids)[:1]
        team = self.env['crm.team']
        if user:
            team = team.sudo().search([
                ('company_id', 'in', [False, company.id]), ('use_opportunities', '=', True),
                '|', ('user_id', '=', user.id), ('member_ids', 'in', user.ids),
            ], limit=1)
        return user, team

    def action_create_lead(self):
        """Crea la oportunidad del CRM en la compañía definida por el parámetro ci_company."""
        for rec in self.filtered(lambda r: not r.lead_id):
            company = rec._get_company()
            user, team = rec._lead_salesperson(company)
            lead = self.env['crm.lead'].sudo().with_company(company).create({
                'user_id': user.id or False,
                'team_id': team.id or False,
                'name': f'{rec.name} · {rec.modelo_id.name}',
                'type': 'opportunity',
                'partner_id': rec.partner_id.id,
                'email_from': rec.partner_id.email,
                'phone': rec.partner_id.phone,
                'expected_revenue': rec.amount_total,
                'company_id': company.id,
                'description': rec._summary().replace('\n', '<br/>'),
            })
            rec.sudo().write({'lead_id': lead.id, 'company_id': company.id})
        return True

    @api.model
    def create_from_selection(self, partner, selection):
        """selection: dict con modelo_id, cubierta_id, acabado_id y opcionalmente
        distribuciones = {distribucion_id: cantidad} (de 0 al número máximo de cada una)
        y pago = {'tipo': 'contado'|'financiado', 'credito_id', 'plazo'}."""
        records = {}
        for key, model in (('modelo_id', 'neahomes.modelo'), ('cubierta_id', 'neahomes.cubierta'),
                           ('acabado_id', 'neahomes.acabado')):
            rec = self.env[model].sudo().browse(int(selection.get(key) or 0)).exists()
            if not rec or not rec.active:
                raise ValueError(f'Selección inválida: {key}')
            records[key] = rec
        chosen = selection.get('distribuciones') or {}
        if not isinstance(chosen, dict):
            raise ValueError('Distribución inválida')
        dist_lines = []
        for dist in records['modelo_id'].distribucion_ids:
            try:
                qty = int(chosen.get(str(dist.id), chosen.get(dist.id, 0)) or 0)
            except (TypeError, ValueError):
                raise ValueError(f'Cantidad inválida para {dist.name}')
            if not 0 <= qty <= dist.numero:
                raise ValueError(f'{dist.name}: elige entre 0 y {dist.numero}')
            if qty:
                dist_lines.append((0, 0, {'distribucion_id': dist.id, 'name': dist.name, 'cantidad': qty}))
        payment = self._payment_vals(selection.get('pago'))
        discount = {}
        code = (selection.get('descuento') or '').strip()
        if code:
            descuento = self.env['neahomes.descuento']._find_valid(code)
            if not descuento:
                raise ValueError(f'El código de descuento «{code}» no es válido o ha caducado.')
            discount = {'descuento_id': descuento.id, 'descuento_code': descuento.code,
                        'discount_amount': descuento.amount}
        quote = self.sudo().create({
            **payment,
            **discount,
            'distribucion_ids': dist_lines,
            'partner_id': partner.id,
            'modelo_id': records['modelo_id'].id,
            'cubierta_id': records['cubierta_id'].id,
            'acabado_id': records['acabado_id'].id,
            'price_modelo': records['modelo_id'].price,
            'price_cubierta': records['cubierta_id'].price,
            'price_acabado': records['acabado_id'].price,
        })
        quote.action_create_lead()
        return quote

    def _api_values(self):
        self.ensure_one()
        return {
            'id': self.id,
            'name': self.name,
            'date': fields.Datetime.to_string(self.create_date),
            'modelo': self.modelo_id.name,
            'modelo_id': self.modelo_id.id,
            'modelo_image_version': self.modelo_id.sudo()._image_version(),
            'cubierta': self.cubierta_id.name,
            'acabado': self.acabado_id.name,
            'distribuciones': [{'name': d.name, 'cantidad': d.cantidad} for d in self.distribucion_ids],
            'acabado_color': self.acabado_id.color,
            'cubierta_forma': self.cubierta_id.forma,
            'modelo_m2': self.modelo_id.m2,
            'amount_total': self.amount_total,
            'state': self.state,
            'state_label': dict(QUOTE_STATES)[self.state],
            'comercial': self.comercial_id.name or '',
            'pago': self._payment_api_values(),
            'descuento': {'code': self.descuento_code, 'amount': self.discount_amount} if self.discount_amount else None,
            'plan_pagos': [{'mes': m, 'cuota': c, 'intereses': i, 'amortizacion': a, 'pendiente': p}
                           for m, c, i, a, p in self._plan_de_pagos()],
        }

    def _crm_values(self):
        """Datos de la cotización para el CRM web del comercial (incluye el cliente)."""
        self.ensure_one()
        return dict(self._api_values(), client={
            'name': self.partner_id.name,
            'email': self.partner_id.email or '',
            'phone': self.partner_id.phone or '',
        })

from odoo import api, fields, models

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
    amount_total = fields.Float(string='Total', digits='Product Price',
                                compute='_compute_amount_total', store=True)
    state = fields.Selection(QUOTE_STATES, string='Estado', default='nuevo', required=True, tracking=True)
    lead_id = fields.Many2one('crm.lead', string='Oportunidad', ondelete='set null')
    ticket_ids = fields.One2many('neahomes.ticket', 'cotizacion_id', string='Tickets')
    stage_id = fields.Many2one(related='lead_id.stage_id', string='Etapa')
    company_id = fields.Many2one('res.company', string='Compañía')

    @api.depends('price_modelo', 'price_cubierta', 'price_acabado')
    def _compute_amount_total(self):
        for rec in self:
            rec.amount_total = rec.price_modelo + rec.price_cubierta + rec.price_acabado

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get('name', 'Nuevo') == 'Nuevo':
                vals['name'] = self.env['ir.sequence'].sudo().next_by_code('neahomes.cotizacion') or 'Nuevo'
        return super().create(vals_list)

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
            f'Total: {self.amount_total:,.2f}',
        ])

    def action_create_lead(self):
        """Crea la oportunidad del CRM en la compañía definida por el parámetro ci_company."""
        for rec in self.filtered(lambda r: not r.lead_id):
            company = rec._get_company()
            lead = self.env['crm.lead'].sudo().with_company(company).create({
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
        """selection: dict con modelo_id, cubierta_id, acabado_id."""
        records = {}
        for key, model in (('modelo_id', 'neahomes.modelo'), ('cubierta_id', 'neahomes.cubierta'),
                           ('acabado_id', 'neahomes.acabado')):
            rec = self.env[model].sudo().browse(int(selection.get(key) or 0)).exists()
            if not rec or not rec.active:
                raise ValueError(f'Selección inválida: {key}')
            records[key] = rec
        quote = self.sudo().create({
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
            'acabado_color': self.acabado_id.color,
            'cubierta_forma': self.cubierta_id.forma,
            'modelo_m2': self.modelo_id.m2,
            'amount_total': self.amount_total,
            'state': self.state,
            'state_label': dict(QUOTE_STATES)[self.state],
        }

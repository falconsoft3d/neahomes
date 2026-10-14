from odoo import api, fields, models


class NeahomesCondicion(models.Model):
    _name = 'neahomes.condicion'
    _description = 'Condiciones de venta'
    _order = 'date desc, id desc'

    name = fields.Char(string='Título', required=True)
    date = fields.Date(string='Fecha', required=True, default=fields.Date.context_today)
    body = fields.Html(string='Texto', required=True)
    active = fields.Boolean(default=True,
                            help='La web muestra las condiciones activas más recientes y exige aceptarlas para guardar una cotización.')
    aceptacion_ids = fields.One2many('neahomes.condicion.aceptacion', 'condicion_id', string='Aceptaciones')
    aceptacion_count = fields.Integer(compute='_compute_aceptacion_count', string='Nº aceptaciones')

    @api.depends('aceptacion_ids')
    def _compute_aceptacion_count(self):
        for rec in self:
            rec.aceptacion_count = len(rec.aceptacion_ids)

    @api.model
    def _current(self):
        """Condiciones vigentes: las activas más recientes (vacío si no hay ninguna)."""
        return self.sudo().search([], limit=1)

    def _api_values(self):
        self.ensure_one()
        return {'id': self.id, 'name': self.name, 'date': fields.Date.to_string(self.date), 'body': self.body or ''}


class NeahomesCondicionAceptacion(models.Model):
    _name = 'neahomes.condicion.aceptacion'
    _description = 'Aceptación de condiciones de venta'
    _order = 'date desc, id desc'
    _rec_name = 'partner_id'

    date = fields.Datetime(string='Fecha de aceptación', required=True, default=fields.Datetime.now, readonly=True)
    partner_id = fields.Many2one('res.partner', string='Cliente', required=True, ondelete='cascade', readonly=True)
    cotizacion_id = fields.Many2one('neahomes.cotizacion', string='Cotización', ondelete='set null', readonly=True)
    condicion_id = fields.Many2one('neahomes.condicion', string='Condiciones', ondelete='set null', readonly=True,
                                   context={'active_test': False})
    # Copia del texto aceptado: sirve de prueba aunque después se editen o archiven las condiciones.
    condicion_name = fields.Char(string='Título aceptado', readonly=True)
    condicion_body = fields.Html(string='Texto aceptado', readonly=True, sanitize=False)
    ip = fields.Char(string='IP', readonly=True)
    user_agent = fields.Char(string='Navegador', readonly=True)

    @api.model
    def _record(self, partner, condicion, cotizacion, ip=None, user_agent=None):
        return self.sudo().create({
            'partner_id': partner.id,
            'cotizacion_id': cotizacion.id if cotizacion else False,
            'condicion_id': condicion.id,
            'condicion_name': condicion.name,
            'condicion_body': condicion.body,
            'ip': (ip or '')[:64] or False,
            'user_agent': (user_agent or '')[:255] or False,
        })

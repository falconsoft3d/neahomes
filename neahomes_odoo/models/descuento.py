from odoo import _, api, fields, models
from odoo.exceptions import ValidationError


class NeahomesDescuento(models.Model):
    _name = 'neahomes.descuento'
    _description = 'Código de descuento'
    _order = 'date_end desc, id desc'
    _rec_name = 'code'

    code = fields.Char(string='Código', required=True, help='Texto corto que el cliente escribe en el diseñador.')
    amount = fields.Float(string='Descuento', digits='Product Price', required=True,
                          help='Importe en dinero que se resta del total de la cotización.')
    date_end = fields.Date(string='Vence el', help='Último día en que se puede usar. Vacío: no caduca.')
    description = fields.Char(string='Descripción')
    active = fields.Boolean(string='Habilitado', default=True)
    cotizacion_ids = fields.One2many('neahomes.cotizacion', 'descuento_id', string='Cotizaciones')
    usage_count = fields.Integer(string='Usos', compute='_compute_usage_count')

    _sql_constraints = [('code_uniq', 'unique(code)', 'Ya existe un código de descuento igual.')]

    @api.depends('cotizacion_ids')
    def _compute_usage_count(self):
        for rec in self:
            rec.usage_count = len(rec.cotizacion_ids)

    @api.constrains('amount')
    def _check_amount(self):
        if any(rec.amount <= 0 for rec in self):
            raise ValidationError(_('El descuento debe ser mayor que cero.'))

    @api.model
    def _normalize(self, code):
        return (code or '').strip().upper()

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            vals['code'] = self._normalize(vals.get('code'))
        return super().create(vals_list)

    def write(self, vals):
        if 'code' in vals:
            vals = dict(vals, code=self._normalize(vals['code']))
        return super().write(vals)

    @api.model
    def _find_valid(self, code):
        """Código habilitado y no vencido (vacío si no existe o no sirve)."""
        code = self._normalize(code)
        if not code:
            return self.browse()
        today = fields.Date.context_today(self)
        return self.sudo().search([
            ('code', '=', code), '|', ('date_end', '=', False), ('date_end', '>=', today),
        ], limit=1)

    def _api_values(self):
        self.ensure_one()
        return {'code': self.code, 'amount': self.amount,
                'date_end': fields.Date.to_string(self.date_end) if self.date_end else None}

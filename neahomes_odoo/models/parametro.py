from odoo import api, fields, models


class NeahomesParametro(models.Model):
    _name = 'neahomes.parametro'
    _description = 'Parámetro NeaHomes'
    _order = 'name'

    name = fields.Char(string='Nombre', required=True)
    valor = fields.Char(string='Valor')

    _sql_constraints = [
        ('name_uniq', 'unique(name)', 'Ya existe un parámetro con ese nombre.'),
    ]

    @api.model
    def get_param(self, name, default=None):
        param = self.sudo().search([('name', '=', name)], limit=1)
        return param.valor if param and param.valor not in (False, '') else default

from odoo import fields, models


class NeahomesCatalogMixin(models.AbstractModel):
    _name = 'neahomes.catalog.mixin'
    _description = 'Catálogo NeaHomes'
    _order = 'sequence, id'

    name = fields.Char(string='Nombre', required=True)
    price = fields.Float(string='Precio', digits='Product Price', default=0.0)
    sequence = fields.Integer(default=10)
    active = fields.Boolean(default=True)

    def _api_values(self):
        """Datos expuestos al frontend de Next.js."""
        self.ensure_one()
        return {'id': self.id, 'name': self.name, 'price': self.price}


class NeahomesTamano(models.Model):
    _name = 'neahomes.tamano'
    _inherit = 'neahomes.catalog.mixin'
    _description = 'Tamaño'

    m2 = fields.Integer(string='Metros cuadrados')

    def _api_values(self):
        return dict(super()._api_values(), m2=self.m2)


class NeahomesCubierta(models.Model):
    _name = 'neahomes.cubierta'
    _inherit = 'neahomes.catalog.mixin'
    _description = 'Cubierta'

    forma = fields.Selection([
        ('dos_aguas', 'A dos aguas'),
        ('un_agua', 'A un agua'),
        ('plana', 'Plana / transitable'),
    ], string='Forma', default='dos_aguas', required=True,
        help='Forma usada para dibujar la cubierta en el diseñador web.')

    def _api_values(self):
        return dict(super()._api_values(), forma=self.forma)


class NeahomesAcabado(models.Model):
    _name = 'neahomes.acabado'
    _inherit = 'neahomes.catalog.mixin'
    _description = 'Acabado'

    color = fields.Char(string='Color', default='#1f2328',
                        help='Color hexadecimal usado en el diseñador web.')

    def _api_values(self):
        return dict(super()._api_values(), color=self.color)


class NeahomesModelo(models.Model):
    _name = 'neahomes.modelo'
    _inherit = 'neahomes.catalog.mixin'
    _description = 'Modelo'

    description = fields.Char(string='Descripción corta')

    def _api_values(self):
        return dict(super()._api_values(), description=self.description or '')

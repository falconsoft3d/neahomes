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

    m2 = fields.Integer(string='Metros cuadrados')
    description = fields.Char(string='Descripción corta')
    image = fields.Image(string='Imagen', max_width=1920, max_height=1920)

    def _image_version(self):
        """0 si no hay imagen; si la hay, un número que cambia al editar (sirve para invalidar caché)."""
        self.ensure_one()
        return int(self.write_date.timestamp()) if self.image else 0

    def _api_values(self):
        return dict(super()._api_values(), m2=self.m2, description=self.description or '',
                    image_version=self._image_version())

from odoo import fields, models


class NeahomesDistribucion(models.Model):
    _name = 'neahomes.distribucion'
    _description = 'Distribución del modelo'
    _order = 'modelo_id, sequence, id'

    name = fields.Char(string='Descripción', required=True)
    numero = fields.Integer(string='Número', required=True, default=1,
                            help='Cantidad máxima que el cliente puede elegir en la web (de 0 a este número).')
    modelo_id = fields.Many2one('neahomes.modelo', string='Modelo', required=True, ondelete='cascade')
    sequence = fields.Integer(default=10)

    _sql_constraints = [
        ('numero_positivo', 'CHECK(numero >= 1)', 'El número debe ser al menos 1.'),
    ]

    def _api_values(self):
        self.ensure_one()
        return {'id': self.id, 'name': self.name, 'max': self.numero}


class NeahomesCotizacionDistribucion(models.Model):
    _name = 'neahomes.cotizacion.distribucion'
    _description = 'Distribución elegida en la cotización'
    _order = 'id'

    cotizacion_id = fields.Many2one('neahomes.cotizacion', required=True, ondelete='cascade')
    distribucion_id = fields.Many2one('neahomes.distribucion', string='Distribución', ondelete='set null')
    # Copia de la descripción: la cotización conserva el texto aunque la distribución cambie o se borre.
    name = fields.Char(string='Descripción', required=True)
    cantidad = fields.Integer(string='Cantidad', required=True)

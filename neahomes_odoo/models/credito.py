from odoo import _, api, fields, models
from odoo.exceptions import ValidationError

NOTA_SIMULACION = 'Simulación de crédito orientativa, sujeta a aprobación.'

# Planes típicos que se crean una sola vez (al instalar o al actualizar a 17.0.2.3.0) y luego se editan libremente.
# TAE calculada a partir del TIN con capitalización mensual y sin comisiones.
PLANES_TIPICOS = [
    {'name': 'Hipoteca 20 años', 'tin': 3.0, 'tae': 3.04, 'plazo': 240, 'plazo_min': 120, 'plazo_max': 360,
     'is_default': True, 'sequence': 1},
    {'name': 'Préstamo 10 años', 'tin': 5.5, 'tae': 5.64, 'plazo': 120, 'plazo_min': 60, 'plazo_max': 180,
     'sequence': 2},
    {'name': 'Préstamo personal 5 años', 'tin': 7.95, 'tae': 8.25, 'plazo': 60, 'plazo_min': 12, 'plazo_max': 96,
     'sequence': 3},
]


def cuota_mensual(capital, tin, meses):
    """Cuota constante (sistema francés) para un capital, un TIN anual en % y un número de meses."""
    r = (tin or 0) / 100 / 12
    if meses <= 0:
        return 0.0
    if not r:
        return capital / meses
    return capital * r / (1 - (1 + r) ** -meses)


def plan_de_pagos(capital, tin, meses):
    """Cuadro de amortización: [(mes, cuota, intereses, amortización, pendiente)] redondeado a céntimos."""
    r = (tin or 0) / 100 / 12
    cuota = round(cuota_mensual(capital, tin, meses), 2)
    pendiente, filas = round(capital, 2), []
    for mes in range(1, meses + 1):
        interes = round(pendiente * r, 2)
        amortizacion = round(pendiente, 2) if mes == meses else round(cuota - interes, 2)
        pendiente = round(pendiente - amortizacion, 2)
        filas.append((mes, round(amortizacion + interes, 2), interes, amortizacion, max(pendiente, 0.0)))
    return filas


class NeahomesCredito(models.Model):
    _name = 'neahomes.credito'
    _description = 'Plan de crédito'
    _order = 'sequence, id'

    name = fields.Char(string='Nombre', required=True)
    tin = fields.Float(string='TIN (%)', digits=(5, 3), required=True, help='Tipo de interés nominal anual.')
    tae = fields.Float(string='TAE (%)', digits=(5, 3), required=True, help='Tasa anual equivalente (informativa).')
    plazo = fields.Integer(string='Plazo por defecto (meses)', required=True, default=240)
    plazo_min = fields.Integer(string='Plazo mínimo (meses)', required=True, default=12)
    plazo_max = fields.Integer(string='Plazo máximo (meses)', required=True, default=360)
    is_default = fields.Boolean(string='Por defecto',
                                help='Plan con el que se calcula la cuota «desde» de la portada. Solo puede haber uno.')
    sequence = fields.Integer(default=10)
    active = fields.Boolean(string='Habilitado', default=True,
                            help='Desmárcalo para que este plan deje de ofrecerse en la web.')

    @api.model
    def _create_typical_plans(self):
        """Crea los planes típicos que aún no existan (por nombre). Si ya hay un plan por defecto, lo respeta."""
        Plans = self.with_context(active_test=False)
        has_default = bool(Plans.search_count([('is_default', '=', True)]))
        for vals in PLANES_TIPICOS:
            if not Plans.search_count([('name', '=', vals['name'])]):
                Plans.create(dict(vals, is_default=vals.get('is_default', False) and not has_default))

    @api.constrains('tin', 'tae', 'plazo', 'plazo_min', 'plazo_max')
    def _check_values(self):
        for rec in self:
            if rec.tin < 0 or rec.tae < 0:
                raise ValidationError(_('El TIN y la TAE no pueden ser negativos.'))
            if not 1 <= rec.plazo_min <= rec.plazo <= rec.plazo_max:
                raise ValidationError(_('El plazo por defecto debe estar entre el mínimo y el máximo (y el mínimo ser al menos 1).'))

    def _unset_other_defaults(self):
        default = self.filtered('is_default')[-1:]
        if default:
            self.search([('is_default', '=', True), ('id', '!=', default.id)]).write({'is_default': False})

    @api.model_create_multi
    def create(self, vals_list):
        records = super().create(vals_list)
        records._unset_other_defaults()
        return records

    def write(self, vals):
        res = super().write(vals)
        if vals.get('is_default'):
            self._unset_other_defaults()
        return res

    def _api_values(self):
        self.ensure_one()
        return {
            'id': self.id, 'name': self.name, 'tin': self.tin, 'tae': self.tae,
            'plazo': self.plazo, 'plazo_min': self.plazo_min, 'plazo_max': self.plazo_max,
            'is_default': self.is_default,
        }

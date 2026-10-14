from odoo import fields, models


class NeahomesTamano(models.Model):
    _name = 'neahomes.tamano'
    _description = 'Tamaño'
    _order = 'name'

    name = fields.Char(string='Nombre', required=True)


class NeahomesCubierta(models.Model):
    _name = 'neahomes.cubierta'
    _description = 'Cubierta'
    _order = 'name'

    name = fields.Char(string='Nombre', required=True)


class NeahomesAcabado(models.Model):
    _name = 'neahomes.acabado'
    _description = 'Acabado'
    _order = 'name'

    name = fields.Char(string='Nombre', required=True)


class NeahomesModelo(models.Model):
    _name = 'neahomes.modelo'
    _description = 'Modelo'
    _order = 'name'

    name = fields.Char(string='Nombre', required=True)

from odoo import fields, models


class NeahomesContacto(models.Model):
    _name = 'neahomes.contacto'
    _description = 'Formulario de contacto NeaHomes'
    _order = 'id desc'

    name = fields.Char(string='Nombre', required=True)
    email = fields.Char(string='Email', required=True)
    phone = fields.Char(string='Teléfono')
    message = fields.Text(string='Texto', required=True)

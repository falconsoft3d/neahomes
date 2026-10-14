import secrets

from passlib.context import CryptContext

from odoo import _, api, fields, models
from odoo.exceptions import ValidationError

NEA_CRYPT = CryptContext(['pbkdf2_sha512'])


class ResPartner(models.Model):
    _inherit = 'res.partner'

    nea_portal = fields.Boolean(string='Portal NeaHome activo', copy=False)
    nea_user = fields.Char(string='Usuario NeaHome', copy=False)
    nea_password = fields.Char(string='Contraseña NeaHome', copy=False,
                               help='Se guarda cifrada. Escribe una nueva para cambiarla.')
    nea_token = fields.Char(string='Token NeaHome', copy=False, groups='base.group_system')
    nea_cotizacion_ids = fields.One2many('neahomes.cotizacion', 'partner_id', string='Cotizaciones NeaHome')

    _sql_constraints = [
        ('nea_user_uniq', 'unique(nea_user)', 'El usuario NeaHome ya está en uso.'),
    ]

    @api.model
    def _nea_hash(self, vals):
        password = vals.get('nea_password')
        if password and not NEA_CRYPT.identify(password):
            vals['nea_password'] = NEA_CRYPT.hash(password)
        if vals.get('nea_user'):
            vals['nea_user'] = vals['nea_user'].strip().lower()
        return vals

    @api.model_create_multi
    def create(self, vals_list):
        return super().create([self._nea_hash(vals) for vals in vals_list])

    def write(self, vals):
        if 'nea_password' in vals or 'nea_user' in vals:
            vals = self._nea_hash(dict(vals))
        res = super().write(vals)
        if 'nea_password' in vals:
            # Al cambiar la contraseña se cierran las sesiones abiertas en la web.
            super(ResPartner, self.sudo()).write({'nea_token': False})
        return res

    @api.constrains('nea_portal', 'nea_user', 'nea_password')
    def _check_nea_credentials(self):
        for partner in self:
            if partner.nea_portal and not (partner.nea_user and partner.nea_password):
                raise ValidationError(_('Para activar el portal NeaHome indica usuario y contraseña.'))

    def _nea_check_password(self, password):
        self.ensure_one()
        return bool(self.nea_password and password and NEA_CRYPT.verify(password, self.nea_password))

    def _nea_new_token(self):
        self.ensure_one()
        token = secrets.token_urlsafe(32)
        self.sudo().write({'nea_token': token})
        return token

    @api.model
    def _nea_from_token(self, token):
        if not token:
            return self.browse()
        return self.sudo().search([('nea_token', '=', token), ('nea_portal', '=', True)], limit=1)

    def _nea_api_values(self):
        self.ensure_one()
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email or '',
            'phone': self.phone or '',
            'user': self.nea_user,
        }

import json
import logging

from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)

CATALOGS = {
    'modelos': 'neahomes.modelo',
    'cubiertas': 'neahomes.cubierta',
    'acabados': 'neahomes.acabado',
}


class NeahomesApi(http.Controller):
    """API JSON consumida por el frontend Next.js (neahomes_web)."""

    # ---------------------------------------------------------------- helpers
    def _json(self, data, status=200):
        return request.make_json_response(data, status=status)

    def _error(self, message, status=400):
        return self._json({'error': message}, status=status)

    def _body(self):
        try:
            return json.loads(request.httprequest.get_data() or b'{}')
        except ValueError:
            return {}

    def _check_api_key(self):
        expected = request.env['neahomes.parametro'].sudo().get_param('api_key')
        return not expected or request.httprequest.headers.get('X-Neahomes-Key') == expected

    def _partner(self):
        auth = request.httprequest.headers.get('Authorization', '')
        token = auth[7:] if auth.startswith('Bearer ') else ''
        return request.env['res.partner'].sudo()._nea_from_token(token)

    def _guard(self):
        return None if self._check_api_key() else self._error('API key inválida', 401)

    # -------------------------------------------------------------- endpoints
    @http.route('/neahomes/api/catalog', type='http', auth='public', methods=['GET'], csrf=False)
    def catalog(self, **kw):
        if (err := self._guard()):
            return err
        data = {
            key: [rec._api_values() for rec in request.env[model].sudo().search([])]
            for key, model in CATALOGS.items()
        }
        data['currency'] = request.env['neahomes.cotizacion'].sudo()._get_company().currency_id.name
        return self._json(data)

    def _image_response(self, model, record_id, width, max_width):
        record = request.env[model].sudo().browse(record_id).exists()
        if not record or not record.active or not record.image:
            return self._error('Imagen no encontrada', 404)
        width = min(int(width), max_width) if str(width).isdigit() else 0
        return request.env['ir.binary']._get_image_stream_from(record, 'image', width=width).get_response()

    @http.route('/neahomes/api/modelo/<int:modelo_id>/image', type='http', auth='public', methods=['GET'], csrf=False)
    def modelo_image(self, modelo_id, width=0, **kw):
        if (err := self._guard()):
            return err
        return self._image_response('neahomes.modelo', modelo_id, width, 1920)

    @http.route('/neahomes/api/slides', type='http', auth='public', methods=['GET'], csrf=False)
    def slides(self, **kw):
        if (err := self._guard()):
            return err
        slides = request.env['neahomes.slide'].sudo().search([], limit=3)
        return self._json({'slides': [s._api_values() for s in slides]})

    @http.route('/neahomes/api/slide/<int:slide_id>/image', type='http', auth='public', methods=['GET'], csrf=False)
    def slide_image(self, slide_id, width=0, **kw):
        if (err := self._guard()):
            return err
        return self._image_response('neahomes.slide', slide_id, width, 2560)

    @http.route('/neahomes/api/settings', type='http', auth='public', methods=['GET'], csrf=False)
    def settings(self, **kw):
        if (err := self._guard()):
            return err
        Param = request.env['neahomes.parametro'].sudo()
        return self._json({'instagram_url': Param.get_param('instagram_url', '')})

    @http.route('/neahomes/api/contact', type='http', auth='public', methods=['POST'], csrf=False)
    def contact(self, **kw):
        if (err := self._guard()):
            return err
        body = self._body()
        vals = {
            'name': (body.get('name') or '').strip(),
            'email': (body.get('email') or '').strip(),
            'phone': (body.get('phone') or '').strip() or False,
            'message': (body.get('message') or '').strip(),
        }
        if not (vals['name'] and vals['email'] and vals['message']):
            return self._error('Nombre, email y texto son obligatorios.')
        request.env['neahomes.contacto'].sudo().create(vals)
        return self._json({'ok': True})

    @http.route('/neahomes/api/register', type='http', auth='public', methods=['POST'], csrf=False)
    def register(self, **kw):
        if (err := self._guard()):
            return err
        body = self._body()
        name = (body.get('name') or '').strip()
        email = (body.get('email') or '').strip()
        user = (body.get('user') or '').strip().lower()
        password = body.get('password') or ''
        if not (name and email and user and len(password) >= 6):
            return self._error('Nombre, email, usuario y contraseña (mín. 6 caracteres) son obligatorios.')
        Partner = request.env['res.partner'].sudo()
        if Partner.search_count([('nea_user', '=', user)]):
            return self._error('Ese usuario ya está registrado.', 409)
        try:
            partner = Partner.create({
                'name': name,
                'email': email,
                'phone': (body.get('phone') or '').strip() or False,
                'nea_user': user,
                'nea_password': password,
                'nea_portal': True,
            })
            quote = None
            if body.get('selection'):
                quote = request.env['neahomes.cotizacion'].sudo().create_from_selection(partner, body['selection'])
        except ValueError as e:
            request.env.cr.rollback()
            return self._error(str(e))
        return self._json({
            'token': partner._nea_new_token(),
            'partner': partner._nea_api_values(),
            'quote': quote and quote._api_values(),
        })

    @http.route('/neahomes/api/login', type='http', auth='public', methods=['POST'], csrf=False)
    def login(self, **kw):
        if (err := self._guard()):
            return err
        body = self._body()
        user = (body.get('user') or '').strip().lower()
        partner = request.env['res.partner'].sudo().search(
            [('nea_user', '=', user), ('nea_portal', '=', True)], limit=1)
        if not partner or not partner._nea_check_password(body.get('password') or ''):
            return self._error('Usuario o contraseña incorrectos.', 401)
        return self._json({'token': partner._nea_new_token(), 'partner': partner._nea_api_values()})

    @http.route('/neahomes/api/logout', type='http', auth='public', methods=['POST'], csrf=False)
    def logout(self, **kw):
        if (err := self._guard()):
            return err
        partner = self._partner()
        if partner:
            partner.write({'nea_token': False})
        return self._json({'ok': True})

    @http.route('/neahomes/api/me', type='http', auth='public', methods=['GET'], csrf=False)
    def me(self, **kw):
        if (err := self._guard()):
            return err
        partner = self._partner()
        if not partner:
            return self._error('Sesión no válida', 401)
        return self._json({
            'partner': partner._nea_api_values(),
            'quotes': [q._api_values() for q in partner.nea_cotizacion_ids],
            'tickets': [t._api_values() for t in partner.nea_ticket_ids],
        })

    @http.route('/neahomes/api/tickets', type='http', auth='public', methods=['POST'], csrf=False)
    def create_ticket(self, **kw):
        if (err := self._guard()):
            return err
        partner = self._partner()
        if not partner:
            return self._error('Sesión no válida', 401)
        body = self._body()
        title = (body.get('title') or '').strip()
        description = (body.get('description') or '').strip()
        if not (title and description):
            return self._error('Título y texto son obligatorios.')
        quote = request.env['neahomes.cotizacion']
        if body.get('quote_id'):
            # Solo se puede relacionar una cotización del propio cliente.
            quote = partner.nea_cotizacion_ids.filtered(lambda q: str(q.id) == str(body['quote_id']))
            if not quote:
                return self._error('Cotización no válida.')
        ticket = request.env['neahomes.ticket'].sudo().create({
            'name': title,
            'description': description,
            'partner_id': partner.id,
            'cotizacion_id': quote.id or False,
        })
        return self._json({'ticket': ticket._api_values()})

    @http.route('/neahomes/api/quotes', type='http', auth='public', methods=['POST'], csrf=False)
    def create_quote(self, **kw):
        if (err := self._guard()):
            return err
        partner = self._partner()
        if not partner:
            return self._error('Sesión no válida', 401)
        try:
            quote = request.env['neahomes.cotizacion'].sudo().create_from_selection(
                partner, self._body().get('selection') or {})
        except ValueError as e:
            return self._error(str(e))
        return self._json({'quote': quote._api_values()})

    @http.route('/neahomes/api/password', type='http', auth='public', methods=['POST'], csrf=False)
    def change_password(self, **kw):
        if (err := self._guard()):
            return err
        partner = self._partner()
        if not partner:
            return self._error('Sesión no válida', 401)
        body = self._body()
        if not partner._nea_check_password(body.get('current') or ''):
            return self._error('La contraseña actual no es correcta.', 403)
        new = body.get('new') or ''
        if len(new) < 6:
            return self._error('La nueva contraseña debe tener al menos 6 caracteres.')
        partner.write({'nea_password': new})
        return self._json({'token': partner._nea_new_token()})

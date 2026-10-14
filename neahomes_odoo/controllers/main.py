import functools
import json
import logging
import re

from odoo import http
from odoo.exceptions import UserError, ValidationError
from odoo.http import request

from ..models.cotizacion import QUOTE_STATES

_logger = logging.getLogger(__name__)

# Campos del contacto que el cliente puede completar desde /cuenta (además de país y provincia).
PROFILE_FIELDS = ('name', 'email', 'phone', 'mobile', 'vat', 'street', 'street2', 'zip', 'city')
EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')

CATALOGS = {
    'modelos': 'neahomes.modelo',
    'cubiertas': 'neahomes.cubierta',
    'acabados': 'neahomes.acabado',
}


def json_errors(func):
    """Cualquier error inesperado de la API se registra y se devuelve como JSON, no como página HTML."""
    @functools.wraps(func)
    def wrapper(self, *args, **kwargs):
        try:
            return func(self, *args, **kwargs)
        except Exception as e:  # noqa: BLE001 - la API siempre debe responder JSON
            _logger.exception('NeaHomes API: error en %s', request.httprequest.path)
            request.env.cr.rollback()
            message = getattr(e, 'args', [None])[0] or str(e) or e.__class__.__name__
            return request.make_json_response({'error': f'Error en Odoo: {message}'}, status=500)
    return wrapper


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

    def _api_key_error(self):
        """None si la API key es correcta (o no hay ninguna configurada); si no, el motivo."""
        expected = (request.env['neahomes.parametro'].sudo().get_param('api_key') or '').strip()
        received = (request.httprequest.headers.get('X-Neahomes-Key') or '').strip()
        if not expected or received == expected:
            return None
        return 'Falta la API key' if not received else 'API key inválida'

    def _partner(self):
        auth = request.httprequest.headers.get('Authorization', '')
        token = auth[7:] if auth.startswith('Bearer ') else ''
        return request.env['res.partner'].sudo()._nea_from_token(token)

    def _conditions_check(self, body):
        """Condiciones vigentes y error si el cliente no las ha aceptado (sin condiciones activas no se exige nada)."""
        current = request.env['neahomes.condicion']._current()
        if not current:
            return current, None
        accepted = body.get('accept_conditions')
        if not accepted:
            return current, self._error('Debes aceptar las condiciones de venta para guardar la cotización.', 400)
        if str(accepted) != str(current.id):
            return current, self._error('Las condiciones de venta han cambiado: revísalas y acéptalas de nuevo.', 409)
        return current, None

    def _register_acceptance(self, partner, condicion, quote):
        if not condicion:
            return
        headers = request.httprequest.headers
        # Next.js reenvía la IP y el navegador del cliente; si se llama directo, se usan los de la petición.
        request.env['neahomes.condicion.aceptacion']._record(
            partner, condicion, quote,
            ip=headers.get('X-Neahomes-Client-IP') or request.httprequest.remote_addr,
            user_agent=headers.get('X-Neahomes-Client-UA') or headers.get('User-Agent'),
        )

    def _guard(self):
        reason = self._api_key_error()
        return self._error(reason, 401) if reason else None

    # -------------------------------------------------------------- endpoints
    @http.route('/neahomes/api/catalog', type='http', auth='public', methods=['GET'], csrf=False)
    @json_errors
    def catalog(self, **kw):
        if (err := self._guard()):
            return err
        data = {
            key: [rec._api_values() for rec in request.env[model].sudo().search([])]
            for key, model in CATALOGS.items()
        }
        data['currency'] = request.env['neahomes.cotizacion'].sudo()._get_company().currency_id.name
        return self._json(data)

    def _image_response(self, model, record_id, width, max_width, domain=None):
        # search() excluye los archivados; domain añade condiciones (p. ej. artículo publicado).
        record = request.env[model].sudo().search([('id', '=', record_id)] + (domain or []), limit=1)
        if not record or not record.image:
            return self._error('Imagen no encontrada', 404)
        width = min(int(width), max_width) if str(width).isdigit() else 0
        return request.env['ir.binary']._get_image_stream_from(record, 'image', width=width).get_response()

    @http.route('/neahomes/api/modelo/<int:modelo_id>/image', type='http', auth='public', methods=['GET'], csrf=False)
    @json_errors
    def modelo_image(self, modelo_id, width=0, **kw):
        if (err := self._guard()):
            return err
        return self._image_response('neahomes.modelo', modelo_id, width, 1920)

    # ------------------------------------------------------------------ blog
    def _published_articles(self):
        return request.env['neahomes.blog.articulo'].sudo().search([('published', '=', True)])

    @http.route('/neahomes/api/blog', type='http', auth='public', methods=['GET'], csrf=False)
    @json_errors
    def blog(self, categoria=None, **kw):
        if (err := self._guard()):
            return err
        published = self._published_articles()
        # Solo las categorías que tienen artículos publicados, con su número de artículos.
        categories = published.categoria_id.sorted(lambda c: (c.sequence, c.name))
        articles = published.filtered(lambda a: a.categoria_id.slug == categoria) if categoria else published
        return self._json({
            'categories': [c._api_values(count=len(published.filtered(lambda a, c=c: a.categoria_id == c)))
                           for c in categories],
            'articles': [a._api_values() for a in articles],
        })

    def _article_by_slug(self, slug):
        return request.env['neahomes.blog.articulo'].sudo().search(
            [('slug', '=', slug), ('published', '=', True)], limit=1)

    def _article_detail(self, article, viewer=None):
        return dict(
            article._api_values(),
            body=article.body or '',
            comments=[c._api_values(viewer=viewer) for c in article.comentario_ids.filtered('visible')],
        )

    @http.route('/neahomes/api/blog/<string:slug>', type='http', auth='public', methods=['GET'], csrf=False)
    @json_errors
    def blog_article(self, slug, **kw):
        if (err := self._guard()):
            return err
        article = self._article_by_slug(slug)
        if not article:
            return self._error('Artículo no encontrado', 404)
        return self._json({'article': self._article_detail(article, viewer=self._partner())})

    @http.route('/neahomes/api/blog/<string:slug>/comments', type='http', auth='public', methods=['POST'], csrf=False)
    @json_errors
    def blog_comment(self, slug, **kw):
        if (err := self._guard()):
            return err
        partner = self._partner()
        if not partner:
            return self._error('Inicia sesión para comentar.', 401)
        article = self._article_by_slug(slug)
        if not article:
            return self._error('Artículo no encontrado', 404)
        if not article.allow_comments:
            return self._error('Los comentarios están cerrados en este artículo.', 403)
        text = (self._body().get('body') or '').strip()
        if not text:
            return self._error('Escribe un comentario.')
        if len(text) > 2000:
            return self._error('El comentario no puede superar los 2000 caracteres.')
        request.env['neahomes.blog.comentario'].sudo().create({
            'articulo_id': article.id, 'partner_id': partner.id, 'body': text,
        })
        return self._json({'article': self._article_detail(article, viewer=partner)})

    @http.route('/neahomes/api/blog/<int:article_id>/image', type='http', auth='public', methods=['GET'], csrf=False)
    @json_errors
    def blog_image(self, article_id, width=0, **kw):
        if (err := self._guard()):
            return err
        return self._image_response('neahomes.blog.articulo', article_id, width, 1920, [('published', '=', True)])

    @http.route('/neahomes/api/slides', type='http', auth='public', methods=['GET'], csrf=False)
    @json_errors
    def slides(self, **kw):
        if (err := self._guard()):
            return err
        slides = request.env['neahomes.slide'].sudo().search([], limit=3)
        return self._json({'slides': [s._api_values() for s in slides]})

    @http.route('/neahomes/api/slide/<int:slide_id>/image', type='http', auth='public', methods=['GET'], csrf=False)
    @json_errors
    def slide_image(self, slide_id, width=0, **kw):
        if (err := self._guard()):
            return err
        return self._image_response('neahomes.slide', slide_id, width, 2560)

    @http.route('/neahomes/api/settings', type='http', auth='public', methods=['GET'], csrf=False)
    @json_errors
    def settings(self, **kw):
        if (err := self._guard()):
            return err
        Param = request.env['neahomes.parametro'].sudo()
        return self._json({
            'instagram_url': Param.get_param('instagram_url', ''),
            'legal': {key: Param.get_param(f'legal_{key}', '') for key in ('company', 'nif', 'address', 'email')},
        })

    @http.route('/neahomes/api/contact', type='http', auth='public', methods=['POST'], csrf=False)
    @json_errors
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

    @http.route('/neahomes/api/conditions', type='http', auth='public', methods=['GET'], csrf=False)
    @json_errors
    def conditions(self, **kw):
        if (err := self._guard()):
            return err
        current = request.env['neahomes.condicion']._current()
        return self._json({'conditions': current._api_values() if current else None})

    @http.route('/neahomes/api/register', type='http', auth='public', methods=['POST'], csrf=False)
    @json_errors
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
        condicion = None
        if body.get('selection'):
            condicion, err = self._conditions_check(body)
            if err:
                return err
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
                self._register_acceptance(partner, condicion, quote)
        except ValueError as e:
            request.env.cr.rollback()
            return self._error(str(e))
        return self._json({
            'token': partner._nea_new_token(),
            'partner': partner._nea_api_values(),
            'quote': quote and quote._api_values(),
        })

    @http.route('/neahomes/api/login', type='http', auth='public', methods=['POST'], csrf=False)
    @json_errors
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
    @json_errors
    def logout(self, **kw):
        if (err := self._guard()):
            return err
        partner = self._partner()
        if partner:
            partner.write({'nea_token': False})
        return self._json({'ok': True})

    @http.route('/neahomes/api/me', type='http', auth='public', methods=['GET'], csrf=False)
    @json_errors
    def me(self, **kw):
        if (err := self._guard()):
            return err
        partner = self._partner()
        if not partner:
            return self._error('Sesión no válida', 401)
        return self._json({
            'partner': partner._nea_api_values(),
            'quotes': [q._api_values() for q in partner.nea_cotizacion_ids],
            'tickets': [t._api_values(viewer=partner) for t in partner.nea_ticket_ids],
        })

    @http.route('/neahomes/api/tickets', type='http', auth='public', methods=['POST'], csrf=False)
    @json_errors
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
        ticket = request.env['neahomes.ticket'].sudo().with_context(mail_create_nosubscribe=True).create({
            'name': title,
            'description': description,
            'partner_id': partner.id,
            'cotizacion_id': quote.id or False,
        })
        return self._json({'ticket': ticket._api_values(viewer=partner)})

    @http.route('/neahomes/api/tickets/<int:ticket_id>/reply', type='http', auth='public', methods=['POST'], csrf=False)
    @json_errors
    def reply_ticket(self, ticket_id, **kw):
        if (err := self._guard()):
            return err
        partner = self._partner()
        if not partner:
            return self._error('Sesión no válida', 401)
        ticket = request.env['neahomes.ticket'].sudo().browse(ticket_id).exists()
        if not ticket or not ticket._nea_can_access(partner):
            return self._error('Ticket no encontrado', 404)
        text = (self._body().get('body') or '').strip()
        if not text:
            return self._error('Escribe una respuesta.')
        ticket._nea_reply(partner, text)
        return self._json({'ticket': ticket._api_values(viewer=partner)})

    # ------------------------------------------------------------ CRM web
    def _comercial(self):
        partner = self._partner()
        if not partner:
            return None, self._error('Sesión no válida', 401)
        if not partner.nea_comercial:
            return None, self._error('Solo para comerciales', 403)
        return partner, None

    @http.route('/neahomes/api/crm', type='http', auth='public', methods=['GET'], csrf=False)
    @json_errors
    def crm(self, **kw):
        if (err := self._guard()):
            return err
        partner, err = self._comercial()
        if err:
            return err
        quotes = request.env['neahomes.cotizacion'].sudo().search([('comercial_id', '=', partner.id)])
        tickets = request.env['neahomes.ticket'].sudo().search([('partner_id', 'in', quotes.partner_id.ids)])
        return self._json({
            'states': [{'key': key, 'label': label} for key, label in QUOTE_STATES],
            'quotes': [q._crm_values() for q in quotes],
            'tickets': [t._api_values(viewer=partner) for t in tickets],
        })

    @http.route('/neahomes/api/crm/quote/<int:quote_id>/state', type='http', auth='public', methods=['POST'], csrf=False)
    @json_errors
    def crm_move_quote(self, quote_id, **kw):
        if (err := self._guard()):
            return err
        partner, err = self._comercial()
        if err:
            return err
        quote = request.env['neahomes.cotizacion'].sudo().browse(quote_id).exists()
        if not quote or quote.comercial_id != partner:
            return self._error('Cotización no encontrada', 404)
        state = self._body().get('state')
        labels = dict(QUOTE_STATES)
        if state not in labels:
            return self._error('Estado no válido.')
        if quote.state != state:
            quote.write({'state': state})
            quote.message_post(body=f'{partner.name} movió la cotización a «{labels[state]}» desde el CRM web.',
                               author_id=partner.id, subtype_xmlid='mail.mt_note')
        return self._json({'quote': quote._crm_values()})

    @http.route('/neahomes/api/quotes', type='http', auth='public', methods=['POST'], csrf=False)
    @json_errors
    def create_quote(self, **kw):
        if (err := self._guard()):
            return err
        partner = self._partner()
        if not partner:
            return self._error('Sesión no válida', 401)
        body = self._body()
        condicion, err = self._conditions_check(body)
        if err:
            return err
        try:
            quote = request.env['neahomes.cotizacion'].sudo().create_from_selection(partner, body.get('selection') or {})
        except ValueError as e:
            return self._error(str(e))
        self._register_acceptance(partner, condicion, quote)
        return self._json({'quote': quote._api_values()})

    # --------------------------------------------------------- datos personales
    def _es(self, model):
        """Nombres de países y provincias en español si el idioma está instalado."""
        Model = request.env[model].sudo()
        if request.env['res.lang'].sudo().search_count([('code', '=', 'es_ES')]):
            Model = Model.with_context(lang='es_ES')
        return Model

    def _profile_values(self, partner):
        return dict(
            {field: partner[field] or '' for field in PROFILE_FIELDS},
            country_id=partner.country_id.id or None,
            state_id=partner.state_id.id or None,
        )

    @http.route('/neahomes/api/profile', type='http', auth='public', methods=['GET'], csrf=False)
    @json_errors
    def profile(self, **kw):
        if (err := self._guard()):
            return err
        partner = self._partner()
        if not partner:
            return self._error('Sesión no válida', 401)
        countries = self._es('res.country').search([]).sorted('name')
        return self._json({
            'profile': self._profile_values(partner),
            'countries': [{'id': c.id, 'name': c.name, 'code': c.code} for c in countries],
        })

    @http.route('/neahomes/api/states', type='http', auth='public', methods=['GET'], csrf=False)
    @json_errors
    def states(self, country_id=None, **kw):
        if (err := self._guard()):
            return err
        if not str(country_id or '').isdigit():
            return self._json({'states': []})
        states = self._es('res.country.state').search([('country_id', '=', int(country_id))]).sorted('name')
        return self._json({'states': [{'id': s.id, 'name': s.name} for s in states]})

    @http.route('/neahomes/api/profile', type='http', auth='public', methods=['POST'], csrf=False)
    @json_errors
    def update_profile(self, **kw):
        if (err := self._guard()):
            return err
        partner = self._partner()
        if not partner:
            return self._error('Sesión no válida', 401)
        body = self._body()
        vals = {field: (str(body.get(field) or '')).strip()[:255] or False for field in PROFILE_FIELDS}
        if not vals['name']:
            return self._error('El nombre es obligatorio.')
        if not vals['email'] or not EMAIL_RE.match(vals['email']):
            return self._error('Indica un email válido.')
        country = self._es('res.country').browse(int(body['country_id'])).exists() \
            if str(body.get('country_id') or '').isdigit() else self._es('res.country')
        state = self._es('res.country.state').browse(int(body['state_id'])).exists() \
            if str(body.get('state_id') or '').isdigit() else self._es('res.country.state')
        if state and state.country_id != country:
            return self._error('La provincia no corresponde al país elegido.')
        vals.update(country_id=country.id or False, state_id=state.id or False)
        try:
            partner.write(vals)
        except (ValidationError, UserError) as e:
            # P. ej. NIF con formato incorrecto si está instalada la validación de NIF.
            request.env.cr.rollback()
            return self._error(e.args[0] if e.args else str(e))
        return self._json({'profile': self._profile_values(partner), 'partner': partner._nea_api_values()})

    @http.route('/neahomes/api/password', type='http', auth='public', methods=['POST'], csrf=False)
    @json_errors
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

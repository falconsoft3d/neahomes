import re
import unicodedata

from odoo import api, fields, models


def slugify(text):
    text = unicodedata.normalize('NFKD', text or '').encode('ascii', 'ignore').decode('ascii')
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-') or 'articulo'


class SlugMixin(models.AbstractModel):
    """URL amigable (/blog/mi-articulo): se genera del nombre si se deja vacía y siempre es única."""
    _name = 'neahomes.slug.mixin'
    _description = 'URL amigable'

    slug = fields.Char(string='URL', copy=False, index=True,
                       help='Parte final de la dirección en la web. Se genera sola a partir del nombre.')

    def _unique_slug(self, base):
        slug, n = base, 2
        while self.with_context(active_test=False).search_count([('slug', '=', slug), ('id', 'not in', self.ids)]):
            slug, n = f'{base}-{n}', n + 1
        return slug

    @api.model_create_multi
    def create(self, vals_list):
        records = super().create(vals_list)
        for rec in records:
            rec.slug = rec._unique_slug(slugify(rec.slug or rec.name))
        return records

    def write(self, vals):
        res = super().write(vals)
        if 'slug' in vals or 'name' in vals:
            for rec in self:
                wanted = rec._unique_slug(slugify(rec.slug or rec.name))
                if wanted != rec.slug:
                    super(SlugMixin, rec).write({'slug': wanted})
        return res


class NeahomesBlogCategoria(models.Model):
    _name = 'neahomes.blog.categoria'
    _inherit = 'neahomes.slug.mixin'
    _description = 'Categoría del blog'
    _order = 'sequence, name'

    name = fields.Char(string='Nombre', required=True)
    sequence = fields.Integer(default=10)
    active = fields.Boolean(default=True)
    articulo_ids = fields.One2many('neahomes.blog.articulo', 'categoria_id', string='Artículos')

    def _api_values(self, count=None):
        self.ensure_one()
        return {'id': self.id, 'name': self.name, 'slug': self.slug, 'count': count or 0}


class NeahomesBlogArticulo(models.Model):
    _name = 'neahomes.blog.articulo'
    _inherit = 'neahomes.slug.mixin'
    _description = 'Artículo del blog'
    _order = 'date desc, id desc'

    name = fields.Char(string='Título', required=True)
    categoria_id = fields.Many2one('neahomes.blog.categoria', string='Categoría', ondelete='restrict')
    date = fields.Date(string='Fecha', required=True, default=fields.Date.context_today)
    author_id = fields.Many2one('res.users', string='Autor', default=lambda self: self.env.user)
    summary = fields.Text(string='Resumen', help='Texto corto que aparece en el listado del blog.')
    body = fields.Html(string='Contenido')
    image = fields.Image(string='Imagen', max_width=1920, max_height=1920)
    published = fields.Boolean(string='Publicado', default=False,
                               help='Solo los artículos publicados aparecen en la web.')
    active = fields.Boolean(default=True)
    allow_comments = fields.Boolean(string='Permitir comentarios', default=True)
    comentario_ids = fields.One2many('neahomes.blog.comentario', 'articulo_id', string='Comentarios')
    comment_count = fields.Integer(compute='_compute_comment_count', string='Comentarios visibles')

    @api.depends('comentario_ids.visible')
    def _compute_comment_count(self):
        for rec in self:
            rec.comment_count = len(rec.comentario_ids.filtered('visible'))

    def _image_version(self):
        self.ensure_one()
        return int(self.write_date.timestamp()) if self.image else 0

    def _api_values(self):
        self.ensure_one()
        return {
            'id': self.id,
            'slug': self.slug,
            'title': self.name,
            'summary': self.summary or '',
            'date': fields.Date.to_string(self.date),
            'author': self.author_id.name or '',
            'category': {'name': self.categoria_id.name, 'slug': self.categoria_id.slug} if self.categoria_id else None,
            'image_version': self._image_version(),
            'comment_count': self.comment_count,
            'allow_comments': self.allow_comments,
        }


class NeahomesBlogComentario(models.Model):
    _name = 'neahomes.blog.comentario'
    _description = 'Comentario del blog'
    _order = 'id'
    _rec_name = 'partner_id'

    articulo_id = fields.Many2one('neahomes.blog.articulo', string='Artículo', required=True, ondelete='cascade')
    partner_id = fields.Many2one('res.partner', string='Autor', required=True, ondelete='cascade')
    body = fields.Text(string='Comentario', required=True)
    visible = fields.Boolean(string='Visible', default=True, help='Desmárcalo para ocultar el comentario en la web.')

    def _api_values(self, viewer=None):
        self.ensure_one()
        return {
            'id': self.id,
            'author': self.partner_id.name,
            'body': self.body,
            'date': fields.Datetime.to_string(self.create_date),
            'mine': bool(viewer and self.partner_id == viewer),
        }

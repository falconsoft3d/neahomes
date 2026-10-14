from odoo import fields, models


class NeahomesPagina(models.Model):
    """Páginas de contenido de la web editables desde Odoo (p. ej. «Quiénes somos»)."""
    _name = 'neahomes.pagina'
    _description = 'Página web'

    name = fields.Char(string='Título', required=True)
    subtitle = fields.Char(string='Subtítulo')
    slug = fields.Char(string='URL', required=True, readonly=True, copy=False,
                       help='Dirección de la página en la web. La usa el frontend; no la cambies.')
    image = fields.Image(string='Imagen', max_width=2560, max_height=1600)
    body = fields.Html(string='Contenido')

    _sql_constraints = [('slug_uniq', 'unique(slug)', 'Ya existe una página con esa URL.')]

    def _image_version(self):
        self.ensure_one()
        return int(self.write_date.timestamp()) if self.image else 0

    def _api_values(self):
        self.ensure_one()
        return {
            'id': self.id,
            'title': self.name,
            'subtitle': self.subtitle or '',
            'body': self.body or '',
            'image_version': self._image_version(),
        }

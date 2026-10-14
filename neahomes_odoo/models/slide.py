from odoo import _, api, fields, models
from odoo.exceptions import ValidationError

MAX_SLIDES = 3


class NeahomesSlide(models.Model):
    _name = 'neahomes.slide'
    _description = 'Slide del carrusel web'
    _order = 'sequence, id'

    name = fields.Char(string='Título', required=True)
    subtitle = fields.Char(string='Subtítulo')
    image = fields.Image(string='Imagen', required=True, max_width=2560, max_height=1600)
    text_theme = fields.Selection([('claro', 'Texto blanco'), ('oscuro', 'Texto oscuro')],
                                  string='Color del texto', default='claro', required=True,
                                  help='Texto blanco para fotos oscuras, texto oscuro para fotos claras.')
    button1_text = fields.Char(string='Botón principal', default='Encargar casa')
    button1_url = fields.Char(string='Enlace botón principal', default='/encargar')
    button2_text = fields.Char(string='Botón secundario', default='Ver modelos')
    button2_url = fields.Char(string='Enlace botón secundario', default='/#modelos')
    sequence = fields.Integer(default=10)
    active = fields.Boolean(default=True)

    @api.constrains('active')
    def _check_max_slides(self):
        if self.search_count([('active', '=', True)]) > MAX_SLIDES:
            raise ValidationError(_('El carrusel admite como máximo %s slides activos.', MAX_SLIDES))

    def _image_version(self):
        self.ensure_one()
        return int(self.write_date.timestamp()) if self.image else 0

    def _api_values(self):
        self.ensure_one()
        return {
            'id': self.id,
            'title': self.name,
            'subtitle': self.subtitle or '',
            'theme': self.text_theme,
            'image_version': self._image_version(),
            'button1_text': self.button1_text or '',
            'button1_url': self.button1_url or '',
            'button2_text': self.button2_text or '',
            'button2_url': self.button2_url or '',
        }

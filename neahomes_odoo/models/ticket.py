from odoo import api, fields, models
from odoo.tools import html2plaintext, plaintext2html

TICKET_STATES = [
    ('nuevo', 'Nuevo'),
    ('trabajando', 'Trabajando'),
    ('resuelto', 'Resuelto'),
]


class NeahomesTicket(models.Model):
    _name = 'neahomes.ticket'
    _inherit = ['mail.thread']
    _description = 'Ticket NeaHomes'
    _order = 'id desc'

    ref = fields.Char(string='Referencia', required=True, copy=False, readonly=True, default='Nuevo')
    name = fields.Char(string='Título', required=True, tracking=True)
    description = fields.Text(string='Texto', required=True)
    partner_id = fields.Many2one('res.partner', string='Cliente', required=True, ondelete='cascade', tracking=True)
    cotizacion_id = fields.Many2one('neahomes.cotizacion', string='Cotización',
                                    domain="[('partner_id', '=', partner_id)]", ondelete='set null')
    state = fields.Selection(TICKET_STATES, string='Estado', default='nuevo', required=True,
                             tracking=True, group_expand='_group_expand_state')

    @api.model
    def _group_expand_state(self, states, domain, order):
        return [key for key, _label in TICKET_STATES]

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get('ref', 'Nuevo') == 'Nuevo':
                vals['ref'] = self.env['ir.sequence'].sudo().next_by_code('neahomes.ticket') or 'Nuevo'
        return super().create(vals_list)

    def action_trabajando(self):
        self.write({'state': 'trabajando'})

    def action_resuelto(self):
        self.write({'state': 'resuelto'})

    def action_nuevo(self):
        self.write({'state': 'nuevo'})

    def _public_messages(self):
        """Conversación visible para cliente y comercial: mensajes, sin notas internas ni cambios de estado."""
        self.ensure_one()
        return self.sudo().message_ids.filtered(
            lambda m: m.message_type == 'comment' and not m.subtype_id.internal
        ).sorted('id')

    def _nea_reply(self, author, text):
        self.ensure_one()
        return self.sudo().message_post(
            body=plaintext2html(text), author_id=author.id,
            message_type='comment', subtype_xmlid='mail.mt_comment',
        )

    def _nea_can_access(self, partner):
        """El cliente del ticket o el comercial de ese cliente."""
        self.ensure_one()
        return self.partner_id == partner or (partner.nea_comercial and self.partner_id in partner._nea_crm_clients())

    def _api_values(self, viewer=None):
        self.ensure_one()
        return {
            'messages': [{
                'id': m.id,
                'author': m.author_id.name or '',
                'body': html2plaintext(m.body or '').strip(),
                'date': fields.Datetime.to_string(m.date),
                'mine': bool(viewer and m.author_id == viewer),
            } for m in self._public_messages()],
            'client': self.partner_id.name,
            'id': self.id,
            'ref': self.ref,
            'title': self.name,
            'description': self.description,
            'state': self.state,
            'state_label': dict(TICKET_STATES)[self.state],
            'date': fields.Datetime.to_string(self.create_date),
            'quote': self.cotizacion_id.name or '',
        }

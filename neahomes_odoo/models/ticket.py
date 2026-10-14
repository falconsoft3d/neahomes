from odoo import api, fields, models

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

    def _api_values(self):
        self.ensure_one()
        return {
            'id': self.id,
            'ref': self.ref,
            'title': self.name,
            'description': self.description,
            'state': self.state,
            'state_label': dict(TICKET_STATES)[self.state],
            'date': fields.Datetime.to_string(self.create_date),
            'quote': self.cotizacion_id.name or '',
        }

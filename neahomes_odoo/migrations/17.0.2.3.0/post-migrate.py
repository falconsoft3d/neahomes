from odoo import SUPERUSER_ID, api


def migrate(cr, version):
    # Una sola vez: planes de crédito típicos (si se borran después, no vuelven a aparecer).
    env = api.Environment(cr, SUPERUSER_ID, {})
    env['neahomes.credito']._create_typical_plans()

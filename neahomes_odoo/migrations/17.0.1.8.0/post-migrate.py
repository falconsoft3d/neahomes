from odoo import SUPERUSER_ID, api


def migrate(cr, version):
    # Al crear el grupo NeaHomes, los administradores (Ajustes) lo reciben para no perder el menú.
    # El resto de usuarios hay que añadirlos a mano en Ajustes > Usuarios.
    env = api.Environment(cr, SUPERUSER_ID, {})
    group = env.ref('neahomes_odoo.group_neahomes_user')
    admins = env.ref('base.group_system').users | env.ref('base.user_root')
    group.write({'users': [(4, user.id) for user in admins]})

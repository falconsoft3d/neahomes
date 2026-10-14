from . import models
from . import controllers


def post_init_hook(env):
    # Instalación nueva: planes de crédito típicos (al actualizar lo hace migrations/17.0.2.3.0).
    env['neahomes.credito']._create_typical_plans()

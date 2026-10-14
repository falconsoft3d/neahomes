{
    'name': 'NeaHomes',
    'version': '17.0.1.0.0',
    'summary': 'Configuración de casas NeaHomes',
    'sequence': 10,
    'description': """
NeaHomes
================================
Catálogos de Tamaño, Cubierta, Acabados y Modelos.
    """,
    'website': 'https://www.marlonfalcon.com',
    'depends': ['base', 'contacts'],
    'category': 'Extra Tools',
    'auto_install': False,
    'application': True,
    'data': [
        'security/ir.model.access.csv',
        'views/view.xml',
    ],
    'license': 'LGPL-3',
}

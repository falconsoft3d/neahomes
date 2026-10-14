{
    'name': 'NeaHomes',
    'version': '17.0.1.3.0',
    'summary': 'Configuración de casas NeaHomes',
    'sequence': 10,
    'description': """
NeaHomes
================================
Catálogos de Modelos (m² y precio), Cubiertas y Acabados con precio,
cotizaciones que generan oportunidades en el CRM y API JSON
para el frontend Next.js (neahomes_web).
    """,
    'website': 'https://www.marlonfalcon.com',
    'depends': ['base', 'contacts', 'crm'],
    'category': 'Extra Tools',
    'auto_install': False,
    'application': True,
    'data': [
        'security/ir.model.access.csv',
        'data/neahomes_data.xml',
        'views/view.xml',
    ],
    'license': 'LGPL-3',
}

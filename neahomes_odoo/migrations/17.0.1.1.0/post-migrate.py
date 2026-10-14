def migrate(cr, version):
    # El catálogo Tamaño se eliminó: los m² y el precio pasan al Modelo.
    cr.execute('DROP TABLE IF EXISTS neahomes_tamano CASCADE')

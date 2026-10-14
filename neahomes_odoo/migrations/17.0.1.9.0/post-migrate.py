def migrate(cr, version):
    # Antes «Plana / transitable» era una sola forma (dibujada con barandilla).
    # Ahora son dos: las cubiertas cuyo nombre dice «transitable» pasan a Transitable; el resto queda Plana.
    cr.execute("""
        UPDATE neahomes_cubierta
           SET forma = 'transitable'
         WHERE forma = 'plana' AND name ILIKE '%%transit%%'
    """)

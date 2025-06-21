import json, sqlite3, os, pathlib

DB = 'preguntas.db'
SCHEMA = """
CREATE TABLE IF NOT EXISTS preguntas(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tema TEXT NOT NULL,
    pregunta TEXT NOT NULL,
    respuestas TEXT NOT NULL,      -- JSON string
    respuestaCorrecta INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS scores(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tema TEXT NOT NULL,
    aciertos INTEGER NOT NULL,
    momento TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

def main():
    # 1. Cargar el JSON
    data = json.load(open('preguntas.json', encoding='utf-8'))

    # 2. Crear DB + tablas
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.executescript(SCHEMA)

    # 3. Vaciar tabla preguntas por si ya existía
    cur.execute("DELETE FROM preguntas")

    # 4. Insertar
    for tema, preguntas in data.items():
        for p in preguntas:
            cur.execute("""
                INSERT INTO preguntas (tema, pregunta, respuestas, respuestaCorrecta)
                VALUES (?,?,?,?)
            """, (tema,
                    p['pregunta'],
                    json.dumps(p['respuestas'], ensure_ascii=False),
                    p['respuestaCorrecta']))
    con.commit()
    con.close()
    print("✅ Preguntas cargadas:", sum(len(v) for v in data.values()))

if __name__ == "__main__":
    main()

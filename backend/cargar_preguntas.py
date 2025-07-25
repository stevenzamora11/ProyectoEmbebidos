import json, sqlite3

DB = 'preguntas.db'
SCHEMA = """
CREATE TABLE IF NOT EXISTS temas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT UNIQUE NOT NULL
);
CREATE TABLE IF NOT EXISTS preguntas(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tema_id INTEGER NOT NULL,
    pregunta TEXT NOT NULL,
    respuestas TEXT NOT NULL,
    respuestaCorrecta INTEGER NOT NULL,
    FOREIGN KEY (tema_id) REFERENCES temas(id)
);
"""

def main():
    data = json.load(open('preguntas.json', encoding='utf-8'))

    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.executescript(SCHEMA)

    # Limpiar base
    cur.execute("DELETE FROM preguntas")
    cur.execute("DELETE FROM temas")

    for tema, preguntas in data.items():
        # Insertar tema si no existe
        cur.execute("INSERT INTO temas (nombre) VALUES (?)", (tema,))
        tema_id = cur.lastrowid

        for p in preguntas:
            respuestas = p['respuestas']
            correcta = p['respuestaCorrecta']
            # Convertir respuesta correcta a índice numérico si es string
            if isinstance(correcta, str):
                if correcta in respuestas:
                    correcta = respuestas.index(correcta)
                else:
                    print(f"⚠️ Respuesta no encontrada: {correcta} en tema {tema}")
                    continue  # Saltar esta pregunta

            cur.execute("""
                INSERT INTO preguntas (tema_id, pregunta, respuestas, respuestaCorrecta)
                VALUES (?,?,?,?)
            """, (tema_id, p['pregunta'], json.dumps(respuestas, ensure_ascii=False), correcta))

    con.commit()
    con.close()
    print("✅ Preguntas cargadas:", sum(len(v) for v in data.values()))

if __name__ == "__main__":
    main()


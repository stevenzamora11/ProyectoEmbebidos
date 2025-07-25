import sqlite3

DB = 'ranking.db'

SCHEMA = """
CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jugador TEXT NOT NULL,
    tema TEXT NOT NULL,
    aciertos INTEGER NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

def main():
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.executescript(SCHEMA)
    con.commit()
    con.close()
    print("✅ Base de datos de ranking creada correctamente.")

if __name__ == "__main__":
    main() 
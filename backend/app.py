from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3, json, pathlib, datetime
from dotenv import load_dotenv
import os

load_dotenv()

ADMIN_USER = os.getenv("ADMIN_USER")
ADMIN_PASS = os.getenv("ADMIN_PASS")

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

DB_PREGUNTAS = 'preguntas.db'
DB_RANKING = 'ranking.db'

def query_preguntas(sql, params=(), one=False, commit=False):
    with sqlite3.connect(DB_PREGUNTAS) as con:
        con.row_factory = sqlite3.Row
        cur = con.execute(sql, params)
        if commit:
            con.commit()
            return None
        rows = cur.fetchall()
    return (rows[0] if rows else None) if one else rows

def query_ranking(sql, params=(), one=False, commit=False):
    with sqlite3.connect(DB_RANKING) as con:
        con.row_factory = sqlite3.Row
        cur = con.execute(sql, params)
        if commit:
            con.commit()
            return None
        rows = cur.fetchall()
    return (rows[0] if rows else None) if one else rows

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.post('/api/auth/admin')
def auth_admin():
    data = request.json
    if data.get('usuario') == ADMIN_USER and data.get('password') == ADMIN_PASS:
        return jsonify({"success": True}), 200
    return jsonify({"success": False}), 401


# ----------- TEMAS -----------
@app.get('/api/temas')
def temas():
    try:
        filas = query_preguntas('SELECT nombre FROM temas')
        return jsonify([f['nombre'] for f in filas])
    except Exception as e:
        print("Error en /api/temas:", e)  # Verás esto en la terminal de Flask
        return jsonify({"error": "No se pudieron cargar los temas"}), 500

@app.post('/api/temas')
def crear_tema():
    data = request.json
    query_preguntas('INSERT INTO temas (nombre) VALUES (?)', (data['tema'],), commit=True)
    return '', 201

@app.put('/api/temas/<tema_anterior>')
def renombrar_tema(tema_anterior):
    data = request.json
    query_preguntas('UPDATE temas SET nombre=? WHERE nombre=?', (data['tema'], tema_anterior), commit=True)
    return '', 204

@app.delete('/api/temas/<tema>')
def eliminar_tema(tema):
    tema_id = query_preguntas('SELECT id FROM temas WHERE nombre=?', (tema,), one=True)
    if tema_id:
        query_preguntas('DELETE FROM preguntas WHERE tema_id=?', (tema_id['id'],), commit=True)
        query_preguntas('DELETE FROM temas WHERE id=?', (tema_id['id'],), commit=True)
    return '', 204

# ----------- PREGUNTAS -----------
@app.get('/api/preguntas')
def get_preguntas():
    tema = request.args['tema']
    tema_id = query_preguntas('SELECT id FROM temas WHERE nombre=?', (tema,), one=True)
    if not tema_id:
        return jsonify([])
    filas = query_preguntas('SELECT id, pregunta, respuestas, respuestaCorrecta FROM preguntas WHERE tema_id=?', (tema_id['id'],))
    return jsonify([
        {
            'id': f['id'],
            'pregunta': f['pregunta'],
            'respuestas': json.loads(f['respuestas']),
            'respuestaCorrecta': f['respuestaCorrecta']
        } for f in filas
    ])

@app.post('/api/preguntas')
def agregar_pregunta():
    data = request.json
    tema_id = query_preguntas('SELECT id FROM temas WHERE nombre=?', (data['tema'],), one=True)
    if not tema_id:
        return 'Tema no encontrado', 404
    query_preguntas('INSERT INTO preguntas (tema_id, pregunta, respuestas, respuestaCorrecta) VALUES (?,?,?,?)',
        (tema_id['id'], data['pregunta'], json.dumps(data['respuestas'], ensure_ascii=False), data['respuestaCorrecta']), commit=True)
    return '', 201

@app.put('/api/preguntas/<int:pregunta_id>')
def editar_pregunta(pregunta_id):
    data = request.json
    query_preguntas('UPDATE preguntas SET pregunta=?, respuestas=?, respuestaCorrecta=? WHERE id=?',
        (data['pregunta'], json.dumps(data['respuestas'], ensure_ascii=False), data['respuestaCorrecta'], pregunta_id), commit=True)
    return '', 204

@app.delete('/api/preguntas/<int:pregunta_id>')
def eliminar_pregunta(pregunta_id):
    query_preguntas('DELETE FROM preguntas WHERE id=?', (pregunta_id,), commit=True)
    return '', 204

# ----------- SCORES Y RANKING -----------
@app.post('/api/scores')
def scores():
    data = request.json
    print("Recibido puntaje:", data)  # Log para depuración
    query_ranking('INSERT INTO scores (jugador, tema, aciertos, fecha) VALUES (?,?,?,?)',
        (data['jugador'], data['tema'], data['aciertos'], datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')), commit=True)
    return '', 204

@app.get('/api/ranking')
def ranking():
    # Obtener solo la última vez que cada jugador jugó cada tema
    filas = query_ranking('''
        SELECT jugador, tema, aciertos, fecha 
        FROM scores s1 
        WHERE fecha = (
            SELECT MAX(fecha) 
            FROM scores s2 
            WHERE s2.jugador = s1.jugador AND s2.tema = s1.tema
        )
        ORDER BY fecha DESC, aciertos DESC 
        LIMIT 10
    ''')
    return jsonify([
        {
            'jugador': f['jugador'],
            'tema': f['tema'],
            'aciertos': f['aciertos'],
            'fecha': f['fecha']
        } for f in filas
    ])


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3, json, pathlib

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)  # permite peticiones desde tu front-end

DB = 'preguntas.db'

def query(sql, params=(), one=False):
    with sqlite3.connect(DB) as con:
        con.row_factory = sqlite3.Row
        cur = con.execute(sql, params)
        rows = cur.fetchall()
    return (rows[0] if rows else None) if one else rows

@app.route('/')
def index():
    # sirve index.html directamente
    return send_from_directory(app.static_folder, 'index.html')

@app.get('/api/temas')
def temas():
    filas = query('SELECT DISTINCT tema FROM preguntas')
    return jsonify([f['tema'] for f in filas])

@app.get('/api/questions')
def questions():
    tema = request.args['tema']
    filas = query('SELECT pregunta, respuestas, respuestaCorrecta FROM preguntas WHERE tema=?', (tema,))
    return jsonify([
        {
            'pregunta': f['pregunta'],
            'respuestas': json.loads(f['respuestas']),
            'respuestaCorrecta': f['respuestaCorrecta']
        } for f in filas
    ])

@app.post('/api/scores')
def scores():
    data = request.json
    query('INSERT INTO scores (tema, aciertos) VALUES (?,?)', (data['tema'], data['aciertos']))
    return '', 204

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

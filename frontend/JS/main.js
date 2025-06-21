import { preguntasYRespuestas as fallbackPreguntas } from "./preguntasyrespuestas.js";

/* ---------- Variables globales ---------- */
let preguntasSeleccionadas = [];
let puntaje = 0;
let temaActual = "";

/* ---------- Elementos del DOM ---------- */
const contenedorPregunta  = document.querySelector('#contenedor-pregunta');
const contenedorOpciones  = document.querySelector('#contenedor-opciones');
const contenedorResultado = document.querySelector('#contenedor-resultado');

/* ---------- Auxiliares API ---------- */
async function obtenerTemas() {
    try {
        const res = await fetch('/api/temas');
        if (!res.ok) throw new Error("API caída");
        return await res.json();                   // ['física', 'química', ...]
    } catch (e) {
        console.warn("⚠️ Usando preguntas locales:", e.message);
        return Object.keys(fallbackPreguntas);     // fallback local
    }
}

async function obtenerPreguntas(tema) {
    try {
        const res = await fetch(`/api/questions?tema=${encodeURIComponent(tema)}`);
        if (!res.ok) throw new Error("API caída");
        return await res.json();                   // array de objetos
    } catch (e) {
        console.warn("⚠️ Usando preguntas locales:", e.message);
        return fallbackPreguntas[tema];            // fallback local
    }
}

async function enviarPuntaje(tema, aciertos) {
    try {
        await fetch('/api/scores', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ tema, aciertos })
        });
    } catch (e) {
        console.warn("⚠️ No se pudo enviar el puntaje al servidor:", e.message);
    }
}

/* ---------- Lógica principal ---------- */
(async function init() {          // IIFE async para poder usar await al arrancar
    await mostrarTemas();
})();

async function mostrarTemas() {
    contenedorResultado.innerHTML = '';
    contenedorPregunta.innerHTML  = '<h2 class="pregunta">Selecciona el tema:</h2>';
    contenedorOpciones.innerHTML  = '';

    const temas = await obtenerTemas();
    temas.forEach(t =>
        contenedorOpciones.innerHTML += `<p class="opcion">${t.toUpperCase()}</p>`
    );

    contenedorOpciones.querySelectorAll('.opcion').forEach(op =>
        op.addEventListener('click', () => seleccionarTema(op.textContent.toLowerCase()))
    );
}

async function seleccionarTema(tema) {
    temaActual = tema;
    preguntasSeleccionadas = await obtenerPreguntas(tema);
    puntaje = 0;
    mostrarPregunta(0);
}

function mostrarPregunta(indice) {
    if (indice >= preguntasSeleccionadas.length) {
        mostrarResultado();
        return;
    }
    const { pregunta, respuestaCorrecta, respuestas } = preguntasSeleccionadas[indice];
    contenedorPregunta.innerHTML = `<h2 class="pregunta">${pregunta}</h2>`;
    mostrarOpciones(respuestas, respuestaCorrecta, indice);
}

function mostrarOpciones(respuestas, respuestaCorrecta, indice) {
    contenedorOpciones.innerHTML = '';
    respuestas.forEach(r =>
        contenedorOpciones.innerHTML += `<p class="opcion">${r}</p>`
    );

    contenedorOpciones.querySelectorAll('.opcion').forEach(op =>
        op.addEventListener('click', () => {
            if (op.textContent === (typeof respuestaCorrecta === 'number' ? respuestas[respuestaCorrecta] : respuestaCorrecta)) {
                puntaje++;
                op.classList.add('correcta');
            } else {
                op.classList.add('incorrecta');
            }
            setTimeout(() => mostrarPregunta(indice + 1), 500);
        })
    );
}

function mostrarResultado() {
    contenedorPregunta.innerHTML = '';
    contenedorOpciones.innerHTML = '';
    contenedorResultado.innerHTML = `
        <h2 class="total">Has acertado ${puntaje} de ${preguntasSeleccionadas.length}</h2>
        <div class="contenedor-boton">
            <button id="reiniciarBtn">Reiniciar</button>
        </div>
    `;

    // Enviar score al servidor (no bloquea UI)
    enviarPuntaje(temaActual, puntaje);

    contenedorResultado.querySelector('#reiniciarBtn').addEventListener('click', mostrarTemas);
}
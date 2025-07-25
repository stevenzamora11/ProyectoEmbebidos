
/* ---------- Variables globales ---------- */
let preguntasSeleccionadas = [];
let puntaje = 0;
let temaActual = "";
let nombreJugador = null;
let temasAdmin = [];
let temaSeleccionado = null;

// Variables para usuario y contraseña de admin en memoria
let adminUser = "admin";
let adminPass = "admin";

// Simulación de ranking de jugadores en memoria
let rankingSimulado = [];

/* ---------- Elementos del DOM ---------- */
const contenedorInicial = document.getElementById('contenedor-inicial');
const seccionDinamica = document.getElementById('seccion-dinamica');
const contenedorPregunta = document.getElementById('contenedor-pregunta');
const contenedorOpciones = document.getElementById('contenedor-opciones');
const contenedorResultado = document.getElementById('contenedor-resultado');

/* ---------- Inicialización ---------- */
document.addEventListener('DOMContentLoaded', () => {
    inicializarEventListeners();
});

/* ---------- Event Listeners ---------- */
function inicializarEventListeners() {
    if (contenedorInicial) {
        document.getElementById('btn-jugador').addEventListener('click', mostrarFormularioJugador);
        document.getElementById('btn-admin').addEventListener('click', mostrarFormularioAdmin);
    }
}

/* ---------- API Helpers ---------- */
async function obtenerTemas() {
    try {
        const res = await fetch('/api/temas');
        if (!res.ok) throw new Error("API caída");
        return await res.json();
    } catch (e) {
        console.error("⚠️ No se pudieron cargar los temas:", e.message);
        return [];
    }
}

async function obtenerPreguntas(tema) {
    try {
        const res = await fetch(`/api/preguntas?tema=${encodeURIComponent(tema)}`);
        if (!res.ok) throw new Error("API caída");
        return await res.json();
    } catch (e) {
        console.error("⚠️ No se pudieron cargar las preguntas del tema:", e.message);
        return [];
    }
}

// Guardar puntaje real en el backend
async function enviarPuntaje(tema, aciertos, jugador) {
    try {
        await fetch('/api/scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tema, aciertos, jugador })
        });
    } catch (e) {
        console.warn("⚠️ No se pudo enviar el puntaje al servidor:", e.message);
    }
}

// Consultar ranking real del backend
async function obtenerRanking() {
    const res = await fetch('/api/ranking');
    return await res.json();
}

// Eliminar fallbackPreguntas y usar solo API

// Obtener temas desde el backend
async function obtenerTemasAdmin() {
    const res = await fetch('/api/temas');
    return await res.json();
}

// Obtener preguntas de un tema desde el backend
async function obtenerPreguntasAdmin(tema) {
    const res = await fetch(`/api/preguntas?tema=${encodeURIComponent(tema)}`);
    return await res.json();
}

// Agregar tema
async function agregarTema(tema) {
    const res = await fetch('/api/temas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema })
    });
    return res.ok;
}

// Editar tema
async function editarTema(temaAnterior, nuevoTema) {
    const res = await fetch(`/api/temas/${encodeURIComponent(temaAnterior)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema: nuevoTema })
    });
    return res.ok;
}

// Eliminar tema
async function eliminarTema(tema) {
    const res = await fetch(`/api/temas/${encodeURIComponent(tema)}`, { method: 'DELETE' });
    return res.ok;
}

// Agregar pregunta
async function agregarPregunta(tema, pregunta, respuestas, respuestaCorrecta) {
    const res = await fetch('/api/preguntas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema, pregunta, respuestas, respuestaCorrecta })
    });
    return res.ok;
}

// Editar pregunta
async function editarPregunta(id, pregunta, respuestas, respuestaCorrecta) {
    const res = await fetch(`/api/preguntas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta, respuestas, respuestaCorrecta })
    });
    return res.ok;
}

// Eliminar pregunta
async function eliminarPregunta(id) {
    const res = await fetch(`/api/preguntas/${id}`, { method: 'DELETE' });
    return res.ok;
}

/* ---------- Lógica de selección de rol ---------- */
function mostrarFormularioJugador() {
    seccionDinamica.innerHTML = `
        <h2 class="pregunta">Ingresa tu nombre para jugar:</h2>
        <form id="form-jugador" class="form-admin">
            <input type="text" id="input-nombre-jugador" class="form-input" placeholder="Nombre de usuario" required>
            <button type="submit" class="boton-rol">Comenzar</button>
        </form>
        <button id="volverInicioJugadorBtn" class="boton-rol boton-separado centrado-horizontal">Volver al inicio</button>
    `;
    mostrarSeccionSolo(seccionDinamica);

    document.getElementById('form-jugador').addEventListener('submit', (e) => {
        e.preventDefault();
        const nombre = document.getElementById('input-nombre-jugador').value.trim();
        if (nombre.length > 0) {
            nombreJugador = nombre;
            ocultarSeccion(seccionDinamica);
            iniciarJuegoComoJugador();
        }
    });

    document.getElementById('volverInicioJugadorBtn').addEventListener('click', volverAlInicio);
}


function mostrarFormularioAdmin() {
    seccionDinamica.innerHTML = `
        <h2 class="pregunta">Acceso de administrador</h2>
        <form id="form-admin" class="form-admin">
            <input type="text" id="input-admin-usuario" class="form-input" placeholder="Usuario" required>
            <input type="password" id="input-admin-password" class="form-input" placeholder="Contraseña" required>
            <button type="submit" class="boton-rol">Ingresar</button>
        </form>
        <button id="volverInicioAdminBtn" class="boton-rol boton-separado centrado-horizontal">Volver al inicio</button>
        <div id="admin-login-error" class="error-message"></div>
    `;
    mostrarSeccionSolo(seccionDinamica);
    
    document.getElementById('form-admin').addEventListener('submit', async (e) => {
        e.preventDefault();
        const usuario = document.getElementById('input-admin-usuario').value.trim();
        const password = document.getElementById('input-admin-password').value;
        const exito = await autenticarAdmin(usuario, password);
        
        if (exito) {
            ocultarSeccion(seccionDinamica);
            iniciarPanelAdmin();
        } else {
            mostrarError('admin-login-error', 'Usuario o contraseña incorrectos');
        }
    });
    
    document.getElementById('volverInicioAdminBtn').addEventListener('click', volverAlInicio);
}

async function autenticarAdmin(usuario, password) {
    try {
        const res = await fetch('/api/auth/admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, password })
        });
        const data = await res.json();
        return data.success;
    } catch (e) {
        console.error("Error de autenticación:", e);
        return false;
    }
}


/* ---------- Lógica de juego ---------- */
function iniciarJuegoComoJugador() {
    mostrarSeccionSolo(contenedorPregunta);
    contenedorOpciones.style.display = 'block';
    contenedorResultado.style.display = 'block';
    mostrarTemas();
}

async function mostrarTemas() {
    limpiarContenedores();
    contenedorPregunta.innerHTML = '<h2 class="pregunta">Selecciona el tema:</h2>';

    const temas = await obtenerTemas();
    temas.forEach(tema => {
        const opcion = document.createElement('p');
        opcion.className = 'opcion';
        opcion.textContent = tema.toUpperCase();
        opcion.addEventListener('click', () => seleccionarTema(tema.toLowerCase()));
        contenedorOpciones.appendChild(opcion);
    });

    // Botón para volver
    const volverBtn = document.createElement('button');
    volverBtn.textContent = 'Volver al inicio';
    volverBtn.className = 'boton-rol boton-separado centrado-horizontal';
    volverBtn.addEventListener('click', volverAlInicio);
    contenedorOpciones.appendChild(volverBtn);
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

    respuestas.forEach((respuesta, i) => {
        const opcion = document.createElement('p');
        opcion.className = 'opcion';
        opcion.textContent = respuesta;

        opcion.addEventListener('click', () => {
            // Desactivar todos los clics inmediatamente
            const todasLasOpciones = document.querySelectorAll('.opcion');
            todasLasOpciones.forEach(op => op.style.pointerEvents = 'none');

            const esCorrecta = respuesta === (typeof respuestaCorrecta === 'number'
                ? respuestas[respuestaCorrecta]
                : respuestaCorrecta);

            if (esCorrecta) {
                puntaje++;
                opcion.classList.add('correcta');
            } else {
                opcion.classList.add('incorrecta');
            }

            setTimeout(() => mostrarPregunta(indice + 1), 500);
        });

        contenedorOpciones.appendChild(opcion);
    });
}


function mostrarResultado() {
    contenedorPregunta.innerHTML = '';
    contenedorOpciones.innerHTML = '';
    contenedorResultado.innerHTML = `<h2 class="total">Has acertado ${puntaje} de ${preguntasSeleccionadas.length}</h2><div id="mensaje-guardado-puntaje" style="color:var(--color-opcion); text-align:center; margin-bottom:12px;"></div><div class="contenedor-boton" id="botones-final"></div><div id="contenedor-ranking" style="margin-top:32px;"></div>`;

    // Deshabilitar botones hasta guardar puntaje
    const botonesFinal = document.getElementById('botones-final');
    botonesFinal.innerHTML = '<span style="color:var(--color-opcion);">Guardando puntaje...</span>';

    enviarPuntaje(temaActual, puntaje, nombreJugador)
        .then(() => {
            botonesFinal.innerHTML = `
                <button id="reiniciarBtn" style="margin-top:16px;">Reiniciar</button>
                <button id="volverInicioBtn" style="margin-top:16px;">Volver al inicio</button>
                <button id="verRankingBtn" class="boton-rol boton-separado" style="margin-top:16px;">Ver ranking</button>
            `;
            document.getElementById('reiniciarBtn').addEventListener('click', mostrarTemas);
            document.getElementById('volverInicioBtn').addEventListener('click', volverAlInicio);
            document.getElementById('verRankingBtn').addEventListener('click', mostrarRanking);
            document.getElementById('mensaje-guardado-puntaje').textContent = '¡Puntaje guardado!';
        })
        .catch(() => {
            botonesFinal.innerHTML = `
                <button id="reiniciarBtn">Reiniciar</button>
                <button id="volverInicioBtn">Volver al inicio</button>
            `;
            document.getElementById('reiniciarBtn').addEventListener('click', mostrarTemas);
            document.getElementById('volverInicioBtn').addEventListener('click', volverAlInicio);
            document.getElementById('mensaje-guardado-puntaje').textContent = 'No se pudo guardar el puntaje.';
        });
}

async function mostrarRanking() {
    const contenedor = document.getElementById('contenedor-ranking');
    const ranking = await obtenerRanking();
    let tabla = `<h3 style="color:var(--color-pregunta); text-align:center; margin-bottom:12px;">Últimos 10 jugadores</h3>`;
    if (ranking.length === 0) {
        tabla += `<div style="color:var(--color-opcion); text-align:center;">No hay partidas registradas aún.</div>`;
    } else {
        tabla += `<table style="width:100%; max-width:400px; margin:0 auto; border-collapse:collapse;">
            <thead><tr style="color:var(--color-opcion); font-size:1.1rem;"><th style="text-align:left; padding:8px;">Jugador</th><th style="text-align:left; padding:8px;">Tema</th><th style="text-align:right; padding:8px;">Puntaje</th></tr></thead><tbody>`;
        ranking.forEach(j => {
            tabla += `<tr><td style="padding:8px; color:var(--color-opcion);">${j.jugador}</td><td style="padding:8px; color:var(--color-opcion);">${j.tema}</td><td style="padding:8px; text-align:right; color:var(--color-opcion);">${j.aciertos}</td></tr>`;
        });
        tabla += `</tbody></table>`;
    }
    contenedor.innerHTML = tabla;
}

/* ---------- Panel de administración ---------- */
function iniciarPanelAdmin() {
    mostrarSeccionSolo(seccionDinamica);
    cargarTemasAdmin();
}

async function cargarTemasAdmin() {
    temasAdmin = await obtenerTemasAdmin();
    mostrarGestionTemas();
}

async function mostrarGestionTemas() {
    const temas = await obtenerTemasAdmin();
    seccionDinamica.innerHTML = `
        <h2 class="pregunta">Gestión de temas</h2>
        <ul id="lista-temas-admin" class="lista-temas"></ul>
        <form id="form-nuevo-tema" class="form-container">
            <input type="text" id="input-nuevo-tema" class="form-input" placeholder="Nuevo tema" required>
            <button type="submit" class="boton-accion">Agregar</button>
        </form>
        <button id="configuracionAdminBtn" class="boton-rol boton-separado" style="display:block; margin: 16px auto 0 auto;">Configuración</button>
        <button id="volverInicioAdminTemasBtn" class="boton-rol boton-separado" style="display:block; margin: 32px auto 0 auto;">Volver al inicio</button>
    `;
    
    const lista = document.getElementById('lista-temas-admin');
    temas.forEach((tema, idx) => {
        const li = document.createElement('li');
        li.className = 'tema-item';
        li.innerHTML = `
            <div class="tema-nombre">${tema}</div>
            <div class="tema-botones">
                <button class="boton-accion boton-editar" data-idx="${idx}">Editar</button>
                <button class="boton-accion boton-eliminar" data-idx="${idx}">Eliminar</button>
                <button class="boton-accion boton-preguntas" data-idx="${idx}">Preguntas</button>
            </div>
        `;
        lista.appendChild(li);
    });
    
    document.querySelectorAll('.boton-eliminar').forEach(btn => {
        btn.addEventListener('click', async function() {
            const idx = parseInt(btn.dataset.idx);
            if (confirm('¿Seguro que deseas eliminar el tema?')) {
                await eliminarTema(temas[idx]);
                mostrarGestionTemas();
            }
        });
    });
    document.querySelectorAll('.boton-editar').forEach(btn => {
        btn.addEventListener('click', async function() {
            const idx = parseInt(btn.dataset.idx);
            const nuevoNombre = prompt('Editar nombre del tema:', temas[idx]);
            if (nuevoNombre && nuevoNombre.trim() && !temas.includes(nuevoNombre.trim())) {
                await editarTema(temas[idx], nuevoNombre.trim());
                mostrarGestionTemas();
            } else if (temas.includes(nuevoNombre.trim())) {
                alert('Ya existe un tema con ese nombre.');
            }
        });
    });
    document.querySelectorAll('.boton-preguntas').forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = parseInt(btn.dataset.idx);
            mostrarGestionPreguntas(temas[idx]);
        });
    });
    document.getElementById('form-nuevo-tema').addEventListener('submit', async function(e) {
        e.preventDefault();
        const nuevoTema = document.getElementById('input-nuevo-tema').value.trim();
        if (nuevoTema && !temas.includes(nuevoTema)) {
            await agregarTema(nuevoTema);
            mostrarGestionTemas();
        } else {
            alert('El tema ya existe o el nombre es inválido.');
        }
    });
    document.getElementById('volverInicioAdminTemasBtn').addEventListener('click', volverAlInicio);
    document.getElementById('configuracionAdminBtn').addEventListener('click', mostrarConfiguracionAdmin);
}

function mostrarConfiguracionAdmin() {
    seccionDinamica.innerHTML = `
        <h2 class="pregunta">Configuración de administrador</h2>
        <form id="form-config-admin" class="form-nueva-pregunta" style="max-width:400px; margin:32px auto; background:rgba(0,0,0,0.08); padding:24px; border-radius:12px;">
            <label style="color:var(--color-opcion); margin-bottom:8px;">Usuario actual:</label>
            <input type="text" id="config-admin-usuario" class="form-input" value="${adminUser}" required>
            <label style="color:var(--color-opcion); margin-bottom:8px;">Contraseña actual:</label>
            <input type="password" id="config-admin-actual" class="form-input" required>
            <label style="color:var(--color-opcion); margin-bottom:8px;">Nueva contraseña:</label>
            <input type="password" id="config-admin-nueva" class="form-input">
            <button type="submit" class="boton-rol centrado-horizontal" style="margin-top:16px;">Guardar cambios</button>
        </form>
        <button id="volverTemasBtnConfig" class="boton-accion boton-separado centrado-horizontal">Volver a temas</button>
        <div id="config-admin-msg" class="error-message" style="display:none;"></div>
    `;
    document.getElementById('volverTemasBtnConfig').addEventListener('click', mostrarGestionTemas);
    document.getElementById('form-config-admin').addEventListener('submit', function(e) {
        e.preventDefault();
        const usuario = document.getElementById('config-admin-usuario').value.trim();
        const actual = document.getElementById('config-admin-actual').value;
        const nueva = document.getElementById('config-admin-nueva').value;
        const msg = document.getElementById('config-admin-msg');
        if (actual !== adminPass) {
            msg.textContent = 'Contraseña actual incorrecta.';
            msg.style.display = 'block';
            return;
        }
        adminUser = usuario;
        if (nueva) adminPass = nueva;
        msg.textContent = '¡Datos actualizados correctamente!';
        msg.style.display = 'block';
        setTimeout(() => { msg.style.display = 'none'; mostrarGestionTemas(); }, 1200);
    });
}

async function mostrarGestionPreguntas(tema, idxEditar = null) {
    const preguntas = await obtenerPreguntasAdmin(tema);
    let preguntasHTML = '';
    preguntas.forEach((pregunta, idx) => {
        preguntasHTML += `
            <div class="pregunta-admin">
                <div style="font-weight: bold; color: var(--color-pregunta);">${idx + 1}. ${pregunta.pregunta}</div>
                <ul>
                    ${pregunta.respuestas.map((respuesta, i) => `<li>${String.fromCharCode(65 + i)}. ${respuesta}</li>`).join('')}
                </ul>
                <div style="color: var(--color-opcion); font-size: 0.95em; margin-bottom: var(--espaciado-pequeño);">
                    Respuesta correcta: <b>${typeof pregunta.respuestaCorrecta === 'number' ? pregunta.respuestas[pregunta.respuestaCorrecta] : pregunta.respuestaCorrecta}</b>
                </div>
                <div class="tema-botones">
                    <button class="boton-accion boton-editar" data-idx="${idx}">Modificar</button>
                    <button class="boton-accion boton-eliminar" data-idx="${idx}">Eliminar</button>
                </div>
            </div>
        `;
    });
    let formEditar = '';
    if (idxEditar !== null) {
        const p = preguntas[idxEditar];
        formEditar = `
            <form id="form-editar-pregunta" class="form-nueva-pregunta" style="margin-top:32px; background:rgba(0,0,0,0.08); padding:24px; border-radius:12px;">
                <h3 style="color:var(--color-pregunta); text-align:center; margin-bottom:16px;">Editar pregunta</h3>
                <input type="text" id="editar-pregunta-texto" class="form-input" value="${p.pregunta}" required>
                <div style="display:grid; gap:8px; margin-bottom:16px;">
                    <input type="text" class="form-input" id="editar-opcion-0" value="${p.respuestas[0]}" required>
                    <input type="text" class="form-input" id="editar-opcion-1" value="${p.respuestas[1]}" required>
                    <input type="text" class="form-input" id="editar-opcion-2" value="${p.respuestas[2]}" required>
                    <input type="text" class="form-input" id="editar-opcion-3" value="${p.respuestas[3]}" required>
                </div>
                <label style="color:var(--color-opcion); margin-bottom:8px; display:block;">Respuesta correcta:</label>
                <select id="editar-respuesta-correcta" class="form-input" required>
                    <option value="0" ${p.respuestaCorrecta==0?'selected':''}>Opción A</option>
                    <option value="1" ${p.respuestaCorrecta==1?'selected':''}>Opción B</option>
                    <option value="2" ${p.respuestaCorrecta==2?'selected':''}>Opción C</option>
                    <option value="3" ${p.respuestaCorrecta==3?'selected':''}>Opción D</option>
                </select>
                <button type="submit" class="boton-accion boton-preguntas" style="margin-top:16px;">Guardar cambios</button>
                <button type="button" id="cancelarEditarBtn" class="boton-accion boton-separado" style="margin-top:8px;">Cancelar</button>
            </form>
        `;
    }
    seccionDinamica.innerHTML = `
        <div class="preguntas-container">
            <h2 class="pregunta">Preguntas de "${tema}"</h2>
            <div style="width: 100%; max-width: 600px;">
                ${preguntasHTML || '<div style="color:var(--color-opcion); text-align:center; margin-bottom:var(--espaciado);">(No hay preguntas en este tema)</div>'}
            </div>
            ${formEditar}
            <form id="form-nueva-pregunta" class="form-nueva-pregunta" style="margin-top:32px; background:rgba(0,0,0,0.08); padding:24px; border-radius:12px;${idxEditar!==null?'display:none;':''}">
                <h3 style="color:var(--color-pregunta); text-align:center; margin-bottom:16px;">Agregar nueva pregunta</h3>
                <input type="text" id="nueva-pregunta-texto" class="form-input" placeholder="Texto de la pregunta" required>
                <div style="display:grid; gap:8px; margin-bottom:16px;">
                    <input type="text" class="form-input" id="opcion-0" placeholder="Opción A" required>
                    <input type="text" class="form-input" id="opcion-1" placeholder="Opción B" required>
                    <input type="text" class="form-input" id="opcion-2" placeholder="Opción C" required>
                    <input type="text" class="form-input" id="opcion-3" placeholder="Opción D" required>
                </div>
                <label style="color:var(--color-opcion); margin-bottom:8px; display:block;">Respuesta correcta:</label>
                <select id="nueva-respuesta-correcta" class="form-input" required>
                    <option value="0">Opción A</option>
                    <option value="1">Opción B</option>
                    <option value="2">Opción C</option>
                    <option value="3">Opción D</option>
                </select>
                <button type="submit" class="boton-accion boton-preguntas" style="margin-top:16px;">Agregar pregunta</button>
            </form>
            <button id="volverTemasBtn" class="boton-accion" style="margin-top: var(--espaciado);">Volver a temas</button>
        </div>
    `;
    document.getElementById('volverTemasBtn').addEventListener('click', mostrarGestionTemas);
    document.getElementById('form-nueva-pregunta').addEventListener('submit', async function(e) {
        e.preventDefault();
        const texto = document.getElementById('nueva-pregunta-texto').value.trim();
        const opciones = [0,1,2,3].map(i => document.getElementById(`opcion-${i}`).value.trim());
        const correcta = parseInt(document.getElementById('nueva-respuesta-correcta').value);
        if (texto && opciones.every(o => o.length > 0)) {
            await agregarPregunta(tema, texto, opciones, correcta);
            mostrarGestionPreguntas(tema);
        } else {
            alert('Completa todos los campos.');
        }
    });
    document.querySelectorAll('.boton-editar').forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = parseInt(btn.dataset.idx);
            mostrarGestionPreguntas(tema, idx);
        });
    });
    document.querySelectorAll('.boton-eliminar').forEach(btn => {
        btn.addEventListener('click', async function() {
            const idx = parseInt(btn.dataset.idx);
            if (confirm('¿Seguro que deseas eliminar esta pregunta?')) {
                await eliminarPregunta(preguntas[idx].id);
                mostrarGestionPreguntas(tema);
            }
        });
    });
    if (idxEditar !== null) {
        document.getElementById('form-editar-pregunta').addEventListener('submit', async function(e) {
            e.preventDefault();
            const texto = document.getElementById('editar-pregunta-texto').value.trim();
            const opciones = [0,1,2,3].map(i => document.getElementById(`editar-opcion-${i}`).value.trim());
            const correcta = parseInt(document.getElementById('editar-respuesta-correcta').value);
            if (texto && opciones.every(o => o.length > 0)) {
                await editarPregunta(preguntas[idxEditar].id, texto, opciones, correcta);
                mostrarGestionPreguntas(tema);
            } else {
                alert('Completa todos los campos.');
            }
        });
        document.getElementById('cancelarEditarBtn').addEventListener('click', function() {
            mostrarGestionPreguntas(tema);
        });
    }
}

/* ---------- Utilidades ---------- */
function mostrarSeccionSolo(elemento) {
    // Oculta todos los contenedores principales
    contenedorInicial.style.display = 'none';
    seccionDinamica.style.display = 'none';
    contenedorPregunta.style.display = 'none';
    contenedorOpciones.style.display = 'none';
    contenedorResultado.style.display = 'none';
    // Muestra solo el que corresponde
    elemento.style.display = 'block';
}

function volverAlInicio() {
    mostrarSeccionSolo(contenedorInicial);
    nombreJugador = null;
}

function mostrarSeccion(elemento) {
    elemento.style.display = 'block';
}

function ocultarSeccion(elemento) {
    elemento.style.display = 'none';
}

function mostrarSeccionesJuego() {
    mostrarSeccion(contenedorPregunta);
    mostrarSeccion(contenedorOpciones);
    mostrarSeccion(contenedorResultado);
}

function ocultarSeccionesJuego() {
    ocultarSeccion(contenedorPregunta);
    ocultarSeccion(contenedorOpciones);
    ocultarSeccion(contenedorResultado);
}

function limpiarContenedores() {
    contenedorPregunta.innerHTML = '';
    contenedorOpciones.innerHTML = '';
    contenedorResultado.innerHTML = '';
}

function mostrarError(elementId, mensaje) {
    const elemento = document.getElementById(elementId);
    elemento.textContent = mensaje;
    elemento.style.display = 'block';
}
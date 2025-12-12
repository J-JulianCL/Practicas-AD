const express = require('express');
const app = express();

app.use(express.json());

//  Middleware API Key
app.use((req, res, next) => {
  const apiKey = req.header('x-api-key');
  const VALID_KEY = 'ABC123-LOCAL-DEV';
  if (apiKey !== VALID_KEY) {
    return res.status(401).json({ error: 'API Key inválida o faltante' });
  }
  next();
});


// ----------------------
//  Ejercicio 1: /saludo
// ----------------------
app.post('/saludo', (req, res) => {
  const { nombre } = req.body; // Extrae el nombre del body

  // Validar que se haya enviado un nombre
  if (!nombre || typeof nombre !== 'string') {
    return res.status(400).json({
      error: 'Debes enviar un nombre válido (tipo string).'
    });
  }

  // Responder con el saludo
  res.json({
    mensaje: `Hola, ${nombre}!`
  });
});


// ----------------------------
//  Ejercicio 2: /calcular
// ----------------------------
app.post('/calcular', (req, res) => {
  const { a, b, operacion } = req.body;

  // Validar tipos
  if (typeof a !== 'number' || typeof b !== 'number') {
    return res.status(400).json({ error: 'Los valores "a" y "b" deben ser numéricos.' });
  }

  if (typeof operacion !== 'string') {
    return res.status(400).json({ error: 'El campo "operacion" debe ser un string.' });
  }

  let resultado;
  let error = null;

  // Determinar operación
  switch (operacion.toLowerCase()) {
    case 'suma':
      resultado = a + b;
      break;
    case 'resta':
      resultado = a - b;
      break;
    case 'multiplicacion':
      resultado = a * b;
      break;
    case 'division':
      if (b === 0) {
        error = 'No se puede dividir entre cero.';
        resultado = null;
      } else {
        resultado = a / b;
      }
      break;
    default:
      return res.status(400).json({
        error: 'Operación no válida. Usa: suma, resta, multiplicacion o division.'
      });
  }

  res.json({ resultado, error });
});


// ----------------------------
//  Ejercicio 3: Gestor de Tareas (CRUD Básico)
// ----------------------------

// Array en memoria
const tareas = [];
let nextId = 1; // para autogenerar id si no te lo mandan

// POST /tareas  -> Crear tarea
// Body esperado: { "id"?: number, "titulo": string, "completada"?: boolean }
app.post('/tareas', (req, res) => {
  const { id, titulo, completada } = req.body ?? {};

  // Validaciones
  if (typeof titulo !== 'string' || !titulo.trim()) {
    return res.status(400).json({ error: 'El campo "titulo" es obligatorio y debe ser string no vacío.' });
  }
  if (typeof completada !== 'undefined' && typeof completada !== 'boolean') {
    return res.status(400).json({ error: 'El campo "completada" debe ser boolean.' });
  }
  let newId;
  if (typeof id === 'undefined' || id === null) {
    newId = nextId++;
  } else {
    if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'El campo "id" debe ser un número entero positivo.' });
    }
    if (tareas.some(t => t.id === id)) {
      return res.status(409).json({ error: `Ya existe una tarea con id ${id}.` });
    }
    newId = id;
    // mantener nextId por delante
    if (newId >= nextId) nextId = newId + 1;
  }

  const tarea = { id: newId, titulo: titulo.trim(), completada: !!completada };
  tareas.push(tarea);
  return res.status(201).json({ mensaje: 'Tarea creada', tarea });
});

// GET /tareas  -> Listar todas las tareas
app.get('/tareas', (req, res) => {
  return res.json(tareas);
});

// PUT /tareas/:id  -> Actualizar una tarea (parcial o total)
// Body permitido: { "titulo"?: string, "completada"?: boolean }
app.put('/tareas/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'El parámetro :id debe ser un entero positivo.' });
    }
  const tarea = tareas.find(t => t.id === id);
  if (!tarea) {
    return res.status(404).json({ error: `No existe la tarea con id ${id}.` });
  }

  const { titulo, completada } = req.body ?? {};

  if (typeof titulo !== 'undefined') {
    if (typeof titulo !== 'string' || !titulo.trim()) {
      return res.status(400).json({ error: 'Si envías "titulo", debe ser string no vacío.' });
    }
    tarea.titulo = titulo.trim();
  }
  if (typeof completada !== 'undefined') {
    if (typeof completada !== 'boolean') {
      return res.status(400).json({ error: 'Si envías "completada", debe ser boolean.' });
    }
    tarea.completada = completada;
  }

  return res.json({ mensaje: 'Tarea actualizada', tarea });
});

// DELETE /tareas/:id  -> Eliminar una tarea
app.delete('/tareas/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'El parámetro :id debe ser un entero positivo.' });
  }
  const idx = tareas.findIndex(t => t.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: `No existe la tarea con id ${id}.` });
  }
  const [eliminada] = tareas.splice(idx, 1);
  return res.json({ mensaje: 'Tarea eliminada', tarea: eliminada });
});


// ----------------------------
//  Ejercicio 4: /validar-password
// ----------------------------
app.post('/validar-password', (req, res) => {
  const { password } = req.body ?? {};

  if (typeof password !== 'string') {
    return res.status(400).json({
      error: 'El campo "password" es obligatorio y debe ser tipo string.'
    });
  }

  const errores = [];

  if (password.length < 8) errores.push('Debe tener al menos 8 caracteres.');
  if (!/[A-Z]/.test(password)) errores.push('Debe contener al menos una letra mayúscula.');
  if (!/[a-z]/.test(password)) errores.push('Debe contener al menos una letra minúscula.');
  if (!/[0-9]/.test(password)) errores.push('Debe contener al menos un número.');
  // Opcional (recomendación):
  if (/\s/.test(password)) errores.push('No debe contener espacios en blanco.');

  const esValida = errores.length === 0;
  return res.json({ esValida, errores });
});


// ----------------------------
//  Ejercicio 5: /convertir-temperatura
// ----------------------------
app.post('/convertir-temperatura', (req, res) => {
  const { valor, desde, hacia } = req.body ?? {};

  // Validaciones básicas
  if (typeof valor !== 'number') {
    return res.status(400).json({ error: 'El campo "valor" debe ser numérico.' });
  }

  const escalas = ['C', 'F', 'K'];

  if (!escalas.includes(desde)) {
    return res.status(400).json({ error: 'El campo "desde" debe ser "C", "F" o "K".' });
  }

  if (!escalas.includes(hacia)) {
    return res.status(400).json({ error: 'El campo "hacia" debe ser "C", "F" o "K".' });
  }

  if (desde === hacia) {
    return res.status(400).json({ error: 'Las escalas "desde" y "hacia" no pueden ser iguales.' });
  }

  let resultado;

  // Conversiones entre escalas
  if (desde === 'C' && hacia === 'F') resultado = (valor * 9) / 5 + 32;
  else if (desde === 'F' && hacia === 'C') resultado = ((valor - 32) * 5) / 9;
  else if (desde === 'C' && hacia === 'K') resultado = valor + 273.15;
  else if (desde === 'K' && hacia === 'C') resultado = valor - 273.15;
  else if (desde === 'F' && hacia === 'K') resultado = ((valor - 32) * 5) / 9 + 273.15;
  else if (desde === 'K' && hacia === 'F') resultado = ((valor - 273.15) * 9) / 5 + 32;

  res.json({
    valorOriginal: valor,
    valorConvertido: parseFloat(resultado.toFixed(2)),
    escalaOriginal: desde,
    escalaConvertida: hacia
  });
});


// ----------------------------
//  Ejercicio 6: /buscar (en array)
// ----------------------------
app.post('/buscar', (req, res) => {
  const { array, elemento } = req.body ?? {};

  // Validaciones
  if (!Array.isArray(array)) {
    return res.status(400).json({ error: 'El campo "array" debe ser un arreglo.' });
  }

  // Función para tipar correctamente
  const tipoDe = (v) => {
    if (Array.isArray(v)) return 'array';
    if (v === null) return 'null';
    return typeof v; // 'string', 'number', 'boolean', 'object', 'undefined'
  };

  // Comparador sencillo: maneja primitivos (incluye NaN) y objetos/arrays por JSON
  const equals = (a, b) => {
    // NaN === NaN (especial)
    if (typeof a === 'number' && typeof b === 'number' && Number.isNaN(a) && Number.isNaN(b)) return true;

    const ta = tipoDe(a);
    const tb = tipoDe(b);
    if (ta !== 'object' && ta !== 'array') return a === b; // primitivos, null, undefined
    if (tb !== 'object' && tb !== 'array') return a === b;

    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  };

  const indice = array.findIndex((item) => equals(item, elemento));
  const encontrado = indice !== -1;

  return res.json({
    encontrado,
    indice: encontrado ? indice : -1,
    tipoElemento: tipoDe(elemento)
  });
});


// ----------------------------
//  Ejercicio 7: /contar-palabras
// ----------------------------
app.post('/contar-palabras', (req, res) => {
  const { texto } = req.body ?? {};

  if (typeof texto !== 'string') {
    return res.status(400).json({ error: 'El campo "texto" es obligatorio y debe ser string.' });
  }

  // total de caracteres (incluye espacios y signos tal como vienen)
  const totalCaracteres = texto.length;

  // Extrae "palabras" soportando acentos y números (Unicode)
  // Una palabra = secuencia de letras o números (p. ej. "hola", "mañana", "3D")
  const palabras = (texto.match(/[\p{L}\p{N}]+/gu) || []);

  // Normaliza para contar únicas (case-insensitive y sin acentos)
  const normalizar = (w) =>
    w.toLowerCase()
     .normalize('NFD')                // separa diacríticos
     .replace(/\p{Diacritic}/gu, ''); // elimina acentos

  const setUnicas = new Set(palabras.map(normalizar));
  const totalPalabras = palabras.length;
  const palabrasUnicas = setUnicas.size;

  return res.json({ totalPalabras, totalCaracteres, palabrasUnicas });
});


// ----------------------------
//  Ejercicio 8: /generar-usuario
// ----------------------------
app.post('/generar-usuario', (req, res) => {
  let { cantidad } = req.body ?? {};
  if (typeof cantidad === 'undefined') cantidad = 1;

  if (typeof cantidad !== 'number' || !Number.isInteger(cantidad) || cantidad <= 0) {
    return res.status(400).json({ error: 'El campo "cantidad" debe ser un entero positivo.' });
  }
  if (cantidad > 50) {
    return res.status(400).json({ error: 'Máximo permitido: 50 usuarios por petición.' });
  }

  const nombres = ['Alan','Brenda','Carlos','Diana','Erik','Fernando','Gabriela','Hugo','Iván','Julian','Vanesa','Luis',
                   'María','Nora','Oscar','Paola','Quetzal','Rafael','Sandra','Tania','Ulises','Valeria','Wendy',
                   'Ximena','Yahir','Zoe'];
  const apellidos = ['Ramírez','Gómez','Hernández','López','Martínez','Pérez','Sánchez','Torres','Flores','García',
                     'Vargas','Castillo','Ríos','Cruz','Navarro','Mendoza'];
  const paises = ['MX','US','AR','CO','CL','PE','ES'];
  const dominios = ['mail.com','example.com','correo.mx','dev.io','app.net'];

  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const sample = (arr) => arr[rand(0, arr.length - 1)];
  const slug = (s) => s
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu,'')
    .replace(/[^a-z0-9]+/g,'')
    .slice(0,12);

  const genTelefono = () => {
    // +52 (55) ####-####
    const pref = ['55','33','81'][rand(0,2)];
    const a = rand(1000,9999);
    const b = rand(1000,9999);
    return `+52 (${pref}) ${a}-${b}`;
  };

  const genUUID = () => {
    // UUID v4 simple sin librerías
    const hex = () => Math.floor(Math.random()*16).toString(16);
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random()*16|0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const genFechaISO = () => {
    // Fecha aleatoria entre hace 3 años y hoy
    const ahora = Date.now();
    const tresAnios = 1000 * 60 * 60 * 24 * 365 * 3;
    const t = ahora - Math.random() * tresAnios;
    return new Date(t).toISOString();
  };

  const usuarios = Array.from({ length: cantidad }, (_, i) => {
    const nombre = `${sample(nombres)} ${sample(apellidos)}`;
    const usuario = `${slug(nombre.split(' ')[0])}${rand(1,999)}`;
    const email = `${usuario}@${sample(dominios)}`;
    return {
      id: i + 1,
      nombre,
      usuario,
      email,
      edad: rand(18, 65),
      pais: sample(paises),
      telefono: genTelefono(),
      fechaRegistro: genFechaISO(),
      uuid: genUUID()
    };
  });

  return res.json({ usuarios });
});


// ----------------------------
//  Ejercicio 9: /calcular-promedio
// ----------------------------
app.post('/calcular-promedio', (req, res) => {
  const { calificaciones } = req.body ?? {};

  // Validaciones
  if (!Array.isArray(calificaciones)) {
    return res.status(400).json({ error: 'El campo "calificaciones" debe ser un arreglo.' });
  }
  if (calificaciones.length === 0) {
    return res.status(400).json({ error: 'El arreglo "calificaciones" no puede estar vacío.' });
  }
  const sonNumerosValidos = calificaciones.every(
    (c) => typeof c === 'number' && Number.isFinite(c)
  );
  if (!sonNumerosValidos) {
    return res.status(400).json({ error: 'Todas las calificaciones deben ser números finitos.' });
  }

  // Rango 0–10
  const fueraDeRango = calificaciones.filter((c) => c < 0 || c > 10);
  if (fueraDeRango.length > 0) {
    return res.status(400).json({
      error: 'Todas las calificaciones deben estar en el rango 0 a 10.',
      detalles: fueraDeRango
    });
  }

  // Cálculos
  const suma = calificaciones.reduce((acc, n) => acc + n, 0);
  const promedio = suma / calificaciones.length;
  const calificacionMasAlta = Math.max(...calificaciones);
  const calificacionMasBaja = Math.min(...calificaciones);

  const estado = promedio >= 6 ? 'aprobado' : 'reprobado';

  return res.json({
    promedio: Number(promedio.toFixed(2)),
    calificacionMasAlta,
    calificacionMasBaja,
    estado
  });
});


// ----------------------------
//  Ejercicio 10: Productos con Filtros
// ----------------------------
const productos = [];
let nextProdId = 1;

/**
 * POST /productos
 * Body: { "id"?: number, "nombre": string, "categoria": string, "precio": number }
 */
app.post('/productos', (req, res) => {
  const { id, nombre, categoria, precio } = req.body ?? {};

  // Validaciones básicas
  if (typeof nombre !== 'string' || !nombre.trim())
    return res.status(400).json({ error: 'El campo "nombre" es obligatorio y debe ser string no vacío.' });

  if (typeof categoria !== 'string' || !categoria.trim())
    return res.status(400).json({ error: 'El campo "categoria" es obligatorio y debe ser string no vacío.' });

  if (typeof precio !== 'number' || !Number.isFinite(precio) || precio < 0)
    return res.status(400).json({ error: 'El campo "precio" debe ser un número >= 0.' });

  // ID (opcional): si viene, validar; si no, autoincrementar
  let newId;
  if (typeof id === 'number') {
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'El "id" debe ser un entero positivo.' });
    }
    if (productos.some(p => p.id === id)) {
      return res.status(409).json({ error: `Ya existe un producto con id ${id}.` });
    }
    newId = id;
    if (newId >= nextProdId) nextProdId = newId + 1;
  } else {
    newId = nextProdId++;
  }

  const prod = {
    id: newId,
    nombre: nombre.trim(),
    categoria: categoria.trim(),
    precio: Number(precio.toFixed(2))
  };

  productos.push(prod);
  return res.status(201).json({ mensaje: 'Producto agregado', producto: prod });
});

/**
 * GET /productos
 * Query params (opcionales):
 *   ?categoria=string&precioMin=number&precioMax=number
 * Devuelve el arreglo filtrado.
 */
app.get('/productos', (req, res) => {
  const { categoria, precioMin, precioMax } = req.query;

  // Validar numéricos si vienen
  let min = undefined, max = undefined;

  if (typeof precioMin !== 'undefined') {
    min = Number(precioMin);
    if (!Number.isFinite(min) || min < 0) {
      return res.status(400).json({ error: '"precioMin" debe ser un número >= 0.' });
    }
  }
  if (typeof precioMax !== 'undefined') {
    max = Number(precioMax);
    if (!Number.isFinite(max) || max < 0) {
      return res.status(400).json({ error: '"precioMax" debe ser un número >= 0.' });
    }
  }
  if (Number.isFinite(min) && Number.isFinite(max) && min > max) {
    return res.status(400).json({ error: '"precioMin" no puede ser mayor que "precioMax".' });
  }

  const cat = typeof categoria === 'string' ? categoria.trim().toLowerCase() : undefined;

  const filtrados = productos.filter(p => {
    const okCat = cat ? p.categoria.toLowerCase() === cat : true;
    const okMin = Number.isFinite(min) ? p.precio >= min : true;
    const okMax = Number.isFinite(max) ? p.precio <= max : true;
    return okCat && okMin && okMax;
  });

  return res.json(filtrados);
});


// ----------------------
//  Servidor
// ----------------------
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

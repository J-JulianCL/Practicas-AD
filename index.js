const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// helpers
const isStr = v => typeof v === 'string';
const sha256 = t => crypto.createHash('sha256').update(t, 'utf8').digest('hex');
const ok = data => ({ ok: true, data });
const fail = msg => ({ ok: false, error: msg });

// i) mascaracteres
app.post('/mascaracteres', (req, res) => {
  const { a, b } = req.body || {};
  if (!isStr(a) || !isStr(b)) return res.status(400).json(fail('a y b deben ser string'));
  if (a.length === b.length) return res.json(ok({ result: a }));
  res.json(ok({ result: a.length > b.length ? a : b }));
});

// ii) menoscaracteres
app.post('/menoscaracteres', (req, res) => {
  const { a, b } = req.body || {};
  if (!isStr(a) || !isStr(b)) return res.status(400).json(fail('a y b deben ser string'));
  if (a.length === b.length) return res.json(ok({ result: a }));
  res.json(ok({ result: a.length < b.length ? a : b }));
});

// iii) numcaracteres
app.post('/numcaracteres', (req, res) => {
  const { s } = req.body || {};
  if (!isStr(s)) return res.status(400).json(fail('s debe ser string'));
  res.json(ok({ count: s.length }));
});

// iv) palindroma  (ignora espacios, mayúsculas y acentos)
app.post('/palindroma', (req, res) => {
  const { s } = req.body || {};
  if (!isStr(s)) return res.status(400).json(fail('s debe ser string'));
  const norm = s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita acentos
    .replace(/\s+/g, ''); // quita espacios
  const isPalindrome = norm === [...norm].reverse().join('');
  res.json(ok({ isPalindrome }));
});

// v) concat
app.post('/concat', (req, res) => {
  const { a, b } = req.body || {};
  if (!isStr(a) || !isStr(b)) return res.status(400).json(fail('a y b deben ser string'));
  res.json(ok({ result: a + b }));
});

// vi) applysha256
app.post('/applysha256', (req, res) => {
  const { text } = req.body || {};
  if (!isStr(text)) return res.status(400).json(fail('text debe ser string'));
  res.json(ok({ original: text, sha256: sha256(text) }));
});

// vii) verifysha256  (acepta "encrypted" o "hash")
app.post('/verifysha256', (req, res) => {
  const { plain, encrypted, hash } = req.body || {};
  const target = encrypted || hash;
  if (!isStr(plain) || !isStr(target)) {
    return res.status(400).json(fail('plain y encrypted/hash deben ser string'));
  }
  const calculated = sha256(plain);
  res.json(ok({ match: calculated === target.toLowerCase(), calculated }));
});

// salud y 404
app.get('/', (_, res) => res.json(ok({ message: 'API lista' })));
app.use((req, res) => res.status(404).json(fail('Ruta no encontrada')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));

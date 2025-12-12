const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
const PORT = 3000;

// -------------------------------
// Función: obtiene tasa base GBP/MXN
// -------------------------------
async function obtenerTasaBaseGBP_MXN() {
  const url = "https://themoneyconverter.com/GBP/MXN";

  const response = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  const html = response.data;
  const $ = cheerio.load(html);

  // Extraemos texto plano
  const texto = $("body").text();

  // Buscamos: 1 GBP = XX.XXXX MXN
  const match = texto.match(/1\s*GBP\s*=\s*([0-9.,]+)\s*MXN/i);
  if (!match) return null;

  let valor = match[1];

  // Normalización del número
  valor = valor.replace(/,/g, "");
  const tasa = Number(valor);

  if (!Number.isFinite(tasa)) return null;

  return tasa;
}

// -------------------------------
// Endpoint raíz
// -------------------------------
app.get("/", (req, res) => {
  res.json({ mensaje: "Servidor activo" });
});

// -------------------------------
// Servicio COMPRA (–10%)
// -------------------------------
app.get("/compra/gbp-mxn", async (req, res) => {
  try {
    const base = await obtenerTasaBaseGBP_MXN();
    if (!base) {
      return res.status(500).json({
        error: "No se pudo obtener la tasa base"
      });
    }

    const compra = base * 0.90;

    res.json({
      par: "GBP/MXN",
      tipo: "compra",
      tasa_base: base,
      tasa_compra: Number(compra.toFixed(4)),
      formula: "compra = tasa_base * 0.90"
    });
  } catch (error) {
    res.status(500).json({
      error: "Error interno en servicio de compra",
      detalle: error.message
    });
  }
});

// -------------------------------
// Servicio VENTA (+10%)
// -------------------------------
app.get("/venta/gbp-mxn", async (req, res) => {
  try {
    const base = await obtenerTasaBaseGBP_MXN();
    if (!base) {
      return res.status(500).json({
        error: "No se pudo obtener la tasa base"
      });
    }

    const venta = base * 1.10;

    res.json({
      par: "GBP/MXN",
      tipo: "venta",
      tasa_base: base,
      tasa_venta: Number(venta.toFixed(4)),
      formula: "venta = tasa_base * 1.10"
    });
  } catch (error) {
    res.status(500).json({
      error: "Error interno en servicio de venta",
      detalle: error.message
    });
  }
});

// -------------------------------
// Arranque del servidor
// -------------------------------
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// src/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const { openDatabase } = require('./db/connection');
const schema = require('./db/schema');
const itineraryRoutes = require('./routes/itineraries');

const app = express();
const PORT = process.env.PORT || 3000;

// Init DB
const db = openDatabase();
db.exec(schema);
db.close();

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'itinerarios-agencia' }));

app.use('/api/itineraries', itineraryRoutes);

// Client-facing view (clean page) - serves same SPA-ish HTML
app.get('/itinerario/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'cliente.html'));
});

// Agent dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor de itinerários rodando em http://localhost:${PORT}`);
});

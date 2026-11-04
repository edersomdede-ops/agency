// src/routes/itineraries.js
const express = require('express');
const { ItineraryRepository } = require('../models/itineraryRepository');

const router = express.Router();
const repo = new ItineraryRepository();

function handleError(res, err) {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor', detail: err.message });
}

// List
router.get('/', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const offset = parseInt(req.query.offset || '0', 10);
    res.json({ data: repo.list(limit, offset) });
  } catch (e) { handleError(res, e); }
});

// Get by slug (client-facing) - must come before /:id? use distinct path
router.get('/slug/:slug', (req, res) => {
  try {
    const it = repo.getBySlug(req.params.slug);
    if (!it) return res.status(404).json({ error: 'Itinerário não encontrado' });
    res.json({ data: it });
  } catch (e) { handleError(res, e); }
});

// Get by id
router.get('/:id', (req, res) => {
  try {
    const it = repo.getById(req.params.id);
    if (!it) return res.status(404).json({ error: 'Itinerário não encontrado' });
    res.json({ data: it });
  } catch (e) { handleError(res, e); }
});

// Create
router.post('/', (req, res) => {
  try {
    const body = req.body || {};
    if (!body.client?.name && !body.clientName) {
      return res.status(400).json({ error: 'Nome do cliente é obrigatório' });
    }
    if (!body.trip?.start && !body.tripStart) {
      return res.status(400).json({ error: 'Data de início da viagem é obrigatória' });
    }
    if (!body.trip?.end && !body.tripEnd) {
      return res.status(400).json({ error: 'Data de fim da viagem é obrigatória' });
    }
    const created = repo.create(body);
    res.status(201).json({ data: created });
  } catch (e) { handleError(res, e); }
});

// Update
router.put('/:id', (req, res) => {
  try {
    const updated = repo.update(req.params.id, req.body || {});
    if (!updated) return res.status(404).json({ error: 'Itinerário não encontrado' });
    res.json({ data: updated });
  } catch (e) { handleError(res, e); }
});

// Delete
router.delete('/:id', (req, res) => {
  try {
    const ok = repo.delete(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Itinerário não encontrado' });
    res.status(204).send();
  } catch (e) { handleError(res, e); }
});

module.exports = router;

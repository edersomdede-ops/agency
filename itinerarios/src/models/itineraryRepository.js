// src/models/itineraryRepository.js
const { openDatabase } = require('../db/connection');
const { randomUUID } = require('crypto');

function slugify() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 7; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function parseJson(v, fallback) {
  if (v == null) return fallback;
  try { return JSON.parse(v); } catch { return fallback; }
}

function rowToItinerary(row, services) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    client: {
      name: row.client_name,
      email: row.client_email,
      phone: row.client_phone,
    },
    pnr: row.pnr,
    trip: { start: row.trip_start, end: row.trip_end },
    agency: {
      name: row.agency_name,
      logo: row.agency_logo,
      color: row.agency_color,
    },
    emergencyContacts: parseJson(row.emergency_contacts, []),
    usefulDocs: parseJson(row.useful_docs, []),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    services: services || { flights: [], hotels: [], cars: [], transfers: [] },
  };
}

class ItineraryRepository {
  constructor(db = openDatabase()) {
    this.db = db;
  }

  generateUniqueSlug() {
    let slug;
    const stmt = this.db.prepare('SELECT 1 FROM itineraries WHERE slug = ?');
    do {
      slug = slugify();
    } while (stmt.get(slug));
    return slug;
  }

  create(data) {
    const id = data.id || randomUUID();
    const slug = data.slug || this.generateUniqueSlug();
    const stmt = this.db.prepare(`
      INSERT INTO itineraries (id, slug, client_name, client_email, client_phone, pnr,
        trip_start, trip_end, agency_name, agency_logo, agency_color,
        emergency_contacts, useful_docs, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id, slug,
      data.client?.name || data.clientName,
      data.client?.email || data.clientEmail || null,
      data.client?.phone || data.clientPhone || null,
      data.pnr || null,
      data.trip?.start || data.tripStart,
      data.trip?.end || data.tripEnd,
      data.agency?.name || data.agencyName || 'Agência de Viagens',
      data.agency?.logo || data.agencyLogo || null,
      data.agency?.color || data.agencyColor || '#1a73e8',
      JSON.stringify(data.emergencyContacts || []),
      JSON.stringify(data.usefulDocs || []),
      data.notes || null
    );
    this.replaceServices(id, data.services || {});
    return this.getById(id);
  }

  replaceServices(itineraryId, services) {
    const s = services || {};
    const hasFlights = Object.prototype.hasOwnProperty.call(s, 'flights');
    const hasHotels = Object.prototype.hasOwnProperty.call(s, 'hotels');
    const hasCars = Object.prototype.hasOwnProperty.call(s, 'cars');
    const hasTransfers = Object.prototype.hasOwnProperty.call(s, 'transfers');

    if (hasFlights) {
      this.db.prepare('DELETE FROM flights WHERE itinerary_id = ?').run(itineraryId);
      const flights = s.flights || [];
      const insF = this.db.prepare("INSERT INTO flights (id, itinerary_id, airline, flight_number, origin, destination, departure_at, arrival_at, locator, checkin_url, terminal, notes, sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)");
      flights.forEach((f, i) => insF.run(f.id || randomUUID(), itineraryId, f.airline, f.flightNumber, f.origin, f.destination, f.departureAt, f.arrivalAt, f.locator || null, f.checkinUrl || null, f.terminal || null, f.notes || null, f.sortOrder ?? i));
    }
    if (hasHotels) {
      this.db.prepare('DELETE FROM hotels WHERE itinerary_id = ?').run(itineraryId);
      const hotels = s.hotels || [];
      const insH = this.db.prepare("INSERT INTO hotels (id, itinerary_id, name, address, checkin, checkout, room_type, confirmation, map_url, phone, notes, sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)");
      hotels.forEach((h, i) => insH.run(h.id || randomUUID(), itineraryId, h.name, h.address || null, h.checkin, h.checkout, h.roomType || null, h.confirmation || null, h.mapUrl || null, h.phone || null, h.notes || null, h.sortOrder ?? i));
    }
    if (hasCars) {
      this.db.prepare('DELETE FROM cars WHERE itinerary_id = ?').run(itineraryId);
      const cars = s.cars || [];
      const insC = this.db.prepare("INSERT INTO cars (id, itinerary_id, rental_company, category, pickup_at, dropoff_at, pickup_location, dropoff_location, confirmation, management_url, notes, sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)");
      cars.forEach((c, i) => insC.run(c.id || randomUUID(), itineraryId, c.rentalCompany, c.category || null, c.pickupAt, c.dropoffAt, c.pickupLocation || null, c.dropoffLocation || null, c.confirmation || null, c.managementUrl || null, c.notes || null, c.sortOrder ?? i));
    }
    if (hasTransfers) {
      this.db.prepare('DELETE FROM transfers WHERE itinerary_id = ?').run(itineraryId);
      const transfers = s.transfers || [];
      const insT = this.db.prepare("INSERT INTO transfers (id, itinerary_id, type, company, time, route, confirmation, notes, sort_order) VALUES (?,?,?,?,?,?,?,?,?)");
      transfers.forEach((t, i) => insT.run(t.id || randomUUID(), itineraryId, t.type || 'privativo', t.company, t.time, t.route, t.confirmation || null, t.notes || null, t.sortOrder ?? i));
    }
  }

  getById(id) {
    const row = this.db.prepare('SELECT * FROM itineraries WHERE id = ?').get(id);
    if (!row) return null;
    return rowToItinerary(row, this.getServices(row.id));
  }

  getBySlug(slug) {
    const row = this.db.prepare('SELECT * FROM itineraries WHERE slug = ?').get(slug);
    if (!row) return null;
    return rowToItinerary(row, this.getServices(row.id));
  }

  getServices(itineraryId) {
    const flights = this.db.prepare('SELECT * FROM flights WHERE itinerary_id = ? ORDER BY sort_order, departure_at').all(itineraryId).map(r => ({
      id: r.id, airline: r.airline, flightNumber: r.flight_number, origin: r.origin, destination: r.destination,
      departureAt: r.departure_at, arrivalAt: r.arrival_at, locator: r.locator, checkinUrl: r.checkin_url,
      terminal: r.terminal, notes: r.notes, sortOrder: r.sort_order,
    }));
    const hotels = this.db.prepare('SELECT * FROM hotels WHERE itinerary_id = ? ORDER BY sort_order, checkin').all(itineraryId).map(r => ({
      id: r.id, name: r.name, address: r.address, checkin: r.checkin, checkout: r.checkout, roomType: r.room_type,
      confirmation: r.confirmation, mapUrl: r.map_url, phone: r.phone, notes: r.notes, sortOrder: r.sort_order,
    }));
    const cars = this.db.prepare('SELECT * FROM cars WHERE itinerary_id = ? ORDER BY sort_order, pickup_at').all(itineraryId).map(r => ({
      id: r.id, rentalCompany: r.rental_company, category: r.category, pickupAt: r.pickup_at, dropoffAt: r.dropoff_at,
      pickupLocation: r.pickup_location, dropoffLocation: r.dropoff_location, confirmation: r.confirmation,
      managementUrl: r.management_url, notes: r.notes, sortOrder: r.sort_order,
    }));
    const transfers = this.db.prepare('SELECT * FROM transfers WHERE itinerary_id = ? ORDER BY sort_order, time').all(itineraryId).map(r => ({
      id: r.id, type: r.type, company: r.company, time: r.time, route: r.route, confirmation: r.confirmation,
      notes: r.notes, sortOrder: r.sort_order,
    }));
    return { flights, hotels, cars, transfers };
  }

  list(limit = 50, offset = 0) {
    const rows = this.db.prepare('SELECT * FROM itineraries ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset);
    return rows.map(r => rowToItinerary(r, null));
  }

  update(id, data) {
    const existing = this.getById(id);
    if (!existing) return null;
    const stmt = this.db.prepare(`
      UPDATE itineraries SET
        client_name = ?, client_email = ?, client_phone = ?, pnr = ?,
        trip_start = ?, trip_end = ?, agency_name = ?, agency_logo = ?, agency_color = ?,
        emergency_contacts = ?, useful_docs = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(
      data.client?.name || data.clientName || existing.client.name,
      (data.client?.email !== undefined ? data.client.email : (data.clientEmail !== undefined ? data.clientEmail : existing.client.email)),
      (data.client?.phone !== undefined ? data.client.phone : (data.clientPhone !== undefined ? data.clientPhone : existing.client.phone)),
      (data.pnr !== undefined ? data.pnr : existing.pnr),
      data.trip?.start || data.tripStart || existing.trip.start,
      data.trip?.end || data.tripEnd || existing.trip.end,
      data.agency?.name || data.agencyName || existing.agency.name,
      (data.agency?.logo !== undefined ? data.agency.logo : (data.agencyLogo !== undefined ? data.agencyLogo : existing.agency.logo)),
      data.agency?.color || data.agencyColor || existing.agency.color,
      JSON.stringify(data.emergencyContacts !== undefined ? data.emergencyContacts : existing.emergencyContacts),
      JSON.stringify(data.usefulDocs !== undefined ? data.usefulDocs : existing.usefulDocs),
      (data.notes !== undefined ? data.notes : existing.notes),
      id
    );
    if (data.services) this.replaceServices(id, data.services);
    return this.getById(id);
  }

  delete(id) {
    const res = this.db.prepare('DELETE FROM itineraries WHERE id = ?').run(id);
    return res.changes > 0;
  }
}

module.exports = { ItineraryRepository };

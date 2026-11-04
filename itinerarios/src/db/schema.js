// src/db/schema.js
module.exports = `
CREATE TABLE IF NOT EXISTS itineraries (
  id            TEXT PRIMARY KEY,
  slug          TEXT NOT NULL UNIQUE,
  client_name   TEXT NOT NULL,
  client_email  TEXT,
  client_phone  TEXT,
  pnr           TEXT,
  trip_start    TEXT NOT NULL,
  trip_end      TEXT NOT NULL,
  agency_name   TEXT NOT NULL DEFAULT 'Agência de Viagens',
  agency_logo   TEXT,
  agency_color  TEXT NOT NULL DEFAULT '#1a73e8',
  emergency_contacts TEXT NOT NULL DEFAULT '[]',
  useful_docs   TEXT NOT NULL DEFAULT '[]',
  notes         TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS flights (
  id            TEXT PRIMARY KEY,
  itinerary_id  TEXT NOT NULL,
  airline       TEXT NOT NULL,
  flight_number TEXT NOT NULL,
  origin        TEXT NOT NULL,
  destination   TEXT NOT NULL,
  departure_at  TEXT NOT NULL,
  arrival_at    TEXT NOT NULL,
  locator       TEXT,
  checkin_url   TEXT,
  terminal      TEXT,
  notes         TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS hotels (
  id            TEXT PRIMARY KEY,
  itinerary_id  TEXT NOT NULL,
  name          TEXT NOT NULL,
  address       TEXT,
  checkin       TEXT NOT NULL,
  checkout      TEXT NOT NULL,
  room_type     TEXT,
  confirmation  TEXT,
  map_url       TEXT,
  phone         TEXT,
  notes         TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cars (
  id               TEXT PRIMARY KEY,
  itinerary_id     TEXT NOT NULL,
  rental_company   TEXT NOT NULL,
  category         TEXT,
  pickup_at        TEXT NOT NULL,
  dropoff_at       TEXT NOT NULL,
  pickup_location  TEXT,
  dropoff_location TEXT,
  confirmation     TEXT,
  management_url   TEXT,
  notes            TEXT,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transfers (
  id            TEXT PRIMARY KEY,
  itinerary_id  TEXT NOT NULL,
  type          TEXT NOT NULL DEFAULT 'privativo',
  company       TEXT NOT NULL,
  time          TEXT NOT NULL,
  route         TEXT NOT NULL,
  confirmation  TEXT,
  notes         TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_flights_itin ON flights(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_hotels_itin ON hotels(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_cars_itin ON cars(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_transfers_itin ON transfers(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_slug ON itineraries(slug);
`;

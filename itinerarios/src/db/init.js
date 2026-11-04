// src/db/init.js
const { openDatabase } = require('./connection');
const schema = require('./schema');

const db = openDatabase();
db.exec(schema);
console.log('Banco de dados inicializado com sucesso.');
db.close();

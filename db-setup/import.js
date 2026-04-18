/**
 * ╔══════════════════════════════════════════╗
 * ║   JAMAL LEAK HUB — DB IMPORT SCRIPT     ║
 * ║   Import chunk_000.csv → chunk_2243.csv  ║
 * ╚══════════════════════════════════════════╝
 * 
 * Usage: node import.js [chemin/vers/chunks]
 * Exemple: node import.js ./data
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const DATA_DIR = process.argv[2] || path.join(__dirname, 'data');
const DB_PATH  = path.join(__dirname, 'personnes.db');

// ── Créer la DB ─────────────────────────────────────────────────────────────
const db = new Database(DB_PATH);

// ── Créer la table ───────────────────────────────────────────────────────────
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  PRAGMA cache_size = 100000;
  PRAGMA temp_store = MEMORY;

  CREATE TABLE IF NOT EXISTS personnes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    fullname    TEXT,
    firstname   TEXT,
    lastname    TEXT,
    email       TEXT,
    phone       TEXT,
    address     TEXT,
    postal_code TEXT,
    city        TEXT,
    birthdate   TEXT,
    country     TEXT,
    username    TEXT,
    genre       TEXT,
    organisme   TEXT,
    situation   TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_fullname    ON personnes(fullname);
  CREATE INDEX IF NOT EXISTS idx_email       ON personnes(email);
  CREATE INDEX IF NOT EXISTS idx_phone       ON personnes(phone);
  CREATE INDEX IF NOT EXISTS idx_city        ON personnes(city);
  CREATE INDEX IF NOT EXISTS idx_postal      ON personnes(postal_code);
  CREATE INDEX IF NOT EXISTS idx_username    ON personnes(username);

  CREATE VIRTUAL TABLE IF NOT EXISTS personnes_fts USING fts5(
    fullname, firstname, lastname, email, phone,
    address, city, postal_code, country, username,
    organisme, situation,
    content='personnes', content_rowid='id'
  );
`);

// ── Préparer l'insertion ──────────────────────────────────────────────────────
const insert = db.prepare(`
  INSERT INTO personnes
    (fullname, firstname, lastname, email, phone, address, postal_code, city, birthdate, country, username, genre, organisme, situation)
  VALUES
    (@fullname, @firstname, @lastname, @email, @phone, @address, @postal_code, @city, @birthdate, @country, @username, @genre, @organisme, @situation)
`);

const insertMany = db.transaction((rows) => {
  for (const row of rows) insert.run(row);
});

// ── Parser une ligne CSV ──────────────────────────────────────────────────────
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// ── Mapper les colonnes CSV vers la DB ───────────────────────────────────────
function mapRow(headers, values) {
  const row = {};
  const fieldMap = {
    fullname: ['fullname', 'full_name', 'nom_complet', 'name'],
    firstname: ['firstname', 'first_name', 'prenom', 'prénom'],
    lastname: ['lastname', 'last_name', 'nom', 'surname'],
    email: ['email', 'mail', 'e_mail'],
    phone: ['phone', 'tel', 'telephone', 'téléphone', 'mobile'],
    address: ['address', 'adresse', 'addr'],
    postal_code: ['postal_code', 'cp', 'code_postal', 'zip', 'postcode'],
    city: ['city', 'ville', 'town'],
    birthdate: ['birthdate', 'date_naissance', 'birth_date', 'dob'],
    country: ['country', 'pays'],
    username: ['username', 'pseudo', 'user', 'login'],
    genre: ['genre', 'gender', 'sexe'],
    organisme: ['organisme', 'organization', 'entreprise', 'company'],
    situation: ['situation', 'status', 'statut'],
  };

  for (const [dbField, aliases] of Object.entries(fieldMap)) {
    row[dbField] = null;
    for (const alias of aliases) {
      const idx = headers.findIndex(h => h.toLowerCase().trim() === alias);
      if (idx !== -1 && values[idx] !== undefined) {
        row[dbField] = values[idx] || null;
        break;
      }
    }
  }

  // Auto-générer fullname si manquant
  if (!row.fullname && (row.firstname || row.lastname)) {
    row.fullname = [row.firstname, row.lastname].filter(Boolean).join(' ').toUpperCase();
  }

  return row;
}

// ── Importer un fichier CSV ───────────────────────────────────────────────────
async function importFile(filePath) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: fs.createReadStream(filePath, 'utf8'), crlfDelay: Infinity });
    let headers = null;
    let batch = [];
    let lineCount = 0;
    const BATCH_SIZE = 1000;

    rl.on('line', (line) => {
      if (!line.trim()) return;
      if (!headers) {
        headers = parseCSVLine(line);
        return;
      }
      const values = parseCSVLine(line);
      const row = mapRow(headers, values);
      batch.push(row);
      lineCount++;
      if (batch.length >= BATCH_SIZE) {
        try { insertMany(batch); } catch (e) { /* skip bad rows */ }
        batch = [];
      }
    });

    rl.on('close', () => {
      if (batch.length > 0) {
        try { insertMany(batch); } catch (e) { /* skip */ }
      }
      resolve(lineCount);
    });
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(DATA_DIR)) {
    console.error(`❌ Dossier introuvable : ${DATA_DIR}`);
    console.log('💡 Usage: node import.js /chemin/vers/vos/chunks');
    process.exit(1);
  }

  const files = fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.csv'))
    .sort()
    .map(f => path.join(DATA_DIR, f));

  if (files.length === 0) {
    console.error('❌ Aucun fichier .csv trouvé dans', DATA_DIR);
    process.exit(1);
  }

  console.log(`\n🔱 JAMAL LEAK HUB — Import DB`);
  console.log(`📂 ${files.length} fichiers CSV trouvés`);
  console.log(`💾 DB : ${DB_PATH}\n`);

  let totalLines = 0;
  const startTime = Date.now();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const name = path.basename(file);
    const pct = Math.floor(((i + 1) / files.length) * 100);
    process.stdout.write(`\r[${pct}%] Importing ${name}...`.padEnd(60));
    try {
      const lines = await importFile(file);
      totalLines += lines;
    } catch (e) {
      console.error(`\n❌ Erreur sur ${name}: ${e.message}`);
    }
  }

  // Mettre à jour l'index FTS
  console.log('\n\n🔄 Mise à jour de l\'index FTS5...');
  try {
    db.exec(`INSERT INTO personnes_fts(personnes_fts) VALUES('rebuild');`);
  } catch (e) { console.warn('FTS rebuild:', e.message); }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const count = db.prepare('SELECT COUNT(*) as c FROM personnes').get();

  console.log(`\n✅ Import terminé !`);
  console.log(`📊 ${count.c.toLocaleString()} enregistrements dans la DB`);
  console.log(`⏱ Temps : ${elapsed}s`);
  console.log(`💾 Taille DB : ${(fs.statSync(DB_PATH).size / 1024 / 1024).toFixed(1)} Mo\n`);

  db.close();
}

main().catch(console.error);

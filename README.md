# 🔱 JAMAL LEAK HUB — v3.0 COMPLET

> **discord.gg/AUhbYah7Ue**  
> Bot corrigé ✅ · IA OSINT 🤖 · DB SQL 💾 · Dashboard 📊 · Search Site 🔍

---

## ✅ BUGS CORRIGÉS (v2 → v3)

| Bug | Cause | Fix |
|-----|-------|-----|
| `Passing "color" is deprecated` | Utilisait `colors` au lieu de `color` | ✅ `color: '#D4A017'` |
| `Unable to convert "null" to a number` | Rôles notif avec `color: null` planté | ✅ `color` omis si null |
| `Missing Permissions` (rôles) | Permissions en tableau au lieu de BigInt | ✅ `BigInt(perms)` et `|` bitwise |
| `Missing Permissions` (salons) | Bot sans permission ManageChannels | ✅ Bot override explicite |

---

## 📦 STRUCTURE DU PROJET

```
jamal-leak-hub/
├── bot/
│   ├── index.js          ← Bot principal (corrigé v3)
│   ├── config.json       ← Configuration
│   └── package.json
├── db-setup/
│   ├── import.js         ← Import CSV → SQLite
│   ├── package.json
│   └── data/             ← Mets tes chunk_000.csv ici
├── dashboard/
│   ├── server.js         ← API Express
│   ├── package.json
│   └── public/
│       └── index.html    ← Dashboard + Search + IA
├── search-site/
│   └── index.html        ← Site search standalone
└── README.md
```

---

## 🚀 INSTALLATION

### 1. Bot Discord

```bash
cd bot
npm install
# Remplir config.json
npm start
```

Dans Discord : **`/setup`** → tout se crée automatiquement.

### 2. Base de données

```bash
cd db-setup
npm install

# Mets tes fichiers CSV dans db-setup/data/
# (chunk_000.csv jusqu'à chunk_2243.csv)

npm run import
# ou: node import.js ./data
```

### 3. Dashboard

```bash
cd dashboard
npm install
npm start
# → http://localhost:3000
```

### 4. Site de recherche (standalone)

Ouvre simplement `search-site/index.html` dans un navigateur  
OU déploie sur Vercel/Netlify (connecte à l'API du dashboard).

---

## ⚙️ CONFIG.JSON

```json
{
  "token": "TON_TOKEN_BOT",
  "guildId": "TON_GUILD_ID",
  "clientId": "TON_CLIENT_ID",
  "anthropicKey": "sk-ant-...",
  "dashboardPort": 3000,
  "searchPort": 3001,
  "dashboardSecret": "ton_secret_jwt"
}
```

**Anthropic Key** : https://console.anthropic.com → API Keys  
(Nécessaire pour `/ia-search` et l'IA du dashboard)

---

## 🤖 COMMANDES BOT

| Commande | Description | Permissions |
|----------|-------------|-------------|
| `/setup` | Configure tout le serveur | Admin |
| `/ia-search <requete>` | Analyse IA OSINT | Staff |
| `/db-search <query>` | Recherche dans la DB | Staff |
| `/userinfo [user]` | Infos utilisateur | Tous |
| `/serverinfo` | Infos serveur | Tous |
| `/ban <user> [raison]` | Bannir | Ban Members |
| `/kick <user> [raison]` | Kick | Kick Members |
| `/mute <user> <durée> [raison]` | Mute temporaire | Moderate Members |
| `/clear <nombre>` | Supprimer messages | Manage Messages |
| `/annonce <message> [salon]` | Annonce @everyone | Manage Messages |

---

## 📊 BASE DE DONNÉES

### Schéma SQL

```sql
CREATE TABLE personnes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  fullname    TEXT,    -- Nom complet
  firstname   TEXT,    -- Prénom
  lastname    TEXT,    -- Nom de famille
  email       TEXT,    -- Email
  phone       TEXT,    -- Téléphone
  address     TEXT,    -- Adresse
  postal_code TEXT,    -- Code postal
  city        TEXT,    -- Ville
  birthdate   TEXT,    -- Date de naissance
  country     TEXT,    -- Pays
  username    TEXT,    -- Pseudo / identifiant
  genre       TEXT,    -- Genre
  organisme   TEXT,    -- Organisation
  situation   TEXT     -- Situation
);
```

### Requêtes OSINT exemple

```sql
-- Recherche universelle
SELECT * FROM personnes
WHERE CONCAT(fullname,' ',email,' ',phone,' ',city,' ',username) LIKE '%DUPONT%';

-- Par email
SELECT * FROM personnes WHERE email = 'jean@gmail.com';

-- Par téléphone
SELECT * FROM personnes WHERE phone = '0600000000';

-- Par ville + CP
SELECT * FROM personnes WHERE city = 'PARIS' AND postal_code = '75001';

-- Par date de naissance
SELECT * FROM personnes WHERE birthdate = '1990-01-15';
```

---

## 🔱 VÉRIFICATION (style VaultCord)

1. Nouveau membre → reçoit rôle `🔔 Non-vérifié`
2. Voit uniquement `#✅︱vérification`
3. Clique "✅ VÉRIFIER MON COMPTE"
4. Bot vérifie : compte > 7 jours
5. Attribution automatique de `🔱 Membre`
6. Log dans `#📋︱logs-joins`

---

## 🎨 CHARTE GRAPHIQUE

| Élément | Couleur |
|---------|---------|
| Or principal | `#D4A017` |
| Or secondaire | `#C0A868` |
| Fond | `#000000` |
| Succès | `#00FF88` |
| Erreur | `#FF2244` |
| IA / OSINT | `#EB459E` |

---

## 🛡️ PERMISSIONS @everyone

Tout est à **0** — pas de fils, pas de threads, pas de mentions.  
Seul accès par défaut : `#✅︱vérification` (lecture seule).

---

*Jamal Leak Hub © 2026 — discord.gg/AUhbYah7Ue*

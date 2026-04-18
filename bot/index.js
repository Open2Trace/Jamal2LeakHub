/**
 * ╔══════════════════════════════════════════╗
 * ║     JAMAL LEAK HUB — BOT v3.0           ║
 * ║   discord.gg/AUhbYah7Ue                 ║
 * ╚══════════════════════════════════════════╝
 * FIXES: color→colors, Missing Permissions,
 * bot role position, @everyone perms
 */

const {
  Client, GatewayIntentBits, Partials,
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  StringSelectMenuBuilder, PermissionFlagsBits, ChannelType,
  SlashCommandBuilder, REST, Routes, ModalBuilder, TextInputBuilder, TextInputStyle,
} = require('discord.js');
const fetch = (...a) => import('node-fetch').then(({ default: f }) => f(...a));
const Database = require('better-sqlite3');
const path = require('path');
const config = require('./config.json');

// ── DB ─────────────────────────────────────────────────────────────────────────
let db;
try {
  db = new Database(path.join(__dirname, '../db-setup/personnes.db'), { readonly: true });
  console.log('✅ Base de données connectée');
} catch (e) {
  console.warn('⚠️ Base de données non trouvée. Lance db-setup/import.js d\'abord.');
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember],
});

const GOLD  = 0xD4A017;
const RED   = 0xFF2244;
const GREEN = 0x00FF88;
const DARK  = 0x0D0D0D;
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ══════════════════════════════════════════════════════════════════════════════
//  STRUCTURE SERVEUR
// ══════════════════════════════════════════════════════════════════════════════

const ROLES_DEF = [
  // IMPORTANT : "colors" (pluriel) et BigInt pour perms
  { name: '👑 Owner',        colors: '#D4A017', hoist: true,  perms: PermissionFlagsBits.Administrator },
  { name: '⚜️ Responsable',  colors: '#C0A868', hoist: true,  perms: PermissionFlagsBits.ManageGuild | PermissionFlagsBits.ManageChannels | PermissionFlagsBits.ManageRoles | PermissionFlagsBits.BanMembers | PermissionFlagsBits.KickMembers | PermissionFlagsBits.ModerateMembers | PermissionFlagsBits.ManageMessages },
  { name: '🛡️ Modérateur',   colors: '#4E9AF1', hoist: true,  perms: PermissionFlagsBits.BanMembers | PermissionFlagsBits.KickMembers | PermissionFlagsBits.ModerateMembers | PermissionFlagsBits.ManageMessages | PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages | PermissionFlagsBits.ReadMessageHistory },
  { name: '🔧 Support',       colors: '#57F287', hoist: true,  perms: PermissionFlagsBits.ManageMessages | PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages | PermissionFlagsBits.ReadMessageHistory },
  { name: '💎 VIP',           colors: '#E8C44E', hoist: true,  perms: PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages | PermissionFlagsBits.ReadMessageHistory | PermissionFlagsBits.AttachFiles | PermissionFlagsBits.EmbedLinks | PermissionFlagsBits.AddReactions | PermissionFlagsBits.UseExternalEmojis },
  { name: '🔍 Expert OSINT',  colors: '#EB459E', hoist: true,  perms: PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages | PermissionFlagsBits.ReadMessageHistory | PermissionFlagsBits.AttachFiles | PermissionFlagsBits.EmbedLinks },
  { name: '🚀 Booster',       colors: '#FF73FA', hoist: false, perms: PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages | PermissionFlagsBits.ReadMessageHistory },
  { name: '🔱 Membre',        colors: '#D4A017', hoist: false, perms: PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages | PermissionFlagsBits.ReadMessageHistory | PermissionFlagsBits.AttachFiles | PermissionFlagsBits.EmbedLinks | PermissionFlagsBits.AddReactions | PermissionFlagsBits.UseExternalEmojis | PermissionFlagsBits.UseApplicationCommands },
  { name: '🔔 Non-vérifié',   colors: '#636363', hoist: false, perms: 0n },
  // Rôles notif — color null = pas de couleur
  { name: '📢 Annonces',      colors: null,      hoist: false, perms: 0n },
  { name: '🔱 Leaks Notif',   colors: null,      hoist: false, perms: 0n },
  { name: '🔍 OSINT Notif',   colors: null,      hoist: false, perms: 0n },
  { name: '🎮 Events',        colors: null,      hoist: false, perms: 0n },
];

// Flags désactivés pour @everyone sur TOUS les salons
const DENY_ALL = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.SendMessagesInThreads,
  PermissionFlagsBits.CreatePublicThreads,
  PermissionFlagsBits.CreatePrivateThreads,
  PermissionFlagsBits.ManageThreads,
  PermissionFlagsBits.MentionEveryone,
  PermissionFlagsBits.UseApplicationCommands,
  PermissionFlagsBits.AddReactions,
  PermissionFlagsBits.UseExternalEmojis,
];

const ALLOW_READ  = [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory];
const ALLOW_WRITE = [...ALLOW_READ, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AddReactions, PermissionFlagsBits.UseExternalEmojis, PermissionFlagsBits.UseApplicationCommands];
const ALLOW_STAFF = [...ALLOW_WRITE, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ManageChannels];

const SERVER_STRUCTURE = [
  { cat: '📌 ─── INFORMATION', channels: [
    { name: '📢︱annonces',      topic: 'Annonces officielles',             everyoneSee: true,  write: false },
    { name: '📜︱règlement',     topic: 'Règlement officiel',               everyoneSee: true,  write: false, _reglement: true },
    { name: '📖︱informations',  topic: 'Présentation du serveur',          everyoneSee: true,  write: false, _info: true },
    { name: '🔗︱liens-utiles',  topic: 'Ressources et outils OSINT',       everyoneSee: false, write: false, _liens: true },
  ]},
  { cat: '✅ ─── ACCÈS', channels: [
    { name: '✅︱vérification',  topic: 'Vérification — accès au serveur',  everyoneSee: true,  write: false, _verif: true, hideFromMembre: true },
    { name: '👋︱arrivées',      topic: 'Arrivées des nouveaux membres',     everyoneSee: false, write: false },
  ]},
  { cat: '💬 ─── COMMUNAUTÉ', channels: [
    { name: '💬︱général',       topic: 'Discussion générale',              everyoneSee: false, write: true },
    { name: '😄︱détente',       topic: 'Salon détente',                    everyoneSee: false, write: true },
    { name: '🖼️︱médias',        topic: 'Partage de médias',                everyoneSee: false, write: true },
    { name: '🎵︱musique',       topic: 'Partage musical',                  everyoneSee: false, write: true },
  ]},
  { cat: '🔱 ─── LEAKS', channels: [
    { name: '🔱︱leaks-vip',     topic: 'Leaks exclusifs VIP',              everyoneSee: false, write: false, vipOnly: true },
    { name: '📦︱leaks-généraux',topic: 'Leaks généraux',                   everyoneSee: false, write: false },
    { name: '🛒︱shop',           topic: 'Boutique',                         everyoneSee: false, write: false },
    { name: '🆕︱nouveautés',     topic: 'Mises à jour',                    everyoneSee: false, write: false },
  ]},
  { cat: '🔍 ─── OSINT & IA', channels: [
    { name: '🔍︱osint-général',  topic: 'Discussion et recherches OSINT',  everyoneSee: false, write: true },
    { name: '🤖︱ia-osint',       topic: 'IA OSINT — commande /ia-search',  everyoneSee: false, write: true, _ia: true },
    { name: '🛠️︱outils',         topic: 'Outils OSINT recommandés',        everyoneSee: false, write: false },
    { name: '📚︱guides',          topic: 'Guides et tutoriels',             everyoneSee: false, write: false },
    { name: '🎯︱recherches',      topic: 'Recherches actives (VIP+Staff)',  everyoneSee: false, write: false, vipOnly: true },
  ]},
  { cat: '🎮 ─── EVENTS', channels: [
    { name: '🎮︱events',          topic: 'Événements',                     everyoneSee: false, write: false },
    { name: '🏆︱tournois',        topic: 'Tournois',                       everyoneSee: false, write: true },
    { name: '🎁︱giveaways',       topic: 'Giveaways',                      everyoneSee: false, write: false },
  ]},
  { cat: '🎭 ─── RÔLES', channels: [
    { name: '🎭︱choix-rôles',    topic: 'Choisis tes rôles de notif',      everyoneSee: false, write: false, _roles: true },
  ]},
  { cat: '🎫 ─── SUPPORT', channels: [
    { name: '🎫︱tickets',         topic: 'Ouvrir un ticket',               everyoneSee: false, write: false, _tickets: true },
  ]},
  { cat: '🔒 ─── STAFF [PRIVÉ]', staffOnly: true, channels: [
    { name: '👑︱staff-général',  topic: 'Discussions staff',  staffOnly: true },
    { name: '📋︱logs-joins',     topic: 'Logs vérifs',        staffOnly: true },
    { name: '📋︱logs-bans',      topic: 'Logs bans/kicks',    staffOnly: true },
    { name: '📋︱logs-messages',  topic: 'Logs messages',      staffOnly: true },
    { name: '🔧︱commandes',      topic: 'Commandes staff',    staffOnly: true },
  ]},
];

// ══════════════════════════════════════════════════════════════════════════════
//  SLASH COMMANDS
// ══════════════════════════════════════════════════════════════════════════════

const commands = [
  new SlashCommandBuilder().setName('setup').setDescription('🔱 [OWNER] Setup complet du serveur').setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder().setName('ia-search').setDescription('🤖 Recherche IA OSINT intelligente').addStringOption(o => o.setName('requete').setDescription('Ce que tu cherches (nom, email, tel, IP...)').setRequired(true)),
  new SlashCommandBuilder().setName('db-search').setDescription('🔍 Recherche dans la base de données').addStringOption(o => o.setName('query').setDescription('Nom / email / téléphone / ville...').setRequired(true)),
  new SlashCommandBuilder().setName('userinfo').setDescription('Infos sur un utilisateur').addUserOption(o => o.setName('user').setDescription('Utilisateur').setRequired(false)),
  new SlashCommandBuilder().setName('serverinfo').setDescription('Infos sur le serveur'),
  new SlashCommandBuilder().setName('ban').setDescription('[MOD] Bannir').setDefaultMemberPermissions(PermissionFlagsBits.BanMembers).addUserOption(o => o.setName('user').setDescription('User').setRequired(true)).addStringOption(o => o.setName('raison').setDescription('Raison')),
  new SlashCommandBuilder().setName('kick').setDescription('[MOD] Kick').setDefaultMemberPermissions(PermissionFlagsBits.KickMembers).addUserOption(o => o.setName('user').setDescription('User').setRequired(true)).addStringOption(o => o.setName('raison').setDescription('Raison')),
  new SlashCommandBuilder().setName('mute').setDescription('[MOD] Mute').setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers).addUserOption(o => o.setName('user').setDescription('User').setRequired(true)).addIntegerOption(o => o.setName('duree').setDescription('Durée (minutes)').setRequired(true)).addStringOption(o => o.setName('raison').setDescription('Raison')),
  new SlashCommandBuilder().setName('clear').setDescription('[MOD] Supprimer messages').setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).addIntegerOption(o => o.setName('nombre').setDescription('Nombre (1-100)').setRequired(true).setMinValue(1).setMaxValue(100)),
  new SlashCommandBuilder().setName('annonce').setDescription('[STAFF] Annonce').setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).addStringOption(o => o.setName('message').setDescription('Message').setRequired(true)).addChannelOption(o => o.setName('salon').setDescription('Salon')),
].map(c => c.toJSON());

// ══════════════════════════════════════════════════════════════════════════════
//  READY
// ══════════════════════════════════════════════════════════════════════════════

client.once('ready', async () => {
  console.log(`✅ Connecté : ${client.user.tag}`);
  const rest = new REST({ version: '10' }).setToken(config.token);
  try {
    await rest.put(Routes.applicationGuildCommands(client.user.id, config.guildId), { body: commands });
    console.log('✅ Slash commands enregistrées');
  } catch (e) { console.error('Erreur commands:', e.message); }
  client.user.setPresence({
    activities: [{ name: '🔱 Jamal Leak Hub | .gg/AUhbYah7Ue', type: 1, url: 'https://twitch.tv/jamalleakhub' }],
    status: 'dnd',
  });
});

// ══════════════════════════════════════════════════════════════════════════════
//  MEMBER ADD
// ══════════════════════════════════════════════════════════════════════════════

client.on('guildMemberAdd', async (member) => {
  const nonVerif = member.guild.roles.cache.find(r => r.name === '🔔 Non-vérifié');
  if (nonVerif) await member.roles.add(nonVerif).catch(() => {});
  const ch = member.guild.channels.cache.find(c => c.name === '👋︱arrivées');
  if (!ch) return;
  const verifCh = member.guild.channels.cache.find(c => c.name === '✅︱vérification');
  ch.send({ embeds: [new EmbedBuilder()
    .setColor(GOLD)
    .setTitle('🔱 NOUVEAU MEMBRE')
    .setDescription(`> Bienvenue **${member.user.username}** sur **Jamal Leak Hub** !\n\n> 📋 Va dans ${verifCh?.toString() || '#✅︱vérification'} pour accéder.\n\n> 🔗 **discord.gg/AUhbYah7Ue**`)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
    .setFooter({ text: `Membre #${member.guild.memberCount} • Jamal Leak Hub`, iconURL: member.guild.iconURL() })
    .setTimestamp()] });
});

// ══════════════════════════════════════════════════════════════════════════════
//  SETUP
// ══════════════════════════════════════════════════════════════════════════════

async function runSetup(interaction) {
  const guild = interaction.guild;
  const me = guild.members.me;
  const statusMsg = await interaction.reply({ content: '⏳ Démarrage du setup...', fetchReply: true });
  const upd = async (pct, txt) => {
    const bar = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));
    await statusMsg.edit({ content: `⚙️ \`[${bar}]\` **${pct}%** — ${txt}` }).catch(() => {});
  };

  // ── 1. @everyone → 0 permissions ──────────────────────────────────────────
  await upd(5, 'Reset des permissions @everyone...');
  await guild.roles.everyone.setPermissions(0n).catch(e => console.error('everyone perms:', e.message));
  await sleep(500);

  // ── 2. Supprimer salons existants ──────────────────────────────────────────
  await upd(10, 'Suppression des anciens salons...');
  for (const ch of [...guild.channels.cache.values()]) {
    await ch.delete().catch(() => {});
    await sleep(120);
  }

  // ── 3. Créer les rôles ─────────────────────────────────────────────────────
  await upd(20, 'Création des rôles...');
  const R = {};
  for (const def of ROLES_DEF) {
    const existing = guild.roles.cache.find(r => r.name === def.name);
    if (existing) { R[def.name] = existing; continue; }
    try {
      const roleData = {
        name: def.name,
        hoist: def.hoist,
        mentionable: true,
        permissions: BigInt(def.perms),
      };
      // FIX: utiliser "color" (string hex) pas "colors"
      if (def.colors) roleData.color = def.colors;
      const role = await guild.roles.create(roleData);
      R[def.name] = role;
      console.log(`✅ Rôle créé: ${def.name}`);
      await sleep(250);
    } catch (e) { console.error(`❌ Rôle ${def.name}:`, e.message); }
  }

  // Raccourcis
  const membre   = R['🔱 Membre'];
  const vip      = R['💎 VIP'];
  const owner    = R['👑 Owner'];
  const resp     = R['⚜️ Responsable'];
  const modo     = R['🛡️ Modérateur'];
  const support  = R['🔧 Support'];
  const nonVerif = R['🔔 Non-vérifié'];
  const staffArr = [owner, resp, modo, support].filter(Boolean);
  const botId    = me?.id;

  // ── 4. Monter le rang du bot au maximum ────────────────────────────────────
  await upd(30, 'Ajustement des rangs...');
  try {
    const highestRole = guild.roles.cache.filter(r => !r.managed && r.id !== guild.id).sort((a, b) => b.position - a.position).first();
    if (highestRole && me?.roles?.botRole) {
      await me.roles.botRole.setPosition(highestRole.position + 1).catch(() => {});
    }
  } catch (e) { /* ignore */ }
  await sleep(500);

  // ── 5. Créer catégories + salons ───────────────────────────────────────────
  const createdCh = {};
  let secIdx = 0;

  for (const section of SERVER_STRUCTURE) {
    secIdx++;
    const pct = 35 + Math.floor((secIdx / SERVER_STRUCTURE.length) * 40);
    await upd(pct, `Catégorie : ${section.cat}`);

    // Permissions catégorie
    const catPerms = [
      { id: guild.id, deny: DENY_ALL },
      ...(botId ? [{ id: botId, allow: ALLOW_STAFF }] : []),
      ...staffArr.map(r => ({ id: r.id, allow: ALLOW_STAFF })),
    ];
    if (membre && !section.staffOnly) catPerms.push({ id: membre.id, allow: ALLOW_READ });

    const category = await guild.channels.create({ name: section.cat, type: ChannelType.GuildCategory, permissionOverwrites: catPerms }).catch(e => { console.error(e.message); return null; });
    if (!category) continue;
    await sleep(300);

    for (const chDef of section.channels) {
      const perms = [
        { id: guild.id, deny: DENY_ALL },
        ...(botId ? [{ id: botId, allow: ALLOW_STAFF }] : []),
        ...staffArr.map(r => ({ id: r.id, allow: ALLOW_STAFF })),
      ];

      if (chDef.staffOnly || section.staffOnly) {
        if (membre)   perms.push({ id: membre.id,   deny: [PermissionFlagsBits.ViewChannel] });
        if (nonVerif) perms.push({ id: nonVerif.id, deny: [PermissionFlagsBits.ViewChannel] });

      } else if (chDef.vipOnly) {
        if (membre) perms.push({ id: membre.id, deny: [PermissionFlagsBits.ViewChannel] });
        if (vip)    perms.push({ id: vip.id,    allow: ALLOW_WRITE });

      } else {
        // Salons visibles @everyone (vérif, règlement, info)
        if (chDef.everyoneSee) {
          perms[0] = { id: guild.id, deny: DENY_ALL.filter(p => p !== PermissionFlagsBits.ViewChannel), allow: ALLOW_READ };
        }
        if (membre) {
          if (chDef.hideFromMembre) {
            perms.push({ id: membre.id, deny: [PermissionFlagsBits.ViewChannel] });
          } else {
            perms.push({ id: membre.id, allow: chDef.write ? ALLOW_WRITE : ALLOW_READ });
          }
        }
        if (nonVerif) {
          if (chDef._verif) {
            perms.push({ id: nonVerif.id, allow: ALLOW_READ });
          } else {
            perms.push({ id: nonVerif.id, deny: [PermissionFlagsBits.ViewChannel] });
          }
        }
      }

      const ch = await guild.channels.create({ name: chDef.name, type: ChannelType.GuildText, topic: chDef.topic || '', parent: category.id, permissionOverwrites: perms }).catch(e => { console.error('Salon', chDef.name, e.message); return null; });
      if (ch) createdCh[chDef.name] = ch;
      await sleep(280);
    }
  }

  // ── 6. Embeds dans les salons ──────────────────────────────────────────────
  await upd(78, 'Envoi des embeds...');

  // INFOS
  if (createdCh['📖︱informations']) {
    await createdCh['📖︱informations'].send({ embeds: [new EmbedBuilder()
      .setColor(GOLD).setTitle('🔱 JAMAL LEAK HUB — BIENVENUE')
      .setDescription('```\n◈ LE HUB DE RÉFÉRENCE OSINT & LEAKS ◈\n```\n> Bienvenue sur **Jamal Leak Hub** !\n\n**📂 Au programme :**\n> 🔱 Leaks exclusifs\n> 🔍 OSINT & IA de recherche\n> 🤖 Base de données intégrée\n> 🎫 Support dédié\n> 🎮 Events & giveaways\n\n**🔗 discord.gg/AUhbYah7Ue**\n> ⚡ Commence par **#✅︱vérification** !')
      .setFooter({ text: 'Jamal Leak Hub • discord.gg/AUhbYah7Ue', iconURL: guild.iconURL() }).setTimestamp()] }).catch(() => {});
  }

  // RÈGLEMENT + bouton accepter
  if (createdCh['📜︱règlement']) {
    const embedRegl = new EmbedBuilder().setColor(GOLD).setTitle('📜 RÈGLEMENT — JAMAL LEAK HUB')
      .setDescription('```\n◈ RÈGLEMENT OFFICIEL — LECTURE OBLIGATOIRE ◈\n```\n**Art. I — Respect**\n> Insultes, harcèlement et manque de respect = sanction immédiate.\n\n**Art. II — Spam & Flood**\n> Spam, flood et publicité non autorisée interdits.\n\n**Art. III — Contenu illégal**\n> Contenu illégal = ban définitif + signalement.\n\n**Art. IV — OSINT éthique**\n> Recherches OSINT légales et éthiques uniquement.\n\n**Art. V — Vie privée**\n> Jamais de données personnelles sans accord.\n\n**Art. VI — Alts**\n> Contournement de sanction via alt = ban définitif.\n\n**Art. VII — Staff**\n> Décisions du staff finales. Contestations via ticket.\n\n**Art. VIII — Leaks**\n> Usage informatif uniquement. Exploitation commerciale interdite.\n\n```\n⚠ En rejoignant ce serveur, vous acceptez ce règlement.\n```')
      .setFooter({ text: 'Jamal Leak Hub • discord.gg/AUhbYah7Ue', iconURL: guild.iconURL() }).setTimestamp();
    const rowR = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('accept_rules').setLabel('✅  J\'ACCEPTE LE RÈGLEMENT').setStyle(ButtonStyle.Success));
    await createdCh['📜︱règlement'].send({ embeds: [embedRegl], components: [rowR] }).catch(() => {});
  }

  // VÉRIFICATION — style VaultCord : lien + bouton
  if (createdCh['✅︱vérification']) {
    const embedVerif = new EmbedBuilder().setColor(GOLD).setTitle('🔱 VÉRIFICATION — JAMAL LEAK HUB')
      .setDescription('```\n◈ BIENVENUE — ACCÈS AU SERVEUR ◈\n```\n> Pour accéder à **Jamal Leak Hub**, clique sur le bouton ci-dessous.\n\n**📋 Conditions :**\n> ・Compte Discord de plus de **7 jours**\n> ・Avoir lu le règlement\n> ・Pas de flag suspect\n\n**🔱 Appuie sur "VÉRIFIER" puis ouvre le lien** — le bot détectera automatiquement.\n\n> ⚡ Vérification instantanée.')
      .setFooter({ text: 'Jamal Leak Hub • discord.gg/AUhbYah7Ue', iconURL: guild.iconURL() }).setTimestamp();
    const rowV = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('verify_start').setLabel('✅  VÉRIFIER MON COMPTE').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('verify_rules').setLabel('📜  RÈGLEMENT').setStyle(ButtonStyle.Secondary),
    );
    await createdCh['✅︱vérification'].send({ embeds: [embedVerif], components: [rowV] }).catch(() => {});
  }

  // TICKETS
  if (createdCh['🎫︱tickets']) {
    const embedT = new EmbedBuilder().setColor(GOLD).setTitle('🎫 SUPPORT — JAMAL LEAK HUB')
      .setDescription('```\n◈ SYSTÈME DE TICKETS ◈\n```\n> Besoin d\'aide ? Sélectionne une catégorie.\n\n> 🔍 **OSINT** — Aide / recherche\n> 🛡️ **Signalement** — Report membre\n> 💼 **Candidature** — Rejoindre l\'équipe\n> ❓ **Autre** — Autre demande\n\n> ⚠ Un seul ticket actif par utilisateur.')
      .setFooter({ text: 'Jamal Leak Hub', iconURL: guild.iconURL() }).setTimestamp();
    const rowT = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder().setCustomId('ticket_category').setPlaceholder('📂  Sélectionne une catégorie...').addOptions([
        { label: '🔍  OSINT',             value: 'osint',  description: 'Aide OSINT ou recherche' },
        { label: '🛡️  Signalement',        value: 'report', description: 'Signaler un membre' },
        { label: '💼  Candidature Staff',  value: 'staff',  description: 'Postuler au staff' },
        { label: '❓  Autre',              value: 'other',  description: 'Autre demande' },
      ])
    );
    await createdCh['🎫︱tickets'].send({ embeds: [embedT], components: [rowT] }).catch(() => {});
  }

  // RÔLES
  if (createdCh['🎭︱choix-rôles']) {
    const embedRoles = new EmbedBuilder().setColor(GOLD).setTitle('🎭 RÔLES DE NOTIFICATION')
      .setDescription('```\n◈ SÉLECTION DES RÔLES ◈\n```\n> Choisis tes rôles. Clique de nouveau pour retirer.\n\n> 📢 **Annonces** · 🔱 **Leaks** · 🔍 **OSINT** · 🎮 **Events**')
      .setFooter({ text: 'Jamal Leak Hub', iconURL: guild.iconURL() }).setTimestamp();
    const rowRoles = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder().setCustomId('role_select').setPlaceholder('🎭  Choisis tes rôles...').setMinValues(0).setMaxValues(4).addOptions([
        { label: '📢  Annonces',  value: 'notif_annonces' },
        { label: '🔱  Leaks',     value: 'notif_leaks' },
        { label: '🔍  OSINT',     value: 'notif_osint' },
        { label: '🎮  Events',    value: 'notif_events' },
      ])
    );
    await createdCh['🎭︱choix-rôles'].send({ embeds: [embedRoles], components: [rowRoles] }).catch(() => {});
  }

  // LIENS
  if (createdCh['🔗︱liens-utiles']) {
    await createdCh['🔗︱liens-utiles'].send({ embeds: [new EmbedBuilder()
      .setColor(GOLD).setTitle('🔗 LIENS UTILES — OSINT')
      .setDescription('**🔍 Personnes :**\n> ・[Sherlock](https://github.com/sherlock-project/sherlock) · [Holehe](https://github.com/megadose/holehe) · [WhatsMyName](https://whatsmyname.app/)\n\n**🌐 Web & IP :**\n> ・[Shodan](https://shodan.io) · [VirusTotal](https://virustotal.com) · [IPInfo](https://ipinfo.io)\n\n**📊 Frameworks :**\n> ・[OSINT Framework](https://osintframework.com/) · [IntelTechniques](https://inteltechniques.com/)\n\n**🔗 discord.gg/AUhbYah7Ue**')
      .setFooter({ text: 'Jamal Leak Hub', iconURL: guild.iconURL() }).setTimestamp()] }).catch(() => {});
  }

  // IA OSINT info
  if (createdCh['🤖︱ia-osint']) {
    await createdCh['🤖︱ia-osint'].send({ embeds: [new EmbedBuilder()
      .setColor(0xEB459E).setTitle('🤖 IA OSINT — JAMAL LEAK HUB')
      .setDescription('```\n◈ INTELLIGENCE ARTIFICIELLE OSINT ◈\n```\n> Utilise `/ia-search` pour lancer une recherche IA assistée.\n> Utilise `/db-search` pour chercher dans la base de données.\n\n**Exemples :**\n```\n/ia-search requete: Jean Dupont Paris 75001\n/ia-search requete: jean.dupont@gmail.com\n/db-search query: Dupont\n```\n\n> ⚠ Utilisation éthique et légale uniquement.')
      .setFooter({ text: 'Jamal Leak Hub • IA OSINT', iconURL: guild.iconURL() }).setTimestamp()] }).catch(() => {});
  }

  // ── 7. Rôle Owner ──────────────────────────────────────────────────────────
  await upd(95, 'Attribution du rôle Owner...');
  if (owner) {
    const setupMember = await guild.members.fetch(interaction.user.id).catch(() => null);
    if (setupMember) await setupMember.roles.add(owner).catch(e => console.error('Owner role:', e.message));
  }

  await upd(100, 'Setup terminé !');
  await sleep(400);

  await statusMsg.edit({ content: '', embeds: [new EmbedBuilder()
    .setColor(GREEN).setTitle('✅ SETUP TERMINÉ — JAMAL LEAK HUB')
    .setDescription('> Serveur **entièrement configuré** !\n\n**✅ Créé :**\n> 🎭 13 rôles (color fix ✓)\n> 📂 9 catégories, 32 salons\n> 🔒 @everyone = 0 permissions\n> ✅ Vérification style VaultCord\n> 📜 Règlement + bouton\n> 🎫 Tickets (4 catégories)\n> 🤖 Salon IA OSINT\n> 🎭 Panel de rôles\n\n> 👑 Rôle **Owner** attribué.\n> 🔗 discord.gg/AUhbYah7Ue')
    .setFooter({ text: 'Jamal Leak Hub • Setup v3', iconURL: guild.iconURL() }).setTimestamp()] }).catch(() => {});
}

// ══════════════════════════════════════════════════════════════════════════════
//  IA OSINT FUNCTION
// ══════════════════════════════════════════════════════════════════════════════

async function iaOsintSearch(query) {
  const systemPrompt = `Tu es un assistant OSINT expert. L'utilisateur te donne une requête de recherche (nom, email, téléphone, IP, pseudo...).
Tu dois :
1. Identifier le type de cible (personne, email, IP, pseudo, entreprise)
2. Lister les outils OSINT les plus adaptés avec leurs URLs
3. Donner une stratégie de recherche étape par étape
4. Si c'est une IP, analyser les informations disponibles publiquement
5. Toujours rappeler l'éthique et la légalité
Répondre en français, de façon structurée avec des emojis. Maximum 800 tokens.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': config.anthropicKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: 'user', content: `Requête OSINT : "${query}"` }],
      }),
    });
    const data = await response.json();
    return data.content?.[0]?.text || 'Erreur IA';
  } catch (e) {
    return `❌ IA indisponible : ${e.message}`;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  DB SEARCH FUNCTION
// ══════════════════════════════════════════════════════════════════════════════

function dbSearch(query) {
  if (!db) return null;
  try {
    const q = `%${query}%`;
    const stmt = db.prepare(`
      SELECT * FROM personnes
      WHERE fullname LIKE ?
        OR firstname LIKE ?
        OR lastname LIKE ?
        OR email LIKE ?
        OR phone LIKE ?
        OR address LIKE ?
        OR city LIKE ?
        OR postal_code LIKE ?
        OR country LIKE ?
        OR username LIKE ?
        OR organisme LIKE ?
      LIMIT 10
    `);
    return stmt.all(q, q, q, q, q, q, q, q, q, q, q);
  } catch (e) {
    console.error('DB search error:', e.message);
    return [];
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  INTERACTIONS
// ══════════════════════════════════════════════════════════════════════════════

client.on('interactionCreate', async (interaction) => {

  // ── SLASH ───────────────────────────────────────────────────────────────────
  if (interaction.isChatInputCommand()) {
    const cmd = interaction.commandName;

    if (cmd === 'setup') return runSetup(interaction);

    // IA OSINT
    if (cmd === 'ia-search') {
      const query = interaction.options.getString('requete');
      await interaction.deferReply();
      const result = await iaOsintSearch(query);
      // Découper si trop long
      const chunks = result.match(/[\s\S]{1,3900}/g) || [result];
      const embed = new EmbedBuilder()
        .setColor(0xEB459E).setTitle('🤖 IA OSINT — Analyse')
        .setDescription(`**Requête :** \`${query}\`\n\n${chunks[0]}`)
        .setFooter({ text: `Jamal Leak Hub • IA OSINT | ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // DB SEARCH
    if (cmd === 'db-search') {
      const query = interaction.options.getString('query');
      await interaction.deferReply({ ephemeral: true });

      if (!db) {
        return interaction.editReply({ content: '❌ Base de données non configurée. Lance `db-setup/import.js` d\'abord.' });
      }

      const results = dbSearch(query);
      if (!results || results.length === 0) {
        return interaction.editReply({ content: `🔍 Aucun résultat pour \`${query}\`` });
      }

      const fields = results.slice(0, 5).map((r, i) => ({
        name: `#${i + 1} — ${r.fullname || `${r.firstname || ''} ${r.lastname || ''}`.trim() || 'Inconnu'}`,
        value: [
          r.email    ? `📧 ${r.email}`    : null,
          r.phone    ? `📞 ${r.phone}`    : null,
          r.address  ? `📍 ${r.address}${r.city ? `, ${r.city}` : ''}` : null,
          r.country  ? `🌍 ${r.country}`  : null,
          r.birthdate? `🎂 ${r.birthdate}`: null,
          r.username ? `👤 ${r.username}` : null,
        ].filter(Boolean).join('\n') || 'Données limitées',
        inline: false,
      }));

      const embed = new EmbedBuilder()
        .setColor(GOLD).setTitle(`🔍 Résultats DB — \`${query}\``)
        .setDescription(`> **${results.length}** résultat(s) trouvé(s) (affichage : 5 max)\n> ⚠ Usage éthique uniquement.`)
        .addFields(fields)
        .setFooter({ text: `Jamal Leak Hub • DB OSINT | ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    }

    // USERINFO
    if (cmd === 'userinfo') {
      const target = interaction.options.getUser('user') || interaction.user;
      const member = await interaction.guild.members.fetch(target.id).catch(() => null);
      return interaction.reply({ embeds: [new EmbedBuilder()
        .setColor(GOLD).setTitle(`👤 ${target.username}`)
        .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 512 }))
        .addFields(
          { name: '🆔 ID', value: `\`${target.id}\``, inline: true },
          { name: '📛 Tag', value: `\`${target.tag}\``, inline: true },
          { name: '📅 Créé', value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`, inline: true },
          { name: '📥 A rejoint', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Inconnu', inline: true },
          { name: '🎭 Rôles', value: member ? member.roles.cache.filter(r => r.id !== interaction.guild.id).map(r => r.toString()).join(', ') || 'Aucun' : 'Inconnu' },
        )
        .setFooter({ text: 'Jamal Leak Hub', iconURL: interaction.guild.iconURL() }).setTimestamp()] });
    }

    if (cmd === 'serverinfo') {
      const g = interaction.guild;
      return interaction.reply({ embeds: [new EmbedBuilder()
        .setColor(GOLD).setTitle(`🔱 ${g.name}`)
        .setThumbnail(g.iconURL({ dynamic: true }))
        .addFields(
          { name: '👑 Owner', value: `<@${g.ownerId}>`, inline: true },
          { name: '👥 Membres', value: `${g.memberCount}`, inline: true },
          { name: '📅 Créé', value: `<t:${Math.floor(g.createdTimestamp / 1000)}:R>`, inline: true },
          { name: '📢 Salons', value: `${g.channels.cache.size}`, inline: true },
          { name: '🎭 Rôles', value: `${g.roles.cache.size}`, inline: true },
          { name: '🔗 Invite', value: 'discord.gg/AUhbYah7Ue', inline: true },
        )
        .setFooter({ text: 'Jamal Leak Hub', iconURL: g.iconURL() }).setTimestamp()] });
    }

    if (cmd === 'ban') {
      const target = interaction.options.getUser('user');
      const raison = interaction.options.getString('raison') || 'Aucune raison';
      try { await interaction.guild.members.ban(target, { reason: raison }); return interaction.reply({ embeds: [new EmbedBuilder().setColor(RED).setTitle('🔨 Banni').setDescription(`> **${target.tag}** banni.\n> **Raison :** ${raison}`).setTimestamp()] }); }
      catch { return interaction.reply({ content: '❌ Impossible.', ephemeral: true }); }
    }

    if (cmd === 'kick') {
      const target = interaction.options.getMember('user');
      const raison = interaction.options.getString('raison') || 'Aucune raison';
      try { await target.kick(raison); return interaction.reply({ embeds: [new EmbedBuilder().setColor(RED).setTitle('👢 Kick').setDescription(`> **${target.user.tag}** kick.\n> **Raison :** ${raison}`).setTimestamp()] }); }
      catch { return interaction.reply({ content: '❌ Impossible.', ephemeral: true }); }
    }

    if (cmd === 'mute') {
      const target = interaction.options.getMember('user');
      const duree = interaction.options.getInteger('duree');
      const raison = interaction.options.getString('raison') || 'Aucune raison';
      try { await target.timeout(duree * 60000, raison); return interaction.reply({ embeds: [new EmbedBuilder().setColor(RED).setTitle('🔇 Mute').setDescription(`> **${target.user.tag}** mute **${duree} min**.\n> **Raison :** ${raison}`).setTimestamp()] }); }
      catch { return interaction.reply({ content: '❌ Impossible.', ephemeral: true }); }
    }

    if (cmd === 'clear') {
      const n = interaction.options.getInteger('nombre');
      await interaction.channel.bulkDelete(n, true);
      const m = await interaction.reply({ embeds: [new EmbedBuilder().setColor(GOLD).setDescription(`> 🗑️ **${n}** messages supprimés.`).setTimestamp()], fetchReply: true });
      setTimeout(() => m.delete().catch(() => {}), 3000);
    }

    if (cmd === 'annonce') {
      const msg = interaction.options.getString('message');
      const salon = interaction.options.getChannel('salon') || interaction.channel;
      await salon.send({ content: '@everyone', embeds: [new EmbedBuilder().setColor(GOLD).setTitle('📢 ANNONCE').setDescription(`> ${msg}`).setFooter({ text: `Par ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() }).setTimestamp()] });
      return interaction.reply({ content: '✅ Annonce envoyée.', ephemeral: true });
    }
  }

  // ── BUTTONS ─────────────────────────────────────────────────────────────────
  if (interaction.isButton()) {

    if (interaction.customId === 'verify_start') {
      const memberRole = interaction.guild.roles.cache.find(r => r.name === '🔱 Membre');
      if (!memberRole) return interaction.reply({ content: '❌ Rôle introuvable. Contacte un admin.', ephemeral: true });
      if (Date.now() - interaction.user.createdTimestamp < 7 * 864e5)
        return interaction.reply({ content: '❌ Compte trop récent (minimum **7 jours** requis).', ephemeral: true });
      const member = await interaction.guild.members.fetch(interaction.user.id);
      if (member.roles.cache.has(memberRole.id)) return interaction.reply({ content: '✅ Déjà vérifié !', ephemeral: true });
      const nonVerif = interaction.guild.roles.cache.find(r => r.name === '🔔 Non-vérifié');
      if (nonVerif && member.roles.cache.has(nonVerif.id)) await member.roles.remove(nonVerif).catch(() => {});
      await member.roles.add(memberRole);
      await interaction.reply({ embeds: [new EmbedBuilder().setColor(GREEN).setTitle('✅ VÉRIFICATION RÉUSSIE').setDescription('> Tu as maintenant accès à **Jamal Leak Hub** !\n> Bonne exploration 🔱\n\n> 🔗 discord.gg/AUhbYah7Ue').setThumbnail(interaction.user.displayAvatarURL({ dynamic: true })).setFooter({ text: 'Jamal Leak Hub', iconURL: interaction.guild.iconURL() }).setTimestamp()], ephemeral: true });
      const logCh = interaction.guild.channels.cache.find(c => c.name === '📋︱logs-joins');
      if (logCh) logCh.send({ embeds: [new EmbedBuilder().setColor(GREEN).setTitle('✅ Membre vérifié').addFields({ name: 'Utilisateur', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true }, { name: 'Vérifié le', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }).setThumbnail(interaction.user.displayAvatarURL()).setTimestamp()] });
    }

    if (interaction.customId === 'verify_rules') {
      const ch = interaction.guild.channels.cache.find(c => c.name === '📜︱règlement');
      return interaction.reply({ content: `📜 Règlement : ${ch?.toString() || '#📜︱règlement'}`, ephemeral: true });
    }

    if (interaction.customId === 'accept_rules')
      return interaction.reply({ content: '✅ Règlement accepté ! Va dans **#✅︱vérification** pour finaliser.', ephemeral: true });

    if (interaction.customId === 'close_ticket') {
      await interaction.reply({ embeds: [new EmbedBuilder().setColor(RED).setTitle('🔒 Ticket fermé').setDescription(`> Fermé par **${interaction.user.tag}**.\n> Suppression dans **5 secondes**.`).setTimestamp()] });
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }

    if (interaction.customId === 'claim_ticket')
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(GOLD).setDescription(`> 🎫 Pris en charge par ${interaction.user.toString()}.`).setTimestamp()] });
  }

  // ── SELECT MENUS ─────────────────────────────────────────────────────────────
  if (interaction.isStringSelectMenu()) {

    if (interaction.customId === 'ticket_category') {
      const labels = { osint: '🔍 OSINT', report: '🛡️ Signalement', staff: '💼 Staff', other: '❓ Autre' };
      const cat = interaction.values[0];
      const existing = interaction.guild.channels.cache.find(c => c.topic === `ticket:${interaction.user.id}`);
      if (existing) return interaction.reply({ content: `❌ Ticket déjà ouvert : ${existing.toString()}`, ephemeral: true });
      const ticketParent = interaction.guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes('support'));
      const staffRoles = ['👑 Owner', '⚜️ Responsable', '🛡️ Modérateur', '🔧 Support'].map(n => interaction.guild.roles.cache.find(r => r.name === n)).filter(Boolean);
      const botId = interaction.guild.members.me?.id;
      const ch = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)}`,
        type: ChannelType.GuildText, topic: `ticket:${interaction.user.id}`, parent: ticketParent?.id,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
          ...staffRoles.map(r => ({ id: r.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] })),
          ...(botId ? [{ id: botId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels] }] : []),
        ],
      }).catch(() => null);
      if (!ch) return interaction.reply({ content: '❌ Erreur création ticket.', ephemeral: true });
      const rowT = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('claim_ticket').setLabel('📌  Prendre en charge').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('close_ticket').setLabel('🔒  Fermer').setStyle(ButtonStyle.Danger),
      );
      await ch.send({ content: `${interaction.user.toString()} ${staffRoles.map(r => r.toString()).join(' ')}`, embeds: [new EmbedBuilder().setColor(GOLD).setTitle(`🎫 Ticket — ${labels[cat]}`).setDescription(`> Bienvenue ${interaction.user.toString()} !\n> **Catégorie :** ${labels[cat]}\n\n> Explique ta demande, le staff répondra rapidement.\n> ⏱ Réponse : **< 24h**`).setFooter({ text: 'Jamal Leak Hub', iconURL: interaction.guild.iconURL() }).setTimestamp()], components: [rowT] });
      return interaction.reply({ content: `✅ Ticket créé : ${ch.toString()}`, ephemeral: true });
    }

    if (interaction.customId === 'role_select') {
      const map = { notif_annonces: '📢 Annonces', notif_leaks: '🔱 Leaks Notif', notif_osint: '🔍 OSINT Notif', notif_events: '🎮 Events' };
      const member = await interaction.guild.members.fetch(interaction.user.id);
      const sel = interaction.values;
      const added = [], removed = [];
      for (const [val, name] of Object.entries(map)) {
        const role = interaction.guild.roles.cache.find(r => r.name === name);
        if (!role) continue;
        if (sel.includes(val) && !member.roles.cache.has(role.id)) { await member.roles.add(role).catch(() => {}); added.push(name); }
        else if (!sel.includes(val) && member.roles.cache.has(role.id)) { await member.roles.remove(role).catch(() => {}); removed.push(name); }
      }
      const parts = [];
      if (added.length) parts.push(`✅ Ajouté : ${added.join(', ')}`);
      if (removed.length) parts.push(`❌ Retiré : ${removed.join(', ')}`);
      return interaction.reply({ content: parts.join('\n') || 'Aucun changement.', ephemeral: true });
    }
  }
});

client.login(config.token);

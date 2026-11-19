// Database initialization for the Data Platform (D1).
//
//   npm run db:init            seed an empty or existing database (safe to re-run)
//   npm run db:init -- --reset wipe THIS org's data first, then seed (destructive)
//
// Idempotent: every record is matched by a fixed key, so re-running creates no duplicates
// and (without --reset) deletes nothing. Passwords are bcrypt-hashed before they are stored.
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { orgs, users, clients, services, events } = require('../models/models');

const RESET = process.argv.includes('--reset');

// 1. Check configuration before touching anything; exit non-zero if something is wrong.
const required = ['MONGO_URL', 'ORG_ID'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Config error: missing in backend/.env: ${missing.join(', ')}`);
  process.exit(1);
}
if (!mongoose.Types.ObjectId.isValid(process.env.ORG_ID)) {
  console.error('Config error: ORG_ID must be a 24-character hex string');
  process.exit(1);
}

const orgId = new mongoose.Types.ObjectId(process.env.ORG_ID);
const viewer = {
  username: process.env.SEED_VIEWER_USERNAME || 'user',
  password: process.env.SEED_VIEWER_PASSWORD || 'user',
  role: 'viewer'
};
const editor = {
  username: process.env.SEED_EDITOR_USERNAME || 'admin',
  password: process.env.SEED_EDITOR_PASSWORD || 'admin',
  role: 'editor'
};

const daysFromToday = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);
const firstNames = ['Ana', 'Luis', 'Maria', 'James', 'Linh', 'Omar', 'Grace', 'Diego',
  'Sara', 'Kevin', 'Nadia', 'Peter', 'Rosa', 'Tariq', 'Emily', 'Hector'];
const lastNames = ['Garcia', 'Nguyen', 'Lopez', 'Smith', 'Tran', 'Haddad', 'Kim', 'Ramirez',
  'Patel', 'Johnson', 'Ali', 'Brown', 'Torres', 'Khan', 'Davis', 'Flores'];
const zips = ['77002', '77004', '77007', '77019', '77023', '77036'];
const serviceNames = ['Family Support', 'Adult Education', 'Youth Services Program',
  'Early Childhood Education', 'Health Screenings', 'Food Pantry', 'Job Readiness',
  'Mental Health Counseling', 'Senior Outreach', 'Housing Assistance', 'Legal Aid Clinic',
  'Vaccination Drive', 'Nutrition Classes', 'ESL Classes', 'Tax Preparation Help'];

const upsert = (model, filter, doc) =>
  model.findOneAndUpdate(filter, { $setOnInsert: doc }, { upsert: true, new: true });

async function resetOrgData() {
  console.log('--reset: deleting this organization\'s existing data...');
  await Promise.all([
    clients.deleteMany({ orgs: orgId }),
    events.deleteMany({ org: orgId }),
    services.deleteMany({ org: orgId }),
    users.deleteMany({ org: orgId }),
    orgs.deleteOne({ _id: orgId })
  ]);
}

async function ensureIndexes() {
  // Indexes the app relies on: unique login per org, and org-scoped lookups (withOrg).
  await users.collection.createIndex({ username: 1, org: 1 }, { unique: true });
  await clients.collection.createIndex({ orgs: 1 });
  await events.collection.createIndex({ org: 1 });
  await services.collection.createIndex({ org: 1 });
}

async function main() {
  await mongoose.connect(process.env.MONGO_URL);
  console.log(`Connected to database "${mongoose.connection.name}"${RESET ? ' (reset mode)' : ''}`);

  if (RESET) await resetOrgData();

  // Organization (its _id must equal ORG_ID so the app's ORG_ID config matches)
  await upsert(orgs, { _id: orgId }, { _id: orgId, name: 'Community Center' });

  // Demo accounts (bcrypt-hashed)
  for (const a of [viewer, editor]) {
    const hash = await bcrypt.hash(a.password, 10);
    await upsert(users, { username: a.username, org: orgId },
      { _id: new mongoose.Types.ObjectId(), username: a.username, password: hash, role: a.role, org: orgId });
  }

  // Services
  const serviceDocs = [];
  for (const name of serviceNames) {
    serviceDocs.push(await upsert(services, { name, org: orgId },
      { name, description: `${name} offered by the Community Center`, status: 'Active', org: orgId }));
  }

  // Clients
  const clientDocs = [];
  for (let i = 0; i < firstNames.length; i++) {
    const email = `${firstNames[i]}.${lastNames[i]}@example.com`.toLowerCase();
    clientDocs.push(await upsert(clients, { email, orgs: orgId }, {
      firstName: firstNames[i],
      lastName: lastNames[i],
      email,
      phoneNumber: { primary: `713555${String(1000 + i)}` },
      address: { line1: `${100 + i * 7} Main St`, city: 'Houston', county: 'Harris', zip: zips[i % zips.length] },
      orgs: [orgId]
    }));
  }

  // Events (each with services and at least one attendee -> satisfies "at least one registration")
  for (let i = 0; i < 15; i++) {
    const name = `${serviceNames[i]} Day`;
    const attendees = clientDocs.filter((_, c) => (c + i) % 3 === 0).map((c) => c._id);
    await upsert(events, { name, org: orgId }, {
      name,
      org: orgId,
      description: `Community event for ${serviceNames[i].toLowerCase()}`,
      date: daysFromToday(i - 10), // spread recent -> near future so the dashboard has data
      services: [serviceDocs[i]._id, serviceDocs[(i + 1) % serviceDocs.length]._id],
      address: { line1: '500 Community Way', city: 'Houston', county: 'Harris', zip: zips[i % zips.length] },
      attendees
    });
  }

  await ensureIndexes();

  const counts = {
    org: await orgs.countDocuments({ _id: orgId }),
    users: await users.countDocuments({ org: orgId }),
    clients: await clients.countDocuments({ orgs: orgId }),
    services: await services.countDocuments({ org: orgId }),
    events: await events.countDocuments({ org: orgId })
  };
  console.log('Initialization complete:', counts);
  console.log(`Log in with ${viewer.username}/${viewer.password} (viewer) or ${editor.username}/${editor.password} (editor).`);
}

main()
  .catch((err) => {
    console.error('db:init failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
// Temporary dev seed for Sprint 2. Replaced by the real `npm run db:init` (D1) in Sprint 3.
// Safe to run more than once: every record is upserted by a fixed key, so nothing is duplicated
// and nothing that already exists is deleted.
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { orgs, users, clients, services, events } = require('../models/models');

const required = ['MONGO_URL', 'ORG_ID', 'JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing in backend/.env: ${missing.join(', ')}`);
  process.exit(1);
}
if (!mongoose.Types.ObjectId.isValid(process.env.ORG_ID)) {
  console.error('ORG_ID must be a 24-character hex string');
  process.exit(1);
}

const orgId = new mongoose.Types.ObjectId(process.env.ORG_ID);
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

async function upsert(model, filter, doc) {
  return model.findOneAndUpdate(filter, { $setOnInsert: doc }, { upsert: true, new: true });
}

async function main() {
  await mongoose.connect(process.env.MONGO_URL);
  console.log(`Connected to database "${mongoose.connection.name}"`);

  await upsert(orgs, { _id: orgId }, { _id: orgId, name: 'Community Center' });

  const accounts = [
    { username: process.env.SEED_VIEWER_USERNAME || 'user', password: process.env.SEED_VIEWER_PASSWORD || 'user', role: 'viewer' },
    { username: process.env.SEED_EDITOR_USERNAME || 'admin', password: process.env.SEED_EDITOR_PASSWORD || 'admin', role: 'editor' }
  ];
  for (const a of accounts) {
    const hash = await bcrypt.hash(a.password, 10);
    await upsert(users, { username: a.username, org: orgId },
      { _id: new mongoose.Types.ObjectId(), username: a.username, password: hash, role: a.role, org: orgId });
  }

  const serviceDocs = [];
  for (const name of serviceNames) {
    serviceDocs.push(await upsert(services, { name, org: orgId },
      { name, description: `${name} offered by the Community Center`, status: 'Active', org: orgId }));
  }

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

  for (let i = 0; i < 15; i++) {
    const name = `${serviceNames[i]} Day`;
    const attendees = clientDocs.filter((_, c) => (c + i) % 3 === 0).map((c) => c._id);
    await upsert(events, { name, org: orgId }, {
      name,
      org: orgId,
      description: `Community event for ${serviceNames[i].toLowerCase()}`,
      date: daysFromToday(i - 10), // spread from 10 days ago to 4 days ahead, so the dashboard has recent data
      services: [serviceDocs[i]._id, serviceDocs[(i + 1) % serviceDocs.length]._id],
      address: { line1: '500 Community Way', city: 'Houston', county: 'Harris', zip: zips[i % zips.length] },
      attendees
    });
  }

  const counts = {
    users: await users.countDocuments({ org: orgId }),
    clients: await clients.countDocuments({ orgs: orgId }),
    services: await services.countDocuments({ org: orgId }),
    events: await events.countDocuments({ org: orgId })
  };
  console.log('Seed complete:', counts);
  console.log('Log in with user/user (viewer) or admin/admin (editor).');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
// Unit tests for the S1 security primitives (requireAuth, requireRole, withOrg).
// Uses Node's built-in test runner — no extra dependencies.
//   run with:  npm test   (from the backend folder)
const { test } = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test-secret';

const requireAuth = require('../auth/requireAuth');
const requireRole = require('../auth/requireRole');
const withOrg = require('../auth/withOrg');

// Minimal Express-style res double
function mockRes() {
  const res = { statusCode: null, body: null };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  return res;
}

// --- requireAuth ---------------------------------------------------------
test('requireAuth: no token -> 401, next not called', () => {
  const res = mockRes();
  let nexted = false;
  requireAuth({ header: () => null }, res, () => { nexted = true; });
  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(nexted, false);
});

test('requireAuth: invalid token -> 401', () => {
  const res = mockRes();
  requireAuth({ header: () => 'Bearer not-a-real-token' }, res, () => {});
  assert.strictEqual(res.statusCode, 401);
});

test('requireAuth: valid token -> req.user populated (with orgId), next called', () => {
  const token = jwt.sign(
    { name: 'admin', role: 'editor', orgId: '64e0380b3cc28d087655693b' },
    process.env.JWT_SECRET
  );
  const req = { header: () => `Bearer ${token}` };
  let nexted = false;
  requireAuth(req, mockRes(), () => { nexted = true; });
  assert.strictEqual(nexted, true);
  assert.strictEqual(req.user.role, 'editor');
  assert.strictEqual(req.user.orgId, '64e0380b3cc28d087655693b');
});

// --- requireRole ---------------------------------------------------------
test("requireRole('editor'): viewer -> 403", () => {
  const res = mockRes();
  requireRole('editor')({ user: { role: 'viewer' } }, res, () => {});
  assert.strictEqual(res.statusCode, 403);
});

test("requireRole('editor'): editor -> next called", () => {
  let nexted = false;
  requireRole('editor')({ user: { role: 'editor' } }, mockRes(), () => { nexted = true; });
  assert.strictEqual(nexted, true);
});

test("requireRole('editor'): missing user -> 403 (fails closed)", () => {
  const res = mockRes();
  requireRole('editor')({}, res, () => {});
  assert.strictEqual(res.statusCode, 403);
});

// --- withOrg -------------------------------------------------------------
test('withOrg: default field is org (events/services)', () => {
  const req = { user: { orgId: 'ORG1' } };
  assert.deepStrictEqual(withOrg({ _id: 'e1' }, req), { _id: 'e1', org: 'ORG1' });
});

test("withOrg: clients pass 'orgs'", () => {
  const req = { user: { orgId: 'ORG1' } };
  assert.deepStrictEqual(withOrg({ _id: 'c1' }, req, 'orgs'), { _id: 'c1', orgs: 'ORG1' });
});

test('withOrg: org from the token overrides any org in the filter (no spoofing)', () => {
  const req = { user: { orgId: 'ORG1' } };
  assert.deepStrictEqual(withOrg({ org: 'ANOTHER_ORG' }, req), { org: 'ORG1' });
});
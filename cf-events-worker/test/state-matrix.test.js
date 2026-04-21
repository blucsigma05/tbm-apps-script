// Tests for src/state-matrix.js.
//
// Zero-dep: uses Node's built-in test runner (stable since 18, v24 here).
// Run: node --test test/state-matrix.test.js
//
// The matrix encodes Migration Plan v4.1 §E.11. These tests are the
// living spec — if a transition is added/removed from the plan, update
// the matrix AND the tests together.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ALLOWED_TRANSITIONS, isTransitionAllowed } from '../src/state-matrix.js';

const ALL_STATES = Object.keys(ALLOWED_TRANSITIONS);

// ---------- matrix structural integrity ----------

test('matrix includes all 13 lifecycle states', () => {
  const expected = [
    'INTAKE', 'SPEC-DRAFTING', 'READY-TO-BUILD', 'IN-PROGRESS',
    'REVIEW-PENDING', 'REVIEW-PASSED', 'REVIEW-FAILED', 'REVISION-NEEDED',
    'READY-FOR-APPROVAL', 'APPROVED', 'MERGED', 'DEPLOYED', 'CLOSED',
    'BLOCKED',
  ];
  assert.deepEqual([...ALL_STATES].sort(), [...expected].sort());
});

test('every destination in the matrix is itself a known state', () => {
  // Catches typos like "REVIEW-PASS" → "REVIEW-PASSED".
  for (const [from, targets] of Object.entries(ALLOWED_TRANSITIONS)) {
    for (const to of targets) {
      assert.ok(
        ALL_STATES.includes(to),
        `${from} → ${to}: destination not in state list`,
      );
    }
  }
});

// ---------- BLOCKED universality ----------

test('every state can transition to BLOCKED', () => {
  // §E.11: "BLOCKED is universally allowed — any state can transition to
  // BLOCKED because exception handling is always a valid next step."
  for (const from of ALL_STATES) {
    assert.equal(
      isTransitionAllowed(from, 'BLOCKED'),
      true,
      `${from} → BLOCKED should be allowed`,
    );
  }
});

test('BLOCKED → BLOCKED is allowed (idempotent re-block)', () => {
  // Edge case: if an event re-fires and we're already BLOCKED, the
  // idempotency key should no-op, but the transition itself must still
  // be considered valid or the 422 path fires spuriously.
  assert.equal(isTransitionAllowed('BLOCKED', 'BLOCKED'), true);
});

// ---------- terminal state ----------

test('CLOSED has no outgoing transitions except BLOCKED', () => {
  // CLOSED is terminal. The only out is BLOCKED (covered above) — which
  // exists so that "closed in error, reopen" has a legal audit trail.
  const outgoing = ALLOWED_TRANSITIONS.CLOSED;
  assert.deepEqual(outgoing, []);
  // But BLOCKED is still allowed via the universal rule.
  assert.equal(isTransitionAllowed('CLOSED', 'BLOCKED'), true);
  assert.equal(isTransitionAllowed('CLOSED', 'DEPLOYED'), false);
  assert.equal(isTransitionAllowed('CLOSED', 'INTAKE'), false);
});

// ---------- happy-path lifecycle walk ----------

test('happy-path walk through the full lifecycle is legal', () => {
  const path = [
    'INTAKE', 'SPEC-DRAFTING', 'READY-TO-BUILD', 'IN-PROGRESS',
    'REVIEW-PENDING', 'REVIEW-PASSED', 'READY-FOR-APPROVAL', 'APPROVED',
    'MERGED', 'DEPLOYED', 'CLOSED',
  ];
  for (let i = 0; i < path.length - 1; i++) {
    assert.equal(
      isTransitionAllowed(path[i], path[i + 1]),
      true,
      `happy-path step ${path[i]} → ${path[i + 1]} should be allowed`,
    );
  }
});

test('review-fail loop is legal: REVIEW-PENDING → REVIEW-FAILED → REVISION-NEEDED → REVIEW-PENDING', () => {
  assert.equal(isTransitionAllowed('REVIEW-PENDING', 'REVIEW-FAILED'), true);
  assert.equal(isTransitionAllowed('REVIEW-FAILED', 'REVISION-NEEDED'), true);
  assert.equal(isTransitionAllowed('REVISION-NEEDED', 'REVIEW-PENDING'), true);
});

test('review-fail can also go straight back to READY-TO-BUILD (big rework)', () => {
  assert.equal(isTransitionAllowed('REVIEW-FAILED', 'READY-TO-BUILD'), true);
});

// ---------- illegal skips ----------

test('skipping forward in the pipeline is rejected', () => {
  // Spot-checks — if any of these become legal, the matrix changed.
  assert.equal(isTransitionAllowed('INTAKE', 'IN-PROGRESS'), false);
  assert.equal(isTransitionAllowed('INTAKE', 'DEPLOYED'), false);
  assert.equal(isTransitionAllowed('SPEC-DRAFTING', 'IN-PROGRESS'), false);
  assert.equal(isTransitionAllowed('IN-PROGRESS', 'APPROVED'), false);
  assert.equal(isTransitionAllowed('APPROVED', 'DEPLOYED'), false);
  assert.equal(isTransitionAllowed('READY-TO-BUILD', 'MERGED'), false);
});

test('going backward in the pipeline is rejected (must go via BLOCKED)', () => {
  assert.equal(isTransitionAllowed('IN-PROGRESS', 'SPEC-DRAFTING'), false);
  assert.equal(isTransitionAllowed('REVIEW-PASSED', 'IN-PROGRESS'), false);
  assert.equal(isTransitionAllowed('MERGED', 'APPROVED'), false);
  assert.equal(isTransitionAllowed('DEPLOYED', 'MERGED'), false);
});

test('self-transition is rejected (unless explicitly in the list)', () => {
  // No state lists itself as an allowed destination. Re-firing the same
  // state should be caught upstream by idempotency, not treated as a new
  // transition.
  for (const state of ALL_STATES) {
    if (state === 'BLOCKED') continue; // covered separately — BLOCKED → BLOCKED ok
    assert.equal(
      isTransitionAllowed(state, state),
      false,
      `${state} → ${state} should be rejected`,
    );
  }
});

// ---------- BLOCKED recovery paths ----------

test('BLOCKED can return to any non-BLOCKED state', () => {
  // Resolution of a block specifies which state to return to; the
  // resolving write must be audit-logged with a reason.
  const nonBlocked = ALL_STATES.filter((s) => s !== 'BLOCKED');
  for (const target of nonBlocked) {
    assert.equal(
      isTransitionAllowed('BLOCKED', target),
      true,
      `BLOCKED → ${target} should be allowed (resolution path)`,
    );
  }
});

// ---------- defensive input handling ----------

test('unknown from-state returns false', () => {
  assert.equal(isTransitionAllowed('NOT-A-STATE', 'INTAKE'), false);
  assert.equal(isTransitionAllowed('', 'INTAKE'), false);
  assert.equal(isTransitionAllowed(null, 'INTAKE'), false);
  assert.equal(isTransitionAllowed(undefined, 'INTAKE'), false);
});

test('unknown to-state returns false (except BLOCKED rule cannot save it)', () => {
  // to-state must match a known state literal; there's no partial matching.
  assert.equal(isTransitionAllowed('INTAKE', 'NOT-A-STATE'), false);
  assert.equal(isTransitionAllowed('INTAKE', ''), false);
  assert.equal(isTransitionAllowed('INTAKE', 'blocked'), false); // case sensitive
  assert.equal(isTransitionAllowed('INTAKE', 'READY_TO_BUILD'), false); // underscore vs hyphen
});

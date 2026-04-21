// Allowed-transition matrix from Migration Plan v4.1 §E.11.
//
// A state transition is only legal if the target state is in the allowed list
// for the current state. Anything else returns 422 from the DO + creates an
// exception queue entry with failure_category=technical.
//
// BLOCKED is universally allowed — any state can transition to BLOCKED because
// exception handling is always a valid next step.

export const ALLOWED_TRANSITIONS = {
  INTAKE: ['SPEC-DRAFTING', 'BLOCKED'],
  'SPEC-DRAFTING': ['READY-TO-BUILD', 'BLOCKED'],
  'READY-TO-BUILD': ['IN-PROGRESS', 'BLOCKED'],
  'IN-PROGRESS': ['REVIEW-PENDING', 'BLOCKED'],
  'REVIEW-PENDING': ['REVIEW-PASSED', 'REVIEW-FAILED', 'BLOCKED'],
  'REVIEW-PASSED': ['READY-FOR-APPROVAL', 'BLOCKED'],
  'REVIEW-FAILED': ['REVISION-NEEDED', 'READY-TO-BUILD', 'BLOCKED'],
  'REVISION-NEEDED': ['REVIEW-PENDING', 'BLOCKED'],
  'READY-FOR-APPROVAL': ['APPROVED', 'BLOCKED'],
  APPROVED: ['MERGED', 'BLOCKED'],
  MERGED: ['DEPLOYED', 'BLOCKED'],
  DEPLOYED: ['CLOSED', 'BLOCKED'],
  CLOSED: [],
  // BLOCKED can return to any non-terminal state after resolution; the
  // resolving write specifies which state to return to and is audit-logged.
  BLOCKED: [
    'INTAKE', 'SPEC-DRAFTING', 'READY-TO-BUILD', 'IN-PROGRESS',
    'REVIEW-PENDING', 'REVIEW-PASSED', 'REVIEW-FAILED', 'REVISION-NEEDED',
    'READY-FOR-APPROVAL', 'APPROVED', 'MERGED', 'DEPLOYED', 'CLOSED',
  ],
};

export function isTransitionAllowed(fromState, toState) {
  if (toState === 'BLOCKED') return true;
  const allowed = ALLOWED_TRANSITIONS[fromState];
  if (!allowed) return false;
  return allowed.includes(toState);
}

/**
 * measurements/index.js — Code registry for the full PR-1 + PR-2 criteria set.
 *
 * The registry IS the single dispatch authority (v8 plan: "code registry only;
 * rubric prose is description"). rubric.measurement_method prose documents
 * intent; the impl here is what actually runs.
 *
 * Each entry: { id, tier, impl, familyOnly? }. impl is an async function
 * (ctx) → checkResult per the schema's checkResult definition. familyOnly
 * filters by child ('jj' or 'buggsy'); absent means runs for any child.
 * Measurements that are route-gated (e.g. C* for /comic-studio) self-skip
 * inside the impl and do not need familyOnly.
 *
 * PR-2 additions (2026-04-21): U5, U6, U8, U9, U10, U15, U16 (universal),
 * J2-J6 (JJ must-pass), B2-B6 (Buggsy must-pass), C1-C6 (Comic Studio).
 */

var path = require('path');

var PRE_2 = require(path.join(__dirname, 'PRE-2.js'));
var PRE_4 = require(path.join(__dirname, 'PRE-4.js'));
var U1 = require(path.join(__dirname, 'U1.js'));
var U2 = require(path.join(__dirname, 'U2.js'));
var U3 = require(path.join(__dirname, 'U3.js'));
var U5 = require(path.join(__dirname, 'U5.js'));
var U6 = require(path.join(__dirname, 'U6.js'));
var U7 = require(path.join(__dirname, 'U7.js'));
var U8 = require(path.join(__dirname, 'U8.js'));
var U9 = require(path.join(__dirname, 'U9.js'));
var U10 = require(path.join(__dirname, 'U10.js'));
var U11 = require(path.join(__dirname, 'U11.js'));
var U12 = require(path.join(__dirname, 'U12.js'));
var U13 = require(path.join(__dirname, 'U13.js'));
var U14 = require(path.join(__dirname, 'U14.js'));
var U15 = require(path.join(__dirname, 'U15.js'));
var U16 = require(path.join(__dirname, 'U16.js'));
var J1 = require(path.join(__dirname, 'J1.js'));
var J2 = require(path.join(__dirname, 'J2.js'));
var J3 = require(path.join(__dirname, 'J3.js'));
var J4 = require(path.join(__dirname, 'J4.js'));
var J5 = require(path.join(__dirname, 'J5.js'));
var J6 = require(path.join(__dirname, 'J6.js'));
var B1 = require(path.join(__dirname, 'B1.js'));
var B2 = require(path.join(__dirname, 'B2.js'));
var B3 = require(path.join(__dirname, 'B3.js'));
var B4 = require(path.join(__dirname, 'B4.js'));
var B5 = require(path.join(__dirname, 'B5.js'));
var B6 = require(path.join(__dirname, 'B6.js'));
var C1 = require(path.join(__dirname, 'C1.js'));
var C2 = require(path.join(__dirname, 'C2.js'));
var C3 = require(path.join(__dirname, 'C3.js'));
var C4 = require(path.join(__dirname, 'C4.js'));
var C5 = require(path.join(__dirname, 'C5.js'));
var C6 = require(path.join(__dirname, 'C6.js'));

var REGISTRY = [
  { id: 'PRE-2', tier: 'precondition', impl: PRE_2 },
  { id: 'PRE-4', tier: 'precondition', impl: PRE_4 },
  { id: 'U1', tier: 'universal', impl: U1 },
  { id: 'U2', tier: 'universal', impl: U2 },
  { id: 'U3', tier: 'universal', impl: U3 },
  { id: 'U5', tier: 'universal', impl: U5 },
  { id: 'U6', tier: 'universal', impl: U6 },
  { id: 'U7', tier: 'universal', impl: U7 },
  { id: 'U8', tier: 'universal', impl: U8 },
  { id: 'U9', tier: 'universal', impl: U9 },
  { id: 'U10', tier: 'universal', impl: U10 },
  { id: 'U11', tier: 'universal', impl: U11 },
  { id: 'U12', tier: 'universal', impl: U12 },
  { id: 'U13', tier: 'universal', impl: U13 },
  { id: 'U14', tier: 'universal', impl: U14 },
  { id: 'U15', tier: 'universal', impl: U15 },
  { id: 'U16', tier: 'universal', impl: U16 },
  { id: 'J1', tier: 'jj-family', impl: J1, familyOnly: 'jj' },
  { id: 'J2', tier: 'jj-family', impl: J2, familyOnly: 'jj' },
  { id: 'J3', tier: 'jj-family', impl: J3, familyOnly: 'jj' },
  { id: 'J4', tier: 'jj-family', impl: J4, familyOnly: 'jj' },
  { id: 'J5', tier: 'jj-family', impl: J5, familyOnly: 'jj' },
  { id: 'J6', tier: 'jj-family', impl: J6, familyOnly: 'jj' },
  { id: 'B1', tier: 'buggsy-family', impl: B1, familyOnly: 'buggsy' },
  { id: 'B2', tier: 'buggsy-family', impl: B2, familyOnly: 'buggsy' },
  { id: 'B3', tier: 'buggsy-family', impl: B3, familyOnly: 'buggsy' },
  { id: 'B4', tier: 'buggsy-family', impl: B4, familyOnly: 'buggsy' },
  { id: 'B5', tier: 'buggsy-family', impl: B5, familyOnly: 'buggsy' },
  { id: 'B6', tier: 'buggsy-family', impl: B6, familyOnly: 'buggsy' },
  { id: 'C1', tier: 'comic-studio', impl: C1 },
  { id: 'C2', tier: 'comic-studio', impl: C2 },
  { id: 'C3', tier: 'comic-studio', impl: C3 },
  { id: 'C4', tier: 'comic-studio', impl: C4 },
  { id: 'C5', tier: 'comic-studio', impl: C5 },
  { id: 'C6', tier: 'comic-studio', impl: C6 }
];

function selectForChild(child) {
  return REGISTRY.filter(function(entry) {
    if (!entry.familyOnly) return true;
    return entry.familyOnly === child;
  });
}

module.exports = { REGISTRY: REGISTRY, selectForChild: selectForChild };

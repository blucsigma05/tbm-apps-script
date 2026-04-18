/**
 * measurements/index.js — Code registry for the 12 PR-1 criteria.
 *
 * The registry IS the single dispatch authority (v8 plan: "code registry only;
 * rubric prose is description"). rubric.measurement_method prose documents
 * intent; the impl here is what actually runs.
 *
 * Each entry: { id, tier, impl }. impl is an async function (ctx) → checkResult
 * per the schema's checkResult definition.
 */

var path = require('path');

var PRE_2 = require(path.join(__dirname, 'PRE-2.js'));
var PRE_4 = require(path.join(__dirname, 'PRE-4.js'));
var U1 = require(path.join(__dirname, 'U1.js'));
var U2 = require(path.join(__dirname, 'U2.js'));
var U3 = require(path.join(__dirname, 'U3.js'));
var U7 = require(path.join(__dirname, 'U7.js'));
var U11 = require(path.join(__dirname, 'U11.js'));
var U12 = require(path.join(__dirname, 'U12.js'));
var U13 = require(path.join(__dirname, 'U13.js'));
var U14 = require(path.join(__dirname, 'U14.js'));
var J1 = require(path.join(__dirname, 'J1.js'));
var B1 = require(path.join(__dirname, 'B1.js'));

var REGISTRY = [
  { id: 'PRE-2', tier: 'precondition', impl: PRE_2 },
  { id: 'PRE-4', tier: 'precondition', impl: PRE_4 },
  { id: 'U1', tier: 'universal', impl: U1 },
  { id: 'U2', tier: 'universal', impl: U2 },
  { id: 'U3', tier: 'universal', impl: U3 },
  { id: 'U7', tier: 'universal', impl: U7 },
  { id: 'U11', tier: 'universal', impl: U11 },
  { id: 'U12', tier: 'universal', impl: U12 },
  { id: 'U13', tier: 'universal', impl: U13 },
  { id: 'U14', tier: 'universal', impl: U14 },
  { id: 'J1', tier: 'jj-family', impl: J1, familyOnly: 'jj' },
  { id: 'B1', tier: 'buggsy-family', impl: B1, familyOnly: 'buggsy' }
];

function selectForChild(child) {
  return REGISTRY.filter(function(entry) {
    if (!entry.familyOnly) return true;
    return entry.familyOnly === child;
  });
}

module.exports = { REGISTRY: REGISTRY, selectForChild: selectForChild };

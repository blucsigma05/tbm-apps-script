// ════════════════════════════════════════════════════════════════════
// CalendarSync.gs v5 — Google Calendar Seeding & Sync from TBM Data
// WRITES TO: (Google Calendar only — no sheet writes)
// READS FROM: 💻🧮 Helpers
// ════════════════════════════════════════════════════════════════════

function getCalendarSyncVersion() { return 5; }

// ────────────────────────────────────────────────────────────────────
// v1 (2026-03-10):
//   Initial build. Seeds Bills & Financial, Thompson Household, and
//   Kids Activities calendars from existing TBM sheet data.
//   All dates harvested from Sheets — zero manual entry.
//
// ENTRY POINTS:
//   seedBillsCalendar()       — bulk seed financial events
//   seedHouseholdCalendar()   — bulk seed household/subscription events
//   syncPromoCliffs()         — re-runnable promo expiration alerts
//   syncDebtMilestones()      — re-runnable debt-free target + quick wins
//   cs_addKidsEvent_(title, dateStr, timeStr, calName)  — Kids Hub bridge
//   syncAll()                 — runs everything in sequence
//
// IDEMPOTENCY:
//   Every created event is tracked via PropertiesService keyed by a
//   stable identifier. Re-runs update existing events, never duplicate.
//
// CALENDAR NAMES (must exist under LT personal Gmail):
//   "Bills & Financial"    (red)
//   "Thompson Household"   (blue)
//   "Kids Activities"      (green)
// ════════════════════════════════════════════════════════════════════


// ── CONFIG ──────────────────────────────────────────────────────────
const CS_CAL_NAMES = {
  bills:     'Bills & Financial',
  household: 'Thompson Household',
  kids:      'Kids Activities'
};

// Reminder defaults (minutes before event)
const CS_REMINDERS = {
  financial: [10080, 1440],   // 7 days, 1 day
  promo:     [43200, 10080, 1440], // 30 days, 7 days, 1 day
  milestone: [10080, 1440],   // 7 days, 1 day
  household: [1440],          // 1 day
};

// PropertiesService key prefix
const CS_PREFIX = 'calsync_';


// ── HELPERS ─────────────────────────────────────────────────────────

function cs_getCalendar_(key) {
  const name = CS_CAL_NAMES[key];
  const cals = CalendarApp.getCalendarsByName(name);
  if (!cals || cals.length === 0) {
    throw new Error('Calendar not found: "' + name + '". Create it first in Google Calendar.');
  }
  return cals[0];
}

function cs_props_() {
  return PropertiesService.getScriptProperties();
}

/**
 * Creates or updates a calendar event idempotently.
 * Returns the event ID.
 */
function cs_upsertEvent_(cal, stableKey, title, startDate, endDate, options) {
  const props = cs_props_();
  const propKey = CS_PREFIX + stableKey;
  const existingId = props.getProperty(propKey);
  options = options || {};

  // Try to find existing event
  if (existingId) {
    try {
      const existing = cal.getEventById(existingId);
      if (existing) {
        // Update in place
        existing.setTitle(title);
        if (options.description) existing.setDescription(options.description);
        if (startDate && endDate) {
          existing.setTime(startDate, endDate);
        }
        Logger.log('Updated: ' + title + ' [' + stableKey + ']');
        return existingId;
      }
    } catch(e) {
      // Event was deleted externally — recreate
      Logger.log('Event missing, recreating: ' + stableKey);
    }
  }

  // Create new event
  var event;
  if (options.allDay) {
    event = cal.createAllDayEvent(title, startDate);
  } else {
    event = cal.createEvent(title, startDate, endDate || new Date(startDate.getTime() + 3600000));
  }

  if (options.description) event.setDescription(options.description);
  if (options.color) event.setColor(options.color);

  // Set reminders
  if (options.reminders && options.reminders.length > 0) {
    event.removeAllReminders();
    options.reminders.forEach(function(mins) {
      event.addEmailReminder(mins);
    });
  }

  var eventId = event.getId();
  props.setProperty(propKey, eventId);
  Logger.log('Created: ' + title + ' [' + stableKey + ']');
  return eventId;
}

/**
 * Creates or updates a recurring event series idempotently.
 */
function cs_upsertSeries_(cal, stableKey, title, startDate, recurrence, options) {
  const props = cs_props_();
  const propKey = CS_PREFIX + stableKey;
  const existingId = props.getProperty(propKey);
  options = options || {};

  // Delete existing series if found (can't easily update series)
  if (existingId) {
    try {
      const existing = cal.getEventSeriesById(existingId);
      if (existing) existing.deleteEventSeries();
    } catch(e) { /* already gone */ }
  }

  // Create new series
  var endDate = new Date(startDate.getTime() + 3600000); // 1 hour default
  if (options.allDay) {
    var series = cal.createAllDayEventSeries(title, startDate, recurrence);
  } else {
    var series = cal.createEventSeries(title, startDate, endDate, recurrence);
  }

  if (options.description) series.setDescription(options.description);

  var seriesId = series.getId();
  props.setProperty(propKey, seriesId);
  Logger.log('Created series: ' + title + ' [' + stableKey + ']');
  return seriesId;
}

function cs_getSheet_(name) {
  // v3: openById migration — trigger-safe
  const ss = SpreadsheetApp.openById('1_jn-I4IfsqgnVOFiS38SVVzNJ0MAJtu2645iU5k0U9c');
  const resolved = typeof TAB_MAP !== 'undefined' ? (TAB_MAP[name] || name) : name;
  return ss.getSheetByName(resolved);
}

function cs_getSheetData_(name) {
  const sheet = cs_getSheet_(name);
  if (!sheet) return { headers: [], data: [] };
  const all = sheet.getDataRange().getValues();
  if (all.length < 2) return { headers: all[0] ? all[0].map(String) : [], data: [] };
  return { headers: all[0].map(String), data: all.slice(1) };
}

function cs_col_(headers, name) {
  return headers.indexOf(name);
}

function cs_today_() {
  return new Date();
}

function cs_dateFromISO_(str) {
  if (!str) return null;
  var d = new Date(String(str).trim());
  return isNaN(d.getTime()) ? null : d;
}

function cs_formatMoney_(n) {
  return '$' + Math.round(Math.abs(n)).toLocaleString('en-US');
}

function cs_monthName_(d) {
  return ['January','February','March','April','May','June',
    'July','August','September','October','November','December'][d.getMonth()];
}


// ════════════════════════════════════════════════════════════════════
// SEED: BILLS & FINANCIAL CALENDAR
// ════════════════════════════════════════════════════════════════════

/**
 * seedBillsCalendar() — One-time bulk seed of all financial events.
 * Safe to re-run (idempotent via PropertiesService).
 */
function seedBillsCalendar() {
  Logger.log('═══ seedBillsCalendar() START ═══');

  seedPayDays_();
  syncPromoCliffs();
  syncDebtMilestones();
  seedMERReminders_();
  seedAugustBonus_();

  Logger.log('═══ seedBillsCalendar() COMPLETE ═══');
}


/**
 * seedPayDays_() — Creates biweekly recurring payday events.
 * Derives next pay date from most recent income transaction.
 */
function seedPayDays_() {
  const cal = cs_getCalendar_('bills');
  const txData = cs_getSheetData_('Transactions');
  if (!txData.headers.length) { Logger.log('Transactions sheet not found — skipping paydays'); return; }

  const h = txData.headers;
  const dateCol = cs_col_(h, 'Date');
  const catCol = cs_col_(h, 'Category');
  const descCol = cs_col_(h, 'Description');
  const amtCol = cs_col_(h, 'Amount');

  // Find most recent LT and JT income transactions
  var ltLastPay = null, jtLastPay = null;

  // Sort by date descending to find most recent
  var rows = txData.data.slice().sort(function(a, b) {
    return new Date(b[dateCol]) - new Date(a[dateCol]);
  });

  for (var i = 0; i < rows.length; i++) {
    var cat = String(rows[i][catCol] || '').toLowerCase();
    var desc = String(rows[i][descCol] || '').toLowerCase();
    var d = new Date(rows[i][dateCol]);
    if (isNaN(d.getTime())) continue;

    // LT income: look for paycheck patterns
    if (!ltLastPay && (cat.indexOf('lt income') >= 0 || cat.indexOf('lt_income') >= 0 ||
        desc.indexOf('payroll') >= 0 || desc.indexOf('direct dep') >= 0)) {
      if (desc.indexOf('jt') < 0 && desc.indexOf('jessica') < 0) {
        ltLastPay = d;
      }
    }

    // JT income
    if (!jtLastPay && (cat.indexOf('jt income') >= 0 || cat.indexOf('jt_income') >= 0)) {
      jtLastPay = d;
    }

    if (ltLastPay && jtLastPay) break;
  }

  // Calculate next pay dates (biweekly = 14 days from last)
  var now = cs_today_();

  if (ltLastPay) {
    var ltNext = new Date(ltLastPay);
    while (ltNext <= now) ltNext.setDate(ltNext.getDate() + 14);

    cs_upsertSeries_(cal, 'payday_lt', '💰 LT Payday', ltNext,
      CalendarApp.newRecurrence().addRule(
        CalendarApp.newRecurrence().newRecurrenceRule()
          .frequency(CalendarApp.Frequency.WEEKLY).interval(2)
      ),
      { allDay: true, description: 'LT biweekly paycheck. Derived from last deposit: ' + ltLastPay.toLocaleDateString() }
    );
  } else {
    Logger.log('Could not find LT income transactions — skipping LT payday');
  }

  if (jtLastPay) {
    var jtNext = new Date(jtLastPay);
    while (jtNext <= now) jtNext.setDate(jtNext.getDate() + 14);

    cs_upsertSeries_(cal, 'payday_jt', '💰 JT Payday', jtNext,
      CalendarApp.newRecurrence().addRule(
        CalendarApp.newRecurrence().newRecurrenceRule()
          .frequency(CalendarApp.Frequency.WEEKLY).interval(2)
      ),
      { allDay: true, description: 'JT biweekly paycheck. Derived from last deposit: ' + jtLastPay.toLocaleDateString() }
    );
  } else {
    Logger.log('Could not find JT income transactions — skipping JT payday');
  }
}


/**
 * syncPromoCliffs() — Reads DebtModel promo end dates.
 * Creates alert events with 30/7/1 day reminders.
 * Re-runnable: updates existing events.
 */
function syncPromoCliffs() {
  const cal = cs_getCalendar_('bills');
  const dm = cs_getSheetData_('DebtModel');
  if (!dm.headers.length) { Logger.log('DebtModel not found — skipping promo cliffs'); return; }

  const h = dm.headers;
  // Find columns — DebtModel columns vary, try common names
  const nameCol = Math.max(
    cs_col_(h, 'Account'),
    cs_col_(h, 'Name'),
    cs_col_(h, 'Account Name')
  );
  const promoEndCol = Math.max(
    cs_col_(h, 'Promo End Date'),
    cs_col_(h, 'PromoEnd'),
    cs_col_(h, 'Promo End')
  );
  const aprCol = Math.max(
    cs_col_(h, 'APR'),
    cs_col_(h, 'Rate'),
    cs_col_(h, 'Interest Rate')
  );
  const promoAprCol = Math.max(
    cs_col_(h, 'Promo APR'),
    cs_col_(h, 'PromoAPR'),
    cs_col_(h, 'Promo Rate')
  );
  const balCol = Math.max(
    cs_col_(h, 'Balance'),
    cs_col_(h, 'Current Balance')
  );
  const minCol = Math.max(
    cs_col_(h, 'Minimum'),
    cs_col_(h, 'Min Payment'),
    cs_col_(h, 'Min')
  );

  if (nameCol < 0) { Logger.log('DebtModel: Account column not found'); return; }

  var now = cs_today_();
  var promoCount = 0;

  for (var i = 0; i < dm.data.length; i++) {
    var row = dm.data[i];
    var name = String(row[nameCol] || '').trim();
    if (!name) continue;

    // Get promo end date
    var promoEnd = null;
    if (promoEndCol >= 0) {
      promoEnd = cs_dateFromISO_(row[promoEndCol]);
    }
    if (!promoEnd) continue;

    // Only future or recent promos (within 30 days past)
    var daysUntil = Math.round((promoEnd - now) / 86400000);
    if (daysUntil < -30) continue;

    var postAPR = aprCol >= 0 ? (Number(row[aprCol]) || 0) : 0;
    var promoAPR = promoAprCol >= 0 ? (Number(row[promoAprCol]) || 0) : 0;
    var balance = balCol >= 0 ? (Number(row[balCol]) || 0) : 0;
    var minimum = minCol >= 0 ? (Number(row[minCol]) || 0) : 0;

    // Format APR for display (handle both decimal and percentage)
    var postAPRDisplay = postAPR > 1 ? postAPR.toFixed(2) + '%' : (postAPR * 100).toFixed(2) + '%';
    var promoAPRDisplay = promoAPR > 1 ? promoAPR.toFixed(2) + '%' : (promoAPR * 100).toFixed(2) + '%';

    var title = '⚠️ ' + name + ' promo expires → ' + postAPRDisplay;
    var desc = 'PROMO CLIFF ALERT\n\n' +
      'Account: ' + name + '\n' +
      'Balance: ' + cs_formatMoney_(balance) + '\n' +
      'Current promo rate: ' + promoAPRDisplay + '\n' +
      'Post-promo rate: ' + postAPRDisplay + '\n' +
      'Minimum payment: ' + cs_formatMoney_(minimum) + '/mo\n\n' +
      'ACTION NEEDED: Review balance transfer options, paydown strategy, or negotiate with lender before this date.';

    var stableKey = 'promo_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_');

    cs_upsertEvent_(cal, stableKey, title, promoEnd, null, {
      allDay: true,
      description: desc,
      reminders: CS_REMINDERS.promo
    });

    promoCount++;
  }

  Logger.log('syncPromoCliffs: ' + promoCount + ' promo events synced');
}


/**
 * syncDebtMilestones() — Creates/updates milestone events:
 *   - Debt-free target date
 *   - Quick win targets (balances < $1,000)
 *   - Cash flow positive date
 */
function syncDebtMilestones() {
  const cal = cs_getCalendar_('bills');

  // ── 1. Debt-free target from Debt_Export ──────────────────────
  var deSheet = cs_getSheet_('Debt_Export');
  if (deSheet) {
    var deData = deSheet.getDataRange().getValues();
    // Debt_Export is typically key-value pairs or a metadata sheet
    // Look for debtFreeTarget in various formats
    var debtFreeDate = null;
    for (var i = 0; i < deData.length; i++) {
      var key = String(deData[i][0] || '').toLowerCase();
      if (key.indexOf('debtfree') >= 0 || key.indexOf('debt_free') >= 0 || key.indexOf('debt free') >= 0) {
        debtFreeDate = cs_dateFromISO_(deData[i][1]);
        break;
      }
    }

    if (debtFreeDate) {
      cs_upsertEvent_(cal, 'milestone_debtfree', '🎯 DEBT-FREE TARGET DATE', debtFreeDate, null, {
        allDay: true,
        description: 'Projected date when all non-mortgage debt reaches $0.\nSource: CascadeEngine → Debt_Export.debtFreeTarget\n\nKeep pushing. Every extra dollar accelerates this date.',
        reminders: CS_REMINDERS.milestone
      });
    } else {
      Logger.log('Debt-free target date not found in Debt_Export');
    }

    // ── August Bonus (also in Debt_Export) ────────────────────
    var bonusAmt = 0;
    for (var i = 0; i < deData.length; i++) {
      var key = String(deData[i][0] || '').toLowerCase();
      if (key.indexOf('augustbonus') >= 0 || key.indexOf('august_bonus') >= 0 || key.indexOf('bonus') >= 0) {
        bonusAmt = Number(deData[i][1]) || 0;
        break;
      }
    }
    // Store for seedAugustBonus_
    if (bonusAmt > 0) {
      PropertiesService.getScriptProperties().setProperty(CS_PREFIX + '_bonusAmt', String(bonusAmt));
    }

    // ── Cash flow positive date ──────────────────────────────
    var cfpDate = null;
    for (var i = 0; i < deData.length; i++) {
      var key = String(deData[i][0] || '').toLowerCase();
      if (key.indexOf('cashflowpositive') >= 0 || key.indexOf('cash_flow_positive') >= 0) {
        cfpDate = cs_dateFromISO_(deData[i][1]);
        break;
      }
    }
    if (cfpDate) {
      cs_upsertEvent_(cal, 'milestone_cfpositive', '📈 Cash Flow Positive Target', cfpDate, null, {
        allDay: true,
        description: 'Projected date when monthly cash flow turns permanently positive after debt obligations.\nSource: CashFlowForecast via Debt_Export',
        reminders: CS_REMINDERS.milestone
      });
    }
  }

  // ── 2. Quick wins — DebtModel accounts with balance < $1,000 ─
  var dm = cs_getSheetData_('DebtModel');
  if (dm.headers.length) {
    var h = dm.headers;
    var nameCol = Math.max(cs_col_(h, 'Account'), cs_col_(h, 'Name'), cs_col_(h, 'Account Name'));
    var balCol = Math.max(cs_col_(h, 'Balance'), cs_col_(h, 'Current Balance'));
    var minCol = Math.max(cs_col_(h, 'Minimum'), cs_col_(h, 'Min Payment'), cs_col_(h, 'Min'));

    if (nameCol >= 0 && balCol >= 0) {
      var now = cs_today_();
      var quickWins = [];

      for (var i = 0; i < dm.data.length; i++) {
        var row = dm.data[i];
        var name = String(row[nameCol] || '').trim();
        var bal = Number(row[balCol]) || 0;
        var min = minCol >= 0 ? (Number(row[minCol]) || 0) : 0;
        if (!name || bal <= 0 || bal >= 1000) continue;
        quickWins.push({ name: name, balance: bal, min: min });
      }

      // Sort by balance ascending (smallest first)
      quickWins.sort(function(a, b) { return a.balance - b.balance; });

      // Create motivational events for top 3 quick wins — set 1 week from now
      for (var j = 0; j < Math.min(3, quickWins.length); j++) {
        var qw = quickWins[j];
        var targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() + 7 + (j * 7)); // stagger by week

        var stableKey = 'quickwin_' + qw.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        cs_upsertEvent_(cal, stableKey,
          '🎯 Kill ' + qw.name + ' — ' + cs_formatMoney_(qw.balance) + ' left',
          targetDate, null, {
            allDay: true,
            description: 'QUICK WIN TARGET\n\n' +
              'Account: ' + qw.name + '\n' +
              'Remaining: ' + cs_formatMoney_(qw.balance) + '\n' +
              'Minimum: ' + cs_formatMoney_(qw.min) + '/mo\n\n' +
              'This debt is close to zero. One focused push eliminates it and frees ' + cs_formatMoney_(qw.min) + '/mo for the next target.',
            reminders: [1440] // 1 day reminder
          }
        );
      }
    }
  }

  Logger.log('syncDebtMilestones complete');
}


/**
 * seedMERReminders_() — Monthly recurring MER close window events.
 * 1st of each month.
 */
function seedMERReminders_() {
  const cal = cs_getCalendar_('bills');
  var now = cs_today_();

  // Start from next month's 1st
  var merStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  cs_upsertSeries_(cal, 'mer_monthly', '📋 MER Close Window — Monthly Review',
    merStart,
    CalendarApp.newRecurrence().addRule(
      CalendarApp.newRecurrence().newRecurrenceRule()
        .frequency(CalendarApp.Frequency.MONTHLY)
        .onlyOnMonthDay(1)
    ),
    {
      allDay: true,
      description: 'Month-End Review (MER) close window opens.\n\n' +
        '11 gates to clear:\n' +
        '1. Tiller sync verified\n' +
        '2. AutoCat rules current\n' +
        '3. Balance History reconciled\n' +
        '4. DebtModel minimums verified\n' +
        '5. Budget_Data totals match\n' +
        '6. CC_MAP descriptions aligned\n' +
        '7. Close History row written\n' +
        '8. DataEngine getData() verified\n' +
        '9. ThePulse renders clean\n' +
        '10. TheVein renders clean\n' +
        '11. Archive to Close History'
    }
  );
}


/**
 * seedAugustBonus_() — Annual August bonus event.
 * Reads bonus amount from Debt_Export (cached by syncDebtMilestones).
 */
function seedAugustBonus_() {
  const cal = cs_getCalendar_('bills');
  var bonusAmt = Number(cs_props_().getProperty(CS_PREFIX + '_bonusAmt')) || 19686;
  var now = cs_today_();

  // Next August 1
  var augYear = now.getMonth() >= 7 ? now.getFullYear() + 1 : now.getFullYear();
  var augDate = new Date(augYear, 7, 1); // August = month 7

  cs_upsertEvent_(cal, 'bonus_august', '💰 August Bonus — ' + cs_formatMoney_(bonusAmt) + ' deploy to debt',
    augDate, null, {
      allDay: true,
      description: 'Annual bonus: ' + cs_formatMoney_(bonusAmt) + '\n\n' +
        'Execute debt deployment plan:\n' +
        '1. Run CascadeEngine with bonus amount\n' +
        '2. Review optimal payoff target (avalanche vs quick win)\n' +
        '3. Execute payments\n' +
        '4. Update DebtModel balances\n' +
        '5. Run syncDebtMilestones() to refresh calendar',
      reminders: [43200, 10080] // 30 days, 7 days
    }
  );
}


// ════════════════════════════════════════════════════════════════════
// SEED: THOMPSON HOUSEHOLD CALENDAR
// ════════════════════════════════════════════════════════════════════

/**
 * seedHouseholdCalendar() — Seeds subscription renewals and
 * CashFlowForecast milestone events.
 */
function seedHouseholdCalendar() {
  Logger.log('═══ seedHouseholdCalendar() START ═══');

  seedSubscriptionRenewals_();
  seedCFFMilestones_();

  Logger.log('═══ seedHouseholdCalendar() COMPLETE ═══');
}


/**
 * seedSubscriptionRenewals_() — Detects recurring subscriptions
 * from transaction patterns and creates monthly calendar events.
 */
function seedSubscriptionRenewals_() {
  const cal = cs_getCalendar_('household');
  const txData = cs_getSheetData_('Transactions');
  if (!txData.headers.length) { Logger.log('Transactions not found — skipping subscriptions'); return; }

  const h = txData.headers;
  const dateCol = cs_col_(h, 'Date');
  const descCol = cs_col_(h, 'Description');
  const amtCol = cs_col_(h, 'Amount');
  const catCol = cs_col_(h, 'Category');

  // Known subscription patterns (description substring → display name)
  const SUBS = {
    'netflix':       { name: 'Netflix',        icon: '📺' },
    'spotify':       { name: 'Spotify',        icon: '🎵' },
    'hulu':          { name: 'Hulu',           icon: '📺' },
    'disney+':       { name: 'Disney+',        icon: '📺' },
    'disney plus':   { name: 'Disney+',        icon: '📺' },
    'amazon prime':  { name: 'Amazon Prime',   icon: '📦' },
    'youtube':       { name: 'YouTube Premium',icon: '📺' },
    'apple':         { name: 'Apple',          icon: '🍎' },
    'xbox':          { name: 'Xbox',           icon: '🎮' },
    'playstation':   { name: 'PlayStation',    icon: '🎮' },
    'paramount':     { name: 'Paramount+',     icon: '📺' },
    'peacock':       { name: 'Peacock',        icon: '📺' },
    'max':           { name: 'Max (HBO)',      icon: '📺' },
    'adt':           { name: 'ADT Security',   icon: '🔒' },
    'google storage':{ name: 'Google Storage', icon: '☁️' },
    'google one':    { name: 'Google One',     icon: '☁️' },
    'icloud':        { name: 'iCloud',         icon: '☁️' },
    'chatgpt':       { name: 'ChatGPT',        icon: '🤖' },
    'claude':        { name: 'Claude AI',      icon: '🤖' },
    'notion':        { name: 'Notion',         icon: '📝' },
  };

  // Scan last 60 days of transactions for subscription matches
  var now = cs_today_();
  var cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 60);

  var found = {}; // key → { name, icon, amount, lastDate }

  for (var i = 0; i < txData.data.length; i++) {
    var row = txData.data[i];
    var d = new Date(row[dateCol]);
    if (isNaN(d.getTime()) || d < cutoff) continue;

    var desc = String(row[descCol] || '').toLowerCase();
    var amt = Math.abs(Number(row[amtCol]) || 0);
    if (amt < 1 || amt > 200) continue; // subscription range filter

    for (var pattern in SUBS) {
      if (desc.indexOf(pattern) >= 0) {
        var sub = SUBS[pattern];
        var key = pattern.replace(/[^a-z0-9]/g, '_');
        if (!found[key] || d > found[key].lastDate) {
          found[key] = { name: sub.name, icon: sub.icon, amount: amt, lastDate: d, day: d.getDate() };
        }
        break;
      }
    }
  }

  // Create monthly recurring events for each detected subscription
  var subCount = 0;
  for (var key in found) {
    var sub = found[key];
    // Next occurrence: same day of month, next month if already passed
    var nextDate = new Date(now.getFullYear(), now.getMonth(), sub.day);
    if (nextDate <= now) nextDate.setMonth(nextDate.getMonth() + 1);

    cs_upsertSeries_(cal, 'sub_' + key,
      sub.icon + ' ' + sub.name + ' renews ' + cs_formatMoney_(sub.amount),
      nextDate,
      CalendarApp.newRecurrence().addRule(
        CalendarApp.newRecurrence().newRecurrenceRule()
          .frequency(CalendarApp.Frequency.MONTHLY)
          .onlyOnMonthDay(sub.day)
      ),
      {
        allDay: true,
        description: 'Subscription renewal: ' + sub.name + '\nAmount: ' + cs_formatMoney_(sub.amount) + '/mo\n' +
          'Detected from transaction history (last charge: ' + sub.lastDate.toLocaleDateString() + ')'
      }
    );
    subCount++;
  }

  Logger.log('seedSubscriptionRenewals: ' + subCount + ' subscriptions detected and synced');
}


/**
 * seedCFFMilestones_() — Reads CashFlowForecast for life events
 * (SoFi payoff, childcare drop-off, etc.) and creates calendar events.
 */
function seedCFFMilestones_() {
  const cal = cs_getCalendar_('household');
  const cff = cs_getSheetData_('CashFlowForecast');
  if (!cff.headers.length) { Logger.log('CashFlowForecast not found — skipping CFF milestones'); return; }

  const h = cff.headers;
  const eventCol = Math.max(cs_col_(h, 'Event'), cs_col_(h, 'Description'), cs_col_(h, 'Milestone'));
  const dateCol = Math.max(cs_col_(h, 'Date'), cs_col_(h, 'Target Date'));
  const impactCol = Math.max(cs_col_(h, 'Impact'), cs_col_(h, 'Monthly Impact'), cs_col_(h, 'Amount'));

  if (eventCol < 0 || dateCol < 0) { Logger.log('CFF: required columns not found'); return; }

  var now = cs_today_();
  var count = 0;

  for (var i = 0; i < cff.data.length; i++) {
    var row = cff.data[i];
    var eventName = String(row[eventCol] || '').trim();
    if (!eventName) continue;

    var eventDate = cs_dateFromISO_(row[dateCol]);
    if (!eventDate || eventDate < now) continue;

    var impact = impactCol >= 0 ? (Number(row[impactCol]) || 0) : 0;
    var impactStr = impact ? ' — frees ' + cs_formatMoney_(impact) + '/mo' : '';

    var stableKey = 'cff_' + eventName.toLowerCase().replace(/[^a-z0-9]/g, '_');

    cs_upsertEvent_(cal, stableKey,
      '📈 ' + eventName + impactStr,
      eventDate, null, {
        allDay: true,
        description: 'CashFlowForecast milestone\n\n' +
          'Event: ' + eventName + '\n' +
          (impact ? 'Monthly budget impact: ' + cs_formatMoney_(impact) + ' freed\n' : '') +
          '\nSource: CashFlowForecast sheet',
        reminders: CS_REMINDERS.milestone
      }
    );
    count++;
  }

  Logger.log('seedCFFMilestones: ' + count + ' CFF events synced');
}


// ════════════════════════════════════════════════════════════════════
// KIDS HUB → CALENDAR BRIDGE
// ════════════════════════════════════════════════════════════════════

/**
 * cs_addKidsEvent_(title, dateStr, timeStr, calName) — Creates a single
 * event on the Kids Activities calendar (or specified calendar).
 * Called by Kids Hub Events tab form submission.
 *
 * @param {string} title     - Event title
 * @param {string} dateStr   - ISO date string (YYYY-MM-DD)
 * @param {string} timeStr   - Optional time (HH:mm) or empty for all-day
 * @param {string} calName   - Optional calendar key ('kids', 'household', 'bills')
 * @param {string} recurrence - Optional: 'none', 'weekly', 'monthly'
 * @param {string} childName  - Optional: 'Buggsy', 'JJ', 'Both'
 * @returns {string} JSON with event ID or error
 */
function cs_addKidsEvent_(title, dateStr, timeStr, calName, recurrence, childName) {
  try {
    var calKey = calName || 'kids';
    var cal = cs_getCalendar_(calKey);

    var childTag = childName ? ' (' + childName + ')' : '';
    var fullTitle = title + childTag;

    var startDate;
    if (timeStr && timeStr.trim()) {
      startDate = new Date(dateStr + 'T' + timeStr + ':00');
    } else {
      startDate = new Date(dateStr + 'T12:00:00');
    }

    if (isNaN(startDate.getTime())) {
      return JSON.stringify({ error: 'Invalid date: ' + dateStr });
    }

    var stableKey = 'kids_' + title.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + dateStr;

    if (recurrence && recurrence !== 'none') {
      var rule;
      if (recurrence === 'weekly') {
        rule = CalendarApp.newRecurrence().addRule(
          CalendarApp.newRecurrence().newRecurrenceRule()
            .frequency(CalendarApp.Frequency.WEEKLY)
        );
      } else if (recurrence === 'monthly') {
        rule = CalendarApp.newRecurrence().addRule(
          CalendarApp.newRecurrence().newRecurrenceRule()
            .frequency(CalendarApp.Frequency.MONTHLY)
        );
      }

      if (rule) {
        var isAllDay = !timeStr || !timeStr.trim();
        cs_upsertSeries_(cal, stableKey, fullTitle, startDate, rule, {
          allDay: isAllDay,
          description: 'Added from Kids Hub Events tab' + (childName ? '\nChild: ' + childName : '')
        });
        return JSON.stringify({ status: 'ok', key: stableKey, recurring: recurrence });
      }
    }

    // Single event
    var isAllDay = !timeStr || !timeStr.trim();
    cs_upsertEvent_(cal, stableKey, fullTitle, startDate, null, {
      allDay: isAllDay,
      description: 'Added from Kids Hub Events tab' + (childName ? '\nChild: ' + childName : ''),
      reminders: [1440] // 1 day
    });

    return JSON.stringify({ status: 'ok', key: stableKey });

  } catch(e) {
    Logger.log('addKidsEvent error: ' + e.message);
    return JSON.stringify({ error: e.message });
  }
}

/**
 * addKidsEventSafe — Wrapper for google.script.run (same pattern as KidsHub.gs)
 */
function addKidsEventSafe(title, dateStr, timeStr, calName, recurrence, childName) {
  return withMonitor_('addKidsEventSafe', function() {
    return JSON.parse(JSON.stringify(cs_addKidsEvent_(title, dateStr, timeStr, calName, recurrence, childName)));
  });
}


// ════════════════════════════════════════════════════════════════════
// CONVENIENCE: SYNC ALL
// ════════════════════════════════════════════════════════════════════

/**
 * syncAll() — Runs all seed and sync functions in sequence.
 * Safe to run anytime (all functions are idempotent).
 */
function syncAll() {
  Logger.log('═══ CalendarSync syncAll() START ═══');
  try { seedBillsCalendar(); } catch(e) { Logger.log('syncAll: seedBillsCalendar error: ' + e.message); }
  try { seedHouseholdCalendar(); } catch(e) { Logger.log('syncAll: seedHouseholdCalendar error: ' + e.message); }
  Logger.log('═══ CalendarSync syncAll() COMPLETE ═══');
}


// ════════════════════════════════════════════════════════════════════
// DIAGNOSTICS
// ════════════════════════════════════════════════════════════════════

/**
 * csHealthCheck() — Diagnostic function. Verifies calendars exist,
 * counts tracked events, reports status.
 */
function csHealthCheck() {
  var results = {
    version: 'CalendarSync.gs v3',
    timestamp: new Date().toISOString(),
    calendars: {},
    trackedEvents: 0,
    issues: []
  };

  // Check each calendar
  ['bills', 'household', 'kids'].forEach(function(key) {
    var name = CS_CAL_NAMES[key];
    var cals = CalendarApp.getCalendarsByName(name);
    results.calendars[key] = {
      name: name,
      found: cals && cals.length > 0,
      count: cals ? cals.length : 0
    };
    if (!cals || cals.length === 0) {
      results.issues.push('MISSING: "' + name + '" calendar not found');
    }
  });

  // Count tracked events in PropertiesService
  var props = cs_props_().getProperties();
  var tracked = 0;
  for (var key in props) {
    if (key.indexOf(CS_PREFIX) === 0 && key.indexOf('_bonusAmt') < 0) tracked++;
  }
  results.trackedEvents = tracked;

  // Check required sheets
  ['DebtModel', 'Transactions', 'Debt_Export', 'CashFlowForecast'].forEach(function(name) {
    var sheet = cs_getSheet_(name);
    if (!sheet) results.issues.push('SHEET NOT FOUND: ' + name);
  });

  results.status = results.issues.length === 0 ? 'ok' : 'warning';

  Logger.log(JSON.stringify(results, null, 2));
  return results;
}


/**
 * csResetAll() — Clears all tracked event IDs from PropertiesService.
 * Does NOT delete the calendar events themselves.
 * Run this if you want a fresh seed.
 */
function csResetAll() {
  var props = cs_props_();
  var all = props.getProperties();
  var deleted = 0;
  for (var key in all) {
    if (key.indexOf(CS_PREFIX) === 0) {
      props.deleteProperty(key);
      deleted++;
    }
  }
  Logger.log('csResetAll: cleared ' + deleted + ' tracked event IDs');
  return deleted;
}

// ════════════════════════════════════════════════════════════════════
// v5: Calendar Diagnostic + NISD School Calendar Bulk Import
// ════════════════════════════════════════════════════════════════════

function diagCalendar() {
  var cals = CalendarApp.getAllCalendars();
  for (var i = 0; i < cals.length; i++) {
    Logger.log('Calendar [' + i + ']: "' + cals[i].getName() + '" (ID: ' + cals[i].getId() + ')');
  }
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  var targetNames = ['Thompson Household', 'Kids Activities', 'Bills and Financial'];
  for (var t = 0; t < targetNames.length; t++) {
    try {
      var cal = CalendarApp.getCalendarsByName(targetNames[t]);
      Logger.log('Looking for "' + targetNames[t] + '": found ' + cal.length + ' calendar(s)');
      for (var c = 0; c < cal.length; c++) {
        var events = cal[c].getEvents(today, tomorrow);
        Logger.log('  "' + cal[c].getName() + '" has ' + events.length + ' events today');
        for (var e = 0; e < Math.min(events.length, 5); e++) {
          Logger.log('    Event: "' + events[e].getTitle() + '" at ' + events[e].getStartTime());
        }
      }
    } catch (err) {
      Logger.log('  ERROR for "' + targetNames[t] + '": ' + err.message);
    }
  }
}

function loadNanceSchoolCalendar() {
  var calName = 'Kids Activities';
  var cals = CalendarApp.getCalendarsByName(calName);
  if (!cals.length) {
    Logger.log('ERROR: Calendar "' + calName + '" not found. Available:');
    var all = CalendarApp.getAllCalendars();
    for (var a = 0; a < all.length; a++) { Logger.log('  ' + all[a].getName()); }
    return;
  }
  var cal = cals[0];

  var events = [
    // 2025-2026 SCHOOL YEAR (Remainder)
    { date: '2026-04-03', title: 'No School — Student Holiday / Teacher Flex', allDay: true },
    { date: '2026-04-08', title: 'STAAR Testing', allDay: true },
    { date: '2026-05-22', title: 'Early Release (11:45 AM)', allDay: true },
    { date: '2026-05-22', title: 'Last Day of School / End of 4th Quarter', allDay: true },
    // 2026-2027 SCHOOL YEAR (Full)
    { date: '2026-08-12', title: 'First Day of School', allDay: true },
    { date: '2026-09-07', title: 'No School — Labor Day Holiday', allDay: true },
    { date: '2026-10-08', title: 'End of 1st Quarter', allDay: true },
    { date: '2026-10-09', title: 'No School — Student Holiday / Teacher Flex', allDay: true },
    { date: '2026-10-12', title: 'No School — Student Holiday / Teacher Planning', allDay: true },
    { date: '2026-11-02', title: 'No School — Student & Staff Holiday', allDay: true },
    { date: '2026-11-03', title: 'No School — Student Holiday / Teacher Prof Learning', allDay: true },
    { date: '2026-11-23', title: 'No School — Student Holiday / Teacher Flex', allDay: true },
    { date: '2026-11-24', title: 'No School — Student Holiday / Teacher Flex', allDay: true },
    { date: '2026-11-25', title: 'No School — Thanksgiving Break', allDay: true },
    { date: '2026-11-26', title: 'No School — Thanksgiving Break', allDay: true },
    { date: '2026-11-27', title: 'No School — Thanksgiving Break', allDay: true },
    { date: '2026-12-01', title: 'STAAR Testing Window Opens', allDay: true },
    { date: '2026-12-11', title: 'STAAR Testing Window Closes', allDay: true },
    { date: '2026-12-18', title: 'Early Release (11:45 AM) / End of 2nd Quarter', allDay: true },
    { date: '2026-12-21', title: 'No School — Winter Break', allDay: true },
    { date: '2026-12-22', title: 'No School — Winter Break', allDay: true },
    { date: '2026-12-23', title: 'No School — Winter Break', allDay: true },
    { date: '2026-12-24', title: 'No School — Winter Break', allDay: true },
    { date: '2026-12-25', title: 'No School — Winter Break (Christmas)', allDay: true },
    { date: '2026-12-26', title: 'No School — Winter Break', allDay: true },
    { date: '2026-12-29', title: 'No School — Winter Break', allDay: true },
    { date: '2026-12-30', title: 'No School — Winter Break', allDay: true },
    { date: '2026-12-31', title: 'No School — Winter Break', allDay: true },
    { date: '2027-01-01', title: 'No School — New Year\'s Day', allDay: true },
    { date: '2027-01-04', title: 'No School — Student Holiday / Teacher Prof Learning', allDay: true },
    { date: '2027-01-05', title: 'No School — Student Holiday / Teacher Prof Learning', allDay: true },
    { date: '2027-01-18', title: 'No School — MLK Day Holiday', allDay: true },
    { date: '2027-02-12', title: 'No School — Student & Staff Holiday', allDay: true },
    { date: '2027-02-15', title: 'No School — Student Holiday / Teacher Planning', allDay: true },
    { date: '2027-03-05', title: 'No School — Student Holiday / Teacher Prof Learning', allDay: true },
    { date: '2027-03-12', title: 'End of 3rd Quarter', allDay: true },
    { date: '2027-03-15', title: 'No School — Spring Break', allDay: true },
    { date: '2027-03-16', title: 'No School — Spring Break', allDay: true },
    { date: '2027-03-17', title: 'No School — Spring Break', allDay: true },
    { date: '2027-03-18', title: 'No School — Spring Break', allDay: true },
    { date: '2027-03-19', title: 'No School — Spring Break', allDay: true },
    { date: '2027-03-22', title: 'No School — Student Holiday / Teacher Planning', allDay: true },
    { date: '2027-03-26', title: 'No School — Student & Staff Holiday', allDay: true },
    { date: '2027-04-06', title: 'STAAR Testing Window Opens', allDay: true },
    { date: '2027-04-23', title: 'No School — Student Holiday / Teacher Flex', allDay: true },
    { date: '2027-04-30', title: 'STAAR Testing Window Closes', allDay: true },
    { date: '2027-05-21', title: 'Early Release (11:45 AM) / Last Day of School / End of 4th Quarter', allDay: true },
    // 2027-2028 SCHOOL YEAR (Full)
    { date: '2027-08-18', title: 'First Day of School', allDay: true },
    { date: '2027-09-06', title: 'No School — Labor Day Holiday', allDay: true },
    { date: '2027-10-07', title: 'End of 1st Quarter', allDay: true },
    { date: '2027-10-08', title: 'No School — Student Holiday / Teacher Flex', allDay: true },
    { date: '2027-10-11', title: 'No School — Student Holiday / Teacher Planning', allDay: true },
    { date: '2027-11-01', title: 'No School — Student & Staff Holiday', allDay: true },
    { date: '2027-11-02', title: 'No School — Student Holiday / Teacher Prof Learning', allDay: true },
    { date: '2027-11-22', title: 'No School — Student Holiday / Teacher Flex', allDay: true },
    { date: '2027-11-23', title: 'No School — Student Holiday / Teacher Flex', allDay: true },
    { date: '2027-11-24', title: 'No School — Thanksgiving Break', allDay: true },
    { date: '2027-11-25', title: 'No School — Thanksgiving Break', allDay: true },
    { date: '2027-11-26', title: 'No School — Thanksgiving Break', allDay: true },
    { date: '2027-12-17', title: 'Early Release (11:45 AM) / End of 2nd Quarter', allDay: true },
    { date: '2027-12-20', title: 'No School — Winter Break', allDay: true },
    { date: '2027-12-21', title: 'No School — Winter Break', allDay: true },
    { date: '2027-12-22', title: 'No School — Winter Break', allDay: true },
    { date: '2027-12-23', title: 'No School — Winter Break', allDay: true },
    { date: '2027-12-24', title: 'No School — Winter Break (Christmas Eve)', allDay: true },
    { date: '2027-12-27', title: 'No School — Winter Break', allDay: true },
    { date: '2027-12-28', title: 'No School — Winter Break', allDay: true },
    { date: '2027-12-29', title: 'No School — Winter Break', allDay: true },
    { date: '2027-12-30', title: 'No School — Winter Break', allDay: true },
    { date: '2027-12-31', title: 'No School — Winter Break', allDay: true },
    { date: '2028-01-03', title: 'No School — Student Holiday / Teacher Prof Learning', allDay: true },
    { date: '2028-01-04', title: 'No School — Student Holiday / Teacher Prof Learning', allDay: true },
    { date: '2028-01-17', title: 'No School — MLK Day Holiday', allDay: true },
    { date: '2028-02-18', title: 'No School — Student Holiday / Teacher Planning', allDay: true },
    { date: '2028-02-21', title: 'No School — Presidents Day Holiday', allDay: true },
    { date: '2028-03-10', title: 'End of 3rd Quarter', allDay: true },
    { date: '2028-03-13', title: 'No School — Spring Break', allDay: true },
    { date: '2028-03-14', title: 'No School — Spring Break', allDay: true },
    { date: '2028-03-15', title: 'No School — Spring Break', allDay: true },
    { date: '2028-03-16', title: 'No School — Spring Break', allDay: true },
    { date: '2028-03-17', title: 'No School — Spring Break', allDay: true },
    { date: '2028-03-20', title: 'No School — Student Holiday / Teacher Prof Learning', allDay: true },
    { date: '2028-03-21', title: 'No School — Student Holiday / Teacher Prof Learning', allDay: true },
    { date: '2028-04-14', title: 'No School — Student Holiday / Teacher Flex', allDay: true },
    { date: '2028-05-25', title: 'Early Release (11:45 AM) / Last Day of School / End of 4th Quarter', allDay: true }
  ];

  var added = 0, skipped = 0;
  for (var i = 0; i < events.length; i++) {
    var ev = events[i];
    var d = new Date(ev.date + 'T12:00:00');
    var existing = cal.getEventsForDay(d);
    var isDup = false;
    for (var e = 0; e < existing.length; e++) {
      if (existing[e].getTitle() === ev.title) { isDup = true; break; }
    }
    if (isDup) { skipped++; continue; }
    if (ev.allDay) {
      cal.createAllDayEvent(ev.title, d);
    } else {
      var start = new Date(ev.date + 'T' + (ev.startTime || '08:00') + ':00');
      var end = new Date(ev.date + 'T' + (ev.endTime || '09:00') + ':00');
      cal.createEvent(ev.title, start, end);
    }
    added++;
    Logger.log('Added: ' + ev.title + ' on ' + ev.date);
  }
  Logger.log('School calendar import: ' + added + ' added, ' + skipped + ' skipped (duplicates)');
}

// END OF FILE — CalendarSync.gs v5
// Version history tracked in Notion deploy page. Do not add version comments here.
// ════════════════════════════════════════════════════════════════════
// KidsHub.gs v30 — Kids Hub Server Backend (TBM Consolidated)
// WRITES TO: 🧹📅 KH_Chores, 🧹📅 KH_History, 🧹📅 KH_Rewards, 🧹📅 KH_Redemptions, 🧹📅 KH_Requests, 🧹📅 KH_ScreenTime, 🧹📅 KH_Grades, 💻 Curriculum
// READS FROM: 🧹📅 KH_* (all KH tabs), 💻🧮 Helpers
// ════════════════════════════════════════════════════════════════════

function getKidsHubVersion() { return 30; }

// ── TAB NAMES (logical → resolved via TAB_MAP in DataEngine) ─────
var KH_TABS = {
  CHORES:       'KH_Chores',
  HISTORY:      'KH_History',
  REWARDS:      'KH_Rewards',
  REDEMPTIONS:  'KH_Redemptions',
  STREAKS:      'KH_Streaks',
  DEDUCTIONS:   'KH_Deductions',
  ALLOWANCE:    'KH_Allowance',
  CHILDREN:     'KH_Children',
  REQUESTS:     'KH_Requests',
  SCREEN_TIME:  'KH_ScreenTime',
  GRADES:       'KH_Grades'
};

// ── FREQUENCY OPTIONS (single source of truth) ───────────────────
var KH_FREQ_OPTIONS = ['Daily', 'Weekdays', 'Weekends', '2x Week', 'Weekly', 'Mon/Wed', 'Tue/Thu'];
var KH_CATEGORY_OPTIONS = [
  'Morning', 'Kitchen', 'School', 'Household',
  'Bedroom', 'Bathroom', 'Outside', 'Clean Up', 'Good Habits', 'General'
];
var KH_ACTIVE_OPTIONS    = ['YES', 'NO'];
var KH_CHILD_OPTIONS     = ['Buggsy', 'JJ', 'BOTH'];
var KH_MULTIPLIER_OPTIONS = ['1', '1.5', '2'];
var KH_EVENT_TYPES       = ['completion', 'approval', 'bonus', 'reset', 'rejection', 'override'];
var KH_THEME_OPTIONS     = ['buggsy', 'jj'];
var KH_BOOLEAN_OPTIONS   = ['TRUE', 'FALSE'];
var KH_REQUEST_TYPES     = ['Money', 'Purchase', 'Activity', 'Other'];
var KH_REQUEST_STATUSES  = ['Pending', 'Approved', 'Denied'];

// v28: Grade Bonus System
var KH_GRADE_REWARDS = {
  'A': { rings: 50, cash: 5.00 },
  'B': { rings: 25, cash: 2.00 },
  'C': { rings: 0, cash: 0 },
  'D': { rings: 0, cash: 0 },
  'F': { rings: 0, cash: 0 }
};
var KH_SUBJECTS = ['Math', 'Reading', 'Science', 'Social Studies', 'Art', 'Music', 'PE', 'Other'];
var KH_QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4', 'S1', 'S2', 'Final'];

// ── CANONICAL LEVELS (post-10x, single source of truth) ──────────
var KH_LEVELS = [
  {name:'Noob',     min:0},
  {name:'Sidekick', min:500},
  {name:'Warrior',  min:1500},
  {name:'Knight',   min:3500},
  {name:'Champion', min:7000},
  {name:'Legend',    min:12000},
  {name:'GOAT',      min:20000}
];

// v14: JJ-specific level names (same thresholds, different flavor)
var KH_LEVELS_JJ = [
  {name:'Sprout',    min:0},
  {name:'Bloom',     min:500},
  {name:'Sparkle',   min:1500},
  {name:'Rainbow',   min:3500},
  {name:'Princess',  min:7000},
  {name:'Queen',     min:12000},
  {name:'GOAT',      min:20000}
];

// ── TAB SCHEMAS ──────────────────────────────────────────────────
var KH_SCHEMAS = {

  KH_Chores: {
    headers: [
      'Child','Task','Task_ID','Task_Order','Category','Icon','Points',
      'TV_Minutes','Money','Snacks','Frequency','Active','Required',
      'Due_Day','Bonus_Multiplier','Streak_Threshold','Max_Bonus_Per_Week',
      'Completed','Completed_Date','Parent_Approved'
    ],
    widths: [70,340,130,90,100,45,60,90,60,60,90,60,60,80,80,100,110,85,115,115]
  },

  KH_History: {
    headers: [
      'Completion_UID','Task_ID','Child','Task','Points',
      'Base_Points','Multiplier','Event_Type','Date','Timestamp'
    ],
    widths: [220,130,70,280,60,70,70,90,100,180]
  },

  KH_Rewards: {
    headers: ['Reward_ID','Child','Icon','Name','Cost','Active','Sort_Order','Screen_Type','Screen_Minutes'],
    widths: [120,70,45,200,60,60,80,90,100]
  },

  KH_Redemptions: {
    headers: ['Redemption_UID','Child','Reward_ID','Reward_Name','Cost','Date','Timestamp'],
    widths: [250,70,120,200,60,100,180]
  },

  KH_Streaks: {
    headers: ['Child','Task_ID','Current_Streak','Last_Completed_Date','Last_Computed_Date'],
    widths: [70,130,100,130,130]
  },

  KH_Deductions: {
    headers: ['Deduction_ID','Child','Reason','Amount','Date','Timestamp'],
    widths: [200,70,300,60,100,180]
  },

  KH_Allowance: {
    headers: ['Child','Weekly_Amount','Effective_Date','Active'],
    widths: [70,110,110,60]
  },

  KH_Children: {
    headers: ['Child','Display_Name','Icon','Theme','Simplified_UI','Active','Parent_PIN','Bank_Opening'],
    widths: [70,120,45,80,90,60,70,90]
  },

  KH_Requests: {
    headers: [
      'Request_UID','Child','Type','Title','Amount','Notes',
      'Status','Parent_Note','Date','Timestamp'
    ],
    widths: [220,70,90,280,60,200,80,200,120,180]
  },

  KH_ScreenTime: {
    headers: ['Entry_UID','Child','Screen_Type','Minutes','Direction','Source','Date','Timestamp'],
    widths: [220,70,90,70,90,160,100,180]
  },

  KH_Grades: {
    headers: ['Timestamp','Kid','Subject','Grade','Quarter','School_Year','Rings_Awarded','Cash_Awarded','Entered_By','Notes'],
    widths: [180,70,120,60,70,100,100,100,80,200]
  }
};

// ── SEED DATA ────────────────────────────────────────────────────
var KH_SEED = {

  KH_Children: [
    ['Buggsy', 'Buggsy', '⭕', 'buggsy', 'FALSE', 'YES', '1234', 0],
    ['JJ',     'JJ',     '⭐', 'jj',     'TRUE',  'YES', '1234', 0]
  ],

  KH_Rewards: [
    ['BUGG_TV15','Buggsy','📺','+15 Min TV',25,'YES',1,'TV',15],
    ['BUGG_GAME30','Buggsy','🎮','30 Min Gaming',50,'YES',2,'Gaming',30],
    ['BUGG_DINNER','Buggsy','🍕','Choose Dinner',75,'YES',3,'',''],
    ['BUGG_CASH2','Buggsy','💵','Earn $2',125,'YES',4,'',''],
    ['BUGG_TREAT','Buggsy','🎁','Small Treat',150,'YES',5,'',''],
    ['BUGG_OUTING','Buggsy','⭐','Special Outing',250,'YES',6,'',''],
    ['BUGG_ROBUX','Buggsy','💎','Robux / V-Bucks',350,'YES',7,'',''],
    ['BUGG_BIG','Buggsy','🏆','BIG REWARD',500,'YES',8,'',''],
    ['JJ_STORY','JJ','📖','Extra Story',20,'YES',1,'',''],
    ['JJ_TV15','JJ','📺','+15 Min TV',25,'YES',2,'TV',15],
    ['JJ_ICECREAM','JJ','🍦','Ice Cream!',35,'YES',3,'',''],
    ['JJ_NAILS','JJ','🎀','Pick Nail Polish',50,'YES',4,'',''],
    ['JJ_MOVIE','JJ','🍿','Movie Night Pick',75,'YES',5,'',''],
    ['JJ_PRINCESS','JJ','👑','Princess Outing',120,'YES',6,'','']
  ],

  KH_Chores: [
    ['Buggsy','Morning Routine (Brush Teeth, Comb Hair, Wash Face)','BUGG_MR','1-Morning','Household','🪥',2,0,0.00,0,'Daily','YES','YES',1,5,2,false,'',false],
    ['Buggsy','Watch on Charger','BUGG_CHARGE','3-Evening','Household','⌚',1,0,0.00,0,'Daily','YES','NO',1,5,2,false,'',false],
    ['Buggsy','Bed Routine (Brush, Floss, pickup towels after shower)','BUGG_BR','3-Evening','Household','🪥',2,0,0.00,0,'Daily','YES','YES',1,5,2,false,'',false],
    ['Buggsy','Prep snack or lunch item','BUGG_PREPLUNCH','1-Morning','Kitchen','🥪',3,0,0.15,0,'Weekdays','YES','NO',1,5,1,false,'',false],
    ['Buggsy','Make bed (sheets + pillows + comforter)','BUGG_MAKEBED','2-Afternoon','Household','🛏️',3,0,0.15,0,'Daily','YES','YES',1,5,2,false,'',false],
    ['Buggsy','Unpack Back Pack and lunch box','BUGG_PACKBAG','2-Afternoon','School','📚',3,0,0.10,0,'Weekdays','YES','NO',1,5,1,false,'',false],
    ['Buggsy','Reading time (30 min)','BUGG_READING','2-Afternoon','School','📖',4,0,0.00,0,'Daily','YES','YES',1,7,1,false,'',false],
    ['Buggsy','Water Plants','BUGG_YARD','2-Afternoon','Outside','🌿',4,0,0.15,0,'Daily','YES','NO',1,3,1,false,'',false],
    ['Buggsy','Clear & wipe dinner table','BUGG_CLEARTABLE','3-Evening','Kitchen','🍽️',3,0,0.15,0,'Daily','YES','NO',1,5,2,false,'',false],
    ['Buggsy','Load OR unload dishwasher','BUGG_DISHES','3-Evening','Kitchen','🫧',4,0,0.15,0,'Daily','YES','YES',1,5,2,false,'',false],
    ['Buggsy','Clean up Living Room/Den Before Bed','BUGG_CLEAN_UP','3-Evening','Household','🧹',3,0,0.10,0,'Daily','YES','NO',1,5,2,false,'',false],
    ['Buggsy','Gather all Trash from around the house','BUGG_TRASH','2-Afternoon','Household','🗑️',5,0,0.25,0,'2x Week','YES','NO',1,3,1,false,'',false],
    ['Buggsy','Math and Science Homework','BUGG_MATH','2-Afternoon','School','📐',6,0,0.00,0,'Mon/Wed','YES','YES',1,3,1,false,'',false],
    ['Buggsy','Reading and Social Studies','BUGG_SS','2-Afternoon','School','📖',6,0,0.00,0,'Tue/Thu','YES','YES',1,3,1,false,'',false],
    ['Buggsy','Sweeping the floor','BUGG_SWEEPING','3-Evening','Household','🧹',5,0,0.25,0,'Weekly','YES','NO',1,3,1,false,'',false],
    ['Buggsy','Clean bathroom Sink and Counter','BUGG_BATHROOM','3-Evening','Bathroom','🚿',6,0,0.50,0,'Weekly','YES','NO',1,3,1,false,'',false],
    ['Buggsy','Sort, Hang, Put away Laundry','BUGG_LAUNDRY','2-Afternoon','Bedroom','👕',7,0,0.75,0,'Weekly','YES','NO',1,3,1,false,'',false],
    ['Buggsy','Vacuum all of upstairs (All Rooms and Common Areas)','BUGG_VACUUM','2-Afternoon','Household','🧹',8,0,1.00,0,'Weekly','YES','NO',1.5,3,1,false,'',false],
    ['Buggsy','Wash Pearl (Maxima)','BUGG_WASH_PEARL','2-Afternoon','Household','🚗',9,0,1.50,0,'Weekly','NO','NO',1,3,1,false,'',false],
    ['Buggsy','Wash Tempest (Telluride)','BUGG_WASH_TEMPEST','2-Afternoon','Household','🚙',9,0,1.50,0,'Weekly','NO','NO',1,3,1,false,'',false],
    ['Buggsy','Read JJ bedtime story','BUGG_BEDTIME_STORY','3-Evening','School','📖',3,0,0.00,0,'Daily','YES','NO',1,5,2,false,'',false],
    ['JJ','Brush teeth sparkle clean in morning','JJ_BR','1-Morning','Bathroom','🪥',2,0,0.00,1,'Daily','YES','YES',1,5,2,false,'',false],
    ['JJ','Make bed (pull up the covers)','JJ_MAKEBED','2-Afternoon','Bedroom','🛏️',2,0,0.00,1,'Daily','YES','YES',1,5,2,false,'',false],
    ['JJ','Water her special plant','JJ_WATER','2-Afternoon','Outside','🌸',3,0,0.00,1,'Daily','YES','NO',1,3,1,false,'',false],
    ['JJ','Take sheets off bed','JJ_SHEETS','2-Afternoon','Bedroom','🛏️',2,0,0.00,1,'Weekly','YES','NO',1,3,1,false,'',false],
    ['JJ','Brush teeth sparkle clean before bed','JJ_TEETH','3-Evening','Bathroom','🪥',2,0,0.00,1,'Daily','YES','YES',1,5,2,false,'',false],
    ['JJ','Put toys in the bin','JJ_TOYS','3-Evening','Clean Up','🧸',2,0,0.00,1,'Daily','YES','YES',1,5,2,false,'',false],
    ['JJ','Put dirty clothes in hamper','JJ_HAMPER','3-Evening','Bedroom','👗',2,0,0.00,1,'Daily','YES','NO',1,5,2,false,'',false],
    ['JJ','Help set the table (napkins + spoons)','JJ_SETTABLE','3-Evening','Kitchen','🥄',3,0,0.00,1,'Daily','YES','NO',1,5,2,false,'',false],
    ['JJ','Wipe table after meals (with help)','JJ_WIPETABLE','3-Evening','Kitchen','🧽',3,0,0.00,1,'Daily','YES','NO',1,5,2,false,'',false],
    ['JJ','Clean up Living Room/Den Before Bed','JJ_CLEAN_UP','3-Evening','Household','🧹',2,0,0.00,1,'Daily','YES','NO',1,5,2,false,'',false],
    ['JJ','Pick up books & put on shelf','JJ_BOOKS','3-Evening','Bedroom','📚',3,0,0.00,1,'Weekly','YES','NO',1,3,1,false,'',false]
  ],

  KH_Allowance: [
    ['Buggsy', 20, '2026-03-10', 'YES'],
    ['JJ',     10, '2026-03-10', 'YES']
  ]
};


// ════════════════════════════════════════════════════════════════════
// HEARTBEAT — v19: Write timestamp to Helpers!Z1 on every KH write
// ════════════════════════════════════════════════════════════════════
function stampKHHeartbeat_() {
  try {
    var ss = getKHSS_();
    var hn = typeof TAB_MAP !== 'undefined' ? (TAB_MAP['Helpers'] || 'Helpers') : 'Helpers';
    var sh = ss.getSheetByName(hn);
    if (sh) sh.getRange('Z1').setValue(new Date().toISOString());
  } catch(e) { if (typeof logError_ === 'function') logError_('kh_stampKHHeartbeat_', e); }
}


// ════════════════════════════════════════════════════════════════════
// SETUP FUNCTIONS
// ════════════════════════════════════════════════════════════════════

// v16: One-time migration — creates KH_ScreenTime tab + adds Screen_Type/Screen_Minutes to KH_Rewards
function migrateScreenTimeBank() {
  var ss = getKHSS_();
  var log = [];

  // 1. Create KH_ScreenTime tab if missing
  var stTabName = typeof TAB_MAP !== 'undefined' ? (TAB_MAP['KH_ScreenTime'] || 'KH_ScreenTime') : 'KH_ScreenTime';
  var stSheet = ss.getSheetByName(stTabName);
  if (!stSheet) {
    stSheet = ss.insertSheet(stTabName);
    var schema = KH_SCHEMAS['KH_ScreenTime'];
    var hRange = stSheet.getRange(1, 1, 1, schema.headers.length);
    hRange.setValues([schema.headers]);
    hRange.setBackground('#0f1923').setFontColor('#fbbf24')
      .setFontWeight('bold').setFontFamily('Courier New').setFontSize(10);
    for (var wi = 0; wi < schema.widths.length; wi++) {
      stSheet.setColumnWidth(wi + 1, schema.widths[wi]);
    }
    stSheet.setFrozenRows(1);
    log.push('Created tab: ' + stTabName);
  } else {
    log.push('Tab already exists: ' + stTabName);
  }

  // 2. Add Screen_Type + Screen_Minutes columns to KH_Rewards if missing
  var rwTabName = typeof TAB_MAP !== 'undefined' ? (TAB_MAP['KH_Rewards'] || 'KH_Rewards') : 'KH_Rewards';
  var rwSheet = ss.getSheetByName(rwTabName);
  if (rwSheet) {
    var headers = rwSheet.getRange(1, 1, 1, rwSheet.getLastColumn()).getValues()[0].map(String);
    var addedCols = [];
    if (headers.indexOf('Screen_Type') < 0) {
      var nextCol = headers.length + 1;
      rwSheet.getRange(1, nextCol).setValue('Screen_Type')
        .setBackground('#0f1923').setFontColor('#fbbf24').setFontWeight('bold').setFontFamily('Courier New').setFontSize(10);
      rwSheet.setColumnWidth(nextCol, 90);
      addedCols.push('Screen_Type');
    }
    // Re-read headers after potential addition
    headers = rwSheet.getRange(1, 1, 1, rwSheet.getLastColumn()).getValues()[0].map(String);
    if (headers.indexOf('Screen_Minutes') < 0) {
      var nextCol2 = headers.length + 1;
      rwSheet.getRange(1, nextCol2).setValue('Screen_Minutes')
        .setBackground('#0f1923').setFontColor('#fbbf24').setFontWeight('bold').setFontFamily('Courier New').setFontSize(10);
      rwSheet.setColumnWidth(nextCol2, 100);
      addedCols.push('Screen_Minutes');
    }
    if (addedCols.length > 0) {
      log.push('Added columns to ' + rwTabName + ': ' + addedCols.join(', '));
      // Backfill screen data for TV/Gaming rewards
      headers = rwSheet.getRange(1, 1, 1, rwSheet.getLastColumn()).getValues()[0].map(String);
      var stCol = headers.indexOf('Screen_Type');
      var smCol = headers.indexOf('Screen_Minutes');
      var ridCol = headers.indexOf('Reward_ID');
      var data = rwSheet.getDataRange().getValues();
      var screenMap = {
        'BUGG_TV15':   { type: 'TV',     mins: 15 },
        'BUGG_GAME30': { type: 'Gaming', mins: 30 },
        'JJ_TV15':     { type: 'TV',     mins: 15 }
      };
      for (var i = 1; i < data.length; i++) {
        var rid = String(data[i][ridCol] || '');
        var sm = screenMap[rid];
        if (sm) {
          rwSheet.getRange(i + 1, stCol + 1).setValue(sm.type);
          rwSheet.getRange(i + 1, smCol + 1).setValue(sm.mins);
        }
      }
      log.push('Backfilled screen data for TV/Gaming rewards');
    } else {
      log.push('KH_Rewards columns already present');
    }
  } else {
    log.push('KH_Rewards tab not found — skip column migration');
  }

  Logger.log('migrateScreenTimeBank: ' + log.join(' | '));
  return log;
}


function setupKHSheets() {
  var ss = getKHSS_();
  var ui = SpreadsheetApp.getUi();

  var existingTabs = [];
  var tabKeys = Object.keys(KH_TABS);
  for (var t = 0; t < tabKeys.length; t++) {
    var name = KH_TABS[tabKeys[t]];
    var resolved = typeof TAB_MAP !== 'undefined' ? (TAB_MAP[name] || name) : name;
    if (ss.getSheetByName(resolved) !== null) existingTabs.push(name);
  }

  if (existingTabs.length > 0) {
    var res = ui.alert(
      'Tabs Exist',
      'These KH tabs already exist:\n' + existingTabs.join(', ') +
      '\n\nOverwrite them? (Data will be lost)',
      ui.ButtonSet.YES_NO
    );
    if (res !== ui.Button.YES) return;
    for (var d = 0; d < existingTabs.length; d++) {
      var rn = typeof TAB_MAP !== 'undefined' ? (TAB_MAP[existingTabs[d]] || existingTabs[d]) : existingTabs[d];
      var sh = ss.getSheetByName(rn);
      if (sh) ss.deleteSheet(sh);
    }
  }

  var tabOrder = [
    'KH_Children', 'KH_Chores', 'KH_Rewards', 'KH_Allowance',
    'KH_History', 'KH_Redemptions', 'KH_Streaks', 'KH_Deductions', 'KH_Requests',
    'KH_ScreenTime'
  ];

  for (var ti = 0; ti < tabOrder.length; ti++) {
    var tabKey = tabOrder[ti];
    var schema = KH_SCHEMAS[tabKey];
    var tabName = typeof TAB_MAP !== 'undefined' ? (TAB_MAP[tabKey] || tabKey) : tabKey;
    var sheet = ss.insertSheet(tabName);

    var hRange = sheet.getRange(1, 1, 1, schema.headers.length);
    hRange.setValues([schema.headers]);
    hRange.setBackground('#0f1923').setFontColor('#fbbf24')
      .setFontWeight('bold').setFontFamily('Courier New').setFontSize(10);

    for (var wi = 0; wi < schema.widths.length; wi++) {
      sheet.setColumnWidth(wi + 1, schema.widths[wi]);
    }

    sheet.setFrozenRows(1);
    if (schema.headers.length > 3) sheet.setFrozenColumns(1);

    if (tabKey === 'KH_Requests') {
      var titleIdx = schema.headers.indexOf('Title');
      var notesIdx = schema.headers.indexOf('Notes');
      var pnIdx = schema.headers.indexOf('Parent_Note');
      if (titleIdx >= 0) sheet.getRange(2, titleIdx + 1, 500, 1).setNumberFormat('@');
      if (notesIdx >= 0) sheet.getRange(2, notesIdx + 1, 500, 1).setNumberFormat('@');
      if (pnIdx >= 0) sheet.getRange(2, pnIdx + 1, 500, 1).setNumberFormat('@');
    }
    if (tabKey === 'KH_Rewards') {
      var nameIdx = schema.headers.indexOf('Name');
      if (nameIdx >= 0) sheet.getRange(2, nameIdx + 1, 500, 1).setNumberFormat('@');
    }

    var seed = KH_SEED[tabKey];
    if (seed && seed.length > 0) {
      sheet.getRange(2, 1, seed.length, schema.headers.length).setValues(seed);
      for (var si = 0; si < seed.length; si++) {
        sheet.getRange(si + 2, 1, 1, schema.headers.length)
          .setBackground(si % 2 === 0 ? '#0d1520' : '#111e2d')
          .setFontColor('#e2e8f0');
      }
    }

    Logger.log('✓ Created tab: ' + tabName + ' (' + schema.headers.length + ' columns)');
  }

  setupKHDropdowns();

  ui.alert(
    '✅ Kids Hub Setup Complete! v26\n\n' +
    '10 tabs created:\n' +
    tabOrder.join(', ') + '\n\n' +
    'Seed data loaded for: KH_Children, KH_Chores, KH_Rewards, KH_Allowance\n' +
    'Dropdowns applied to all configurable columns.'
  );
}


function setupKHDropdowns() {
  var ss = getKHSS_();

  function getSheet_(tabKey) {
    var name = typeof TAB_MAP !== 'undefined' ? (TAB_MAP[tabKey] || tabKey) : tabKey;
    return ss.getSheetByName(name);
  }

  function applyDropdown_(sheet, colName, options) {
    if (!sheet) return;
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
    var colIdx = headers.indexOf(colName);
    if (colIdx < 0) { Logger.log('Column not found: ' + colName + ' on ' + sheet.getName()); return; }
    var lastRow = Math.max(sheet.getLastRow(), 2);
    var range = sheet.getRange(2, colIdx + 1, lastRow - 1, 1);
    var rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(options, true)
      .setAllowInvalid(false)
      .setHelpText('Choose from the list')
      .build();
    range.setDataValidation(rule);
    Logger.log('✓ Dropdown: ' + sheet.getName() + '.' + colName);
  }

  var chores = getSheet_('KH_Chores');
  applyDropdown_(chores, 'Child',            KH_CHILD_OPTIONS);
  applyDropdown_(chores, 'Frequency',        KH_FREQ_OPTIONS);
  applyDropdown_(chores, 'Active',           KH_ACTIVE_OPTIONS);
  applyDropdown_(chores, 'Required',         KH_ACTIVE_OPTIONS);
  applyDropdown_(chores, 'Category',         KH_CATEGORY_OPTIONS);
  applyDropdown_(chores, 'Bonus_Multiplier', KH_MULTIPLIER_OPTIONS);

  var rewards = getSheet_('KH_Rewards');
  applyDropdown_(rewards, 'Child',  KH_CHILD_OPTIONS);
  applyDropdown_(rewards, 'Active', KH_ACTIVE_OPTIONS);

  var children = getSheet_('KH_Children');
  applyDropdown_(children, 'Theme',          KH_THEME_OPTIONS);
  applyDropdown_(children, 'Simplified_UI',  KH_BOOLEAN_OPTIONS);
  applyDropdown_(children, 'Active',         KH_ACTIVE_OPTIONS);

  var allowance = getSheet_('KH_Allowance');
  applyDropdown_(allowance, 'Child',  ['Buggsy', 'JJ']);
  applyDropdown_(allowance, 'Active', KH_ACTIVE_OPTIONS);

  var deductions = getSheet_('KH_Deductions');
  applyDropdown_(deductions, 'Child', ['Buggsy', 'JJ']);

  var requests = getSheet_('KH_Requests');
  applyDropdown_(requests, 'Child',  ['Buggsy', 'JJ']);
  applyDropdown_(requests, 'Type',   KH_REQUEST_TYPES);
  applyDropdown_(requests, 'Status', KH_REQUEST_STATUSES);

  Logger.log('✅ All KH dropdowns applied.');
}


function generateTaskID_(child, taskText) {
  var prefix = String(child).substring(0, 4).toUpperCase();
  var slug = String(taskText)
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join('_');
  return prefix + '_' + slug;
}


function validateTaskIDs() {
  var ss = getKHSS_();
  var tabName = typeof TAB_MAP !== 'undefined' ? (TAB_MAP['KH_Chores'] || 'KH_Chores') : 'KH_Chores';
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) return 0;
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return 0;
  var h = data[0].map(String);
  var childCol  = h.indexOf('Child');
  var taskCol   = h.indexOf('Task');
  var idCol     = h.indexOf('Task_ID');
  if (idCol < 0 || childCol < 0 || taskCol < 0) return 0;
  var existingIDs = {};
  for (var i = 1; i < data.length; i++) {
    var id = String(data[i][idCol] || '').trim();
    if (id) existingIDs[id] = true;
  }
  var generated = 0;
  for (var j = 1; j < data.length; j++) {
    var jid = String(data[j][idCol] || '').trim();
    if (jid) continue;
    var child = String(data[j][childCol] || '').trim();
    var task  = String(data[j][taskCol]  || '').trim();
    if (!child || !task) continue;
    var newID = generateTaskID_(child, task);
    var counter = 2;
    while (existingIDs[newID]) { newID = generateTaskID_(child, task) + '_' + counter; counter++; }
    sheet.getRange(j + 1, idCol + 1).setValue(newID);
    existingIDs[newID] = true;
    generated++;
  }
  if (generated > 0) Logger.log('✅ Auto-generated ' + generated + ' Task_IDs');
  return generated;
}


function backfillCompletedDatesToISO_() {
  var sheet = getKHSheet_('KH_Chores');
  if (!sheet) return 0;
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return 0;
  var h = data[0].map(String);
  var dateCol = h.indexOf('Completed_Date');
  if (dateCol < 0) return 0;
  var tz = Session.getScriptTimeZone();
  var converted = 0;
  for (var i = 1; i < data.length; i++) {
    var raw = data[i][dateCol];
    if (!raw) continue;
    var str = String(raw).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) continue;
    var parsed = new Date(str);
    if (isNaN(parsed.getTime())) continue;
    var iso = Utilities.formatDate(parsed, tz, 'yyyy-MM-dd');
    sheet.getRange(i + 1, dateCol + 1).setValue(iso);
    converted++;
  }
  return converted;
}


// ════════════════════════════════════════════════════════════════════
// ▸▸▸  CHUNK 2 OF 3 — Read Operations
// ════════════════════════════════════════════════════════════════════

// v26: openById migration — trigger-safe spreadsheet accessor (mirrors DE getDESS_())
var _cachedSS = null;

function getKHSS_() {
  if (!_cachedSS) _cachedSS = SpreadsheetApp.openById('1_jn-I4IfsqgnVOFiS38SVVzNJ0MAJtu2645iU5k0U9c');
  return _cachedSS;
}

// v25: Request-scoped sheet data cache — populated during getKidsHubData() reads only.
// When _sheetCache is non-null, readSheet_() caches getDataRange().getValues() results.
// Write functions bypass this automatically (cache is null outside getKidsHubData).
var _sheetCache = null;

function getKHSheet_(tabKey) {
  var ss = getKHSS_();
  var name = typeof TAB_MAP !== 'undefined' ? (TAB_MAP[tabKey] || tabKey) : tabKey;
  return ss.getSheetByName(name);
}

// v25: Cached sheet data read. Returns full data array (incl header row) or null.
// During getKidsHubData(): caches on first read, returns cached on subsequent reads.
// During write functions: _sheetCache is null, always reads fresh.
function readSheet_(tabKey) {
  if (_sheetCache && _sheetCache.hasOwnProperty(tabKey)) return _sheetCache[tabKey];
  var sheet = getKHSheet_(tabKey);
  if (!sheet || sheet.getLastRow() < 1) {
    if (_sheetCache) _sheetCache[tabKey] = null;
    return null;
  }
  var data = sheet.getDataRange().getValues();
  if (_sheetCache) _sheetCache[tabKey] = data;
  return data;
}

function getKHHeaders_(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) { return String(h).trim(); });
}

function khCol_(headers, name) { return headers.indexOf(name); }

function getTodayISO_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function getMondayISO_() {
  var d = new Date();
  var day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function getYesterdayISO_() {
  var d = new Date();
  d.setDate(d.getDate() - 1);
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function isWeekend_() {
  var day = new Date().getDay();
  return day === 0 || day === 6;
}

function isStaleDaily_(dateStr) {
  if (!dateStr) return false;
  var stored;
  if (dateStr instanceof Date) {
    stored = Utilities.formatDate(dateStr, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  } else {
    stored = String(dateStr).trim().substring(0, 10);
  }
  return stored !== getTodayISO_();
}

function isStaleWeekly_(dateStr) {
  if (!dateStr) return false;
  var stored;
  if (dateStr instanceof Date) {
    stored = Utilities.formatDate(dateStr, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  } else {
    stored = String(dateStr).trim().substring(0, 10);
  }
  return stored < getMondayISO_();
}

function getNowISO_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss");
}

// v13 FIX 1: Shared lock-acquisition helper — checks boolean return value
// v26: waitLock(30000) per GAS Standards Kit (was tryLock(10000) — BUG-006 pattern)
function acquireLock_() {
  var lock = LockService.getScriptLock();
  var hasLock = false;
  try { hasLock = lock.waitLock(30000); hasLock = true; } catch (e) { hasLock = false; }
  return { lock: lock, acquired: hasLock };
}


// ── MAIN READ FUNCTION ──────────────────────────────────────────
function getKidsHubData(child, _cacheBust) {
  // _cacheBust is unused — its presence forces GAS to skip response caching across sessions
  // v25: Activate request-scoped sheet cache — each sheet read once for entire function
  _sheetCache = {};
  try {
    // v24: validateTaskIDs() REMOVED from read path (was write-inside-read, no lock — BUG-003)
    // Run validateTaskIDs() from khSetupTabs or manually instead.
    var childLower = String(child || 'buggsy').toLowerCase();
    var isAll = childLower === 'all';

    var childConfig = readChildConfig_();
    var tasks = readChores_(childLower, isAll);
    var rewards = readRewards_(childLower, isAll);
    var balances = computeBalances_(childLower, isAll);
    var streaks = readStreaks_(childLower, isAll);
    var allowance = readAllowance_(childLower, isAll);

    var requests = readRequests_(childLower, isAll);
    var pendingRequestCount = {};
    var children = isAll ? ['buggsy', 'jj'] : [childLower];
    for (var ci = 0; ci < children.length; ci++) {
      var ck = children[ci];
      var cnt = 0;
      for (var ri = 0; ri < requests.length; ri++) {
        if (requests[ri].child.toLowerCase() === ck && requests[ri].status === 'Pending') cnt++;
      }
      pendingRequestCount[ck] = cnt;
    }

    for (var bi = 0; bi < children.length; bi++) {
      var bk = children[bi];
      var bal = balances[bk] || {};
      bal.earnedMoney = earnedMoney_(bk);
      bal.bankOpening = readBankOpening_(bk);
      bal.bankBalance = computeBankBalance_(bk);
      balances[bk] = bal;
    }

    // Canonical sort — server owns task ordering
    tasks.sort(function(a, b) {
      var ac = a.completed ? 1 : 0;
      var bc = b.completed ? 1 : 0;
      if (ac !== bc) return ac - bc;
      var ar = a.required ? 1 : 0;
      var br = b.required ? 1 : 0;
      if (ar !== br) return br - ar;
      if (a.timeOfDay < b.timeOfDay) return -1;
      if (a.timeOfDay > b.timeOfDay) return 1;
      if (a.points !== b.points) return b.points - a.points;
      var an = (a.task || '').toLowerCase();
      var bn = (b.task || '').toLowerCase();
      if (an < bn) return -1;
      if (an > bn) return 1;
      return 0;
    });

    // v30: Meta-Progression — streak + mastery rank per kid
    var metaProgression = {};
    for (var _mpi = 0; _mpi < children.length; _mpi++) {
      var _mpk = children[_mpi];
      var _mpBal = balances[_mpk] || {};
      var _mpTotal = (_mpBal.earned || 0);
      metaProgression[_mpk] = {
        streakDays: kh_computeWeeklyStreak_(_mpk),
        masteryRank: kh_computeMasteryRank_(_mpTotal, _mpk),
        totalEarned: _mpTotal
      };
    }

    return JSON.stringify({
      tasks:              tasks,
      rewards:            rewards,
      balances:           balances,
      streaks:            streaks,
      allowance:          allowance,
      weeklyGrid:         getWeeklyGrid_(childLower, isAll),
      requiredStatus:     isAll
        ? { buggsy: getRequiredStatus_('buggsy'), jj: getRequiredStatus_('jj') }
        : getRequiredStatus_(childLower),
      childConfig:        childConfig,
      requests:           requests,
      pendingRequestCount: pendingRequestCount,
      screenTime:         computeScreenTimeBalances_(childLower, isAll),
      levels:             KH_LEVELS,
      levelsJJ:           KH_LEVELS_JJ,
      metaProgression:    metaProgression,
      sortOrder:          'canonical',
      _meta: {
        version:   'KidsHub.gs v30',
        timestamp: getNowISO_(),
        child:     childLower
      }
    });

  } catch (e) {
    Logger.log('getKidsHubData error: ' + e.message);
    return JSON.stringify({ error: e.message });
  } finally {
    _sheetCache = null; // v25: Always clear cache, even on error
  }
}


function readChildConfig_() {
  var data = readSheet_('KH_Children');
  if (!data || data.length < 2) return {};
  var h = data[0].map(String);
  var config = {};
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var key = String(row[khCol_(h, 'Child')] || '').toLowerCase();
    if (!key) continue;
    config[key] = {
      child:         String(row[khCol_(h, 'Child')]        || ''),
      displayName:   String(row[khCol_(h, 'Display_Name')] || ''),
      icon:          String(row[khCol_(h, 'Icon')]         || '⭐'),
      theme:         String(row[khCol_(h, 'Theme')]        || 'buggsy'),
      simplifiedUI:  String(row[khCol_(h, 'Simplified_UI')]|| 'FALSE').toUpperCase() === 'TRUE',
      active:        String(row[khCol_(h, 'Active')]       || 'YES').toUpperCase() === 'YES',
      parentPin:     String(row[khCol_(h, 'Parent_PIN')]  || ''),
      bankOpening:   Number(row[khCol_(h, 'Bank_Opening')] || 0) || 0
    };
  }
  return config;
}


function readChores_(child, isAll) {
  var data = readSheet_('KH_Chores');
  if (!data || data.length < 2) return [];
  var h = data[0].map(String);
  var tasks = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[khCol_(h, 'Task')]) continue;
    var rowChild = String(row[khCol_(h, 'Child')] || '').trim();
    var isShared = rowChild.toUpperCase() === 'BOTH';
    if (!isAll && !isShared && rowChild.toLowerCase() !== child) continue;
    if (String(row[khCol_(h, 'Active')] || '').toUpperCase() !== 'YES') continue;

    var freq = String(row[khCol_(h, 'Frequency')] || 'Daily').trim();

    // v14 Fix 6: Frequency filter ALWAYS runs — isAll only skips child filter
    if (freq === 'Weekdays' && isWeekend_())  continue;
    if (freq === 'Weekends' && !isWeekend_()) continue;
    var dayOfWeek = new Date().getDay();
    if (freq === 'Mon/Wed' && dayOfWeek !== 1 && dayOfWeek !== 3) continue;
    if (freq === 'Tue/Thu' && dayOfWeek !== 2 && dayOfWeek !== 4) continue;

    var compDateRaw = row[khCol_(h, 'Completed_Date')] || null;
    var compDate = compDateRaw instanceof Date
      ? Utilities.formatDate(compDateRaw, Session.getScriptTimeZone(), 'yyyy-MM-dd')
      : String(compDateRaw || '').trim();
    var rawDone  = row[khCol_(h, 'Completed')]      === true || String(row[khCol_(h, 'Completed')]).toUpperCase() === 'TRUE';
    var rawApprv = row[khCol_(h, 'Parent_Approved')]  === true || String(row[khCol_(h, 'Parent_Approved')]).toUpperCase() === 'TRUE';

    var rawMult = row[khCol_(h, 'Bonus_Multiplier')];
    var multiplier = rawMult ? Math.max(1, parseFloat(rawMult) || 1) : 1;

    var done = rawDone, approved = rawApprv;
    if (rawDone && compDateRaw) {
      if (rawApprv) {
        var isDaily    = freq === 'Daily' || freq === 'Weekdays' || freq === 'Weekends';
        var isWeeklyCat = freq === 'Weekly' || freq === '2x Week';
        if (isDaily    && isStaleDaily_(compDateRaw))  { done = false; approved = false; }
        if (isWeeklyCat && isStaleWeekly_(compDateRaw)) { done = false; approved = false; }
      }
    }

    var basePoints = Number(row[khCol_(h, 'Points')]) || 0;
    var effectivePoints = Math.round(basePoints * multiplier);

    // Check if this task was overridden (0-point approval via override)
    var isOverridden = false;
    if (done && approved) {
      var taskID = String(row[khCol_(h, 'Task_ID')] || '');
      var today = getTodayISO_();
      var overrideUID = taskID + '_' + today + '_' + (isShared ? child : rowChild.toLowerCase()) + '_override';
      isOverridden = historyUIDExists_(overrideUID);
    }

    var rawTaskOrder = String(row[khCol_(h, 'Task_Order')] || '');

    tasks.push({
      rowIndex:         i + 1,
      child:            rowChild,
      isShared:         isShared,
      task:             String(row[khCol_(h, 'Task')]             || ''),
      taskID:           String(row[khCol_(h, 'Task_ID')]          || ''),
      category:         String(row[khCol_(h, 'Category')]         || 'General'),
      icon:             String(row[khCol_(h, 'Icon')]             || '⭐'),
      points:           effectivePoints,
      basePoints:       basePoints,
      multiplier:       multiplier,
      tvMinutes:        Number(row[khCol_(h, 'TV_Minutes')])      || 0,
      money:            Number(row[khCol_(h, 'Money')])           || 0,
      snacks:           Number(row[khCol_(h, 'Snacks')])          || 0,
      frequency:        freq,
      required:         String(row[khCol_(h, 'Required')] || 'NO').toUpperCase() === 'YES',
      dueDay:           String(row[khCol_(h, 'Due_Day')] || '').trim(),
      streakThreshold:  Number(row[khCol_(h, 'Streak_Threshold')])|| 5,
      maxBonusPerWeek:  Number(row[khCol_(h, 'Max_Bonus_Per_Week')]) || 2,
      completed:        done,
      parentApproved:   approved,
      completedDate:    compDate,
      timeOfDay:        rawTaskOrder,
      overridden:       isOverridden
    });
  }

  return tasks;
}


function readRewards_(child, isAll) {
  var data = readSheet_('KH_Rewards');
  if (!data || data.length < 2) return [];
  var h = data[0].map(String);
  var rewards = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rChild = String(row[khCol_(h, 'Child')] || '').trim();
    var isShared = rChild.toUpperCase() === 'BOTH';
    if (!isAll && !isShared && rChild.toLowerCase() !== child) continue;
    if (String(row[khCol_(h, 'Active')] || '').toUpperCase() !== 'YES') continue;
    rewards.push({
      rewardID:  String(row[khCol_(h, 'Reward_ID')]  || ''),
      child:     rChild,
      icon:      String(row[khCol_(h, 'Icon')]       || '🎁'),
      name:      String(row[khCol_(h, 'Name')]       || ''),
      cost:      Number(row[khCol_(h, 'Cost')])      || 0,
      sortOrder: Number(row[khCol_(h, 'Sort_Order')])|| 99
    });
  }
  return rewards.sort(function(a, b) { return a.sortOrder - b.sortOrder; });
}


// v16: Helper — given a reward_id, returns {type, minutes} or null
function readRewardScreenMeta_(rewardID) {
  var data = readSheet_('KH_Rewards');
  if (!data || data.length < 2) return null;
  var h = data[0].map(String);
  var ridCol = h.indexOf('Reward_ID');
  var stCol  = h.indexOf('Screen_Type');
  var smCol  = h.indexOf('Screen_Minutes');
  if (ridCol < 0 || stCol < 0 || smCol < 0) return null;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][ridCol] || '') === rewardID) {
      var type = String(data[i][stCol] || '').trim();
      var mins = Number(data[i][smCol]) || 0;
      if (type && mins > 0) return { type: type, minutes: mins };
      return null;
    }
  }
  return null;
}


// Read requests — today's + all pending from any day
function readRequests_(child, isAll) {
  var data = readSheet_('KH_Requests');
  if (!data || data.length < 2) return [];
  var h = data[0].map(String);
  var today = getTodayISO_();
  var requests = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var reqChild = String(row[khCol_(h, 'Child')] || '').toLowerCase();
    if (!isAll && reqChild !== child) continue;
    var status = String(row[khCol_(h, 'Status')] || '');
    var subDate = String(row[khCol_(h, 'Date')] || '').substring(0, 10);
    // Include: all pending (any day) + today's resolved
    if (status === 'Pending' || subDate === today) {
      requests.push({
        requestUID:    String(row[khCol_(h, 'Request_UID')]    || ''),
        child:         String(row[khCol_(h, 'Child')]          || ''),
        type:          String(row[khCol_(h, 'Type')]           || ''),
        title:         String(row[khCol_(h, 'Title')]          || ''),
        amount:        Number(row[khCol_(h, 'Amount')])        || 0,
        notes:         String(row[khCol_(h, 'Notes')]          || ''),
        status:        status,
        submittedDate: String(row[khCol_(h, 'Date')]           || ''),
        resolvedDate:  String(row[khCol_(h, 'Timestamp')]      || ''),
        resolvedBy:    '',
        parentNote:    String(row[khCol_(h, 'Parent_Note')]    || '')
      });
    }
  }
  return requests;
}


function computeBalances_(child, isAll) {
  var balances = {};
  var children = isAll ? ['buggsy', 'jj'] : [child];
  for (var c = 0; c < children.length; c++) {
    var ck = children[c];
    var earned   = sumHistoryPoints_(ck);
    var spent    = sumRedemptions_(ck);
    var deducted = sumDeductions_(ck);
    balances[ck] = {
      earned:   earned,
      spent:    spent,
      deducted: deducted,
      balance:  earned - spent - deducted
    };
  }
  return balances;
}


// v16: Screen Time Bank — compute TV/Gaming balances from KH_ScreenTime ledger
function computeScreenTimeBalances_(child, isAll) {
  var balances = {};
  var children = isAll ? ['buggsy', 'jj'] : [child];
  for (var c = 0; c < children.length; c++) {
    balances[children[c]] = { TV: { deposited: 0, withdrawn: 0, balance: 0 }, Gaming: { deposited: 0, withdrawn: 0, balance: 0 } };
  }
  var data = readSheet_('KH_ScreenTime');
  if (!data || data.length < 2) return balances;
  var h = data[0].map(String);
  var cChild = h.indexOf('Child');
  var cType  = h.indexOf('Screen_Type');
  var cMin   = h.indexOf('Minutes');
  var cDir   = h.indexOf('Direction');
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rChild = String(row[cChild] || '').toLowerCase();
    if (!balances[rChild]) continue;
    var type = String(row[cType] || '');
    if (type !== 'TV' && type !== 'Gaming') continue;
    var mins = Number(row[cMin]) || 0;
    var dir  = String(row[cDir] || '');
    if (dir === 'deposit')    balances[rChild][type].deposited += mins;
    if (dir === 'withdrawal') balances[rChild][type].withdrawn += mins;
  }
  for (var k = 0; k < children.length; k++) {
    var ck = children[k];
    balances[ck].TV.balance      = balances[ck].TV.deposited - balances[ck].TV.withdrawn;
    balances[ck].Gaming.balance  = balances[ck].Gaming.deposited - balances[ck].Gaming.withdrawn;
  }
  return balances;
}


// Parents Bank — earnedMoney from ALL approved tasks with money > 0
function earnedMoney_(child) {
  var data = readSheet_('KH_Chores');
  if (!data || data.length < 2) return 0;
  var h = data[0].map(String);
  var total = 0;
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rowChild = String(row[khCol_(h, 'Child')] || '').toLowerCase();
    var isShared = rowChild === 'both';
    if (!isShared && rowChild !== child) continue;
    var done = row[khCol_(h, 'Completed')] === true || String(row[khCol_(h, 'Completed')]).toUpperCase() === 'TRUE';
    var appr = row[khCol_(h, 'Parent_Approved')] === true || String(row[khCol_(h, 'Parent_Approved')]).toUpperCase() === 'TRUE';
    if (!done || !appr) continue;
    var money = Number(row[khCol_(h, 'Money')]) || 0;
    if (money > 0) total += money;
  }
  return Math.round(total * 100) / 100;
}


// Sum of approved Money-type withdrawals from KH_Requests
function totalApprovedMoneyRequests_(child) {
  var data = readSheet_('KH_Requests');
  if (!data || data.length < 2) return 0;
  var h = data[0].map(String);
  var total = 0;
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (String(row[khCol_(h, 'Child')] || '').toLowerCase() !== child) continue;
    if (String(row[khCol_(h, 'Type')] || '') !== 'Money') continue;
    if (String(row[khCol_(h, 'Status')] || '') !== 'Approved') continue;
    total += Number(row[khCol_(h, 'Amount')]) || 0;
  }
  return Math.round(total * 100) / 100;
}


// Read Bank_Opening from KH_Children
function readBankOpening_(child) {
  var config = readChildConfig_();
  var cfg = config[child] || {};
  return Number(cfg.bankOpening) || 0;
}


// Bank Balance = Opening + earned task money - approved withdrawals
function computeBankBalance_(child) {
  var opening = readBankOpening_(child);
  var earned = earnedMoney_(child);
  var withdrawn = totalApprovedMoneyRequests_(child);
  return Math.round((opening + earned - withdrawn) * 100) / 100;
}


function sumHistoryPoints_(child) {
  var data = readSheet_('KH_History');
  if (!data || data.length < 2) return 0;
  var h = data[0].map(String);
  var POINT_EVENTS = ['approval', 'bonus', 'rejection'];
  var total = 0;
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (String(row[khCol_(h, 'Child')] || '').toLowerCase() !== child) continue;
    var evType = String(row[khCol_(h, 'Event_Type')] || '').toLowerCase();
    if (POINT_EVENTS.indexOf(evType) < 0) continue;
    total += Number(row[khCol_(h, 'Points')]) || 0;
  }
  return total;
}

function sumRedemptions_(child) {
  var data = readSheet_('KH_Redemptions');
  if (!data || data.length < 2) return 0;
  var h = data[0].map(String);
  var total = 0;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][khCol_(h, 'Child')] || '').toLowerCase() !== child) continue;
    total += Number(data[i][khCol_(h, 'Cost')]) || 0;
  }
  return total;
}

function sumDeductions_(child) {
  var data = readSheet_('KH_Deductions');
  if (!data || data.length < 2) return 0;
  var h = data[0].map(String);
  var total = 0;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][khCol_(h, 'Child')] || '').toLowerCase() !== child) continue;
    total += Number(data[i][khCol_(h, 'Amount')]) || 0;
  }
  return total;
}


function readStreaks_(child, isAll) {
  var data = readSheet_('KH_Streaks');
  if (!data || data.length < 2) return {};
  var h = data[0].map(String);
  var streaks = {};
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var sChild = String(row[khCol_(h, 'Child')] || '').toLowerCase();
    if (!isAll && sChild !== child) continue;
    var taskID = String(row[khCol_(h, 'Task_ID')] || '');
    if (!taskID) continue;
    streaks[sChild + ':' + taskID] = {
      child: sChild, taskID: taskID,
      currentStreak:     Number(row[khCol_(h, 'Current_Streak')]) || 0,
      lastCompletedDate: String(row[khCol_(h, 'Last_Completed_Date')] || ''),
      lastComputedDate:  String(row[khCol_(h, 'Last_Computed_Date')] || '')
    };
  }
  return streaks;
}


// v27: Check if today matches a Due_Day value (e.g. "Saturday", "Mon,Thu")
// Blank dueDay = every day (backward compatible)
function isDueToday_(dueDay) {
  if (!dueDay) return true;
  var DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var today = new Date().getDay();
  var parts = dueDay.split(',');
  for (var i = 0; i < parts.length; i++) {
    var d = parts[i].trim();
    if (!d) continue;
    var dl = d.charAt(0).toUpperCase() + d.slice(1).toLowerCase();
    if (dl === DAYS[today] || dl === SHORT[today]) return true;
  }
  return false;
}

function getRequiredStatus_(child) {
  var tasks = readChores_(child, false);
  var hour = new Date().getHours();
  var activeBuckets = ['1-Morning'];
  if (hour >= 12) activeBuckets.push('2-Afternoon');
  if (hour >= 17) activeBuckets.push('3-Evening');

  var required = tasks.filter(function(t) { return t.required && isDueToday_(t.dueDay); });
  var currentRequired = required.filter(function(t) {
    return activeBuckets.indexOf(t.timeOfDay) >= 0;
  });

  var done = currentRequired.filter(function(t) {
    return t.completed && t.parentApproved;
  });
  var remaining = currentRequired.filter(function(t) {
    if (t.overridden) return false;
    return !t.completed || !t.parentApproved;
  });

  var pendingFromYesterday = 0;
  var yesterday = getYesterdayISO_();
  var rawData = readSheet_('KH_Chores');
  if (rawData && rawData.length >= 2) {
      var rh = rawData[0].map(String);
      var rChildCol = khCol_(rh, 'Child');
      var rCompCol = khCol_(rh, 'Completed');
      var rApprCol = khCol_(rh, 'Parent_Approved');
      var rDateCol = khCol_(rh, 'Completed_Date');
      var rActiveCol = khCol_(rh, 'Active');

      for (var ri = 1; ri < rawData.length; ri++) {
        var rr = rawData[ri];
        var rrChild = String(rr[rChildCol] || '').trim();
        var rrIsMatch = rrChild.toLowerCase() === child || rrChild.toUpperCase() === 'BOTH';
        if (!rrIsMatch) continue;
        if (String(rr[rActiveCol] || '').toUpperCase() !== 'YES') continue;
        var rrDone = rr[rCompCol] === true || String(rr[rCompCol]).toUpperCase() === 'TRUE';
        var rrAppr = rr[rApprCol] === true || String(rr[rApprCol]).toUpperCase() === 'TRUE';
        if (!rrDone || rrAppr) continue;
        var rrDate = rr[rDateCol];
        var rrDateStr;
        if (rrDate instanceof Date) {
          rrDateStr = Utilities.formatDate(rrDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        } else {
          rrDateStr = String(rrDate || '').trim().substring(0, 10);
        }
        if (rrDateStr === yesterday) {
          pendingFromYesterday++;
        }
      }
  }

  var allDayDoneCount = required.filter(function(t) {
    return t.completed && t.parentApproved;
  }).length;

  return {
    total: currentRequired.length,
    done: done.length,
    allClear: remaining.length === 0 && pendingFromYesterday === 0,
    currentPeriod: hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening',
    pendingFromYesterday: pendingFromYesterday,
    remaining: remaining.map(function(t) {
      return { taskID: t.taskID, task: t.task, icon: t.icon, rowIndex: t.rowIndex, timeOfDay: t.timeOfDay };
    }),
    allDayTotal: required.length,
    allDayDone: allDayDoneCount
  };
}


function readAllowance_(child, isAll) {
  var data = readSheet_('KH_Allowance');
  if (!data || data.length < 2) return {};
  var h = data[0].map(String);
  var allowance = {};
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var aChild = String(row[khCol_(h, 'Child')] || '').toLowerCase();
    if (!isAll && aChild !== child) continue;
    if (String(row[khCol_(h, 'Active')] || '').toUpperCase() !== 'YES') continue;
    allowance[aChild] = {
      weeklyAmount:  Number(row[khCol_(h, 'Weekly_Amount')]) || 0,
      effectiveDate: String(row[khCol_(h, 'Effective_Date')] || '')
    };
  }
  return allowance;
}


function getWeeklyGrid_(child, isAll) {
  var now = new Date();
  var dow = now.getDay();
  var monday = new Date(now);
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  monday.setHours(0, 0, 0, 0);
  var sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  var tz  = Session.getScriptTimeZone();
  var fmt = 'yyyy-MM-dd';
  var weekStart = Utilities.formatDate(monday, tz, fmt);
  var weekEnd   = Utilities.formatDate(sunday, tz, fmt);
  var dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var dayDates = [];
  for (var d = 0; d < 7; d++) {
    var dt = new Date(monday);
    dt.setDate(monday.getDate() + d);
    dayDates.push(Utilities.formatDate(dt, tz, fmt));
  }
  var data = readSheet_('KH_History');
  if (!data || data.length < 2) return { weekStart: weekStart, weekEnd: weekEnd, days: dayNames, dates: dayDates, grid: {} };
  var h = data[0].map(String);
  var children = isAll ? ['buggsy', 'jj'] : [child];
  var grid = {};
  for (var ci = 0; ci < children.length; ci++) {
    var c = children[ci];
    grid[c] = [];
    for (var di = 0; di < dayDates.length; di++) {
      grid[c].push({ date: dayDates[di], entries: [] });
    }
  }
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rowDate  = String(row[khCol_(h, 'Date')] || '').trim();
    if (rowDate < weekStart || rowDate > weekEnd) continue;
    var rowChild = String(row[khCol_(h, 'Child')] || '').toLowerCase();
    if (!grid[rowChild]) continue;
    var dayIdx = dayDates.indexOf(rowDate);
    if (dayIdx < 0) continue;
    grid[rowChild][dayIdx].entries.push({
      taskID:     String(row[khCol_(h, 'Task_ID')]    || ''),
      task:       String(row[khCol_(h, 'Task')]       || ''),
      points:     Number(row[khCol_(h, 'Points')])    || 0,
      eventType:  String(row[khCol_(h, 'Event_Type')] || ''),
      multiplier: Number(row[khCol_(h, 'Multiplier')]) || 1
    });
  }
  return { weekStart: weekStart, weekEnd: weekEnd, days: dayNames, dates: dayDates, grid: grid };
}


// ════════════════════════════════════════════════════════════════════
// ▸▸▸  CHUNK 3 OF 3 — Write Operations + Health Check
// ════════════════════════════════════════════════════════════════════

// v24: Row-index safety — validates Task_ID at rowIndex matches expected value
function validateRowTaskID_(sheet, headers, rowIndex, expectedTaskID) {
  if (!expectedTaskID) return true; // backward compat: if client doesn't send taskID, skip validation
  var row = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
  var actualTaskID = String(row[khCol_(headers, 'Task_ID')] || '');
  return actualTaskID === expectedTaskID;
}


function khCompleteTask(rowIndex, expectedTaskID) {
  var lk = acquireLock_();
  if (!lk.acquired) return JSON.stringify({ status: 'locked', message: 'Another operation is in progress. Try again.' });
  try {
    var sheet = getKHSheet_('KH_Chores');
    if (!sheet) return JSON.stringify({ error: 'KH_Chores not found' });
    var h = getKHHeaders_(sheet);
    // v24: Task_ID validation (BUG-002)
    if (expectedTaskID && !validateRowTaskID_(sheet, h, rowIndex, expectedTaskID)) {
      return JSON.stringify({ status: 'stale', message: 'Row has changed. Please refresh.', expectedTaskID: expectedTaskID });
    }
    var row = sheet.getRange(rowIndex, 1, 1, h.length).getValues()[0];
    var taskID     = String(row[khCol_(h, 'Task_ID')]  || '');
    var child      = String(row[khCol_(h, 'Child')]    || '');
    var task       = String(row[khCol_(h, 'Task')]     || '');
    var basePoints = Number(row[khCol_(h, 'Points')])  || 0;
    var mult       = Math.max(1, parseFloat(row[khCol_(h, 'Bonus_Multiplier')]) || 1);
    var today      = getTodayISO_();
    var now        = getNowISO_();
    var uid = taskID + '_' + today + '_' + child.toLowerCase();
    if (historyUIDExists_(uid)) {
      return JSON.stringify({ status: 'duplicate', uid: uid });
    }
    // v25: Batch write — modify row in memory, single writeback
    row[khCol_(h, 'Completed')] = true;
    row[khCol_(h, 'Completed_Date')] = getTodayISO_();
    sheet.getRange(rowIndex, 1, 1, h.length).setValues([row]);
    appendHistory_(uid, taskID, child, task, 0, basePoints, mult, 'completion', today, now);
    updateStreakCache_(child.toLowerCase(), taskID, today);
    if (child.toUpperCase() === 'BOTH') {
      var kids = ['buggsy', 'jj'];
      for (var k = 0; k < kids.length; k++) {
        var sharedUID = taskID + '_' + today + '_' + kids[k];
        if (!historyUIDExists_(sharedUID)) {
          appendHistory_(sharedUID, taskID, kids[k], task, 0, basePoints, mult, 'completion', today, now);
          updateStreakCache_(kids[k], taskID, today);
        }
      }
    }
    var _result = JSON.stringify({ status: 'ok', uid: uid });
    stampKHHeartbeat_();
    return _result;
  } finally {
    lk.lock.releaseLock();
  }
}


// v24: FIXED double-lock (BUG-001) — completion logic inlined inside single lock scope
function khCompleteTaskWithBonus(rowIndex, multiplier, expectedTaskID) {
  var lk = acquireLock_();
  if (!lk.acquired) return JSON.stringify({ status: 'locked', message: 'Another operation is in progress. Try again.' });
  try {
    var sheet = getKHSheet_('KH_Chores');
    if (!sheet) return JSON.stringify({ error: 'KH_Chores not found' });
    var h = getKHHeaders_(sheet);
    // v24: Task_ID validation
    if (expectedTaskID && !validateRowTaskID_(sheet, h, rowIndex, expectedTaskID)) {
      return JSON.stringify({ status: 'stale', message: 'Row has changed. Please refresh.', expectedTaskID: expectedTaskID });
    }
    // Set multiplier
    var validMult = (parseFloat(multiplier) === 1.5 || parseFloat(multiplier) === 2) ? parseFloat(multiplier) : 1;
    // v25: Read row, modify in memory, single writeback
    var row = sheet.getRange(rowIndex, 1, 1, h.length).getValues()[0];
    var mCol = khCol_(h, 'Bonus_Multiplier');
    if (mCol >= 0) row[mCol] = validMult;
    var taskID     = String(row[khCol_(h, 'Task_ID')]  || '');
    var child      = String(row[khCol_(h, 'Child')]    || '');
    var task       = String(row[khCol_(h, 'Task')]     || '');
    var basePoints = Number(row[khCol_(h, 'Points')])  || 0;
    var today      = getTodayISO_();
    var now        = getNowISO_();
    var uid = taskID + '_' + today + '_' + child.toLowerCase();
    if (historyUIDExists_(uid)) {
      stampKHHeartbeat_();
      return JSON.stringify({ status: 'duplicate', uid: uid });
    }
    row[khCol_(h, 'Completed')] = true;
    row[khCol_(h, 'Completed_Date')] = today;
    sheet.getRange(rowIndex, 1, 1, h.length).setValues([row]);
    appendHistory_(uid, taskID, child, task, 0, basePoints, validMult, 'completion', today, now);
    updateStreakCache_(child.toLowerCase(), taskID, today);
    if (child.toUpperCase() === 'BOTH') {
      var kids = ['buggsy', 'jj'];
      for (var k = 0; k < kids.length; k++) {
        var sharedUID = taskID + '_' + today + '_' + kids[k];
        if (!historyUIDExists_(sharedUID)) {
          appendHistory_(sharedUID, taskID, kids[k], task, 0, basePoints, validMult, 'completion', today, now);
          updateStreakCache_(kids[k], taskID, today);
        }
      }
    }
    var _result = JSON.stringify({ status: 'ok', uid: uid });
    stampKHHeartbeat_();
    return _result;
  } finally {
    lk.lock.releaseLock();
  }
}


function khApproveTask(rowIndex, expectedTaskID) {
  var lk = acquireLock_();
  if (!lk.acquired) return JSON.stringify({ status: 'locked', message: 'Another approval is in progress. Try again.' });
  try {
    var sheet = getKHSheet_('KH_Chores');
    if (!sheet) return JSON.stringify({ error: 'KH_Chores not found' });
    var h = getKHHeaders_(sheet);
    if (expectedTaskID && !validateRowTaskID_(sheet, h, rowIndex, expectedTaskID)) {
      return JSON.stringify({ status: 'stale', message: 'Row has changed. Please refresh.' });
    }
    var row = sheet.getRange(rowIndex, 1, 1, h.length).getValues()[0];

    var alreadyApproved = row[khCol_(h, 'Parent_Approved')] === true ||
      String(row[khCol_(h, 'Parent_Approved')]).toUpperCase() === 'TRUE';
    if (alreadyApproved) {
      return JSON.stringify({ status: 'ok', already: true, rowIndex: rowIndex });
    }

    var taskID = String(row[khCol_(h, 'Task_ID')] || '');
    var child  = String(row[khCol_(h, 'Child')]   || '');
    var task   = String(row[khCol_(h, 'Task')]    || '');
    var today  = getTodayISO_();
    var now    = getNowISO_();
    var approvalUID = taskID + '_' + today + '_' + child.toLowerCase() + '_approval';
    if (historyUIDExists_(approvalUID)) {
      return JSON.stringify({ status: 'ok', already: true, uid: approvalUID });
    }
    var basePoints = Number(row[khCol_(h, 'Points')]) || 0;
    var mult = Math.max(1, parseFloat(row[khCol_(h, 'Bonus_Multiplier')]) || 1);
    var earnedPoints = Math.round(basePoints * mult);
    // v25: Batch write — modify row in memory, single writeback
    row[khCol_(h, 'Parent_Approved')] = true;
    row[khCol_(h, 'Completed_Date')] = today;
    // v18: Auto-deactivate One-Time tasks after approval so they don't reappear
    var freq = String(row[khCol_(h, 'Frequency')] || '').toLowerCase();
    if (freq === 'one-time') {
      row[khCol_(h, 'Active')] = false;
    }
    sheet.getRange(rowIndex, 1, 1, h.length).setValues([row]);
    appendHistory_(approvalUID, taskID, child, task, earnedPoints, basePoints, mult, 'approval', today, now);
    console.log('KH_WRITE', JSON.stringify({ fn: 'khApproveTask', status: 'ok', uid: approvalUID, child: child, points: earnedPoints }));
    var _result = JSON.stringify({ status: 'ok', uid: approvalUID, child: child, points: earnedPoints, rowIndex: rowIndex });
    stampKHHeartbeat_();
    return _result;
  } finally {
    lk.lock.releaseLock();
  }
}


function khUncompleteTask(rowIndex, expectedTaskID) {
  var lk = acquireLock_();
  if (!lk.acquired) return JSON.stringify({ status: 'locked', message: 'Another operation is in progress. Try again.' });
  try {
    var sheet = getKHSheet_('KH_Chores');
    if (!sheet) return JSON.stringify({ error: 'KH_Chores not found' });
    var h = getKHHeaders_(sheet);
    if (expectedTaskID && !validateRowTaskID_(sheet, h, rowIndex, expectedTaskID)) {
      return JSON.stringify({ status: 'stale', message: 'Row has changed. Please refresh.' });
    }
    // v25: Batch write — read row, modify in memory, single writeback
    var row = sheet.getRange(rowIndex, 1, 1, h.length).getValues()[0];
    row[khCol_(h, 'Completed')] = false;
    row[khCol_(h, 'Parent_Approved')] = false;
    row[khCol_(h, 'Completed_Date')] = '';
    sheet.getRange(rowIndex, 1, 1, h.length).setValues([row]);
    stampKHHeartbeat_();
    return JSON.stringify({ status: 'ok' });
  } finally {
    lk.lock.releaseLock();
  }
}


function khOverrideTask(rowIndex, expectedTaskID) {
  var lk = acquireLock_();
  if (!lk.acquired) return JSON.stringify({ status: 'locked', message: 'Try again.' });
  try {
    var sheet = getKHSheet_('KH_Chores');
    if (!sheet) return JSON.stringify({ error: 'KH_Chores not found' });
    var h = getKHHeaders_(sheet);
    if (expectedTaskID && !validateRowTaskID_(sheet, h, rowIndex, expectedTaskID)) {
      return JSON.stringify({ status: 'stale', message: 'Row has changed. Please refresh.' });
    }
    var row = sheet.getRange(rowIndex, 1, 1, h.length).getValues()[0];
    var taskID = String(row[khCol_(h, 'Task_ID')] || '');
    var child = String(row[khCol_(h, 'Child')] || '');
    var task = String(row[khCol_(h, 'Task')] || '');
    var today = getTodayISO_();
    var now = getNowISO_();
    var uid = taskID + '_' + today + '_' + child.toLowerCase() + '_override';

    if (historyUIDExists_(uid)) {
      return JSON.stringify({ status: 'ok', already: true, uid: uid, rowIndex: rowIndex });
    }

    // v25: Batch write — modify row in memory, single writeback
    row[khCol_(h, 'Completed')] = true;
    row[khCol_(h, 'Completed_Date')] = today;
    row[khCol_(h, 'Parent_Approved')] = true;
    sheet.getRange(rowIndex, 1, 1, h.length).setValues([row]);
    appendHistory_(uid, taskID, child, task, 0, 0, 1, 'override', today, now);
    console.log('KH_WRITE', JSON.stringify({ fn: 'khOverrideTask', status: 'ok', uid: uid, child: child }));
    var _result = JSON.stringify({ status: 'ok', uid: uid, child: child, rowIndex: rowIndex });
    stampKHHeartbeat_();
    return _result;
  } finally {
    lk.lock.releaseLock();
  }
}


function khRejectTask(rowIndex, expectedTaskID) {
  var lk = acquireLock_();
  if (!lk.acquired) return JSON.stringify({ status: 'locked', message: 'Another operation is in progress. Try again.' });
  try {
    var sheet = getKHSheet_('KH_Chores');
    if (!sheet) return JSON.stringify({ error: 'KH_Chores not found' });
    var h = getKHHeaders_(sheet);
    if (expectedTaskID && !validateRowTaskID_(sheet, h, rowIndex, expectedTaskID)) {
      return JSON.stringify({ status: 'stale', message: 'Row has changed. Please refresh.' });
    }
    var row = sheet.getRange(rowIndex, 1, 1, h.length).getValues()[0];
    var taskID     = String(row[khCol_(h, 'Task_ID')]  || '');
    var child      = String(row[khCol_(h, 'Child')]    || '');
    var task       = String(row[khCol_(h, 'Task')]     || '');
    var basePoints = Number(row[khCol_(h, 'Points')])  || 0;
    var mult       = Math.max(1, parseFloat(row[khCol_(h, 'Bonus_Multiplier')]) || 1);
    var earnedPts  = Math.round(basePoints * mult);
    var today      = getTodayISO_();
    var now        = getNowISO_();
    var uid = taskID + '_' + today + '_' + child.toLowerCase() + '_rejection';
    // v25: Batch write — modify row in memory, single writeback
    row[khCol_(h, 'Completed')] = false;
    row[khCol_(h, 'Parent_Approved')] = false;
    row[khCol_(h, 'Completed_Date')] = '';
    row[khCol_(h, 'Bonus_Multiplier')] = 1;
    sheet.getRange(rowIndex, 1, 1, h.length).setValues([row]);
    appendHistory_(uid, taskID, child, task, 0, 0, 1, 'rejection', today, now);
    var _result = JSON.stringify({ status: 'ok', uid: uid, reversedPoints: 0 });
    stampKHHeartbeat_();
    return _result;
  } finally {
    lk.lock.releaseLock();
  }
}


function khApproveWithBonus(rowIndex, multiplier, expectedTaskID) {
  var lk = acquireLock_();
  if (!lk.acquired) return JSON.stringify({ status: 'locked', message: 'Another approval is in progress. Try again.' });
  try {
    var sheet = getKHSheet_('KH_Chores');
    if (!sheet) return JSON.stringify({ error: 'KH_Chores not found' });
    var h = getKHHeaders_(sheet);
    if (expectedTaskID && !validateRowTaskID_(sheet, h, rowIndex, expectedTaskID)) {
      return JSON.stringify({ status: 'stale', message: 'Row has changed. Please refresh.' });
    }
    var row = sheet.getRange(rowIndex, 1, 1, h.length).getValues()[0];
    var validMult = (parseFloat(multiplier) === 1.5 || parseFloat(multiplier) === 2) ? parseFloat(multiplier) : 1;
    var taskID     = String(row[khCol_(h, 'Task_ID')] || '');
    var child      = String(row[khCol_(h, 'Child')]   || '');
    var task       = String(row[khCol_(h, 'Task')]    || '');
    var basePoints = Number(row[khCol_(h, 'Points')]) || 0;
    var today      = getTodayISO_();
    var now        = getNowISO_();
    var approvalUID = taskID + '_' + today + '_' + child.toLowerCase() + '_approval';
    if (historyUIDExists_(approvalUID)) {
      return JSON.stringify({ status: 'duplicate', uid: approvalUID });
    }
    // v25: Batch write — modify row in memory, single writeback
    row[khCol_(h, 'Bonus_Multiplier')] = validMult;
    row[khCol_(h, 'Parent_Approved')] = true;
    row[khCol_(h, 'Completed_Date')] = today;
    // v18: Auto-deactivate One-Time tasks after approval
    var freq = String(row[khCol_(h, 'Frequency')] || '').toLowerCase();
    if (freq === 'one-time') {
      row[khCol_(h, 'Active')] = false;
    }
    sheet.getRange(rowIndex, 1, 1, h.length).setValues([row]);
    var totalPts = Math.round(basePoints * validMult);
    appendHistory_(approvalUID, taskID, child, task, totalPts, basePoints, validMult, 'approval', today, now);
    var totalAwarded = validMult > 1 ? Math.round(basePoints * validMult) : basePoints;
    console.log('KH_WRITE', JSON.stringify({ fn: 'khApproveWithBonus', status: 'ok', uid: approvalUID, child: child, points: totalAwarded, mult: validMult }));
    var _result = JSON.stringify({ status: 'ok', uid: approvalUID, child: child, points: totalAwarded, multiplier: validMult });
    stampKHHeartbeat_();
    return _result;
  } finally {
    lk.lock.releaseLock();
  }
}


// v17: Quantity redeem — handles 1-10 qty in a single call
function khRedeemReward(child, rewardID, quantity) {
  var qty = Math.max(1, Math.min(10, parseInt(quantity) || 1));
  var lk = acquireLock_();
  if (!lk.acquired) return JSON.stringify({ status: 'locked', message: 'Another redemption is in progress. Try again.' });
  try {
    var rSheet = getKHSheet_('KH_Rewards');
    if (!rSheet) return JSON.stringify({ error: 'KH_Rewards not found' });
    var rData = rSheet.getDataRange().getValues();
    var rH = rData[0].map(String);
    var reward = null;
    for (var i = 1; i < rData.length; i++) {
      if (String(rData[i][khCol_(rH, 'Reward_ID')] || '') === rewardID) {
        reward = { name: String(rData[i][khCol_(rH, 'Name')] || ''), cost: Number(rData[i][khCol_(rH, 'Cost')]) || 0 };
        break;
      }
    }
    if (!reward) return JSON.stringify({ error: 'Reward not found: ' + rewardID });
    var childLower = String(child).toLowerCase();
    var earned   = sumHistoryPoints_(childLower);
    var spent    = sumRedemptions_(childLower);
    var deducted = sumDeductions_(childLower);
    var currentBalance = earned - spent - deducted;
    var unitCost = Number(reward.cost) || 0;
    var totalCost = unitCost * qty;
    if (currentBalance < totalCost) {
      return JSON.stringify({ status: 'insufficient', balance: currentBalance, cost: totalCost, unitCost: unitCost, qty: qty });
    }
    var now = getNowISO_();
    var today = getTodayISO_();
    var sheet = getKHSheet_('KH_Redemptions');
    if (!sheet) return JSON.stringify({ error: 'KH_Redemptions not found' });
    var screenMeta = readRewardScreenMeta_(rewardID);
    // v24: Batch appendRow — build array, single setValues (BUG-009)
    var rows = [];
    for (var q = 0; q < qty; q++) {
      var uid = childLower + '_' + rewardID + '_' + today + '_' + now.replace(/[^0-9]/g, '').slice(-6) + '_' + q;
      rows.push([uid, child, rewardID, reward.name, reward.cost, today, now]);
      if (screenMeta) {
        depositScreenTime_(childLower, screenMeta.type, screenMeta.minutes, rewardID);
      }
    }
    if (rows.length > 0) {
      var lastRow = sheet.getLastRow();
      sheet.getRange(lastRow + 1, 1, rows.length, rows[0].length).setValues(rows);
    }
    var newBalance = currentBalance - totalCost;
    console.log('KH_WRITE', JSON.stringify({ fn: 'khRedeemReward', status: 'ok', child: childLower, qty: qty, totalCost: totalCost, newBalance: newBalance }));
    var _result = JSON.stringify({ status: 'ok', child: childLower, qty: qty, totalCost: totalCost, unitCost: unitCost, newBalance: newBalance });
    stampKHHeartbeat_();
    return _result;
  } finally {
    lk.lock.releaseLock();
  }
}


function khAddDeduction(child, reason, amount) {
  var lk = acquireLock_();
  if (!lk.acquired) return JSON.stringify({ status: 'locked', message: 'Another operation is in progress. Try again.' });
  try {
    var sheet = getKHSheet_('KH_Deductions');
    if (!sheet) return JSON.stringify({ error: 'KH_Deductions not found' });
    var today = getTodayISO_();
    var now   = getNowISO_();
    var uid   = String(child).toLowerCase() + '_DED_' + now.replace(/[^0-9]/g, '');
    sheet.appendRow([uid, child, reason, Number(amount) || 0, today, now]);
    stampKHHeartbeat_();
    return JSON.stringify({ status: 'ok', uid: uid });
  } finally {
    lk.lock.releaseLock();
  }
}


// ── v28: GRADE BONUS SYSTEM ──────────────────────────────────────

function khSubmitGrade(params) {
  var kid = String(params.kid || '').trim();
  var subject = String(params.subject || '').trim();
  var grade = String(params.grade || '').trim().toUpperCase();
  var quarter = String(params.quarter || '').trim();
  var schoolYear = String(params.schoolYear || '').trim();
  var enteredBy = String(params.enteredBy || '').trim();
  var notes = String(params.notes || '').trim();

  // Validate
  if (!kid || (kid !== 'Buggsy' && kid !== 'JJ')) {
    return JSON.stringify({ status: 'error', message: 'Invalid kid: ' + kid });
  }
  if (KH_SUBJECTS.indexOf(subject) < 0) {
    return JSON.stringify({ status: 'error', message: 'Invalid subject: ' + subject });
  }
  if (!KH_GRADE_REWARDS[grade]) {
    return JSON.stringify({ status: 'error', message: 'Invalid grade: ' + grade });
  }
  if (KH_QUARTERS.indexOf(quarter) < 0) {
    return JSON.stringify({ status: 'error', message: 'Invalid quarter: ' + quarter });
  }

  var lk = acquireLock_();
  if (!lk.acquired) return JSON.stringify({ status: 'locked', message: 'Another operation is in progress.' });
  try {
    var reward = KH_GRADE_REWARDS[grade];
    var today = getTodayISO_();
    var now = getNowISO_();

    // 1. Append to KH_Grades
    var gradeSheet = getKHSheet_('KH_Grades');
    if (!gradeSheet) return JSON.stringify({ status: 'error', message: 'KH_Grades tab not found' });
    gradeSheet.appendRow([now, kid, subject, grade, quarter, schoolYear, reward.rings, reward.cash, enteredBy, notes]);

    // 2. If rings > 0, append to KH_History as a bonus event
    if (reward.rings > 0) {
      var histUID = kid.toLowerCase() + '_GRADE_' + subject.replace(/\s/g, '') + '_' + quarter + '_' + schoolYear.replace(/[^0-9]/g, '');
      appendHistory_(histUID, 'GRADE', kid, subject + ' Grade: ' + grade, reward.rings, reward.rings, 1, 'bonus', today, now);
    }

    // 3. If cash > 0, log to KH_Allowance (simple append — balance computed at read time)
    if (reward.cash > 0) {
      var allowSheet = getKHSheet_('KH_Allowance');
      if (allowSheet) {
        allowSheet.appendRow([kid, reward.cash, today, 'Grade Bonus: ' + subject + ' ' + grade]);
      }
    }

    stampKHHeartbeat_();
    console.log('KH_WRITE', JSON.stringify({ fn: 'khSubmitGrade', kid: kid, subject: subject, grade: grade, rings: reward.rings, cash: reward.cash }));
    return JSON.stringify({ status: 'ok', kid: kid, subject: subject, grade: grade, ringsAwarded: reward.rings, cashAwarded: reward.cash });
  } finally {
    lk.lock.releaseLock();
  }
}

function khGetGradeHistory(kid) {
  var sheet = getKHSheet_('KH_Grades');
  if (!sheet || sheet.getLastRow() < 2) return JSON.stringify([]);
  var data = sheet.getDataRange().getValues();
  var h = data[0].map(String);
  var results = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rowKid = String(row[h.indexOf('Kid')] || '');
    if (kid && kid !== 'all' && rowKid !== kid) continue;
    results.push({
      timestamp: String(row[h.indexOf('Timestamp')] || ''),
      kid: rowKid,
      subject: String(row[h.indexOf('Subject')] || ''),
      grade: String(row[h.indexOf('Grade')] || ''),
      quarter: String(row[h.indexOf('Quarter')] || ''),
      schoolYear: String(row[h.indexOf('School_Year')] || ''),
      rings: Number(row[h.indexOf('Rings_Awarded')]) || 0,
      cash: Number(row[h.indexOf('Cash_Awarded')]) || 0,
      enteredBy: String(row[h.indexOf('Entered_By')] || ''),
      notes: String(row[h.indexOf('Notes')] || '')
    });
  }
  results.sort(function(a, b) { return a.timestamp > b.timestamp ? -1 : 1; });
  return JSON.stringify(results);
}


function khResetTasks(mode, child) {
  var lk = acquireLock_();
  if (!lk.acquired) return JSON.stringify({ status: 'locked', message: 'Another operation is in progress. Try again.' });
  try {
    var sheet = getKHSheet_('KH_Chores');
    if (!sheet) return JSON.stringify({ error: 'KH_Chores not found' });
    var data = sheet.getDataRange().getValues();
    var h = data[0].map(String);
    var cChild = khCol_(h, 'Child');
    var cFreq  = khCol_(h, 'Frequency');
    var cDone  = khCol_(h, 'Completed')        + 1;
    var cApprv = khCol_(h, 'Parent_Approved')   + 1;
    var cDate  = khCol_(h, 'Completed_Date')    + 1;
    var cMult  = khCol_(h, 'Bonus_Multiplier')  + 1;
    // v25: Batch write — modify data in memory, write changed rows in one call
    var resetCount = 0;
    var changedRows = []; // [{rowIdx, rowData}]
    for (var i = 1; i < data.length; i++) {
      var rowChild = String(data[i][cChild] || '').toLowerCase();
      var isShared = rowChild === 'both';
      var freq     = String(data[i][cFreq]  || '').toLowerCase();
      if (child !== 'all' && !isShared && rowChild !== child.toLowerCase()) continue;
      var isD = freq === 'daily' || freq === 'weekdays' || freq === 'weekends';
      var isW = freq === 'weekly' || freq === '2x week';
      var hit = mode === 'all' || (mode === 'daily' && isD) || (mode === 'weekly' && isW);
      if (hit) {
        data[i][cDone - 1] = false;
        data[i][cApprv - 1] = false;
        data[i][cDate - 1] = '';
        if (mode === 'daily' || mode === 'all') {
          if (cMult > 0) data[i][cMult - 1] = 1;
        }
        changedRows.push(i);
        resetCount++;
      }
    }
    // Write all changed rows in contiguous blocks for efficiency
    if (changedRows.length > 0) {
      // Find contiguous runs and batch-write each
      var blockStart = changedRows[0];
      var blockEnd = changedRows[0];
      for (var bi = 1; bi <= changedRows.length; bi++) {
        if (bi < changedRows.length && changedRows[bi] === blockEnd + 1) {
          blockEnd = changedRows[bi];
        } else {
          // Write this block
          var blockLen = blockEnd - blockStart + 1;
          var blockData = data.slice(blockStart, blockEnd + 1);
          sheet.getRange(blockStart + 1, 1, blockLen, h.length).setValues(blockData);
          // Start next block
          if (bi < changedRows.length) {
            blockStart = changedRows[bi];
            blockEnd = changedRows[bi];
          }
        }
      }
    }
    stampKHHeartbeat_();
    return JSON.stringify({ status: 'ok', resetCount: resetCount });
  } finally {
    lk.lock.releaseLock();
  }
}


// ════════════════════════════════════════════════════════════════════
// ASK SYSTEM — Request Functions
// ════════════════════════════════════════════════════════════════════

// v17: Auto-create helper for KH_Requests tab
// v28: One-time migration — adds Due_Day column to KH_Chores between Required and Bonus_Multiplier
// Safe to run multiple times — skips if column already exists
function migrateDueDay() {
  var sheet = getKHSheet_('KH_Chores');
  if (!sheet) { Logger.log('migrateDueDay: KH_Chores not found'); return 'ERROR: KH_Chores not found'; }
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  if (headers.indexOf('Due_Day') >= 0) {
    Logger.log('migrateDueDay: Due_Day column already exists at index ' + headers.indexOf('Due_Day'));
    return 'SKIP: Due_Day already exists';
  }
  // Find Required column — Due_Day goes right after it
  var reqIdx = headers.indexOf('Required');
  if (reqIdx < 0) { Logger.log('migrateDueDay: Required column not found'); return 'ERROR: Required column not found'; }
  var insertAfter = reqIdx + 1; // 0-based index of Required, +1 = column after
  sheet.insertColumnAfter(insertAfter); // insertColumnAfter is 1-based
  var newColNum = insertAfter + 1;
  sheet.getRange(1, newColNum).setValue('Due_Day')
    .setBackground('#0f1923').setFontColor('#fbbf24')
    .setFontWeight('bold').setFontFamily('Courier New').setFontSize(10);
  sheet.setColumnWidth(newColNum, 80);
  Logger.log('migrateDueDay: Inserted Due_Day at column ' + newColNum + ' (after Required)');
  return 'OK: Due_Day added at column ' + newColNum;
}

// v28: One-time migration — creates KH_Grades tab with schema headers
function migrateGradesTab() {
  var ss = getKHSS_();
  var tabName = typeof TAB_MAP !== 'undefined' ? (TAB_MAP['KH_Grades'] || 'KH_Grades') : '🧹📅 KH_Grades';
  var existing = ss.getSheetByName(tabName);
  if (existing) {
    Logger.log('migrateGradesTab: Tab already exists — ' + tabName);
    return 'SKIP: ' + tabName + ' already exists';
  }
  var schema = KH_SCHEMAS['KH_Grades'];
  var sheet = ss.insertSheet(tabName);
  var hRange = sheet.getRange(1, 1, 1, schema.headers.length);
  hRange.setValues([schema.headers]);
  hRange.setBackground('#0f1923').setFontColor('#fbbf24')
    .setFontWeight('bold').setFontFamily('Courier New').setFontSize(10);
  for (var i = 0; i < schema.widths.length; i++) {
    sheet.setColumnWidth(i + 1, schema.widths[i]);
  }
  sheet.setFrozenRows(1);
  Logger.log('migrateGradesTab: Created ' + tabName + ' with ' + schema.headers.length + ' columns');
  return 'OK: Created ' + tabName;
}

function ensureKHRequestsTab_() {
  var sheet = getKHSheet_('KH_Requests');
  if (sheet) return sheet;
  // Auto-create KH_Requests if missing (tab added after initial setup)
  var ss = getKHSS_();
  var schema = KH_SCHEMAS['KH_Requests'];
  var tabName = typeof TAB_MAP !== 'undefined' ? (TAB_MAP['KH_Requests'] || 'KH_Requests') : 'KH_Requests';
  sheet = ss.insertSheet(tabName);
  sheet.getRange(1, 1, 1, schema.headers.length).setValues([schema.headers])
    .setBackground('#0f1923').setFontColor('#fbbf24').setFontWeight('bold').setFontFamily('Courier New').setFontSize(10);
  sheet.setFrozenRows(1);
  var titleIdx = schema.headers.indexOf('Title');
  var notesIdx = schema.headers.indexOf('Notes');
  var pnIdx = schema.headers.indexOf('Parent_Note');
  if (titleIdx >= 0) sheet.getRange(2, titleIdx + 1, 500, 1).setNumberFormat('@');
  if (notesIdx >= 0) sheet.getRange(2, notesIdx + 1, 500, 1).setNumberFormat('@');
  if (pnIdx >= 0) sheet.getRange(2, pnIdx + 1, 500, 1).setNumberFormat('@');
  console.log('KH_AUTO_CREATE', 'KH_Requests tab created automatically');
  return sheet;
}

function khSubmitRequest(child, type, title, amount, notes) {
  var childLower = String(child || '').toLowerCase();
  if (childLower !== 'buggsy' && childLower !== 'jj') {
    return JSON.stringify({ status: 'error', message: 'Invalid child: ' + child });
  }
  if (KH_REQUEST_TYPES.indexOf(type) < 0) {
    return JSON.stringify({ status: 'error', message: 'Invalid type: ' + type });
  }
  var lk = acquireLock_();
  if (!lk.acquired) return JSON.stringify({ status: 'locked', message: 'Try again.' });
  try {
    var sheet = ensureKHRequestsTab_();
    if (!sheet) return JSON.stringify({ error: 'KH_Requests could not be created' });
    var now = getNowISO_();
    var datePart = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss');
    var uid = childLower.toUpperCase() + '_' + type.toUpperCase() + '_' + datePart;
    var safeTitle = String(title || '').substring(0, 280);
    var safeNotes = String(notes || '').substring(0, 500);
    var safeAmount = (type === 'Money' || type === 'Purchase') ? (Number(amount) || 0) : 0;
    if ((type === 'Money' || type === 'Purchase') && safeAmount <= 0) {
      lk.lock.releaseLock();
      return JSON.stringify({ status: 'error', message: 'Amount must be greater than zero' });
    }
    // v24: Column order matches actual sheet: ...Status, Parent_Note, Date, Timestamp
    sheet.appendRow([uid, child, type, safeTitle, safeAmount, safeNotes, 'Pending', '', now, now]);
    console.log('KH_WRITE', JSON.stringify({ fn: 'khSubmitRequest', uid: uid, child: childLower, type: type }));
    stampKHHeartbeat_();
    return JSON.stringify({ status: 'ok', uid: uid });
  } finally {
    lk.lock.releaseLock();
  }
}


function khApproveRequest(requestUID) {
  var lk = acquireLock_();
  if (!lk.acquired) return JSON.stringify({ status: 'locked', message: 'Try again.' });
  try {
    var sheet = ensureKHRequestsTab_();
    if (!sheet) return JSON.stringify({ error: 'KH_Requests could not be created' });
    var data = sheet.getDataRange().getValues();
    var h = data[0].map(String);
    var uidCol = khCol_(h, 'Request_UID');
    var statusCol = khCol_(h, 'Status');
    var typeCol = khCol_(h, 'Type');
    var amountCol = khCol_(h, 'Amount');
    var childCol = khCol_(h, 'Child');
    var rowIdx = -1;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][uidCol] || '') === requestUID) { rowIdx = i + 1; break; }
    }
    if (rowIdx < 0) return JSON.stringify({ status: 'error', message: 'Request not found: ' + requestUID });
    var currentStatus = String(data[rowIdx - 1][statusCol] || '');
    if (currentStatus === 'Approved') return JSON.stringify({ status: 'ok', already: true });
    if (currentStatus === 'Denied') return JSON.stringify({ status: 'conflict', message: 'Already denied' });

    var type = String(data[rowIdx - 1][typeCol] || '');
    var amount = Number(data[rowIdx - 1][amountCol]) || 0;
    var reqChild = String(data[rowIdx - 1][childCol] || '').toLowerCase();

    // Money-type — check bank balance before approving
    if (type === 'Money' && amount > 0) {
      var bankBal = computeBankBalance_(reqChild);
      if (bankBal < amount) {
        return JSON.stringify({ status: 'insufficient', balance: bankBal, requested: amount });
      }
    }

    var now = getNowISO_();
    // v25: Batch write — modify data row in memory, single writeback
    data[rowIdx - 1][statusCol] = 'Approved';
    data[rowIdx - 1][khCol_(h, 'Timestamp')] = now;
    var pnCol = khCol_(h, 'Parent_Note');
    if (pnCol >= 0) data[rowIdx - 1][pnCol] = 'Approved by parent';
    sheet.getRange(rowIdx, 1, 1, h.length).setValues([data[rowIdx - 1]]);
    console.log('KH_WRITE', JSON.stringify({ fn: 'khApproveRequest', uid: requestUID, child: reqChild, type: type, amount: amount }));
    var _result = JSON.stringify({ status: 'ok', uid: requestUID, type: type, amount: amount });
    stampKHHeartbeat_();
    return _result;
  } finally {
    lk.lock.releaseLock();
  }
}


function khDenyRequest(requestUID, parentNote) {
  var lk = acquireLock_();
  if (!lk.acquired) return JSON.stringify({ status: 'locked', message: 'Try again.' });
  try {
    var sheet = ensureKHRequestsTab_();
    if (!sheet) return JSON.stringify({ error: 'KH_Requests could not be created' });
    var data = sheet.getDataRange().getValues();
    var h = data[0].map(String);
    var uidCol = khCol_(h, 'Request_UID');
    var statusCol = khCol_(h, 'Status');
    var rowIdx = -1;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][uidCol] || '') === requestUID) { rowIdx = i + 1; break; }
    }
    if (rowIdx < 0) return JSON.stringify({ status: 'error', message: 'Request not found: ' + requestUID });
    var currentStatus = String(data[rowIdx - 1][statusCol] || '');
    if (currentStatus === 'Denied') return JSON.stringify({ status: 'ok', already: true });
    if (currentStatus === 'Approved') return JSON.stringify({ status: 'conflict', message: 'Already approved' });
    var now = getNowISO_();
    // v25: Batch write — modify data row in memory, single writeback
    data[rowIdx - 1][statusCol] = 'Denied';
    data[rowIdx - 1][khCol_(h, 'Timestamp')] = now;
    if (parentNote) {
      data[rowIdx - 1][khCol_(h, 'Parent_Note')] = String(parentNote).substring(0, 500);
    }
    sheet.getRange(rowIdx, 1, 1, h.length).setValues([data[rowIdx - 1]]);
    console.log('KH_WRITE', JSON.stringify({ fn: 'khDenyRequest', uid: requestUID }));
    var _result = JSON.stringify({ status: 'ok', uid: requestUID });
    stampKHHeartbeat_();
    return _result;
  } finally {
    lk.lock.releaseLock();
  }
}


// Set/adjust piggy bank opening balance
function khSetBankOpening(child, amount) {
  var lk = acquireLock_();
  if (!lk.acquired) return JSON.stringify({ status: 'locked', message: 'Try again.' });
  try {
    var childLower = String(child || '').toLowerCase();
    if (childLower !== 'buggsy' && childLower !== 'jj') {
      return JSON.stringify({ status: 'error', message: 'Invalid child' });
    }
    var sheet = getKHSheet_('KH_Children');
    if (!sheet) return JSON.stringify({ error: 'KH_Children not found' });
    var data = sheet.getDataRange().getValues();
    var h = data[0].map(String);
    var boCol = khCol_(h, 'Bank_Opening');
    if (boCol < 0) return JSON.stringify({ error: 'Bank_Opening column not found in KH_Children' });
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][khCol_(h, 'Child')] || '').toLowerCase() === childLower) {
        sheet.getRange(i + 1, boCol + 1).setValue(Number(amount) || 0);
        console.log('KH_WRITE', JSON.stringify({ fn: 'khSetBankOpening', child: childLower, amount: amount }));
        stampKHHeartbeat_();
        return JSON.stringify({ status: 'ok', child: childLower, bankOpening: Number(amount) || 0 });
      }
    }
    return JSON.stringify({ status: 'error', message: 'Child not found: ' + child });
  } finally {
    lk.lock.releaseLock();
  }
}


// v16: Parent action — withdraw screen time minutes
function khDebitScreenTime(child, screenType, minutes) {
  var childLower = String(child || '').toLowerCase();
  if (childLower !== 'buggsy' && childLower !== 'jj') {
    return JSON.stringify({ status: 'error', message: 'Invalid child' });
  }
  if (screenType !== 'TV' && screenType !== 'Gaming') {
    return JSON.stringify({ status: 'error', message: 'Invalid screen type: ' + screenType });
  }
  var mins = Number(minutes) || 0;
  if (mins <= 0) {
    return JSON.stringify({ status: 'error', message: 'Minutes must be positive' });
  }

  var lk = acquireLock_();
  if (!lk.acquired) return JSON.stringify({ status: 'locked', message: 'Try again.' });
  try {
    var stBal = computeScreenTimeBalances_(childLower, false);
    var available = (stBal[childLower] && stBal[childLower][screenType]) ? stBal[childLower][screenType].balance : 0;
    if (available < mins) {
      return JSON.stringify({ status: 'insufficient', balance: available, requested: mins });
    }

    var sheet = getKHSheet_('KH_ScreenTime');
    if (!sheet) return JSON.stringify({ error: 'KH_ScreenTime not found' });

    var today = getTodayISO_();
    var now   = getNowISO_();
    var uid   = childLower + '_STW_' + screenType + '_' + now.replace(/[^0-9]/g, '');
    sheet.appendRow([uid, child, screenType, mins, 'withdrawal', 'parent_debit', today, now]);

    var newBalance = available - mins;
    console.log('KH_WRITE', JSON.stringify({ fn: 'khDebitScreenTime', uid: uid, child: childLower, type: screenType, debited: mins, newBalance: newBalance }));
    var _result = JSON.stringify({ status: 'ok', uid: uid, child: childLower, type: screenType, debited: mins, newBalance: newBalance });
    stampKHHeartbeat_();
    return _result;
  } finally {
    lk.lock.releaseLock();
  }
}


// v18: Internal helper — writes a deposit row to KH_ScreenTime (auto-creates tab if missing)
function depositScreenTime_(child, screenType, minutes, source) {
  var sheet = getKHSheet_('KH_ScreenTime');
  if (!sheet) {
    // v18: Auto-create KH_ScreenTime tab so deposits don't silently fail
    var ss = getKHSS_();
    var tabName = typeof TAB_MAP !== 'undefined' ? (TAB_MAP['KH_ScreenTime'] || 'KH_ScreenTime') : 'KH_ScreenTime';
    var schema = KH_SCHEMAS['KH_ScreenTime'];
    sheet = ss.insertSheet(tabName);
    var hRange = sheet.getRange(1, 1, 1, schema.headers.length);
    hRange.setValues([schema.headers]);
    hRange.setBackground('#0f1923').setFontColor('#fbbf24')
      .setFontWeight('bold').setFontFamily('Courier New').setFontSize(10);
    for (var wi = 0; wi < schema.widths.length; wi++) {
      sheet.setColumnWidth(wi + 1, schema.widths[wi]);
    }
    sheet.setFrozenRows(1);
    console.log('KH_AUTO_CREATE', 'KH_ScreenTime tab created automatically');
  }
  var today = getTodayISO_();
  var now   = getNowISO_();
  var uid   = String(child).toLowerCase() + '_ST_' + screenType + '_' + now.replace(/[^0-9]/g, '');
  sheet.appendRow([uid, child, screenType, minutes, 'deposit', source, today, now]);
  console.log('KH_WRITE', JSON.stringify({ fn: 'depositScreenTime_', uid: uid, child: child, type: screenType, minutes: minutes }));
}


// v17: Parent creates a one-off bonus task from ThePulse
function khAddBonusTask(child, taskName, points, icon, timeOfDay) {
  var lk = acquireLock_();
  if (!lk.acquired) return JSON.stringify({ status: 'locked', message: 'Try again.' });
  try {
    var sheet = getKHSheet_('KH_Chores');
    if (!sheet) return JSON.stringify({ error: 'KH_Chores not found' });
    var h = getKHHeaders_(sheet);
    var childLower = String(child || '').toLowerCase();
    if (childLower !== 'buggsy' && childLower !== 'jj') {
      return JSON.stringify({ error: 'Invalid child: ' + child });
    }
    var name = String(taskName || '').trim();
    if (!name) return JSON.stringify({ error: 'Task name is required' });
    var pts = Math.max(1, Math.min(500, parseInt(points) || 25));
    var icn = String(icon || '⭐').trim() || '⭐';
    var tod = String(timeOfDay || '2-Afternoon');
    var today = getTodayISO_();
    var taskID = 'BONUS_' + childLower + '_' + today + '_' + Date.now().toString(36);
    var row = [];
    for (var i = 0; i < h.length; i++) {
      var col = h[i];
      if (col === 'Child')            row.push(childLower === 'buggsy' ? 'Buggsy' : 'JJ');
      else if (col === 'Task')        row.push(name);
      else if (col === 'Task_ID')     row.push(taskID);
      else if (col === 'Task_Order')  row.push(tod);
      else if (col === 'Category')    row.push('Bonus');
      else if (col === 'Icon')        row.push(icn);
      else if (col === 'Points')      row.push(pts);
      else if (col === 'TV_Minutes')  row.push(0);
      else if (col === 'Money')       row.push(0);
      else if (col === 'Snacks')      row.push(0);
      else if (col === 'Frequency')   row.push('One-Time');
      else if (col === 'Active')      row.push(true);
      else if (col === 'Required')    row.push(false);
      else if (col === 'Bonus_Multiplier') row.push(1);
      else if (col === 'Streak_Threshold') row.push(0);
      else if (col === 'Max_Bonus_Per_Week') row.push(0);
      else if (col === 'Completed')   row.push(false);
      else if (col === 'Completed_Date') row.push('');
      else if (col === 'Parent_Approved') row.push(false);
      else row.push('');
    }
    sheet.appendRow(row);
    console.log('KH_WRITE', JSON.stringify({ fn: 'khAddBonusTask', taskID: taskID, child: childLower, task: name, points: pts }));
    var _result = JSON.stringify({ status: 'ok', taskID: taskID, child: childLower, task: name, points: pts });
    stampKHHeartbeat_();
    return _result;
  } finally {
    lk.lock.releaseLock();
  }
}


// ── HISTORY HELPERS ─────────────────────────────────────────────

function appendHistory_(uid, taskID, child, task, points, basePoints, mult, eventType, date, timestamp) {
  var sheet = getKHSheet_('KH_History');
  if (!sheet) return;
  sheet.appendRow([uid, taskID, child, task, points, basePoints, mult, eventType, date, timestamp]);
}

function historyUIDExists_(uid) {
  var data = readSheet_('KH_History');
  if (!data || data.length < 2) return false;
  var h = data[0].map(String);
  var uidCol = khCol_(h, 'Completion_UID');
  if (uidCol < 0) return false;
  // v24: Limit scan to last 200 rows (BUG-004 — unbounded scan was O(n) time bomb)
  var scanStart = Math.max(1, data.length - 200);
  for (var i = data.length - 1; i >= scanStart; i--) {
    if (String(data[i][uidCol]) === uid) return true;
  }
  return false;
}

function redemptionUIDExists_(uid) {
  var sheet = getKHSheet_('KH_Redemptions');
  if (!sheet) return false;
  var data = sheet.getDataRange().getValues();
  var h = data[0].map(String);
  var uidCol = khCol_(h, 'Redemption_UID');
  if (uidCol < 0) return false;
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][uidCol]) === uid) return true;
  }
  return false;
}


function updateStreakCache_(child, taskID, dateISO) {
  var sheet = getKHSheet_('KH_Streaks');
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  var h = data[0].map(String);
  var childCol     = khCol_(h, 'Child');
  var taskIDCol    = khCol_(h, 'Task_ID');
  var streakCol    = khCol_(h, 'Current_Streak');
  var lastCompCol  = khCol_(h, 'Last_Completed_Date');
  var lastCalcCol  = khCol_(h, 'Last_Computed_Date');
  var rowIdx = -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][childCol]  || '').toLowerCase() === child.toLowerCase() &&
        String(data[i][taskIDCol] || '') === taskID) {
      rowIdx = i + 1; break;
    }
  }
  if (rowIdx > 0) {
    var lastDate     = String(data[rowIdx - 1][lastCompCol] || '');
    var currentStreak = Number(data[rowIdx - 1][streakCol]) || 0;
    var newStreak = 1;
    if (lastDate) {
      var last = new Date(lastDate);
      var curr = new Date(dateISO);
      var diffDays = Math.round((curr - last) / (1000 * 60 * 60 * 24));
      if (diffDays <= 1) newStreak = currentStreak + 1;
    }
    // v25: Batch write — modify data row in memory, single writeback
    data[rowIdx - 1][streakCol] = newStreak;
    data[rowIdx - 1][lastCompCol] = dateISO;
    data[rowIdx - 1][lastCalcCol] = dateISO;
    sheet.getRange(rowIdx, 1, 1, h.length).setValues([data[rowIdx - 1]]);
  } else {
    sheet.appendRow([child, taskID, 1, dateISO, dateISO]);
  }
}


function khVerifyPin(pin) {
  var config = readChildConfig_();
  var storedPin = '';
  var keys = Object.keys(config);
  for (var i = 0; i < keys.length; i++) {
    if (config[keys[i]].parentPin) { storedPin = config[keys[i]].parentPin; break; }
  }
  if (!storedPin) storedPin = '1234';
  return String(pin).trim() === storedPin.trim();
}


function getKHAppUrls() {
  var base = ScriptApp.getService().getUrl();
  return JSON.stringify({
    buggsy: base + '?page=kidshub&child=buggsy',
    jj:     base + '?page=kidshub&child=jj',
    parent: base + '?page=kidshub&view=parent'
  });
}


// ════════════════════════════════════════════════════════════════════
// ALLOWANCE LOG — MTD approved-chore money breakdown per child
// Called by getKidsAllowanceLogSafe() wrapper in Code.gs.
// Rebuilt in KidsHub.gs v21 (was dead code in DataEngine using stale SSID).
// ════════════════════════════════════════════════════════════════════

function getKidsAllowanceLog() {
  var sheet = getKHSheet_('KH_Chores');
  if (!sheet) return { error: 'KH_Chores sheet not found' };

  var now = new Date();
  var monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  var tz = Session.getScriptTimeZone();
  var monthLabel = Utilities.formatDate(now, tz, 'MMMM yyyy');

  var data = sheet.getDataRange().getValues();
  var headers = getKHHeaders_(sheet);

  var log = { buggsy: [], jj: [], summary: {} };
  var buggsyTotal = 0, jjTotal = 0;

  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    var task = String(r[khCol_(headers, 'Task')] || '').trim();
    if (!task) continue;

    var active = String(r[khCol_(headers, 'Active')] || '').toUpperCase();
    if (active !== 'YES') continue;

    var approved = r[khCol_(headers, 'Parent_Approved')] === true ||
                   String(r[khCol_(headers, 'Parent_Approved')]).toUpperCase() === 'TRUE';
    if (!approved) continue;

    var compRaw = r[khCol_(headers, 'Completed_Date')];
    if (!compRaw) continue;
    var compDate = compRaw instanceof Date ? compRaw : new Date(String(compRaw).trim());
    if (isNaN(compDate.getTime()) || compDate < monthStart) continue;

    var money = Number(r[khCol_(headers, 'Money')] || 0);
    var child = String(r[khCol_(headers, 'Child')] || '').trim().toLowerCase();
    var category = String(r[khCol_(headers, 'Category')] || '');
    var points = Number(r[khCol_(headers, 'Points')] || 0);

    var entry = {
      date: Utilities.formatDate(compDate, tz, 'yyyy-MM-dd'),
      task: task,
      category: category,
      points: points,
      money: Math.round(money * 100) / 100
    };

    if (child === 'buggsy') { log.buggsy.push(entry); buggsyTotal += money; }
    else if (child === 'jj') { log.jj.push(entry); jjTotal += money; }
  }

  log.buggsy.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
  log.jj.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });

  log.summary = {
    buggsyMTD:  Math.round(buggsyTotal * 100) / 100,
    jjMTD:      Math.round(jjTotal * 100) / 100,
    totalMTD:   Math.round((buggsyTotal + jjTotal) * 100) / 100,
    month:      monthLabel,
    asOf:       now.toISOString()
  };

  return log;
}


// ════════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ════════════════════════════════════════════════════════════════════

function khHealthCheck() {
  var ss = getKHSS_();
  var results = {
    status: 'ok',
    version: 'KidsHub.gs v26',
    timestamp: getNowISO_(),
    tabs: {},
    issues: []
  };

  var schemaKeys = Object.keys(KH_SCHEMAS);
  for (var sk = 0; sk < schemaKeys.length; sk++) {
    var tabKey = schemaKeys[sk];
    var schema = KH_SCHEMAS[tabKey];
    var tabName = typeof TAB_MAP !== 'undefined' ? (TAB_MAP[tabKey] || tabKey) : tabKey;
    var sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      results.tabs[tabKey] = { present: false, rows: 0 };
      results.issues.push('MISSING TAB: ' + tabKey + ' (expected: ' + tabName + ')');
      results.status = 'error';
      continue;
    }
    var actualHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
    var missingCols = schema.headers.filter(function(hdr) { return actualHeaders.indexOf(hdr) < 0; });
    results.tabs[tabKey] = {
      present: true,
      rows: Math.max(sheet.getLastRow() - 1, 0),
      columns: actualHeaders.length,
      expected: schema.headers.length,
      missingCols: missingCols
    };
    if (missingCols.length > 0) {
      results.issues.push('SCHEMA MISMATCH: ' + tabKey + ' missing: ' + missingCols.join(', '));
      results.status = 'warning';
    }
  }

  var choresSheet = getKHSheet_('KH_Chores');
  if (choresSheet) {
    var cData = choresSheet.getDataRange().getValues();
    var cH = cData[0].map(String);
    var idCol = khCol_(cH, 'Task_ID');
    var blankIDs = 0;
    for (var bi = 1; bi < cData.length; bi++) {
      if (!String(cData[bi][idCol] || '').trim()) blankIDs++;
    }
    results.blankTaskIDs = blankIDs;
    if (blankIDs > 0) {
      results.issues.push('BLANK TASK_IDs: ' + blankIDs);
      results.status = 'warning';
    }
    var pending = 0;
    for (var pi = 1; pi < cData.length; pi++) {
      var pd = cData[pi][khCol_(cH, 'Completed')] === true || String(cData[pi][khCol_(cH, 'Completed')]).toUpperCase() === 'TRUE';
      var pa = cData[pi][khCol_(cH, 'Parent_Approved')] === true || String(cData[pi][khCol_(cH, 'Parent_Approved')]).toUpperCase() === 'TRUE';
      if (pd && !pa) pending++;
    }
    results.pendingApprovals = pending;
  }

  var histSheet = getKHSheet_('KH_History');
  if (histSheet && histSheet.getLastRow() > 1) {
    var hData = histSheet.getDataRange().getValues();
    var hH = hData[0].map(String);
    results.lastHistoryEntry = String(hData[hData.length - 1][khCol_(hH, 'Timestamp')] || 'none');
  } else {
    results.lastHistoryEntry = 'none';
  }

  results.balances = computeBalances_('all', true);

  results.bankBalances = {
    buggsy: computeBankBalance_('buggsy'),
    jj: computeBankBalance_('jj')
  };

  var reqSheet = getKHSheet_('KH_Requests');
  if (reqSheet && reqSheet.getLastRow() > 1) {
    var rData = reqSheet.getDataRange().getValues();
    var rH = rData[0].map(String);
    var pendReq = 0;
    for (var pri = 1; pri < rData.length; pri++) {
      if (String(rData[pri][khCol_(rH, 'Status')] || '') === 'Pending') pendReq++;
    }
    results.pendingRequests = pendReq;
  } else {
    results.pendingRequests = 0;
  }

  return JSON.stringify(results, null, 2);
}


// ════════════════════════════════════════════════════════════════════
// v29: CURRICULUM ENGINE — auto-create tab + daily content reader
// ════════════════════════════════════════════════════════════════════

// Ensures the 💻 Curriculum tab exists with the correct header row.
// Called lazily by getTodayContent_ and seedWeek1Curriculum.
function ensureCurriculumTab_() {
  var ss = getKHSS_();
  var tabName = (typeof TAB_MAP !== 'undefined' && TAB_MAP['Curriculum']) || '💻 Curriculum';
  var sheet = ss.getSheetByName(tabName);
  if (sheet) return sheet;

  sheet = ss.insertSheet(tabName);
  sheet.getRange('A1:D1').setValues([['WeekNumber', 'Child', 'StartDate', 'ContentJSON']]);
  sheet.getRange('A1:D1').setFontWeight('bold');
  sheet.setColumnWidth(1, 100);
  sheet.setColumnWidth(2, 80);
  sheet.setColumnWidth(3, 110);
  sheet.setColumnWidth(4, 600);
  Logger.log('✅ Curriculum tab created: ' + tabName);
  return sheet;
}


// Reads today's curriculum content for a child.
// Returns parsed JSON for today's day-of-week content, or null if no data.
function getTodayContent_(child) {
  var sheet = ensureCurriculumTab_();
  if (sheet.getLastRow() < 2) return null;

  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(String);
  var childCol = headers.indexOf('Child');
  var startCol = headers.indexOf('StartDate');
  var jsonCol = headers.indexOf('ContentJSON');
  if (childCol === -1 || startCol === -1 || jsonCol === -1) return null;

  var today = new Date();
  var todayStr = Utilities.formatDate(today, 'America/Chicago', 'yyyy-MM-dd');
  var dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ... 5=Fri, 6=Sat
  var dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  var todayName = dayNames[dayOfWeek];

  // Find the most recent week row for this child where StartDate <= today
  var bestRow = null;
  for (var i = 1; i < data.length; i++) {
    var rowChild = String(data[i][childCol]).toLowerCase();
    if (rowChild !== child.toLowerCase()) continue;

    var rowStart = data[i][startCol];
    var startStr = '';
    if (rowStart instanceof Date) {
      startStr = Utilities.formatDate(rowStart, 'America/Chicago', 'yyyy-MM-dd');
    } else {
      startStr = String(rowStart);
    }

    if (startStr <= todayStr) {
      bestRow = data[i];
    }
  }

  if (!bestRow) return null;

  try {
    var weekContent = JSON.parse(bestRow[jsonCol]);
    // Return today's content slice
    return weekContent[todayName] || weekContent[todayName.charAt(0).toUpperCase() + todayName.slice(1)] || null;
  } catch (e) {
    Logger.log('getTodayContent_: JSON parse error for ' + child + ': ' + e.message);
    return null;
  }
}


// Seeds Week 1 curriculum for both kids.
// Run once from Script Editor to populate the Curriculum tab.
function seedWeek1Curriculum() {
  var sheet = ensureCurriculumTab_();

  // Check if already seeded
  if (sheet.getLastRow() >= 3) {
    Logger.log('Curriculum tab already has data (' + (sheet.getLastRow() - 1) + ' rows). Skipping seed.');
    return { status: 'skipped', rows: sheet.getLastRow() - 1 };
  }

  var buggsy = {
    monday: {
      math: { topic: 'Multiplication & Division Review', problems: ['48 x 6 = ?', '324 / 4 = ?', '57 x 8 = ?', '756 / 9 = ?', 'Write a word problem using 12 x 7'], standard: 'TEKS 4.4F' },
      reading: { passage: 'Read Chapter 1 of your AR book (20 min)', prompt: 'Write 3 sentences: Who is the main character? What is the setting? What problem do they face?', standard: 'TEKS 4.6A' },
      spelling: ['adventure', 'journey', 'mysterious', 'enormous', 'courageous', 'brilliant', 'discover', 'imagine', 'knowledge', 'creature']
    },
    tuesday: {
      science: { topic: 'Earth Materials — Rocks & Minerals', questions: ['Name the 3 types of rocks and give one example of each.', 'How does weathering change rocks over time?', 'Draw and label the rock cycle.'], standard: 'TEKS 4.7A' },
      reading: { passage: 'Continue AR book (20 min)', prompt: 'Summarize what happened in today\'s reading in 4-5 sentences. Use sequence words (first, then, next, finally).', standard: 'TEKS 4.6B' },
      socialStudies: { topic: 'Texas Regions', question: 'Name the 4 regions of Texas. Which region do we live in? Draw a simple map.' }
    },
    wednesday: {
      math: { topic: 'Fractions — Comparing & Equivalent', problems: ['Which is larger: 3/4 or 5/8? Show your work.', 'Find 3 fractions equivalent to 2/3.', 'Order from least to greatest: 1/2, 3/8, 5/6, 1/4', 'Add: 2/5 + 1/5 = ?', 'Subtract: 7/8 - 3/8 = ?'], standard: 'TEKS 4.3C' },
      writing: { prompt: 'Write a short paragraph (5-7 sentences) about your favorite weekend activity. Use at least 2 adjectives and 1 simile.', standard: 'TEKS 4.11A' },
      spelling: ['review Monday words — write each in a sentence']
    },
    thursday: {
      science: { topic: 'Weather & Water Cycle', questions: ['Draw and label the 4 stages of the water cycle.', 'What is the difference between weather and climate?', 'How does the sun drive the water cycle?'], standard: 'TEKS 4.8A' },
      reading: { passage: 'Continue AR book (20 min)', prompt: 'Find 3 vocabulary words from your reading. Write the word, what you think it means, and use it in your own sentence.', standard: 'TEKS 4.2B' },
      storyTime: { activity: 'Read JJ a bedtime story from the Story Library', link: '?page=story-library&child=buggsy' }
    },
    friday: {
      math: { topic: 'Word Problems & Review', problems: ['Maria has 234 stickers. She gives 18 to each of 6 friends. How many does she have left?', 'A rectangle is 12 cm long and 8 cm wide. What is the perimeter? What is the area?', 'Challenge: If you save $3.50 each week, how much will you have after 8 weeks?'], standard: 'TEKS 4.4H, 4.5D' },
      writing: { prompt: 'Free write Friday! Write about anything you want for 15 minutes. Aim for at least 10 sentences.', standard: 'TEKS 4.11A' },
      vocab: { words: ['adventure', 'journey', 'mysterious', 'enormous', 'courageous'], activity: 'Quiz yourself — cover the word, read the definition, try to spell it' }
    }
  };

  var jj = {
    monday: {
      letters: { focus: 'A and B', activities: ['Trace uppercase A and lowercase a (5 times each)', 'Trace uppercase B and lowercase b (5 times each)', 'Find 3 things that start with A, find 3 things that start with B'] },
      numbers: { focus: '1-5', activities: ['Count objects: put 1 apple, 2 bananas, 3 oranges, 4 grapes, 5 berries in a line', 'Trace numbers 1-5 (3 times each)', 'Hold up fingers: show me 3, show me 5, show me 1'] },
      colors: { focus: 'Red and Blue', activity: 'Find 5 red things and 5 blue things in the house' }
    },
    tuesday: {
      letters: { focus: 'C and D', activities: ['Trace uppercase C and lowercase c (5 times each)', 'Trace uppercase D and lowercase d (5 times each)', 'C is for Cat — draw a cat! D is for Dog — draw a dog!'] },
      shapes: { focus: 'Circle and Square', activities: ['Find circles and squares around the house', 'Draw 3 circles and 3 squares', 'Sort blocks into circles and not-circles'] },
      motor: { activity: 'Practice cutting with safety scissors — cut along straight and curved lines on practice paper' }
    },
    wednesday: {
      letters: { focus: 'E and F', activities: ['Trace uppercase E and lowercase e (5 times each)', 'Trace uppercase F and lowercase f (5 times each)', 'E is for Elephant — how many letters in ELEPHANT?'] },
      numbers: { focus: '6-10', activities: ['Count 6 blocks, 7 crayons, 8 stickers, 9 buttons, 10 coins', 'Trace numbers 6-10 (3 times each)', 'Clap your hands: clap 7 times, clap 10 times'] },
      art: { activity: 'Rainbow painting — paint a rainbow using red, orange, yellow, green, blue, purple' }
    },
    thursday: {
      letters: { focus: 'Review A-F', activities: ['Sing the ABC song stopping at F', 'Point to letters A through F on an alphabet chart', 'Match uppercase to lowercase: A-a, B-b, C-c, D-d, E-e, F-f'] },
      storyTime: { activity: 'Listen to a bedtime story from the Story Library', link: '?page=story-library&child=jj' },
      rhyming: { activity: 'Rhyme time! What rhymes with: cat, dog, bed, sun, hop?' }
    },
    friday: {
      numbers: { focus: 'Review 1-10', activities: ['Count to 10 forward and backward', 'Find the number: hold up cards 1-10, say a number, pick the right card', 'How many? Count items in groups around the room'] },
      colors: { focus: 'Review Red, Blue + add Yellow and Green', activity: 'Color scavenger hunt — find 3 of each color in the house' },
      motor: { activity: 'Play-doh letters — make the letters A through F out of Play-doh' },
      reward: 'Fun Friday! If all activities done Mon-Thu, pick a special game or activity'
    }
  };

  var buggsynJSON = JSON.stringify(buggsy);
  var jjJSON = JSON.stringify(jj);

  sheet.getRange(2, 1, 2, 4).setValues([
    [1, 'buggsy', '2026-03-31', buggsynJSON],
    [1, 'jj',     '2026-03-31', jjJSON]
  ]);

  Logger.log('✅ Week 1 curriculum seeded for Buggsy and JJ (StartDate: 2026-03-31).');
  return { status: 'seeded', buggsynSize: buggsynJSON.length, jjSize: jjJSON.length };
}


// v29: Add the "Read JJ bedtime story" chore to the live KH_Chores sheet.
// Run once from Script Editor. Idempotent — skips if BUGG_BEDTIME_STORY already exists.
function addBedtimeStoryChore() {
  var lk = acquireLock_();
  if (!lk.acquired) return { status: 'locked', message: 'Try again.' };
  try {
    var sheet = getKHSheet_('KH_Chores');
    if (!sheet) return { error: 'KH_Chores not found' };

    // Check for duplicate
    var data = sheet.getDataRange().getValues();
    var headers = data[0].map(String);
    var idCol = headers.indexOf('Task_ID');
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][idCol]) === 'BUGG_BEDTIME_STORY') {
        Logger.log('Bedtime story chore already exists. Skipping.');
        return { status: 'exists' };
      }
    }

    // Matches KH_SCHEMAS.KH_Chores.headers order exactly:
    // Child, Task, Task_ID, Task_Order, Category, Icon, Points,
    // TV_Minutes, Money, Snacks, Frequency, Active, Required,
    // Due_Day, Bonus_Multiplier, Streak_Threshold, Max_Bonus_Per_Week,
    // Completed, Completed_Date, Parent_Approved
    sheet.appendRow([
      'Buggsy', 'Read JJ bedtime story', 'BUGG_BEDTIME_STORY', '3-Evening',
      'School', '📖', 3,
      0, 0.00, 0, 'Daily', 'YES', 'NO',
      1, 1, 5, 2,
      false, '', false
    ]);

    stampKHHeartbeat_();
    Logger.log('✅ Bedtime story chore added for Buggsy.');
    return { status: 'added' };
  } finally {
    lk.lock.releaseLock();
  }
}


// v29: AUDIO BATCH LOADER + PROGRESS REPORT
// ════════════════════════════════════════════════════════════════════

var AUDIO_FOLDER_ID = '1rXWVBD9QMruWOj6AlNB4mY2E9wzWGctm';

/**
 * v29: Batch audio preload — returns { filename: base64 } map.
 * Max 50 files per call. Used by SparkleLearn audio wiring.
 */
function getAudioBatchSafe(filenames) {
  return withMonitor_('getAudioBatchSafe', function() {
    if (!filenames || !Array.isArray(filenames) || filenames.length === 0) {
      return { error: 'No filenames provided' };
    }
    var maxFiles = 50;
    var toFetch = filenames.slice(0, maxFiles);
    var folder = DriveApp.getFolderById(AUDIO_FOLDER_ID);
    var result = {};
    var fileIndex = buildFileIndex_(folder);
    for (var i = 0; i < toFetch.length; i++) {
      var fname = toFetch[i];
      if (fileIndex[fname]) {
        try {
          var blob = fileIndex[fname].getBlob();
          result[fname] = Utilities.base64Encode(blob.getBytes());
        } catch (e) {
          Logger.log('getAudioBatchSafe: Failed to read ' + fname + ': ' + e.message);
        }
      }
    }
    return JSON.parse(JSON.stringify(result));
  });
}

/**
 * v29: Private helper — indexes MP3 files across folder + one level of subfolders.
 */
function buildFileIndex_(folder) {
  var index = {};
  var files = folder.getFilesByType('audio/mpeg');
  while (files.hasNext()) {
    var f = files.next();
    index[f.getName()] = f;
  }
  var allFiles = folder.getFiles();
  while (allFiles.hasNext()) {
    var af = allFiles.next();
    var name = af.getName();
    if (name.indexOf('.mp3') === name.length - 4 && !index[name]) {
      index[name] = af;
    }
  }
  var subfolders = folder.getFolders();
  while (subfolders.hasNext()) {
    var sub = subfolders.next();
    var subFiles = sub.getFiles();
    while (subFiles.hasNext()) {
      var sf = subFiles.next();
      var sName = sf.getName();
      if (sName.indexOf('.mp3') === sName.length - 4 && !index[sName]) {
        index[sName] = sf;
      }
    }
  }
  return index;
}

/**
 * v29: Deployment health check — returns array of missing filenames.
 */
function verifyAudioFiles(expectedFilenames) {
  var folder = DriveApp.getFolderById(AUDIO_FOLDER_ID);
  var index = buildFileIndex_(folder);
  var missing = [];
  for (var i = 0; i < expectedFilenames.length; i++) {
    if (!index[expectedFilenames[i]]) {
      missing.push(expectedFilenames[i]);
    }
  }
  return missing;
}

/**
 * v29: Progress report data stub — called by ProgressReport.html.
 * Returns skeleton data structure. Wire to real sheet data when
 * KH_Homework and KH_SparkleProgress sheets have data flowing.
 */
function getWeeklyProgressSafe() {
  return withMonitor_('getWeeklyProgressSafe', function() {
    var ss = SpreadsheetApp.openById(SSID);
    var today = new Date();
    var dayOfWeek = today.getDay();
    var mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    var monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    var result = {
      buggsy: {
        name: 'Buggsy',
        ringsThisWeek: 0,
        ringsTotal: 0,
        streak: 0,
        completionRate: 0,
        sessionsCompleted: 0,
        sessionsTotal: 5,
        avgScore: 0,
        timeSpent: 0,
        subjects: [],
        weekLog: [],
        alerts: []
      },
      jj: {
        name: 'JJ (Kindle)',
        starsThisWeek: 0,
        starsTotal: 0,
        streak: 0,
        completionRate: 0,
        sessionsCompleted: 0,
        sessionsTotal: 5,
        milestones: [],
        weekLog: [],
        alerts: []
      }
    };

    // TODO: Read from KH_Homework sheet, aggregate by week
    // TODO: Read from KH_SparkleProgress sheet for JJ data
    // TODO: Calculate streaks from consecutive completion dates
    // TODO: Generate alerts based on score thresholds

    return JSON.parse(JSON.stringify(result));
  });
}


// ════════════════════════════════════════════════════════════════════
// v29: CURRICULUM ENGINE — Daily content serving
// ════════════════════════════════════════════════════════════════════

var CURRICULUM_HEADERS = ['WeekNumber', 'Child', 'StartDate', 'ContentJSON'];
var DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * v29: Auto-create the Curriculum tab if it doesn't exist.
 * Safe to run multiple times — skips if tab already exists.
 */
function ensureCurriculumTab_() {
  var ss = SpreadsheetApp.openById(SSID);
  var tabName = TAB_MAP['Curriculum'] || 'Curriculum';
  var sheet = null;
  try { sheet = ss.getSheetByName(tabName); } catch(e) {}
  if (sheet) return sheet;

  sheet = ss.insertSheet(tabName);
  var headerRange = sheet.getRange(1, 1, 1, CURRICULUM_HEADERS.length);
  headerRange.setValues([CURRICULUM_HEADERS]);
  headerRange.setBackground('#0f1923').setFontColor('#fbbf24')
    .setFontWeight('bold').setFontFamily('Courier New').setFontSize(10);
  sheet.setColumnWidth(1, 100);  // WeekNumber
  sheet.setColumnWidth(2, 80);   // Child
  sheet.setColumnWidth(3, 120);  // StartDate
  sheet.setColumnWidth(4, 600);  // ContentJSON
  sheet.setFrozenRows(1);
  Logger.log('ensureCurriculumTab_: Created ' + tabName);
  return sheet;
}

/**
 * v29: Get today's content for a child from the Curriculum tab.
 * Reads rows, finds the current week by comparing today to StartDate,
 * parses ContentJSON, and returns today's entry based on day of week.
 * Returns { content: {...}, day: 'monday', week: 1 } or { error: '...' }.
 */
function getTodayContentSafe(child) {
  return withMonitor_('getTodayContentSafe', function() {
    var ss = SpreadsheetApp.openById(SSID);
    var tabName = TAB_MAP['Curriculum'] || 'Curriculum';
    var sheet;
    try { sheet = ss.getSheetByName(tabName); } catch(e) {}
    if (!sheet || sheet.getLastRow() < 2) {
      return { error: 'No curriculum data found. Ask Dad to load this week\'s missions.' };
    }

    var data = sheet.getDataRange().getValues();
    var h = data[0].map(String);
    var cWeek  = h.indexOf('WeekNumber');
    var cChild = h.indexOf('Child');
    var cStart = h.indexOf('StartDate');
    var cJSON  = h.indexOf('ContentJSON');

    if (cChild === -1 || cStart === -1 || cJSON === -1) {
      return { error: 'Curriculum tab missing required columns.' };
    }

    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var dayOfWeek = today.getDay();
    var dayKey = DAY_KEYS[dayOfWeek];
    var childLower = String(child).toLowerCase();

    // Find the current week's row: StartDate <= today < StartDate + 7
    var bestRow = null;
    for (var i = 1; i < data.length; i++) {
      var rowChild = String(data[i][cChild] || '').toLowerCase();
      if (rowChild !== childLower) continue;

      var startDate = data[i][cStart];
      if (startDate instanceof Date) {
        startDate.setHours(0, 0, 0, 0);
      } else {
        startDate = new Date(startDate);
        startDate.setHours(0, 0, 0, 0);
      }
      if (isNaN(startDate.getTime())) continue;

      var endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      if (today >= startDate && today < endDate) {
        bestRow = data[i];
        break;
      }
    }

    if (!bestRow) {
      return { error: 'No curriculum loaded for this week. Ask Dad to load this week\'s missions.' };
    }

    var jsonStr = String(bestRow[cJSON] || '');
    if (!jsonStr) {
      return { error: 'Curriculum row found but ContentJSON is empty.' };
    }

    var weekContent;
    try {
      weekContent = JSON.parse(jsonStr);
    } catch (e) {
      return { error: 'Curriculum JSON parse error: ' + e.message };
    }

    // Look for today's content by day key
    var todayContent = weekContent[dayKey] || weekContent[dayKey.charAt(0).toUpperCase() + dayKey.slice(1)] || null;

    return JSON.parse(JSON.stringify({
      content: todayContent,
      fullWeek: weekContent,
      day: dayKey,
      week: bestRow[cWeek] || 0,
      child: childLower
    }));
  });

}

// ╔══════════════════════════════════════════════════════════════════╗
// ║  v30: Batch Approve — approve multiple completed tasks at once  ║
// ╚══════════════════════════════════════════════════════════════════╝

function kh_batchApprove_(rowIndices, approver) {
  var sheet = getKHSheet_('KH_Chores');
  if (!sheet) return { error: true, message: 'KH_Chores not found' };
  var h = getKHHeaders_(sheet);
  var today = getTodayISO_();
  var now = getNowISO_();
  var approved = 0;
  var skipped = 0;

  for (var i = 0; i < rowIndices.length; i++) {
    var rowIndex = parseInt(rowIndices[i]);
    if (isNaN(rowIndex) || rowIndex < 2) { skipped++; continue; }
    var row = sheet.getRange(rowIndex, 1, 1, h.length).getValues()[0];
    var alreadyApproved = row[khCol_(h, 'Parent_Approved')] === true ||
      String(row[khCol_(h, 'Parent_Approved')]).toUpperCase() === 'TRUE';
    if (alreadyApproved) { skipped++; continue; }

    var completed = row[khCol_(h, 'Completed')] === true ||
      String(row[khCol_(h, 'Completed')]).toUpperCase() === 'TRUE';
    if (!completed) { skipped++; continue; }

    var taskID = String(row[khCol_(h, 'Task_ID')] || '');
    var child  = String(row[khCol_(h, 'Child')]   || '');
    var task   = String(row[khCol_(h, 'Task')]    || '');
    var approvalUID = taskID + '_' + today + '_' + child.toLowerCase() + '_approval';
    if (historyUIDExists_(approvalUID)) { skipped++; continue; }

    var basePoints = Number(row[khCol_(h, 'Points')]) || 0;
    var mult = Math.max(1, parseFloat(row[khCol_(h, 'Bonus_Multiplier')]) || 1);
    var earnedPoints = Math.round(basePoints * mult);

    row[khCol_(h, 'Parent_Approved')] = true;
    row[khCol_(h, 'Completed_Date')] = today;
    var freq = String(row[khCol_(h, 'Frequency')] || '').toLowerCase();
    if (freq === 'one-time') { row[khCol_(h, 'Active')] = false; }
    sheet.getRange(rowIndex, 1, 1, h.length).setValues([row]);
    appendHistory_(approvalUID, taskID, child, task, earnedPoints, basePoints, mult, 'approval', today, now);
    approved++;
  }
  stampKHHeartbeat_();
  console.log('KH_WRITE', JSON.stringify({ fn: 'kh_batchApprove_', approved: approved, skipped: skipped, approver: approver || 'JT' }));
  return { success: true, approved: approved, skipped: skipped };
}

// v30: Streak + Mastery computation helpers
function kh_computeWeeklyStreak_(child) {
  var sheet = getKHSheet_('KH_History');
  if (!sheet) return 0;
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return 0;
  var h = data[0];
  var childIdx = h.indexOf('Child');
  var eventIdx = h.indexOf('Event_Type');
  var dateIdx = h.indexOf('Date');
  if (childIdx < 0 || eventIdx < 0 || dateIdx < 0) return 0;

  // Build set of unique dates this child completed tasks
  var completionDates = {};
  for (var i = 1; i < data.length; i++) {
    var c = String(data[i][childIdx] || '').toLowerCase();
    var ev = String(data[i][eventIdx] || '').toLowerCase();
    var dt = String(data[i][dateIdx] || '');
    if (c === child.toLowerCase() && (ev === 'approval' || ev === 'completion')) {
      if (dt.length >= 10) completionDates[dt.substring(0, 10)] = true;
    }
  }

  // Count consecutive days backward from today
  var now = new Date();
  var streak = 0;
  for (var d = 0; d < 365; d++) {
    var checkDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - d);
    var iso = checkDate.getFullYear() + '-' +
      (checkDate.getMonth() < 9 ? '0' : '') + (checkDate.getMonth() + 1) + '-' +
      (checkDate.getDate() < 10 ? '0' : '') + checkDate.getDate();
    if (completionDates[iso]) { streak++; }
    else if (d > 0) { break; }
    // d===0 (today) — if no completions today, still check yesterday
  }
  return streak;
}

function kh_computeMasteryRank_(totalPoints, child) {
  var RANKS_BUGGSY = [
    { min: 0, name: 'Rookie' },
    { min: 50, name: 'Builder' },
    { min: 150, name: 'Architect' },
    { min: 300, name: 'Commander' },
    { min: 500, name: 'Legend' }
  ];
  var RANKS_JJ = [
    { min: 0, name: 'Spark' },
    { min: 50, name: 'Twinkle' },
    { min: 150, name: 'Shimmer' },
    { min: 300, name: 'Glow' },
    { min: 500, name: 'Supernova' }
  ];
  var ranks = (child.toLowerCase() === 'jj') ? RANKS_JJ : RANKS_BUGGSY;
  var rank = ranks[0];
  for (var i = 0; i < ranks.length; i++) {
    if (totalPoints >= ranks[i].min) rank = ranks[i];
  }
  return rank.name;
}
// Version history tracked in Notion deploy page. Do not add version comments here.
// ════════════════════════════════════════════════════════════════════
// KidsHub.gs v62 — Kids Hub Server Backend (TBM Consolidated)
// WRITES TO: 🧹📅 KH_Chores, 🧹📅 KH_History, 🧹📅 KH_Rewards, 🧹📅 KH_Redemptions, 🧹📅 KH_Requests, 🧹📅 KH_ScreenTime, 🧹📅 KH_Grades, 🧹📅 KH_Education, 🧹📅 KH_PowerScan, 🧹📅 KH_MissionState, 🧹📅 KH_LessonRuns, 💻 Curriculum, 💻 QuestionLog, 💻 MealPlan
// READS FROM: 🧹📅 KH_* (all KH tabs), 💻🧮 Helpers, 💻 Curriculum
// ════════════════════════════════════════════════════════════════════

function getKidsHubVersion() { return 62; }

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

// v62: ComicStudio Free Mode prompts — shown when kid has no CER submitted for today's episode.
var COMIC_STUDIO_FREE_PROMPTS = [
  { id: 'mtl-vehicle',  text: "Draw Mach Turbo Light's newest vehicle. What does it do that no other ride can?" },
  { id: 'pack-meeting', text: "Draw the Pack at their team meeting. Who's arguing? Who's laughing?" },
  { id: 'new-villain',  text: "Draw a villain we haven't met yet. Give them a name and a weakness." },
  { id: 'hq-day',       text: 'Draw a normal day at Pack HQ. Show what everyone is doing.' },
  { id: 'training',     text: "Draw Wolfkid training for a dangerous mission. Show three skills he's practicing." },
  { id: 'origin',       text: 'Draw how Wolfkid first met Mach Turbo Light. Where were they? What happened?' },
  { id: 'disaster',     text: 'Draw the aftermath of a disaster — a flood, a storm, a fire. How does the Pack help?' },
  { id: 'secret-base',  text: "Draw the Pack's secret underground base. Label three rooms." },
  { id: 'crowd',        text: 'Draw the Pack getting thanked by a crowd. Who is cheering loudest? Why?' },
  { id: 'future',       text: 'Draw Wolfkid 10 years from now. What does he look like? What job does he have?' }
];

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
  },

  KH_LessonRuns: {
    headers: [
      'RunId','Child','Module','Subject','Source','DateKey',
      'StartedAt','LastSavedAt','CompletedAt','Status',
      'ActivityIndex','ActivityCount','SessionStars',
      'ActivitiesJSON','ClientMeta','CompletionReason'
    ],
    widths: [280,70,140,120,160,100,180,180,180,100,90,90,100,320,280,160]
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
    '✅ Kids Hub Setup Complete! v' + getKidsHubVersion() + '\n\n' +
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
  if (!_cachedSS) _cachedSS = SpreadsheetApp.openById(SSID);
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
  try { lock.waitLock(30000); hasLock = true; } catch (e) { hasLock = false; }
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
        version:   'KidsHub.gs v' + getKidsHubVersion(),
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
    var _activeVal = row[khCol_(h, 'Active')];
    if (_activeVal !== true && String(_activeVal || '').toUpperCase() !== 'YES') continue;

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
    var _activeVal = row[khCol_(h, 'Active')];
    if (_activeVal !== true && String(_activeVal || '').toUpperCase() !== 'YES') continue;
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


// v37: Parents Bank — earnedMoney from KH_History approval events + KH_Chores money map
function earnedMoney_(child) {
  // 1. Build money lookup from KH_Chores: taskID → money value
  var choreData = readSheet_('KH_Chores');
  var moneyMap = {};
  if (choreData && choreData.length >= 2) {
    var ch = choreData[0].map(String);
    var tidCol = khCol_(ch, 'Task_ID');
    var monCol = khCol_(ch, 'Money');
    if (tidCol >= 0 && monCol >= 0) {
      for (var c = 1; c < choreData.length; c++) {
        var tid = String(choreData[c][tidCol] || '');
        var money = Number(choreData[c][monCol]) || 0;
        if (tid && money > 0) moneyMap[tid] = money;
      }
    }
  }

  // 2. Read KH_History for all 'approval' events for this child
  var histData = readSheet_('KH_History');
  if (!histData || histData.length < 2) return 0;
  var hh = histData[0].map(String);
  var hChildCol = khCol_(hh, 'Child');
  var hTaskIDCol = khCol_(hh, 'Task_ID');
  var hEventCol = khCol_(hh, 'Event_Type');
  if (hChildCol < 0 || hTaskIDCol < 0 || hEventCol < 0) return 0;

  var total = 0;
  for (var i = 1; i < histData.length; i++) {
    var row = histData[i];
    var rowChild = String(row[hChildCol] || '').toLowerCase();
    if (rowChild !== child && rowChild !== 'both') continue;
    var evtType = String(row[hEventCol] || '').toLowerCase();
    if (evtType !== 'approval') continue;
    var taskID = String(row[hTaskIDCol] || '');
    var taskMoney = moneyMap[taskID] || 0;
    if (taskMoney > 0) total += taskMoney;
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
  var POINT_EVENTS = ['approval', 'bonus', 'rejection', 'education', 'override'];
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
        if (rr[rActiveCol] !== true && String(rr[rActiveCol] || '').toUpperCase() !== 'YES') continue;
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
    var _activeVal = row[khCol_(h, 'Active')];
    if (_activeVal !== true && String(_activeVal || '').toUpperCase() !== 'YES') continue;
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
    // v36: Verify write persisted (diagnostic for task-revert bug)
    var verifyRow = sheet.getRange(rowIndex, 1, 1, h.length).getValues()[0];
    var verifyDone = verifyRow[khCol_(h, 'Completed')] === true ||
      String(verifyRow[khCol_(h, 'Completed')]).toUpperCase() === 'TRUE';
    if (!verifyDone) {
      console.log('KH_VERIFY_FAIL', JSON.stringify({
        fn: 'khCompleteTask', taskID: taskID, rowIndex: rowIndex,
        wrote: true, readBack: verifyRow[khCol_(h, 'Completed')],
        timestamp: getNowISO_()
      }));
      sheet.getRange(rowIndex, khCol_(h, 'Completed') + 1).setValue(true);
      sheet.getRange(rowIndex, khCol_(h, 'Completed_Date') + 1).setValue(getTodayISO_());
    }
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
    // v31: Push notification on task completion — notify parents
    try {
      if (typeof sendPush_ === 'function') {
        var childDisplay = child.charAt(0).toUpperCase() + child.slice(1).toLowerCase();
        sendPush_('Chore Completed', childDisplay + ' completed "' + task + '" — needs approval', 'BOTH', PUSHOVER_PRIORITY.CHORE_APPROVAL);
      }
    } catch(e) {
      console.log('KH_PUSH_FAIL', JSON.stringify({
        task: task, child: child, error: e.message, stack: e.stack
      }));
    }
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
    // v36: Verify write persisted (diagnostic for task-revert bug)
    var verifyRow = sheet.getRange(rowIndex, 1, 1, h.length).getValues()[0];
    var verifyApproved = verifyRow[khCol_(h, 'Parent_Approved')] === true ||
      String(verifyRow[khCol_(h, 'Parent_Approved')]).toUpperCase() === 'TRUE';
    if (!verifyApproved) {
      console.log('KH_VERIFY_FAIL', JSON.stringify({
        fn: 'khApproveTask', taskID: taskID, rowIndex: rowIndex,
        wrote: true, readBack: verifyRow[khCol_(h, 'Parent_Approved')],
        timestamp: getNowISO_()
      }));
      sheet.getRange(rowIndex, khCol_(h, 'Parent_Approved') + 1).setValue(true);
    }
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


function khOverrideTask(rowIndex, expectedTaskID, multiplier) {
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
    var basePoints = Number(row[khCol_(h, 'Points')]) || 0;
    // v47 F01: validate multiplier — 0 (no points), 0.5 (half), 1 (full)
    var parsedMult = parseFloat(multiplier);
    var validMult = (parsedMult === 0 || parsedMult === 0.5 || parsedMult === 1) ? parsedMult : 1;
    var effectivePoints = Math.round(basePoints * validMult);
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
    row[khCol_(h, 'Bonus_Multiplier')] = validMult;
    sheet.getRange(rowIndex, 1, 1, h.length).setValues([row]);
    appendHistory_(uid, taskID, child, task, effectivePoints, basePoints, validMult, 'override', today, now);
    console.log('KH_WRITE', JSON.stringify({ fn: 'khOverrideTask', status: 'ok', uid: uid, child: child, points: effectivePoints, mult: validMult }));
    var _result = JSON.stringify({ status: 'ok', uid: uid, child: child, rowIndex: rowIndex, points: effectivePoints, multiplier: validMult });
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

    // v37: Grade cash bonuses removed from KH_Allowance (F14 — wrong schema)

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


// v52: Meal Plan — log dinner entry from Parent Dashboard; kidMeal col F when different
function updateMealPlan(meal, cook, notes, kidMeal) {
  var mealName = String(meal || '').trim();
  var cookedBy = String(cook || '').trim();
  var mealNotes = String(notes || '').trim();
  var kidMealName = String(kidMeal || '').trim();
  if (!mealName) return JSON.stringify({ status: 'error', message: 'Meal name required' });
  if (!cookedBy) cookedBy = 'JT';

  var lk = acquireLock_();
  if (!lk.acquired) return JSON.stringify({ status: 'locked', message: 'Try again.' });
  try {
    var ss = getKHSS_();
    var tabName = typeof TAB_MAP !== 'undefined' ? (TAB_MAP['MealPlan'] || 'MealPlan') : 'MealPlan';
    var sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      sheet = ss.insertSheet(tabName);
      sheet.appendRow(['Date', 'Meal', 'Cook', 'Notes', 'Timestamp', 'KidMeal']);
    } else {
      var f1Val = sheet.getRange(1, 6).getValue();
      if (!f1Val || String(f1Val).toLowerCase() === 'updatedat') {
        // v53: Migrate existing sheets — blank F1 or legacy 'UpdatedAt' header → KidMeal
        sheet.getRange(1, 6).setValue('KidMeal');
      }
    }
    var today = getTodayISO_();
    var now = getNowISO_();
    var kidMealVal = (kidMealName && kidMealName !== mealName) ? kidMealName : '';
    sheet.appendRow([today, mealName, cookedBy, mealNotes, now, kidMealVal]);
    stampKHHeartbeat_();
    return JSON.stringify({ status: 'ok', meal: mealName, cook: cookedBy });
  } catch(e) {
    if (typeof logError_ === 'function') logError_('updateMealPlan', e);
    return JSON.stringify({ status: 'error', message: 'Could not save dinner: ' + e.message });
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
      else if (col === 'Active')      row.push('YES');
      else if (col === 'Required')    row.push('NO');
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
  // ASSUMPTION: Daily history entries won't exceed 200 per day.
  if (data.length - scanStart >= 190) {
    console.log('KH_WARN: historyUIDExists_ scan window near cap (' + (data.length - scanStart) + '/200). Risk of dedup miss.');
  }
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

// v38: Fixed F17 — same root cause as F16. Reads KH_History approval events
// cross-referenced with KH_Chores task definitions. Survives daily reset.
function getKidsAllowanceLog() {
  var now = new Date();
  var tz = Session.getScriptTimeZone();
  var monthStart = Utilities.formatDate(new Date(now.getFullYear(), now.getMonth(), 1), tz, 'yyyy-MM-dd');
  var monthLabel = Utilities.formatDate(now, tz, 'MMMM yyyy');

  var choreData = readSheet_('KH_Chores');
  var taskDefs = {};
  if (choreData && choreData.length >= 2) {
    var cH = choreData[0].map(String);
    var cTaskID = cH.indexOf('Task_ID');
    var cTask = cH.indexOf('Task');
    var cMoney = cH.indexOf('Money');
    var cCategory = cH.indexOf('Category');
    var cPoints = cH.indexOf('Points');
    for (var ci = 1; ci < choreData.length; ci++) {
      var tid = String(choreData[ci][cTaskID] || '');
      if (tid) {
        taskDefs[tid] = {
          task: String(choreData[ci][cTask] || ''),
          money: Number(choreData[ci][cMoney]) || 0,
          category: String(choreData[ci][cCategory] || ''),
          points: Number(choreData[ci][cPoints]) || 0
        };
      }
    }
  }

  var histData = readSheet_('KH_History');
  var log = { buggsy: [], jj: [], summary: {} };
  var buggsyTotal = 0, jjTotal = 0;

  if (histData && histData.length >= 2) {
    var hH = histData[0].map(String);
    var hChild = hH.indexOf('Child');
    var hTaskID = hH.indexOf('Task_ID');
    var hDate = hH.indexOf('Date');
    var hType = hH.indexOf('Event_Type');

    for (var i = 1; i < histData.length; i++) {
      var row = histData[i];
      var evType = String(row[hType] || '').toLowerCase();
      if (evType !== 'approval') continue;
      var dateStr = String(row[hDate] || '').substring(0, 10);
      if (dateStr < monthStart) continue;
      var taskID = String(row[hTaskID] || '');
      var def = taskDefs[taskID];
      if (!def || def.money <= 0) continue;
      var child = String(row[hChild] || '').toLowerCase();
      var entry = {
        date: dateStr,
        task: def.task,
        category: def.category,
        points: def.points,
        money: Math.round(def.money * 100) / 100
      };
      if (child === 'buggsy') { log.buggsy.push(entry); buggsyTotal += def.money; }
      else if (child === 'jj') { log.jj.push(entry); jjTotal += def.money; }
    }
  }

  log.buggsy.sort(function(a, b) { return b.date > a.date ? 1 : -1; });
  log.jj.sort(function(a, b) { return b.date > a.date ? 1 : -1; });

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
    version: 'KidsHub.gs v' + getKidsHubVersion(),
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
// Returns { content, fullWeek, day, week, child } or null if no data.
function getTodayContent_(child, _testDateOverride) {
  var sheet = ensureCurriculumTab_();
  if (sheet.getLastRow() < 2) return null;
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(String);
  var childCol = headers.indexOf('Child');
  var startCol = headers.indexOf('StartDate');
  var jsonCol = headers.indexOf('ContentJSON');
  var weekCol = headers.indexOf('WeekNumber');
  if (childCol === -1 || startCol === -1 || jsonCol === -1) return null;
  var today;
  if (_testDateOverride) {
    // Parse YYYY-MM-DD as local calendar day to avoid UTC midnight offset in non-UTC zones.
    var parts = String(_testDateOverride).split('-');
    today = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  } else {
    today = new Date();
  }
  today.setHours(0, 0, 0, 0);
  var dayOfWeek = today.getDay();
  var dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  var todayName = dayNames[dayOfWeek];
  var childLower = String(child).toLowerCase();
  var bestRow = null;
  for (var i = 1; i < data.length; i++) {
    var rowChild = String(data[i][childCol] || '').toLowerCase();
    if (rowChild !== childLower) continue;
    var startDate = data[i][startCol];
    if (startDate instanceof Date) { startDate = new Date(startDate); } else { startDate = new Date(String(startDate)); }
    startDate.setHours(0, 0, 0, 0);
    if (isNaN(startDate.getTime())) continue;
    var endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);
    if (today >= startDate && today < endDate) { bestRow = data[i]; } // no break — last match wins (latest-seeded week takes precedence)
  }
  if (!bestRow) return null;
  try {
    var weekContent = JSON.parse(bestRow[jsonCol]);
    // Handle both flat and nested (.days) formats
    var daySource = weekContent.days || weekContent;
    var capName = todayName.charAt(0).toUpperCase() + todayName.slice(1);
    var dayContent = daySource[todayName] || daySource[capName] || null;
    // Attach week-level config to day content
    if (dayContent) {
      if (weekContent.scaffoldConfig) dayContent.scaffoldConfig = weekContent.scaffoldConfig;
      if (weekContent.vocabulary) dayContent.vocabulary = weekContent.vocabulary;
      if (weekContent.focusLetters) dayContent.focusLetters = weekContent.focusLetters;
      if (weekContent.focusNumbers) dayContent.focusNumbers = weekContent.focusNumbers;
    }
    // v61: Inject ActivityStoryPacks content into audio_story activities.
    // CurriculumSeed ships audio_story entries with storyId only — the story
    // text, question, answer, and options live in ActivityStoryPacks.js so
    // SparkleLearning's renderAudioStory (line 2473) can read them off the
    // activity object without a second round-trip. See
    // specs/storyfactory-audiostory-bridge.md.
    if (dayContent && dayContent.activities && dayContent.activities.length) {
      for (var i = 0; i < dayContent.activities.length; i++) {
        var act = dayContent.activities[i];
        if (act && act.type === 'audio_story' && act.storyId) {
          // Reference ACTIVITY_STORY_PACKS via the getter to avoid a load-order
          // dependency on file parse order in GAS.
          var pack = (typeof getActivityStoryPack_ === 'function')
            ? getActivityStoryPack_(act.storyId)
            : null;
          if (pack) {
            act.story = pack.story;
            act.question = pack.question;
            act.answer = pack.answer;
            act.options = pack.options;
            // Preserve existing audioPrompt / audioCorrect / title from the
            // curriculum — do not overwrite.
          }
          // Unknown storyId → leave activity unchanged; renderAudioStory falls
          // back to the hardcoded bunny placeholder (same as today).
        }
      }
    }
    return { content: dayContent, fullWeek: weekContent, day: todayName, week: bestRow[weekCol] || 0, child: childLower };
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


// v33: Seed STAAR RLA sprint content into Curriculum tab.
// jsonStr = full JSON string from staar-rla-sprint-final.json
// Writes buggsy + jj rows for week 2 with override flag.
function seedSTAARSprint(jsonStr) {
  var sheet = ensureCurriculumTab_();
  var parsed = JSON.parse(jsonStr);
  var bugsyContent = parsed.buggsy || {};
  var jjContent = parsed.jj || {};
  var bugsyJSON = JSON.stringify(bugsyContent);
  var jjJSON = JSON.stringify(jjContent);
  var nextRow = sheet.getLastRow() + 1;
  sheet.getRange(nextRow, 1, 2, 4).setValues([
    [2, 'buggsy', '2026-04-01', bugsyJSON],
    [2, 'jj',     '2026-04-01', jjJSON]
  ]);
  Logger.log('✅ STAAR RLA sprint seeded — Week 2 (StartDate: 2026-04-01). Buggsy: ' + bugsyJSON.length + ' chars, JJ: ' + jjJSON.length + ' chars.');
  return { status: 'seeded', week: 2, bugsySize: bugsyJSON.length, jjSize: jjJSON.length };
}

function seedStaarRlaSprintSafe(jsonStr) {
  return withMonitor_('seedStaarRlaSprintSafe', function() {
    return seedSTAARSprint(jsonStr);
  });
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


// ════════════════════════════════════════════════════════════════════
// v30: EDUCATION POINTS — award rings/stars for education module completion
// ════════════════════════════════════════════════════════════════════

/**
 * Award rings/stars for education module completion.
 * Called by awardRingsSafe() in Code.gs.
 * Writes a history entry to KH_History with event_type 'education'.
 *
 * @param {string} kid - 'buggsy' or 'jj'
 * @param {number} amount - integer points to award (1-100)
 * @param {string} source - description e.g. 'fact-sprint', 'writing-module-persuasive'
 * @return {string} JSON string with status
 */
function kh_awardEducationPoints_(kid, amount, source) {
  kid = String(kid || '').toLowerCase();
  if (kid !== 'buggsy' && kid !== 'jj') {
    return JSON.stringify({ error: true, message: 'Invalid kid: ' + kid });
  }
  amount = parseInt(amount, 10);
  if (isNaN(amount) || amount < 1 || amount > 100) {
    return JSON.stringify({ error: true, message: 'Amount must be 1-100' });
  }
  source = String(source || 'Education').substring(0, 100);
  var today = getTodayISO_();
  var now = getNowISO_();
  var uid = 'EDU_' + kid + '_' + source.replace(/\s+/g, '_') + '_' + today;

  var lk = acquireLock_();
  if (!lk.acquired) return JSON.stringify({ status: 'locked', message: 'System is busy — please try again' });
  try {
    if (historyUIDExists_(uid)) {
      return JSON.stringify({ status: 'ok', duplicate: true, message: 'Already awarded today for ' + source });
    }
    // appendHistory_(uid, taskID, child, task, points, basePoints, mult, eventType, date, timestamp)
    appendHistory_(uid, 'EDU_' + source, kid, 'Education: ' + source, amount, amount, 1, 'education', today, now);
    stampKHHeartbeat_();
    return JSON.stringify({ status: 'ok', awarded: amount, kid: kid, source: source });
  } finally {
    lk.lock.releaseLock();
  }
}


// ════════════════════════════════════════════════════════════════════
// v30: DAILY AUTO-RESET — trigger handler for 5 AM daily chore reset
// ════════════════════════════════════════════════════════════════════

/**
 * Trigger handler for daily task reset. Called by time-driven trigger at 5:00 AM CST.
 * Resets all daily chores for both kids. Reuses khResetTasks() core logic.
 * Trigger-safe: khResetTasks uses getKHSheet_ which uses openById.
 */
function resetDailyTasksAuto() {
  try {
    var result = JSON.parse(khResetTasks('daily', 'all'));
    if (result.status === 'ok') {
      Logger.log('resetDailyTasksAuto: Reset ' + result.resetCount + ' daily tasks');
    } else {
      Logger.log('resetDailyTasksAuto: ' + JSON.stringify(result));
      if (typeof logError_ === 'function') logError_('resetDailyTasksAuto', new Error('Reset returned: ' + JSON.stringify(result)));
    }
  } catch (e) {
    if (typeof logError_ === 'function') logError_('resetDailyTasksAuto', e);
  }
}

/**
 * Install daily reset trigger at 5 AM. Run from editor once.
 */
function installDailyReset() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'resetDailyTasksAuto') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('resetDailyTasksAuto')
    .timeBased()
    .everyDays(1)
    .atHour(5)
    .create();
  Logger.log('Daily reset trigger installed for 5 AM');
}


// v29: AUDIO BATCH LOADER + PROGRESS REPORT
// ════════════════════════════════════════════════════════════════════

var AUDIO_FOLDER_ID = '1BnwRW4zT5y2rAqU2S9vbMWvUl6GxESX_';
var AUDIO_FOLDER_BUGGSY = '1gaC6zWoAf8kVmrPVpA59ODaOXNzY_DFD';

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
    // Also index Buggsy folder if it exists
    try {
      var bFolder = DriveApp.getFolderById(AUDIO_FOLDER_BUGGSY);
      var bIndex = buildFileIndex_(bFolder);
      for (var bk in bIndex) { if (bIndex.hasOwnProperty(bk) && !fileIndex[bk]) { fileIndex[bk] = bIndex[bk]; } }
    } catch(e) { /* Buggsy folder not accessible */ }
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
 * v30: Parent-facing weekly progress report data.
 *
 * Tier classification (see specs/parent-reporting-scope.md):
 *   Tier A (real, this week):   populated from KH_History + KH_Education
 *   Tier B (blocked for JJ):    returns null + tierB_blocked=true until
 *                               #133 Phase 2 lands KH_LessonRuns
 *   Tier C (future):            lifetime totals, time tracking, alerts
 *
 * Naming split enforced: Buggsy uses ringsThisWeek/ringsTotal,
 * JJ uses starsThisWeek/starsTotal. Conditional field assignment in
 * _buildChildReport_ means the UI reading the wrong side gets undefined,
 * which is louder than a silent zero.
 *
 * Closes #137 (Phase 1).
 */
function getWeeklyProgressVersion() { return 2; }

function getWeeklyProgressSafe() {
  return withMonitor_('getWeeklyProgressSafe', function() {
    var bounds = _computeWeekBounds_();
    var histData = readSheet_('KH_History');
    var eduData = readSheet_('KH_Education');

    var buggsy = _buildChildReport_('buggsy', bounds, histData, eduData, {
      hasKHEducation: true,
      tierBBlocked: false
    });

    var jj = _buildChildReport_('jj', bounds, histData, eduData, {
      hasKHEducation: false, // JJ does not write to KH_Education
      tierBBlocked: true
    });

    return JSON.parse(JSON.stringify({
      weekLabel: bounds.label,
      weekStart: bounds.startISO,
      weekEnd: bounds.endISO,
      buggsy: buggsy,
      jj: jj,
      meta: {
        generatedAt: new Date().toISOString(),
        source: 'KH_History + KH_Education',
        blockedTierB: ['jj'],
        version: 2
      }
    }));
  });
}

function _computeWeekBounds_() {
  var today = new Date();
  var dayOfWeek = today.getDay();
  var mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  var monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  var friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  var sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    monday: monday,
    friday: friday,
    sunday: sunday,
    startISO: _isoDate_(monday),
    endISO: _isoDate_(sunday),
    label: 'Week of ' + (monday.getMonth() + 1) + '/' + monday.getDate()
  };
}

function _isoDate_(d) {
  var m = d.getMonth() + 1;
  var day = d.getDate();
  return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
}

function _weekdayLabel_(dayIdx) {
  // 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri
  return ['Mon','Tue','Wed','Thu','Fri'][dayIdx] || '';
}

// Sum Points from KH_History where event_type is completion, approval, or education
// for this child this week (bounds.startISO inclusive → bounds.endISO inclusive).
// Also returns unique-day set for streak calculation.
function _sumRingsThisWeek_(child, bounds, histData) {
  var result = { pointsSum: 0, uniqueDays: {} };
  if (!histData || histData.length < 2) return result;
  var h = histData[0].map(String);
  var hChild = h.indexOf('Child');
  var hDate = h.indexOf('Date');
  var hPoints = h.indexOf('Points');
  var hType = h.indexOf('Event_Type');
  if (hChild < 0 || hDate < 0 || hPoints < 0 || hType < 0) return result;
  for (var i = 1; i < histData.length; i++) {
    var row = histData[i];
    if (String(row[hChild] || '').toLowerCase() !== child) continue;
    var rowDate = String(row[hDate] || '').slice(0, 10);
    if (rowDate < bounds.startISO || rowDate > bounds.endISO) continue;
    var evType = String(row[hType] || '');
    if (evType !== 'completion' && evType !== 'approval' && evType !== 'education') continue;
    result.pointsSum += Number(row[hPoints]) || 0;
    result.uniqueDays[rowDate] = true;
  }
  return result;
}

// Walk backwards from today counting consecutive days with any
// completion/approval/education row. Accepts the uniqueDays set from _sumRingsThisWeek_.
// Gap on a day before today breaks the streak; missing today only breaks if yesterday
// also missed (today's zero is allowed at the start of the day).
function _computeStreakFromDays_(uniqueDays) {
  var streak = 0;
  var checkDate = new Date();
  for (var di = 0; di < 30; di++) {
    var iso = _isoDate_(checkDate);
    if (uniqueDays[iso]) {
      streak++;
    } else if (di > 0) {
      break;
    }
    checkDate.setDate(checkDate.getDate() - 1);
  }
  return streak;
}

// Aggregate KH_Education rows for one child this week into:
//   count        — sessionsCompleted
//   avgScore     — mean of Score column for auto-graded rows (0 if none)
//   pendingReview — count of rows with Status='pending_review'
//   weekLog      — 5 entries Mon-Fri of {day, status, score}
//   subjects     — array of {name, score, total} grouped by Subject
function _aggregateKHEducation_(child, bounds, eduData) {
  var out = {
    count: 0,
    avgScore: null,
    pendingReview: 0,
    weekLog: [],
    subjects: []
  };
  // Initialize 5-day weekLog with position-aware default status:
  //   past empty days → 'missed' (no activity recorded after the day passed)
  //   today or future → 'none'  (not yet active; renderer shows dimmed/empty cell)
  var todayIso = getTodayISO_();
  var initDate = new Date(bounds.monday);
  for (var di = 0; di < 5; di++) {
    var dayIso = _isoDate_(initDate);
    var defaultStatus = (dayIso < todayIso) ? 'missed' : 'none';
    out.weekLog.push({ day: _weekdayLabel_(di), status: defaultStatus, score: null });
    initDate.setDate(initDate.getDate() + 1);
  }
  if (!eduData || eduData.length < 2) return out;

  var h = eduData[0].map(String);
  var eChild = h.indexOf('Child');
  var eTimestamp = h.indexOf('Timestamp');
  var eSubject = h.indexOf('Subject');
  var eScore = h.indexOf('Score');
  var eAutoGraded = h.indexOf('AutoGraded');
  var eStatus = h.indexOf('Status');
  if (eChild < 0 || eTimestamp < 0) return out;

  var scoreSum = 0;
  var scoreCount = 0;
  var subjectAgg = {}; // name → { score, total }
  var dayAgg = {}; // iso → { status, scoreSum, scoreCount }

  for (var i = 1; i < eduData.length; i++) {
    var row = eduData[i];
    if (String(row[eChild] || '').toLowerCase() !== child) continue;
    var ts = row[eTimestamp];
    var tsIso;
    if (ts instanceof Date) {
      tsIso = _isoDate_(ts);
    } else {
      tsIso = String(ts || '').slice(0, 10);
    }
    if (tsIso < bounds.startISO || tsIso > bounds.endISO) continue;

    out.count++;
    var statusVal = String(row[eStatus] || '');
    if (statusVal === 'pending_review') out.pendingReview++;

    var isAuto = String(row[eAutoGraded] || '').toLowerCase() === 'true' || row[eAutoGraded] === true;
    var scoreVal = Number(row[eScore]) || 0;
    if (isAuto && eScore >= 0) {
      scoreSum += scoreVal;
      scoreCount++;
    }

    var subjName = String(row[eSubject] || 'Other');
    if (!subjectAgg[subjName]) subjectAgg[subjName] = { score: 0, total: 0 };
    subjectAgg[subjName].total++;
    if (isAuto) subjectAgg[subjName].score++;

    // Track per-day status
    if (!dayAgg[tsIso]) dayAgg[tsIso] = { status: 'none', scoreSum: 0, scoreCount: 0 };
    var dayEntry = dayAgg[tsIso];
    if (statusVal === 'pending_review') {
      dayEntry.status = 'pending';
    } else if (statusVal === 'auto_approved' || statusVal === 'approved') {
      dayEntry.status = 'done';
    }
    if (isAuto) {
      dayEntry.scoreSum += scoreVal;
      dayEntry.scoreCount++;
    }
  }

  if (scoreCount > 0) out.avgScore = Math.round(scoreSum / scoreCount);

  // Fill weekLog Mon-Fri from dayAgg
  var checkDate = new Date(bounds.monday);
  for (var wi = 0; wi < 5; wi++) {
    var wiso = _isoDate_(checkDate);
    if (dayAgg[wiso]) {
      out.weekLog[wi].status = dayAgg[wiso].status;
      if (dayAgg[wiso].scoreCount > 0) {
        out.weekLog[wi].score = Math.round(dayAgg[wiso].scoreSum / dayAgg[wiso].scoreCount);
      }
    }
    checkDate.setDate(checkDate.getDate() + 1);
  }

  // Flatten subjects
  var subjKeys = Object.keys(subjectAgg);
  for (var sk = 0; sk < subjKeys.length; sk++) {
    var key = subjKeys[sk];
    out.subjects.push({
      name: key,
      score: subjectAgg[key].score,
      total: subjectAgg[key].total
    });
  }

  return out;
}

function _buildChildReport_(child, bounds, histData, eduData, flags) {
  var isJJ = (child === 'jj');
  var histAgg = _sumRingsThisWeek_(child, bounds, histData);
  var streak = _computeStreakFromDays_(histAgg.uniqueDays);

  // Build the base shape. Fields common to both children live here.
  // Child-specific naming split (ringsThisWeek vs starsThisWeek) is applied below.
  var base = {
    name: isJJ ? 'JJ (Kindle)' : 'Buggsy',
    child: child,
    // Tier A — fields populated downstream
    streak: streak,
    sessionsCompleted: null,
    sessionsTotal: 5,
    completionRate: null,
    avgScore: null,
    pendingReview: 0,
    weekLog: [],
    subjects: [],
    // Tier B (blocked marker for client UI)
    milestones: [],
    tierB_blocked: !!flags.tierBBlocked,
    tierB_reason: flags.tierBBlocked ? 'jj-lesson-run-data-model' : null,
    // Tier C (future)
    timeSpent: null,
    alerts: []
  };

  // Naming split: Buggsy → rings*, JJ → stars*. UI code reading the wrong
  // side gets undefined, which is louder than a silent zero. Enforced by
  // Gate 5 checklist item 16.
  if (isJJ) {
    base.starsThisWeek = histAgg.pointsSum;
    base.starsTotal = null; // Tier C
  } else {
    base.ringsThisWeek = histAgg.pointsSum;
    base.ringsTotal = null; // Tier C
  }

  if (flags.hasKHEducation) {
    var eduAgg = _aggregateKHEducation_(child, bounds, eduData);
    base.sessionsCompleted = eduAgg.count;
    base.completionRate = Math.min(100, Math.round((eduAgg.count / base.sessionsTotal) * 100));
    base.avgScore = eduAgg.avgScore;
    base.pendingReview = eduAgg.pendingReview;
    base.weekLog = eduAgg.weekLog;
    base.subjects = eduAgg.subjects;
  }

  // Phase 2 (#133 lands KH_LessonRuns): merge in JJ data from lesson runs.
  // Intentionally omitted from Phase 1 — branch will be added when
  // _aggregateKHLessonRuns_ helper ships in the Phase 2 PR.

  return base;
}


// v37: getTodayContentSafe — thin wrapper around getTodayContent_
function getTodayContentSafe(child) {
  return withMonitor_('getTodayContentSafe', function() {
    return getTodayContent_(child);
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
  var data = readSheet_('KH_History');
  if (!data || data.length < 2) return 0;
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


// v37: seedStaarRlaSprint deleted (F03 — duplicate of seedSTAARSprint)

// ════════════════════════════════════════════════════════════════════
// v36: QuestionLog — per-question result tracking for education modules
// ════════════════════════════════════════════════════════════════════

var QUESTION_LOG_HEADERS = [
  'Question_UID', 'Child', 'Date', 'Day_Of_Week', 'Subject', 'TEKS_Code',
  'Question_Type', 'Distractor_Level', 'Difficulty', 'Correct',
  'Time_Spent_Seconds', 'Session_Module', 'Timestamp'
];

function ensureQuestionLogTab_() {
  var ss = getKHSS_();
  var tabName = (typeof TAB_MAP !== 'undefined' && TAB_MAP['QuestionLog']) || 'QuestionLog';
  var sheet = ss.getSheetByName(tabName);
  if (sheet) return sheet;
  sheet = ss.insertSheet(tabName);
  sheet.appendRow(QUESTION_LOG_HEADERS);
  sheet.setFrozenRows(1);
  sheet.getRange('1:1').setFontWeight('bold');
  Logger.log('ensureQuestionLogTab_: Created ' + tabName);
  return sheet;
}

function logQuestionResult(data) {
  var lk = acquireLock_();
  if (!lk.acquired) return JSON.stringify({ status: 'locked' });
  try {
    var sheet = ensureQuestionLogTab_();
    var child = String(data.child || '').toLowerCase();
    var today = getTodayISO_();
    var now = getNowISO_();
    var dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    var dayOfWeek = dayNames[new Date().getDay()];
    var uid = String(data.questionUID || '');
    if (!uid) uid = child + '_' + today + '_' + String(data.subject || '') + '_' + String(data.questionIndex || Math.random());

    // Dedup guard
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var scanStart = Math.max(2, lastRow - 200);
      var scanData = sheet.getRange(scanStart, 1, lastRow - scanStart + 1, 1).getValues();
      for (var i = 0; i < scanData.length; i++) {
        if (String(scanData[i][0]) === uid) {
          return JSON.stringify({ status: 'duplicate', uid: uid });
        }
      }
    }

    sheet.appendRow([
      uid,
      child,
      today,
      dayOfWeek,
      String(data.subject || ''),
      String(data.teksCode || ''),
      String(data.questionType || 'MC'),
      Number(data.distractorLevel) || 1,
      String(data.difficulty || 'standard'),
      data.correct === true || data.correct === 'true',
      Number(data.timeSpentSeconds) || 0,
      String(data.sessionModule || ''),
      now
    ]);
    stampKHHeartbeat_();
    return JSON.stringify({ status: 'ok', uid: uid });
  } finally {
    lk.lock.releaseLock();
  }
}

function logQuestionResultSafe(data) {
  return withMonitor_('logQuestionResultSafe', function() {
    return JSON.parse(JSON.stringify(
      typeof data === 'string' ? JSON.parse(logQuestionResult(JSON.parse(data))) : JSON.parse(logQuestionResult(data))
    ));
  });
}

// ════════════════════════════════════════════════════════════════════
// v36: Power Scan — save executive skills self-assessment results
// ════════════════════════════════════════════════════════════════════

function savePowerScanResults(child, ratings, openResponses) {
  var lk = acquireLock_();
  if (!lk.acquired) return JSON.stringify({ status: 'locked' });
  try {
    var ss = getKHSS_();
    var tabName = (typeof TAB_MAP !== 'undefined' && TAB_MAP['KH_PowerScan']) || 'KH_PowerScan';
    var sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      sheet = ss.insertSheet(tabName);
      sheet.appendRow([
        'Date', 'Child', 'Flexibility', 'Memory', 'Inhibition', 'Initiation',
        'Planning', 'Organization', 'Time', 'Persistence', 'Metacognition', 'Emotion',
        'FullPowerMode', 'GlitchMode', 'PowerDrains', 'RechargeMethod'
      ]);
      sheet.setFrozenRows(1);
      sheet.getRange('1:1').setFontWeight('bold');
    }
    sheet.appendRow([
      getTodayISO_(),
      String(child || 'buggsy').toLowerCase(),
      Number(ratings.flexibility) || 0,
      Number(ratings.memory) || 0,
      Number(ratings.inhibition) || 0,
      Number(ratings.initiation) || 0,
      Number(ratings.planning) || 0,
      Number(ratings.organization) || 0,
      Number(ratings.time) || 0,
      Number(ratings.persistence) || 0,
      Number(ratings.metacognition) || 0,
      Number(ratings.emotion) || 0,
      String(openResponses.best || ''),
      String(openResponses.stress || ''),
      String(openResponses.triggers || ''),
      String(openResponses.recharge || '')
    ]);
    stampKHHeartbeat_();
    return JSON.stringify({ status: 'ok' });
  } finally {
    lk.lock.releaseLock();
  }
}

function savePowerScanResultsSafe(child, ratings, openResponses) {
  return withMonitor_('savePowerScanResultsSafe', function() {
    return JSON.parse(JSON.stringify(JSON.parse(savePowerScanResults(child, ratings, openResponses))));
  });
}

// ════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════
// v39: Education backend — save/load progress, scaffold logging, week progress
// ════════════════════════════════════════════════════════════════════

function saveProgress_(data) {
  var lk = acquireLock_();
  if (!lk.acquired) return JSON.stringify({ status: 'locked' });
  try {
    var sheet = getKHSheet_('KH_History');
    if (!sheet) return JSON.stringify({ status: 'error', message: 'KH_History not found' });
    var now = new Date();
    var today = getTodayISO_();
    var nowISO = getNowISO_();
    var child = String(data.child || 'jj').toLowerCase();
    sheet.appendRow([
      'PROGRESS_' + child + '_' + today,
      child,
      'SparkleLearn Progress',
      Number(data.stars) || 0,
      0,
      1,
      'education_progress',
      today,
      nowISO,
      'Letters: ' + ((data.lettersCompleted || []).join(','))
    ]);
    stampKHHeartbeat_();
    return JSON.stringify({ status: 'ok', stars: data.stars });
  } finally {
    lk.lock.releaseLock();
  }
}

function saveProgressSafe(data) {
  return withMonitor_('saveProgressSafe', function() {
    return JSON.parse(JSON.stringify(JSON.parse(saveProgress_(data))));
  });
}

function loadProgress_(child) {
  var data = readSheet_('KH_History');
  if (!data || data.length < 2) return { stars: 0, lettersCompleted: [], currentLetter: 'K' };
  var h = data[0].map(String);
  var hChild = h.indexOf('Child');
  var hType = h.indexOf('Event_Type');
  var hPoints = h.indexOf('Points');
  var hTask = h.indexOf('Task');
  for (var i = data.length - 1; i >= 1; i--) {
    var row = data[i];
    if (String(row[hChild] || '').toLowerCase() !== child.toLowerCase()) continue;
    if (String(row[hType] || '') !== 'education_progress') continue;
    var letters = String(row[hTask] || '').replace('Letters: ', '').split(',');
    var filtered = [];
    for (var j = 0; j < letters.length; j++) {
      if (letters[j].length > 0) filtered.push(letters[j]);
    }
    return {
      stars: Number(row[hPoints]) || 0,
      lettersCompleted: filtered,
      currentLetter: filtered.length > 0 ? filtered[filtered.length - 1] : 'K'
    };
  }
  return { stars: 0, lettersCompleted: [], currentLetter: 'K' };
}

function loadProgressSafe(child) {
  return withMonitor_('loadProgressSafe', function() {
    return JSON.parse(JSON.stringify(loadProgress_(child)));
  });
}

function logScaffoldEvent_(data) {
  var lk = acquireLock_();
  if (!lk.acquired) return JSON.stringify({ status: 'locked' });
  try {
    var sheet = getKHSheet_('KH_History');
    if (!sheet) return JSON.stringify({ status: 'error' });
    var now = new Date();
    var today = getTodayISO_();
    var nowISO = getNowISO_();
    sheet.appendRow([
      'SCAFFOLD_' + today + '_' + Math.random().toString(36).substring(7),
      String(data.child || 'buggsy').toLowerCase(),
      String(data.module || ''),
      0,
      0,
      1,
      'scaffold',
      today,
      nowISO,
      JSON.stringify({ event: data.event, data: data.data || {} })
    ]);
    stampKHHeartbeat_();
    return JSON.stringify({ status: 'ok' });
  } finally {
    lk.lock.releaseLock();
  }
}

function logScaffoldEventSafe(data) {
  return withMonitor_('logScaffoldEventSafe', function() {
    return JSON.parse(JSON.stringify(JSON.parse(logScaffoldEvent_(data))));
  });
}

function getWeekProgress_(child) {
  var data = readSheet_('KH_History');
  if (!data || data.length < 2) return { daysCompleted: 0, goalMet: false };
  var h = data[0].map(String);
  var hChild = h.indexOf('Child');
  var hType = h.indexOf('Event_Type');
  var hDate = h.indexOf('Date');

  var today = new Date();
  var dayOfWeek = today.getDay();
  var mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  var monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  var mondayStr = monday.getFullYear() + '-' + (monday.getMonth() + 1 < 10 ? '0' : '') + (monday.getMonth() + 1) + '-' + (monday.getDate() < 10 ? '0' : '') + monday.getDate();
  var todayStr = getTodayISO_();
  var daysSet = {};

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (String(row[hChild] || '').toLowerCase() !== child.toLowerCase()) continue;
    var evType = String(row[hType] || '');
    if (evType !== 'education' && evType !== 'education_progress') continue;
    var rowDate = String(row[hDate] || '');
    if (rowDate >= mondayStr && rowDate <= todayStr) {
      daysSet[rowDate] = true;
    }
  }

  var count = 0;
  for (var d in daysSet) {
    if (daysSet.hasOwnProperty(d)) count++;
  }

  return { daysCompleted: count, goalMet: count >= 5 };
}

function getWeekProgressSafe(child) {
  return withMonitor_('getWeekProgressSafe', function() {
    return JSON.parse(JSON.stringify(getWeekProgress_(child)));
  });
}

function saveMissionState_(child, dateKey, state) {
  var lk = acquireLock_();
  if (!lk.acquired) return JSON.stringify({ status: 'locked' });
  try {
    var ss = getKHSS_();
    var tabName = (typeof TAB_MAP !== 'undefined' && TAB_MAP['KH_MissionState']) || 'KH_MissionState';
    var sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      sheet = ss.insertSheet(tabName);
      sheet.appendRow(['Child', 'DateKey', 'StateJSON', 'UpdatedAt']);
      sheet.setFrozenRows(1);
    }
    var data = sheet.getDataRange().getValues();
    var found = false;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === child && String(data[i][1]) === dateKey) {
        sheet.getRange(i + 1, 3).setValue(JSON.stringify(state));
        sheet.getRange(i + 1, 4).setValue(new Date().toISOString());
        found = true;
        break;
      }
    }
    if (!found) {
      sheet.appendRow([child, dateKey, JSON.stringify(state), new Date().toISOString()]);
    }
    return JSON.stringify({ status: 'ok' });
  } finally {
    lk.lock.releaseLock();
  }
}

function saveMissionStateSafe(child, dateKey, state) {
  return withMonitor_('saveMissionStateSafe', function() {
    return JSON.parse(JSON.stringify(JSON.parse(saveMissionState_(child, dateKey, state))));
  });
}

function getMissionState_(child, dateKey) {
  var ss = getKHSS_();
  var tabName = (typeof TAB_MAP !== 'undefined' && TAB_MAP['KH_MissionState']) || 'KH_MissionState';
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) return {};
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === child && String(data[i][1]) === dateKey) {
      try { return JSON.parse(String(data[i][2])); } catch(e) { return {}; }
    }
  }
  return {};
}

function getMissionStateSafe(child, dateKey) {
  return withMonitor_('getMissionStateSafe', function() {
    return JSON.parse(JSON.stringify(getMissionState_(child, dateKey)));
  });
}

// ════════════════════════════════════════════════════════════════════
// v58: JJ LESSON RUN COMPLETION CONTRACT (spec/jj-completion-contract.md)
// ════════════════════════════════════════════════════════════════════
// Phase 1: dark, flag-gated, server-side only. No client integration.
// Flag: Script Property 'LESSON_RUNS_ENABLED' = '1' to turn on.
// When off, every public function early-returns { ok: true, flagged_off: true }.
// Writes to: KH_LessonRuns (16-column atomic upserts keyed by RunId).
// Integration: completeLessonRun_ calls kh_awardEducationPoints_ with the
// PLAIN source string (never source + '|' + runId) to preserve the daily
// ring dedupe at Kidshub.js:2768.
// ════════════════════════════════════════════════════════════════════

var KH_LESSON_RUNS_HEADERS = [
  'RunId','Child','Module','Subject','Source','DateKey',
  'StartedAt','LastSavedAt','CompletedAt','Status',
  'ActivityIndex','ActivityCount','SessionStars',
  'ActivitiesJSON','ClientMeta','CompletionReason'
];

function ensureKHLessonRunsTab_() {
  var ss = getKHSS_();
  var tabName = (typeof TAB_MAP !== 'undefined' && TAB_MAP['KH_LessonRuns']) || 'KH_LessonRuns';
  var sheet = ss.getSheetByName(tabName);
  if (sheet) return sheet;
  sheet = ss.insertSheet(tabName);
  sheet.appendRow(KH_LESSON_RUNS_HEADERS);
  sheet.setFrozenRows(1);
  sheet.getRange('1:1').setFontWeight('bold');
  return sheet;
}

// Scan RunIds from the bottom (most recent first) for faster hit on active runs.
// Returns the 1-indexed sheet row (>=2) or -1 if not found.
function _findRunRow_(sheet, runId) {
  if (!sheet || !runId) return -1;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  var runIdCol = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = runIdCol.length - 1; i >= 0; i--) {
    if (String(runIdCol[i][0]) === runId) return i + 2;
  }
  return -1;
}

function _isValidRunId_(runId) {
  if (!runId) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(runId));
}

function _parseJsonArraySafe_(raw) {
  if (!raw) return [];
  try {
    var parsed = JSON.parse(String(raw));
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) { return []; }
}

// Start or resume a run. Idempotent on runId — an existing row returns unchanged.
// child: 'buggsy' | 'jj'
// runId: RFC4122 v4 UUID (client-generated)
// meta:  { module, subject, source, activityCount, clientMeta }
function startLessonRun_(child, runId, meta) {
  if (typeof isLessonRunsEnabled_ === 'function' && !isLessonRunsEnabled_()) {
    return JSON.stringify({ status: 'ok', flagged_off: true });
  }
  child = String(child || '').toLowerCase();
  if (child !== 'buggsy' && child !== 'jj') {
    return JSON.stringify({ status: 'error', message: 'Invalid child: ' + child });
  }
  if (!_isValidRunId_(runId)) {
    return JSON.stringify({ status: 'error', message: 'Invalid runId (expected UUID v4)' });
  }
  meta = meta || {};

  var lk = acquireLock_();
  if (!lk.acquired) return JSON.stringify({ status: 'locked' });
  try {
    var sheet = ensureKHLessonRunsTab_();
    var rowIdx = _findRunRow_(sheet, runId);
    if (rowIdx > 0) {
      var row = sheet.getRange(rowIdx, 1, 1, KH_LESSON_RUNS_HEADERS.length).getValues()[0];
      return JSON.stringify({
        status: 'ok',
        runId: runId,
        isNewRun: false,
        startedAt: String(row[6] || ''),
        activityIndex: Number(row[10]) || 0
      });
    }
    var nowIso = new Date().toISOString();
    var dateKey = getTodayISO_();
    var clientMeta = meta.clientMeta || {};
    sheet.appendRow([
      runId,
      child,
      String(meta.module || ''),
      String(meta.subject || ''),
      String(meta.source || ''),
      dateKey,
      nowIso,           // StartedAt
      nowIso,           // LastSavedAt
      '',               // CompletedAt
      'in_progress',    // Status
      0,                // ActivityIndex
      Number(meta.activityCount) || 0,
      0,                // SessionStars
      '[]',             // ActivitiesJSON
      JSON.stringify(clientMeta),
      ''                // CompletionReason
    ]);
    stampKHHeartbeat_();
    return JSON.stringify({
      status: 'ok',
      runId: runId,
      isNewRun: true,
      startedAt: nowIso,
      activityIndex: 0
    });
  } finally {
    lk.lock.releaseLock();
  }
}

// Atomic upsert of run state. Writes LastSavedAt + ActivityIndex + SessionStars + ActivitiesJSON.
// state: { activityIndex, sessionStars, activitiesJSON }
function saveLessonRunState_(runId, state) {
  if (typeof isLessonRunsEnabled_ === 'function' && !isLessonRunsEnabled_()) {
    return JSON.stringify({ status: 'ok', flagged_off: true });
  }
  if (!_isValidRunId_(runId)) {
    return JSON.stringify({ status: 'error', message: 'Invalid runId' });
  }
  state = state || {};

  var lk = acquireLock_();
  if (!lk.acquired) return JSON.stringify({ status: 'locked' });
  try {
    var sheet = ensureKHLessonRunsTab_();
    var rowIdx = _findRunRow_(sheet, runId);
    if (rowIdx < 0) {
      return JSON.stringify({ status: 'error', message: 'Unknown runId — call startLessonRun first' });
    }
    var existingStatus = String(sheet.getRange(rowIdx, 10).getValue() || '');
    if (existingStatus === 'completed' || existingStatus === 'abandoned') {
      return JSON.stringify({
        status: 'error',
        message: 'Cannot save state — run is already ' + existingStatus,
        runId: runId,
        terminalStatus: existingStatus
      });
    }
    var lastSaved = new Date().toISOString();
    sheet.getRange(rowIdx, 8).setValue(lastSaved);                              // LastSavedAt
    sheet.getRange(rowIdx, 11).setValue(Number(state.activityIndex) || 0);      // ActivityIndex
    sheet.getRange(rowIdx, 13).setValue(Number(state.sessionStars) || 0);       // SessionStars
    sheet.getRange(rowIdx, 14).setValue(JSON.stringify(state.activitiesJSON || [])); // ActivitiesJSON
    stampKHHeartbeat_();
    return JSON.stringify({ status: 'ok', lastSavedAt: lastSaved });
  } finally {
    lk.lock.releaseLock();
  }
}

// Return the most recent in_progress run for this child+module with DateKey === today,
// or null. Sweeps any in_progress runs older than 6 hours to abandoned/abandoned_timeout.
function getLessonRunResume_(child, module) {
  if (typeof isLessonRunsEnabled_ === 'function' && !isLessonRunsEnabled_()) {
    return JSON.stringify({ status: 'ok', flagged_off: true, run: null });
  }
  child = String(child || '').toLowerCase();
  module = String(module || '');

  var lk = acquireLock_();
  if (!lk.acquired) return JSON.stringify({ status: 'locked' });
  try {
    var sheet = ensureKHLessonRunsTab_();
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return JSON.stringify({ status: 'ok', run: null });
    var data = sheet.getRange(2, 1, lastRow - 1, KH_LESSON_RUNS_HEADERS.length).getValues();
    var today = getTodayISO_();
    var SIX_H_MS = 6 * 60 * 60 * 1000;
    var nowMs = Date.now();
    var found = null;
    for (var i = data.length - 1; i >= 0; i--) {
      var r = data[i];
      var rChild = String(r[1] || '').toLowerCase();
      var rModule = String(r[2] || '');
      var rStatus = String(r[9] || '');
      if (rChild !== child || rModule !== module) continue;
      if (rStatus !== 'in_progress') continue;
      var lastSavedMs = Date.parse(String(r[7] || ''));
      if (!isNaN(lastSavedMs) && (nowMs - lastSavedMs) > SIX_H_MS) {
        var stampedRow = i + 2;
        var abandonedAt = new Date().toISOString();
        sheet.getRange(stampedRow, 9).setValue(abandonedAt);    // CompletedAt
        sheet.getRange(stampedRow, 10).setValue('abandoned');   // Status
        sheet.getRange(stampedRow, 16).setValue('abandoned_timeout'); // CompletionReason
        continue;
      }
      if (String(r[5] || '') === today && !found) {
        found = r;
      }
    }
    if (!found) return JSON.stringify({ status: 'ok', run: null });
    return JSON.stringify({
      status: 'ok',
      run: {
        runId: String(found[0]),
        child: String(found[1]),
        module: String(found[2]),
        subject: String(found[3]),
        source: String(found[4]),
        dateKey: String(found[5]),
        startedAt: String(found[6]),
        lastSavedAt: String(found[7]),
        status: String(found[9]),
        activityIndex: Number(found[10]) || 0,
        activityCount: Number(found[11]) || 0,
        sessionStars: Number(found[12]) || 0,
        activitiesJSON: _parseJsonArraySafe_(found[13])
      }
    });
  } finally {
    lk.lock.releaseLock();
  }
}

// Finalize a run. Idempotent on runId — already-completed runs return existing state.
// final: { completionReason, sessionStars, activitiesJSON, activityIndex }
// Ring grant uses PLAIN source string, never source + '|' + runId, to preserve
// the daily dedupe at kh_awardEducationPoints_ Kidshub.js:2768.
function completeLessonRun_(runId, final) {
  if (typeof isLessonRunsEnabled_ === 'function' && !isLessonRunsEnabled_()) {
    return JSON.stringify({ status: 'ok', flagged_off: true });
  }
  if (!_isValidRunId_(runId)) {
    return JSON.stringify({ status: 'error', message: 'Invalid runId' });
  }
  final = final || {};
  var completionReason = String(final.completionReason || 'finished');
  var allowedReasons = { finished: 1, play_again_replaced: 1, explicit_exit: 1, abandoned_timeout: 1 };
  if (!allowedReasons[completionReason]) {
    return JSON.stringify({ status: 'error', message: 'Invalid completionReason: ' + completionReason });
  }

  var completedAt = '';
  var child = '';
  var source = '';
  var sessionStars = 0;
  var alreadyCompleted = false;
  var persistedReason = '';

  var lk = acquireLock_();
  if (!lk.acquired) return JSON.stringify({ status: 'locked' });
  try {
    var sheet = ensureKHLessonRunsTab_();
    var rowIdx = _findRunRow_(sheet, runId);
    if (rowIdx < 0) {
      return JSON.stringify({ status: 'error', message: 'Unknown runId' });
    }
    var row = sheet.getRange(rowIdx, 1, 1, KH_LESSON_RUNS_HEADERS.length).getValues()[0];
    var existingStatus = String(row[9] || '');
    child = String(row[1] || '');
    source = String(row[4] || '');
    sessionStars = Number(final.sessionStars);
    if (isNaN(sessionStars)) sessionStars = Number(row[12]) || 0;

    if (existingStatus === 'completed') {
      alreadyCompleted = true;
      completedAt = String(row[8] || '');
      sessionStars = Number(row[12]) || 0;
      persistedReason = String(row[15] || '');
    } else {
      completedAt = new Date().toISOString();
      sheet.getRange(rowIdx, 8).setValue(completedAt);    // LastSavedAt
      sheet.getRange(rowIdx, 9).setValue(completedAt);    // CompletedAt
      sheet.getRange(rowIdx, 10).setValue('completed');   // Status
      if (typeof final.activityIndex === 'number') {
        sheet.getRange(rowIdx, 11).setValue(final.activityIndex);
      }
      sheet.getRange(rowIdx, 13).setValue(sessionStars);  // SessionStars
      if (final.activitiesJSON) {
        sheet.getRange(rowIdx, 14).setValue(JSON.stringify(final.activitiesJSON));
      }
      sheet.getRange(rowIdx, 16).setValue(completionReason); // CompletionReason
      stampKHHeartbeat_();
    }
  } finally {
    lk.lock.releaseLock();
  }

  if (alreadyCompleted) {
    return JSON.stringify({
      status: 'ok',
      alreadyCompleted: true,
      completedAt: completedAt,
      sessionStars: sessionStars,
      completionReason: persistedReason  // persisted from row col 16, NOT caller-provided
    });
  }

  // Ring grant runs OUTSIDE the run lock (award function acquires its own lock).
  // completionReason === 'finished' is the only path that mints rings; 'play_again_replaced'
  // and other terminal states do NOT grant additional rings (kh_awardEducationPoints_'s
  // daily dedupe would swallow them anyway, but skipping the call avoids the noise).
  var dedupedAward = false;
  var ringsActuallyAwarded = 0;
  if (sessionStars > 0 && completionReason === 'finished' && child && source) {
    try {
      var awardResultStr = kh_awardEducationPoints_(child, sessionStars, source);
      var awardResult = JSON.parse(awardResultStr);
      if (awardResult && awardResult.status === 'ok') {
        if (awardResult.duplicate) {
          dedupedAward = true;
        } else {
          ringsActuallyAwarded = Number(awardResult.awarded) || 0;
        }
      }
    } catch (awardErr) {
      if (typeof logError_ === 'function') logError_('completeLessonRun_.award', awardErr);
    }
  }

  return JSON.stringify({
    status: 'ok',
    completedAt: completedAt,
    sessionStars: sessionStars,
    dedupedAward: dedupedAward,
    ringsActuallyAwarded: ringsActuallyAwarded,
    completionReason: completionReason
  });
}

function startLessonRunSafe(child, runId, meta) {
  return withMonitor_('startLessonRunSafe', function() {
    return JSON.parse(startLessonRun_(child, runId, meta));
  });
}

function saveLessonRunStateSafe(runId, state) {
  return withMonitor_('saveLessonRunStateSafe', function() {
    return JSON.parse(saveLessonRunState_(runId, state));
  });
}

function getLessonRunResumeSafe(child, module) {
  return withMonitor_('getLessonRunResumeSafe', function() {
    return JSON.parse(getLessonRunResume_(child, module));
  });
}

function completeLessonRunSafe(runId, final) {
  return withMonitor_('completeLessonRunSafe', function() {
    return JSON.parse(completeLessonRun_(runId, final));
  });
}

// ════════════════════════════════════════════════════════════════════
// v41: Gemini grading + Audio audit
// ════════════════════════════════════════════════════════════════════

function reviewWithGemini_(data) {
  var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) return { feedback: null, error: 'No GEMINI_API_KEY' };
  try {
    var prompt = 'You are reviewing a ' + (data.child === 'jj' ? '4-year-old' : '10-year-old 4th grader') +
      "'s " + (data.subject || 'homework') + " response.\n\n" +
      "Assignment: " + (data.prompt || 'N/A') + "\n" +
      "Student response: " + (data.response || '') + "\n\n" +
      "Provide briefly: (1) spelling errors, (2) grammar notes, (3) structure score (A/B/C/Incomplete), " +
      "(4) one encouraging comment, (5) one improvement suggestion. Keep it under 150 words. This is for the parent.";
    var resp = UrlFetchApp.fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey,
      { method: 'post', contentType: 'application/json',
        payload: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        muteHttpExceptions: true }
    );
    var json = JSON.parse(resp.getContentText());
    var text = '';
    if (json.candidates && json.candidates[0] && json.candidates[0].content) {
      text = json.candidates[0].content.parts[0].text;
    }
    return { feedback: text, timestamp: new Date().toISOString() };
  } catch(e) {
    if (typeof logError_ === 'function') logError_('reviewWithGemini_', e);
    return { feedback: null, error: e.message };
  }
}

function auditAudioClips() {
  var folderId = '1rXWVBD9QMruWOj6AlNB4mY2E9wzWGctm';
  var folder = DriveApp.getFolderById(folderId);
  var inventory = { jj: [], buggsy: [], other: [] };
  var subs = folder.getFolders();
  while (subs.hasNext()) {
    var sub = subs.next();
    var subName = sub.getName().toLowerCase();
    var files = sub.getFiles();
    while (files.hasNext()) {
      var f = files.next();
      if (subName === 'jj') inventory.jj.push(f.getName());
      else if (subName === 'buggsy') inventory.buggsy.push(f.getName());
      else inventory.other.push(subName + '/' + f.getName());
    }
  }
  var rootFiles = folder.getFiles();
  while (rootFiles.hasNext()) { inventory.other.push(rootFiles.next().getName()); }
  Logger.log('=== AUDIO INVENTORY ===');
  Logger.log('JJ clips: ' + inventory.jj.length);
  Logger.log('Buggsy clips: ' + inventory.buggsy.length);
  Logger.log('Other: ' + inventory.other.length);
  Logger.log('TOTAL: ' + (inventory.jj.length + inventory.buggsy.length + inventory.other.length));
  Logger.log('JJ: ' + JSON.stringify(inventory.jj.sort()));
  Logger.log('Buggsy: ' + JSON.stringify(inventory.buggsy.sort()));
  return inventory;
}

// ════════════════════════════════════════════════════════════════════
// v41: Education submission + parent approval pipeline
// ════════════════════════════════════════════════════════════════════

var KH_EDU_HEADERS = ['Timestamp','Child','Module','Subject','Score','AutoGraded','ResponseText','Status','ParentNotes','RingsAwarded','ReviewTimestamp','GeminiFeedback'];

function ensureKHEducationTab_() {
  var ss = getKHSS_();
  var tabName = (typeof TAB_MAP !== 'undefined' && TAB_MAP['KH_Education']) || 'KH_Education';
  var sheet = ss.getSheetByName(tabName);
  if (sheet) return sheet;
  sheet = ss.insertSheet(tabName);
  sheet.appendRow(KH_EDU_HEADERS);
  sheet.setFrozenRows(1);
  sheet.getRange('1:1').setFontWeight('bold');
  return sheet;
}

function submitHomework_(data) {
  var lk = acquireLock_();
  if (!lk.acquired) return JSON.stringify({ status: 'locked' });
  var isAutoGrade = !data.responseText || String(data.responseText).trim().length === 0;
  var status = isAutoGrade ? 'auto_approved' : 'pending_review';
  var rings = 0;
  var childLower = String(data.child || 'buggsy').toLowerCase();
  var sheet = null;
  var lastRowForGemini = 0;

  if (isAutoGrade) {
    rings = Number(data.rings) || 5;
  }

  // Phase 1: Write row under lock
  try {
    sheet = ensureKHEducationTab_();
    sheet.appendRow([
      new Date(),
      childLower,
      String(data.module || 'homework'),
      String(data.subject || 'General'),
      Number(data.score) || 0,
      isAutoGrade,
      String(data.responseText || ''),
      status,
      '',
      rings,
      '',
      ''
    ]);
    stampKHHeartbeat_();
    lastRowForGemini = sheet.getLastRow();
  } finally {
    lk.lock.releaseLock();
  }

  // Phase 2: Award rings AFTER lock release (acquires its own lock)
  var ringsActuallyAwarded = 0;
  if (isAutoGrade && rings > 0) {
    try {
      if (typeof kh_awardEducationPoints_ === 'function') {
        var awardRaw = kh_awardEducationPoints_(childLower, rings, data.module + ' — ' + data.subject);
        var awardResult = typeof awardRaw === 'string' ? JSON.parse(awardRaw) : awardRaw;
        ringsActuallyAwarded = (awardResult && awardResult.duplicate) ? 0 : rings;
      }
    } catch(e) { if (typeof logError_ === 'function') logError_('submitHomework_:awardRings', e); }
  }

  // Phase 3: Push notification AFTER ring award so message reflects reality
  try {
    if (typeof sendPush_ === 'function') {
      var childDisplay = childLower.charAt(0).toUpperCase() + childLower.slice(1);
      var pushMsg = status === 'pending_review'
        ? 'Needs your review on Parent Dashboard'
        : ringsActuallyAwarded > 0 ? 'Auto-graded — ' + ringsActuallyAwarded + ' rings awarded'
        : 'Auto-graded — complete';
      sendPush_(childDisplay + ' submitted ' + (data.subject || 'homework'), pushMsg, 'BOTH', PUSHOVER_PRIORITY.CHORE_APPROVAL);
    }
  } catch(e) { /* non-blocking */ }

  // Phase 4: Gemini review (outside lock, can take 5-30s)
  if (status === 'pending_review' && data.responseText && String(data.responseText).length > 20) {
    try {
      var review = reviewWithGemini_({
        child: data.child || 'buggsy',
        subject: data.subject || '',
        prompt: data.prompt || '',
        response: data.responseText
      });
      if (review && review.feedback && sheet && lastRowForGemini > 0) {
        var lk2 = acquireLock_();
        if (lk2.acquired) {
          try { sheet.getRange(lastRowForGemini, 12).setValue(JSON.stringify(review)); }
          finally { lk2.lock.releaseLock(); }
        }
      }
    } catch(e2) {
      if (typeof logError_ === 'function') logError_('submitHomework_:geminiReview', e2);
    }
  }

  return JSON.stringify({ status: 'ok', autoApproved: isAutoGrade, ringsAwarded: rings });
}

function submitHomeworkSafe(data) {
  return withMonitor_('submitHomeworkSafe', function() {
    return JSON.parse(JSON.stringify(JSON.parse(submitHomework_(data))));
  });
}

function getEducationQueue_() {
  var sheet = ensureKHEducationTab_();
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return { pending: [], today: [] };
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var pending = [];
  var todayItems = [];

  for (var i = 1; i < data.length; i++) {
    var row = {
      rowIndex: i + 1,
      timestamp: data[i][0],
      child: String(data[i][1] || ''),
      module: String(data[i][2] || ''),
      subject: String(data[i][3] || ''),
      score: Number(data[i][4]) || 0,
      autoGraded: data[i][5] === true || String(data[i][5]).toUpperCase() === 'TRUE',
      responseText: String(data[i][6] || ''),
      status: String(data[i][7] || ''),
      parentNotes: String(data[i][8] || ''),
      ringsAwarded: Number(data[i][9]) || 0,
      geminiFeedback: String(data[i][11] || '')
    };

    if (row.status === 'pending_review') pending.push(row);

    var rowDate = new Date(data[i][0]);
    rowDate.setHours(0, 0, 0, 0);
    if (rowDate.getTime() === today.getTime()) todayItems.push(row);
  }

  return { pending: pending, today: todayItems };
}

function getEducationQueueSafe() {
  return withMonitor_('getEducationQueueSafe', function() {
    return JSON.parse(JSON.stringify(getEducationQueue_()));
  });
}

function approveHomework_(rowIndex, action, notes) {
  var lk = acquireLock_();
  if (!lk.acquired) return JSON.stringify({ status: 'locked' });
  var child = '';
  var module = '';
  var subject = '';
  var rings = 0;

  // Phase 1: Sheet writes under lock
  try {
    var sheet = ensureKHEducationTab_();
    var row = sheet.getRange(rowIndex, 1, 1, 12).getValues()[0];
    child = String(row[1]);
    module = String(row[2]);
    subject = String(row[3]);

    if (action === 'approve') {
      rings = 10;
      sheet.getRange(rowIndex, 8).setValue('approved');
      sheet.getRange(rowIndex, 9).setValue(String(notes || ''));
      sheet.getRange(rowIndex, 10).setValue(rings);
      sheet.getRange(rowIndex, 11).setValue(new Date());
    } else if (action === 'return') {
      sheet.getRange(rowIndex, 8).setValue('returned');
      sheet.getRange(rowIndex, 9).setValue(String(notes || 'Please try again'));
      sheet.getRange(rowIndex, 11).setValue(new Date());
    }

    stampKHHeartbeat_();
  } finally {
    lk.lock.releaseLock();
  }

  // Phase 2: Award rings + push notification AFTER lock release
  if (action === 'approve' && rings > 0) {
    try {
      if (typeof kh_awardEducationPoints_ === 'function') {
        kh_awardEducationPoints_(child, rings, module + ' — ' + subject + ' (Parent Approved)');
      }
    } catch(e) { if (typeof logError_ === 'function') logError_('approveHomework_:awardRings', e); }

    try {
      if (typeof sendPush_ === 'function') {
        var childDisplay = child.charAt(0).toUpperCase() + child.slice(1);
        sendPush_(childDisplay + ': Writing approved! +' + rings + ' rings', String(notes || 'Great work!'), 'BOTH', PUSHOVER_PRIORITY.CHORE_APPROVAL);
      }
    } catch(e) { /* non-blocking */ }
  }

  return JSON.stringify({ status: 'ok', action: action });
}

function approveHomeworkSafe(rowIndex, action, notes) {
  return withMonitor_('approveHomeworkSafe', function() {
    return JSON.parse(JSON.stringify(JSON.parse(approveHomework_(rowIndex, action, notes))));
  });
}

// ════════════════════════════════════════════════════════════════════
// v41: Dynamic schedule from curriculum
// ════════════════════════════════════════════════════════════════════

function getDailySchedule_(child) {
  var sheet = ensureCurriculumTab_();
  if (sheet.getLastRow() < 2) return null;
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(String);
  var childCol = headers.indexOf('Child');
  var startCol = headers.indexOf('StartDate');
  var jsonCol = headers.indexOf('ContentJSON');
  if (childCol < 0 || startCol < 0 || jsonCol < 0) return null;

  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  var dayName = dayNames[today.getDay()];
  var capDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][childCol] || '').toLowerCase() !== child.toLowerCase()) continue;
    var startDate = data[i][startCol];
    if (startDate instanceof Date) startDate = new Date(startDate);
    else startDate = new Date(String(startDate));
    startDate.setHours(0, 0, 0, 0);
    if (isNaN(startDate.getTime())) continue;
    var endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);
    if (today >= startDate && today < endDate) {
      try {
        var weekContent = JSON.parse(data[i][jsonCol]);
        var daySource = weekContent.days || weekContent;
        var dayContent = daySource[dayName] || daySource[capDay] || null;
        if (!dayContent) return null;

        var blocks = [];
        if (child.toLowerCase() === 'jj') {
          if (dayContent.activities && dayContent.activities.length > 0) {
            blocks.push({ page: 'sparkle', name: dayContent.title || 'Sparkle Learning', time: 10 });
          }
        } else {
          if (dayContent.mathModule || dayContent.module) blocks.push({ page: 'homework', name: 'Homework', time: 15 });
          if (dayContent.factSprint || dayContent.fact_sprint) blocks.push({ page: 'facts', name: 'Fact Sprint', time: 5 });
          if (dayContent.mission && dayContent.mission.phases) {
            for (var p = 0; p < dayContent.mission.phases.length; p++) {
              var phase = dayContent.mission.phases[p];
              if (phase.type === 'cold_passage') blocks.push({ page: 'reading', name: 'Reading', time: 12 });
              if (phase.type === 'quick_write') blocks.push({ page: 'writing', name: 'Writing', time: 10 });
            }
          }
          if (dayContent.cold_passage || dayContent.coldPassage) blocks.push({ page: 'reading', name: 'Reading', time: 12 });
          if (dayContent.quick_write || dayContent.quickWrite || dayContent.writing) blocks.push({ page: 'writing', name: 'Writing', time: 10 });
          if (dayContent.wolfkidEpisode || dayContent.wolfkid_episode) blocks.push({ page: 'wolfkid', name: 'Wolfkid CER', time: 15 });
          if (dayContent.investigation) blocks.push({ page: 'investigation', name: 'Investigation', time: 12 });
          if (dayContent.reviewQuiz || dayContent.review_quiz) blocks.push({ page: 'homework', name: 'Review Quiz', time: 10 });
          if (dayContent.staarSim || dayContent.staar_sim) blocks.push({ page: 'homework', name: 'STAAR Sim', time: 10 });
          if (dayContent.grammarSprint || dayContent.grammar_sprint) blocks.push({ page: 'writing', name: 'Grammar Sprint', time: 8 });
        }

        return { blocks: blocks, dayName: dayName, theme: dayContent.theme || '' };
      } catch(e) {
        if (typeof logError_ === 'function') logError_('getDailySchedule_:parse', e);
        return null;
      }
    }
  }
  return null;
}

function getDailyScheduleSafe(child) {
  return withMonitor_('getDailyScheduleSafe', function() {
    return JSON.parse(JSON.stringify(getDailySchedule_(child) || { blocks: [] }));
  });
}

// ── DAY 1 DETECTION ─────────────────────────────────────────────
/**
 * Check if this child has ever completed any education activity.
 * If no education events found in KH_History, it's Day 1.
 */
function checkDay1_(child) {
  child = String(child || '').toLowerCase();
  if (child !== 'buggsy' && child !== 'jj') {
    return { isDay1: false };
  }
  // Check KH_History for any education events
  var data = readSheet_('KH_History');
  for (var i = 0; i < data.length; i++) {
    var rowChild = String(data[i][2] || '').toLowerCase();
    var eventType = String(data[i][7] || '').toLowerCase();
    if (rowChild === child && eventType === 'education') {
      return { isDay1: false };
    }
  }
  // Also check KH_MissionState — any prior mission record means setup is done
  var missions = readSheet_('KH_MissionState');
  for (var j = 0; j < missions.length; j++) {
    if (String(missions[j][0] || '').toLowerCase() === child) {
      return { isDay1: false };
    }
  }
  return { isDay1: true };
}

function checkDay1Safe(child) {
  return withMonitor_('checkDay1Safe', function() {
    return JSON.parse(JSON.stringify(checkDay1_(child)));
  });
}

// ── DESIGN CHOICES ──────────────────────────────────────────────
function saveDesignChoices_(payload) {
  var child = String(payload && payload.child || '').toLowerCase();
  if (child !== 'buggsy' && child !== 'jj') {
    return { error: true, message: 'Invalid child' };
  }
  var props = PropertiesService.getScriptProperties();
  props.setProperty('DESIGN_CHOICES_' + child, JSON.stringify(payload));
  return { status: 'ok' };
}

function saveDesignChoicesSafe(payload) {
  return withMonitor_('saveDesignChoicesSafe', function() {
    return JSON.parse(JSON.stringify(saveDesignChoices_(payload)));
  });
}

function getDesignChoicesSafe(child) {
  return withMonitor_('getDesignChoicesSafe', function() {
    var c = String(child || '').toLowerCase();
    var raw = PropertiesService.getScriptProperties().getProperty('DESIGN_CHOICES_' + c);
    if (!raw) return null;
    return JSON.parse(raw);
  });
}

// ── HOMEWORK GATE — Design unlocked after any education submission today ──
function getDesignUnlocked_(child) {
  var childLower = String(child || '').toLowerCase();
  if (childLower !== 'buggsy' && childLower !== 'jj') return false;
  var sheet = ensureKHEducationTab_();
  if (sheet.getLastRow() < 2) return false;
  var data = sheet.getDataRange().getValues();
  var today = getTodayISO_();
  for (var i = 1; i < data.length; i++) {
    var rowChild = String(data[i][1] || '').toLowerCase();
    var rowDate = data[i][0];
    var rowDateStr = '';
    if (rowDate instanceof Date) {
      var y = rowDate.getFullYear();
      var m = String(rowDate.getMonth() + 1); if (m.length < 2) m = '0' + m;
      var d = String(rowDate.getDate()); if (d.length < 2) d = '0' + d;
      rowDateStr = y + '-' + m + '-' + d;
    }
    var rowStatus = String(data[i][7] || '');
    if (rowChild === childLower && rowDateStr === today && rowStatus !== '') {
      return true;
    }
  }
  return false;
}

function getDesignUnlockedSafe(child) {
  return withMonitor_('getDesignUnlockedSafe', function() {
    return getDesignUnlocked_(child);
  });
}

// ══════════════════════════════════════════════════════════════
// v55: SANDBOX — isolated test environment for kid workflows
// ══════════════════════════════════════════════════════════════

/**
 * Wipe all sandbox-* rows from KH tabs + seed sample tasks.
 * Call from /parent?sandbox=1 or via /api?fn=resetSandboxSafe
 */
function resetSandbox_() {
  var lk = acquireLock_();
  if (!lk.acquired) return JSON.stringify({ status: 'locked' });
  try {
    var tabs = ['KH_Chores', 'KH_History', 'KH_Rewards', 'KH_Grades', 'KH_Education',
                'KH_Requests', 'KH_ScreenTime', 'KH_PowerScan', 'KH_MissionState'];
    var removed = 0;
    for (var t = 0; t < tabs.length; t++) {
      var sheet = getKHSheet_(tabs[t]);
      if (!sheet || sheet.getLastRow() < 2) continue;
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var childCol = -1;
      for (var h = 0; h < headers.length; h++) {
        if (String(headers[h]).toLowerCase().indexOf('child') !== -1) { childCol = h; break; }
      }
      if (childCol === -1) continue;
      // Delete from bottom up to avoid index shift
      for (var r = data.length - 1; r >= 1; r--) {
        var val = String(data[r][childCol] || '').toLowerCase();
        if (val.indexOf('sandbox-') === 0) {
          sheet.deleteRow(r + 1);
          removed++;
        }
      }
    }
    // Seed sample tasks for sandbox-buggsy
    var choreSheet = getKHSheet_('KH_Chores');
    if (choreSheet) {
      var ch = choreSheet.getRange(1, 1, 1, choreSheet.getLastColumn()).getValues()[0];
      var colMap = {};
      for (var c = 0; c < ch.length; c++) colMap[ch[c]] = c;
      var today = getTodayISO_();
      var sampleTasks = [
        { task: 'Sandbox: Make Bed', points: 2, freq: 'Daily', slot: '1-Morning' },
        { task: 'Sandbox: Clean Room', points: 3, freq: 'Daily', slot: '2-Afternoon' },
        { task: 'Sandbox: Read 15 Minutes', points: 5, freq: 'Daily', slot: '3-Evening' }
      ];
      for (var s = 0; s < sampleTasks.length; s++) {
        var row = [];
        for (var i = 0; i < ch.length; i++) row.push('');
        var st = sampleTasks[s];
        var taskID = 'SANDBOX_buggsy_' + today + '_' + s;
        if (colMap['Child'] !== undefined) row[colMap['Child']] = 'sandbox-buggsy';
        if (colMap['Task'] !== undefined) row[colMap['Task']] = st.task;
        if (colMap['Points'] !== undefined) row[colMap['Points']] = st.points;
        if (colMap['Frequency'] !== undefined) row[colMap['Frequency']] = st.freq;
        if (colMap['Time_Slot'] !== undefined) row[colMap['Time_Slot']] = st.slot;
        if (colMap['Active'] !== undefined) row[colMap['Active']] = 'YES';
        if (colMap['Task_ID'] !== undefined) row[colMap['Task_ID']] = taskID;
        choreSheet.appendRow(row);
      }
    }
    stampKHHeartbeat_();
    return JSON.stringify({ status: 'ok', removed: removed, seeded: 3 });
  } finally {
    lk.lock.releaseLock();
  }
}

function resetSandboxSafe() {
  return withMonitor_('resetSandboxSafe', function() {
    return JSON.parse(resetSandbox_());
  });
}

// ── COMBINED DAILY-MISSIONS INIT (v57 perf fix) ────────────────────
/**
 * Returns all data needed by daily-missions init in ONE server call.
 * Collapses 4 sequential round-trips (isDay1, getMissionState,
 * getDesignUnlocked, getDailySchedule) into a single call.
 */
function getDailyMissionsInit_(child) {
  child = String(child || '').toLowerCase();
  if (child !== 'buggsy' && child !== 'jj') {
    return { isDay1: false, missionState: {}, designUnlocked: false, schedule: { blocks: [] } };
  }

  var today = getTodayISO_();
  var dateKey = 'missions_' + today;

  var result = {
    isDay1: false,
    missionState: {},
    designUnlocked: false,
    schedule: { blocks: [] },
    dateKey: dateKey
  };

  // 1. Day 1 check
  var day1Result = checkDay1_(child);
  result.isDay1 = (day1Result && day1Result.isDay1 === true);

  // 2. Mission state
  result.missionState = getMissionState_(child, dateKey);

  // 3. Design unlock (homework gate)
  result.designUnlocked = getDesignUnlocked_(child);

  // 4. Daily schedule from curriculum
  var sched = getDailySchedule_(child);
  result.schedule = sched || { blocks: [] };

  return result;
}

function getDailyMissionsInitSafe(child) {
  return withMonitor_('getDailyMissionsInitSafe', function() {
    return JSON.parse(JSON.stringify(getDailyMissionsInit_(child)));
  });
}

// ── v62: Comic Studio — Drive draft storage + mode aggregator ────────────────

function ensureComicArchiveRootFolder_() {
  var props = PropertiesService.getScriptProperties();
  var cached = props.getProperty('COMIC_ARCHIVE_FOLDER_ID');
  if (cached) {
    try { return DriveApp.getFolderById(cached); } catch (_) {}
  }
  var root = DriveApp.getRootFolder();
  var existing = root.getFoldersByName('Wolfkid Comics');
  var folder = existing.hasNext() ? existing.next() : root.createFolder('Wolfkid Comics');
  props.setProperty('COMIC_ARCHIVE_FOLDER_ID', folder.getId());
  return folder;
}

function ensureComicDraftsFolder_() {
  var props = PropertiesService.getScriptProperties();
  var cached = props.getProperty('COMIC_DRAFTS_FOLDER_ID');
  if (cached) {
    try { return DriveApp.getFolderById(cached); } catch (_) {}
  }
  var root = ensureComicArchiveRootFolder_();
  var sub = root.getFoldersByName('drafts');
  var drafts = sub.hasNext() ? sub.next() : root.createFolder('drafts');
  props.setProperty('COMIC_DRAFTS_FOLDER_ID', drafts.getId());
  return drafts;
}

function saveComicDraft_(child, draftJson) {
  try {
    var childLower = String(child || 'buggsy').toLowerCase();
    var dateKey = getTodayISO_();
    var fileName = childLower + '_' + dateKey + '.json';
    var folder = ensureComicDraftsFolder_();
    var existing = folder.getFilesByName(fileName);
    while (existing.hasNext()) { existing.next().setTrashed(true); }
    var blob = Utilities.newBlob(draftJson, 'application/json', fileName);
    var file = folder.createFile(blob);
    return { success: true, fileId: file.getId(), bytes: draftJson.length };
  } catch (e) {
    if (typeof logError_ === 'function') logError_('saveComicDraft_', e);
    return { success: false, error: String(e) };
  }
}

function saveComicDraftSafe(child, draftJson) {
  return withMonitor_('saveComicDraftSafe', function() {
    return JSON.parse(JSON.stringify(saveComicDraft_(child, draftJson)));
  });
}

function deleteComicDraft_(child, dateKey) {
  try {
    var childLower = String(child || 'buggsy').toLowerCase();
    var key = dateKey || getTodayISO_();
    var fileName = childLower + '_' + key + '.json';
    var folder = ensureComicDraftsFolder_();
    var files = folder.getFilesByName(fileName);
    var count = 0;
    while (files.hasNext()) {
      files.next().setTrashed(true);
      count++;
    }
    return { success: true, deleted: count };
  } catch (e) {
    if (typeof logError_ === 'function') logError_('deleteComicDraft_', e);
    return { success: false, error: String(e) };
  }
}

function deleteComicDraftSafe(child, dateKey) {
  return withMonitor_('deleteComicDraftSafe', function() {
    return JSON.parse(JSON.stringify(deleteComicDraft_(child, dateKey)));
  });
}

function loadComicDraft_(child) {
  try {
    var childLower = String(child || 'buggsy').toLowerCase();
    var dateKey = getTodayISO_();
    var folder = ensureComicDraftsFolder_();
    var fileName = childLower + '_' + dateKey + '.json';
    var files = folder.getFilesByName(fileName);
    if (!files.hasNext()) return null;
    var file = files.next();
    var text = file.getBlob().getDataAsString();
    return JSON.parse(text);
  } catch (e) {
    if (typeof logError_ === 'function') logError_('loadComicDraft_', e);
    return null;
  }
}

function loadComicDraftSafe(child) {
  return withMonitor_('loadComicDraftSafe', function() {
    var result = loadComicDraft_(child);
    return JSON.parse(JSON.stringify(result));
  });
}

function slugifyEpisodeTitle_(title) {
  return String(title || 'untitled')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/, '')
    .substring(0, 30);
}

function getComicStudioContext_(child) {
  var childLower = String(child || 'buggsy').toLowerCase();
  var today = getTodayISO_();
  var result = {
    mode: 'free',
    episodeId: null,
    episode: null,
    studentCER: null,
    vocab: [],
    freePrompts: [],
    ringsCap: 30
  };

  var dayContent = null;
  try {
    var content = getTodayContent_(childLower);
    dayContent = (content && content.content) || null;
    if (dayContent && dayContent.vocabulary) {
      result.vocab = dayContent.vocabulary.slice(0, 5);
    }
  } catch (e) {
    if (typeof logError_ === 'function') logError_('getComicStudioContext_:content', e);
  }

  var studentCER = null;
  try {
    var sheet = ensureKHEducationTab_();
    if (sheet.getLastRow() >= 2) {
      var data = sheet.getDataRange().getValues();
      for (var i = data.length - 1; i >= 1; i--) {
        var row = data[i];
        var ts = row[0];
        var rowChild = String(row[1] || '').toLowerCase();
        var module = String(row[2] || '').toLowerCase();
        var subject = String(row[3] || '').toLowerCase();
        var responseText = String(row[6] || '');
        var status = String(row[7] || '');
        var rings = Number(row[9]) || 0;
        if (rowChild !== childLower) continue;
        if (!(ts instanceof Date)) continue;
        var rowDateKey = Utilities.formatDate(ts, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        if (rowDateKey !== today) continue;
        var isWolfkid = module.indexOf('wolfkid') !== -1 || subject.indexOf('wolfkid') !== -1;
        if (!isWolfkid) continue;
        if (!responseText) continue;
        studentCER = {
          submittedAt: ts.toISOString(),
          claim: responseText.split(/[.!?]/)[0].trim() + '.',
          responseText: responseText,
          rings: rings,
          status: status
        };
        break;
      }
    }
  } catch (e) {
    if (typeof logError_ === 'function') logError_('getComicStudioContext_:cer', e);
  }

  if (dayContent && dayContent.wolfkidEpisode && studentCER) {
    result.mode = 'mission';
    result.episodeId = slugifyEpisodeTitle_(dayContent.wolfkidEpisode.title);
    result.episode = {
      id: result.episodeId,
      title: dayContent.wolfkidEpisode.title || '',
      scenario: dayContent.wolfkidEpisode.scenario || '',
      writingPrompt: dayContent.wolfkidEpisode.writingPrompt || '',
      data: dayContent.wolfkidEpisode.data || {}
    };
    result.studentCER = studentCER;
    result.ringsCap = 55;
  } else {
    result.mode = 'free';
    result.freePrompts = COMIC_STUDIO_FREE_PROMPTS.slice();
    result.ringsCap = 30;
  }

  return result;
}

function getComicStudioContextSafe(child) {
  return withMonitor_('getComicStudioContextSafe', function() {
    return JSON.parse(JSON.stringify(getComicStudioContext_(child)));
  });
}

// END OF FILE — KidsHub.gs v62
// ════════════════════════════════════════════════════════════════════
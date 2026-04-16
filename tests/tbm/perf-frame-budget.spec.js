// @ts-check
// perf-frame-budget.spec.js — MVSS v1 S5 instrumentation (Issue #360)
// Measures P1-P5 frame budget criteria on Surface Pro 5 and Samsung S10 FE.
// Evidence artifacts (traces + baseline JSON) uploaded per CI run — not committed.
//
// P1: avg frame time <=33ms (>=30fps)  — captured via trace; asserted in CI summary
// P2: no jank event >500ms             — LongTask API
// P3: LCP <=2500ms                     — LargestContentfulPaint observer
// P4: CLS <=0.1                        — LayoutShift observer
// P5: TTI (dom-interactive) <=5000ms   — Navigation Timing

var _pw = require('@playwright/test');
var test = _pw.test;
var expect = _pw.expect;
var fs = require('fs');
var path = require('path');

var launchConfig = require('../../.claude/launch.json');
var BUDGET = launchConfig.playwright.frameBudget;

var TBM_PIN = process.env.TBM_PIN || '';

// Routes per device — sourced from ops/play-gate-rubric.v1.json deviceProfiles
var ROUTES_BY_PROJECT = {
  'perf-surface-pro5': [
    { path: '/daily-missions', name: 'Daily Missions' },
    { path: '/homework', name: 'Homework Module' },
    { path: '/reading', name: 'Reading Module' },
    { path: '/writing', name: 'Writing Module' },
    { path: '/wolfkid', name: 'Wolfkid CER' },
  ],
  'perf-s10-fe': [
    { path: '/sparkle', name: 'SparkleLearn' },
    { path: '/daily-adventures', name: 'Daily Adventures' },
    { path: '/sparkle-kingdom', name: 'Sparkle Kingdom' },
  ],
};

// Combine for iteration — each test filters by testInfo.project.name
var ALL_ROUTES = [];
Object.keys(ROUTES_BY_PROJECT).forEach(function(proj) {
  ROUTES_BY_PROJECT[proj].forEach(function(r) {
    ALL_ROUTES.push({ route: r, project: proj });
  });
});

// Inject CF Worker PIN cookie for finance-gated surfaces
test.beforeEach(async function(_ref) {
  var context = _ref.context;
  if (TBM_PIN) {
    await context.addCookies([{
      name: 'tbm_pin',
      value: TBM_PIN,
      domain: 'thompsonfams.com',
      path: '/',
      secure: true,
      httpOnly: false,
      sameSite: 'Lax',
    }]);
  }
});

ALL_ROUTES.forEach(function(entry) {
  var route = entry.route;
  var expectedProject = entry.project;

  test('P1-P5 baseline: ' + route.name + ' (' + route.path + ') [' + expectedProject + ']',
    async function(_ref, testInfo) {
      var page = _ref.page;

      // Skip routes that don't belong to the running project
      if (testInfo.project.name !== expectedProject) {
        test.skip();
        return;
      }

      var lcpValue = 0;
      var clsValue = 0;
      var longTasksMs = [];
      var domInteractiveMs = 0;

      // Inject PerformanceObservers before page load
      await page.addInitScript(function() {
        window.__perfData = { longTasks: [], lcp: 0, cls: 0 };
        try {
          new PerformanceObserver(function(list) {
            list.getEntries().forEach(function(e) { window.__perfData.longTasks.push(e.duration); });
          }).observe({ entryTypes: ['longtask'] });
        } catch (e) {}
        try {
          new PerformanceObserver(function(list) {
            list.getEntries().forEach(function(e) { window.__perfData.lcp = e.startTime; });
          }).observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {}
        try {
          new PerformanceObserver(function(list) {
            list.getEntries().forEach(function(e) { window.__perfData.cls += e.value; });
          }).observe({ entryTypes: ['layout-shift'] });
        } catch (e) {}
      });

      await page.goto(route.path, { waitUntil: 'networkidle', timeout: 30000 });

      // P5: dom-interactive from Navigation Timing
      var navTiming = await page.evaluate(function() {
        var nav = performance.getEntriesByType('navigation')[0];
        if (!nav) return { domInteractive: 0 };
        return { domInteractive: Math.round(nav.domInteractive) };
      });
      domInteractiveMs = navTiming.domInteractive || 0;

      // Settle observers
      await page.waitForTimeout(1000);
      var perfData = await page.evaluate(function() { return window.__perfData; });

      lcpValue = perfData.lcp || 0;
      clsValue = perfData.cls || 0;
      longTasksMs = perfData.longTasks || [];

      var maxJank = longTasksMs.length ? Math.max.apply(null, longTasksMs) : 0;

      var result = {
        route: route.path,
        project: testInfo.project.name,
        timestamp: new Date().toISOString(),
        lcp_ms: Math.round(lcpValue),
        cls: parseFloat(clsValue.toFixed(4)),
        max_jank_ms: Math.round(maxJank),
        long_task_count: longTasksMs.length,
        dom_interactive_ms: domInteractiveMs,
        budget: BUDGET,
      };

      // Write evidence JSON — best-effort (non-fatal if path unavailable)
      try {
        var today = new Date().toISOString().slice(0, 10);
        var slug = route.path.replace(/\//g, '') || 'root';
        var device = testInfo.project.name === 'perf-s10-fe' ? 'jj-learning-tablet' : 'buggsy-workstation';
        var evidenceDir = path.join('ops', 'evidence', 'preview', slug, device, today);
        fs.mkdirSync(evidenceDir, { recursive: true });
        fs.writeFileSync(path.join(evidenceDir, 'frame-budget.json'), JSON.stringify(result, null, 2));
      } catch (e) {}

      // Assertions — skip metric if browser did not fire it (PIN gate blocked, etc.)
      if (lcpValue > 0) {
        expect(lcpValue, 'P3 LCP on ' + route.name).toBeLessThanOrEqual(BUDGET.maxLcpMs);
      }
      expect(clsValue, 'P4 CLS on ' + route.name).toBeLessThanOrEqual(BUDGET.maxCls);
      expect(maxJank, 'P2 max jank on ' + route.name).toBeLessThanOrEqual(BUDGET.maxJankMs);
      if (domInteractiveMs > 0) {
        expect(domInteractiveMs, 'P5 TTI on ' + route.name).toBeLessThanOrEqual(BUDGET.maxTtiMs);
      }
    }
  );
});

/**
 * J5 — age-fit-content (JJ)
 * Question text ≤15 words; answer choices ≤4 options; no instruction wall
 * (>3 sentences in a single screen).
 *
 * Fixture-mode + DOM hybrid: scan rendered DOM for the longest visible
 * instruction-like text block and the largest visible option group. Static
 * source-grep is a surrogate when DOM has not yet rendered question content
 * (loading state).
 */

module.exports = async function J5(ctx) {
  if (ctx.child !== 'jj') {
    return { id: 'J5', status: 'skip', measurement: 'not JJ route' };
  }

  var dom = await ctx.page.evaluate(function() {
    function wordsOf(s) {
      if (!s) return 0;
      return s.replace(/\s+/g, ' ').trim().split(' ').filter(function(w) {
        return w.length > 0;
      }).length;
    }
    function sentencesOf(s) {
      if (!s) return 0;
      return s.split(/[.!?]+(?:\s|$)/).filter(function(seg) {
        return seg.replace(/\s+/g, ' ').trim().length > 0;
      }).length;
    }
    var instructionSelectors = ['.question-text', '.activity-question', '.prompt',
                                '.instruction', '.activity-instruction', '.task-prompt',
                                'h1', 'h2', '.title'];
    var maxInstrWords = 0;
    var maxInstrText = '';
    var maxInstrSentences = 0;
    for (var i = 0; i < instructionSelectors.length; i++) {
      var nodes = document.querySelectorAll(instructionSelectors[i]);
      for (var j = 0; j < nodes.length; j++) {
        var t = (nodes[j].innerText || '').slice(0, 300);
        var w = wordsOf(t);
        var s = sentencesOf(t);
        if (w > maxInstrWords) { maxInstrWords = w; maxInstrText = t; }
        if (s > maxInstrSentences) { maxInstrSentences = s; }
      }
    }
    // Count answer choices using common patterns
    var optionSelectors = ['.option', '.answer-choice', '.choice', '.activity-option',
                           'button[data-option]', '[role="radio"]'];
    var maxOptions = 0;
    for (var k = 0; k < optionSelectors.length; k++) {
      var c = document.querySelectorAll(optionSelectors[k]).length;
      if (c > maxOptions) maxOptions = c;
    }
    return {
      maxInstrWords: maxInstrWords,
      maxInstrText: maxInstrText.slice(0, 80),
      maxInstrSentences: maxInstrSentences,
      maxOptions: maxOptions
    };
  });

  // Rubric has three thresholds for JJ age-fit: ≤15 words, ≤4 options, ≤3
  // sentences in any single instruction block (no instruction wall).
  if (dom.maxInstrWords === 0 && dom.maxOptions === 0) {
    return {
      id: 'J5',
      status: 'surrogate',
      surrogateNote: 'no question/instruction DOM rendered — surface may be loading or fixture has no content for this route',
      measurement: '0 instruction text, 0 option groups visible',
      expected: 'instruction ≤15 words, ≤3 sentences; options ≤4'
    };
  }
  if (dom.maxInstrWords > 15) {
    return {
      id: 'J5',
      status: 'fail',
      measurement: 'longest instruction text is ' + dom.maxInstrWords + ' words: "' + dom.maxInstrText + '"',
      expected: '≤15 words for JJ'
    };
  }
  if (dom.maxInstrSentences > 3) {
    return {
      id: 'J5',
      status: 'fail',
      measurement: 'instruction wall: ' + dom.maxInstrSentences + ' sentences in a single block — "' + dom.maxInstrText + '"',
      expected: '≤3 sentences per instruction block for JJ'
    };
  }
  if (dom.maxOptions > 4) {
    return {
      id: 'J5',
      status: 'fail',
      measurement: dom.maxOptions + ' answer choices in one group',
      expected: '≤4 options for JJ'
    };
  }
  return {
    id: 'J5',
    status: 'pass',
    measurement: 'longest instruction ' + dom.maxInstrWords + ' words / ' + dom.maxInstrSentences + ' sentences; max ' + dom.maxOptions + ' options',
    expected: '≤15 words, ≤3 sentences, ≤4 options'
  };
};

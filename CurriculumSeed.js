// CurriculumSeed.gs — v6
// Owned by: KidsHub team
// PURPOSE: One-time seed of 4 weeks of curriculum for JJ and Buggsy
// Run seedAllCurriculum() from the Script Editor to populate the Curriculum tab.
// CurriculumSeed.gs — v6

// ════════════════════════════════════════════════════════════════════
// JJ CURRICULUM — Pre-K (Age 4, KINDLE letter sequence: K,I,N,D,L,E,J,B)
// Activity types match SparkleLearning.html renderer:
//   letter_intro, find_the_letter, find_the_number, count_with_me,
//   quantity_match, color_hunt, shape_match, pattern_next,
//   letter_sound, beginning_sound, letter_trace, number_trace,
//   audio_story, color_sort, more_or_less, name_builder,
//   star_celebration, sparkle_challenge
// ════════════════════════════════════════════════════════════════════

var JJ_WEEK_1 = {
  child: "jj",
  week: 1,
  phase: "Phase 1",
  startDate: "2026-04-06",
  focusLetters: ["K", "I"],
  focusNumbers: [1, 2, 3],
  focusColors: ["red"],
  focusShapes: ["circle"],
  days: {
    Monday: {
      theme: "Letters K and I",
      title: "K is for KINDLE!",
      audioIntro: "Today we learn two new letters — K and I! K is the FIRST letter in KINDLE! Let's do 5 rounds!",
      activities: [
        // Round 1 — introduce K
        { id: "w1m01", type: "letter_intro", letter: "K", stars: 1, word: "KINDLE", image: "fire", audioPrompt: "This is the letter K! K says kuh. K is the FIRST letter in KINDLE — and KINDLE is YOUR name!", audioCorrect: "You know K!" },
        { id: "w1m02", type: "find_the_letter", target: "K", options: ["K", "B", "M"], stars: 1, audioPrompt: "Can you find the letter K?", audioCorrect: "You found K! Great job!", audioWrong: "That's not K. Look for the one with two diagonal lines like arms reaching out." },
        { id: "w1m03", type: "beginning_sound", answer: "K", word: "KINDLE", options: ["K", "A", "M"], stars: 1, audioPrompt: "Which word starts with the kuh sound? Kuh... kuh...", audioCorrect: "KINDLE starts with K! Kuh — KINDLE! That's YOUR name!", audioWrong: "Listen for kuh at the beginning. Kuh... KINDLE!" },
        // Round 2 — introduce I
        { id: "w1m04", type: "letter_intro", letter: "I", stars: 1, word: "Ice cream", image: "ice_cream", audioPrompt: "This is the letter I! I says ih. I is for Ice cream! Don't you love ice cream?", audioCorrect: "You know I!" },
        { id: "w1m05", type: "find_the_letter", target: "I", options: ["I", "L", "T"], stars: 1, audioPrompt: "Can you find the letter I?", audioCorrect: "You found I! Awesome!", audioWrong: "Not quite. I is a straight tall line with little bars on top and bottom." },
        { id: "w1m06", type: "beginning_sound", answer: "I", word: "Igloo", options: ["I", "B", "D"], stars: 1, audioPrompt: "Which word starts with ih? Ih... ih...", audioCorrect: "Igloo starts with I! Ih — Igloo!", audioWrong: "Listen for ih at the beginning. Ih... Igloo!" },
        // Round 3 — K practice, new word
        { id: "w1m07", type: "letter_intro", letter: "K", stars: 1, word: "Kite", image: "kite", audioPrompt: "K is also for Kite! Watch the kite fly up, up, up! Kuh... Kite!", audioCorrect: "K for Kite! Kuh!" },
        { id: "w1m08", type: "find_the_letter", target: "K", options: ["K", "R", "X"], stars: 1, audioPrompt: "Find the letter K again! These letters look a little trickier!", audioCorrect: "You found K! You are so good at this!", audioWrong: "Look carefully — K has two diagonal lines like arms reaching out." },
        { id: "w1m09", type: "beginning_sound", answer: "K", word: "Kitten", options: ["K", "N", "P"], stars: 1, audioPrompt: "Which word starts with kuh? Think of a tiny baby cat!", audioCorrect: "Kitten starts with K! Kuh — Kitten!", audioWrong: "Listen for kuh. Kuh... Kitten! Like a tiny baby cat!" },
        // Round 4 — I practice, new word
        { id: "w1m10", type: "letter_intro", letter: "I", stars: 1, word: "Insect", image: "bug", audioPrompt: "I is also for Insect! Tiny little bugs! Ih... Insect!", audioCorrect: "I for Insect! Ih!" },
        { id: "w1m11", type: "find_the_letter", target: "I", options: ["I", "H", "F"], stars: 1, audioPrompt: "Find the letter I! Look at all three carefully.", audioCorrect: "You found I! You are amazing!", audioWrong: "I is the tall straight one with lines at top AND bottom." },
        { id: "w1m12", type: "beginning_sound", answer: "I", word: "Ice cream", options: ["I", "D", "M"], stars: 1, audioPrompt: "Which word starts with ih? Think about something sweet and cold!", audioCorrect: "Ice cream starts with I! Ih — Ice cream!", audioWrong: "Ih... what is sweet and cold? Ih... Ice cream!" },
        // Round 5 — celebration, hardest distractors
        { id: "w1m13", type: "letter_intro", letter: "K", stars: 1, word: "KINDLE", image: "fire", audioPrompt: "K one more time! K is the FIRST letter in KINDLE — and KINDLE is YOUR name! You are incredible!", audioCorrect: "K! First letter of YOUR name!" },
        { id: "w1m14", type: "find_the_letter", target: "K", options: ["K", "X", "Z"], stars: 2, audioPrompt: "Last K challenge! These letters are sneaky — can you still find K?", audioCorrect: "YES! You found K even in the hard round! SUPERSTAR!", audioWrong: "K has two diagonal lines. X has an X shape. Z has a Z shape. Find K!" },
        { id: "w1m15", type: "beginning_sound", answer: "K", word: "Kite", options: ["K", "B", "L"], stars: 2, audioPrompt: "Last one! Which word starts with kuh? You have got this!", audioCorrect: "Kite! Kuh — Kite! You learned K today! Amazing work, JJ!", audioWrong: "Kuh... Kite! A kite flies in the sky!" }
      ]
    },
    Tuesday: {
      theme: "Numbers 1, 2, 3",
      title: "Counting Day!",
      audioIntro: "Today is number day! Let's count 1, 2, 3 together! Five rounds — let's go!",
      activities: [
        // Round 1 — count 2, find 1, match 1/2/3
        { id: "w1t01", type: "count_with_me", targetNumber: 2, objects: "stars", stars: 1, audioPrompt: "Let's count the stars! Tap each one as I say it. One... two!", audioCorrect: "Two stars! You counted them all!" },
        { id: "w1t02", type: "find_the_number", target: 1, options: [1, 3, 5], stars: 1, audioPrompt: "Can you find the number 1? It looks like a straight stick!", audioCorrect: "That's the number 1! One!", audioWrong: "1 looks like a straight stick. Try again!" },
        { id: "w1t03", type: "quantity_match", numbers: [1, 2, 3], stars: 1, audioPrompt: "Match each number to the right group of things! 1, 2, and 3!", audioCorrect: "Perfect matching! 1, 2, 3!", audioWrong: "Count the objects in each group carefully." },
        // Round 2 — count 3, find 2, match reversed
        { id: "w1t04", type: "count_with_me", targetNumber: 3, objects: "hearts", stars: 1, audioPrompt: "Now let's count hearts! Tap each one. One... two... three!", audioCorrect: "Three hearts! Amazing counting!" },
        { id: "w1t05", type: "find_the_number", target: 2, options: [1, 2, 4], stars: 1, audioPrompt: "Can you find the number 2? It has a curve on top!", audioCorrect: "That's number 2! Two!", audioWrong: "2 has a curve at the top and a flat bottom." },
        { id: "w1t06", type: "quantity_match", numbers: [2, 1, 3], stars: 1, audioPrompt: "Match again! Same numbers — different order this time!", audioCorrect: "Great matching! You counted each group!", audioWrong: "Count the dots in each group. Match to 1, 2, or 3." },
        // Round 3 — count 1, find 3, match scrambled
        { id: "w1t07", type: "count_with_me", targetNumber: 1, objects: "moons", stars: 1, audioPrompt: "How many moons? Just tap it. One moon!", audioCorrect: "One moon! Just one!" },
        { id: "w1t08", type: "find_the_number", target: 3, options: [2, 3, 4], stars: 1, audioPrompt: "Find the number 3! Three has two bumps on the right side!", audioCorrect: "You found 3! Three!", audioWrong: "3 has two bumps on the right side. Look carefully!" },
        { id: "w1t09", type: "quantity_match", numbers: [3, 1, 2], stars: 1, audioPrompt: "Match the numbers to the groups! Counting is getting easier!", audioCorrect: "Excellent matching! You are a counting superstar!", audioWrong: "Count the dots in each group carefully." },
        // Round 4 — count 2, find 1 (mixed position), match scrambled
        { id: "w1t10", type: "count_with_me", targetNumber: 2, objects: "butterflies", stars: 1, audioPrompt: "Count the butterflies flapping their wings! One... two!", audioCorrect: "Two butterflies! You counted them!" },
        { id: "w1t11", type: "find_the_number", target: 1, options: [2, 1, 3], stars: 1, audioPrompt: "Find the number 1! The numbers are in a different order now!", audioCorrect: "You found 1! A straight stick!", audioWrong: "1 is the straight one. Look for it!" },
        { id: "w1t12", type: "quantity_match", numbers: [1, 3, 2], stars: 1, audioPrompt: "Match time! Count carefully — you have got this!", audioCorrect: "Perfect! 1, 2, 3 — you matched them all!", audioWrong: "Count the dots in each group. Then match to the number." },
        // Round 5 — count 3, find 2 (reversed options), celebration match
        { id: "w1t13", type: "count_with_me", targetNumber: 3, objects: "sparkles", stars: 1, audioPrompt: "Final count! Count the sparkles! One... two... THREE!", audioCorrect: "Three sparkles! You are a counting champion!" },
        { id: "w1t14", type: "find_the_number", target: 2, options: [3, 2, 1], stars: 2, audioPrompt: "Last number challenge! Find the number 2 — the numbers are all mixed up!", audioCorrect: "You found 2! Amazing work today!", audioWrong: "2 has a curve at the top and a flat bottom. Find it!" },
        { id: "w1t15", type: "quantity_match", numbers: [2, 3, 1], stars: 2, audioPrompt: "Final match! Show me you know 1, 2, and 3!", audioCorrect: "PERFECT! You matched 1, 2, and 3! You are incredible at counting!", audioWrong: "Count each group of dots. You can do this!" }
      ]
    },
    Wednesday: {
      theme: "Colors and Shapes",
      title: "Red and Round!",
      audioIntro: "Today we explore the color red and practice shapes! Let's go on a color adventure — 5 rounds!",
      activities: [
        // Round 1 — red, circle, AB star/moon pattern
        { id: "w1w01", type: "color_hunt", targetColor: "red", count: 3, stars: 1, audioPrompt: "Find 3 red things! Red is the color of fire trucks and apples!", audioCorrect: "You found red! Great eyes!", audioWrong: "That is not red — look for the color of a fire truck." },
        { id: "w1w02", type: "shape_match", target: "circle", options: ["circle", "square", "triangle"], stars: 1, audioPrompt: "Which one is a circle? A circle is perfectly round like a ball!", audioCorrect: "That is a circle! Round and round!", audioWrong: "A circle is perfectly round — no corners at all." },
        { id: "w1w03", type: "pattern_next", pattern: [{shape:"star",color:"gold"},{shape:"moon",color:"purple"},{shape:"star",color:"gold"},{shape:"moon",color:"purple"}], answer: {shape:"star",color:"gold"}, options: [{shape:"star",color:"gold"},{shape:"moon",color:"purple"},{shape:"heart",color:"pink"}], stars: 2, audioPrompt: "Star, moon, star, moon... what comes next?", audioCorrect: "Star! You see the pattern! Star moon, star moon!", audioWrong: "Look at the pattern again: star, moon, star, moon..." },
        // Round 2 — red, square, AAB circle/star pattern
        { id: "w1w04", type: "color_hunt", targetColor: "red", count: 2, stars: 1, audioPrompt: "Find 2 red things this time! You are a red expert!", audioCorrect: "Red! Bright and beautiful!", audioWrong: "Red is the color of a tomato. Look again!" },
        { id: "w1w05", type: "shape_match", target: "square", options: ["circle", "square", "triangle"], stars: 1, audioPrompt: "Find the square! A square has 4 equal sides — they are all the same length!", audioCorrect: "That is a square! Four equal sides!", audioWrong: "A square has 4 equal sides and 4 corners." },
        { id: "w1w06", type: "pattern_next", pattern: [{shape:"circle",color:"blue"},{shape:"circle",color:"blue"},{shape:"star",color:"gold"},{shape:"circle",color:"blue"},{shape:"circle",color:"blue"}], answer: {shape:"star",color:"gold"}, options: [{shape:"circle",color:"blue"},{shape:"star",color:"gold"},{shape:"moon",color:"purple"}], stars: 2, audioPrompt: "Circle, circle, star, circle, circle... what comes next?", audioCorrect: "Star! The star comes every third spot!", audioWrong: "Count: circle, circle, star... circle, circle, ?" },
        // Round 3 — red, triangle, AB heart/star pattern
        { id: "w1w07", type: "color_hunt", targetColor: "red", count: 3, stars: 1, audioPrompt: "Find 3 more red things! Red like Buggsy's favorite color!", audioCorrect: "You found red again! You are amazing!", audioWrong: "Red is bright and bold. Look for fire-truck red!" },
        { id: "w1w08", type: "shape_match", target: "triangle", options: ["circle", "square", "triangle"], stars: 1, audioPrompt: "Find the triangle! A triangle has THREE sides and THREE corners!", audioCorrect: "That is a triangle! Three sides, three corners!", audioWrong: "A triangle has 3 sides and 3 points. Look for the pointy one!" },
        { id: "w1w09", type: "pattern_next", pattern: [{shape:"heart",color:"pink"},{shape:"star",color:"gold"},{shape:"heart",color:"pink"},{shape:"star",color:"gold"}], answer: {shape:"heart",color:"pink"}, options: [{shape:"heart",color:"pink"},{shape:"star",color:"gold"},{shape:"moon",color:"purple"}], stars: 2, audioPrompt: "Heart, star, heart, star... what comes next?", audioCorrect: "Heart! You see the heart-star pattern!", audioWrong: "Heart, star, heart, star... the pattern goes: heart, star, repeat." },
        // Round 4 — red, circle (harder distractors), AB moon/star pattern
        { id: "w1w10", type: "color_hunt", targetColor: "red", count: 2, stars: 1, audioPrompt: "Find 2 red things! You are getting so good at spotting red!", audioCorrect: "Two red things! Perfect!", audioWrong: "Remember — red is the color of apples and fire trucks." },
        { id: "w1w11", type: "shape_match", target: "circle", options: ["circle", "triangle", "star"], stars: 1, audioPrompt: "Find the circle! These shapes might trick you — look carefully!", audioCorrect: "Circle! Round with no corners!", audioWrong: "A circle has NO corners. It is perfectly round." },
        { id: "w1w12", type: "pattern_next", pattern: [{shape:"moon",color:"purple"},{shape:"star",color:"gold"},{shape:"moon",color:"purple"},{shape:"star",color:"gold"}], answer: {shape:"moon",color:"purple"}, options: [{shape:"moon",color:"purple"},{shape:"star",color:"gold"},{shape:"heart",color:"pink"}], stars: 2, audioPrompt: "Moon, star, moon, star... what comes next?", audioCorrect: "Moon! Moon, star, moon, star — you see it!", audioWrong: "Look: moon, star, moon, star... moon comes after every star." },
        // Round 5 — celebration round
        { id: "w1w13", type: "color_hunt", targetColor: "red", count: 3, stars: 1, audioPrompt: "Final red challenge! Find 3 red things one more time!", audioCorrect: "RED CHAMPION! You found all 3!", audioWrong: "Red is the warm bright color of apples. You can find it!" },
        { id: "w1w14", type: "shape_match", target: "square", options: ["square", "circle", "star"], stars: 1, audioPrompt: "Final shape! Find the square — four equal sides!", audioCorrect: "Square! Four equal sides! Perfect!", audioWrong: "Square has four sides all the same length." },
        { id: "w1w15", type: "pattern_next", pattern: [{shape:"star",color:"gold"},{shape:"heart",color:"pink"},{shape:"star",color:"gold"},{shape:"heart",color:"pink"}], answer: {shape:"star",color:"gold"}, options: [{shape:"star",color:"gold"},{shape:"heart",color:"pink"},{shape:"moon",color:"purple"}], stars: 2, audioPrompt: "Last pattern! Star, heart, star, heart... what is next?", audioCorrect: "STAR! You are a pattern master! Amazing Wednesday, JJ!", audioWrong: "Star, heart, star, heart... the star comes after every heart." }
      ]
    },
    Thursday: {
      theme: "Letter Sounds",
      title: "What Sound Does K Make?",
      audioIntro: "Today we listen super carefully to the sounds K and I make! Kuh and ih! 5 rounds of sounds!",
      activities: [
        // Round 1 — K sound, find K, K beginning sound
        { id: "w1th01", type: "letter_sound", letter: "K", stars: 1, audioPrompt: "K says kuh! Say it with me: kuh, kuh, kuh! K is for KINDLE! Kuh — KINDLE!", audioCorrect: "That is right! K says kuh!" },
        { id: "w1th02", type: "find_the_letter", target: "K", options: ["K", "B", "M"], stars: 1, audioPrompt: "Find the letter that says kuh! Which one is K?", audioCorrect: "K! The letter that says kuh!", audioWrong: "K has two diagonal lines like arms. That is the kuh letter!" },
        { id: "w1th03", type: "beginning_sound", answer: "K", word: "KINDLE", options: ["K", "A", "M"], stars: 1, audioPrompt: "Which word starts with kuh? Listen for the kuh sound!", audioCorrect: "KINDLE starts with kuh — K! That is YOUR name!", audioWrong: "Kuh... kuh... KINDLE! Listen for that kuh sound!" },
        // Round 2 — I sound, find I, I beginning sound
        { id: "w1th04", type: "letter_sound", letter: "I", stars: 1, audioPrompt: "I says ih! Say it with me: ih, ih, ih! I is for Igloo! Ih — Igloo!", audioCorrect: "That is right! I says ih!" },
        { id: "w1th05", type: "find_the_letter", target: "I", options: ["I", "L", "T"], stars: 1, audioPrompt: "Find the letter that says ih! Which one is I?", audioCorrect: "I! The letter that says ih!", audioWrong: "I is the straight tall one with little bars on top and bottom." },
        { id: "w1th06", type: "beginning_sound", answer: "I", word: "Igloo", options: ["I", "B", "D"], stars: 1, audioPrompt: "Which word starts with ih? Listen for ih at the beginning!", audioCorrect: "Igloo starts with ih — I!", audioWrong: "Ih... ih... Igloo! The snow house!" },
        // Round 3 — K review (new word), harder distractors
        { id: "w1th07", type: "letter_sound", letter: "K", stars: 1, audioPrompt: "K says kuh again! Kuh, kuh, Kite! K is also for Kite! Kuh — Kite!", audioCorrect: "Kuh! You know K sound!" },
        { id: "w1th08", type: "find_the_letter", target: "K", options: ["K", "R", "X"], stars: 1, audioPrompt: "Find K again! Trickier letters this time — which one is K?", audioCorrect: "K! You spotted it! Kuh!", audioWrong: "K has two diagonal lines going up-right and down-right." },
        { id: "w1th09", type: "beginning_sound", answer: "K", word: "Kitten", options: ["K", "N", "P"], stars: 1, audioPrompt: "Which word starts with kuh? Think of a tiny baby cat!", audioCorrect: "Kitten starts with K! Kuh — Kitten! Like a baby cat!", audioWrong: "Kuh... what is a tiny baby cat? Kuh... Kitten!" },
        // Round 4 — I review (new word), harder distractors
        { id: "w1th10", type: "letter_sound", letter: "I", stars: 1, audioPrompt: "I says ih one more time! Ih, ih, Insect! Tiny bugs! Ih — Insect!", audioCorrect: "Ih! You know I sound!" },
        { id: "w1th11", type: "find_the_letter", target: "I", options: ["I", "H", "F"], stars: 1, audioPrompt: "Find I again! Look at all these letters — which one says ih?", audioCorrect: "I! The letter that goes ih!", audioWrong: "I is the straight tall line with bars on top AND bottom." },
        { id: "w1th12", type: "beginning_sound", answer: "I", word: "Ice cream", options: ["I", "D", "M"], stars: 1, audioPrompt: "Which word starts with ih? Think of something sweet and cold!", audioCorrect: "Ice cream starts with I! Ih — Ice cream!", audioWrong: "Ih... what is sweet and cold? Ih... Ice cream!" },
        // Round 5 — K and I celebration
        { id: "w1th13", type: "letter_sound", letter: "K", stars: 1, audioPrompt: "K one last time! Kuh! Say it loud: KUH! K is the FIRST sound in YOUR name KINDLE!", audioCorrect: "KUH! You know K sound forever!" },
        { id: "w1th14", type: "find_the_letter", target: "I", options: ["I", "H", "F"], stars: 1, audioPrompt: "And one last I! Which one says ih? You know this!", audioCorrect: "I! Ih! You know both K and I now!", audioWrong: "I is the one with bars on top and bottom." },
        { id: "w1th15", type: "beginning_sound", answer: "K", word: "Kite", options: ["K", "B", "L"], stars: 2, audioPrompt: "Very last one! Which word starts with kuh? You have learned so much today!", audioCorrect: "KITE! Kuh — KITE! You are a SUPERSTAR! You know K and I sounds!", audioWrong: "Kuh... Kite! A kite flies in the sky!" }
      ]
    },
    Friday: {
      theme: "Fun Review Day",
      title: "Sparkle Friday!",
      audioIntro: "It is Friday! Time to show everything you learned this week! You are AMAZING! 15 rounds of champion review!",
      activities: [
        // Group 1 — Letters K and I
        { id: "w1f01", type: "find_the_letter", target: "K", options: ["K", "B", "M"], stars: 1, audioPrompt: "Let us start with letters! Find the letter K!", audioCorrect: "K! You remember!", audioWrong: "Look for K — two diagonal lines like arms." },
        { id: "w1f02", type: "letter_sound", letter: "I", stars: 1, audioPrompt: "What sound does I make? Say it out loud!", audioCorrect: "Ih! I says ih! You remember your letter sounds!" },
        { id: "w1f03", type: "beginning_sound", answer: "K", word: "KINDLE", options: ["K", "A", "M"], stars: 1, audioPrompt: "Which word starts with kuh? Your very own name!", audioCorrect: "KINDLE starts with K! That is YOUR name!", audioWrong: "Kuh... kuh... KINDLE! Listen for the kuh sound!" },
        // Group 2 — Numbers 1, 2, 3
        { id: "w1f04", type: "count_with_me", targetNumber: 2, objects: "stars", stars: 1, audioPrompt: "Count the stars! Show me you can count to 2!", audioCorrect: "Two! You can count!" },
        { id: "w1f05", type: "find_the_number", target: 3, options: [1, 2, 3], stars: 1, audioPrompt: "Find the number 3! You learned all three numbers this week!", audioCorrect: "3! You found it!", audioWrong: "3 has two bumps on the right side." },
        { id: "w1f06", type: "quantity_match", numbers: [1, 2, 3], stars: 1, audioPrompt: "Match the numbers to the right groups! 1, 2, and 3!", audioCorrect: "Perfect matching! 1, 2, 3! You are a number expert!", audioWrong: "Count each group carefully. Then match to the number." },
        // Group 3 — Colors and Shapes
        { id: "w1f07", type: "color_hunt", targetColor: "red", count: 3, stars: 1, audioPrompt: "Find 3 red things! You know red like the back of your hand!", audioCorrect: "RED! You found all 3!" },
        { id: "w1f08", type: "shape_match", target: "circle", options: ["circle", "square", "triangle"], stars: 1, audioPrompt: "Find the circle! The perfectly round shape!", audioCorrect: "Circle! Round and perfect!" },
        { id: "w1f09", type: "pattern_next", pattern: [{shape:"star",color:"gold"},{shape:"moon",color:"purple"},{shape:"star",color:"gold"},{shape:"moon",color:"purple"}], answer: {shape:"star",color:"gold"}, options: [{shape:"star",color:"gold"},{shape:"moon",color:"purple"},{shape:"heart",color:"pink"}], stars: 2, audioPrompt: "Star, moon, star, moon... what comes next?", audioCorrect: "Star! Pattern master!", audioWrong: "Star, moon, star, moon... which comes next?" },
        // Group 4 — Mixed challenge
        { id: "w1f10", type: "find_the_letter", target: "I", options: ["I", "H", "F"], stars: 1, audioPrompt: "Now find I! The letter that says ih!", audioCorrect: "I! Ih! You got it!" },
        { id: "w1f11", type: "find_the_number", target: 1, options: [2, 1, 3], stars: 1, audioPrompt: "Find the number 1! The straight stick number!", audioCorrect: "1! One! Straight like a stick!", audioWrong: "1 is the straight one. It looks like a stick!" },
        { id: "w1f12", type: "shape_match", target: "square", options: ["square", "circle", "star"], stars: 1, audioPrompt: "Find the square! Four equal sides!", audioCorrect: "Square! Four equal sides! Perfect!" },
        // Group 5 — Celebration
        { id: "w1f13", type: "name_builder", name: "JJ", letters: ["J", "J"], stars: 3, audioPrompt: "Build YOUR name! Put the letters in order to spell JJ!", audioCorrect: "J-J! That is YOUR name! YOU did it!" },
        { id: "w1f14", type: "find_the_letter", target: "K", options: ["K", "X", "Z"], stars: 2, audioPrompt: "Final challenge! Find K one more time! You can do this!", audioCorrect: "K! You found K! The first letter of KINDLE!", audioWrong: "K has two diagonal lines. You can find it!" },
        { id: "w1f15", type: "star_celebration", stars: 5, message: "AMAZING FIRST WEEK, JJ! You learned letters K and I, numbers 1, 2, and 3, the color red, circle square and triangle shapes, AND patterns! 15 rounds done! You are a SUPERSTAR!" }
      ]
    }
  }
};

var JJ_WEEK_2 = {
  child: "jj",
  week: 2,
  phase: "Phase 1",
  startDate: "2026-04-13",
  focusLetters: ["N", "D"],
  focusNumbers: [1, 2, 3, 4],
  focusColors: ["blue"],
  focusShapes: ["square", "triangle"],
  reviewLetters: ["K", "I"],
  days: {
    Monday: {
      theme: "Letters N and D",
      title: "N is for Nathan!",
      audioIntro: "Today we review K, then learn two new letters — N and D!",
      activities: [
        { id: "w2m1", type: "find_the_letter", target: "K", options: ["K", "M", "R"], stars: 1, audioPrompt: "Let's start with a review! Find the letter K!", audioCorrect: "K! You remembered from last week!", audioWrong: "That's not K. K has two diagonal lines." },
        { id: "w2m2", type: "letter_intro", letter: "N", stars: 1, word: "Nathan", image: "boy", audioPrompt: "This is the letter N! N is for Nathan! Your uncle Nathan!" },
        { id: "w2m3", type: "find_the_letter", target: "N", options: ["N", "M", "H"], stars: 1, audioPrompt: "Can you find the letter N?", audioCorrect: "You found N!", audioWrong: "N has two tall lines with one diagonal line between them." },
        { id: "w2m4", type: "letter_intro", letter: "D", stars: 1, word: "Daddy", image: "dad", audioPrompt: "This is the letter D! D is for Daddy! Look — the big belly is on the RIGHT side!" },
        { id: "w2m5", type: "find_the_letter", target: "D", options: ["B", "P", "D", "Q"], stars: 2, audioPrompt: "Can you find the letter D? Remember — big belly on the RIGHT!", audioCorrect: "You found D! Belly on the right — that's Daddy!", audioWrong: "Look carefully — D has the big round belly on the RIGHT side." },
        { id: "w2m6", type: "name_builder", name: "JJ", letters: ["J", "J"], stars: 3, audioPrompt: "Build your name! Spell JJ!", audioCorrect: "J-J! That's your name!" }
      ]
    },
    Tuesday: {
      theme: "Numbers to 4",
      title: "Counting Higher!",
      audioIntro: "Today we count up to 4! Let's go!",
      activities: [
        { id: "w2t1", type: "count_with_me", targetNumber: 3, objects: "sparkles", stars: 1, audioPrompt: "Count the sparkles! One... two... three!", audioCorrect: "Three sparkles!" },
        { id: "w2t2", type: "count_with_me", targetNumber: 4, objects: "moons", stars: 1, audioPrompt: "Count the moons! One... two... three... four!", audioCorrect: "Four moons! You counted to 4!" },
        { id: "w2t3", type: "find_the_number", target: 4, options: [2, 4, 6], stars: 1, audioPrompt: "Can you find the number 4?", audioCorrect: "That's 4!", audioWrong: "4 looks like a flag on a pole." },
        { id: "w2t4", type: "find_the_number", target: 2, options: [1, 2, 3], stars: 1, audioPrompt: "Can you find the number 2?", audioCorrect: "That's 2!", audioWrong: "2 has a curve at the top and a flat line at the bottom." },
        { id: "w2t5", type: "quantity_match", numbers: [2, 4, 1], stars: 1, audioPrompt: "Match each number to the right group!", audioCorrect: "Perfect matching!", audioWrong: "Count the objects in each group carefully." }
      ]
    },
    Wednesday: {
      theme: "Blue and Shapes",
      title: "Blue Shapes Day!",
      audioIntro: "Today we explore the color blue and practice shapes!",
      activities: [
        { id: "w2w1", type: "color_hunt", targetColor: "blue", count: 3, stars: 1, audioPrompt: "Find 3 blue things! Blue like the sky!", audioCorrect: "You found blue!", audioWrong: "That's not blue — look for the color of the sky." },
        { id: "w2w2", type: "shape_match", target: "square", options: ["circle", "square", "triangle"], stars: 1, audioPrompt: "Which one is a square?", audioCorrect: "That's a square!", audioWrong: "A square has 4 equal sides and 4 corners." },
        { id: "w2w3", type: "shape_match", target: "triangle", options: ["circle", "square", "triangle"], stars: 1, audioPrompt: "Which one is a triangle? A triangle has 3 sides!", audioCorrect: "That's a triangle! Three sides!", audioWrong: "A triangle has 3 sides and 3 points." },
        { id: "w2w4", type: "color_hunt", targetColor: "red", count: 2, stars: 1, audioPrompt: "Review time! Find 2 red things!", audioCorrect: "Red! You remember from last week!" },
        { id: "w2w5", type: "pattern_next", pattern: [{shape:"circle",color:"red"},{shape:"square",color:"blue"},{shape:"circle",color:"red"},{shape:"square",color:"blue"}], answer: {shape:"circle",color:"red"}, options: [{shape:"circle",color:"red"},{shape:"square",color:"blue"},{shape:"triangle",color:"green"}], stars: 2, audioPrompt: "Circle, square, circle, square... what comes next?", audioCorrect: "Circle! You see the pattern!", audioWrong: "Look at the pattern: circle, square, circle, square..." }
      ]
    },
    Thursday: {
      theme: "Letter Sounds N and D",
      title: "Sound Safari!",
      audioIntro: "Today we listen to the sounds that N and D make!",
      activities: [
        { id: "w2th1", type: "letter_sound", letter: "N", stars: 1, audioPrompt: "N says nuh. Nuh, nuh, Nathan! N is for Nathan!", audioCorrect: "That's right! N says nuh!" },
        { id: "w2th2", type: "letter_sound", letter: "D", stars: 1, audioPrompt: "D says duh. Duh, duh, Daddy! D is for Daddy!", audioCorrect: "That's right! D says duh!" },
        { id: "w2th3", type: "beginning_sound", answer: "D", word: "Daddy", options: ["D", "M", "K"], stars: 1, audioPrompt: "Which word starts with D? Duh...", audioCorrect: "Daddy starts with D!", audioWrong: "Listen for the duh sound at the beginning." },
        { id: "w2th4", type: "letter_trace", letter: "N", stars: 2, uppercase: true, audioPrompt: "Trace the letter N! Two tall lines with a diagonal between them.", audioCorrect: "Beautiful N!" },
        { id: "w2th5", type: "audio_story", title: "JJ's Kitchen", stars: 2, storyId: "jj-kitchen", audioPrompt: "Story time! In this story JJ gets 3 scoops of ice cream!", audioCorrect: "Great listening! How many scoops did JJ get? Three!" }
      ]
    },
    Friday: {
      theme: "Week 2 Review",
      title: "Sparkle Friday!",
      audioIntro: "It's Friday! Let's show what we learned!",
      activities: [
        { id: "w2f1", type: "find_the_letter", target: "D", options: ["B", "P", "D", "Q"], stars: 2, audioPrompt: "Find the letter D! Remember — belly on the RIGHT!", audioCorrect: "D! Belly on the right!", audioWrong: "D has the round part on the right side." },
        { id: "w2f2", type: "find_the_number", target: 4, options: [3, 4, 5], stars: 1, audioPrompt: "Find the number 4!", audioCorrect: "That's 4!", audioWrong: "4 looks like a flag on a pole." },
        { id: "w2f3", type: "color_hunt", targetColor: "blue", count: 3, stars: 1, audioPrompt: "Find 3 blue things!", audioCorrect: "Blue! Like the sky!" },
        { id: "w2f4", type: "shape_match", target: "triangle", options: ["circle", "square", "triangle"], stars: 1, audioPrompt: "Find the triangle!", audioCorrect: "Triangle! Three sides!" },
        { id: "w2f5", type: "name_builder", name: "JJ", letters: ["J", "J"], stars: 3, audioPrompt: "Build your name!", audioCorrect: "J-J! That's you!" },
        { id: "w2f6", type: "star_celebration", stars: 3, message: "Week 2 done! You know K, I, N, and D! That's four letters of KINDLE!" }
      ]
    }
  }
};

var JJ_WEEK_3 = {
  child: "jj",
  week: 3,
  phase: "Phase 1",
  startDate: "2026-04-20",
  focusLetters: ["L", "E"],
  focusNumbers: [1, 2, 3, 4, 5],
  focusColors: ["yellow"],
  focusShapes: ["rectangle", "star"],
  reviewLetters: ["K", "I", "N", "D"],
  days: {
    Monday: {
      theme: "Letters L and E — KINDLE complete!",
      title: "L is for LeShawd!",
      audioIntro: "Today is a BIG day! We learn L and E — and then we can spell KINDLE!",
      activities: [
        { id: "w3m1", type: "find_the_letter", target: "K", options: ["K", "R", "X"], stars: 1, audioPrompt: "Quick review! Find the letter K!", audioCorrect: "K! First letter of KINDLE!", audioWrong: "K has two diagonal lines." },
        { id: "w3m2", type: "letter_intro", letter: "L", stars: 1, word: "LeShawd", image: "boy", audioPrompt: "This is the letter L! L is for LeShawd! Your uncle LeShawd!" },
        { id: "w3m3", type: "find_the_letter", target: "L", options: ["L", "I", "T"], stars: 1, audioPrompt: "Can you find the letter L?", audioCorrect: "You found L!", audioWrong: "L is a tall line with a short line at the bottom going right." },
        { id: "w3m4", type: "letter_intro", letter: "E", stars: 1, word: "Excellent", image: "star", audioPrompt: "This is the letter E! E is for Excellent! E is the LAST letter of KINDLE!" },
        { id: "w3m5", type: "find_the_letter", target: "E", options: ["E", "F", "3"], stars: 2, audioPrompt: "Can you find the letter E? Be careful — E and 3 look similar!", audioCorrect: "You found E! Not the number 3!", audioWrong: "E has three horizontal lines pointing RIGHT. The number 3 has bumps pointing left." },
        { id: "w3m6", type: "name_builder", name: "KINDLE", letters: ["K", "I", "N", "D", "L", "E"], stars: 5, audioPrompt: "THE BIG MOMENT! Let's spell KINDLE! K... I... N... D... L... E!", audioCorrect: "K-I-N-D-L-E! KINDLE! You spelled KINDLE! This is AMAZING!" }
      ]
    },
    Tuesday: {
      theme: "Numbers to 5",
      title: "Counting to Five!",
      audioIntro: "Today we count up to 5! That's a whole hand of fingers!",
      activities: [
        { id: "w3t1", type: "count_with_me", targetNumber: 4, objects: "butterflies", stars: 1, audioPrompt: "Count the butterflies! One... two... three... four!", audioCorrect: "Four butterflies!" },
        { id: "w3t2", type: "count_with_me", targetNumber: 5, objects: "flowers", stars: 1, audioPrompt: "Count the flowers! One... two... three... four... FIVE!", audioCorrect: "Five flowers! That's a whole hand!" },
        { id: "w3t3", type: "find_the_number", target: 5, options: [3, 5, 2], stars: 1, audioPrompt: "Can you find the number 5?", audioCorrect: "That's 5!", audioWrong: "5 has a flat top and a round belly at the bottom." },
        { id: "w3t4", type: "quantity_match", numbers: [3, 5, 1, 4], stars: 2, audioPrompt: "Match each number to the right group of objects!", audioCorrect: "Perfect matching!", audioWrong: "Count each group carefully." }
      ]
    },
    Wednesday: {
      theme: "Yellow and New Shapes",
      title: "Yellow Shapes Day!",
      audioIntro: "Today we explore the color yellow and learn rectangle and star!",
      activities: [
        { id: "w3w1", type: "color_hunt", targetColor: "yellow", count: 3, stars: 1, audioPrompt: "Find 3 yellow things! Yellow like the sun!", audioCorrect: "You found yellow!", audioWrong: "That's not yellow — look for the color of the sun." },
        { id: "w3w2", type: "shape_match", target: "rectangle", options: ["square", "rectangle", "circle"], stars: 1, audioPrompt: "Which one is a rectangle? A rectangle is like a stretched-out square!", audioCorrect: "That's a rectangle!", audioWrong: "A rectangle has 4 sides but two sides are longer than the other two." },
        { id: "w3w3", type: "shape_match", target: "star", options: ["star", "diamond", "circle"], stars: 1, audioPrompt: "Which one is a star? Stars have points!", audioCorrect: "That's a star! It has 5 points!", audioWrong: "A star has 5 points sticking out." },
        { id: "w3w4", type: "color_sort", colors: ["red", "blue", "yellow"], items: [{ name: "apple", color: "red" }, { name: "sky", color: "blue" }, { name: "sun", color: "yellow" }, { name: "truck", color: "red" }, { name: "ocean", color: "blue" }, { name: "banana", color: "yellow" }], stars: 2, audioPrompt: "Sort these into red, blue, and yellow groups!", audioCorrect: "Perfect sorting!", audioWrong: "Look at the color of each thing carefully." },
        { id: "w3w5", type: "pattern_next", pattern: [{shape:"circle",color:"red"},{shape:"circle",color:"blue"},{shape:"circle",color:"yellow"},{shape:"circle",color:"red"},{shape:"circle",color:"blue"}], answer: {shape:"circle",color:"yellow"}, options: [{shape:"circle",color:"yellow"},{shape:"circle",color:"red"},{shape:"circle",color:"blue"}], stars: 2, audioPrompt: "Red, blue, yellow, red, blue... what comes next?", audioCorrect: "Yellow! You see the pattern!", audioWrong: "The pattern is red, blue, yellow, red, blue..." }
      ]
    },
    Thursday: {
      theme: "Letter Sounds L and E",
      title: "Sound Explorer!",
      audioIntro: "Today we listen to the sounds L and E make!",
      activities: [
        { id: "w3th1", type: "letter_sound", letter: "L", stars: 1, audioPrompt: "L says luh. Luh, luh, LeShawd! L is for LeShawd!", audioCorrect: "That's right! L says luh!" },
        { id: "w3th2", type: "letter_sound", letter: "E", stars: 1, audioPrompt: "E says eh. Eh, eh, elephant! E is for elephant!", audioCorrect: "That's right! E says eh!" },
        { id: "w3th3", type: "beginning_sound", answer: "L", word: "lion", options: ["L", "T", "B"], stars: 1, audioPrompt: "Which word starts with L? Luh...", audioCorrect: "Lion starts with L!", audioWrong: "Listen for the luh sound at the beginning." },
        { id: "w3th4", type: "letter_trace", letter: "E", stars: 2, uppercase: true, audioPrompt: "Trace the letter E! One tall line and three short lines going right.", audioCorrect: "Beautiful E!" },
        { id: "w3th5", type: "audio_story", title: "JJ and Buggsy's Treasure Hunt", stars: 2, storyId: "jj-buggsy-treasure", audioPrompt: "Story time! JJ and Buggsy find 5 treasures on their adventure!", audioCorrect: "Great listening! They found 5 treasures!" }
      ]
    },
    Friday: {
      theme: "KINDLE Celebration!",
      title: "KINDLE CELEBRATION!",
      audioIntro: "It's KINDLE celebration day! You can spell the whole word! Let's celebrate!",
      activities: [
        { id: "w3f1", type: "name_builder", name: "KINDLE", letters: ["K", "I", "N", "D", "L", "E"], stars: 5, audioPrompt: "Spell KINDLE one more time! You know all six letters!", audioCorrect: "K-I-N-D-L-E! KINDLE! You are INCREDIBLE!" },
        { id: "w3f2", type: "find_the_number", target: 5, options: [3, 5, 7], stars: 1, audioPrompt: "Find the number 5!", audioCorrect: "That's 5! A whole hand!" },
        { id: "w3f3", type: "color_hunt", targetColor: "yellow", count: 3, stars: 1, audioPrompt: "Find 3 yellow things!", audioCorrect: "You found yellow!" },
        { id: "w3f4", type: "shape_match", target: "star", options: ["circle", "star", "square"], stars: 1, audioPrompt: "Find the star!", audioCorrect: "Star! You're a star!" },
        { id: "w3f5", type: "pattern_next", pattern: [{shape:"star",color:"gold"},{shape:"heart",color:"pink"},{shape:"star",color:"gold"},{shape:"heart",color:"pink"}], answer: {shape:"star",color:"gold"}, options: [{shape:"star",color:"gold"},{shape:"heart",color:"pink"},{shape:"moon",color:"purple"}], stars: 2, audioPrompt: "Star, heart, star, heart... what comes next?", audioCorrect: "Star! You see the pattern!" },
        { id: "w3f6", type: "star_celebration", stars: 5, message: "KINDLE CELEBRATION! You can spell KINDLE! K-I-N-D-L-E! You are a SUPERSTAR!" }
      ]
    }
  }
};

var JJ_WEEK_4 = {
  child: "jj",
  week: 4,
  phase: "Phase 1",
  startDate: "2026-04-27",
  focusLetters: ["J", "B"],
  focusNumbers: [1, 2, 3, 4, 5],
  focusColors: ["green"],
  focusShapes: ["heart", "diamond"],
  reviewLetters: ["K", "I", "N", "D", "L", "E"],
  days: {
    Monday: {
      theme: "Letters J and B",
      title: "J is for Jennifer! and JJ!",
      audioIntro: "Today we start with KINDLE, then learn two special letters — J and B!",
      activities: [
        { id: "w4m1", type: "name_builder", name: "KINDLE", letters: ["K", "I", "N", "D", "L", "E"], stars: 3, audioPrompt: "Warm up! Spell KINDLE!", audioCorrect: "K-I-N-D-L-E! Perfect warm-up!" },
        { id: "w4m2", type: "letter_intro", letter: "J", stars: 1, word: "Jennifer", image: "girl", audioPrompt: "This is the letter J! J is for Jennifer — your Mommy! And J is for JJ — that's YOU!" },
        { id: "w4m3", type: "find_the_letter", target: "J", options: ["J", "L", "I"], stars: 1, audioPrompt: "Can you find the letter J?", audioCorrect: "You found J! The first letter of YOUR name!", audioWrong: "J has a hook at the bottom." },
        { id: "w4m4", type: "letter_intro", letter: "B", stars: 1, word: "Buggsy", image: "boy", audioPrompt: "This is the letter B! B is for Buggsy — your big brother! B has TWO bumps on the right side!" },
        { id: "w4m5", type: "find_the_letter", target: "B", options: ["D", "B", "P", "R"], stars: 2, audioPrompt: "Can you find the letter B? Remember — TWO bumps!", audioCorrect: "You found B! Two bumps — that's Buggsy!", audioWrong: "B has TWO bumps on the right. D only has ONE big belly." },
        { id: "w4m6", type: "name_builder", name: "JJ", letters: ["J", "J"], stars: 3, audioPrompt: "Now build YOUR name with the REAL letter J! J-J!", audioCorrect: "J-J! That's YOUR name with YOUR letter!" }
      ]
    },
    Tuesday: {
      theme: "Counting and Comparing",
      title: "More or Less!",
      audioIntro: "Today we count to 5 and learn about more and less!",
      activities: [
        { id: "w4t1", type: "count_with_me", targetNumber: 5, objects: "rainbows", stars: 1, audioPrompt: "Count the rainbows! One... two... three... four... five!", audioCorrect: "Five rainbows! Beautiful!" },
        { id: "w4t2", type: "more_or_less", groupA: 3, groupB: 5, stars: 1, audioPrompt: "Which group has MORE? 3 or 5?", audioCorrect: "5 is more than 3! Great job!", audioWrong: "Count each group. The bigger number has MORE." },
        { id: "w4t3", type: "more_or_less", groupA: 4, groupB: 2, stars: 1, audioPrompt: "Which group has MORE? 4 or 2?", audioCorrect: "4 is more than 2!", audioWrong: "Count each group carefully." },
        { id: "w4t4", type: "find_the_number", target: 4, options: [3, 4, 5], stars: 1, audioPrompt: "What number comes AFTER 3?", audioCorrect: "4 comes after 3!", audioWrong: "Count: 1, 2, 3... what's next?" },
        { id: "w4t5", type: "quantity_match", numbers: [5, 2, 4, 1], stars: 2, audioPrompt: "Match each number to the right group!", audioCorrect: "Perfect matching!", audioWrong: "Count the objects in each group." }
      ]
    },
    Wednesday: {
      theme: "Green and Shapes",
      title: "Green Hearts and Diamonds!",
      audioIntro: "Today we explore green and learn heart and diamond shapes!",
      activities: [
        { id: "w4w1", type: "color_hunt", targetColor: "green", count: 3, stars: 1, audioPrompt: "Find 3 green things! Green like grass and trees!", audioCorrect: "You found green!", audioWrong: "That's not green — look for the color of grass." },
        { id: "w4w2", type: "shape_match", target: "heart", options: ["circle", "heart", "star"], stars: 1, audioPrompt: "Which one is a heart? Hearts mean love!", audioCorrect: "That's a heart!", audioWrong: "A heart has a point at the bottom and two bumps at the top." },
        { id: "w4w3", type: "shape_match", target: "diamond", options: ["square", "diamond", "triangle"], stars: 1, audioPrompt: "Which one is a diamond? A diamond is like a tilted square!", audioCorrect: "That's a diamond!", audioWrong: "A diamond looks like a square standing on one corner." },
        { id: "w4w4", type: "color_sort", colors: ["red", "blue", "yellow", "green"], items: [{ name: "apple", color: "red" }, { name: "sky", color: "blue" }, { name: "sun", color: "yellow" }, { name: "leaf", color: "green" }, { name: "fire truck", color: "red" }, { name: "frog", color: "green" }], stars: 2, audioPrompt: "Sort these into color groups!", audioCorrect: "Perfect color sorting!", audioWrong: "Look at each thing's color carefully." },
        { id: "w4w5", type: "pattern_next", pattern: [{shape:"circle",color:"blue"},{shape:"circle",color:"blue"},{shape:"star",color:"gold"},{shape:"circle",color:"blue"},{shape:"circle",color:"blue"}], answer: {shape:"star",color:"gold"}, options: [{shape:"circle",color:"blue"},{shape:"star",color:"gold"},{shape:"heart",color:"pink"}], stars: 2, audioPrompt: "Circle, circle, star, circle, circle... what comes next?", audioCorrect: "Star! That's an AAB pattern!", audioWrong: "Look: circle, circle, star, circle, circle... the star comes every third spot." }
      ]
    },
    Thursday: {
      theme: "Letter Sounds J and B",
      title: "J and B Sounds!",
      audioIntro: "Today we hear the sounds J and B make!",
      activities: [
        { id: "w4th1", type: "letter_sound", letter: "J", stars: 1, audioPrompt: "J says juh. Juh, juh, JJ! Juh, juh, Jennifer! J is for JJ and Jennifer!", audioCorrect: "That's right! J says juh!" },
        { id: "w4th2", type: "letter_sound", letter: "B", stars: 1, audioPrompt: "B says buh. Buh, buh, Buggsy! B is for Buggsy!", audioCorrect: "That's right! B says buh!" },
        { id: "w4th3", type: "beginning_sound", answer: "B", word: "Buggsy", options: ["B", "D", "M"], stars: 1, audioPrompt: "Which name starts with B? Buh...", audioCorrect: "Buggsy starts with B!", audioWrong: "Listen for the buh sound at the beginning." },
        { id: "w4th4", type: "letter_trace", letter: "J", stars: 2, uppercase: true, audioPrompt: "Trace the letter J! Straight down with a hook at the bottom.", audioCorrect: "Beautiful J!" },
        { id: "w4th5", type: "audio_story", title: "JJ and Buggsy's Rainy Day", stars: 2, storyId: "jj-buggsy-rainy", audioPrompt: "Story time! JJ and Buggsy build a green blanket fort on a rainy day!", audioCorrect: "Great listening! What color was the blanket fort? Green!" }
      ]
    },
    Friday: {
      theme: "ONE MONTH CHAMPION!",
      title: "ONE MONTH CHAMPION!",
      audioIntro: "You did it! A whole MONTH of learning! You know KINDLE, J, and B! This is your celebration!",
      activities: [
        { id: "w4f1", type: "name_builder", name: "KINDLE", letters: ["K", "I", "N", "D", "L", "E"], stars: 5, audioPrompt: "Spell KINDLE one last time this month!", audioCorrect: "K-I-N-D-L-E! KINDLE MASTER!" },
        { id: "w4f2", type: "find_the_letter", target: "B", options: ["D", "B", "P", "R"], stars: 2, audioPrompt: "Find the letter B! Two bumps!", audioCorrect: "B for Buggsy!" },
        { id: "w4f3", type: "count_with_me", targetNumber: 5, objects: "gems", stars: 1, audioPrompt: "Count your gems! One... two... three... four... five!", audioCorrect: "Five gems! A whole hand!" },
        { id: "w4f4", type: "color_hunt", targetColor: "green", count: 3, stars: 1, audioPrompt: "Find 3 green things!", audioCorrect: "Green! Like grass!" },
        { id: "w4f5", type: "more_or_less", groupA: 2, groupB: 4, stars: 1, audioPrompt: "Which group has MORE? 2 or 4?", audioCorrect: "4 is more than 2!", audioWrong: "Count each group." },
        { id: "w4f6", type: "star_celebration", stars: 5, message: "ONE MONTH CHAMPION! You know K, I, N, D, L, E, J, and B! You can spell KINDLE! You are INCREDIBLE!" }
      ]
    }
  }
};


// ════════════════════════════════════════════════════════════════════
// JJ WEEKS 5-8 — Phase 2 (Letters A,M,S,T,O,C + Numbers 6-10)
// Reviews Phase 1 letters (K,I,N,D,L,E,J,B) interspersed.
// Activity types: ONLY existing SparkleLearning renderers.
// Family name integration: KINDLE letters in review activities.
// ════════════════════════════════════════════════════════════════════

var JJ_WEEK_5 = {
  child: "jj",
  week: 5,
  phase: "Phase 2",
  startDate: "2026-05-11",
  focusLetters: ["A", "M"],
  milestones: {
    lettersMastered: ["A", "M"],
    numbersMastered: [6, 7],
    colorsMastered: ["yellow"],
    shapesMastered: ["triangle"],
    nameProgress: "Review: can spell K-I-N-D-L-E. New: A and M introduced",
    assessmentCheckpoint: "By end of week: tap A and M with 80% accuracy from 4-letter set"
  },
  focusNumbers: [6, 7],
  focusColors: ["yellow"],
  focusShapes: ["triangle"],
  days: {
    Monday: {
      theme: "Letters A and M",
      title: "A is for Amazing!",
      audioIntro: "Welcome back, KINDLE! Phase 2 starts today! We have TWO new letters — A and M! Let's go!",
      activities: [
        { id: "w5m01", type: "letter_intro", letter: "A", stars: 1, word: "Apple", image: "apple", audioPrompt: "This is the letter A! A says ah. A is for Apple! Crunch!", audioCorrect: "You know A!" },
        { id: "w5m02", type: "find_the_letter", target: "A", options: ["A", "H", "N"], stars: 1, audioPrompt: "Can you find the letter A? It looks like a tent!", audioCorrect: "You found A!", audioWrong: "A looks like a tent with a line across the middle." },
        { id: "w5m03", type: "beginning_sound", answer: "A", word: "Ant", options: ["A", "E", "O"], stars: 1, audioPrompt: "Which letter makes the ah sound? Ah... Ant!", audioCorrect: "Ant starts with A! Ah — Ant!", audioWrong: "Listen for ah. Ah... Ant!" },
        { id: "w5m04", type: "letter_intro", letter: "M", stars: 1, word: "Moon", image: "moon", audioPrompt: "This is the letter M! M says mmm. M is for Moon! Look at the big round moon!", audioCorrect: "You know M!" },
        { id: "w5m05", type: "find_the_letter", target: "M", options: ["M", "N", "W"], stars: 1, audioPrompt: "Can you find M? It has two humps like mountains!", audioCorrect: "You found M!", audioWrong: "M has two humps going up. N only has one." },
        { id: "w5m06", type: "beginning_sound", answer: "M", word: "Monkey", options: ["M", "N", "B"], stars: 1, audioPrompt: "Which letter starts mmm? Mmm... Monkey!", audioCorrect: "Monkey starts with M!", audioWrong: "Mmm... Monkey! M has two humps." },
        { id: "w5m07", type: "letter_intro", letter: "A", stars: 1, word: "Astronaut", image: "star", audioPrompt: "A is also for Astronaut! They fly to space! Ah... Astronaut!", audioCorrect: "A for Astronaut!" },
        { id: "w5m08", type: "find_the_letter", target: "A", options: ["A", "R", "K"], stars: 1, audioPrompt: "Find A again! These letters are trickier!", audioCorrect: "You found A! Superstar!", audioWrong: "A looks like a tent. K has arms reaching out." },
        { id: "w5m09", type: "letter_trace", letter: "A", stars: 2, audioPrompt: "Now let's trace the letter A! Start at the top, go down left, down right, then a line across.", audioCorrect: "Beautiful A!" },
        { id: "w5m10", type: "letter_intro", letter: "M", stars: 1, word: "Mama", image: "heart", audioPrompt: "M is also for Mama! Mmm... Mama! You love your Mama!", audioCorrect: "M for Mama!" },
        { id: "w5m11", type: "find_the_letter", target: "M", options: ["M", "W", "H"], stars: 1, audioPrompt: "Find M! Don't mix it up with W — W is upside-down M!", audioCorrect: "You found M! Not W!", audioWrong: "M has humps going UP. W has humps going DOWN." },
        { id: "w5m12", type: "letter_trace", letter: "M", stars: 2, audioPrompt: "Trace the letter M! Down, up, down, up — like mountains!", audioCorrect: "Mountain M! Amazing!" },
        { id: "w5m13", type: "find_the_letter", target: "K", options: ["K", "A", "M"], stars: 1, audioPrompt: "Review time! Find K — the FIRST letter of KINDLE!", audioCorrect: "K for KINDLE! You remember!", audioWrong: "K has two arms reaching out. It starts YOUR name!" },
        { id: "w5m14", type: "sparkle_challenge", stars: 3, questions: [{ prompt: "Which letter says ah?", options: ["A", "M", "K"], answer: 0 }, { prompt: "Which letter has two humps?", options: ["A", "N", "M"], answer: 2 }], audioPrompt: "Sparkle Challenge! Two quick questions!", audioCorrect: "SPARKLE CHAMPION!" },
        { id: "w5m15", type: "star_celebration", stars: 3, message: "You learned A and M today! A is for Apple and Astronaut! M is for Moon and Mama!" }
      ]
    },
    Tuesday: {
      theme: "Numbers 6 and 7",
      title: "Counting Higher!",
      audioIntro: "Today we count HIGHER! 6 and 7 — bigger numbers! You can do it!",
      activities: [
        { id: "w5t01", type: "count_with_me", targetNumber: 6, objects: "stars", stars: 1, audioPrompt: "Let's count 6 stars! Tap each one!", audioCorrect: "Six stars! You counted them all!" },
        { id: "w5t02", type: "find_the_number", target: 6, options: [5, 6, 9], stars: 1, audioPrompt: "Find the number 6! It has a curly tail!", audioCorrect: "That's 6!", audioWrong: "6 has a curly tail at the bottom. 9 has a curly tail at the top." },
        { id: "w5t03", type: "quantity_match", numbers: [5, 6, 7], stars: 1, audioPrompt: "Match each number to the right group!", audioCorrect: "Perfect matching!" },
        { id: "w5t04", type: "count_with_me", targetNumber: 7, objects: "hearts", stars: 1, audioPrompt: "Now count 7 hearts! One... two... all the way to seven!", audioCorrect: "Seven hearts!" },
        { id: "w5t05", type: "find_the_number", target: 7, options: [1, 7, 4], stars: 1, audioPrompt: "Find the number 7! It looks like a flag!", audioCorrect: "That's 7!", audioWrong: "7 goes across then down — like a flag on a pole." },
        { id: "w5t06", type: "number_trace", digit: 6, stars: 2, audioPrompt: "Trace the number 6! Start at the top, curve around to make a belly.", audioCorrect: "Nice curly 6!" },
        { id: "w5t07", type: "number_trace", digit: 7, stars: 2, audioPrompt: "Trace the number 7! Go across, then slide down!", audioCorrect: "Great 7!" },
        { id: "w5t08", type: "more_or_less", groupA: 6, groupB: 3, stars: 1, audioPrompt: "Which has MORE? 6 or 3?", audioCorrect: "6 is more than 3!", audioWrong: "Count each group. 6 is a bigger number!" },
        { id: "w5t09", type: "count_with_me", targetNumber: 7, objects: "butterflies", stars: 1, audioPrompt: "Count all the butterflies! Seven!", audioCorrect: "Seven butterflies! Beautiful!" },
        { id: "w5t10", type: "find_the_number", target: 6, options: [6, 8, 2], stars: 1, audioPrompt: "Quick — find 6!", audioCorrect: "Fast fingers! You found 6!" },
        { id: "w5t11", type: "more_or_less", groupA: 4, groupB: 7, stars: 1, audioPrompt: "Which has MORE? 4 or 7?", audioCorrect: "7 is more!", audioWrong: "Count each group carefully." },
        { id: "w5t12", type: "star_celebration", stars: 3, message: "You know 6 and 7 now! You can count all the way to 7!" }
      ]
    },
    Wednesday: {
      theme: "Colors and Shapes — Yellow Triangles",
      title: "Yellow Triangle Day!",
      audioIntro: "Today we learn YELLOW and TRIANGLES! Yellow like the sun! Triangles have THREE sides!",
      activities: [
        { id: "w5w01", type: "color_hunt", targetColor: "yellow", count: 3, stars: 1, audioPrompt: "Find 3 YELLOW things! Yellow like sunshine!", audioCorrect: "Yellow! Bright like the sun!" },
        { id: "w5w02", type: "shape_match", target: "triangle", stars: 1, audioPrompt: "Find the triangle! It has 3 sides and 3 pointy corners!", audioCorrect: "Triangle! Three sides!", audioWrong: "A triangle has THREE sides. Count the sides!" },
        { id: "w5w03", type: "color_sort", items: [{ name: "star", color: "yellow" }, { name: "heart", color: "red" }, { name: "circle", color: "yellow" }, { name: "square", color: "blue" }], bins: ["yellow", "red", "blue"], stars: 2, audioPrompt: "Sort by color! Put each shape in the right color bin!", audioCorrect: "Great sorting!" },
        { id: "w5w04", type: "pattern_next", pattern: ["triangle", "circle", "triangle", "circle"], answer: "triangle", stars: 1, audioPrompt: "What comes next? Triangle, circle, triangle, circle...", audioCorrect: "Triangle! The pattern repeats!", audioWrong: "Look at the pattern. It goes back and forth." },
        { id: "w5w05", type: "color_hunt", targetColor: "yellow", count: 4, stars: 1, audioPrompt: "Find 4 yellow things this time! More yellow!", audioCorrect: "Four yellows! Sunshine everywhere!" },
        { id: "w5w06", type: "count_with_me", targetNumber: 3, objects: "triangles", stars: 1, audioPrompt: "Count the triangles! How many sides does EACH one have? THREE!", audioCorrect: "3 triangles, each with 3 sides!" },
        { id: "w5w07", type: "find_the_letter", target: "I", options: ["I", "L", "A"], stars: 1, audioPrompt: "Review! Find the letter I from KINDLE!", audioCorrect: "I! The second letter of KINDLE!", audioWrong: "I is a straight line with bars on top and bottom." },
        { id: "w5w08", type: "find_the_number", target: 5, options: [3, 5, 7], stars: 1, audioPrompt: "Review! Find number 5!", audioCorrect: "Five! A whole hand!", audioWrong: "5 has a flat top and a round belly." },
        { id: "w5w09", type: "star_celebration", stars: 3, message: "Yellow and triangles! You are learning so many new things!" }
      ]
    },
    Thursday: {
      theme: "Letter Sound Practice — A and M",
      title: "Sound Detective!",
      audioIntro: "Today you are a SOUND DETECTIVE! Listen carefully for A and M sounds!",
      activities: [
        { id: "w5th01", type: "letter_sound", letter: "A", stars: 1, words: ["Apple", "Ant", "Astronaut"], audioPrompt: "A says ah! Listen: ah... Apple! ah... Ant! ah... Astronaut!", audioCorrect: "A says ah!" },
        { id: "w5th02", type: "beginning_sound", answer: "A", word: "Acorn", options: ["A", "M", "K"], stars: 1, audioPrompt: "What sound do you hear at the beginning? Ah... Acorn!", audioCorrect: "Acorn starts with A!", audioWrong: "Ah... Acorn! A says ah." },
        { id: "w5th03", type: "letter_sound", letter: "M", stars: 1, words: ["Moon", "Mama", "Monkey"], audioPrompt: "M says mmm! Listen: mmm... Moon! mmm... Mama! mmm... Monkey!", audioCorrect: "M says mmm!" },
        { id: "w5th04", type: "beginning_sound", answer: "M", word: "Mouse", options: ["M", "N", "A"], stars: 1, audioPrompt: "What sound starts Mouse? Mmm...", audioCorrect: "Mouse starts with M!", audioWrong: "Mmm... Mouse! M has two humps." },
        { id: "w5th05", type: "beginning_sound", answer: "A", word: "Alligator", options: ["A", "M", "E"], stars: 1, audioPrompt: "Listen carefully: Ah... Alligator! Which letter?", audioCorrect: "Alligator starts with A! Great ears!", audioWrong: "Ah... Alligator! A says ah." },
        { id: "w5th06", type: "beginning_sound", answer: "M", word: "Milk", options: ["M", "B", "N"], stars: 1, audioPrompt: "Mmm... Milk! What letter?", audioCorrect: "Milk starts with M!", audioWrong: "Mmm... Milk! M says mmm." },
        { id: "w5th07", type: "letter_trace", letter: "A", stars: 2, audioPrompt: "Trace A! Down-left, down-right, line across!", audioCorrect: "A for Amazing!" },
        { id: "w5th08", type: "letter_trace", letter: "M", stars: 2, audioPrompt: "Trace M! Down, up, down, up — mountains!", audioCorrect: "M for Marvelous!" },
        { id: "w5th09", type: "find_the_letter", target: "D", options: ["D", "B", "A"], stars: 1, audioPrompt: "Review! Find D — from KINDLE!", audioCorrect: "D! The fourth letter of KINDLE!" },
        { id: "w5th10", type: "star_celebration", stars: 3, message: "Sound Detective SUCCESS! You know the sounds of A and M!" }
      ]
    },
    Friday: {
      theme: "Review & Celebration",
      title: "Phase 2 Week 1 Celebration!",
      audioIntro: "It's FRIDAY! Let's review everything from this week and CELEBRATE!",
      activities: [
        { id: "w5f01", type: "find_the_letter", target: "A", options: ["A", "M", "K", "I"], stars: 1, audioPrompt: "Find A!", audioCorrect: "A!" },
        { id: "w5f02", type: "find_the_letter", target: "M", options: ["M", "N", "W", "A"], stars: 1, audioPrompt: "Find M!", audioCorrect: "M!" },
        { id: "w5f03", type: "find_the_number", target: 7, options: [4, 7, 1], stars: 1, audioPrompt: "Find 7!", audioCorrect: "Seven!" },
        { id: "w5f04", type: "count_with_me", targetNumber: 6, objects: "gems", stars: 1, audioPrompt: "Count 6 gems!", audioCorrect: "Six gems!" },
        { id: "w5f05", type: "color_hunt", targetColor: "yellow", count: 3, stars: 1, audioPrompt: "Find 3 yellow!", audioCorrect: "Yellow sunshine!" },
        { id: "w5f06", type: "shape_match", target: "triangle", stars: 1, audioPrompt: "Find the triangle!", audioCorrect: "Three sides!" },
        { id: "w5f07", type: "name_builder", name: "KINDLE", letters: ["K", "I", "N", "D", "L", "E"], stars: 3, audioPrompt: "Spell KINDLE! You know all these letters!", audioCorrect: "K-I-N-D-L-E! Your name!" },
        { id: "w5f08", type: "sparkle_challenge", stars: 3, questions: [{ prompt: "A is for...", options: ["Apple", "Ball", "Cat"], answer: 0 }, { prompt: "How many sides does a triangle have?", options: ["2", "3", "4"], answer: 1 }, { prompt: "Which number is bigger: 6 or 4?", options: ["6", "4"], answer: 0 }], audioPrompt: "Sparkle Challenge!", audioCorrect: "CHAMPION!" },
        { id: "w5f09", type: "star_celebration", stars: 5, message: "Phase 2, Week 1 COMPLETE! You know 10 letters: K, I, N, D, L, E, J, B, A, and M! INCREDIBLE!" }
      ]
    }
  }
};

var JJ_WEEK_6 = {
  child: "jj",
  week: 6,
  phase: "Phase 2",
  startDate: "2026-05-18",
  focusLetters: ["S", "T"],
  milestones: {
    lettersMastered: ["S", "T"],
    numbersMastered: [8],
    colorsMastered: ["purple"],
    shapesMastered: ["star"],
    nameProgress: "Can identify 12 letters including A,M,S,T + KINDLE set",
    assessmentCheckpoint: "By end of week: tap S and T with 80% from 4-letter set"
  },
  focusNumbers: [8],
  focusColors: ["purple"],
  focusShapes: ["star"],
  days: {
    Monday: {
      theme: "Letters S and T",
      title: "S is for Sparkle!",
      audioIntro: "Two more letters today — S and T! S is for SPARKLE! That's YOUR kingdom!",
      activities: [
        { id: "w6m01", type: "letter_intro", letter: "S", stars: 1, word: "Sparkle", image: "star", audioPrompt: "This is S! S says sss like a snake! S is for SPARKLE — your kingdom!", audioCorrect: "S for Sparkle!" },
        { id: "w6m02", type: "find_the_letter", target: "S", options: ["S", "Z", "C"], stars: 1, audioPrompt: "Find S! It curves like a snake!", audioCorrect: "You found S!", audioWrong: "S curves one way, then the other — like a snake." },
        { id: "w6m03", type: "beginning_sound", answer: "S", word: "Sun", options: ["S", "Z", "T"], stars: 1, audioPrompt: "Sss... Sun! Which letter?", audioCorrect: "Sun starts with S!", audioWrong: "Sss... Sun! S says sss." },
        { id: "w6m04", type: "letter_intro", letter: "T", stars: 1, word: "Tiger", image: "tiger", audioPrompt: "This is T! T says tuh. T is for Tiger! Roar!", audioCorrect: "T for Tiger!" },
        { id: "w6m05", type: "find_the_letter", target: "T", options: ["T", "I", "L"], stars: 1, audioPrompt: "Find T! It has a line across the top!", audioCorrect: "You found T!", audioWrong: "T has a line across the top, like a table." },
        { id: "w6m06", type: "beginning_sound", answer: "T", word: "Turtle", options: ["T", "D", "S"], stars: 1, audioPrompt: "Tuh... Turtle! Which letter?", audioCorrect: "Turtle starts with T!", audioWrong: "Tuh... Turtle! T says tuh." },
        { id: "w6m07", type: "letter_trace", letter: "S", stars: 2, audioPrompt: "Trace S! Curve up, then curve down — like a snake!", audioCorrect: "Sss... beautiful S!" },
        { id: "w6m08", type: "letter_trace", letter: "T", stars: 2, audioPrompt: "Trace T! One line down, one line across the top!", audioCorrect: "Perfect T!" },
        { id: "w6m09", type: "find_the_letter", target: "A", options: ["A", "S", "T"], stars: 1, audioPrompt: "Review! Find A from last week!", audioCorrect: "A! You remember!" },
        { id: "w6m10", type: "find_the_letter", target: "M", options: ["M", "N", "S"], stars: 1, audioPrompt: "Find M!", audioCorrect: "M with two humps!" },
        { id: "w6m11", type: "sparkle_challenge", stars: 3, questions: [{ prompt: "Which letter says sss?", options: ["T", "S", "M"], answer: 1 }, { prompt: "Which letter looks like a table?", options: ["T", "I", "L"], answer: 0 }], audioPrompt: "Sparkle Challenge!", audioCorrect: "SPARKLE STAR!" },
        { id: "w6m12", type: "star_celebration", stars: 3, message: "S and T! S for SPARKLE, T for Tiger! You know 12 letters now!" }
      ]
    },
    Tuesday: {
      theme: "Number 8",
      title: "Crazy Eights!",
      audioIntro: "Today is ALL about 8! Eight is like two circles stacked up!",
      activities: [
        { id: "w6t01", type: "count_with_me", targetNumber: 8, objects: "stars", stars: 1, audioPrompt: "Count 8 stars! One... two... all the way to EIGHT!", audioCorrect: "Eight stars!" },
        { id: "w6t02", type: "find_the_number", target: 8, options: [3, 6, 8], stars: 1, audioPrompt: "Find 8! It looks like a snowman!", audioCorrect: "Eight! Like a snowman!", audioWrong: "8 is two circles stacked. 6 has just one loop." },
        { id: "w6t03", type: "quantity_match", numbers: [6, 7, 8], stars: 1, audioPrompt: "Match 6, 7, and 8 to the right groups!", audioCorrect: "Perfect!" },
        { id: "w6t04", type: "number_trace", digit: 8, stars: 2, audioPrompt: "Trace 8! Make one circle on top, one on the bottom!", audioCorrect: "Snowman 8!" },
        { id: "w6t05", type: "count_with_me", targetNumber: 8, objects: "butterflies", stars: 1, audioPrompt: "Count 8 butterflies!", audioCorrect: "Eight butterflies! Beautiful!" },
        { id: "w6t06", type: "more_or_less", groupA: 8, groupB: 5, stars: 1, audioPrompt: "Which has MORE?", audioCorrect: "8 is more than 5!" },
        { id: "w6t07", type: "more_or_less", groupA: 3, groupB: 8, stars: 1, audioPrompt: "Which has LESS?", audioCorrect: "3 is less than 8!" },
        { id: "w6t08", type: "find_the_number", target: 7, options: [7, 8, 1], stars: 1, audioPrompt: "Review! Find 7!", audioCorrect: "Seven!" },
        { id: "w6t09", type: "star_celebration", stars: 3, message: "You know 8! Eight like a snowman! You can count to 8!" }
      ]
    },
    Wednesday: {
      theme: "Purple Stars",
      title: "Purple Starlight!",
      audioIntro: "NEW color: PURPLE! And NEW shape: STARS! Purple stars are magical!",
      activities: [
        { id: "w6w01", type: "color_hunt", targetColor: "purple", count: 3, stars: 1, audioPrompt: "Find 3 PURPLE things!", audioCorrect: "Purple! Like a magical gem!" },
        { id: "w6w02", type: "shape_match", target: "star", stars: 1, audioPrompt: "Find the star! It has 5 pointy tips!", audioCorrect: "Star! Five points!", audioWrong: "A star has 5 pointy tips. Count them!" },
        { id: "w6w03", type: "color_sort", items: [{ name: "star", color: "purple" }, { name: "heart", color: "red" }, { name: "moon", color: "yellow" }, { name: "circle", color: "purple" }], bins: ["purple", "red", "yellow"], stars: 2, audioPrompt: "Sort by color!", audioCorrect: "Great sorting!" },
        { id: "w6w04", type: "pattern_next", pattern: ["star", "triangle", "star", "triangle"], answer: "star", stars: 1, audioPrompt: "Star, triangle, star, triangle... what's next?", audioCorrect: "Star! The pattern repeats!" },
        { id: "w6w05", type: "color_hunt", targetColor: "purple", count: 4, stars: 1, audioPrompt: "Find 4 purple things!", audioCorrect: "Purple power!" },
        { id: "w6w06", type: "count_with_me", targetNumber: 5, objects: "stars", stars: 1, audioPrompt: "Count the stars — how many points on each one?", audioCorrect: "Five stars!" },
        { id: "w6w07", type: "find_the_letter", target: "N", options: ["N", "M", "S"], stars: 1, audioPrompt: "Review! Find N from KINDLE!", audioCorrect: "N! Third letter of KINDLE!" },
        { id: "w6w08", type: "star_celebration", stars: 3, message: "Purple and stars! Your Sparkle Kingdom is full of purple starlight!" }
      ]
    },
    Thursday: {
      theme: "Sound Detective — S and T",
      title: "Snake and Tiger Sounds!",
      audioIntro: "Sound Detective is BACK! S says sss like a snake! T says tuh like a tiger!",
      activities: [
        { id: "w6th01", type: "letter_sound", letter: "S", stars: 1, words: ["Sparkle", "Snake", "Sun"], audioPrompt: "S says sss! Sparkle! Snake! Sun! All start with sss!", audioCorrect: "Sss!" },
        { id: "w6th02", type: "beginning_sound", answer: "S", word: "Star", options: ["S", "T", "A"], stars: 1, audioPrompt: "Sss... Star! Which letter?", audioCorrect: "Star starts with S!", audioWrong: "Sss... Star!" },
        { id: "w6th03", type: "letter_sound", letter: "T", stars: 1, words: ["Tiger", "Turtle", "Taco"], audioPrompt: "T says tuh! Tiger! Turtle! Taco! Mmm, taco!", audioCorrect: "Tuh!" },
        { id: "w6th04", type: "beginning_sound", answer: "T", word: "Tree", options: ["T", "S", "K"], stars: 1, audioPrompt: "Tuh... Tree! Which letter?", audioCorrect: "Tree starts with T!", audioWrong: "Tuh... Tree! T says tuh." },
        { id: "w6th05", type: "beginning_sound", answer: "S", word: "Sandwich", options: ["S", "M", "T"], stars: 1, audioPrompt: "Sss... Sandwich!", audioCorrect: "Sandwich starts with S!" },
        { id: "w6th06", type: "beginning_sound", answer: "T", word: "Tomato", options: ["T", "D", "M"], stars: 1, audioPrompt: "Tuh... Tomato!", audioCorrect: "Tomato starts with T!" },
        { id: "w6th07", type: "letter_trace", letter: "S", stars: 2, audioPrompt: "Trace that snake S!", audioCorrect: "Sss!" },
        { id: "w6th08", type: "letter_trace", letter: "T", stars: 2, audioPrompt: "Trace that table T!", audioCorrect: "Tuh!" },
        { id: "w6th09", type: "find_the_letter", target: "E", options: ["E", "S", "T"], stars: 1, audioPrompt: "Review! Find E — the last letter of KINDLE!", audioCorrect: "E! K-I-N-D-L-E!" },
        { id: "w6th10", type: "star_celebration", stars: 3, message: "S for Snake and Sparkle! T for Tiger and Tree!" }
      ]
    },
    Friday: {
      theme: "Review & Celebration",
      title: "Week 6 Celebration!",
      audioIntro: "Friday celebration! Let's show what we know!",
      activities: [
        { id: "w6f01", type: "find_the_letter", target: "S", options: ["S", "Z", "T", "C"], stars: 1, audioPrompt: "Find S!", audioCorrect: "Sss!" },
        { id: "w6f02", type: "find_the_letter", target: "T", options: ["T", "I", "L", "S"], stars: 1, audioPrompt: "Find T!", audioCorrect: "Tuh!" },
        { id: "w6f03", type: "find_the_number", target: 8, options: [3, 6, 8], stars: 1, audioPrompt: "Find 8!", audioCorrect: "Snowman!" },
        { id: "w6f04", type: "count_with_me", targetNumber: 8, objects: "gems", stars: 1, audioPrompt: "Count 8 gems!", audioCorrect: "Eight gems!" },
        { id: "w6f05", type: "color_hunt", targetColor: "purple", count: 3, stars: 1, audioPrompt: "Find 3 purple!", audioCorrect: "Purple!" },
        { id: "w6f06", type: "name_builder", name: "KINDLE", letters: ["K", "I", "N", "D", "L", "E"], stars: 3, audioPrompt: "Spell KINDLE!", audioCorrect: "KINDLE!" },
        { id: "w6f07", type: "sparkle_challenge", stars: 3, questions: [{ prompt: "S is for...", options: ["Sparkle", "Tiger", "Moon"], answer: 0 }, { prompt: "What shape has 5 points?", options: ["Triangle", "Star", "Circle"], answer: 1 }, { prompt: "Which number looks like a snowman?", options: ["6", "8", "3"], answer: 1 }], audioPrompt: "Final challenge!", audioCorrect: "WEEK 6 CHAMPION!" },
        { id: "w6f08", type: "star_celebration", stars: 5, message: "12 letters! K,I,N,D,L,E,J,B,A,M,S,T! You are a LETTER MASTER!" }
      ]
    }
  }
};

var JJ_WEEK_7 = {
  child: "jj",
  week: 7,
  phase: "Phase 2",
  startDate: "2026-05-25",
  focusLetters: ["O", "C"],
  milestones: {
    lettersMastered: ["O", "C"],
    numbersMastered: [9, 10],
    colorsMastered: ["orange"],
    shapesMastered: ["heart"],
    nameProgress: "14 letters total; can spell KINDLE and identify all Phase 1+2 letters",
    assessmentCheckpoint: "By end of week: tap O and C with 80% from 4-letter set; count to 10"
  },
  focusNumbers: [9, 10],
  focusColors: ["orange"],
  focusShapes: ["heart"],
  days: {
    Monday: {
      theme: "Letters O and C",
      title: "O is for Orange!",
      audioIntro: "Last two Phase 2 letters — O and C! O is round like a circle! C is like O but with an opening!",
      activities: [
        { id: "w7m01", type: "letter_intro", letter: "O", stars: 1, word: "Orange", image: "orange", audioPrompt: "This is O! O says oh. O is for Orange! Round and yummy!", audioCorrect: "O for Orange!" },
        { id: "w7m02", type: "find_the_letter", target: "O", options: ["O", "C", "D"], stars: 1, audioPrompt: "Find O! It's a perfect circle!", audioCorrect: "O!", audioWrong: "O is a complete circle. C has an opening." },
        { id: "w7m03", type: "beginning_sound", answer: "O", word: "Octopus", options: ["O", "A", "C"], stars: 1, audioPrompt: "Oh... Octopus! Which letter?", audioCorrect: "Octopus starts with O!", audioWrong: "Oh... Octopus! O says oh." },
        { id: "w7m04", type: "letter_intro", letter: "C", stars: 1, word: "Cat", image: "cat", audioPrompt: "This is C! C says kuh (like K!). C is for Cat! Meow!", audioCorrect: "C for Cat!" },
        { id: "w7m05", type: "find_the_letter", target: "C", options: ["C", "O", "S"], stars: 1, audioPrompt: "Find C! It's like O but with a bite taken out!", audioCorrect: "C!", audioWrong: "C is like O with an opening on the right side." },
        { id: "w7m06", type: "beginning_sound", answer: "C", word: "Cake", options: ["C", "K", "S"], stars: 1, audioPrompt: "Kuh... Cake! Which letter? Tricky — both C and K say kuh!", audioCorrect: "Cake starts with C! Good job!", audioWrong: "Cake starts with C! C and K make similar sounds." },
        { id: "w7m07", type: "letter_trace", letter: "O", stars: 2, audioPrompt: "Trace O! Go around in a big circle!", audioCorrect: "Perfect circle O!" },
        { id: "w7m08", type: "letter_trace", letter: "C", stars: 2, audioPrompt: "Trace C! Like O but stop before you close it!", audioCorrect: "C with an opening!" },
        { id: "w7m09", type: "find_the_letter", target: "S", options: ["S", "C", "O"], stars: 1, audioPrompt: "Review! Find S!", audioCorrect: "Sss!" },
        { id: "w7m10", type: "find_the_letter", target: "K", options: ["K", "A", "T"], stars: 1, audioPrompt: "Find K — first letter of KINDLE!", audioCorrect: "K!" },
        { id: "w7m11", type: "sparkle_challenge", stars: 3, questions: [{ prompt: "Which letter is a complete circle?", options: ["C", "O", "D"], answer: 1 }, { prompt: "C is for...", options: ["Cat", "Dog", "Sun"], answer: 0 }], audioPrompt: "Sparkle Challenge!", audioCorrect: "O and C MASTER!" },
        { id: "w7m12", type: "star_celebration", stars: 3, message: "O and C! That's ALL the Phase 2 letters! You know 14 letters now!" }
      ]
    },
    Tuesday: {
      theme: "Numbers 9 and 10",
      title: "Counting to TEN!",
      audioIntro: "TODAY IS HUGE! We learn 9 and 10! TEN! You can count to TEN!",
      activities: [
        { id: "w7t01", type: "count_with_me", targetNumber: 9, objects: "stars", stars: 1, audioPrompt: "Count 9 stars! Almost to TEN!", audioCorrect: "Nine stars!" },
        { id: "w7t02", type: "find_the_number", target: 9, options: [6, 9, 8], stars: 1, audioPrompt: "Find 9! Be careful — 6 and 9 look alike but are FLIPPED!", audioCorrect: "That's 9!", audioWrong: "9 has the loop at the TOP. 6 has the loop at the BOTTOM." },
        { id: "w7t03", type: "count_with_me", targetNumber: 10, objects: "hearts", stars: 2, audioPrompt: "Count to TEN! One... two... all the way to TEN!", audioCorrect: "TEN! You counted to TEN! Both hands!" },
        { id: "w7t04", type: "find_the_number", target: 10, options: [1, 10, 7], stars: 1, audioPrompt: "Find 10! It has TWO digits — a 1 and a 0!", audioCorrect: "10! One-zero!", audioWrong: "10 is special — it uses TWO numbers: 1 and 0 together." },
        { id: "w7t05", type: "number_trace", digit: 9, stars: 2, audioPrompt: "Trace 9! A circle on top, then a line going down!", audioCorrect: "Nice 9!" },
        { id: "w7t06", type: "quantity_match", numbers: [8, 9, 10], stars: 2, audioPrompt: "Match 8, 9, and 10! Big numbers!", audioCorrect: "All matched!" },
        { id: "w7t07", type: "more_or_less", groupA: 10, groupB: 7, stars: 1, audioPrompt: "Which has MORE? 10 or 7?", audioCorrect: "10 is more!" },
        { id: "w7t08", type: "more_or_less", groupA: 5, groupB: 9, stars: 1, audioPrompt: "Which has LESS?", audioCorrect: "5 is less than 9!" },
        { id: "w7t09", type: "count_with_me", targetNumber: 10, objects: "gems", stars: 2, audioPrompt: "Count TEN gems! You can do it!", audioCorrect: "TEN GEMS! You are a counting SUPERSTAR!" },
        { id: "w7t10", type: "star_celebration", stars: 5, message: "YOU CAN COUNT TO TEN! That's BOTH hands! 1,2,3,4,5,6,7,8,9,10!" }
      ]
    },
    Wednesday: {
      theme: "Orange Hearts",
      title: "Orange Heart Day!",
      audioIntro: "New color: ORANGE! New shape: HEARTS! Orange is warm and hearts mean LOVE!",
      activities: [
        { id: "w7w01", type: "color_hunt", targetColor: "orange", count: 3, stars: 1, audioPrompt: "Find 3 ORANGE things!", audioCorrect: "Orange! Warm like a sunset!" },
        { id: "w7w02", type: "shape_match", target: "heart", stars: 1, audioPrompt: "Find the heart! It has a bumpy top and pointy bottom!", audioCorrect: "Heart! Love!", audioWrong: "A heart has two bumps on top and a point at the bottom." },
        { id: "w7w03", type: "color_sort", items: [{ name: "heart", color: "orange" }, { name: "star", color: "purple" }, { name: "circle", color: "orange" }, { name: "triangle", color: "green" }], bins: ["orange", "purple", "green"], stars: 2, audioPrompt: "Sort by color!", audioCorrect: "Sorted!" },
        { id: "w7w04", type: "pattern_next", pattern: ["heart", "star", "heart", "star"], answer: "heart", stars: 1, audioPrompt: "Heart, star, heart, star... what's next?", audioCorrect: "Heart!" },
        { id: "w7w05", type: "count_with_me", targetNumber: 4, objects: "hearts", stars: 1, audioPrompt: "Count the hearts!", audioCorrect: "Four hearts full of love!" },
        { id: "w7w06", type: "find_the_letter", target: "L", options: ["L", "I", "T"], stars: 1, audioPrompt: "Review! Find L from KINDLE!", audioCorrect: "L!" },
        { id: "w7w07", type: "find_the_number", target: 10, options: [10, 1, 6], stars: 1, audioPrompt: "Find 10!", audioCorrect: "TEN!" },
        { id: "w7w08", type: "star_celebration", stars: 3, message: "Orange hearts! You know 5 colors and 4 shapes now!" }
      ]
    },
    Thursday: {
      theme: "Sound Detective — O and C",
      title: "Circle Sounds!",
      audioIntro: "O and C both look like circles! But they sound different! Let's listen!",
      activities: [
        { id: "w7th01", type: "letter_sound", letter: "O", stars: 1, words: ["Orange", "Octopus", "Otter"], audioPrompt: "O says oh! Orange! Octopus! Otter!", audioCorrect: "Oh!" },
        { id: "w7th02", type: "beginning_sound", answer: "O", word: "Owl", options: ["O", "C", "A"], stars: 1, audioPrompt: "Oh... Owl! Which letter?", audioCorrect: "Owl starts with O!" },
        { id: "w7th03", type: "letter_sound", letter: "C", stars: 1, words: ["Cat", "Cake", "Car"], audioPrompt: "C says kuh! Cat! Cake! Car!", audioCorrect: "Kuh!" },
        { id: "w7th04", type: "beginning_sound", answer: "C", word: "Cookie", options: ["C", "K", "O"], stars: 1, audioPrompt: "Kuh... Cookie! Which letter?", audioCorrect: "Cookie starts with C!" },
        { id: "w7th05", type: "beginning_sound", answer: "O", word: "Ocean", options: ["O", "C", "E"], stars: 1, audioPrompt: "Oh... Ocean!", audioCorrect: "Ocean starts with O!" },
        { id: "w7th06", type: "beginning_sound", answer: "C", word: "Cup", options: ["C", "T", "S"], stars: 1, audioPrompt: "Kuh... Cup!", audioCorrect: "Cup starts with C!" },
        { id: "w7th07", type: "letter_trace", letter: "O", stars: 2, audioPrompt: "Trace the circle O!", audioCorrect: "Round and round!" },
        { id: "w7th08", type: "letter_trace", letter: "C", stars: 2, audioPrompt: "Trace C — circle but stop!", audioCorrect: "C!" },
        { id: "w7th09", type: "find_the_letter", target: "B", options: ["B", "D", "O"], stars: 1, audioPrompt: "Review! Find B!", audioCorrect: "B! Two bumps on the right!" },
        { id: "w7th10", type: "star_celebration", stars: 3, message: "O says oh! C says kuh! Sound Detective VICTORY!" }
      ]
    },
    Friday: {
      theme: "Week 7 Grand Review",
      title: "Almost Done with Phase 2!",
      audioIntro: "One more week! Let's show how much you know!",
      activities: [
        { id: "w7f01", type: "find_the_letter", target: "O", options: ["O", "C", "D", "Q"], stars: 1, audioPrompt: "Find O!", audioCorrect: "Circle O!" },
        { id: "w7f02", type: "find_the_letter", target: "C", options: ["C", "O", "S", "G"], stars: 1, audioPrompt: "Find C!", audioCorrect: "Open circle C!" },
        { id: "w7f03", type: "count_with_me", targetNumber: 10, objects: "stars", stars: 2, audioPrompt: "Count to TEN!", audioCorrect: "TEN!" },
        { id: "w7f04", type: "find_the_number", target: 9, options: [6, 9, 3], stars: 1, audioPrompt: "Find 9! Not 6!", audioCorrect: "Nine!" },
        { id: "w7f05", type: "color_hunt", targetColor: "orange", count: 3, stars: 1, audioPrompt: "Find orange!", audioCorrect: "Orange!" },
        { id: "w7f06", type: "name_builder", name: "KINDLE", letters: ["K", "I", "N", "D", "L", "E"], stars: 3, audioPrompt: "Spell KINDLE!", audioCorrect: "KINDLE!" },
        { id: "w7f07", type: "sparkle_challenge", stars: 3, questions: [{ prompt: "O is for...", options: ["Orange", "Apple", "Sun"], answer: 0 }, { prompt: "How high can you count?", options: ["5", "8", "10"], answer: 2 }, { prompt: "What color is warm like a sunset?", options: ["Blue", "Orange", "Green"], answer: 1 }], audioPrompt: "Sparkle Challenge!", audioCorrect: "CHAMPION!" },
        { id: "w7f08", type: "star_celebration", stars: 5, message: "14 letters, numbers 1-10, 5 colors, 4 shapes! You are AMAZING!" }
      ]
    }
  }
};

var JJ_WEEK_8 = {
  child: "jj",
  week: 8,
  phase: "Phase 2",
  startDate: "2026-06-01",
  focusLetters: [],
  milestones: {
    lettersMastered: [],
    numbersMastered: [],
    colorsMastered: [],
    shapesMastered: [],
    nameProgress: "ASSESSMENT WEEK: Verify all 14 letters, numbers 1-10, 5 colors, 4 shapes",
    assessmentCheckpoint: "Phase 2 Assessment: 80% accuracy on all Phase 1+2 content"
  },
  focusNumbers: [],
  focusColors: [],
  focusShapes: [],
  days: {
    Monday: {
      theme: "Assessment — Letters",
      title: "Letter Champion Challenge!",
      audioIntro: "This week we check EVERYTHING you learned! Today: ALL your letters! Show me what you know!",
      activities: [
        { id: "w8m01", type: "find_the_letter", target: "K", options: ["K", "X", "T", "A"], stars: 1, audioPrompt: "Find K!", audioCorrect: "K for KINDLE!" },
        { id: "w8m02", type: "find_the_letter", target: "I", options: ["I", "L", "T", "M"], stars: 1, audioPrompt: "Find I!", audioCorrect: "I!" },
        { id: "w8m03", type: "find_the_letter", target: "N", options: ["N", "M", "A", "S"], stars: 1, audioPrompt: "Find N!", audioCorrect: "N!" },
        { id: "w8m04", type: "find_the_letter", target: "D", options: ["D", "B", "O", "C"], stars: 1, audioPrompt: "Find D!", audioCorrect: "D!" },
        { id: "w8m05", type: "find_the_letter", target: "L", options: ["L", "I", "T", "J"], stars: 1, audioPrompt: "Find L!", audioCorrect: "L!" },
        { id: "w8m06", type: "find_the_letter", target: "E", options: ["E", "S", "A", "M"], stars: 1, audioPrompt: "Find E!", audioCorrect: "E! K-I-N-D-L-E!" },
        { id: "w8m07", type: "find_the_letter", target: "A", options: ["A", "M", "S", "O"], stars: 1, audioPrompt: "Find A!", audioCorrect: "A!" },
        { id: "w8m08", type: "find_the_letter", target: "M", options: ["M", "N", "W", "A"], stars: 1, audioPrompt: "Find M!", audioCorrect: "M!" },
        { id: "w8m09", type: "find_the_letter", target: "S", options: ["S", "Z", "C", "T"], stars: 1, audioPrompt: "Find S!", audioCorrect: "S!" },
        { id: "w8m10", type: "find_the_letter", target: "T", options: ["T", "I", "L", "S"], stars: 1, audioPrompt: "Find T!", audioCorrect: "T!" },
        { id: "w8m11", type: "find_the_letter", target: "O", options: ["O", "C", "D", "Q"], stars: 1, audioPrompt: "Find O!", audioCorrect: "O!" },
        { id: "w8m12", type: "find_the_letter", target: "C", options: ["C", "O", "S", "G"], stars: 1, audioPrompt: "Find C!", audioCorrect: "C!" },
        { id: "w8m13", type: "name_builder", name: "KINDLE", letters: ["K", "I", "N", "D", "L", "E"], stars: 5, audioPrompt: "SPELL KINDLE!", audioCorrect: "K-I-N-D-L-E! KINDLE CHAMPION!" },
        { id: "w8m14", type: "star_celebration", stars: 5, message: "ALL 14 LETTERS! You are a LETTER SUPERSTAR!" }
      ]
    },
    Tuesday: {
      theme: "Assessment — Numbers",
      title: "Number Champion Challenge!",
      audioIntro: "Today: NUMBERS! Let's count all the way to TEN and show what you know!",
      activities: [
        { id: "w8t01", type: "count_with_me", targetNumber: 10, objects: "stars", stars: 2, audioPrompt: "Count to TEN!", audioCorrect: "TEN!" },
        { id: "w8t02", type: "find_the_number", target: 3, options: [3, 8, 5], stars: 1, audioPrompt: "Find 3!", audioCorrect: "3!" },
        { id: "w8t03", type: "find_the_number", target: 7, options: [1, 7, 4], stars: 1, audioPrompt: "Find 7!", audioCorrect: "7!" },
        { id: "w8t04", type: "find_the_number", target: 10, options: [10, 1, 6], stars: 1, audioPrompt: "Find 10!", audioCorrect: "10!" },
        { id: "w8t05", type: "find_the_number", target: 6, options: [6, 9, 8], stars: 1, audioPrompt: "Find 6! Not 9!", audioCorrect: "6! Curly bottom!" },
        { id: "w8t06", type: "quantity_match", numbers: [4, 7, 10], stars: 2, audioPrompt: "Match 4, 7, and 10!", audioCorrect: "All matched!" },
        { id: "w8t07", type: "more_or_less", groupA: 9, groupB: 3, stars: 1, audioPrompt: "Which has MORE?", audioCorrect: "9 is more!" },
        { id: "w8t08", type: "more_or_less", groupA: 2, groupB: 8, stars: 1, audioPrompt: "Which has LESS?", audioCorrect: "2 is less!" },
        { id: "w8t09", type: "count_with_me", targetNumber: 10, objects: "gems", stars: 2, audioPrompt: "Count 10 gems one more time!", audioCorrect: "TEN GEMS!" },
        { id: "w8t10", type: "star_celebration", stars: 5, message: "NUMBERS 1-10 CHAMPION! You can count everything!" }
      ]
    },
    Wednesday: {
      theme: "Assessment — Colors & Shapes",
      title: "Rainbow Shape Challenge!",
      audioIntro: "Today: COLORS and SHAPES! Let's find them all!",
      activities: [
        { id: "w8w01", type: "color_hunt", targetColor: "red", count: 2, stars: 1, audioPrompt: "Find 2 RED things!", audioCorrect: "Red!" },
        { id: "w8w02", type: "color_hunt", targetColor: "blue", count: 2, stars: 1, audioPrompt: "Find 2 BLUE things!", audioCorrect: "Blue!" },
        { id: "w8w03", type: "color_hunt", targetColor: "green", count: 2, stars: 1, audioPrompt: "Find 2 GREEN things!", audioCorrect: "Green!" },
        { id: "w8w04", type: "color_hunt", targetColor: "yellow", count: 2, stars: 1, audioPrompt: "Find 2 YELLOW things!", audioCorrect: "Yellow!" },
        { id: "w8w05", type: "color_hunt", targetColor: "purple", count: 2, stars: 1, audioPrompt: "Find 2 PURPLE things!", audioCorrect: "Purple!" },
        { id: "w8w06", type: "shape_match", target: "circle", stars: 1, audioPrompt: "Find the circle!", audioCorrect: "Round circle!" },
        { id: "w8w07", type: "shape_match", target: "square", stars: 1, audioPrompt: "Find the square!", audioCorrect: "Four equal sides!" },
        { id: "w8w08", type: "shape_match", target: "triangle", stars: 1, audioPrompt: "Find the triangle!", audioCorrect: "Three sides!" },
        { id: "w8w09", type: "shape_match", target: "star", stars: 1, audioPrompt: "Find the star!", audioCorrect: "Five points!" },
        { id: "w8w10", type: "color_sort", items: [{ name: "heart", color: "red" }, { name: "star", color: "yellow" }, { name: "circle", color: "blue" }, { name: "triangle", color: "green" }, { name: "square", color: "purple" }], bins: ["red", "yellow", "blue", "green", "purple"], stars: 3, audioPrompt: "Sort ALL the colors!", audioCorrect: "ALL COLORS SORTED!" },
        { id: "w8w11", type: "star_celebration", stars: 5, message: "5 COLORS! 4 SHAPES! COLOR AND SHAPE CHAMPION!" }
      ]
    },
    Thursday: {
      theme: "Assessment — Beginning Sounds",
      title: "Sound Champion Challenge!",
      audioIntro: "Today: SOUNDS! Listen to every letter sound you know!",
      activities: [
        { id: "w8th01", type: "beginning_sound", answer: "K", word: "KINDLE", options: ["K", "A", "S"], stars: 1, audioPrompt: "Kuh... KINDLE!", audioCorrect: "KINDLE starts with K!" },
        { id: "w8th02", type: "beginning_sound", answer: "A", word: "Apple", options: ["A", "O", "E"], stars: 1, audioPrompt: "Ah... Apple!", audioCorrect: "A!" },
        { id: "w8th03", type: "beginning_sound", answer: "M", word: "Moon", options: ["M", "N", "S"], stars: 1, audioPrompt: "Mmm... Moon!", audioCorrect: "M!" },
        { id: "w8th04", type: "beginning_sound", answer: "S", word: "Sparkle", options: ["S", "T", "C"], stars: 1, audioPrompt: "Sss... Sparkle!", audioCorrect: "S!" },
        { id: "w8th05", type: "beginning_sound", answer: "T", word: "Tiger", options: ["T", "D", "K"], stars: 1, audioPrompt: "Tuh... Tiger!", audioCorrect: "T!" },
        { id: "w8th06", type: "beginning_sound", answer: "O", word: "Octopus", options: ["O", "A", "C"], stars: 1, audioPrompt: "Oh... Octopus!", audioCorrect: "O!" },
        { id: "w8th07", type: "beginning_sound", answer: "C", word: "Cat", options: ["C", "K", "S"], stars: 1, audioPrompt: "Kuh... Cat!", audioCorrect: "C for Cat!" },
        { id: "w8th08", type: "beginning_sound", answer: "I", word: "Igloo", options: ["I", "L", "E"], stars: 1, audioPrompt: "Ih... Igloo!", audioCorrect: "I!" },
        { id: "w8th09", type: "letter_trace", letter: "K", stars: 2, audioPrompt: "Trace K!", audioCorrect: "K for KINDLE!" },
        { id: "w8th10", type: "letter_trace", letter: "S", stars: 2, audioPrompt: "Trace S!", audioCorrect: "Snake S!" },
        { id: "w8th11", type: "star_celebration", stars: 5, message: "SOUND CHAMPION! You know ALL the sounds!" }
      ]
    },
    Friday: {
      theme: "Phase 2 Grand Finale",
      title: "PHASE 2 COMPLETE!",
      audioIntro: "THIS IS IT! The GRAND FINALE of Phase 2! Let's celebrate EVERYTHING you learned!",
      activities: [
        { id: "w8f01", type: "name_builder", name: "KINDLE", letters: ["K", "I", "N", "D", "L", "E"], stars: 5, audioPrompt: "One last time — SPELL YOUR NAME!", audioCorrect: "K-I-N-D-L-E! That's YOUR name!" },
        { id: "w8f02", type: "count_with_me", targetNumber: 10, objects: "gems", stars: 3, audioPrompt: "Count to TEN! The biggest number you know!", audioCorrect: "TEN! Both hands!" },
        { id: "w8f03", type: "sparkle_challenge", stars: 5, questions: [{ prompt: "How many letters can you name?", options: ["8", "10", "14"], answer: 2 }, { prompt: "What number has two digits?", options: ["9", "10", "8"], answer: 1 }, { prompt: "What color is the sky?", options: ["Red", "Blue", "Green"], answer: 1 }, { prompt: "S is for...", options: ["SPARKLE", "Tiger", "Moon"], answer: 0 }], audioPrompt: "ULTIMATE SPARKLE CHALLENGE!", audioCorrect: "ULTIMATE CHAMPION!" },
        { id: "w8f04", type: "star_celebration", stars: 10, message: "PHASE 2 COMPLETE! 14 letters! Numbers 1-10! 5 colors! 4 shapes! You are ready for PHASE 3! KINDLE, you are INCREDIBLE!" }
      ]
    }
  }
};

// ════════════════════════════════════════════════════════════════════
// BUGGSY CURRICULUM — 4th Grade (TEKS-aligned)
// Day content keys consumed by:
//   HomeworkModule.html → content.module (.math, .science, .questions)
//   reading-module.html → content.cold_passage
//   fact-sprint.html    → content.factSprint
//   investigation-module.html → content.investigation
//   writing-module.html → content.writing
//   WolfkidCER.html     → content.wolfkidEpisode
// ════════════════════════════════════════════════════════════════════

var BUGGSY_WEEK_1 = {
  child: "buggsy",
  week: 1,
  startDate: "2026-04-06",
  vocabulary: [
    { word: "observe", definition: "To watch something carefully to learn about it", sentence: "Scientists observe animals in the wild to understand their behavior." },
    { word: "signal", definition: "A sign or action that sends a message", sentence: "The traffic light gives a signal to stop or go." },
    { word: "measure", definition: "To find the size, amount, or degree of something using a tool", sentence: "We used a ruler to measure the length of the desk." },
    { word: "conclude", definition: "To reach a decision or judgment based on evidence", sentence: "After the experiment, we can conclude that plants need sunlight." },
    { word: "vanish", definition: "To disappear suddenly and completely", sentence: "The magician made the coin vanish into thin air." }
  ],
  scaffoldConfig: {
    timerMode: "hidden",
    missionStructure: "single_flow",
    feedbackLevel: "on_tap",
    hintLimit: 2,
    retryOnWrong: true,
    thursdayOverride: { timerMode: "hidden", feedbackLevel: "full" }
  },
  days: {
    Monday: {
      module: {
        title: "Multiplication & Perimeter",
        math: {
          title: "Multiplication & Perimeter Review",
          questions: [
            { q: "A rectangle is 14 cm long and 9 cm wide. What is the perimeter?", type: "computation", choices: ["46 cm", "36 cm", "126 cm", "23 cm"], correct: 0, standard: "TEKS 4.5D", explanation: "P = 2(14) + 2(9) = 28 + 18 = 46 cm" },
            { q: "Maya has 8 rows of stickers with 12 stickers in each row. How many stickers does she have?", type: "word_problem", choices: ["86", "96", "20", "84"], correct: 1, standard: "TEKS 4.4D", explanation: "8 x 12 = 96 stickers" },
            { q: "Which expression equals 7 x 8?", type: "computation", choices: ["7 + 8", "(7 x 4) + (7 x 4)", "8 + 8 + 8", "7 x 7 + 1"], correct: 1, standard: "TEKS 4.4D", explanation: "7 x 8 = (7 x 4) + (7 x 4) = 28 + 28 = 56" },
            { q: "A square garden has a perimeter of 48 feet. What is the length of one side?", type: "word_problem", choices: ["8 ft", "12 ft", "16 ft", "24 ft"], correct: 1, standard: "TEKS 4.5D", explanation: "48 / 4 = 12 ft per side" }
          ]
        },
        science: {
          title: "Earth Materials: Rocks & Minerals",
          questions: [
            { q: "Which type of rock is formed when melted rock (magma) cools and hardens?", type: "multiple_choice", choices: ["Sedimentary", "Metamorphic", "Igneous", "Mineral"], correct: 2, standard: "TEKS 4.7A", explanation: "Igneous rocks form from cooled magma or lava." },
            { q: "Sandstone is made of tiny bits of sand pressed together over time. What type of rock is it?", type: "multiple_choice", choices: ["Igneous", "Sedimentary", "Metamorphic", "Crystal"], correct: 1, standard: "TEKS 4.7A", explanation: "Sedimentary rocks form from layers of material pressed together." },
            { q: "What process changes one type of rock into another over millions of years?", type: "multiple_choice", choices: ["Erosion", "Evaporation", "The rock cycle", "Photosynthesis"], correct: 2, standard: "TEKS 4.7A", explanation: "The rock cycle describes how rocks transform between types." }
          ]
        }
      },
      factSprint: { operation: "multiply", range: [2, 12], count: 20, timeLimit: 120 },
      vocabulary: ["observe", "signal"]
    },
    Tuesday: {
      cold_passage: {
        title: "The Grand Canyon",
        passage: "The Grand Canyon is one of the most amazing natural wonders in the world. Located in Arizona, this massive gorge was carved over millions of years by the Colorado River. The canyon stretches 277 miles long, up to 18 miles wide, and more than a mile deep. Scientists study the layers of rock visible in the canyon walls. Each layer tells a story about Earth's history. The oldest rocks at the bottom are nearly 2 billion years old. Visitors from all over the world come to see the canyon's colorful walls, which change color depending on the time of day and the angle of sunlight.",
        paragraphs: ["The Grand Canyon is one of the most amazing natural wonders in the world. Located in Arizona, this massive gorge was carved over millions of years by the Colorado River.", "The canyon stretches 277 miles long, up to 18 miles wide, and more than a mile deep. Scientists study the layers of rock visible in the canyon walls.", "Each layer tells a story about Earth's history. The oldest rocks at the bottom are nearly 2 billion years old.", "Visitors from all over the world come to see the canyon's colorful walls, which change color depending on the time of day and the angle of sunlight."],
        vocabWords: ["gorge", "carved", "layers"],
        passageVisibility: "full",
        questions: [
          { q: "What created the Grand Canyon over millions of years?", type: "multiple_choice", choices: ["Earthquakes", "The Colorado River", "Volcanoes", "Wind storms"], correct: 1, standard: "TEKS 4.6A" },
          { q: "Why do scientists study the canyon walls?", type: "multiple_choice", choices: ["To find gold", "To learn about Earth's history", "To build bridges", "To count animals"], correct: 1, standard: "TEKS 4.6B" },
          { q: "What does the word 'gorge' most likely mean in this passage?", type: "multiple_choice", choices: ["A mountain", "A deep narrow valley", "A type of river", "A flat desert"], correct: 1, standard: "TEKS 4.2B" },
          { q: "Which detail supports the idea that the Grand Canyon is very old?", type: "multiple_choice", choices: ["It is in Arizona", "Visitors come from all over", "The oldest rocks are nearly 2 billion years old", "The walls change color"], correct: 2, standard: "TEKS 4.6C" }
        ]
      },
      writing: {
        prompt: "Write a descriptive paragraph about a place you have visited or would like to visit. Use at least 3 sensory details (what you see, hear, smell, taste, or feel).",
        standard: "TEKS 4.11A",
        minSentences: 5,
        skillFocus: "descriptive writing"
      }
    },
    Wednesday: {
      module: {
        title: "Fractions & Weather",
        math: {
          title: "Comparing Fractions",
          questions: [
            { q: "Which fraction is greater: 3/4 or 2/3?", type: "multiple_choice", choices: ["3/4", "2/3", "They are equal", "Cannot tell"], correct: 0, standard: "TEKS 4.3D", explanation: "3/4 = 9/12 and 2/3 = 8/12, so 3/4 is greater." },
            { q: "What fraction is equivalent to 2/6?", type: "computation", choices: ["1/2", "1/3", "2/3", "3/6"], correct: 1, standard: "TEKS 4.3C", explanation: "2/6 simplifies to 1/3 (divide both by 2)." },
            { q: "Add: 3/8 + 2/8 = ?", type: "computation", choices: ["5/16", "5/8", "1/8", "6/8"], correct: 1, standard: "TEKS 4.3E", explanation: "Same denominator: 3 + 2 = 5, so 5/8." },
            { q: "Carlos ate 1/4 of a pizza and Maria ate 2/4. How much did they eat together?", type: "word_problem", choices: ["3/8", "3/4", "1/2", "2/8"], correct: 1, standard: "TEKS 4.3E", explanation: "1/4 + 2/4 = 3/4 of the pizza." }
          ]
        },
        science: {
          title: "Weather & the Water Cycle",
          questions: [
            { q: "What is the process called when water changes from liquid to gas?", type: "multiple_choice", choices: ["Condensation", "Precipitation", "Evaporation", "Collection"], correct: 2, standard: "TEKS 4.8A", explanation: "Evaporation is when liquid water becomes water vapor (gas)." },
            { q: "What causes rain to fall from clouds?", type: "multiple_choice", choices: ["Wind pushes it down", "Water droplets get too heavy", "The sun pulls it down", "Cold air freezes it"], correct: 1, standard: "TEKS 4.8A", explanation: "When water droplets in clouds become too heavy, they fall as precipitation." },
            { q: "Which is the main source of energy that drives the water cycle?", type: "multiple_choice", choices: ["The moon", "The wind", "The sun", "The ocean"], correct: 2, standard: "TEKS 4.8A", explanation: "The sun's heat drives evaporation, powering the water cycle." }
          ]
        }
      },
      investigation: {
        prompt: "Your pack discovered something strange: ice cubes melt faster on a metal tray than on a wooden cutting board. Design an investigation to find out why different surfaces affect how fast ice melts.",
        teks: "TEKS 4.2A, 4.2B",
        subject: "Science",
        materials: ["ice cubes", "metal tray", "wooden board", "plastic plate", "timer"],
        guideQuestions: ["What variable are you changing?", "What variable are you measuring?", "What should stay the same?"]
      }
    },
    Thursday: {
      cold_passage: {
        title: "The Life of a Monarch Butterfly",
        passage: "Every fall, millions of monarch butterflies travel up to 3,000 miles from Canada and the United States to the mountains of central Mexico. This incredible journey is called migration. Unlike birds, individual monarchs only make the trip once. The butterflies that return north in spring are actually the great-grandchildren of the ones that flew south. Scientists are still amazed by how monarchs navigate so precisely. They use the position of the sun and Earth's magnetic field to find their way. Sadly, monarch populations have been declining due to habitat loss and pesticide use.",
        paragraphs: ["Every fall, millions of monarch butterflies travel up to 3,000 miles from Canada and the United States to the mountains of central Mexico.", "This incredible journey is called migration. Unlike birds, individual monarchs only make the trip once.", "The butterflies that return north in spring are actually the great-grandchildren of the ones that flew south.", "Scientists are still amazed by how monarchs navigate so precisely. They use the position of the sun and Earth's magnetic field to find their way.", "Sadly, monarch populations have been declining due to habitat loss and pesticide use."],
        vocabWords: ["migration", "navigate", "declining"],
        passageVisibility: "full",
        questions: [
          { q: "How far do monarch butterflies travel during migration?", type: "multiple_choice", choices: ["300 miles", "1,000 miles", "Up to 3,000 miles", "30 miles"], correct: 2, standard: "TEKS 4.6A" },
          { q: "What makes monarch migration different from bird migration?", type: "multiple_choice", choices: ["They fly farther", "They fly faster", "Individual monarchs only make the trip once", "They fly at night"], correct: 2, standard: "TEKS 4.6B" },
          { q: "What does 'declining' mean in the last paragraph?", type: "multiple_choice", choices: ["Growing quickly", "Getting smaller in number", "Moving to a new place", "Changing color"], correct: 1, standard: "TEKS 4.2B" },
          { q: "What are two reasons monarch populations are decreasing?", type: "multiple_choice", choices: ["Cold weather and predators", "Habitat loss and pesticide use", "Disease and drought", "Pollution and noise"], correct: 1, standard: "TEKS 4.6C" }
        ]
      },
      wolfkidEpisode: {
        title: "Episode 1: The Signal in the Storm",
        scenario: "A powerful storm knocked out the communications tower at Pack HQ. Wolfkid must analyze weather data to predict when the storm will pass so the pack can safely repair the tower.",
        writingPrompt: "Wolfkid receives a distress signal during the storm. Write a CER (Claim, Evidence, Reasoning) paragraph: Should the pack attempt repairs now or wait? Use the weather data to support your answer.",
        data: { windSpeed: "45 mph and dropping", temperature: "52F", forecast: "clearing by 3pm", currentTime: "11am" }
      }
    },
    Friday: {
      module: {
        title: "Friday Review & Financial Literacy",
        math: {
          title: "Word Problems & Financial Literacy",
          questions: [
            { q: "Nathan earns $8.50 per hour mowing lawns. If he works 4 hours, how much does he earn?", type: "word_problem", choices: ["$32.00", "$34.00", "$12.50", "$36.00"], correct: 1, standard: "TEKS 4.10A", explanation: "$8.50 x 4 = $34.00" },
            { q: "A rectangle has an area of 72 square cm and a length of 9 cm. What is the width?", type: "word_problem", choices: ["6 cm", "8 cm", "63 cm", "81 cm"], correct: 1, standard: "TEKS 4.5D", explanation: "A = l x w, so 72 = 9 x w, w = 8 cm" },
            { q: "You save $3.75 each week for 6 weeks. How much do you have?", type: "word_problem", choices: ["$22.50", "$18.75", "$22.00", "$9.75"], correct: 0, standard: "TEKS 4.10A", explanation: "$3.75 x 6 = $22.50" },
            { q: "Which is a fixed expense?", type: "multiple_choice", choices: ["Movie tickets", "Monthly rent", "New shoes", "Birthday gift"], correct: 1, standard: "TEKS 4.10B", explanation: "Rent is the same amount every month — that makes it a fixed expense." }
          ]
        },
        science: {
          title: "Weekly Science Review",
          questions: [
            { q: "Which step of the water cycle forms clouds?", type: "multiple_choice", choices: ["Evaporation", "Condensation", "Precipitation", "Collection"], correct: 1, standard: "TEKS 4.8A", explanation: "Condensation is when water vapor cools and forms tiny droplets that make clouds." },
            { q: "Marble is formed when limestone is changed by heat and pressure. What type of rock is marble?", type: "multiple_choice", choices: ["Igneous", "Sedimentary", "Metamorphic", "Mineral"], correct: 2, standard: "TEKS 4.7A", explanation: "Metamorphic rocks form when existing rocks are changed by heat and pressure." }
          ]
        }
      },
      factSprint: { operation: "multiply", range: [3, 12], count: 25, timeLimit: 120 },
      writing: {
        prompt: "Free Write Friday! Write about anything you want for 15 minutes. Challenge: use at least 3 vocabulary words from this week.",
        standard: "TEKS 4.11A",
        minSentences: 8,
        skillFocus: "fluency"
      }
    }
  }
};

var BUGGSY_WEEK_2 = {
  child: "buggsy",
  week: 2,
  startDate: "2026-04-13",
  vocabulary: [
    { word: "hesitate", definition: "To pause before doing something because you are unsure", sentence: "Don't hesitate — jump in and try your best!" },
    { word: "collision", definition: "When two things crash into each other", sentence: "The collision between the two bumper cars made a loud noise." },
    { word: "frequency", definition: "How often something happens", sentence: "The frequency of thunderstorms increases in spring." },
    { word: "absorb", definition: "To soak up or take in", sentence: "A sponge can absorb a lot of water." },
    { word: "transparent", definition: "Clear enough to see through", sentence: "The transparent glass let us see the fish swimming inside." }
  ],
  scaffoldConfig: {
    timerMode: "count_up",
    missionStructure: "sequential",
    feedbackLevel: "on_tap",
    hintLimit: 2,
    retryOnWrong: true,
    thursdayOverride: { timerMode: "hidden", feedbackLevel: "full" }
  },
  days: {
    Monday: {
      module: {
        title: "Division & Animal Adaptations",
        math: {
          title: "Division with Remainders",
          questions: [
            { q: "What is 147 / 7?", type: "computation", choices: ["20", "21", "22", "23"], correct: 1, standard: "TEKS 4.4F", explanation: "147 / 7 = 21" },
            { q: "356 / 4 = ?", type: "computation", choices: ["88", "89", "90", "91"], correct: 1, standard: "TEKS 4.4F", explanation: "356 / 4 = 89" },
            { q: "A teacher has 85 pencils to divide equally among 6 students. How many pencils does each student get and how many are left over?", type: "word_problem", choices: ["14 R1", "13 R3", "14 R2", "15 R0"], correct: 0, standard: "TEKS 4.4F", explanation: "85 / 6 = 14 remainder 1 (6 x 14 = 84, 85 - 84 = 1)" },
            { q: "Which number sentence has a quotient of 9?", type: "computation", choices: ["81 / 9", "72 / 9", "63 / 9", "All of these"], correct: 0, standard: "TEKS 4.4F", explanation: "81 / 9 = 9. (72/9 = 8, 63/9 = 7)" }
          ]
        },
        science: {
          title: "Animal Adaptations",
          questions: [
            { q: "A cactus stores water in its thick stem. This is an example of what?", type: "multiple_choice", choices: ["Behavior", "A structural adaptation", "Migration", "A life cycle"], correct: 1, standard: "TEKS 4.10A", explanation: "A thick stem that stores water is a structural (physical) adaptation." },
            { q: "Why do some animals hibernate during winter?", type: "multiple_choice", choices: ["They are lazy", "Food is scarce and it's cold", "They want to sleep", "They are scared of snow"], correct: 1, standard: "TEKS 4.10A", explanation: "Hibernation helps animals survive when food is hard to find and temperatures drop." },
            { q: "A bird with a long thin beak is best adapted for eating what?", type: "multiple_choice", choices: ["Seeds", "Insects from tree bark", "Large fish", "Grass"], correct: 1, standard: "TEKS 4.10A", explanation: "Long thin beaks help birds reach insects hiding in crevices." }
          ]
        }
      },
      factSprint: { operation: "divide", range: [2, 12], count: 20, timeLimit: 120 },
      vocabulary: ["hesitate", "collision"]
    },
    Tuesday: {
      cold_passage: {
        title: "The Amazing Octopus",
        passage: "The octopus is one of the most intelligent creatures in the ocean. With eight flexible arms and a soft body, it can squeeze through incredibly tiny spaces. An octopus the size of a basketball can fit through a hole the size of a quarter! Octopuses are masters of camouflage. They can change the color and even the texture of their skin in less than a second. This helps them hide from predators and sneak up on prey. Scientists have observed octopuses solving puzzles, opening jars, and even using tools. In one famous experiment, an octopus learned to unscrew a jar lid to reach a crab inside. These remarkable abilities make the octopus one of the most fascinating animals to study.",
        paragraphs: ["The octopus is one of the most intelligent creatures in the ocean. With eight flexible arms and a soft body, it can squeeze through incredibly tiny spaces. An octopus the size of a basketball can fit through a hole the size of a quarter!", "Octopuses are masters of camouflage. They can change the color and even the texture of their skin in less than a second. This helps them hide from predators and sneak up on prey.", "Scientists have observed octopuses solving puzzles, opening jars, and even using tools. In one famous experiment, an octopus learned to unscrew a jar lid to reach a crab inside.", "These remarkable abilities make the octopus one of the most fascinating animals to study."],
        vocabWords: ["camouflage", "texture", "remarkable"],
        passageVisibility: "full",
        questions: [
          { q: "What helps an octopus squeeze through tiny spaces?", type: "multiple_choice", choices: ["Hard shell", "Flexible arms and soft body", "Sharp teeth", "Strong legs"], correct: 1, standard: "TEKS 4.6A" },
          { q: "Why would an octopus want to change its skin color?", type: "multiple_choice", choices: ["To look pretty", "To hide from predators and hunt prey", "Because it is cold", "To attract mates"], correct: 1, standard: "TEKS 4.6B" },
          { q: "What does 'camouflage' mean in this passage?", type: "multiple_choice", choices: ["A type of food", "The ability to blend in with surroundings", "A way to swim fast", "A loud sound"], correct: 1, standard: "TEKS 4.2B" },
          { q: "Which detail best supports the idea that octopuses are intelligent?", type: "multiple_choice", choices: ["They have eight arms", "They live in the ocean", "They can solve puzzles and open jars", "They can squeeze through small spaces"], correct: 2, standard: "TEKS 4.6C" }
        ]
      },
      writing: {
        prompt: "Write a narrative about discovering a mysterious creature in your backyard. Include a beginning, middle, and end. Use dialogue in at least one part.",
        standard: "TEKS 4.11A",
        minSentences: 8,
        skillFocus: "narrative writing"
      }
    },
    Wednesday: {
      module: {
        title: "Decimals & Food Chains",
        math: {
          title: "Decimals — Tenths and Hundredths",
          questions: [
            { q: "Which decimal is equal to 3/10?", type: "computation", choices: ["0.03", "0.3", "3.0", "0.33"], correct: 1, standard: "TEKS 4.2G", explanation: "3/10 = 0.3" },
            { q: "Order from least to greatest: 0.5, 0.35, 0.7", type: "multiple_choice", choices: ["0.35, 0.5, 0.7", "0.5, 0.35, 0.7", "0.7, 0.5, 0.35", "0.35, 0.7, 0.5"], correct: 0, standard: "TEKS 4.2F", explanation: "0.35 < 0.5 < 0.7" },
            { q: "Elena has $4.75 and spends $2.30 on lunch. How much does she have left?", type: "word_problem", choices: ["$2.35", "$2.45", "$7.05", "$2.55"], correct: 1, standard: "TEKS 4.4A", explanation: "$4.75 - $2.30 = $2.45" },
            { q: "What is 0.6 + 0.25?", type: "computation", choices: ["0.31", "0.85", "0.65", "0.8"], correct: 1, standard: "TEKS 4.4A", explanation: "0.60 + 0.25 = 0.85" }
          ]
        },
        science: {
          title: "Food Chains & Ecosystems",
          questions: [
            { q: "In a food chain, what is the role of a producer?", type: "multiple_choice", choices: ["Eats other animals", "Makes its own food from sunlight", "Breaks down dead organisms", "Hunts for prey"], correct: 1, standard: "TEKS 4.9A", explanation: "Producers (like plants) use sunlight to make their own food through photosynthesis." },
            { q: "Grass → Rabbit → Fox. In this food chain, the rabbit is a —", type: "multiple_choice", choices: ["Producer", "Predator only", "Consumer (prey and predator)", "Decomposer"], correct: 2, standard: "TEKS 4.9A", explanation: "The rabbit consumes grass (prey role) and is hunted by the fox (also a predator of grass)." },
            { q: "What would happen if all the rabbits disappeared from this food chain?", type: "multiple_choice", choices: ["Foxes would have more food", "Foxes would have less food", "Grass would disappear", "Nothing would change"], correct: 1, standard: "TEKS 4.9B", explanation: "Without rabbits, foxes lose a food source and their population would likely decline." }
          ]
        }
      },
      investigation: {
        prompt: "Wolfkid's pack needs to purify muddy water for a mission. Design an investigation to test which materials work best as water filters: sand, gravel, cotton balls, or coffee filters.",
        teks: "TEKS 4.2A, 4.2B",
        subject: "Science",
        materials: ["muddy water", "sand", "gravel", "cotton balls", "coffee filters", "cups", "rubber bands"],
        guideQuestions: ["How will you measure how clean the water is?", "What needs to stay the same in each test?", "How many trials should you run?"]
      }
    },
    Thursday: {
      cold_passage: {
        title: "The Dust Bowl",
        passage: "During the 1930s, a terrible disaster struck the Great Plains of the United States. Years of drought and poor farming practices turned the once-fertile soil into dust. Massive dust storms, called 'black blizzards,' swept across the land. Some storms were so thick that people could not see the sun at noon. Families lost their farms and had to move away. Many traveled to California hoping to find work. The government responded by teaching farmers better land management. They learned to plant trees as windbreaks and rotate their crops. These changes helped the soil recover, but it took many years. The Dust Bowl remains one of the worst environmental disasters in American history.",
        paragraphs: ["During the 1930s, a terrible disaster struck the Great Plains of the United States. Years of drought and poor farming practices turned the once-fertile soil into dust.", "Massive dust storms, called 'black blizzards,' swept across the land. Some storms were so thick that people could not see the sun at noon.", "Families lost their farms and had to move away. Many traveled to California hoping to find work.", "The government responded by teaching farmers better land management. They learned to plant trees as windbreaks and rotate their crops.", "These changes helped the soil recover, but it took many years. The Dust Bowl remains one of the worst environmental disasters in American history."],
        vocabWords: ["drought", "fertile", "windbreaks"],
        passageVisibility: "full",
        questions: [
          { q: "What caused the soil to turn to dust during the Dust Bowl?", type: "multiple_choice", choices: ["Flooding", "Earthquakes", "Drought and poor farming", "Volcanic eruptions"], correct: 2, standard: "TEKS 4.6A" },
          { q: "Why did families move to California?", type: "multiple_choice", choices: ["For vacation", "To find work after losing farms", "Because of cold weather", "To go to school"], correct: 1, standard: "TEKS 4.6B" },
          { q: "What does 'fertile' most likely mean?", type: "multiple_choice", choices: ["Dry and sandy", "Good for growing crops", "Rocky and hard", "Covered in snow"], correct: 1, standard: "TEKS 4.2B" },
          { q: "What evidence from the text shows the storms were very bad?", type: "multiple_choice", choices: ["Families moved to California", "People could not see the sun at noon", "The government helped farmers", "Trees were planted"], correct: 1, standard: "TEKS 4.6C" }
        ]
      },
      wolfkidEpisode: {
        title: "Episode 2: The Dust Trail",
        scenario: "Wolfkid discovers that Hex has been deliberately destroying farmland to weaken the village's food supply. The pack must analyze soil samples and plan a restoration strategy.",
        writingPrompt: "Wolfkid presents findings to the Pack Council. Write a CER paragraph: Is Hex responsible for the crop failures? Use the soil sample evidence to support your claim.",
        data: { soilSample1: "healthy soil with worms", soilSample2: "dry gray dust, chemical residue detected", hexFootprints: "found near damaged fields", timeline: "crops began failing 2 weeks after Hex was spotted" }
      }
    },
    Friday: {
      module: {
        title: "Friday Review — Patterns & Review",
        math: {
          title: "Patterns & Mixed Review",
          questions: [
            { q: "What is the rule for this pattern? 5, 12, 19, 26, 33, ...", type: "multiple_choice", choices: ["Add 5", "Add 7", "Multiply by 2", "Add 8"], correct: 1, standard: "TEKS 4.5B", explanation: "Each number increases by 7: 5+7=12, 12+7=19, etc." },
            { q: "If the pattern continues, what is the next number? 3, 6, 12, 24, ...", type: "multiple_choice", choices: ["36", "48", "30", "28"], correct: 1, standard: "TEKS 4.5B", explanation: "Each number is multiplied by 2: 24 x 2 = 48" },
            { q: "A bag has 156 marbles. You divide them equally into 8 bags. How many marbles in each bag and how many left over?", type: "word_problem", choices: ["19 R4", "20 R0", "19 R3", "18 R12"], correct: 0, standard: "TEKS 4.4F", explanation: "156 / 8 = 19 remainder 4 (8 x 19 = 152, 156 - 152 = 4)" },
            { q: "Which is the best estimate for 398 x 5?", type: "multiple_choice", choices: ["1,500", "2,000", "2,500", "1,000"], correct: 1, standard: "TEKS 4.4G", explanation: "Round 398 to 400. 400 x 5 = 2,000" }
          ]
        },
        science: {
          title: "Weekly Science Review",
          questions: [
            { q: "What is the difference between a predator and prey?", type: "multiple_choice", choices: ["Size", "Predators hunt, prey are hunted", "Color", "Where they live"], correct: 1, standard: "TEKS 4.9A", explanation: "A predator hunts and eats other animals (prey)." },
            { q: "Bears hibernating during winter is an example of —", type: "multiple_choice", choices: ["A structural adaptation", "A behavioral adaptation", "Migration", "Camouflage"], correct: 1, standard: "TEKS 4.10A", explanation: "Hibernation is a behavior that helps bears survive winter." }
          ]
        }
      },
      factSprint: { operation: "divide", range: [2, 12], count: 25, timeLimit: 120 },
      writing: {
        prompt: "Write a letter to a 2nd grader explaining what the water cycle is. Use simple words they would understand. Include all 4 stages.",
        standard: "TEKS 4.11A, 4.8A",
        minSentences: 8,
        skillFocus: "expository writing"
      }
    }
  }
};

var BUGGSY_WEEK_3 = {
  child: "buggsy",
  week: 3,
  startDate: "2026-04-20",
  vocabulary: [
    { word: "erosion", definition: "The wearing away of land by water, wind, or ice", sentence: "The river caused erosion along the canyon walls over millions of years." },
    { word: "deposit", definition: "Material that has been left behind by wind, water, or ice", sentence: "The flood left a deposit of mud on the riverbank." },
    { word: "renewable", definition: "A resource that can be replaced naturally over time", sentence: "Solar energy is a renewable resource because the sun keeps shining." },
    { word: "fossil", definition: "The preserved remains or trace of an ancient living thing", sentence: "We found a fossil of a leaf in the rock at the park." },
    { word: "weathering", definition: "The breaking down of rocks by wind, water, ice, or living things", sentence: "Weathering caused the old statue to crack and crumble." }
  ],
  scaffoldConfig: {
    timerMode: "countdown",
    timerSeconds: 180,
    missionStructure: "sequential",
    feedbackLevel: "on_tap",
    hintLimit: 2,
    retryOnWrong: true,
    thursdayOverride: { timerMode: "hidden", feedbackLevel: "full" }
  },
  days: {
    Monday: {
      module: {
        title: "Geometry & Ecosystems",
        math: {
          title: "Lines, Angles & Symmetry",
          questions: [
            { q: "How many lines of symmetry does a square have?", type: "visual", choices: ["1", "2", "4", "0"], correct: 2, standard: "TEKS 4.6B", explanation: "A square has 4 lines of symmetry: vertical, horizontal, and both diagonals." },
            { q: "Which pair of lines will NEVER cross, no matter how far they extend?", type: "multiple_choice", choices: ["Perpendicular lines", "Intersecting lines", "Parallel lines", "Rays"], correct: 2, standard: "TEKS 4.6A", explanation: "Parallel lines run in the same direction and never cross." },
            { q: "An angle that measures exactly 90 degrees is called a —", type: "multiple_choice", choices: ["Acute angle", "Obtuse angle", "Right angle", "Straight angle"], correct: 2, standard: "TEKS 4.6C", explanation: "A right angle is exactly 90 degrees, like the corner of a book." },
            { q: "A triangle with all three sides the same length has how many lines of symmetry?", type: "visual", choices: ["0", "1", "2", "3"], correct: 3, standard: "TEKS 4.6B", explanation: "An equilateral triangle has 3 lines of symmetry." }
          ]
        },
        science: {
          title: "Ecosystems & Habitats",
          questions: [
            { q: "Which is NOT a part of an ecosystem?", type: "multiple_choice", choices: ["Air", "Water", "Living organisms", "A math textbook"], correct: 3, standard: "TEKS 4.9B", explanation: "An ecosystem includes living things (organisms) and non-living things (air, water, soil) — not man-made objects unrelated to the habitat." },
            { q: "If a forest is cleared for buildings, what would MOST LIKELY happen to the animals?", type: "multiple_choice", choices: ["They would grow bigger", "They would lose their habitat", "Nothing would change", "They would build new homes"], correct: 1, standard: "TEKS 4.9B", explanation: "Habitat destruction forces animals to leave or die because they lose food and shelter." },
            { q: "A decomposer's main job in an ecosystem is to —", type: "multiple_choice", choices: ["Hunt prey", "Produce food from sunlight", "Break down dead organisms and return nutrients to soil", "Pollinate flowers"], correct: 2, standard: "TEKS 4.9A", explanation: "Decomposers like fungi and bacteria break down dead material, recycling nutrients." }
          ]
        }
      },
      factSprint: { operation: "mixed", range: [2, 12], count: 20, timeLimit: 120 },
      vocabulary: ["erosion", "deposit"]
    },
    Tuesday: {
      cold_passage: {
        title: "Harriet Tubman: Conductor of the Underground Railroad",
        passage: "Harriet Tubman was born into slavery in Maryland around 1822. She escaped to freedom in 1849 and could have stayed safely in the North. Instead, she risked her life again and again to help others escape. Over the next 11 years, Tubman made approximately 13 trips back to the South. She guided about 70 enslaved people to freedom along the Underground Railroad, a secret network of safe houses. Tubman was so skilled at avoiding capture that she earned the nickname 'Moses.' She once said, 'I never ran my train off the track, and I never lost a passenger.' During the Civil War, she served as a nurse, cook, and even a spy for the Union Army. Harriet Tubman is remembered as one of the bravest Americans in history.",
        paragraphs: ["Harriet Tubman was born into slavery in Maryland around 1822. She escaped to freedom in 1849 and could have stayed safely in the North.", "Instead, she risked her life again and again to help others escape. Over the next 11 years, Tubman made approximately 13 trips back to the South.", "She guided about 70 enslaved people to freedom along the Underground Railroad, a secret network of safe houses.", "Tubman was so skilled at avoiding capture that she earned the nickname 'Moses.' She once said, 'I never ran my train off the track, and I never lost a passenger.'", "During the Civil War, she served as a nurse, cook, and even a spy for the Union Army. Harriet Tubman is remembered as one of the bravest Americans in history."],
        vocabWords: ["approximately", "network", "capture"],
        passageVisibility: "full",
        questions: [
          { q: "How many people did Harriet Tubman guide to freedom?", type: "multiple_choice", choices: ["About 13", "About 70", "About 100", "About 1,000"], correct: 1, standard: "TEKS 4.6A" },
          { q: "Why is it significant that Tubman returned to the South after escaping?", type: "multiple_choice", choices: ["She missed her home", "She was forced to go back", "She risked her life to help others when she could have stayed safe", "She wanted to travel"], correct: 2, standard: "TEKS 4.6B" },
          { q: "What does 'approximately' mean in this passage?", type: "multiple_choice", choices: ["Exactly", "About or close to", "More than", "Less than"], correct: 1, standard: "TEKS 4.2B" },
          { q: "Which quote from the text best shows Tubman never failed on a mission?", type: "multiple_choice", choices: ["She escaped to freedom in 1849", "She risked her life again and again", "I never ran my train off the track and I never lost a passenger", "She served as a nurse and cook"], correct: 2, standard: "TEKS 4.6C" }
        ]
      },
      writing: {
        prompt: "Write a persuasive paragraph: Should kids your age have homework on weekends? State your opinion, give at least 2 reasons with details, and include a conclusion.",
        standard: "TEKS 4.11A",
        minSentences: 7,
        skillFocus: "persuasive writing"
      }
    },
    Wednesday: {
      module: {
        title: "Measurement Conversions & Forces",
        math: {
          title: "Measurement Conversions",
          questions: [
            { q: "How many inches are in 3 feet?", type: "computation", choices: ["24", "30", "36", "48"], correct: 2, standard: "TEKS 4.8C", explanation: "1 foot = 12 inches, so 3 x 12 = 36 inches" },
            { q: "A recipe needs 2 quarts of milk. How many cups is that?", type: "word_problem", choices: ["4 cups", "6 cups", "8 cups", "16 cups"], correct: 2, standard: "TEKS 4.8C", explanation: "1 quart = 4 cups, so 2 x 4 = 8 cups" },
            { q: "Which is longer: 5 meters or 400 centimeters?", type: "multiple_choice", choices: ["5 meters", "400 centimeters", "They are equal", "Cannot tell"], correct: 0, standard: "TEKS 4.8C", explanation: "5 meters = 500 cm, which is more than 400 cm" },
            { q: "A football field is 100 yards long. How many feet is that?", type: "word_problem", choices: ["200 feet", "300 feet", "400 feet", "1,000 feet"], correct: 1, standard: "TEKS 4.8C", explanation: "1 yard = 3 feet, so 100 x 3 = 300 feet" }
          ]
        },
        science: {
          title: "Forces & Motion",
          questions: [
            { q: "What happens to an object when balanced forces act on it?", type: "multiple_choice", choices: ["It speeds up", "It slows down", "It stays the same (no change in motion)", "It changes direction"], correct: 2, standard: "TEKS 4.6D", explanation: "Balanced forces cancel each other out, so the object's motion doesn't change." },
            { q: "A soccer ball sitting still on the ground starts rolling when you kick it. This is an example of —", type: "multiple_choice", choices: ["Balanced forces", "An unbalanced force", "Gravity only", "Friction"], correct: 1, standard: "TEKS 4.6D", explanation: "Your kick adds an unbalanced force that changes the ball's motion." },
            { q: "Why does a ball eventually stop rolling on grass?", type: "multiple_choice", choices: ["Gravity pulls it down", "The grass creates friction", "The wind stops it", "It runs out of energy"], correct: 1, standard: "TEKS 4.6D", explanation: "Friction between the ball and grass slows it down until it stops." }
          ]
        }
      },
      investigation: {
        prompt: "Wolfkid needs to move heavy supply crates across different surfaces. Design an investigation to test which surface has the most friction: carpet, tile, wood, or sandpaper.",
        teks: "TEKS 4.2A, 4.6D",
        subject: "Science",
        materials: ["wooden block", "string", "spring scale", "carpet sample", "tile", "wood board", "sandpaper"],
        guideQuestions: ["How will you measure the force needed to move the block?", "Why is it important to use the same block each time?", "How many trials should you do on each surface?"]
      }
    },
    Thursday: {
      cold_passage: {
        title: "The Mystery of the Bermuda Triangle",
        passage: "The Bermuda Triangle is a region in the Atlantic Ocean between Miami, Bermuda, and Puerto Rico. Over the years, many ships and planes have mysteriously disappeared in this area. Some people believe supernatural forces are at work. However, scientists have found more logical explanations. The area has unpredictable weather, including sudden storms and waterspouts. The Gulf Stream, a powerful ocean current, can quickly carry wreckage far from where an accident occurred. Human error and equipment failure also play a role. In fact, the number of disappearances in the Bermuda Triangle is not significantly higher than in other busy ocean regions. Still, the mystery continues to fascinate people around the world.",
        paragraphs: ["The Bermuda Triangle is a region in the Atlantic Ocean between Miami, Bermuda, and Puerto Rico. Over the years, many ships and planes have mysteriously disappeared in this area.", "Some people believe supernatural forces are at work. However, scientists have found more logical explanations.", "The area has unpredictable weather, including sudden storms and waterspouts. The Gulf Stream, a powerful ocean current, can quickly carry wreckage far from where an accident occurred.", "Human error and equipment failure also play a role. In fact, the number of disappearances in the Bermuda Triangle is not significantly higher than in other busy ocean regions.", "Still, the mystery continues to fascinate people around the world."],
        vocabWords: ["supernatural", "unpredictable", "significantly"],
        passageVisibility: "full",
        questions: [
          { q: "Where is the Bermuda Triangle located?", type: "multiple_choice", choices: ["Pacific Ocean", "Indian Ocean", "Atlantic Ocean between Miami, Bermuda, and Puerto Rico", "Arctic Ocean"], correct: 2, standard: "TEKS 4.6A" },
          { q: "Why does the author include scientific explanations?", type: "multiple_choice", choices: ["To make the story scarier", "To show there are logical reasons for the disappearances", "To prove aliens exist", "To describe the weather"], correct: 1, standard: "TEKS 4.6B" },
          { q: "What does 'unpredictable' mean?", type: "multiple_choice", choices: ["Very calm", "Easy to forecast", "Hard to know in advance", "Always the same"], correct: 2, standard: "TEKS 4.2B" },
          { q: "Which detail from the text suggests the Bermuda Triangle is NOT as dangerous as people think?", type: "multiple_choice", choices: ["Many ships have disappeared", "People believe in supernatural forces", "Disappearances are not significantly higher than other regions", "The Gulf Stream carries wreckage"], correct: 2, standard: "TEKS 4.6C" }
        ]
      },
      wolfkidEpisode: {
        title: "Episode 3: The Vanishing Scouts",
        scenario: "Three pack scouts went missing near Shadow Canyon. Wolfkid must analyze the terrain map, weather data, and communication logs to determine what happened and plan a rescue mission.",
        writingPrompt: "Write a CER paragraph: Based on the evidence, where should Wolfkid's rescue team search first? Use the terrain and weather data to support your recommendation.",
        data: { lastKnownLocation: "Ridge Point, 2.3 miles NE of base", weatherAtDisappearance: "sudden fog rolled in, wind shifted NW", terrainNotes: "canyon narrows at mile 2, caves at mile 2.5", commsLog: "last radio contact at 3:47pm, static heard at 4:02pm" }
      }
    },
    Friday: {
      module: {
        title: "Friday Review — Data & Mixed Practice",
        math: {
          title: "Data Analysis & Review",
          questions: [
            { q: "A dot plot shows test scores: 85, 85, 90, 90, 90, 95, 100. What score appears most often?", type: "multiple_choice", choices: ["85", "90", "95", "100"], correct: 1, standard: "TEKS 4.9A", explanation: "90 appears 3 times, which is more than any other score." },
            { q: "What is the range of these scores: 85, 85, 90, 90, 90, 95, 100?", type: "computation", choices: ["5", "10", "15", "90"], correct: 2, standard: "TEKS 4.9A", explanation: "Range = highest - lowest = 100 - 85 = 15" },
            { q: "A rectangle has a perimeter of 30 cm. If the width is 5 cm, what is the length?", type: "multi_step", choices: ["10 cm", "15 cm", "20 cm", "25 cm"], correct: 0, standard: "TEKS 4.5D", explanation: "P = 2l + 2w; 30 = 2l + 10; 2l = 20; l = 10 cm" },
            { q: "Round 4,867 to the nearest hundred.", type: "computation", choices: ["4,800", "4,900", "4,870", "5,000"], correct: 1, standard: "TEKS 4.2D", explanation: "The tens digit is 6 (5 or more), so round up: 4,900" }
          ]
        },
        science: {
          title: "Weekly Review",
          questions: [
            { q: "What force keeps you from floating off your chair?", type: "multiple_choice", choices: ["Magnetism", "Friction", "Gravity", "Wind"], correct: 2, standard: "TEKS 4.6D", explanation: "Gravity pulls you toward Earth, keeping you in your seat." },
            { q: "Which is an example of a decomposer?", type: "multiple_choice", choices: ["Eagle", "Mushroom", "Oak tree", "Rabbit"], correct: 1, standard: "TEKS 4.9A", explanation: "Mushrooms (fungi) are decomposers that break down dead organic material." }
          ]
        }
      },
      factSprint: { operation: "mixed", range: [3, 12], count: 25, timeLimit: 120 },
      writing: {
        prompt: "Write a how-to paragraph teaching someone to do something you are good at (a sport, a game, cooking something, building with LEGOs, etc.). Use sequence words: first, next, then, finally.",
        standard: "TEKS 4.11A",
        minSentences: 8,
        skillFocus: "procedural writing"
      }
    }
  }
};

var BUGGSY_WEEK_4 = {
  child: "buggsy",
  week: 4,
  startDate: "2026-04-27",
  vocabulary: [
    { word: "scavenger", definition: "An animal that feeds on dead or decaying matter", sentence: "A vulture is a scavenger that eats animals that have already died." },
    { word: "adaptation", definition: "A trait or behavior that helps a living thing survive in its environment", sentence: "A polar bear's thick fur is an adaptation for cold weather." },
    { word: "consumer", definition: "A living thing that eats other organisms for energy", sentence: "A rabbit is a consumer because it eats plants." },
    { word: "predator", definition: "An animal that hunts and eats other animals", sentence: "The hawk is a predator that hunts mice and rabbits." },
    { word: "dissolving", definition: "When a solid mixes completely into a liquid and seems to disappear", sentence: "We watched the sugar dissolving in the warm water." }
  ],
  scaffoldConfig: {
    timerMode: "countdown",
    timerSeconds: 150,
    missionStructure: "sequential",
    feedbackLevel: "on_tap",
    hintLimit: 2,
    retryOnWrong: true,
    thursdayOverride: { timerMode: "hidden", feedbackLevel: "full" }
  },
  days: {
    Monday: {
      module: {
        title: "Multi-Step Problems & Natural Resources",
        math: {
          title: "Multi-Step Word Problems",
          questions: [
            { q: "Sarah has $50. She buys 3 books at $8 each and a notebook for $5. How much money does she have left?", type: "multi_step", choices: ["$21", "$19", "$17", "$13"], correct: 0, standard: "TEKS 4.4H, 4.5A", explanation: "3 x $8 = $24, $24 + $5 = $29 spent. $50 - $29 = $21" },
            { q: "A farmer has 4 fields. Each field has 6 rows of corn with 15 plants in each row. How many corn plants does the farmer have in all?", type: "multi_step", choices: ["360", "240", "96", "300"], correct: 0, standard: "TEKS 4.4D, 4.5A", explanation: "6 x 15 = 90 plants per field. 4 x 90 = 360 plants total." },
            { q: "If n + 15 = 42, what is n?", type: "computation", choices: ["17", "27", "57", "37"], correct: 1, standard: "TEKS 4.5A", explanation: "n = 42 - 15 = 27" },
            { q: "The gym floor is 80 feet long and 50 feet wide. What is the area?", type: "word_problem", choices: ["260 sq ft", "130 sq ft", "4,000 sq ft", "400 sq ft"], correct: 2, standard: "TEKS 4.5D", explanation: "Area = 80 x 50 = 4,000 square feet" }
          ]
        },
        science: {
          title: "Natural Resources",
          questions: [
            { q: "Which of these is a renewable resource?", type: "multiple_choice", choices: ["Coal", "Natural gas", "Solar energy", "Oil"], correct: 2, standard: "TEKS 4.7C", explanation: "Solar energy comes from the sun, which is constantly available — making it renewable." },
            { q: "Why is it important to conserve nonrenewable resources?", type: "multiple_choice", choices: ["They are ugly", "Once used up, they cannot be replaced", "They are too expensive", "They are dangerous"], correct: 1, standard: "TEKS 4.7C", explanation: "Nonrenewable resources like oil and coal take millions of years to form and will eventually run out." },
            { q: "Trees are considered renewable because —", type: "multiple_choice", choices: ["They never die", "New trees can be planted to replace them", "They grow very fast", "They are not useful"], correct: 1, standard: "TEKS 4.7C", explanation: "Trees can be replanted and regrown, making them a renewable resource (though it takes time)." }
          ]
        }
      },
      factSprint: { operation: "mixed", range: [2, 12], count: 20, timeLimit: 100 },
      vocabulary: ["scavenger", "adaptation"]
    },
    Tuesday: {
      cold_passage: {
        title: "The International Space Station",
        passage: "Orbiting about 250 miles above Earth, the International Space Station (ISS) is the largest structure humans have ever built in space. It is roughly the size of a football field and has been continuously occupied since November 2000. Astronauts from many countries live and work on the ISS, usually in crews of six. They conduct scientific experiments that can only be done in microgravity — the near-weightless environment of space. Astronauts must exercise for about two hours every day to keep their muscles and bones strong. Without gravity pulling on them, their bodies would weaken quickly. The ISS circles Earth about 16 times per day, meaning the crew sees 16 sunrises and 16 sunsets every 24 hours. The station is a symbol of international cooperation, with the United States, Russia, Japan, Canada, and Europe all contributing.",
        paragraphs: ["Orbiting about 250 miles above Earth, the International Space Station (ISS) is the largest structure humans have ever built in space. It is roughly the size of a football field and has been continuously occupied since November 2000.", "Astronauts from many countries live and work on the ISS, usually in crews of six. They conduct scientific experiments that can only be done in microgravity — the near-weightless environment of space.", "Astronauts must exercise for about two hours every day to keep their muscles and bones strong. Without gravity pulling on them, their bodies would weaken quickly.", "The ISS circles Earth about 16 times per day, meaning the crew sees 16 sunrises and 16 sunsets every 24 hours.", "The station is a symbol of international cooperation, with the United States, Russia, Japan, Canada, and Europe all contributing."],
        vocabWords: ["microgravity", "continuously", "cooperation"],
        passageVisibility: "full",
        questions: [
          { q: "How big is the International Space Station?", type: "multiple_choice", choices: ["Size of a car", "Size of a house", "Size of a football field", "Size of a city block"], correct: 2, standard: "TEKS 4.6A" },
          { q: "Why must astronauts exercise two hours daily on the ISS?", type: "multiple_choice", choices: ["To lose weight", "To pass the time", "Without gravity their muscles and bones would weaken", "To train for spacewalks"], correct: 2, standard: "TEKS 4.6B" },
          { q: "What does 'microgravity' mean based on context clues?", type: "multiple_choice", choices: ["Very strong gravity", "No atmosphere", "Near-weightless conditions", "Extreme cold"], correct: 2, standard: "TEKS 4.2B" },
          { q: "Which detail best supports the idea that the ISS is an international effort?", type: "multiple_choice", choices: ["It orbits 250 miles up", "Astronauts exercise daily", "The US, Russia, Japan, Canada, and Europe all contribute", "It has been occupied since 2000"], correct: 2, standard: "TEKS 4.6C" }
        ]
      },
      writing: {
        prompt: "Imagine you get to spend one day on the International Space Station. Write a journal entry describing your day. Include what you see, what you do, and how it feels to float in microgravity.",
        standard: "TEKS 4.11A",
        minSentences: 8,
        skillFocus: "creative/descriptive writing"
      }
    },
    Wednesday: {
      module: {
        title: "Fractions Review & Energy",
        math: {
          title: "Fractions — Adding, Subtracting & Comparing",
          questions: [
            { q: "5/8 - 2/8 = ?", type: "computation", choices: ["3/0", "3/8", "7/8", "3/16"], correct: 1, standard: "TEKS 4.3E", explanation: "Same denominator: 5 - 2 = 3, so 3/8" },
            { q: "Which fraction is closest to 1/2?", type: "multiple_choice", choices: ["1/8", "3/8", "5/8", "7/8"], correct: 1, standard: "TEKS 4.3D", explanation: "1/2 = 4/8. 3/8 is 1/8 away from 4/8, the closest option." },
            { q: "Write 0.75 as a fraction.", type: "computation", choices: ["7/5", "3/4", "75/10", "7/50"], correct: 1, standard: "TEKS 4.2G", explanation: "0.75 = 75/100 = 3/4" },
            { q: "A pizza is cut into 6 equal slices. Tim eats 2 slices and Ana eats 3 slices. What fraction of the pizza is LEFT?", type: "word_problem", choices: ["5/6", "1/6", "1/3", "0/6"], correct: 1, standard: "TEKS 4.3E", explanation: "2/6 + 3/6 = 5/6 eaten. 6/6 - 5/6 = 1/6 left." }
          ]
        },
        science: {
          title: "Forms of Energy",
          questions: [
            { q: "A light bulb converts electrical energy into —", type: "multiple_choice", choices: ["Sound energy", "Light and heat energy", "Mechanical energy", "Chemical energy"], correct: 1, standard: "TEKS 4.6A", explanation: "Light bulbs transform electrical energy into light (and some heat)." },
            { q: "Rubbing your hands together quickly makes them warm. This is an example of what type of energy change?", type: "multiple_choice", choices: ["Light to sound", "Mechanical to thermal (heat)", "Chemical to electrical", "Sound to light"], correct: 1, standard: "TEKS 4.6A", explanation: "The motion (mechanical energy) of rubbing creates friction, which produces heat (thermal energy)." },
            { q: "Which is an example of sound energy?", type: "multiple_choice", choices: ["A campfire", "A ringing bell", "A rolling ball", "A battery"], correct: 1, standard: "TEKS 4.6A", explanation: "A ringing bell produces vibrations that travel through the air as sound energy." }
          ]
        }
      },
      investigation: {
        prompt: "Wolfkid needs to find the best insulator to keep the pack's water supply from freezing overnight. Design an investigation to test which material keeps warm water warm the longest: aluminum foil, bubble wrap, a wool sock, or newspaper.",
        teks: "TEKS 4.2A, 4.6A",
        subject: "Science",
        materials: ["4 identical cups", "warm water", "thermometer", "aluminum foil", "bubble wrap", "wool sock", "newspaper", "rubber bands", "timer"],
        guideQuestions: ["What will you measure and how often?", "Why must the water start at the same temperature?", "How will you wrap each cup the same way?"]
      }
    },
    Thursday: {
      cold_passage: {
        title: "The Invention of the Telephone",
        passage: "On March 10, 1876, Alexander Graham Bell made history by placing the first successful telephone call. He spoke into his new device and said, 'Mr. Watson, come here. I want to see you.' His assistant, Thomas Watson, heard every word in the next room. Bell had been working on the invention for years, inspired by his work with deaf students. He understood how sound vibrations travel and wanted to find a way to send voice signals over wire. Not everyone believed in Bell's invention at first. Western Union, the telegraph company, called it a 'toy' with no commercial value. But within just 10 years, over 150,000 Americans had telephones. Today, billions of people carry phones in their pockets — all because of Bell's determination to turn an idea into reality.",
        paragraphs: ["On March 10, 1876, Alexander Graham Bell made history by placing the first successful telephone call. He spoke into his new device and said, 'Mr. Watson, come here. I want to see you.'", "His assistant, Thomas Watson, heard every word in the next room. Bell had been working on the invention for years, inspired by his work with deaf students.", "He understood how sound vibrations travel and wanted to find a way to send voice signals over wire.", "Not everyone believed in Bell's invention at first. Western Union, the telegraph company, called it a 'toy' with no commercial value.", "But within just 10 years, over 150,000 Americans had telephones. Today, billions of people carry phones in their pockets — all because of Bell's determination to turn an idea into reality."],
        vocabWords: ["vibrations", "commercial", "determination"],
        passageVisibility: "full",
        questions: [
          { q: "What were the first words spoken on a telephone?", type: "multiple_choice", choices: ["Hello, can you hear me?", "Mr. Watson, come here. I want to see you.", "Testing, testing, 1-2-3", "Is this working?"], correct: 1, standard: "TEKS 4.6A" },
          { q: "What inspired Bell to invent the telephone?", type: "multiple_choice", choices: ["He wanted to be rich", "His work with deaf students and understanding of sound", "He was bored", "A friend suggested it"], correct: 1, standard: "TEKS 4.6B" },
          { q: "What does 'commercial value' mean?", type: "multiple_choice", choices: ["Scientific importance", "Worth money or useful for business", "Educational purpose", "Entertainment value"], correct: 1, standard: "TEKS 4.2B" },
          { q: "Which detail shows that people eventually accepted the telephone?", type: "multiple_choice", choices: ["Bell worked with deaf students", "Western Union called it a toy", "Within 10 years over 150,000 Americans had telephones", "Watson heard every word"], correct: 2, standard: "TEKS 4.6C" }
        ]
      },
      wolfkidEpisode: {
        title: "Episode 4: The Pack's Invention",
        scenario: "The pack needs to communicate across long distances but their radio is broken. Wolfkid must design a simple communication device using available materials and understanding of sound waves.",
        writingPrompt: "Write a CER paragraph: Which communication method should the pack use — signal flags, tin can telephone, or mirror flashes? Consider distance, weather, and reliability. Use evidence to support your choice.",
        data: { distance: "half a mile across open terrain", weather: "partly cloudy, light wind", availableMaterials: "string, tin cans, mirrors, colored flags, flashlight", timeOfDay: "afternoon" }
      }
    },
    Friday: {
      module: {
        title: "Month Review — Mixed Practice",
        math: {
          title: "April Review — All Topics",
          questions: [
            { q: "What is 2,456 x 3?", type: "computation", choices: ["6,368", "7,368", "7,268", "7,468"], correct: 1, standard: "TEKS 4.4D", explanation: "2,456 x 3 = 7,368" },
            { q: "Which fraction is equivalent to 4/8?", type: "computation", choices: ["2/3", "1/2", "3/4", "2/8"], correct: 1, standard: "TEKS 4.3C", explanation: "4/8 = 1/2 (divide both by 4)" },
            { q: "A store sells notebooks for $2.25 each. If you buy 4 notebooks and pay with a $20 bill, how much change do you get?", type: "multi_step", choices: ["$10.00", "$11.00", "$9.00", "$11.25"], correct: 1, standard: "TEKS 4.4H, 4.10A", explanation: "4 x $2.25 = $9.00. $20.00 - $9.00 = $11.00 change." },
            { q: "The school has 876 students and 24 classrooms. About how many students are in each class?", type: "multiple_choice", choices: ["About 20", "About 30", "About 36", "About 40"], correct: 2, standard: "TEKS 4.4G", explanation: "876 / 24 = 36.5, so about 36 students per class." }
          ]
        },
        science: {
          title: "April Science Review",
          questions: [
            { q: "Name the 4 stages of the water cycle in order.", type: "multiple_choice", choices: ["Evaporation, Condensation, Precipitation, Collection", "Condensation, Evaporation, Collection, Precipitation", "Precipitation, Collection, Evaporation, Condensation", "Collection, Precipitation, Condensation, Evaporation"], correct: 0, standard: "TEKS 4.8A", explanation: "The water cycle: Evaporation (water becomes gas), Condensation (gas becomes droplets/clouds), Precipitation (water falls), Collection (water gathers in bodies of water)." },
            { q: "An animal that eats BOTH plants and animals is called a —", type: "multiple_choice", choices: ["Herbivore", "Carnivore", "Omnivore", "Decomposer"], correct: 2, standard: "TEKS 4.9A", explanation: "Omnivores eat both plants and animals. Examples: bears, humans, pigs." }
          ]
        }
      },
      factSprint: { operation: "mixed", range: [2, 12], count: 30, timeLimit: 150 },
      writing: {
        prompt: "End-of-month reflection: Write about something you learned in April that surprised you OR something you want to learn more about. Explain WHY it was interesting.",
        standard: "TEKS 4.11A",
        minSentences: 8,
        skillFocus: "reflective writing"
      }
    }
  }
};


// ════════════════════════════════════════════════════════════════════
// WEEKS 5-8: Covering missing TEKS strands
// W5: Place value (4.2A-C) + Physical/Chemical changes (4.6B-C) + FICTION passage
// W6: 2-digit multiplication (4.4B) + Life cycles (4.10B) + Poetry
// W7: Input-output tables (4.4E/4.5) + Fossils/Earth history (4.11) + Fiction
// W8: Angles/protractor (4.7A-B) + Weathering/erosion (4.7B) + ECR practice
// ════════════════════════════════════════════════════════════════════

var BUGGSY_WEEK_5 = {
  child: "buggsy",
  week: 5,
  startDate: "2026-05-11",
  vocabulary: [
    { word: "chemical", definition: "Relating to a change that creates a new substance", sentence: "Burning wood is a chemical change because you cannot turn ash back into wood." },
    { word: "physical", definition: "A change in appearance that does not create a new substance", sentence: "Cutting paper is a physical change — it is still paper, just smaller." },
    { word: "mixture", definition: "Two or more substances combined but not chemically joined", sentence: "Trail mix is a mixture — you can still pick out the nuts, raisins, and chocolate." },
    { word: "solution", definition: "A mixture where one substance dissolves completely in another", sentence: "Salt water is a solution because the salt dissolves and you cannot see it." },
    { word: "billion", definition: "The number 1,000,000,000 — one thousand millions", sentence: "There are nearly 8 billion people living on Earth." }
  ],
  scaffoldConfig: {
    timerMode: "count_up",
    missionStructure: "sequential",
    feedbackLevel: "on_tap",
    hintLimit: 2,
    retryOnWrong: true,
    thursdayOverride: { timerMode: "hidden", feedbackLevel: "full" },
    adhd: {
      chunkSize: 3,
      brainBreakAfter: 4,
      brainBreakType: "movement",
      brainBreakPrompt: "Stand up! Do 5 squats, then shake out your hands for 10 seconds. Ready to go!",
      visualCueMode: "progress_dots",
      transitionAudio: true,
      choiceOnFriday: true,
      maxConsecutiveText: 2,
      interleaveVisual: true,
      feedbackDelay: 0,
      celebrateStreak: 3,
      readAloudOption: false
    }
  },
  days: {
    Monday: {
      module: {
        title: "Place Value & Chemical Changes",
        math: {
          title: "Place Value to Billions",
          questions: [
            { q: "What is the value of the 5 in 3,562,481?", type: "multiple_choice", choices: ["5,000", "50,000", "500,000", "5,000,000"], correct: 2, standard: "TEKS 4.2A", explanation: "The 5 is in the hundred-thousands place: 5 x 100,000 = 500,000" },
            { q: "Which number is 10 times greater than 40,000?", type: "computation", choices: ["4,000", "44,000", "400,000", "4,000,000"], correct: 2, standard: "TEKS 4.2A", explanation: "10 x 40,000 = 400,000. Each place value is 10 times the one to its right." },
            { q: "Compare: 4,567,321 ___ 4,576,321", type: "multiple_choice", choices: [">", "<", "=", "Cannot tell"], correct: 1, standard: "TEKS 4.2B", explanation: "Compare place by place. Millions: both 4. Hundred-thousands: 5 vs 5. Ten-thousands: 6 vs 7. Since 6 < 7, the first number is less." },
            { q: "Round 8,472,596 to the nearest million.", type: "computation", choices: ["8,000,000", "9,000,000", "8,500,000", "8,470,000"], correct: 0, standard: "TEKS 4.2D", explanation: "Look at the hundred-thousands place (4). Since 4 < 5, round down to 8,000,000." },
            { q: "A student says 'In 2,345,678, the digit 3 is worth 300,000.' Is this correct?", type: "error_analysis", choices: ["Yes — the 3 is in the hundred-thousands place", "No — the 3 is worth 3,000,000", "No — the 3 is worth 30,000", "No — the 3 is worth 3,000"], correct: 0, standard: "TEKS 4.2A", explanation: "Correct! The 3 is in the hundred-thousands place: 3 x 100,000 = 300,000." }
          ]
        },
        science: {
          title: "Physical vs Chemical Changes",
          questions: [
            { q: "Which is a CHEMICAL change?", type: "multiple_choice", choices: ["Cutting a piece of paper", "Melting ice", "Burning wood", "Crushing a can"], correct: 2, standard: "TEKS 4.6B", explanation: "Burning creates new substances (ash, smoke, gas). You cannot un-burn wood." },
            { q: "Tearing a piece of foil is an example of a —", type: "multiple_choice", choices: ["Chemical change", "Physical change", "Solution", "Chemical reaction"], correct: 1, standard: "TEKS 4.6B", explanation: "The foil is still foil — just a different shape. No new substance is created." },
            { q: "How can you tell a chemical change happened?", type: "multiple_choice", choices: ["The object changes shape", "The object changes size", "A new substance is made (new color, gas, smell, or heat)", "The object moves faster"], correct: 2, standard: "TEKS 4.6B", explanation: "Signs of chemical change: color change, gas produced (bubbles), new smell, heat or light released." }
          ]
        }
      },
      factSprint: { operation: "multiply", range: [6, 12], count: 20, timeLimit: 100 },
      vocabulary: ["chemical", "physical"]
    },
    Tuesday: {
      cold_passage: {
        title: "The Night the Stars Fell",
        passageType: "fiction",
        passage: "Kai pressed his face against the cold window of Grandpa's cabin. The mountain air was silent except for the creek below. 'Grandpa, when do the shooting stars start?' he whispered. Grandpa settled into his rocking chair on the porch. 'Patience, little one. The Perseids come when they come.' Kai had waited all summer for this trip. His science teacher, Ms. Rivera, had told the class about meteor showers — tiny pieces of space rock burning up in Earth's atmosphere. But hearing about it in class was nothing like THIS. At 10:47 PM, the first streak of light sliced across the sky. Kai gasped. Then another. And another. Within minutes, the sky was alive with silent fireworks. 'Grandpa! I counted twelve!' Kai shouted. Grandpa smiled in the dark. 'Your grandmother and I watched this same shower fifty years ago, right from this porch. She said each one was a wish being delivered.' Kai watched one more streak vanish behind the treeline. He closed his eyes and made a wish — that he could bring his little sister next year.",
        paragraphs: ["Kai pressed his face against the cold window of Grandpa's cabin. The mountain air was silent except for the creek below. 'Grandpa, when do the shooting stars start?' he whispered.", "Grandpa settled into his rocking chair on the porch. 'Patience, little one. The Perseids come when they come.' Kai had waited all summer for this trip.", "His science teacher, Ms. Rivera, had told the class about meteor showers — tiny pieces of space rock burning up in Earth's atmosphere. But hearing about it in class was nothing like THIS.", "At 10:47 PM, the first streak of light sliced across the sky. Kai gasped. Then another. And another. Within minutes, the sky was alive with silent fireworks.", "'Grandpa! I counted twelve!' Kai shouted. Grandpa smiled in the dark. 'Your grandmother and I watched this same shower fifty years ago, right from this porch. She said each one was a wish being delivered.'", "Kai watched one more streak vanish behind the treeline. He closed his eyes and made a wish — that he could bring his little sister next year."],
        vocabWords: ["atmosphere", "meteor", "patience"],
        passageVisibility: "full",
        questions: [
          { q: "What is Kai waiting to see?", type: "multiple_choice", choices: ["A rainbow", "The sunrise", "A meteor shower (shooting stars)", "An eclipse"], correct: 2, standard: "TEKS 4.6A" },
          { q: "How does Kai FEEL when the first star appears? How do you know?", type: "multiple_choice", choices: ["Scared — he screams", "Bored — he yawns", "Amazed — he gasps", "Angry — he shouts at Grandpa"], correct: 2, standard: "TEKS 4.6B", explanation: "'Kai gasped' shows amazement and wonder." },
          { q: "What does 'the sky was alive with silent fireworks' mean?", type: "multiple_choice", choices: ["Real fireworks were set off", "The stars were making noise", "Many meteors were streaking across the sky, looking like fireworks", "The sky caught fire"], correct: 2, standard: "TEKS 4.4A", explanation: "This is a metaphor — the author compares the meteors to fireworks because of how they look, not sound." },
          { q: "What can you INFER about Kai's wish at the end?", type: "multiple_choice", choices: ["He wants a new telescope", "He wants to share this experience with his sister", "He wants to be an astronaut", "He wants Grandpa to tell more stories"], correct: 1, standard: "TEKS 4.6B" },
          { q: "What is the author's purpose for writing this story?", type: "multiple_choice", choices: ["To teach facts about meteors", "To persuade readers to visit mountains", "To entertain with a story about family and wonder", "To explain how telescopes work"], correct: 2, standard: "TEKS 4.10A", explanation: "This is fiction — the purpose is to entertain and share an emotional family moment." },
          { q: "This story is told in what order?", type: "multiple_choice", choices: ["Compare and contrast", "Problem and solution", "Chronological (time order)", "Cause and effect"], correct: 2, standard: "TEKS 4.9D", explanation: "Events happen in time order: waiting → first star → counting → wish at the end." }
        ]
      },
      writing: {
        prompt: "Write a short story about a character who discovers something amazing in nature. Include: a setting description, dialogue between two characters, and a moment of wonder. Use at least 2 vocabulary words from this week.",
        standard: "TEKS 4.11A, 4.11B",
        minSentences: 10,
        skillFocus: "narrative writing with dialogue"
      }
    },
    Wednesday: {
      module: {
        title: "Number Lines & Mixtures",
        math: {
          title: "Place Value on Number Lines & Comparing",
          questions: [
            { q: "Which number goes in the blank on this number line? 2,500 ... 3,000 ... ___ ... 4,000", type: "visual", choices: ["3,250", "3,500", "3,750", "3,100"], correct: 1, standard: "TEKS 4.2C", explanation: "The number line counts by 500s: 2500, 3000, 3500, 4000" },
            { q: "Place 0.7 on a number line from 0 to 1. It falls between which two marks?", type: "visual", choices: ["0 and 0.5", "0.5 and 1.0", "0.6 and 0.8", "0.9 and 1.0"], correct: 2, standard: "TEKS 4.2E", explanation: "0.7 is between 0.6 and 0.8 on a number line divided into tenths." },
            { q: "Order these from LEAST to GREATEST: 45,621; 45,216; 45,612", type: "multiple_choice", choices: ["45,621; 45,216; 45,612", "45,216; 45,612; 45,621", "45,216; 45,621; 45,612", "45,612; 45,216; 45,621"], correct: 1, standard: "TEKS 4.2B", explanation: "Compare thousands (all 45), then hundreds: 2 < 6, then 45,612 vs 45,621: tens place 1 < 2." },
            { q: "What is 3/4 as a point on a number line from 0 to 1?", type: "visual", choices: ["Halfway between 0 and 1", "Closer to 1 than to 0", "Closer to 0 than to 1", "At the 1 mark"], correct: 1, standard: "TEKS 4.2H", explanation: "3/4 = 0.75, which is 3/4 of the way from 0 to 1 — closer to 1." }
          ]
        },
        science: {
          title: "Mixtures & Solutions",
          questions: [
            { q: "Which is a MIXTURE that can be easily separated?", type: "multiple_choice", choices: ["Salt dissolved in water", "Sand and pebbles", "Sugar dissolved in tea", "Baking soda and vinegar"], correct: 1, standard: "TEKS 4.6C", explanation: "Sand and pebbles can be separated by size (sifting). Dissolved substances are harder to separate." },
            { q: "What happens when you mix baking soda and vinegar?", type: "multiple_choice", choices: ["Nothing", "They separate into layers", "A chemical reaction produces gas (fizzing/bubbles)", "The vinegar freezes"], correct: 2, standard: "TEKS 4.6B", explanation: "Baking soda + vinegar = chemical change. New substances form (CO2 gas = bubbles)." },
            { q: "If you dissolve sugar in water, how could you get the sugar BACK?", type: "multiple_choice", choices: ["Use a strainer", "Let the water evaporate", "Freeze the water", "Shake the cup"], correct: 1, standard: "TEKS 4.6C", explanation: "Evaporating the water leaves the sugar behind. This works because dissolving is a physical change." }
          ]
        }
      },
      investigation: {
        prompt: "Wolfkid's lab found an unknown powder. Is it a physical or chemical change when you mix it with water vs vinegar? Design an investigation to classify the powder's reactions.",
        teks: "TEKS 4.2A, 4.6B",
        subject: "Science",
        materials: ["unknown white powder (baking soda)", "water", "vinegar", "2 cups", "spoon", "safety goggles"],
        guideQuestions: ["What signs of chemical change will you look for?", "Why do you test with BOTH water and vinegar?", "How will you record your observations?"]
      }
    },
    Thursday: {
      cold_passage: {
        title: "The Race That Changed Everything",
        passageType: "fiction",
        passage: "Amara's legs burned as she rounded the final corner of the track. She could hear footsteps behind her — close. Too close. Three weeks ago, Amara had almost quit the track team. She had finished last in every practice race, and some kids had laughed. That night, she told her mom she wanted to stop. Her mom had listened quietly, then said something Amara would never forget: 'The only race that matters is the one between who you are and who you could be.' The next morning, Amara started training differently. She woke up 30 minutes early to stretch. She practiced her starts against the garage door. She timed herself on every run and wrote the numbers in a notebook. Now, at the district meet, those numbers were paying off. Amara crossed the finish line and looked at the scoreboard. Third place. Not first. Not last. Third. She had beaten her personal best by four seconds. Her mom was already running toward her from the stands, arms wide open. Amara didn't need to see the ribbon. The number on that scoreboard was enough.",
        paragraphs: ["Amara's legs burned as she rounded the final corner of the track. She could hear footsteps behind her — close. Too close.", "Three weeks ago, Amara had almost quit the track team. She had finished last in every practice race, and some kids had laughed.", "That night, she told her mom she wanted to stop. Her mom had listened quietly, then said something Amara would never forget: 'The only race that matters is the one between who you are and who you could be.'", "The next morning, Amara started training differently. She woke up 30 minutes early to stretch. She practiced her starts against the garage door. She timed herself on every run and wrote the numbers in a notebook.", "Now, at the district meet, those numbers were paying off. Amara crossed the finish line and looked at the scoreboard. Third place. Not first. Not last. Third.", "She had beaten her personal best by four seconds. Her mom was already running toward her from the stands, arms wide open. Amara didn't need to see the ribbon. The number on that scoreboard was enough."],
        vocabWords: ["determined", "personal best", "scoreboard"],
        passageVisibility: "full",
        questions: [
          { q: "Why did Amara almost quit the track team?", type: "multiple_choice", choices: ["She was injured", "She finished last and kids laughed", "She didn't like her coach", "Her mom told her to quit"], correct: 1, standard: "TEKS 4.6A" },
          { q: "What THEME (lesson) does this story teach?", type: "multiple_choice", choices: ["Winning is the only thing that matters", "If you work hard, you can improve even if you don't finish first", "Running is the best sport", "Parents should not push their kids"], correct: 1, standard: "TEKS 4.6B", explanation: "The theme is about personal growth and persistence — Amara improved her personal best, and that mattered more than winning." },
          { q: "What does Amara's mom mean by 'the race between who you are and who you could be'?", type: "multiple_choice", choices: ["You should race against yourself", "Running against others is wrong", "The real competition is improving yourself", "She should run faster"], correct: 2, standard: "TEKS 4.4A", explanation: "This is a figurative expression meaning self-improvement matters more than beating others." },
          { q: "How does the author build suspense at the BEGINNING?", type: "multiple_choice", choices: ["By describing the weather", "By using short, tense sentences about footsteps being close", "By listing Amara's practice schedule", "By describing the scoreboard"], correct: 1, standard: "TEKS 4.10A", explanation: "Short sentences like 'Close. Too close.' create tension — the author uses pacing to build suspense." },
          { q: "What is the text structure of paragraphs 2-4?", type: "multiple_choice", choices: ["Description", "Compare and contrast", "Problem and solution", "Cause and effect"], correct: 2, standard: "TEKS 4.9D", explanation: "Problem: Amara was losing and wanted to quit. Solution: She changed her training approach." }
        ]
      },
      grammarSprint: {
        title: "Grammar Sprint: Verb Tenses",
        standard: "TEKS 4.11D",
        questions: [
          { q: "Which sentence uses the PAST tense correctly?", choices: ["She runned to the store.", "She ran to the store.", "She has runned to the store.", "She ranned to the store."], correct: 1, explanation: "'Ran' is the correct past tense of 'run.' It is an irregular verb." },
          { q: "Change to FUTURE tense: 'The team practices every day.'", choices: ["The team practiced every day.", "The team will practice every day.", "The team is practicing every day.", "The team has practiced every day."], correct: 1, explanation: "Future tense uses 'will' + base verb: will practice." },
          { q: "Which sentence has a CONSISTENT verb tense?", choices: ["She walked to school and eats lunch.", "She walked to school and ate lunch.", "She walks to school and ate lunch.", "She will walk to school and ate lunch."], correct: 1, explanation: "Both verbs are past tense (walked, ate) — consistent." },
          { q: "Read: 'Yesterday, I go to the park and played catch.' Fix the error.", choices: ["Yesterday, I went to the park and played catch.", "Yesterday, I go to the park and play catch.", "Yesterday, I going to the park and played catch.", "No error."], correct: 0, explanation: "'Yesterday' signals past tense. 'Go' should be 'went' to match 'played.'" },
          { q: "Which is a HELPING verb?", choices: ["jumped", "beautiful", "has", "quickly"], correct: 2, explanation: "Helping verbs (has, have, had, is, are, was, were, will) help the main verb show tense." }
        ]
      },
      wolfkidEpisode: {
        title: "Episode 5: The Invisible Threat",
        scenario: "Strange things are happening at Pack HQ — metal is rusting overnight, food is spoiling faster than normal, and a mysterious fizzing sound comes from the supply room. Wolfkid suspects Hex is using chemical reactions as weapons.",
        writingPrompt: "Write a CER paragraph: Based on the evidence, are these changes physical or chemical? Identify at least 2 specific changes and classify each one. Use what you know about signs of chemical change.",
        data: { observation1: "Metal gate covered in orange-brown rust", observation2: "Bread moldy after just 1 day (normally takes 5)", observation3: "Fizzing sound from supply room, strong vinegar smell", observation4: "Puddle of water on the floor near the ice chest (normal?)" }
      }
    },
    Friday: {
      module: {
        title: "Friday Review — Place Value & Matter",
        math: {
          title: "Place Value & Comparison Review",
          questions: [
            { q: "Write 6,000,000 + 400,000 + 30,000 + 2,000 + 500 + 10 + 7 in standard form.", type: "computation", choices: ["6,432,517", "6,430,517", "643,2517", "6,432,571"], correct: 0, standard: "TEKS 4.2A", explanation: "Add all values: 6,432,517" },
            { q: "Which digit is in the ten-thousands place of 7,891,234?", type: "multiple_choice", choices: ["8", "9", "1", "2"], correct: 1, standard: "TEKS 4.2A", explanation: "Reading right to left: ones(4), tens(3), hundreds(2), thousands(1), ten-thousands(9)." },
            { q: "Round 3,847,562 to the nearest hundred-thousand.", type: "computation", choices: ["3,800,000", "3,900,000", "3,850,000", "4,000,000"], correct: 0, standard: "TEKS 4.2D", explanation: "Ten-thousands digit is 4 (< 5), so round down: 3,800,000" },
            { q: "A student wrote these numbers from least to greatest: 892,451; 892,541; 892,145. Is the order correct?", type: "error_analysis", choices: ["Yes — they are in order", "No — 892,145 should be first", "No — 892,541 should be first", "No — they should be reversed"], correct: 1, standard: "TEKS 4.2B", explanation: "Correct order: 892,145 < 892,451 < 892,541. The student put 892,145 last instead of first." }
          ]
        },
        science: {
          title: "Physical & Chemical Changes Review",
          questions: [
            { q: "Cooking an egg is a ___ change because you cannot un-cook it.", type: "multiple_choice", choices: ["physical", "chemical", "temporary", "reversible"], correct: 1, standard: "TEKS 4.6B", explanation: "Cooking creates new substances (proteins change structure). It is irreversible — chemical." },
            { q: "Which is NOT a sign of a chemical change?", type: "multiple_choice", choices: ["Change in color", "New smell produced", "Change in shape only", "Gas bubbles formed"], correct: 2, standard: "TEKS 4.6B", explanation: "Changing shape (cutting, folding, breaking) is a physical change. Chemical changes produce new substances." }
          ]
        }
      },
      factSprint: { operation: "multiply", range: [7, 12], count: 25, timeLimit: 100 },
      writing: {
        prompt: "STAAR Practice — Extended Constructed Response: Read the prompt below and write a 4-paragraph response (intro, 2 body paragraphs with evidence, conclusion). Prompt: 'Should schools serve only healthy food in the cafeteria? Write an essay arguing your position. Use at least 2 reasons with supporting details.'",
        standard: "TEKS 4.12A",
        minSentences: 12,
        skillFocus: "ECR (Extended Constructed Response) — STAAR format",
        rubric: "4-paragraph structure: Introduction (thesis), Body 1 (reason + detail), Body 2 (reason + detail), Conclusion (restate + extend)"
      }
    }
  }
};

var BUGGSY_WEEK_6 = {
  child: "buggsy",
  week: 6,
  startDate: "2026-05-18",
  vocabulary: [
    { word: "metamorphosis", definition: "A major change in body form during an animal's life cycle", sentence: "A caterpillar goes through metamorphosis to become a butterfly." },
    { word: "larva", definition: "The young form of an insect that looks very different from the adult", sentence: "The larva of a mosquito lives in water before becoming an adult." },
    { word: "product", definition: "The answer you get when you multiply two numbers", sentence: "The product of 25 and 4 is 100." },
    { word: "factor", definition: "A number that is multiplied by another number to get a product", sentence: "The factors of 12 include 1, 2, 3, 4, 6, and 12." },
    { word: "stanza", definition: "A group of lines in a poem, like a paragraph in a story", sentence: "The poem had four stanzas, each with four lines." }
  ],
  scaffoldConfig: {
    timerMode: "count_up",
    missionStructure: "sequential",
    feedbackLevel: "on_tap",
    hintLimit: 2,
    retryOnWrong: true,
    thursdayOverride: { timerMode: "hidden", feedbackLevel: "full" },
    adhd: {
      chunkSize: 3,
      brainBreakAfter: 4,
      brainBreakType: "movement",
      brainBreakPrompt: "Quick! Stand up, touch your toes 5 times, then sit back down. GO!",
      visualCueMode: "progress_dots",
      transitionAudio: true,
      choiceOnFriday: true,
      maxConsecutiveText: 2,
      interleaveVisual: true,
      feedbackDelay: 0,
      celebrateStreak: 3,
      readAloudOption: false
    }
  },
  days: {
    Monday: {
      module: {
        title: "2-Digit Multiplication & Life Cycles",
        math: {
          title: "Multi-Digit Multiplication (2x2)",
          questions: [
            { q: "What is 23 x 15?", type: "computation", choices: ["335", "345", "235", "355"], correct: 1, standard: "TEKS 4.4B", explanation: "23 x 15: (23 x 10) + (23 x 5) = 230 + 115 = 345" },
            { q: "A school has 24 classrooms with 28 desks each. How many desks total?", type: "word_problem", choices: ["652", "672", "572", "682"], correct: 1, standard: "TEKS 4.4B", explanation: "24 x 28 = (24 x 30) - (24 x 2) = 720 - 48 = 672" },
            { q: "Which is the BEST way to estimate 38 x 42?", type: "multiple_choice", choices: ["30 x 40 = 1,200", "40 x 40 = 1,600", "38 x 40 = 1,520", "40 x 50 = 2,000"], correct: 1, standard: "TEKS 4.4G", explanation: "Round both to the nearest ten: 40 x 40 = 1,600. Actual: 38 x 42 = 1,596." },
            { q: "Find the product: 36 x 14", type: "computation", choices: ["404", "504", "494", "514"], correct: 1, standard: "TEKS 4.4B", explanation: "36 x 14: (36 x 10) + (36 x 4) = 360 + 144 = 504" },
            { q: "A student solved 45 x 12 and got 450. What mistake did they make?", type: "error_analysis", choices: ["They only multiplied 45 x 10 and forgot to add 45 x 2", "They added instead of multiplied", "They divided instead of multiplied", "Their answer is correct"], correct: 0, standard: "TEKS 4.4B", explanation: "45 x 10 = 450 but 45 x 12 = 450 + 90 = 540. Student forgot the x 2 part." }
          ]
        },
        science: {
          title: "Life Cycles: Complete Metamorphosis",
          questions: [
            { q: "What are the 4 stages of COMPLETE metamorphosis?", type: "multiple_choice", choices: ["Egg, larva, pupa, adult", "Egg, nymph, adult, death", "Birth, growth, reproduction, death", "Egg, tadpole, frog, adult"], correct: 0, standard: "TEKS 4.10B", explanation: "Complete metamorphosis: egg → larva (caterpillar) → pupa (chrysalis) → adult (butterfly)." },
            { q: "Which animal goes through INCOMPLETE metamorphosis?", type: "multiple_choice", choices: ["Butterfly", "Frog", "Grasshopper", "Ladybug"], correct: 2, standard: "TEKS 4.10B", explanation: "Grasshoppers have 3 stages (egg, nymph, adult) — no pupa stage. That is incomplete metamorphosis." },
            { q: "How is a frog's life cycle DIFFERENT from a butterfly's?", type: "multiple_choice", choices: ["Frogs skip the egg stage", "Frogs have a tadpole stage instead of a larva/pupa", "Frogs do not change at all", "There is no difference"], correct: 1, standard: "TEKS 4.10B", explanation: "Frogs: egg → tadpole → froglet → adult frog. Different stages, same concept of metamorphosis." }
          ]
        }
      },
      factSprint: { operation: "multiply", range: [11, 15], count: 20, timeLimit: 120 },
      vocabulary: ["metamorphosis", "larva"]
    },
    Tuesday: {
      cold_passage: {
        title: "The Road Not Taken (adapted)",
        passageType: "poetry",
        passage: "Two roads diverged in a yellow wood,\nAnd sorry I could not travel both\nAnd be one traveler, long I stood\nAnd looked down one as far as I could\nTo where it bent in the undergrowth;\n\nThen took the other, as just as fair,\nAnd having perhaps the better claim,\nBecause it was grassy and wanted wear;\nThough as for that the passing there\nHad worn them really about the same,\n\nI shall be telling this with a sigh\nSomewhere ages and ages hence:\nTwo roads diverged in a wood, and I —\nI took the one less traveled by,\nAnd that has made all the difference.\n\n— Robert Frost (adapted)",
        paragraphs: ["Two roads diverged in a yellow wood, / And sorry I could not travel both / And be one traveler, long I stood / And looked down one as far as I could / To where it bent in the undergrowth;", "Then took the other, as just as fair, / And having perhaps the better claim, / Because it was grassy and wanted wear; / Though as for that the passing there / Had worn them really about the same,", "I shall be telling this with a sigh / Somewhere ages and ages hence: / Two roads diverged in a wood, and I — / I took the one less traveled by, / And that has made all the difference."],
        vocabWords: ["diverged", "hence", "undergrowth"],
        passageVisibility: "full",
        questions: [
          { q: "In this poem, what do the 'two roads' MOST LIKELY represent?", type: "multiple_choice", choices: ["Two actual hiking trails", "Two choices or paths in life", "Two different forests", "Two friends going different ways"], correct: 1, standard: "TEKS 4.4A", explanation: "The roads are a metaphor for life choices — the poem is about making decisions." },
          { q: "What does 'diverged' mean in the first line?", type: "multiple_choice", choices: ["Came together", "Split apart / went in different directions", "Disappeared", "Got wider"], correct: 1, standard: "TEKS 4.2B" },
          { q: "How many STANZAS does this poem have?", type: "multiple_choice", choices: ["1", "2", "3", "4"], correct: 2, standard: "TEKS 4.4B", explanation: "A stanza is a group of lines separated by a blank line. This poem has 3 stanzas." },
          { q: "What is the TONE of the last stanza?", type: "multiple_choice", choices: ["Angry and frustrated", "Reflective and thoughtful", "Silly and playful", "Scared and nervous"], correct: 1, standard: "TEKS 4.4C", explanation: "'I shall be telling this with a sigh' — the speaker looks back thoughtfully on their choice." },
          { q: "What is the poet's PURPOSE?", type: "multiple_choice", choices: ["To give directions through a forest", "To teach about types of trees", "To reflect on how choices shape our lives", "To persuade people to hike more"], correct: 2, standard: "TEKS 4.10A" },
          { q: "This poem uses which literary device MOST?", type: "multiple_choice", choices: ["Simile (comparing with like/as)", "Metaphor (roads = life choices)", "Onomatopoeia (sound words)", "Alliteration (same starting sounds)"], correct: 1, standard: "TEKS 4.4A" }
        ]
      },
      writing: {
        prompt: "Write your OWN short poem (8+ lines, at least 2 stanzas) about a time you had to make a choice. It can be big or small — choosing a game, picking a team, deciding to try something new. Use at least 1 metaphor or simile.",
        standard: "TEKS 4.11A, 4.4",
        minSentences: 8,
        skillFocus: "poetry writing"
      }
    },
    Wednesday: {
      module: {
        title: "Strip Diagrams & Plant Life Cycles",
        math: {
          title: "Strip Diagrams & Fraction Word Problems",
          questions: [
            { q: "Nathan has 3 times as many cards as Buggsy. Together they have 48 cards. How many does Buggsy have? (Draw a strip diagram.)", type: "word_problem", choices: ["12", "16", "36", "24"], correct: 0, standard: "TEKS 4.3G, 4.5B", explanation: "Strip diagram: Buggsy = 1 part, Nathan = 3 parts. Total = 4 parts = 48. Each part = 12. Buggsy has 12." },
            { q: "A bakery sold 3/8 of its muffins in the morning and 2/8 in the afternoon. What fraction is LEFT?", type: "word_problem", choices: ["5/8", "3/8", "1/8", "6/8"], correct: 1, standard: "TEKS 4.3E, 4.3G", explanation: "Sold: 3/8 + 2/8 = 5/8. Left: 8/8 - 5/8 = 3/8." },
            { q: "Which fraction model shows 3/5?", type: "visual", choices: ["3 out of 5 sections shaded", "5 out of 3 sections shaded", "3 out of 8 sections shaded", "5 out of 5 sections shaded"], correct: 0, standard: "TEKS 4.3A", explanation: "3/5 means 3 out of 5 equal parts are shaded." },
            { q: "Decompose 5/6 into a sum of unit fractions.", type: "multiple_choice", choices: ["1/6 + 1/6 + 1/6 + 1/6 + 1/6", "5/1 + 5/1", "1/5 + 1/5 + 1/5 + 1/5 + 1/5 + 1/5", "2/6 + 2/6 + 2/6"], correct: 0, standard: "TEKS 4.3B", explanation: "5/6 = five copies of 1/6: 1/6 + 1/6 + 1/6 + 1/6 + 1/6" }
          ]
        },
        science: {
          title: "Plant Life Cycles & Inherited Traits",
          questions: [
            { q: "What is the correct order of a plant's life cycle?", type: "multiple_choice", choices: ["Seed, seedling, adult plant, flower/fruit, seed dispersal", "Flower, seed, root, leaf", "Adult, baby, seed, flower", "Root, stem, leaf, flower"], correct: 0, standard: "TEKS 4.10B", explanation: "Plants cycle: seed → seedling → mature plant → flowers → fruit/seeds → dispersal → new seed." },
            { q: "Which trait is INHERITED (passed from parent to offspring)?", type: "multiple_choice", choices: ["Speaking Spanish", "Eye color", "A broken arm", "Knowing how to ride a bike"], correct: 1, standard: "TEKS 4.10A", explanation: "Eye color comes from DNA (inherited). Languages and skills are learned behaviors." },
            { q: "A dog is trained to sit on command. Is this inherited or learned?", type: "multiple_choice", choices: ["Inherited — all dogs can sit", "Learned — someone taught it", "Both inherited and learned", "Neither"], correct: 1, standard: "TEKS 4.10A", explanation: "Sitting on command is a trained/learned behavior, not something passed through genes." }
          ]
        }
      },
      investigation: {
        prompt: "Wolfkid found two plants: one in sunlight, one in a dark closet. After 2 weeks, they look very different. Design an investigation to determine how light affects plant growth.",
        teks: "TEKS 4.2A, 4.10B",
        subject: "Science",
        materials: ["2 identical seedlings", "2 cups with soil", "water", "ruler", "sunny window", "dark closet", "notebook"],
        guideQuestions: ["What is your hypothesis about light and plant growth?", "What will you measure and how often?", "What variables must stay the same?", "How long should the investigation run?"]
      }
    },
    Thursday: {
      cold_passage: {
        title: "The Lunchroom Experiment",
        passageType: "fiction",
        passage: "Maya had a theory, and she was going to prove it. Every day at lunch, the same thing happened: the kids at Table 6 complained that their food was cold, while Table 2 always got theirs hot. Maya had been keeping a data notebook for a week. She recorded the time each table was served, the distance from the kitchen, and even the temperature of the trays. Her data showed something surprising. Table 6 was actually served FIRST, three minutes before Table 2. So why was their food colder? Maya looked at her notes again. Then she noticed it — Table 6 was right next to the big window. On sunny days, kids opened it wide for fresh air. The cold breeze from outside was cooling their food faster than Table 2's, which was in the warm center of the room. Maya presented her findings to the cafeteria manager, Ms. Johnson. 'You know what, Maya? That is some real scientific thinking,' Ms. Johnson said. The next week, Table 6 got a new spot — away from the window. Problem solved.",
        paragraphs: ["Maya had a theory, and she was going to prove it. Every day at lunch, the same thing happened: the kids at Table 6 complained that their food was cold, while Table 2 always got theirs hot.", "Maya had been keeping a data notebook for a week. She recorded the time each table was served, the distance from the kitchen, and even the temperature of the trays.", "Her data showed something surprising. Table 6 was actually served FIRST, three minutes before Table 2. So why was their food colder?", "Maya looked at her notes again. Then she noticed it — Table 6 was right next to the big window. On sunny days, kids opened it wide for fresh air. The cold breeze from outside was cooling their food faster than Table 2's, which was in the warm center of the room.", "Maya presented her findings to the cafeteria manager, Ms. Johnson. 'You know what, Maya? That is some real scientific thinking,' Ms. Johnson said. The next week, Table 6 got a new spot — away from the window. Problem solved."],
        vocabWords: ["theory", "data", "findings"],
        passageVisibility: "full",
        questions: [
          { q: "Why did Maya start keeping a data notebook?", type: "multiple_choice", choices: ["Her teacher assigned it", "She wanted to solve the mystery of the cold food", "She wanted to win a prize", "She was bored at lunch"], correct: 1, standard: "TEKS 4.6A" },
          { q: "What was the REAL reason Table 6's food was colder?", type: "multiple_choice", choices: ["They were served last", "The kitchen was far away", "Cold air from the open window cooled it", "The lunch lady didn't like them"], correct: 2, standard: "TEKS 4.6B" },
          { q: "What text structure does the author use?", type: "multiple_choice", choices: ["Compare and contrast", "Cause and effect", "Problem and solution", "Chronological order"], correct: 2, standard: "TEKS 4.9D", explanation: "Problem: Table 6's food is cold. Investigation. Solution: move the table away from the window." },
          { q: "What character trait BEST describes Maya?", type: "multiple_choice", choices: ["Lazy — she avoids work", "Curious and methodical — she collects data to find answers", "Bossy — she tells everyone what to do", "Shy — she keeps to herself"], correct: 1, standard: "TEKS 4.6B" },
          { q: "Why did the author include Ms. Johnson's quote 'That is some real scientific thinking'?", type: "multiple_choice", choices: ["To show Maya got in trouble", "To show that adults value Maya's scientific approach", "To make the story funnier", "To describe Ms. Johnson's appearance"], correct: 1, standard: "TEKS 4.10A" }
        ]
      },
      grammarSprint: {
        title: "Grammar Sprint: Adjectives, Adverbs & Prepositions",
        standard: "TEKS 4.11D",
        questions: [
          { q: "Which word is an ADVERB in this sentence? 'The cat quickly jumped over the fence.'", choices: ["cat", "quickly", "jumped", "fence"], correct: 1, explanation: "Adverbs modify verbs. 'Quickly' tells HOW the cat jumped." },
          { q: "Add a PREPOSITIONAL PHRASE to make this sentence more specific: 'The book was sitting ___.'", choices: ["on the dusty shelf", "very old", "that I read", "book bookshelf"], correct: 0, explanation: "A prepositional phrase starts with a preposition (on, in, under, over) and adds location detail." },
          { q: "Which sentence uses COMPARATIVE adjectives correctly?", choices: ["She is more taller than her brother.", "She is taller than her brother.", "She is the most tallest in class.", "She is tallest than her brother."], correct: 1, explanation: "For short adjectives, add -er: tall → taller. Don't use 'more' AND '-er' together." },
          { q: "Find the adjectives: 'The tiny, brown squirrel gathered three large acorns.'", choices: ["tiny, brown, three, large", "squirrel, acorns", "gathered, three", "tiny, gathered, large"], correct: 0, explanation: "Adjectives describe nouns: tiny (size), brown (color), three (number), large (size)." },
          { q: "Which is a STRONGER word choice? 'The man walked down the street.'", choices: ["The man moved down the street.", "The man went down the street.", "The elderly man shuffled down the narrow street.", "The man walked down the street fast."], correct: 2, explanation: "Specific adjectives (elderly, narrow) and strong verbs (shuffled) create vivid writing." }
        ]
      },
      wolfkidEpisode: {
        title: "Episode 6: The Metamorphosis Machine",
        scenario: "Hex has built a device that accelerates life cycles — plants grow in minutes, insects mature in seconds. Wolfkid must understand metamorphosis to predict what Hex's machine will produce and shut it down before the ecosystem spirals out of control.",
        writingPrompt: "Write a CER paragraph: If Hex speeds up the life cycle of butterflies, what would happen to the ecosystem? Use your knowledge of food chains AND life cycles to predict at least 2 effects.",
        data: { machineEffect: "10x speed on all insects within 100-meter radius", observedChanges: "caterpillars becoming butterflies in 3 minutes, flowers being pollinated 10x faster", ecosystemData: "bird population near machine increased 40% in one day", warning: "insect food sources depleting rapidly" }
      }
    },
    Friday: {
      module: {
        title: "Friday Review — Multiplication & Life Cycles",
        math: {
          title: "Mixed Review: Multiplication & Patterns",
          questions: [
            { q: "What is 47 x 23?", type: "computation", choices: ["1,081", "1,061", "981", "1,181"], correct: 0, standard: "TEKS 4.4B", explanation: "47 x 23 = (47 x 20) + (47 x 3) = 940 + 141 = 1,081" },
            { q: "Complete the input-output table. Rule: multiply by 6, then add 2.\nInput: 3 → Output: ?\nInput: 5 → Output: ?\nInput: 8 → Output: ?", type: "multiple_choice", choices: ["20, 32, 50", "20, 32, 48", "18, 30, 48", "20, 30, 50"], correct: 0, standard: "TEKS 4.4E, 4.5B", explanation: "3x6+2=20, 5x6+2=32, 8x6+2=50" },
            { q: "If 34 x 26 = 884, what is 34 x 27?", type: "multiple_choice", choices: ["918", "884", "850", "924"], correct: 0, standard: "TEKS 4.4B", explanation: "34 x 27 = 34 x 26 + 34 x 1 = 884 + 34 = 918" },
            { q: "A student says 52 x 30 = 156. What did they do wrong?", type: "error_analysis", choices: ["They multiplied 52 x 3 instead of 52 x 30", "They added instead of multiplied", "They divided", "The answer is correct"], correct: 0, standard: "TEKS 4.4B", explanation: "52 x 3 = 156. But 52 x 30 = 1,560. The student forgot the zero (or didn't multiply by 10)." }
          ]
        },
        science: {
          title: "Life Cycles Review",
          questions: [
            { q: "Which animal has a life cycle that includes a TADPOLE stage?", type: "multiple_choice", choices: ["Butterfly", "Frog", "Grasshopper", "Chicken"], correct: 1, standard: "TEKS 4.10B" },
            { q: "A puppy learning to fetch is an example of a ___ behavior.", type: "multiple_choice", choices: ["Inherited", "Instinctive", "Learned", "Structural"], correct: 2, standard: "TEKS 4.10A" }
          ]
        }
      },
      factSprint: { operation: "multiply", range: [12, 15], count: 25, timeLimit: 120 },
      writing: {
        prompt: "Choose an animal. Write an informational paragraph explaining its life cycle. Include at least 3 stages and use transition words (first, next, then, finally). Use at least 2 vocabulary words.",
        standard: "TEKS 4.11A, 4.10B",
        minSentences: 8,
        skillFocus: "informational writing"
      }
    }
  }
};

var BUGGSY_WEEK_7 = {
  child: "buggsy",
  week: 7,
  startDate: "2026-05-25",
  vocabulary: [
    { word: "fossil", definition: "The preserved remains or trace of a living thing from long ago", sentence: "Scientists found a fossil of a fish in the desert — proof it was once underwater." },
    { word: "sediment", definition: "Tiny pieces of rock, sand, or soil carried by water or wind", sentence: "The river carried sediment downstream and deposited it on the banks." },
    { word: "variable", definition: "Something in an experiment or equation that can change", sentence: "In the equation y = 3x + 2, the variable x can be any number." },
    { word: "ancient", definition: "Very old, from a time long ago", sentence: "The ancient ruins were over 2,000 years old." },
    { word: "equation", definition: "A math sentence that uses an equal sign to show two things are the same", sentence: "The equation 5 + n = 12 means something plus 5 equals 12." }
  ],
  scaffoldConfig: {
    timerMode: "countdown",
    timerSeconds: 180,
    missionStructure: "sequential",
    feedbackLevel: "on_tap",
    hintLimit: 2,
    retryOnWrong: true,
    thursdayOverride: { timerMode: "hidden", feedbackLevel: "full" },
    adhd: {
      chunkSize: 3,
      brainBreakAfter: 4,
      brainBreakType: "choice",
      brainBreakPrompt: "Brain recharge! Pick one: 10 wall push-ups, run in place for 20 seconds, or do 5 big arm circles each way.",
      visualCueMode: "progress_bar",
      transitionAudio: true,
      choiceOnFriday: true,
      maxConsecutiveText: 2,
      interleaveVisual: true,
      feedbackDelay: 0,
      celebrateStreak: 3,
      readAloudOption: false
    }
  },
  days: {
    Monday: {
      module: {
        title: "Input-Output Tables & Fossils",
        math: {
          title: "Input-Output Tables & Equations",
          questions: [
            { q: "Find the rule: Input 2→8, 4→16, 6→24, 9→?", type: "multiple_choice", choices: ["27", "32", "36", "30"], correct: 2, standard: "TEKS 4.4E", explanation: "Rule: multiply by 4. 9 x 4 = 36" },
            { q: "If n x 7 = 84, what is n?", type: "computation", choices: ["11", "12", "13", "14"], correct: 1, standard: "TEKS 4.5A", explanation: "84 / 7 = 12, so n = 12" },
            { q: "Complete the table. Rule: Output = Input x 3 - 1\nInput: 5 → Output: ?", type: "computation", choices: ["14", "15", "16", "12"], correct: 0, standard: "TEKS 4.4E, 4.5C", explanation: "5 x 3 = 15, then 15 - 1 = 14" },
            { q: "Which equation matches this: 'A number plus 15 equals 42'?", type: "multiple_choice", choices: ["n - 15 = 42", "n + 15 = 42", "n x 15 = 42", "15 - n = 42"], correct: 1, standard: "TEKS 4.5A", explanation: "A number (n) plus (+) 15 equals (=) 42 → n + 15 = 42" },
            { q: "A student says the rule for 3→9, 5→15, 7→21 is 'add 6.' Is that correct?", type: "error_analysis", choices: ["Yes — 3+6=9, 5+6=11... wait, that's wrong", "No — the rule is multiply by 3", "No — the rule is add 3", "Yes — it works for all"], correct: 1, standard: "TEKS 4.4E", explanation: "3+6=9 works, but 5+6=11 ≠ 15. The real rule: multiply by 3 (3x3=9, 5x3=15, 7x3=21)." }
          ]
        },
        science: {
          title: "Fossils & Earth's History",
          questions: [
            { q: "What can scientists learn from fossils?", type: "multiple_choice", choices: ["What the weather is like today", "What kinds of living things existed long ago", "How to build bridges", "What color dinosaurs were"], correct: 1, standard: "TEKS 4.11A", explanation: "Fossils tell us about ancient life — what organisms looked like, where they lived, and how they changed over time." },
            { q: "Fish fossils found on a mountain top suggest that —", type: "multiple_choice", choices: ["Fish can climb mountains", "The area was once covered by water", "Someone put them there", "Mountains grow very fast"], correct: 1, standard: "TEKS 4.11A", explanation: "Marine fossils on land = that area was once an ocean floor. Earth's surface changes over millions of years." },
            { q: "Fossils are MOST OFTEN found in which type of rock?", type: "multiple_choice", choices: ["Igneous (from volcanoes)", "Metamorphic (changed by heat)", "Sedimentary (layers pressed together)", "Crystal"], correct: 2, standard: "TEKS 4.11A, 4.7A", explanation: "Sedimentary rocks form from layers of sediment that bury and preserve organisms over time." }
          ]
        }
      },
      factSprint: { operation: "mixed", range: [6, 12], count: 20, timeLimit: 100 },
      vocabulary: ["fossil", "sediment"]
    },
    Tuesday: {
      cold_passage: {
        title: "The Bone Wars",
        passageType: "informational",
        passage: "In the late 1800s, two American scientists became locked in one of the strangest rivalries in history. Edward Cope and Othniel Marsh both wanted to discover more dinosaur fossils than the other. Their competition, known as the 'Bone Wars,' lasted over 20 years. At first, Cope and Marsh were friends. But when Marsh publicly embarrassed Cope by pointing out a mistake — Cope had placed a dinosaur's skull on the wrong end of its skeleton — their friendship turned into bitter rivalry. Both men sent teams of fossil hunters across the American West. They spied on each other's dig sites, bribed workers, and even destroyed fossils to prevent the other from claiming them. Despite the ugly tactics, the Bone Wars produced incredible results. Together, Cope and Marsh discovered over 130 new species of dinosaurs, including Triceratops, Stegosaurus, and Diplodocus. Their fierce competition actually advanced the science of paleontology by decades. Sometimes the greatest discoveries come from the most unexpected motivations.",
        paragraphs: ["In the late 1800s, two American scientists became locked in one of the strangest rivalries in history. Edward Cope and Othniel Marsh both wanted to discover more dinosaur fossils than the other. Their competition, known as the 'Bone Wars,' lasted over 20 years.", "At first, Cope and Marsh were friends. But when Marsh publicly embarrassed Cope by pointing out a mistake — Cope had placed a dinosaur's skull on the wrong end of its skeleton — their friendship turned into bitter rivalry.", "Both men sent teams of fossil hunters across the American West. They spied on each other's dig sites, bribed workers, and even destroyed fossils to prevent the other from claiming them.", "Despite the ugly tactics, the Bone Wars produced incredible results. Together, Cope and Marsh discovered over 130 new species of dinosaurs, including Triceratops, Stegosaurus, and Diplodocus.", "Their fierce competition actually advanced the science of paleontology by decades. Sometimes the greatest discoveries come from the most unexpected motivations."],
        vocabWords: ["rivalry", "paleontology", "tactics"],
        passageVisibility: "full",
        questions: [
          { q: "What event turned Cope and Marsh from friends into rivals?", type: "multiple_choice", choices: ["They found the same fossil", "Marsh embarrassed Cope about a skull mistake", "They worked at the same museum", "Cope stole Marsh's notes"], correct: 1, standard: "TEKS 4.6A" },
          { q: "What does the author mean by 'the most unexpected motivations'?", type: "multiple_choice", choices: ["Money was their motivation", "Their rivalry (a negative thing) led to positive scientific discoveries", "They were motivated by friendship", "The dinosaurs motivated them"], correct: 1, standard: "TEKS 4.6B" },
          { q: "What is the text structure of this passage?", type: "multiple_choice", choices: ["Problem and solution", "Cause and effect", "Chronological with compare/contrast", "Description only"], correct: 2, standard: "TEKS 4.9D", explanation: "The passage follows time order (1800s → friendship → rivalry → results) and compares the two scientists." },
          { q: "What is the author's purpose for writing this passage?", type: "multiple_choice", choices: ["To persuade you to become a paleontologist", "To inform you about a fascinating rivalry that advanced science", "To entertain with a made-up story about dinosaurs", "To explain how to find fossils"], correct: 1, standard: "TEKS 4.10A" },
          { q: "Which word BEST describes the Bone Wars?", type: "multiple_choice", choices: ["Boring", "Competitive and productive", "Peaceful", "Simple"], correct: 1, standard: "TEKS 4.6B" }
        ]
      },
      writing: {
        prompt: "Write a persuasive paragraph: Was the Bone Wars rivalry GOOD or BAD for science? Take a position, give 2 reasons with evidence from the passage, and include a concluding sentence.",
        standard: "TEKS 4.11A, 4.12A",
        minSentences: 7,
        skillFocus: "persuasive writing with text evidence"
      }
    },
    Wednesday: {
      module: {
        title: "Variables & Weathering/Erosion",
        math: {
          title: "Variables in Equations",
          questions: [
            { q: "If 3 x n = 45, what is n?", type: "computation", choices: ["13", "14", "15", "16"], correct: 2, standard: "TEKS 4.5A", explanation: "45 / 3 = 15, so n = 15" },
            { q: "Write an equation: 'Six less than a number is 20.'", type: "multiple_choice", choices: ["6 - n = 20", "n - 6 = 20", "n + 6 = 20", "6 x n = 20"], correct: 1, standard: "TEKS 4.5A", explanation: "'Six less than a number' means start with n, subtract 6: n - 6 = 20." },
            { q: "The perimeter of a square is 4s. If the perimeter is 52, what is s?", type: "word_problem", choices: ["12", "13", "14", "15"], correct: 1, standard: "TEKS 4.5A, 4.5D", explanation: "4s = 52, so s = 52 / 4 = 13" },
            { q: "Which value of x makes this true? x + x + x = 36", type: "computation", choices: ["9", "12", "18", "6"], correct: 1, standard: "TEKS 4.5C", explanation: "3x = 36, so x = 12" }
          ]
        },
        science: {
          title: "Weathering, Erosion & Deposition",
          questions: [
            { q: "What is the difference between weathering and erosion?", type: "multiple_choice", choices: ["There is no difference", "Weathering breaks rock down; erosion moves the pieces", "Erosion breaks rock; weathering moves pieces", "Both only happen with water"], correct: 1, standard: "TEKS 4.7B", explanation: "Weathering = breaking down in place. Erosion = transporting the broken pieces to a new location." },
            { q: "A river carries sand downstream and drops it on a beach. The dropping part is called —", type: "multiple_choice", choices: ["Weathering", "Erosion", "Deposition", "Evaporation"], correct: 2, standard: "TEKS 4.7B", explanation: "Deposition is when eroded material is dropped/deposited in a new location." },
            { q: "Tree roots growing into a crack in a rock is an example of —", type: "multiple_choice", choices: ["Chemical weathering", "Biological (physical) weathering", "Erosion", "Deposition"], correct: 1, standard: "TEKS 4.7B", explanation: "Living things (roots, burrowing animals) can physically break apart rock — biological weathering." }
          ]
        }
      },
      investigation: {
        prompt: "Wolfkid needs to protect Pack HQ from erosion. A nearby hill is losing soil after every rainstorm. Design an investigation to test which ground cover prevents the most erosion: bare soil, grass, mulch, or gravel.",
        teks: "TEKS 4.2A, 4.7B",
        subject: "Science",
        materials: ["4 aluminum trays tilted at same angle", "soil", "grass seed (pre-grown)", "mulch", "gravel", "watering can", "measuring cup", "4 collection cups"],
        guideQuestions: ["How will you measure how much soil erodes?", "Why must you pour the same amount of water on each tray?", "What do you predict will happen and why?", "Write a conclusion: which cover worked best?"]
      }
    },
    Thursday: {
      cold_passage: {
        title: "The Last Passenger Pigeon",
        passageType: "informational",
        passage: "On September 1, 1914, a bird named Martha died at the Cincinnati Zoo. She was the last passenger pigeon on Earth. Just 100 years earlier, passenger pigeons had been the most abundant bird in North America. Flocks were so enormous that they could darken the sky for hours as they passed overhead. One observer in 1866 estimated a single flock contained 3.5 billion birds. So how did the most common bird in America go extinct? The answer is a combination of hunting and habitat loss. Passenger pigeons were hunted on a massive scale. Professional hunters killed hundreds of thousands in a single day, shipping them to cities as cheap food. At the same time, forests where the pigeons nested were being cut down for farmland. By the 1890s, the wild population had collapsed. Despite last-minute efforts to breed them in captivity, the species could not be saved. Martha's death was a wake-up call. It led directly to the creation of stronger wildlife protection laws, including the Migratory Bird Treaty Act of 1918.",
        paragraphs: ["On September 1, 1914, a bird named Martha died at the Cincinnati Zoo. She was the last passenger pigeon on Earth.", "Just 100 years earlier, passenger pigeons had been the most abundant bird in North America. Flocks were so enormous that they could darken the sky for hours as they passed overhead. One observer in 1866 estimated a single flock contained 3.5 billion birds.", "So how did the most common bird in America go extinct? The answer is a combination of hunting and habitat loss.", "Passenger pigeons were hunted on a massive scale. Professional hunters killed hundreds of thousands in a single day, shipping them to cities as cheap food. At the same time, forests where the pigeons nested were being cut down for farmland.", "By the 1890s, the wild population had collapsed. Despite last-minute efforts to breed them in captivity, the species could not be saved. Martha's death was a wake-up call. It led directly to the creation of stronger wildlife protection laws, including the Migratory Bird Treaty Act of 1918."],
        vocabWords: ["extinct", "abundant", "habitat"],
        passageVisibility: "full",
        questions: [
          { q: "How many birds were estimated in one flock in 1866?", type: "multiple_choice", choices: ["3.5 million", "3.5 billion", "350,000", "35 billion"], correct: 1, standard: "TEKS 4.6A" },
          { q: "What were the TWO main causes of passenger pigeon extinction?", type: "multiple_choice", choices: ["Disease and cold weather", "Hunting and habitat loss", "Pollution and predators", "Climate change and drought"], correct: 1, standard: "TEKS 4.6B" },
          { q: "What text structure does the author use?", type: "multiple_choice", choices: ["Description", "Cause and effect", "Compare and contrast", "Problem and solution"], correct: 1, standard: "TEKS 4.9D", explanation: "The passage explains what CAUSED extinction (hunting + habitat loss) and the EFFECT (new protection laws)." },
          { q: "Why does the author call Martha's death 'a wake-up call'?", type: "multiple_choice", choices: ["Because Martha woke up early", "Because her death made people realize they needed to protect wildlife", "Because zoos needed better alarms", "Because pigeons are loud"], correct: 1, standard: "TEKS 4.10A", explanation: "'Wake-up call' is a figurative expression meaning an event that makes people realize a problem needs urgent attention." },
          { q: "What is the author's purpose for writing this passage?", type: "multiple_choice", choices: ["To entertain with a story about a pet bird", "To inform about extinction and inspire conservation awareness", "To persuade people to stop eating chicken", "To describe what pigeons look like"], correct: 1, standard: "TEKS 4.10A" }
        ]
      },
      grammarSprint: {
        title: "Grammar Sprint: Complex Sentences & Conjunctions",
        standard: "TEKS 4.11D",
        questions: [
          { q: "Which is a COMPLEX sentence (has a dependent clause)?", choices: ["The dog barked loudly.", "The dog barked because it heard a noise.", "The dog barked and the cat ran.", "Bark!"], correct: 1, explanation: "A complex sentence has an independent clause + a dependent clause. 'Because it heard a noise' cannot stand alone." },
          { q: "Choose the BEST conjunction: 'She studied hard, ___ she passed the test.'", choices: ["but", "so", "or", "yet"], correct: 1, explanation: "'So' shows cause and effect: studying caused passing." },
          { q: "Combine using a subordinating conjunction: 'It rained. We stayed inside.'", choices: ["It rained, we stayed inside.", "Because it rained, we stayed inside.", "It rained we stayed inside.", "It rained, but we stayed inside we went outside."], correct: 1, explanation: "'Because' links the reason (rain) to the result (staying inside)." },
          { q: "Which sentence uses a comma CORRECTLY with a conjunction?", choices: ["We ate lunch, and then played.", "We ate lunch and, then played.", "We ate lunch and then, played.", "We ate, lunch and then played."], correct: 0, explanation: "Use a comma before a coordinating conjunction (and, but, or, so) that joins two complete sentences." },
          { q: "Add a dependent clause to make this complex: 'I finished my homework ___.'", choices: ["and played games", "before dinner was ready", "homework math", "I played games too"], correct: 1, explanation: "'Before dinner was ready' is a dependent clause — it can't stand alone as a sentence." }
        ]
      },
      wolfkidEpisode: {
        title: "Episode 7: Echoes of the Ancient Pack",
        scenario: "Wolfkid discovers ancient fossils in a cave near Pack HQ — fossils of a wolf-like creature that lived millions of years ago. But Hex wants to destroy the cave to build a fortress. Wolfkid must document the fossils and make the case for preservation.",
        writingPrompt: "Write a CER paragraph: Should the cave be preserved or can Hex build there? Use evidence about what fossils teach us and why they matter. Consider: once destroyed, fossils are gone forever.",
        data: { fossilsFound: "3 complete skeletons, 12 teeth, fossilized footprints", caveAge: "estimated 65 million years old (late Cretaceous)", hexPlan: "demolish cave for supply depot, says 'old bones are useless'", scientificValue: "only known fossils of this species in the region" }
      }
    },
    Friday: {
      module: {
        title: "Friday Review — Equations & Earth Science",
        math: {
          title: "Mixed Review: Variables, Patterns & Equations",
          questions: [
            { q: "If the rule is 'multiply by 5, subtract 3,' what is the output when the input is 7?", type: "computation", choices: ["32", "35", "38", "42"], correct: 0, standard: "TEKS 4.4E", explanation: "7 x 5 = 35, then 35 - 3 = 32" },
            { q: "Solve: 156 / n = 12", type: "computation", choices: ["12", "13", "14", "15"], correct: 1, standard: "TEKS 4.5A", explanation: "n = 156 / 12 = 13" },
            { q: "What is 64 x 35?", type: "computation", choices: ["2,140", "2,240", "2,340", "2,040"], correct: 1, standard: "TEKS 4.4B", explanation: "64 x 35 = (64 x 30) + (64 x 5) = 1,920 + 320 = 2,240" },
            { q: "A teacher says 'If I give each of 28 students 3 pencils, I need 84 pencils total. Is she right?", type: "error_analysis", choices: ["Yes — 28 x 3 = 84", "No — 28 x 3 = 82", "No — 28 x 3 = 86", "No — she needs 56 pencils"], correct: 0, standard: "TEKS 4.4D", explanation: "28 x 3 = 84. The teacher is correct!" }
          ]
        },
        science: {
          title: "Earth Science Review",
          questions: [
            { q: "Put these in order from FASTEST to SLOWEST Earth process: earthquake, erosion by a river, mountain building", type: "multiple_choice", choices: ["Earthquake, river erosion, mountain building", "Mountain building, river erosion, earthquake", "River erosion, earthquake, mountain building", "All happen at the same speed"], correct: 0, standard: "TEKS 4.7B, 4.11A", explanation: "Earthquakes = seconds. River erosion = years to centuries. Mountain building = millions of years." },
            { q: "A fossil of a tropical plant found in Alaska suggests that —", type: "multiple_choice", choices: ["Someone planted it recently", "Alaska's climate was once much warmer", "Tropical plants can survive cold", "Fossils can travel"], correct: 1, standard: "TEKS 4.11A" }
          ]
        }
      },
      factSprint: { operation: "mixed", range: [4, 15], count: 30, timeLimit: 150 },
      writing: {
        prompt: "STAAR Practice — ECR: Read the prompt and write a 4-paragraph response. Prompt: 'Some people think zoos help animals by protecting endangered species. Others think zoos are unfair because animals belong in the wild. Write an essay explaining BOTH sides, then tell which side YOU agree with and WHY.'",
        standard: "TEKS 4.12A",
        minSentences: 14,
        skillFocus: "ECR — balanced argument with position",
        rubric: "Intro (both sides), Body 1 (pro-zoo evidence), Body 2 (anti-zoo evidence), Conclusion (your position + reasoning)"
      }
    }
  }
};

var BUGGSY_WEEK_8 = {
  child: "buggsy",
  week: 8,
  startDate: "2026-06-01",
  vocabulary: [
    { word: "protractor", definition: "A tool used to measure angles in degrees", sentence: "Use a protractor to measure the angle at the corner of this triangle." },
    { word: "acute", definition: "An angle that measures less than 90 degrees", sentence: "The hands of a clock at 2:00 form an acute angle." },
    { word: "obtuse", definition: "An angle that measures more than 90 degrees but less than 180", sentence: "When you open a book wide, the spine makes an obtuse angle." },
    { word: "classify", definition: "To put things into groups based on shared characteristics", sentence: "We can classify triangles by the size of their angles." },
    { word: "evidence", definition: "Facts or information that prove something is true", sentence: "The detective used fingerprint evidence to solve the case." }
  ],
  scaffoldConfig: {
    timerMode: "countdown",
    timerSeconds: 150,
    missionStructure: "sequential",
    feedbackLevel: "on_tap",
    hintLimit: 2,
    retryOnWrong: true,
    thursdayOverride: { timerMode: "hidden", feedbackLevel: "full" },
    adhd: {
      chunkSize: 3,
      brainBreakAfter: 4,
      brainBreakType: "movement",
      brainBreakPrompt: "Stretch time! Reach for the ceiling, then touch your toes. Do it 3 times. Now sit down ready to crush it!",
      visualCueMode: "progress_bar",
      transitionAudio: true,
      choiceOnFriday: true,
      maxConsecutiveText: 2,
      interleaveVisual: true,
      feedbackDelay: 0,
      celebrateStreak: 3,
      readAloudOption: false
    }
  },
  days: {
    Monday: {
      module: {
        title: "Measuring Angles & Circuits",
        math: {
          title: "Angles: Measuring & Classifying",
          questions: [
            { q: "An angle that measures exactly 90° is called a —", type: "multiple_choice", choices: ["Acute angle", "Right angle", "Obtuse angle", "Straight angle"], correct: 1, standard: "TEKS 4.7A", explanation: "A right angle is exactly 90°, like the corner of a square." },
            { q: "Classify this angle: 135°", type: "multiple_choice", choices: ["Acute", "Right", "Obtuse", "Straight"], correct: 2, standard: "TEKS 4.7A", explanation: "135° is between 90° and 180°, so it is obtuse." },
            { q: "A triangle has angles of 60°, 60°, and 60°. What type of triangle is it?", type: "multiple_choice", choices: ["Right triangle", "Obtuse triangle", "Equilateral (all angles equal)", "Scalene triangle"], correct: 2, standard: "TEKS 4.6D", explanation: "All three angles are equal (60°), so it is equilateral. It is also acute (all angles < 90°)." },
            { q: "Two angles together make a straight line (180°). If one angle is 65°, what is the other?", type: "computation", choices: ["105°", "115°", "125°", "95°"], correct: 1, standard: "TEKS 4.7B", explanation: "180° - 65° = 115°. These are supplementary angles." },
            { q: "A student measures an angle as 45° and says it is obtuse. What is wrong?", type: "error_analysis", choices: ["Nothing — 45° IS obtuse", "45° is acute (less than 90°), not obtuse", "45° is a right angle", "The protractor must be broken"], correct: 1, standard: "TEKS 4.7A", explanation: "Acute = less than 90°. Obtuse = more than 90°. 45° < 90°, so it is acute." }
          ]
        },
        science: {
          title: "Electrical Circuits & Energy Transfer",
          questions: [
            { q: "For a light bulb to work in a circuit, the circuit must be —", type: "multiple_choice", choices: ["Open (with a gap)", "Closed (complete loop)", "Made of wood", "Wet"], correct: 1, standard: "TEKS 4.8B", explanation: "Electricity flows only through a complete (closed) circuit. A gap (open circuit) stops the flow." },
            { q: "What are the 3 parts needed for a simple circuit?", type: "multiple_choice", choices: ["Battery, wire, light bulb", "Battery, switch, magnet", "Wire, light bulb, water", "Battery, rubber band, light bulb"], correct: 0, standard: "TEKS 4.8B", explanation: "A simple circuit needs: energy source (battery), conductor (wire), and load (light bulb)." },
            { q: "Which material would NOT allow electricity to flow?", type: "multiple_choice", choices: ["Copper wire", "Aluminum foil", "Rubber eraser", "Metal paper clip"], correct: 2, standard: "TEKS 4.8B", explanation: "Rubber is an insulator — it does not conduct electricity. Metals are conductors." }
          ]
        }
      },
      factSprint: { operation: "mixed", range: [7, 15], count: 25, timeLimit: 100 },
      vocabulary: ["protractor", "acute"]
    },
    Tuesday: {
      cold_passage: {
        title: "The Glitch",
        passageType: "fiction",
        passage: "Zara's robot, Sprocket, was supposed to sort recycling. That was his ONE job. Plastic in the blue bin. Metal in the gray. Paper in the green. Simple. But this morning, Sprocket was putting bananas in the gray bin, shoes in the green bin, and for some reason, he kept trying to put the cat in the blue bin. Mr. Whiskers was NOT happy about it. 'Sprocket, STOP!' Zara grabbed the cat and set him on the counter. She opened Sprocket's control panel and scrolled through his code. Everything looked normal: IF material = plastic THEN blue bin. IF material = metal THEN gray bin. Then she saw it — line 47. Someone had changed the sorting rules. Instead of sorting by MATERIAL, Sprocket was now sorting by COLOR. Bananas = yellow like metal → gray bin. Shoes = brown like cardboard → green bin. And Mr. Whiskers... was wearing a blue collar. 'Very funny, Marcus,' Zara muttered, knowing her little brother had been 'helping' with homework again. She fixed line 47, rebooted Sprocket, and made a mental note: password-protect the control panel.",
        paragraphs: ["Zara's robot, Sprocket, was supposed to sort recycling. That was his ONE job. Plastic in the blue bin. Metal in the gray. Paper in the green. Simple.", "But this morning, Sprocket was putting bananas in the gray bin, shoes in the green bin, and for some reason, he kept trying to put the cat in the blue bin. Mr. Whiskers was NOT happy about it.", "'Sprocket, STOP!' Zara grabbed the cat and set him on the counter. She opened Sprocket's control panel and scrolled through his code. Everything looked normal: IF material = plastic THEN blue bin. IF material = metal THEN gray bin.", "Then she saw it — line 47. Someone had changed the sorting rules. Instead of sorting by MATERIAL, Sprocket was now sorting by COLOR. Bananas = yellow like metal → gray bin. Shoes = brown like cardboard → green bin. And Mr. Whiskers... was wearing a blue collar.", "'Very funny, Marcus,' Zara muttered, knowing her little brother had been 'helping' with homework again. She fixed line 47, rebooted Sprocket, and made a mental note: password-protect the control panel."],
        vocabWords: ["code", "debug", "rebooted"],
        passageVisibility: "full",
        questions: [
          { q: "Why was Sprocket putting the cat in the blue bin?", type: "multiple_choice", choices: ["Sprocket was broken", "The cat was blue", "The cat's COLLAR was blue and Sprocket was sorting by color", "Zara told him to"], correct: 2, standard: "TEKS 4.6A" },
          { q: "What is the THEME of this story?", type: "multiple_choice", choices: ["Robots are dangerous", "Small changes can cause big problems — and debugging is important", "Cats don't like robots", "Little brothers are annoying"], correct: 1, standard: "TEKS 4.6B", explanation: "One small code change (line 47) caused chaos. The theme is about cause/effect and problem-solving." },
          { q: "What text structure does this story follow?", type: "multiple_choice", choices: ["Compare and contrast", "Description", "Problem and solution", "Chronological only"], correct: 2, standard: "TEKS 4.9D", explanation: "Problem: Sprocket sorts wrong. Investigation: check code. Solution: fix line 47 + add password." },
          { q: "What is the author's TONE in this story?", type: "multiple_choice", choices: ["Serious and sad", "Humorous and lighthearted", "Angry and frustrated", "Mysterious and dark"], correct: 1, standard: "TEKS 4.10A", explanation: "Details like the cat being sorted and 'Very funny, Marcus' show humor. The author wants to entertain." },
          { q: "The phrase 'Mr. Whiskers was NOT happy about it' uses what technique?", type: "multiple_choice", choices: ["Simile", "Understatement (saying less than what's meant)", "Onomatopoeia", "Rhyme"], correct: 1, standard: "TEKS 4.4A", explanation: "Saying the cat was 'not happy' is an understatement — the cat was probably terrified! This adds humor." }
        ]
      },
      writing: {
        prompt: "Write a short story where a character has to FIX something that went wrong because of a small mistake. Include: a clear problem, a moment of discovery (finding the cause), and a solution. Use dialogue between at least 2 characters.",
        standard: "TEKS 4.11A, 4.11B",
        minSentences: 12,
        skillFocus: "narrative writing — problem/solution structure"
      }
    },
    Wednesday: {
      module: {
        title: "Classifying Triangles & Sound/Light",
        math: {
          title: "Classifying 2D Figures",
          questions: [
            { q: "A triangle with one angle greater than 90° is classified as —", type: "multiple_choice", choices: ["Acute", "Right", "Obtuse", "Equilateral"], correct: 2, standard: "TEKS 4.6D", explanation: "If any angle is greater than 90°, the triangle is obtuse." },
            { q: "How are a square and a rectangle ALIKE?", type: "multiple_choice", choices: ["Both have exactly 4 right angles", "Both have all sides equal", "Both have exactly 2 lines of symmetry", "They are not alike at all"], correct: 0, standard: "TEKS 4.6D", explanation: "Both squares and rectangles have 4 sides and 4 right angles (90°). Squares also have equal sides." },
            { q: "A right angle plus a 53° angle equals what?", type: "computation", choices: ["133°", "137°", "143°", "153°"], correct: 2, standard: "TEKS 4.7B", explanation: "Right angle = 90°. 90° + 53° = 143°." },
            { q: "Which shape has exactly 1 pair of parallel sides?", type: "multiple_choice", choices: ["Rectangle", "Trapezoid", "Triangle", "Pentagon"], correct: 1, standard: "TEKS 4.6D", explanation: "A trapezoid has exactly one pair of parallel sides. Rectangles have two pairs." }
          ]
        },
        science: {
          title: "Sound & Light Energy",
          questions: [
            { q: "Sound travels through vibrations. Which material does sound travel FASTEST through?", type: "multiple_choice", choices: ["Air", "Water", "Solid metal", "A vacuum (empty space)"], correct: 2, standard: "TEKS 4.8A", explanation: "Sound travels fastest through solids (molecules are packed tightly). It cannot travel through a vacuum." },
            { q: "What happens when light hits a mirror?", type: "multiple_choice", choices: ["It is absorbed", "It is reflected", "It passes through", "It disappears"], correct: 1, standard: "TEKS 4.8A", explanation: "Mirrors are smooth and shiny — they reflect light. That is why you can see your reflection." },
            { q: "A guitar string that vibrates FASTER produces a ___ sound.", type: "multiple_choice", choices: ["Lower pitch", "Higher pitch", "Louder volume", "Softer volume"], correct: 1, standard: "TEKS 4.8A", explanation: "Faster vibrations = higher frequency = higher pitch. Thinner/tighter strings vibrate faster." }
          ]
        }
      },
      investigation: {
        prompt: "Wolfkid needs to build a simple alarm system for Pack HQ using a circuit. Design an investigation to test which materials are conductors (let electricity flow) and which are insulators (block it).",
        teks: "TEKS 4.2A, 4.8B",
        subject: "Science",
        materials: ["D battery", "light bulb in holder", "3 wires with alligator clips", "test materials: penny, eraser, paper clip, plastic spoon, foil, popsicle stick, key"],
        guideQuestions: ["How will you know if a material is a conductor?", "Why do you need to test each material one at a time?", "Make a prediction: which 3 items will be conductors?", "Organize results in a table: Material | Conductor or Insulator"]
      }
    },
    Thursday: {
      cold_passage: {
        title: "Building a Better Battery",
        passageType: "informational",
        passage: "Every day, billions of people around the world depend on batteries. They power our phones, laptops, cars, and even the International Space Station. But most batteries we use today have a problem: they rely on lithium, a metal that must be mined from the earth. Mining lithium damages the environment and creates pollution. Scientists are working on new types of batteries that could change everything. One promising idea is the sodium-ion battery. Sodium is found in regular table salt, which is cheap and available everywhere. Another approach uses solid-state batteries, which replace the liquid inside traditional batteries with a solid material. These are safer because they do not catch fire like some lithium batteries have. Perhaps the most creative solution comes from a teenager in California. At just 16, Eshan Trivedi developed a battery concept using iron and air — two of the most common materials on Earth. While these new batteries are not ready for your phone yet, scientists believe they could be widely available within 10 years. The future of energy storage may be closer than we think.",
        paragraphs: ["Every day, billions of people around the world depend on batteries. They power our phones, laptops, cars, and even the International Space Station. But most batteries we use today have a problem: they rely on lithium, a metal that must be mined from the earth.", "Mining lithium damages the environment and creates pollution. Scientists are working on new types of batteries that could change everything.", "One promising idea is the sodium-ion battery. Sodium is found in regular table salt, which is cheap and available everywhere.", "Another approach uses solid-state batteries, which replace the liquid inside traditional batteries with a solid material. These are safer because they do not catch fire like some lithium batteries have.", "Perhaps the most creative solution comes from a teenager in California. At just 16, Eshan Trivedi developed a battery concept using iron and air — two of the most common materials on Earth.", "While these new batteries are not ready for your phone yet, scientists believe they could be widely available within 10 years. The future of energy storage may be closer than we think."],
        vocabWords: ["innovative", "sodium", "solid-state"],
        passageVisibility: "full",
        questions: [
          { q: "What is the MAIN problem with current lithium batteries?", type: "multiple_choice", choices: ["They are too big", "Mining lithium damages the environment", "They do not hold a charge", "They are too expensive for anyone"], correct: 1, standard: "TEKS 4.6A" },
          { q: "Why does the author include the story of the 16-year-old inventor?", type: "multiple_choice", choices: ["To show that age does not limit innovation", "To advertise his product", "To explain how lithium works", "To describe California"], correct: 0, standard: "TEKS 4.10A", explanation: "Including a teenage inventor inspires readers and shows that solutions can come from anyone." },
          { q: "What text structure does the author use MOST?", type: "multiple_choice", choices: ["Chronological order", "Problem and solution", "Compare and contrast of solutions", "Narrative storytelling"], correct: 1, standard: "TEKS 4.9D", explanation: "Problem: lithium batteries harm environment. Solutions: sodium-ion, solid-state, iron-air batteries." },
          { q: "What does 'The future of energy storage may be closer than we think' mean?", type: "multiple_choice", choices: ["Batteries are getting smaller", "New battery technology could arrive soon", "We should stop using batteries", "The future is far away"], correct: 1, standard: "TEKS 4.6B" },
          { q: "Is this passage primarily written to inform, persuade, or entertain?", type: "multiple_choice", choices: ["Entertain — it tells a fun story", "Persuade — it argues for one battery type", "Inform — it presents facts about battery innovation", "Instruct — it teaches you how to build a battery"], correct: 2, standard: "TEKS 4.10A" }
        ]
      },
      grammarSprint: {
        title: "Grammar Sprint: Comprehensive Review",
        standard: "TEKS 4.11D",
        questions: [
          { q: "Which sentence is CORRECT?", choices: ["Me and him went to the game.", "Him and I went to the game.", "He and I went to the game.", "Me and he went to the game."], correct: 2, explanation: "Use subject pronouns (He, I) when they are the subject of the sentence." },
          { q: "Find ALL the errors: 'their are too many dog's in the park said maria.'", choices: ["1 error", "2 errors", "3 errors", "4 errors"], correct: 3, explanation: "4 errors: (1) their→there, (2) dog's→dogs (no apostrophe for plural), (3) needs quotes around dialogue, (4) maria→Maria (capitalize proper noun)." },
          { q: "Which sentence uses a SEMICOLON correctly?", choices: ["I like pizza; and burgers.", "I like pizza; burgers are good too.", "I like; pizza and burgers.", "I; like pizza and burgers."], correct: 1, explanation: "A semicolon joins two related complete sentences without a conjunction." },
          { q: "Make this sentence ACTIVE voice (not passive): 'The ball was kicked by Sarah.'", choices: ["Sarah kicked the ball.", "The ball kicked Sarah.", "Kicked the ball Sarah.", "Sarah was kicked by the ball."], correct: 0, explanation: "Active: subject (Sarah) does the action (kicked). Passive: subject (ball) receives the action." },
          { q: "EDIT this paragraph (find 3 errors): 'Last Summer we went to the beach. The water was to cold but we swimmed anyway. It was the funnest day ever.'", choices: ["Summer→summer, to→too, swimmed→swam", "Summer→summer, to→too, funnest→most fun", "to→too, swimmed→swam, funnest→most fun", "All three of the above combined (5 total errors)"], correct: 3, explanation: "5 errors: summer (not capitalized mid-sentence unless proper noun — but 'Last Summer' could go either way), to→too, swimmed→swam, funnest→most fun. The question asks for 3 but D captures the full picture." }
        ]
      },
      wolfkidEpisode: {
        title: "Episode 8: The Power Grid",
        scenario: "Hex has cut power to Pack HQ by breaking the main circuit. Wolfkid must understand electrical circuits to restore power before the security system goes down completely. The pack has limited materials: batteries, wires, and three different switches.",
        writingPrompt: "Write an ECR (4 paragraphs): How should Wolfkid restore power to Pack HQ? Paragraph 1: Explain what a circuit needs to work. Paragraph 2: Describe Wolfkid's plan using the available materials. Paragraph 3: Predict what will happen if the circuit is built correctly. Paragraph 4: What could go wrong and how would Wolfkid troubleshoot?",
        data: { damagedSection: "wire cut between battery bank and security panel", availableMaterials: "4 D batteries, copper wire (20 feet), 3 toggle switches, electrical tape, wire strippers", constraint: "must be completed before backup battery dies in 30 minutes", securityNeeds: "cameras need 6V, door locks need 3V, alarm needs 9V" }
      }
    },
    Friday: {
      module: {
        title: "8-Week Comprehensive Review",
        math: {
          title: "Cumulative Review — All Strands",
          questions: [
            { q: "What is the value of the 8 in 28,345,671?", type: "multiple_choice", choices: ["8,000,000", "800,000", "80,000", "8,000"], correct: 0, standard: "TEKS 4.2A" },
            { q: "56 x 43 = ?", type: "computation", choices: ["2,308", "2,408", "2,508", "2,348"], correct: 1, standard: "TEKS 4.4B", explanation: "56 x 43 = (56 x 40) + (56 x 3) = 2,240 + 168 = 2,408" },
            { q: "An angle of 72° is classified as —", type: "multiple_choice", choices: ["Right", "Acute", "Obtuse", "Straight"], correct: 1, standard: "TEKS 4.7A" },
            { q: "3/5 + 1/5 = ?", type: "computation", choices: ["4/10", "4/5", "2/5", "3/5"], correct: 1, standard: "TEKS 4.3E" },
            { q: "If input = 9 and rule = (n x 4) - 3, what is the output?", type: "computation", choices: ["33", "36", "39", "30"], correct: 0, standard: "TEKS 4.4E" },
            { q: "Which is greater: 3,456,789 or 3,465,789?", type: "multiple_choice", choices: ["3,456,789", "3,465,789", "They are equal", "Cannot tell"], correct: 1, standard: "TEKS 4.2B" }
          ]
        },
        science: {
          title: "Cumulative Science Review",
          questions: [
            { q: "Rusting is a ___ change. Melting is a ___ change.", type: "multiple_choice", choices: ["physical, chemical", "chemical, physical", "chemical, chemical", "physical, physical"], correct: 1, standard: "TEKS 4.6B" },
            { q: "In a closed circuit, what happens if you remove the battery?", type: "multiple_choice", choices: ["The light gets brighter", "Nothing changes", "The circuit breaks and the light goes out", "The light changes color"], correct: 2, standard: "TEKS 4.8B" }
          ]
        }
      },
      factSprint: { operation: "mixed", range: [2, 15], count: 30, timeLimit: 150 },
      writing: {
        prompt: "STAAR Practice — ECR Final: Write a 4-paragraph essay. Prompt: 'Think about a time you faced a challenge — something difficult that you had to work hard to overcome. Describe the challenge, what you did, and what you learned from the experience. Include specific details.'",
        standard: "TEKS 4.12A",
        minSentences: 16,
        skillFocus: "ECR — personal narrative with reflection",
        rubric: "Intro (hook + thesis), Body 1 (describe challenge with details), Body 2 (what you did + how it felt), Conclusion (lesson learned + broader meaning)"
      }
    }
  }
};

// ════════════════════════════════════════════════════════════════════
// CURRICULUM BLUEPRINT — Weeks 9-36 TEKS Rotation
// Each week covers 1 math strand + 1 science strand + RLA skill focus.
// This ensures every TEKS is hit at least 2x over the school year.
//
// W9:  Math 4.2 (place value review) + Science 4.6 (matter review) + RLA: inference
// W10: Math 4.3 (fractions deep) + Science 4.7 (earth review) + RLA: author's purpose
// W11: Math 4.4 (multiplication/division) + Science 4.8 (energy/circuits) + RLA: text structure
// W12: Math 4.5 (algebraic reasoning) + Science 4.9 (ecosystems) + RLA: vocabulary
// W13: Math 4.6-4.7 (geometry/angles) + Science 4.10 (adaptations/life) + RLA: poetry
// W14: Math 4.8 (measurement) + Science 4.11 (fossils) + RLA: informational
// W15: Math 4.9 (data analysis) + Science 4.2 (inquiry) + RLA: grammar heavy
// W16: Math 4.10 (financial literacy) + Science review + RLA: ECR practice
// W17-20: Cycle repeats with harder questions (5th grade preview)
// W21-24: STAAR simulation weeks (timed, mixed, full format)
// W25-28: 5th grade science preview (tested on 5th STAAR)
// W29-32: Gap fill + remediation based on QuestionLog mastery data
// W33-36: Final review + practice STAAR tests
//
// ADHD accommodations in every week:
//   - chunkSize: 3 (never more than 3 consecutive questions without variety)
//   - brainBreakAfter: 4 (movement break every 4 questions)
//   - maxConsecutiveText: 2 (no more than 2 text-heavy Qs in a row)
//   - interleaveVisual: true (mix visual/diagram Qs between text Qs)
//   - celebrateStreak: 3 (celebration animation on 3-correct streaks)
//
// Content types per week (minimum):
//   - 1 error analysis question per math module
//   - 1 author's purpose OR text structure question per reading passage
//   - 1 grammar sprint (5 Qs) every Thursday
//   - 1 ECR practice every other Friday
//   - 1 fiction OR poetry passage every other Tuesday/Thursday
//   - Vocabulary: 5 words/week from SpellingCatalog.js
// ════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════
// BUGGSY WEEKS 9-16 — Spiral Review + New TEKS
// Following rotation plan from comments above.
// ADHD: 3-2-1 rule, movement break every 4 Qs, warm feedback.
// Every week spirals at least 2 standards from weeks 1-8.
// Weeks 12 and 16 are assessment checkpoints.
// ════════════════════════════════════════════════════════════════════

var BUGGSY_WEEK_9 = {
  child: "buggsy",
  week: 9,
  startDate: "2026-06-08",
  vocabulary: [
    { word: "symmetry", definition: "When both sides of something look exactly the same", sentence: "A butterfly's wings have beautiful symmetry." },
    { word: "dissolve", definition: "To mix into a liquid so it seems to disappear", sentence: "Watch the sugar dissolve in the warm water." },
    { word: "contrast", definition: "The differences between two or more things", sentence: "The contrast between the desert and the rainforest is striking." },
    { word: "estimate", definition: "To make a reasonable guess about a number or amount", sentence: "I estimate there are about 200 beans in the jar." },
    { word: "classify", definition: "To sort things into groups based on shared traits", sentence: "Scientists classify animals by what they eat." }
  ],
  scaffoldConfig: {
    timerMode: "count_up",
    missionStructure: "sequential",
    feedbackLevel: "on_tap",
    hintLimit: 2,
    retryOnWrong: true,
    thursdayOverride: { timerMode: "hidden", feedbackLevel: "full" },
    adhd: {
      chunkSize: 3,
      brainBreakAfter: 4,
      brainBreakType: "movement",
      brainBreakPrompt: "Stand up! Do 8 arm circles forward, then 8 backward. Shake it out!",
      visualCueMode: "progress_dots",
      transitionAudio: true,
      choiceOnFriday: true,
      maxConsecutiveText: 2,
      interleaveVisual: true,
      feedbackDelay: 0,
      celebrateStreak: 3,
      readAloudOption: false
    }
  },
  days: {
    Monday: {
      module: {
        title: "Place Value & Mixtures",
        math: {
          title: "Place Value — Hundred Thousands & Beyond",
          questions: [
            { q: "What is the value of the 7 in 573,291?", type: "computation", choices: ["7,000", "70,000", "700", "700,000"], correct: 1, standard: "TEKS 4.2A", explanation: "The 7 is in the ten thousands place, so its value is 70,000." },
            { q: "Which number is 10,000 more than 482,567?", type: "computation", choices: ["483,567", "492,567", "582,567", "482,667"], correct: 1, standard: "TEKS 4.2A", explanation: "482,567 + 10,000 = 492,567" },
            { q: "Round 34,782 to the nearest thousand.", type: "computation", choices: ["34,000", "35,000", "34,800", "30,000"], correct: 1, standard: "TEKS 4.2B", explanation: "The hundreds digit is 7 (5 or more), so round up to 35,000." },
            { q: "Which set is in order from greatest to least?", type: "multiple_choice", choices: ["5,432 > 5,423 > 5,324 > 5,234", "5,234 > 5,324 > 5,423 > 5,432", "5,423 > 5,432 > 5,324 > 5,234", "5,432 > 5,324 > 5,423 > 5,234"], correct: 0, standard: "TEKS 4.2C", explanation: "Compare digit by digit from left: 5,432 > 5,423 > 5,324 > 5,234." },
            { q: "A student says 45,678 rounded to the nearest hundred is 45,600. Is this correct?", type: "error_analysis", choices: ["Yes, correct", "No — it should be 45,700", "No — it should be 46,000", "No — it should be 45,680"], correct: 1, standard: "TEKS 4.2B", explanation: "The tens digit is 7 (5 or more), so round up: 45,700." }
          ]
        },
        science: {
          title: "Mixtures & Solutions",
          questions: [
            { q: "Which of these is a mixture?", type: "multiple_choice", choices: ["Pure water", "Trail mix", "A gold ring", "A copper penny"], correct: 1, standard: "TEKS 4.5A", explanation: "Trail mix is a mixture — you can see and separate the different parts." },
            { q: "What happens when you stir salt into water?", type: "multiple_choice", choices: ["Nothing changes", "The salt dissolves and forms a solution", "The salt floats on top", "The water turns into salt"], correct: 1, standard: "TEKS 4.5A", explanation: "Salt dissolves in water, making a solution (a type of mixture)." },
            { q: "How could you separate sand from water?", type: "multiple_choice", choices: ["Magnets", "Filtering through a screen", "Freezing it", "Shaking it harder"], correct: 1, standard: "TEKS 4.5A", explanation: "Sand particles are too big to pass through a filter, so the water goes through and sand stays." }
          ]
        }
      },
      factSprint: { operation: "multiply", range: [6, 12], count: 20, timeLimit: 100 },
      vocabulary: ["symmetry", "dissolve"]
    },
    Tuesday: {
      cold_passage: {
        title: "Tornado Alley",
        passage: "The central part of the United States is sometimes called Tornado Alley because it experiences more tornadoes than anywhere else on Earth. States like Texas, Oklahoma, and Kansas are in the heart of this region. Tornadoes form when warm, moist air from the Gulf of Mexico collides with cool, dry air from Canada. This clash creates powerful thunderstorms that can spawn rotating columns of air. The Enhanced Fujita Scale rates tornadoes from EF0 (weakest) to EF5 (most destructive). An EF5 tornado can have winds over 200 miles per hour, strong enough to level entire neighborhoods. Scientists called storm chasers drive toward tornadoes to study them up close. Their research has helped improve early warning systems, giving people more time to seek shelter.",
        paragraphs: ["The central part of the United States is sometimes called Tornado Alley because it experiences more tornadoes than anywhere else on Earth. States like Texas, Oklahoma, and Kansas are in the heart of this region.", "Tornadoes form when warm, moist air from the Gulf of Mexico collides with cool, dry air from Canada. This clash creates powerful thunderstorms that can spawn rotating columns of air.", "The Enhanced Fujita Scale rates tornadoes from EF0 (weakest) to EF5 (most destructive). An EF5 tornado can have winds over 200 miles per hour, strong enough to level entire neighborhoods.", "Scientists called storm chasers drive toward tornadoes to study them up close. Their research has helped improve early warning systems, giving people more time to seek shelter."],
        vocabWords: ["collides", "spawn", "destructive"],
        passageVisibility: "full",
        questions: [
          { q: "Why is the central US called Tornado Alley?", type: "multiple_choice", choices: ["It has the most earthquakes", "It has more tornadoes than anywhere else", "It has the tallest buildings", "It never rains there"], correct: 1, standard: "TEKS 4.6A" },
          { q: "What causes tornadoes to form, according to the passage?", type: "multiple_choice", choices: ["Earthquakes underground", "Warm moist air meeting cool dry air", "The moon's gravity", "Ocean waves"], correct: 1, standard: "TEKS 4.6B" },
          { q: "What does 'spawn' mean in this passage?", type: "multiple_choice", choices: ["To destroy", "To create or produce", "To measure", "To chase"], correct: 1, standard: "TEKS 4.2B" },
          { q: "Which detail supports the idea that EF5 tornadoes are extremely dangerous?", type: "multiple_choice", choices: ["They form from thunderstorms", "Storm chasers study them", "Winds over 200 mph can level neighborhoods", "Texas is in Tornado Alley"], correct: 2, standard: "TEKS 4.6C" },
          { q: "What is the author's purpose?", type: "multiple_choice", choices: ["To scare readers about tornadoes", "To inform readers about how tornadoes form and are studied", "To persuade readers to become storm chasers", "To entertain with a tornado adventure story"], correct: 1, standard: "TEKS 4.10A" },
          { q: "How does the author organize the passage?", type: "multiple_choice", choices: ["Problem and solution", "Compare and contrast", "Chronological order", "Description with examples and cause/effect"], correct: 3, standard: "TEKS 4.9D", explanation: "The passage describes Tornado Alley, explains what causes tornadoes (cause/effect), and gives examples of the scale and storm chasers." }
        ]
      },
      writing: {
        prompt: "Compare and contrast two types of severe weather (tornadoes vs. hurricanes, or thunderstorms vs. blizzards). Use a Venn diagram to plan, then write at least 2 paragraphs.",
        standard: "TEKS 4.11B",
        minSentences: 8,
        skillFocus: "compare/contrast"
      }
    },
    Wednesday: {
      module: {
        title: "Rounding & Separating Mixtures",
        math: {
          title: "Rounding & Estimation",
          questions: [
            { q: "Round 7,849 to the nearest hundred.", type: "computation", choices: ["7,800", "7,900", "7,850", "8,000"], correct: 1, standard: "TEKS 4.2B", explanation: "The tens digit is 4 (less than 5), but wait — 49 rounds 7,849 to 7,800. Actually: tens digit is 4, so round down to 7,800. Let me recalculate: 7,849 — hundreds place is 8, tens is 4, so round down: 7,800." },
            { q: "Estimate 489 + 312 by rounding each to the nearest hundred.", type: "computation", choices: ["700", "800", "900", "1,000"], correct: 1, standard: "TEKS 4.4G", explanation: "489 rounds to 500, 312 rounds to 300. 500 + 300 = 800." },
            { q: "Estimate 6 x 78 by rounding 78 to the nearest ten.", type: "computation", choices: ["420", "480", "540", "600"], correct: 1, standard: "TEKS 4.4G", explanation: "78 rounds to 80. 6 x 80 = 480." },
            { q: "Is 4,000 a reasonable estimate for 812 x 5?", type: "error_analysis", choices: ["Yes — 800 x 5 = 4,000", "No — it should be about 4,500", "No — it should be about 3,500", "No — it should be about 5,000"], correct: 0, standard: "TEKS 4.4G", explanation: "812 rounds to 800. 800 x 5 = 4,000. This is a reasonable estimate." }
          ]
        },
        science: {
          title: "Separating Mixtures",
          questions: [
            { q: "Which method would best separate iron filings from sand?", type: "multiple_choice", choices: ["Filtering", "Evaporation", "Using a magnet", "Freezing"], correct: 2, standard: "TEKS 4.5B", explanation: "Iron is magnetic, so a magnet can pull iron filings out of sand." },
            { q: "To get salt back from salt water, you should —", type: "multiple_choice", choices: ["Filter the water", "Evaporate the water", "Freeze the water", "Add more salt"], correct: 1, standard: "TEKS 4.5B", explanation: "Evaporation removes the water, leaving the salt behind." },
            { q: "A student mixes sand, paper clips, and rice. Which property can be used to separate the paper clips?", type: "multiple_choice", choices: ["Color", "Size", "Magnetism", "Weight"], correct: 2, standard: "TEKS 4.5B", explanation: "Paper clips are metal and can be separated with a magnet." }
          ]
        }
      },
      investigation: {
        prompt: "Wolfkid's pack needs to separate a mixture of salt, sand, and iron filings. Design a step-by-step procedure using a magnet, filter, and evaporation dish. Explain which physical property each step uses.",
        teks: "TEKS 4.5A, 4.5B",
        subject: "Science",
        materials: ["magnet", "filter paper", "funnel", "beaker", "evaporation dish", "heat source"],
        guideQuestions: ["Which material should you separate first? Why?", "What physical property does each tool use?", "How will you know each separation worked?"]
      }
    },
    Thursday: {
      cold_passage: {
        title: "The Secret Life of Coral Reefs",
        passage: "Coral reefs are sometimes called the rainforests of the sea because they are home to an incredible variety of life. Although coral looks like a plant or a rock, it is actually made up of tiny animals called polyps. These polyps build hard skeletons around themselves, and over hundreds of years, layers of these skeletons form the massive structures we call reefs. Coral reefs cover less than 1% of the ocean floor, yet they support about 25% of all marine species. Fish, sea turtles, octopuses, and countless other creatures depend on reefs for food and shelter. Sadly, coral reefs around the world are in danger. Rising ocean temperatures cause coral bleaching, where stressed coral expels the colorful algae living inside it and turns white. Without the algae, the coral can starve and die.",
        paragraphs: ["Coral reefs are sometimes called the rainforests of the sea because they are home to an incredible variety of life.", "Although coral looks like a plant or a rock, it is actually made up of tiny animals called polyps. These polyps build hard skeletons around themselves, and over hundreds of years, layers of these skeletons form the massive structures we call reefs.", "Coral reefs cover less than 1% of the ocean floor, yet they support about 25% of all marine species. Fish, sea turtles, octopuses, and countless other creatures depend on reefs for food and shelter.", "Sadly, coral reefs around the world are in danger. Rising ocean temperatures cause coral bleaching, where stressed coral expels the colorful algae living inside it and turns white. Without the algae, the coral can starve and die."],
        vocabWords: ["polyps", "expels", "bleaching"],
        passageVisibility: "full",
        questions: [
          { q: "What are coral reefs actually made of?", type: "multiple_choice", choices: ["Rocks", "Plants", "Tiny animals called polyps", "Sand"], correct: 2, standard: "TEKS 4.6A" },
          { q: "Why are coral reefs compared to rainforests?", type: "multiple_choice", choices: ["Both are very hot", "Both support a huge variety of life", "Both are underwater", "Both are made of trees"], correct: 1, standard: "TEKS 4.6B" },
          { q: "What does 'expels' mean in this passage?", type: "multiple_choice", choices: ["Invites in", "Pushes out", "Eats", "Protects"], correct: 1, standard: "TEKS 4.2B" },
          { q: "What causes coral bleaching?", type: "multiple_choice", choices: ["Cold water", "Too many fish", "Rising ocean temperatures", "Pollution from boats"], correct: 2, standard: "TEKS 4.6C" }
        ]
      },
      grammarSprint: {
        title: "Grammar Sprint: Subject-Verb Agreement",
        standard: "TEKS 4.11D",
        questions: [
          { q: "Choose the correct verb: The dogs ___ in the park every morning.", choices: ["runs", "run", "running", "runned"], correct: 1, explanation: "Plural subject 'dogs' needs plural verb 'run' (no -s)." },
          { q: "Choose the correct verb: Each of the students ___ a pencil.", choices: ["have", "has", "having", "had have"], correct: 1, explanation: "'Each' is singular, so it takes 'has' (not 'have')." },
          { q: "Which sentence is correct?", choices: ["The team are winning.", "The team is winning.", "The team were winning.", "The team be winning."], correct: 1, explanation: "Collective nouns like 'team' are treated as singular in American English." },
          { q: "Fix this sentence: 'Me and Jake goes to the store.'", choices: ["Me and Jake go to the store.", "Jake and I goes to the store.", "Jake and I go to the store.", "Jake and me goes to the store."], correct: 2, explanation: "Use 'I' (not 'me') as a subject, put yourself second, and use plural verb 'go'." },
          { q: "Choose the correct sentence:", choices: ["There is many books on the shelf.", "There are many books on the shelf.", "There was many books on the shelf.", "There been many books on the shelf."], correct: 1, explanation: "'Books' is plural, so use 'are' (not 'is')." }
        ]
      },
      wolfkidEpisode: {
        title: "Episode 9: The Reef Rescue",
        scenario: "The pack discovers a coral reef that is bleaching fast. Wolfkid must analyze water temperature data from three sensor stations and determine which area of the reef to prioritize for a cooling intervention.",
        writingPrompt: "Write a CER paragraph: Based on the temperature data, which reef zone should receive the emergency cooling intervention first? Use evidence from the data.",
        data: { zoneA: "28.5C (stable)", zoneB: "31.2C (rising 0.3C/day)", zoneC: "30.1C (stable)" }
      }
    },
    Friday: {
      module: {
        title: "Friday Review — Place Value & Mixtures",
        math: {
          title: "Place Value & Rounding Review",
          questions: [
            { q: "What is the value of the 3 in 235,891?", type: "computation", choices: ["3,000", "30,000", "300", "300,000"], correct: 1, standard: "TEKS 4.2A", explanation: "The 3 is in the ten thousands place = 30,000." },
            { q: "Round 67,450 to the nearest thousand.", type: "computation", choices: ["67,000", "67,500", "68,000", "70,000"], correct: 0, standard: "TEKS 4.2B", explanation: "The hundreds digit is 4 (less than 5), so round down to 67,000." },
            { q: "Estimate 392 x 8 by rounding 392 to the nearest hundred.", type: "computation", choices: ["2,400", "3,200", "3,600", "2,800"], correct: 1, standard: "TEKS 4.4G", explanation: "392 rounds to 400. 400 x 8 = 3,200." },
            { q: "Spiral: What is 3/4 + 1/4?", type: "computation", choices: ["4/8", "4/4 = 1 whole", "2/4", "3/8"], correct: 1, standard: "TEKS 4.3E", explanation: "3/4 + 1/4 = 4/4 = 1 whole." }
          ]
        },
        science: {
          title: "Weekly Science Review",
          questions: [
            { q: "Which is a solution?", type: "multiple_choice", choices: ["Gravel in a jar", "Sugar dissolved in water", "A salad", "Sand and iron filings"], correct: 1, standard: "TEKS 4.5A", explanation: "Sugar dissolved in water is a solution — you can't see the separate parts." },
            { q: "Spiral: What type of rock forms from cooled magma?", type: "multiple_choice", choices: ["Sedimentary", "Metamorphic", "Igneous", "Fossil"], correct: 2, standard: "TEKS 4.7A", explanation: "Igneous rocks form when magma or lava cools and hardens." }
          ]
        }
      },
      factSprint: { operation: "multiply", range: [7, 12], count: 25, timeLimit: 100 },
      writing: {
        prompt: "ECR Practice: A classmate says 'Mixtures and solutions are the same thing.' Do you agree or disagree? Write a CER paragraph using evidence from this week's science lessons.",
        standard: "TEKS 4.11A",
        minSentences: 6,
        skillFocus: "argumentative/CER"
      }
    }
  }
};

var BUGGSY_WEEK_10 = {
  child: "buggsy",
  week: 10,
  startDate: "2026-06-15",
  vocabulary: [
    { word: "erode", definition: "To slowly wear away by wind, water, or ice", sentence: "The river will erode the rock over thousands of years." },
    { word: "persuade", definition: "To convince someone to think or do something", sentence: "She tried to persuade her mom to let her stay up late." },
    { word: "remainder", definition: "The amount left over after dividing", sentence: "17 divided by 5 is 3 with a remainder of 2." },
    { word: "deposit", definition: "Material left behind by wind or water", sentence: "The flood left a deposit of mud all over the field." },
    { word: "evidence", definition: "Facts or information that prove something is true", sentence: "The detective gathered evidence at the scene." }
  ],
  scaffoldConfig: {
    timerMode: "count_up",
    missionStructure: "sequential",
    feedbackLevel: "on_tap",
    hintLimit: 2,
    retryOnWrong: true,
    thursdayOverride: { timerMode: "hidden", feedbackLevel: "full" },
    adhd: {
      chunkSize: 3,
      brainBreakAfter: 4,
      brainBreakType: "choice",
      brainBreakPrompt: "Brain break! Pick: 10 high knees, walk to the door and back, or do 5 squats.",
      visualCueMode: "progress_dots",
      transitionAudio: true,
      choiceOnFriday: true,
      maxConsecutiveText: 2,
      interleaveVisual: true,
      feedbackDelay: 0,
      celebrateStreak: 3,
      readAloudOption: false
    }
  },
  days: {
    Monday: {
      module: {
        title: "Multi-Step Problems & Weathering",
        math: {
          title: "Multi-Step Word Problems",
          questions: [
            { q: "A store sells notebooks for $3 each and pens for $2 each. Maria buys 4 notebooks and 6 pens. How much does she spend?", type: "word_problem", choices: ["$20", "$24", "$22", "$18"], correct: 1, standard: "TEKS 4.4B", explanation: "(4 x $3) + (6 x $2) = $12 + $12 = $24" },
            { q: "Jake has 156 baseball cards. He gives 28 to his brother and then buys 35 more. How many does he have now?", type: "word_problem", choices: ["163", "149", "191", "119"], correct: 0, standard: "TEKS 4.4B", explanation: "156 - 28 = 128, then 128 + 35 = 163." },
            { q: "A baker makes 240 cookies. She puts them in boxes of 8. Then she sells 15 boxes. How many boxes are left?", type: "word_problem", choices: ["15", "12", "20", "10"], correct: 0, standard: "TEKS 4.4B", explanation: "240 / 8 = 30 boxes. 30 - 15 = 15 boxes left." },
            { q: "A farmer plants 12 rows of corn with 24 plants per row, and 8 rows of beans with 18 plants per row. How many more corn plants than bean plants?", type: "word_problem", choices: ["144", "132", "156", "120"], correct: 0, standard: "TEKS 4.4B", explanation: "Corn: 12 x 24 = 288. Beans: 8 x 18 = 144. Difference: 288 - 144 = 144." },
            { q: "A student solves: 5 x 12 + 3 = 63. Is this correct?", type: "error_analysis", choices: ["Yes, correct", "No — the answer is 60", "No — the answer is 75", "No — the answer is 63 (correct!)"], correct: 3, standard: "TEKS 4.4B", explanation: "5 x 12 = 60, then 60 + 3 = 63. The student is correct!" }
          ]
        },
        science: {
          title: "Weathering & Erosion",
          questions: [
            { q: "What is weathering?", type: "multiple_choice", choices: ["Moving rocks to a new place", "Breaking down rocks into smaller pieces", "Building mountains", "Predicting rain"], correct: 1, standard: "TEKS 4.7B", explanation: "Weathering is the breaking down of rocks by water, wind, ice, or living things." },
            { q: "Which is an example of erosion?", type: "multiple_choice", choices: ["A rock cracking from ice", "A river carrying sand downstream", "A plant root splitting a boulder", "Acid rain dissolving limestone"], correct: 1, standard: "TEKS 4.7B", explanation: "Erosion is the MOVEMENT of weathered material. A river carrying sand is erosion." },
            { q: "What is the difference between weathering and erosion?", type: "multiple_choice", choices: ["They are the same thing", "Weathering breaks down; erosion moves the pieces", "Erosion breaks down; weathering moves the pieces", "Weathering only happens in winter"], correct: 1, standard: "TEKS 4.7B", explanation: "Weathering = breaking down. Erosion = transporting the broken pieces to new locations." }
          ]
        }
      },
      factSprint: { operation: "divide", range: [3, 12], count: 20, timeLimit: 100 },
      vocabulary: ["erode", "persuade"]
    },
    Tuesday: {
      cold_passage: {
        title: "The Girl Who Could Fly",
        passage: "Amara stood at the edge of the cliff, her heart pounding like a drum. Below her, the sea crashed against the rocks, sending white spray into the air. She looked down at the strange feathered wings that had grown from her shoulder blades overnight. They were silver and blue, shimmering in the morning light. 'You can do this,' she whispered to herself. She closed her eyes, spread her wings wide, and jumped. For one terrifying second, she fell straight down. Then the wind caught her wings, and suddenly she was rising, rising, soaring above the waves. She laughed out loud — a joyful, free sound that mixed with the cries of the seagulls. Far below, her little brother stood on the beach, his mouth open in amazement. Amara did a loop in the air and waved. This was only the beginning.",
        paragraphs: ["Amara stood at the edge of the cliff, her heart pounding like a drum. Below her, the sea crashed against the rocks, sending white spray into the air.", "She looked down at the strange feathered wings that had grown from her shoulder blades overnight. They were silver and blue, shimmering in the morning light.", "'You can do this,' she whispered to herself. She closed her eyes, spread her wings wide, and jumped.", "For one terrifying second, she fell straight down. Then the wind caught her wings, and suddenly she was rising, rising, soaring above the waves.", "She laughed out loud — a joyful, free sound that mixed with the cries of the seagulls. Far below, her little brother stood on the beach, his mouth open in amazement. Amara did a loop in the air and waved. This was only the beginning."],
        vocabWords: ["shimmering", "soaring", "amazement"],
        passageVisibility: "full",
        questions: [
          { q: "How does Amara feel at the beginning of the passage?", type: "multiple_choice", choices: ["Calm and relaxed", "Nervous and scared", "Angry and frustrated", "Bored and sleepy"], correct: 1, standard: "TEKS 4.6B" },
          { q: "What does 'soaring' mean in this story?", type: "multiple_choice", choices: ["Falling quickly", "Swimming underwater", "Flying high in the air", "Running fast"], correct: 2, standard: "TEKS 4.2B" },
          { q: "How does Amara's mood change from beginning to end?", type: "multiple_choice", choices: ["Happy to sad", "Scared to joyful", "Angry to calm", "Bored to worried"], correct: 1, standard: "TEKS 4.6D" },
          { q: "What is the THEME of this passage?", type: "multiple_choice", choices: ["Flying is dangerous", "Courage leads to amazing experiences", "Brothers are always amazed", "The ocean is scary"], correct: 1, standard: "TEKS 4.7A", explanation: "The theme is about finding courage — Amara was afraid but jumped anyway and discovered something wonderful." },
          { q: "This passage is an example of which genre?", type: "multiple_choice", choices: ["Nonfiction", "Fantasy", "Biography", "Informational text"], correct: 1, standard: "TEKS 4.8A" },
          { q: "What does 'This was only the beginning' suggest?", type: "multiple_choice", choices: ["Amara will stop flying", "More adventures are coming", "Her brother will be angry", "The wings will disappear"], correct: 1, standard: "TEKS 4.6D", explanation: "This line suggests the story continues and Amara will have more flying adventures." }
        ]
      },
      writing: {
        prompt: "Write a persuasive paragraph: Should kids be allowed to have phones at school? State your opinion clearly, give at least 2 reasons with evidence, and address a counterargument.",
        standard: "TEKS 4.11B",
        minSentences: 7,
        skillFocus: "persuasive writing"
      }
    },
    Wednesday: {
      module: {
        title: "Strip Diagrams & Deposition",
        math: {
          title: "Strip Diagrams for Problem Solving",
          questions: [
            { q: "A strip diagram shows a total of 156 split into 4 equal parts. What is the value of each part?", type: "computation", choices: ["38", "39", "40", "42"], correct: 1, standard: "TEKS 4.4C", explanation: "156 / 4 = 39" },
            { q: "A strip diagram shows: Part 1 = 45, Part 2 = 67, Part 3 = ?. Total = 180. What is Part 3?", type: "computation", choices: ["68", "58", "78", "48"], correct: 0, standard: "TEKS 4.4C", explanation: "180 - 45 - 67 = 68" },
            { q: "Spiral: Add 5/6 + 3/6.", type: "computation", choices: ["8/12", "8/6 = 1 2/6", "2/6", "15/6"], correct: 1, standard: "TEKS 4.3E", explanation: "5/6 + 3/6 = 8/6 = 1 2/6 (or 1 1/3)." },
            { q: "Spiral: A rectangle is 15 cm long and 7 cm wide. What is the area?", type: "computation", choices: ["22 sq cm", "44 sq cm", "105 sq cm", "88 sq cm"], correct: 2, standard: "TEKS 4.5C", explanation: "Area = length x width = 15 x 7 = 105 sq cm." }
          ]
        },
        science: {
          title: "Deposition — Where Eroded Material Goes",
          questions: [
            { q: "When a river slows down at the ocean, it drops its sediment. This is called —", type: "multiple_choice", choices: ["Weathering", "Erosion", "Deposition", "Condensation"], correct: 2, standard: "TEKS 4.7B", explanation: "Deposition is when eroded material is dropped in a new location." },
            { q: "A delta forms at the mouth of a river because of —", type: "multiple_choice", choices: ["Fast-moving water picking up rocks", "Slow-moving water depositing sediment", "Volcanoes erupting underwater", "Wind blowing sand"], correct: 1, standard: "TEKS 4.7B", explanation: "As the river enters the ocean, it slows down and deposits sediment, forming a delta." },
            { q: "Spiral: What step of the water cycle turns liquid water into vapor?", type: "multiple_choice", choices: ["Condensation", "Precipitation", "Evaporation", "Collection"], correct: 2, standard: "TEKS 4.8A", explanation: "Evaporation turns liquid water into water vapor using heat from the sun." }
          ]
        }
      },
      investigation: {
        prompt: "Wolfkid's pack found that a hillside trail is washing away after every rainstorm. Design an investigation to test which ground cover (grass, gravel, bare soil, mulch) best prevents erosion. Use a tilted tray and a watering can to simulate rain.",
        teks: "TEKS 4.7B, 4.2B",
        subject: "Science",
        materials: ["4 trays", "soil", "grass sod", "gravel", "mulch", "watering can", "collection cups", "ruler"],
        guideQuestions: ["What is your independent variable?", "What will you measure to determine erosion?", "Why must the trays be tilted at the same angle?"]
      }
    },
    Thursday: {
      cold_passage: {
        title: "The Midnight Fox",
        passage: "Every night for a week, something had been getting into the Hendersons' chicken coop. Mr. Henderson blamed a fox. Tom, his son, wasn't so sure. On the eighth night, Tom hid behind the old oak tree with a flashlight and waited. At 11:47 PM, he saw it — not a fox, but a raccoon, clever and bold. It had figured out how to lift the simple latch on the coop door with its dexterous paws. Tom watched in amazement as the raccoon opened the door, waddled inside, and emerged moments later with an egg balanced perfectly in its front paws. The raccoon noticed Tom and froze, staring at him with bright, intelligent eyes. For a long moment, they just looked at each other. Then the raccoon turned and disappeared into the dark woods. Tom smiled. He would tell his father in the morning. The chickens needed a better latch, not a fox hunt.",
        paragraphs: ["Every night for a week, something had been getting into the Hendersons' chicken coop. Mr. Henderson blamed a fox. Tom, his son, wasn't so sure.", "On the eighth night, Tom hid behind the old oak tree with a flashlight and waited. At 11:47 PM, he saw it — not a fox, but a raccoon, clever and bold.", "It had figured out how to lift the simple latch on the coop door with its dexterous paws. Tom watched in amazement as the raccoon opened the door, waddled inside, and emerged moments later with an egg balanced perfectly in its front paws.", "The raccoon noticed Tom and froze, staring at him with bright, intelligent eyes. For a long moment, they just looked at each other. Then the raccoon turned and disappeared into the dark woods.", "Tom smiled. He would tell his father in the morning. The chickens needed a better latch, not a fox hunt."],
        vocabWords: ["dexterous", "emerged", "intelligent"],
        passageVisibility: "full",
        questions: [
          { q: "What was actually getting into the chicken coop?", type: "multiple_choice", choices: ["A fox", "A raccoon", "A cat", "A neighbor"], correct: 1, standard: "TEKS 4.6A" },
          { q: "What does 'dexterous' most likely mean?", type: "multiple_choice", choices: ["Very large", "Extremely fast", "Skillful with hands/paws", "Brightly colored"], correct: 2, standard: "TEKS 4.2B" },
          { q: "Why does Tom say they need 'a better latch, not a fox hunt'?", type: "multiple_choice", choices: ["He wants to keep the raccoon as a pet", "The real problem is the weak latch, not a fox", "He is afraid of foxes", "He wants to move the chickens"], correct: 1, standard: "TEKS 4.6B", explanation: "Tom realized the solution is fixing the latch (the actual problem), not hunting a fox (the wrong suspect)." },
          { q: "What is the THEME of this story?", type: "multiple_choice", choices: ["Animals are dangerous", "Look for evidence before jumping to conclusions", "Raccoons are smarter than foxes", "Chicken coops are hard to build"], correct: 1, standard: "TEKS 4.7A", explanation: "The theme is about investigating and finding the truth rather than assuming." }
        ]
      },
      grammarSprint: {
        title: "Grammar Sprint: Possessives & Apostrophes",
        standard: "TEKS 4.11D",
        questions: [
          { q: "Which shows the correct possessive? The bike belonging to James.", choices: ["James' bike", "James's bike", "Jame's bike", "Both A and B are acceptable"], correct: 3, explanation: "For singular nouns ending in S, both 'James' bike' and 'James's bike' are acceptable." },
          { q: "Choose the correct form: The ___ toys were scattered everywhere.", choices: ["childrens'", "children's", "childrens", "children"], correct: 1, explanation: "'Children' is already plural, so add 's: children's." },
          { q: "Which sentence uses an apostrophe INCORRECTLY?", choices: ["It's raining outside.", "The dog wagged it's tail.", "She's coming to the party.", "That's my favorite book."], correct: 1, explanation: "'Its' (no apostrophe) is possessive. 'It's' = 'it is.' The dog wagged its tail." },
          { q: "Choose the correct possessive: The backpacks belonging to the students.", choices: ["the student's backpacks", "the students' backpacks", "the students's backpacks", "the students backpack's"], correct: 1, explanation: "Multiple students → add apostrophe after the s: students'." },
          { q: "Which contraction is correct for 'they are'?", choices: ["their", "there", "they're", "thier"], correct: 2, explanation: "They're = they are. Their = possessive. There = location." }
        ]
      },
      wolfkidEpisode: {
        title: "Episode 10: The Erosion Mystery",
        scenario: "A landslide blocked the pack's main trail. Wolfkid must analyze the slope, soil type, and recent rainfall data to determine what caused the slide and whether the alternate trail is safe.",
        writingPrompt: "Write a CER paragraph: What caused the landslide on Trail A, and is Trail B safe to use? Support your claim with the data provided.",
        data: { trailA: "steep slope, clay soil, 3 inches rain in 2 hours", trailB: "gentle slope, sandy soil with grass, same rainfall" }
      }
    },
    Friday: {
      module: {
        title: "Friday Review — Multi-Step & Erosion",
        math: {
          title: "Week 10 Math Review",
          questions: [
            { q: "A school has 24 classrooms with 28 students each. How many students total?", type: "word_problem", choices: ["652", "672", "648", "692"], correct: 1, standard: "TEKS 4.4E", explanation: "24 x 28 = 672" },
            { q: "A strip diagram shows 3 equal groups totaling 891. What is each group?", type: "computation", choices: ["293", "297", "299", "301"], correct: 1, standard: "TEKS 4.4C", explanation: "891 / 3 = 297" },
            { q: "Spiral: Which fraction is equivalent to 4/6?", type: "computation", choices: ["2/3", "3/4", "4/3", "6/4"], correct: 0, standard: "TEKS 4.3C", explanation: "4/6 simplifies to 2/3 (divide both by 2)." },
            { q: "Estimate 7 x 492.", type: "computation", choices: ["3,000", "3,500", "3,444", "2,800"], correct: 1, standard: "TEKS 4.4G", explanation: "492 rounds to 500. 7 x 500 = 3,500." }
          ]
        },
        science: {
          title: "Weekly Science Review",
          questions: [
            { q: "What is the correct order? Weathering → ___ → Deposition", type: "multiple_choice", choices: ["Condensation", "Erosion", "Evaporation", "Precipitation"], correct: 1, standard: "TEKS 4.7B", explanation: "The sequence is: weathering breaks rock down, erosion moves it, deposition drops it." },
            { q: "Spiral: In a food chain, which organism is always at the bottom?", type: "multiple_choice", choices: ["Predator", "Decomposer", "Producer (plant)", "Consumer"], correct: 2, standard: "TEKS 4.9A" }
          ]
        }
      },
      factSprint: { operation: "mixed", range: [4, 12], count: 25, timeLimit: 120 },
      writing: {
        prompt: "Free Write Friday! Write a short story (fiction or realistic fiction) about a character who discovers something unexpected in nature. Use vivid sensory details.",
        standard: "TEKS 4.11A",
        minSentences: 10,
        skillFocus: "narrative fluency"
      }
    }
  }
};

var BUGGSY_WEEK_11 = {
  child: "buggsy",
  week: 11,
  startDate: "2026-06-22",
  vocabulary: [
    { word: "analyze", definition: "To examine something carefully to understand it", sentence: "Scientists analyze data to find patterns." },
    { word: "habitat", definition: "The natural home of an animal or plant", sentence: "A coral reef is the habitat of many colorful fish." },
    { word: "summarize", definition: "To tell the main ideas in fewer words", sentence: "Can you summarize the story in three sentences?" },
    { word: "frequency", definition: "How often something occurs", sentence: "The frequency of homework assignments is five days a week." },
    { word: "transfer", definition: "To move something from one place to another", sentence: "Heat can transfer from a hot cup to your cold hands." }
  ],
  scaffoldConfig: {
    timerMode: "count_up",
    missionStructure: "sequential",
    feedbackLevel: "on_tap",
    hintLimit: 2,
    retryOnWrong: true,
    thursdayOverride: { timerMode: "hidden", feedbackLevel: "full" },
    adhd: {
      chunkSize: 3,
      brainBreakAfter: 4,
      brainBreakType: "movement",
      brainBreakPrompt: "Movement break! Touch your toes 5 times, then reach for the sky 5 times. Take 3 deep breaths.",
      visualCueMode: "progress_dots",
      transitionAudio: true,
      choiceOnFriday: true,
      maxConsecutiveText: 2,
      interleaveVisual: true,
      feedbackDelay: 0,
      celebrateStreak: 3,
      readAloudOption: false
    }
  },
  days: {
    Monday: {
      module: {
        title: "Data Analysis & Energy Transfer",
        math: {
          title: "Data Analysis — Frequency Tables & Bar Graphs",
          questions: [
            { q: "A frequency table shows: Red=8, Blue=12, Green=5, Yellow=3. How many total responses?", type: "computation", choices: ["25", "28", "30", "23"], correct: 1, standard: "TEKS 4.8A", explanation: "8 + 12 + 5 + 3 = 28 total responses." },
            { q: "In a bar graph, the tallest bar represents the favorite color 'Blue' at 15 votes. The shortest bar is 'Orange' at 4 votes. What is the difference?", type: "computation", choices: ["9", "11", "19", "10"], correct: 1, standard: "TEKS 4.8A", explanation: "15 - 4 = 11 votes difference." },
            { q: "A dot plot shows test scores: 80(3 dots), 85(5 dots), 90(4 dots), 95(2 dots), 100(1 dot). What is the most common score?", type: "multiple_choice", choices: ["80", "85", "90", "100"], correct: 1, standard: "TEKS 4.8B", explanation: "85 has the most dots (5), so it is the most common (mode)." },
            { q: "Using the dot plot above, how many students scored 90 or higher?", type: "computation", choices: ["5", "6", "7", "8"], correct: 2, standard: "TEKS 4.8B", explanation: "90 has 4 dots + 95 has 2 dots + 100 has 1 dot = 7 students." },
            { q: "A student says the range of {12, 15, 18, 22, 35} is 22. Is this correct?", type: "error_analysis", choices: ["Yes, correct", "No — the range is 23", "No — the range is 18", "No — the range is 35"], correct: 1, standard: "TEKS 4.8C", explanation: "Range = highest - lowest = 35 - 12 = 23. The student was wrong." }
          ]
        },
        science: {
          title: "Energy — Heat Transfer",
          questions: [
            { q: "When you hold a cup of hot chocolate, heat moves from the cup to your hands. This is called —", type: "multiple_choice", choices: ["Radiation", "Conduction", "Convection", "Evaporation"], correct: 1, standard: "TEKS 4.6A", explanation: "Conduction is heat transfer through direct contact." },
            { q: "Heat ALWAYS flows from —", type: "multiple_choice", choices: ["Cold to hot", "Hot to cold", "Left to right", "Big objects to small objects"], correct: 1, standard: "TEKS 4.6A", explanation: "Heat energy always flows from warmer objects to cooler objects." },
            { q: "Which material is the best conductor of heat?", type: "multiple_choice", choices: ["Wood", "Plastic", "Metal", "Rubber"], correct: 2, standard: "TEKS 4.6A", explanation: "Metals conduct heat well — that's why a metal spoon gets hot in soup." }
          ]
        }
      },
      factSprint: { operation: "mixed", range: [5, 12], count: 20, timeLimit: 100 },
      vocabulary: ["analyze", "habitat"]
    },
    Tuesday: {
      cold_passage: {
        title: "How Bees Make Honey",
        passage: "Honey bees are some of the hardest working creatures on Earth. A single bee might visit 50 to 100 flowers during one collection trip. Worker bees use their long tongues to suck nectar from flowers and store it in a special honey stomach. When they return to the hive, they pass the nectar to other bees through mouth-to-mouth transfer. These bees chew the nectar for about 30 minutes, mixing it with enzymes that break down the sugars. Then they spread the processed nectar into honeycomb cells and fan it with their wings to evaporate the water. Once the honey is thick enough, they seal the cell with a wax cap. A single bee produces only about 1/12 of a teaspoon of honey in its entire lifetime. That means it takes the work of about 60,000 bees to produce one pound of honey!",
        paragraphs: ["Honey bees are some of the hardest working creatures on Earth. A single bee might visit 50 to 100 flowers during one collection trip.", "Worker bees use their long tongues to suck nectar from flowers and store it in a special honey stomach. When they return to the hive, they pass the nectar to other bees through mouth-to-mouth transfer.", "These bees chew the nectar for about 30 minutes, mixing it with enzymes that break down the sugars. Then they spread the processed nectar into honeycomb cells and fan it with their wings to evaporate the water.", "Once the honey is thick enough, they seal the cell with a wax cap. A single bee produces only about 1/12 of a teaspoon of honey in its entire lifetime. That means it takes the work of about 60,000 bees to produce one pound of honey!"],
        vocabWords: ["enzymes", "evaporate", "processed"],
        passageVisibility: "full",
        questions: [
          { q: "What is the first step in making honey?", type: "multiple_choice", choices: ["Fanning the nectar", "Collecting nectar from flowers", "Sealing honeycomb cells", "Chewing the nectar"], correct: 1, standard: "TEKS 4.6A" },
          { q: "Why do bees fan the nectar with their wings?", type: "multiple_choice", choices: ["To keep cool", "To evaporate the water", "To attract more bees", "To make the hive smell nice"], correct: 1, standard: "TEKS 4.6B" },
          { q: "What is the MAIN idea of this passage?", type: "multiple_choice", choices: ["Bees are dangerous insects", "Making honey is a complex, multi-step process", "Flowers need bees to survive", "Honey is delicious"], correct: 1, standard: "TEKS 4.7A" },
          { q: "Which BEST summarizes the passage?", type: "multiple_choice", choices: ["Bees collect nectar, process it with enzymes, dry it out, and seal it as honey", "Bees visit flowers and make 1/12 teaspoon of honey", "60,000 bees work together in a hive", "Worker bees have special stomachs for honey"], correct: 0, standard: "TEKS 4.7B", explanation: "A good summary covers the main steps: collect, process, dry, seal." },
          { q: "How is this passage organized?", type: "multiple_choice", choices: ["Compare and contrast", "Problem and solution", "Sequential/chronological order", "Cause and effect"], correct: 2, standard: "TEKS 4.9D", explanation: "The passage explains honey-making step by step in order." },
          { q: "What does 'enzymes' most likely mean?", type: "multiple_choice", choices: ["Small insects", "Chemicals that help break things down", "Types of flowers", "A kind of wax"], correct: 1, standard: "TEKS 4.2B" }
        ]
      },
      writing: {
        prompt: "Summarize the honey-making process in your own words. Then write a paragraph explaining why you think bees are (or aren't) important to humans. Use evidence.",
        standard: "TEKS 4.11A",
        minSentences: 8,
        skillFocus: "summary + opinion"
      }
    },
    Wednesday: {
      module: {
        title: "Line Plots & Insulators",
        math: {
          title: "Line Plots with Fractions",
          questions: [
            { q: "A line plot shows plant heights: 2 1/4 in.(3 Xs), 2 1/2 in.(5 Xs), 2 3/4 in.(2 Xs). How many plants total?", type: "computation", choices: ["8", "10", "12", "7"], correct: 1, standard: "TEKS 4.8C", explanation: "3 + 5 + 2 = 10 plants total." },
            { q: "Using the line plot above, what is the most common plant height?", type: "multiple_choice", choices: ["2 1/4 inches", "2 1/2 inches", "2 3/4 inches", "3 inches"], correct: 1, standard: "TEKS 4.8C", explanation: "2 1/2 inches has the most Xs (5), making it the mode." },
            { q: "Spiral: 7/8 - 3/8 = ?", type: "computation", choices: ["4/8 = 1/2", "4/16", "10/8", "3/8"], correct: 0, standard: "TEKS 4.3E", explanation: "Same denominator: 7 - 3 = 4, so 4/8 = 1/2." },
            { q: "Spiral: What is the perimeter of a square with sides of 13 cm?", type: "computation", choices: ["26 cm", "52 cm", "169 cm", "39 cm"], correct: 1, standard: "TEKS 4.5D", explanation: "Perimeter of square = 4 x side = 4 x 13 = 52 cm." }
          ]
        },
        science: {
          title: "Conductors & Insulators",
          questions: [
            { q: "An insulator is a material that —", type: "multiple_choice", choices: ["Lets heat pass through easily", "Slows or stops heat transfer", "Makes things colder", "Only works with electricity"], correct: 1, standard: "TEKS 4.6A", explanation: "Insulators slow down or stop the flow of heat (examples: wood, plastic, foam)." },
            { q: "Why do pot handles often have rubber or wood grips?", type: "multiple_choice", choices: ["They look nicer", "Rubber and wood are insulators that protect your hand from heat", "Metal handles are too heavy", "It makes the pot cook faster"], correct: 1, standard: "TEKS 4.6A", explanation: "Rubber and wood are insulators — they don't conduct heat well, protecting your hands." },
            { q: "Spiral: Which animal adaptation helps a polar bear survive in the Arctic?", type: "multiple_choice", choices: ["Thin fur", "Thick layer of blubber (fat)", "Webbed feet", "Long tail"], correct: 1, standard: "TEKS 4.10A", explanation: "Thick blubber insulates polar bears, keeping them warm in freezing temperatures." }
          ]
        }
      },
      investigation: {
        prompt: "Wolfkid needs to keep the pack's water supply warm overnight in the freezing mountains. Test which material (aluminum foil, cloth, bubble wrap, nothing) is the best insulator by wrapping cups of warm water and measuring temperature after 30 minutes.",
        teks: "TEKS 4.6A, 4.2B",
        subject: "Science",
        materials: ["4 cups of warm water", "thermometer", "aluminum foil", "cloth", "bubble wrap", "timer"],
        guideQuestions: ["Which cup do you predict will stay warmest?", "What is your control group?", "Why must all cups start at the same temperature?"]
      }
    },
    Thursday: {
      cold_passage: {
        title: "The Drum",
        passage: "I am the heartbeat of the village,\nthe boom that wakes the sleeping dust.\nMy skin is stretched from river to river,\nmy belly full of thunder and trust.\n\nWhen the dancer's feet touch earth,\nI answer with a rumble low.\nWhen the singer lifts her voice,\nI keep the time, I set the flow.\n\nI have known a thousand hands —\nold hands, young hands, hands that shake.\nEach one tells a different story.\nEach one makes a different quake.\n\nSo place your palms upon my face\nand feel the rhythm waiting there.\nI am more than wood and leather.\nI am music. I am prayer.",
        paragraphs: ["I am the heartbeat of the village, / the boom that wakes the sleeping dust. / My skin is stretched from river to river, / my belly full of thunder and trust.", "When the dancer's feet touch earth, / I answer with a rumble low. / When the singer lifts her voice, / I keep the time, I set the flow.", "I have known a thousand hands — / old hands, young hands, hands that shake. / Each one tells a different story. / Each one makes a different quake.", "So place your palms upon my face / and feel the rhythm waiting there. / I am more than wood and leather. / I am music. I am prayer."],
        vocabWords: ["rhythm", "rumble", "quake"],
        passageVisibility: "full",
        questions: [
          { q: "Who or what is the speaker in this poem?", type: "multiple_choice", choices: ["A dancer", "A singer", "A drum", "A village elder"], correct: 2, standard: "TEKS 4.8A" },
          { q: "What does 'I am the heartbeat of the village' mean?", type: "multiple_choice", choices: ["The drum is alive", "The drum is central to the village's life and culture", "The village has a heart problem", "The drum is very loud"], correct: 1, standard: "TEKS 4.6D", explanation: "This is a metaphor — the drum is compared to a heartbeat because it's essential to the village." },
          { q: "What poetic device is used in 'old hands, young hands, hands that shake'?", type: "multiple_choice", choices: ["Simile", "Alliteration", "Repetition", "Onomatopoeia"], correct: 2, standard: "TEKS 4.8A", explanation: "The word 'hands' is repeated three times for emphasis." },
          { q: "What is the THEME of this poem?", type: "multiple_choice", choices: ["Drums are loud instruments", "Music connects people across generations", "Villages need better instruments", "Old hands can't play drums well"], correct: 1, standard: "TEKS 4.7A" }
        ]
      },
      grammarSprint: {
        title: "Grammar Sprint: Homophones & Commonly Confused Words",
        standard: "TEKS 4.11D",
        questions: [
          { q: "Choose the correct word: ___ going to the park after school.", choices: ["Their", "There", "They're", "Thier"], correct: 2, explanation: "They're = they are. 'They're going to the park.'" },
          { q: "Choose the correct word: The cat licked ___ paw.", choices: ["it's", "its", "its'", "it is"], correct: 1, explanation: "'Its' (no apostrophe) shows possession. 'It's' = 'it is.'" },
          { q: "Choose the correct word: I need to ___ my essay before turning it in.", choices: ["right", "rite", "write", "wright"], correct: 2, explanation: "Write = to put words on paper. Right = correct or a direction." },
          { q: "Choose the correct word: The ___ of the movie was surprising.", choices: ["affect", "effect", "affecte", "efect"], correct: 1, explanation: "Effect (noun) = the result. Affect (verb) = to influence." },
          { q: "Choose the correct words: ___ is ___ backpack over ___.", choices: ["Their, there, they're", "There, their, there", "They're, there, their", "There, they're, their"], correct: 0, explanation: "Their = possessive. There = location. They're = they are." }
        ]
      },
      wolfkidEpisode: {
        title: "Episode 11: The Frequency Signal",
        scenario: "The pack's weather station is transmitting data at different frequencies. Wolfkid must create a frequency table from the raw signal data and determine which weather pattern is most common this month.",
        writingPrompt: "Write a CER paragraph: Based on the frequency data, what weather preparation should the pack prioritize for next month?",
        data: { sunny: 12, rainy: 8, cloudy: 6, stormy: 4 }
      }
    },
    Friday: {
      module: {
        title: "Friday Review — Data & Energy",
        math: {
          title: "Week 11 Math Review",
          questions: [
            { q: "A frequency table shows: Cat=14, Dog=18, Fish=7, Bird=11. What fraction of responses chose Dog?", type: "computation", choices: ["18/50", "18/40", "18/32", "14/50"], correct: 0, standard: "TEKS 4.8A", explanation: "Total = 14+18+7+11 = 50. Dog fraction = 18/50." },
            { q: "Spiral: 24 x 15 = ?", type: "computation", choices: ["350", "360", "340", "320"], correct: 1, standard: "TEKS 4.4E", explanation: "24 x 15 = 24 x 10 + 24 x 5 = 240 + 120 = 360." },
            { q: "Spiral: A baker has 132 cupcakes and puts 12 in each box. How many boxes?", type: "computation", choices: ["10", "11", "12", "13"], correct: 1, standard: "TEKS 4.4F", explanation: "132 / 12 = 11 boxes." },
            { q: "What is the range of {45, 52, 38, 67, 41}?", type: "computation", choices: ["26", "29", "32", "22"], correct: 1, standard: "TEKS 4.8C", explanation: "Range = 67 - 38 = 29." }
          ]
        },
        science: {
          title: "Weekly Science Review",
          questions: [
            { q: "Which transfers heat the fastest?", type: "multiple_choice", choices: ["Wool blanket", "Copper wire", "Wooden spoon", "Plastic cup"], correct: 1, standard: "TEKS 4.6A", explanation: "Copper is a metal conductor — it transfers heat very quickly." },
            { q: "Spiral: What separates iron filings from a mixture?", type: "multiple_choice", choices: ["Filtering", "Evaporation", "A magnet", "Heating"], correct: 2, standard: "TEKS 4.5B" }
          ]
        }
      },
      factSprint: { operation: "divide", range: [6, 12], count: 25, timeLimit: 100 },
      writing: {
        prompt: "ECR Practice: Your friend says 'Metal pots cook food faster because metal is a better conductor of heat.' Do you agree? Write a CER paragraph explaining why, using what you learned about conductors and insulators.",
        standard: "TEKS 4.11A",
        minSentences: 6,
        skillFocus: "argumentative/CER"
      }
    }
  }
};

var BUGGSY_WEEK_12 = {
  child: "buggsy",
  week: 12,
  startDate: "2026-06-29",
  vocabulary: [
    { word: "assess", definition: "To evaluate or judge the quality of something", sentence: "The teacher will assess your understanding with a quiz." },
    { word: "accumulate", definition: "To gather or collect over time", sentence: "Snow will accumulate on the ground overnight." },
    { word: "conclude", definition: "To reach a decision based on evidence", sentence: "Based on the experiment, I conclude that salt water freezes at a lower temperature." },
    { word: "proportion", definition: "The relative size or amount of things compared to each other", sentence: "The proportion of boys to girls in the class is 3 to 2." },
    { word: "intervene", definition: "To step in and take action to change something", sentence: "The lifeguard had to intervene when the swimmer got tired." }
  ],
  scaffoldConfig: {
    timerMode: "count_up",
    missionStructure: "assessment",
    feedbackLevel: "delayed",
    hintLimit: 0,
    retryOnWrong: false,
    thursdayOverride: { timerMode: "count_up", feedbackLevel: "delayed" },
    adhd: {
      chunkSize: 3,
      brainBreakAfter: 4,
      brainBreakType: "choice",
      brainBreakPrompt: "Assessment break! Pick: stretch for 30 seconds, get a drink of water, or close your eyes and breathe for 15 seconds.",
      visualCueMode: "progress_dots",
      transitionAudio: true,
      choiceOnFriday: false,
      maxConsecutiveText: 2,
      interleaveVisual: true,
      feedbackDelay: 0,
      celebrateStreak: 3,
      readAloudOption: false
    }
  },
  days: {
    Monday: {
      module: {
        title: "ASSESSMENT: Math Checkpoint (Weeks 1-11)",
        math: {
          title: "Cumulative Math Assessment",
          questions: [
            { q: "What is the value of the 6 in 462,815?", type: "computation", choices: ["6,000", "60,000", "600", "600,000"], correct: 1, standard: "TEKS 4.2A", explanation: "The 6 is in the ten thousands place = 60,000." },
            { q: "Add: 2/5 + 2/5 = ?", type: "computation", choices: ["4/10", "4/5", "2/5", "1"], correct: 1, standard: "TEKS 4.3E", explanation: "Same denominator: 2 + 2 = 4, so 4/5." },
            { q: "A rectangle is 22 cm by 8 cm. What is the perimeter?", type: "computation", choices: ["30 cm", "60 cm", "176 cm", "44 cm"], correct: 1, standard: "TEKS 4.5D", explanation: "P = 2(22) + 2(8) = 44 + 16 = 60 cm." },
            { q: "456 / 8 = ?", type: "computation", choices: ["55", "56", "57", "58"], correct: 2, standard: "TEKS 4.4F", explanation: "456 / 8 = 57." },
            { q: "A store sells 3 T-shirts for $42. How much do 7 T-shirts cost?", type: "word_problem", choices: ["$84", "$98", "$112", "$91"], correct: 1, standard: "TEKS 4.4B", explanation: "One shirt = $42 / 3 = $14. Seven shirts = 7 x $14 = $98." }
          ]
        },
        science: {
          title: "Cumulative Science Assessment",
          questions: [
            { q: "Which type of rock forms from layers of sediment pressed together?", type: "multiple_choice", choices: ["Igneous", "Sedimentary", "Metamorphic", "Volcanic"], correct: 1, standard: "TEKS 4.7A" },
            { q: "What drives the water cycle?", type: "multiple_choice", choices: ["Wind", "Gravity", "The sun's energy", "Ocean currents"], correct: 2, standard: "TEKS 4.8A" },
            { q: "In a food chain, a decomposer —", type: "multiple_choice", choices: ["Makes its own food", "Hunts other animals", "Breaks down dead organisms", "Eats only plants"], correct: 2, standard: "TEKS 4.9A" }
          ]
        }
      },
      factSprint: { operation: "mixed", range: [2, 12], count: 30, timeLimit: 150 },
      vocabulary: ["assess", "accumulate"]
    },
    Tuesday: {
      cold_passage: {
        title: "ASSESSMENT: Reading Comprehension",
        passage: "In 1969, astronaut Neil Armstrong became the first person to walk on the Moon. The Apollo 11 mission launched on July 16, carrying Armstrong, Buzz Aldrin, and Michael Collins. After a four-day journey through space, Armstrong and Aldrin landed the lunar module Eagle on the Moon's surface while Collins orbited above in the command module. Armstrong stepped onto the Moon and said the famous words: 'That's one small step for man, one giant leap for mankind.' The astronauts collected 47 pounds of moon rocks and soil samples for scientists to study. They also planted an American flag and left a plaque that read: 'We came in peace for all mankind.' The entire world watched on television as these brave explorers made history. The mission proved that humans could travel to another world and return safely home.",
        paragraphs: ["In 1969, astronaut Neil Armstrong became the first person to walk on the Moon. The Apollo 11 mission launched on July 16, carrying Armstrong, Buzz Aldrin, and Michael Collins.", "After a four-day journey through space, Armstrong and Aldrin landed the lunar module Eagle on the Moon's surface while Collins orbited above in the command module.", "Armstrong stepped onto the Moon and said the famous words: 'That's one small step for man, one giant leap for mankind.'", "The astronauts collected 47 pounds of moon rocks and soil samples for scientists to study. They also planted an American flag and left a plaque that read: 'We came in peace for all mankind.'", "The entire world watched on television as these brave explorers made history. The mission proved that humans could travel to another world and return safely home."],
        vocabWords: ["lunar", "orbited", "plaque"],
        passageVisibility: "full",
        questions: [
          { q: "Who was the first person to walk on the Moon?", type: "multiple_choice", choices: ["Buzz Aldrin", "Michael Collins", "Neil Armstrong", "John Glenn"], correct: 2, standard: "TEKS 4.6A" },
          { q: "What was Michael Collins' role during the Moon landing?", type: "multiple_choice", choices: ["He walked on the Moon", "He stayed in orbit in the command module", "He drove the lunar rover", "He spoke to mission control"], correct: 1, standard: "TEKS 4.6B" },
          { q: "What does 'one giant leap for mankind' mean?", type: "multiple_choice", choices: ["Armstrong jumped very high", "It was a huge achievement for all people", "The Moon has less gravity", "Mankind made a mistake"], correct: 1, standard: "TEKS 4.6D" },
          { q: "What is the MAIN idea of this passage?", type: "multiple_choice", choices: ["Neil Armstrong was brave", "The Apollo 11 mission made history as the first Moon landing", "Moon rocks are interesting to study", "Television was important in 1969"], correct: 1, standard: "TEKS 4.7A" },
          { q: "Which BEST summarizes the passage?", type: "multiple_choice", choices: ["Armstrong, Aldrin, and Collins flew to the Moon in 1969; Armstrong and Aldrin walked on its surface, collected samples, and returned safely — a historic first", "Neil Armstrong said famous words on the Moon in 1969", "Three astronauts planted a flag on the Moon and collected rocks", "The Moon landing happened on July 16, 1969 and was watched on TV"], correct: 0, standard: "TEKS 4.7B" },
          { q: "What is the author's purpose?", type: "multiple_choice", choices: ["To persuade readers to become astronauts", "To inform readers about the Apollo 11 Moon landing", "To entertain readers with a space adventure", "To explain how rockets work"], correct: 1, standard: "TEKS 4.10A" }
        ]
      },
      writing: {
        prompt: "ASSESSMENT: Write a well-organized essay (3 paragraphs) about a time you accomplished something difficult. Include: an introduction with a hook, a body paragraph with specific details, and a conclusion that reflects on what you learned.",
        standard: "TEKS 4.11A",
        minSentences: 12,
        skillFocus: "essay structure"
      }
    },
    Wednesday: {
      module: {
        title: "ASSESSMENT: Mixed Math & Science",
        math: {
          title: "Mixed Standards Assessment",
          questions: [
            { q: "Round 8,462 to the nearest hundred.", type: "computation", choices: ["8,400", "8,500", "8,460", "8,000"], correct: 1, standard: "TEKS 4.2B", explanation: "Tens digit is 6 (5+), round up to 8,500." },
            { q: "A strip diagram shows 5 equal parts totaling 425. What is one part?", type: "computation", choices: ["80", "85", "90", "75"], correct: 1, standard: "TEKS 4.4C", explanation: "425 / 5 = 85." },
            { q: "Which fraction is greater: 5/8 or 3/4?", type: "multiple_choice", choices: ["5/8", "3/4", "They are equal", "Cannot tell"], correct: 1, standard: "TEKS 4.3D", explanation: "5/8 = 5/8, and 3/4 = 6/8. Since 6/8 > 5/8, 3/4 is greater." },
            { q: "Estimate 23 x 19.", type: "computation", choices: ["400", "500", "380", "440"], correct: 0, standard: "TEKS 4.4G", explanation: "23 rounds to 20, 19 rounds to 20. 20 x 20 = 400." }
          ]
        },
        science: {
          title: "Mixed Science Assessment",
          questions: [
            { q: "Weathering breaks rock down. What MOVES the broken pieces?", type: "multiple_choice", choices: ["Weathering", "Deposition", "Erosion", "Condensation"], correct: 2, standard: "TEKS 4.7B" },
            { q: "A metal spoon gets hot in soup because metal is a —", type: "multiple_choice", choices: ["Insulator", "Conductor", "Decomposer", "Producer"], correct: 1, standard: "TEKS 4.6A" },
            { q: "How could you separate a mixture of sand and salt?", type: "multiple_choice", choices: ["Use a magnet", "Add water, filter, then evaporate", "Shake it", "Freeze it"], correct: 1, standard: "TEKS 4.5B", explanation: "Dissolve salt in water, filter out sand, then evaporate water to get salt back." }
          ]
        }
      },
      investigation: {
        prompt: "ASSESSMENT INVESTIGATION: Your pack must determine which of three unknown liquids (A, B, C) is salt water, sugar water, or plain water. Design an investigation using only evaporation, taste (with permission), and density tests.",
        teks: "TEKS 4.5A, 4.2A, 4.2B",
        subject: "Science",
        materials: ["3 labeled cups (A, B, C)", "evaporation dishes", "heat source", "balance scale", "graduated cylinder"],
        guideQuestions: ["What property will each test reveal?", "How will you record your results?", "What is your conclusion based on evidence?"]
      }
    },
    Thursday: {
      cold_passage: {
        title: "ASSESSMENT: Inference & Analysis",
        passage: "The old lighthouse had stood on the cliff for over a hundred years, its white and red stripes faded by salt and sun. Every evening at exactly 6:15, the light would spin to life, sending its beam across the dark water. Captain Elena Rivera had been the lighthouse keeper for thirty years. She knew every sound the building made — the creak of the stairs, the hum of the generator, the whistle of wind through the cracks. One November evening, the generator coughed twice and went silent. The light went dark. Elena's heart pounded. She grabbed her toolbox and climbed the 147 steps in the dark, counting each one from memory. Outside, she could hear the distant horn of a cargo ship. It was headed straight for the rocky shallows. She had maybe fifteen minutes.",
        paragraphs: ["The old lighthouse had stood on the cliff for over a hundred years, its white and red stripes faded by salt and sun. Every evening at exactly 6:15, the light would spin to life, sending its beam across the dark water.", "Captain Elena Rivera had been the lighthouse keeper for thirty years. She knew every sound the building made — the creak of the stairs, the hum of the generator, the whistle of wind through the cracks.", "One November evening, the generator coughed twice and went silent. The light went dark. Elena's heart pounded.", "She grabbed her toolbox and climbed the 147 steps in the dark, counting each one from memory. Outside, she could hear the distant horn of a cargo ship. It was headed straight for the rocky shallows. She had maybe fifteen minutes."],
        vocabWords: ["generator", "shallows", "faded"],
        passageVisibility: "full",
        questions: [
          { q: "How long has Elena been the lighthouse keeper?", type: "multiple_choice", choices: ["A hundred years", "Fifteen minutes", "Thirty years", "One November"], correct: 2, standard: "TEKS 4.6A" },
          { q: "What can you INFER about Elena from the fact that she counted 147 steps from memory?", type: "multiple_choice", choices: ["She is very old", "She knows the lighthouse extremely well", "She is afraid of the dark", "She likes numbers"], correct: 1, standard: "TEKS 4.6D" },
          { q: "Why is the situation urgent?", type: "multiple_choice", choices: ["Elena is scared", "A cargo ship could crash on the rocks without the light", "The generator is expensive", "November is cold"], correct: 1, standard: "TEKS 4.6B" },
          { q: "What will Elena most likely do next?", type: "multiple_choice", choices: ["Go to sleep", "Call for help", "Try to fix the generator", "Abandon the lighthouse"], correct: 2, standard: "TEKS 4.6D", explanation: "She grabbed her TOOLBOX and climbed to the top — she's going to try to fix it." }
        ]
      },
      grammarSprint: {
        title: "ASSESSMENT: Grammar Cumulative",
        standard: "TEKS 4.11D",
        questions: [
          { q: "Which sentence has correct subject-verb agreement?", choices: ["The group of students are ready.", "The group of students is ready.", "The group of students were ready.", "The group of students be ready."], correct: 1, explanation: "'Group' is singular, so 'is' is correct." },
          { q: "Choose the correct possessive: The house belonging to the Garcias.", choices: ["the Garcia's house", "the Garcias' house", "the Garcias's house", "the Garcia house's"], correct: 1, explanation: "Plural family name ending in s → add apostrophe after: Garcias'." },
          { q: "Fix: 'Between you and I, that test was hard.'", choices: ["Between you and I, that test was hard.", "Between you and me, that test was hard.", "Between you and myself, that test was hard.", "Between I and you, that test was hard."], correct: 1, explanation: "After a preposition (between), use 'me' not 'I'." },
          { q: "Which uses commas correctly?", choices: ["She bought red blue and green paint.", "She bought red, blue, and green paint.", "She bought, red blue and green, paint.", "She, bought red blue and green paint."], correct: 1, explanation: "Use commas between items in a list (serial comma)." },
          { q: "Choose: 'The dog ___ its bone and ___ asleep.'", choices: ["ate, fell", "ate, felled", "eated, fell", "eat, falled"], correct: 0, explanation: "Past tense: ate (irregular) and fell (irregular)." }
        ]
      },
      wolfkidEpisode: {
        title: "Episode 12: The Assessment Summit",
        scenario: "The pack must present their findings from the last 4 weeks to the Council of Elders. Wolfkid must organize data from all investigations into a clear presentation with claims, evidence, and reasoning.",
        writingPrompt: "Write a summary report (3 paragraphs): What did the pack learn from weeks 9-11? Include one finding from each week's investigation. End with a recommendation for the pack's next priority.",
        data: { week9: "Mixture separation methods", week10: "Erosion prevention", week11: "Insulation testing" }
      }
    },
    Friday: {
      module: {
        title: "ASSESSMENT: Friday Cumulative Review",
        math: {
          title: "Cumulative Review",
          questions: [
            { q: "What is 3/8 + 5/8?", type: "computation", choices: ["8/16", "8/8 = 1", "2/8", "15/8"], correct: 1, standard: "TEKS 4.3E" },
            { q: "A classroom has 6 rows of desks with 5 desks in each row. 3 desks are empty. How many students are seated?", type: "word_problem", choices: ["27", "33", "30", "28"], correct: 0, standard: "TEKS 4.4B", explanation: "6 x 5 = 30 desks total. 30 - 3 empty = 27 students." },
            { q: "What is 742 / 7?", type: "computation", choices: ["104", "106", "108", "102"], correct: 1, standard: "TEKS 4.4F", explanation: "742 / 7 = 106." },
            { q: "The area of a rectangle is 96 sq cm and one side is 8 cm. What is the other side?", type: "computation", choices: ["10 cm", "12 cm", "14 cm", "11 cm"], correct: 1, standard: "TEKS 4.5C", explanation: "A = l x w, so 96 = 8 x w, w = 12 cm." }
          ]
        },
        science: {
          title: "Cumulative Science Review",
          questions: [
            { q: "Which is NOT a way to separate a mixture?", type: "multiple_choice", choices: ["Filtering", "Evaporating", "Magnetism", "Photosynthesis"], correct: 3, standard: "TEKS 4.5B", explanation: "Photosynthesis is how plants make food — it's not a separation method." },
            { q: "Heat flows from a warm object to a cool object through direct contact. This is —", type: "multiple_choice", choices: ["Convection", "Radiation", "Conduction", "Insulation"], correct: 2, standard: "TEKS 4.6A" }
          ]
        }
      },
      factSprint: { operation: "mixed", range: [2, 12], count: 30, timeLimit: 120 },
      writing: {
        prompt: "ASSESSMENT: Reflect on your learning from weeks 1-12. What subject do you feel strongest in? What do you want to improve? Write at least 2 paragraphs with specific examples.",
        standard: "TEKS 4.11A",
        minSentences: 10,
        skillFocus: "reflection"
      }
    }
  }
};

// Weeks 13-16 placeholder — to be generated in next curriculum expansion
// W13: Math 4.6-4.7 (geometry/angles) + Science 4.10 (adaptations/life) + RLA: poetry
// W14: Math 4.8 (measurement) + Science 4.11 (fossils) + RLA: informational
// W15: Math 4.9 (data analysis advanced) + Science 4.2 (inquiry) + RLA: grammar heavy
// W16: Math 4.10 (financial literacy) + Science review + RLA: STAAR ECR practice

// ════════════════════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ════════════════════════════════════════════════════════════════════

function getCurriculumSeedVersion() { return 7; }

/**
 * v6: Validates that all asset references in JJ week content exist in ASSET_REGISTRY.
 * Throws with actionable message if any asset is missing.
 * Only validates JJ activities (image, items[].name, objects fields).
 */
function validateContentAgainstRegistry_(weekContent) {
  if (typeof ASSET_REGISTRY === 'undefined') {
    Logger.log('validateContentAgainstRegistry_: ASSET_REGISTRY not available — skipping');
    return;
  }
  var missing = [];
  var days = weekContent.days || {};
  var dayKeys = Object.keys(days);
  for (var d = 0; d < dayKeys.length; d++) {
    var day = days[dayKeys[d]];
    var activities = (day && day.activities) || [];
    for (var a = 0; a < activities.length; a++) {
      var act = activities[a];
      // image field (letter_intro)
      if (act.image && !ASSET_REGISTRY[act.image]) {
        missing.push({ field: 'image', value: act.image, id: act.id });
      }
      // items[].name (color_sort)
      if (act.items) {
        for (var i = 0; i < act.items.length; i++) {
          var itemName = act.items[i].name;
          if (itemName && !ASSET_REGISTRY[itemName] && !ASSET_REGISTRY[itemName.toLowerCase()]) {
            missing.push({ field: 'items[].name', value: itemName, id: act.id });
          }
        }
      }
      // objects field (count_with_me) — allow plural lookup
      if (act.objects) {
        var obj = String(act.objects).toLowerCase();
        var singular = obj.replace(/ies$/, 'y').replace(/s$/, '');
        if (!ASSET_REGISTRY[obj] && !ASSET_REGISTRY[singular]) {
          missing.push({ field: 'objects', value: act.objects, id: act.id });
        }
      }
    }
  }
  if (missing.length > 0) {
    throw new Error('Missing assets in curriculum: ' + JSON.stringify(missing));
  }
}

function seedAllCurriculum() {
  var sheet = ensureCurriculumTab_();

  // Validate JJ weeks against asset registry before writing
  validateContentAgainstRegistry_(JJ_WEEK_1);
  validateContentAgainstRegistry_(JJ_WEEK_2);
  validateContentAgainstRegistry_(JJ_WEEK_3);
  validateContentAgainstRegistry_(JJ_WEEK_4);
  validateContentAgainstRegistry_(JJ_WEEK_5);
  validateContentAgainstRegistry_(JJ_WEEK_6);
  validateContentAgainstRegistry_(JJ_WEEK_7);
  validateContentAgainstRegistry_(JJ_WEEK_8);

  // Clear existing data (keep header row)
  if (sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }

  var rows = [];

  // JJ Weeks 1-8
  rows.push([1, 'jj', JJ_WEEK_1.startDate, JSON.stringify(JJ_WEEK_1)]);
  rows.push([2, 'jj', JJ_WEEK_2.startDate, JSON.stringify(JJ_WEEK_2)]);
  rows.push([3, 'jj', JJ_WEEK_3.startDate, JSON.stringify(JJ_WEEK_3)]);
  rows.push([4, 'jj', JJ_WEEK_4.startDate, JSON.stringify(JJ_WEEK_4)]);
  rows.push([5, 'jj', JJ_WEEK_5.startDate, JSON.stringify(JJ_WEEK_5)]);
  rows.push([6, 'jj', JJ_WEEK_6.startDate, JSON.stringify(JJ_WEEK_6)]);
  rows.push([7, 'jj', JJ_WEEK_7.startDate, JSON.stringify(JJ_WEEK_7)]);
  rows.push([8, 'jj', JJ_WEEK_8.startDate, JSON.stringify(JJ_WEEK_8)]);

  // Buggsy Weeks 1-8
  rows.push([1, 'buggsy', BUGGSY_WEEK_1.startDate, JSON.stringify(BUGGSY_WEEK_1)]);
  rows.push([2, 'buggsy', BUGGSY_WEEK_2.startDate, JSON.stringify(BUGGSY_WEEK_2)]);
  rows.push([3, 'buggsy', BUGGSY_WEEK_3.startDate, JSON.stringify(BUGGSY_WEEK_3)]);
  rows.push([4, 'buggsy', BUGGSY_WEEK_4.startDate, JSON.stringify(BUGGSY_WEEK_4)]);
  rows.push([5, 'buggsy', BUGGSY_WEEK_5.startDate, JSON.stringify(BUGGSY_WEEK_5)]);
  rows.push([6, 'buggsy', BUGGSY_WEEK_6.startDate, JSON.stringify(BUGGSY_WEEK_6)]);
  rows.push([7, 'buggsy', BUGGSY_WEEK_7.startDate, JSON.stringify(BUGGSY_WEEK_7)]);
  rows.push([8, 'buggsy', BUGGSY_WEEK_8.startDate, JSON.stringify(BUGGSY_WEEK_8)]);

  // Buggsy Weeks 9-12 (v7)
  rows.push([9, 'buggsy', BUGGSY_WEEK_9.startDate, JSON.stringify(BUGGSY_WEEK_9)]);
  rows.push([10, 'buggsy', BUGGSY_WEEK_10.startDate, JSON.stringify(BUGGSY_WEEK_10)]);
  rows.push([11, 'buggsy', BUGGSY_WEEK_11.startDate, JSON.stringify(BUGGSY_WEEK_11)]);
  rows.push([12, 'buggsy', BUGGSY_WEEK_12.startDate, JSON.stringify(BUGGSY_WEEK_12)]);

  // Write all rows at once
  sheet.getRange(2, 1, rows.length, 4).setValues(rows);

  Logger.log('Seeded ' + rows.length + ' rows to Curriculum tab');

  // Verify each row
  for (var i = 0; i < rows.length; i++) {
    var jsonLen = String(rows[i][3]).length;
    Logger.log('Row ' + (i + 1) + ': ' + rows[i][1] + ' week ' + rows[i][0] + ' — ' + jsonLen + ' chars');
  }

  return { status: 'seeded', rowCount: rows.length };
}

function seedAllCurriculumSafe() {
  return withMonitor_('seedAllCurriculumSafe', function() {
    return JSON.parse(JSON.stringify(seedAllCurriculum()));
  });
}

// CurriculumSeed.gs — v6

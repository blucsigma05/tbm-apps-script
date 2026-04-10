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
// MAIN SEED FUNCTION
// ════════════════════════════════════════════════════════════════════

function getCurriculumSeedVersion() { return 6; }

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

  // Clear existing data (keep header row)
  if (sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }

  var rows = [];

  // JJ Weeks 1-4
  rows.push([1, 'jj', JJ_WEEK_1.startDate, JSON.stringify(JJ_WEEK_1)]);
  rows.push([2, 'jj', JJ_WEEK_2.startDate, JSON.stringify(JJ_WEEK_2)]);
  rows.push([3, 'jj', JJ_WEEK_3.startDate, JSON.stringify(JJ_WEEK_3)]);
  rows.push([4, 'jj', JJ_WEEK_4.startDate, JSON.stringify(JJ_WEEK_4)]);

  // Buggsy Weeks 1-4
  rows.push([1, 'buggsy', BUGGSY_WEEK_1.startDate, JSON.stringify(BUGGSY_WEEK_1)]);
  rows.push([2, 'buggsy', BUGGSY_WEEK_2.startDate, JSON.stringify(BUGGSY_WEEK_2)]);
  rows.push([3, 'buggsy', BUGGSY_WEEK_3.startDate, JSON.stringify(BUGGSY_WEEK_3)]);
  rows.push([4, 'buggsy', BUGGSY_WEEK_4.startDate, JSON.stringify(BUGGSY_WEEK_4)]);

  // Write all 8 rows at once
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

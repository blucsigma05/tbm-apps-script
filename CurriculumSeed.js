// CurriculumSeed.gs — v9
// Owned by: KidsHub team
// PURPOSE: One-time seed of curriculum for JJ (8 weeks) and Buggsy (16 weeks).
// Run seedAllCurriculum() from the Script Editor to populate the Curriculum tab.
// CurriculumSeed.gs — v9

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
  startDate: "2026-04-13",
  focusLetters: ["K"],
  focusNumbers: [1, 2, 3],
  focusColors: ["red"],
  focusShapes: ["circle"],
  days: {
    Monday: {
      theme: "Letter K",
      title: "K is for KINDLE!",
      audioIntro: "Good morning, JJ! Today we learn the letter K! K is the very first letter in KINDLE — and that is YOUR name! Three fun activities — let us go!",
      activities: [
        { id: "w1m01", type: "letter_intro", letter: "K", stars: 1, word: "KINDLE", image: "fire", audioPrompt: "This is the letter K! K says kuh. K is the FIRST letter in KINDLE — and KINDLE is YOUR name!", audioCorrect: "You know K! Amazing!" },
        { id: "w1m02", type: "find_letter", target: "K", options: ["K", "B", "M"], stars: 1, audioPrompt: "Can you find the letter K? Look carefully!", audioCorrect: "You found K! Great job!", audioWrong: "That is not K. Look for the one that looks like arms reaching out." },
        { id: "w1m03", type: "name_builder", name: "JJ", letters: ["J", "J"], stars: 2, audioPrompt: "Now let us spell YOUR name! Tap J, then J again to spell JJ!", audioCorrect: "J-J! That spells JJ! That is YOUR name! You are incredible!" }
      ]
    },
    Tuesday: {
      theme: "Numbers 1, 2, 3",
      title: "Counting Stars!",
      audioIntro: "Good morning, JJ! Today we count! 1, 2, 3 — just three numbers and three activities! You are going to love this!",
      activities: [
        { id: "w1t01", type: "count_with_me", targetNumber: 3, objects: "stars", stars: 1, audioPrompt: "Let us count the stars together! Tap each one as I count. One... two... three!", audioCorrect: "Three stars! You counted them all! Amazing job!" },
        { id: "w1t02", type: "find_number", target: 1, options: [1, 2, 3], stars: 1, audioPrompt: "Can you find the number 1? It looks like a straight stick!", audioCorrect: "That is the number 1! One! You found it!", audioWrong: "1 looks like a straight stick. Try again — you can do it!" },
        { id: "w1t03", type: "quantity_match", numbers: [1, 2, 3], stars: 2, audioPrompt: "Now match each number to the right group! 1 goes with one thing, 2 goes with two things, 3 goes with three things!", audioCorrect: "Perfect matching! 1, 2, 3 — you are a counting superstar!", audioWrong: "Count the dots in each group carefully, then match to the number." }
      ]
    },
    Wednesday: {
      theme: "Colors and Shapes",
      title: "Red and Round!",
      audioIntro: "Good morning, JJ! Today we find the color red and learn about shapes! Three fun activities — let us explore!",
      activities: [
        { id: "w1w01", type: "color_hunt", targetColor: "red", count: 3, stars: 1, audioPrompt: "Find 3 red things! Red is the color of apples and fire trucks. Tap everything that is red!", audioCorrect: "You found red! Great eyes!", audioWrong: "That is not red — look for the bright color of a fire truck." },
        { id: "w1w02", type: "shape_match", target: "circle", options: ["circle", "square", "triangle"], stars: 1, audioPrompt: "Which one is a circle? A circle is perfectly round — like a ball or the sun!", audioCorrect: "That is a circle! Round and smooth — no corners!", audioWrong: "A circle is perfectly round with no corners at all. Look again!" },
        { id: "w1w03", type: "pattern_next", pattern: [{shape:"star",color:"gold"},{shape:"moon",color:"purple"},{shape:"star",color:"gold"},{shape:"moon",color:"purple"}], answer: {shape:"star",color:"gold"}, options: [{shape:"star",color:"gold"},{shape:"moon",color:"purple"},{shape:"heart",color:"pink"}], stars: 2, audioPrompt: "Star, moon, star, moon... what comes next? Look at the pattern!", audioCorrect: "Star! You see the pattern! Star, moon, star, moon — you are a pattern master!", audioWrong: "Look at the pattern again: star, moon, star, moon... what always comes after a moon?" }
      ]
    },
    Thursday: {
      theme: "Letter K Review",
      title: "Trace the Letter K!",
      audioIntro: "Good morning, JJ! Today we practice the letter K again — this time we are going to trace it! Three activities — let us do this!",
      activities: [
        { id: "w1th01", type: "find_letter", target: "K", options: ["K", "X", "Z"], stars: 1, audioPrompt: "Find the letter K! These letters are a little tricky — look carefully for K!", audioCorrect: "K! You spotted it even with tricky letters! So good!", audioWrong: "K has two diagonal lines like arms. X crosses in the middle. Z has a Z shape. Find K!" },
        { id: "w1th02", type: "letter_trace", letter: "K", stars: 1, audioPrompt: "Now trace the letter K with your finger! Follow the lines — start at the top!", audioCorrect: "Wonderful tracing! You wrote the letter K!" },
        { id: "w1th03", type: "audio_story", stars: 2, story: "Kindle the kitten found a kite. The kite was red. Up, up, up it flew into the sky! Kindle said kuh kuh kuh!", question: "What color was the kite?", answer: "Red", options: ["Red", "Blue", "Yellow"], audioPrompt: "Listen to the story about Kindle the kitten! I will read it to you.", audioCorrect: "Red! The kite was red! Great listening!", audioWrong: "Listen again — the kite was red, just like the color we learned yesterday!" }
      ]
    },
    Friday: {
      theme: "Sparkle Free Play",
      title: "Sparkle Friday!",
      audioIntro: "HAPPY FRIDAY, JJ! You worked so hard this week! Today is free play day — a fun challenge, drawing time, and then a big celebration! You deserve it!",
      activities: [
        { id: "w1f01", type: "sparkle_challenge", stars: 2, questions: [
          { prompt: "Find the letter K!", answer: "K", options: ["K", "B", "M"] },
          { prompt: "How many stars are there?", answer: "3", options: ["1", "2", "3"] },
          { prompt: "Which one is a circle?", answer: "circle", options: ["circle", "square", "triangle"] }
        ], audioPrompt: "Quick challenge time! Three questions — you know all of these!" },
        { id: "w1f02", type: "free_draw", stars: 1, audioPrompt: "Now it is drawing time! Draw anything you want — maybe a kite, or a star, or YOUR name! Have fun!" },
        { id: "w1f03", type: "star_celebration", stars: 3, message: "AMAZING FIRST WEEK, JJ! You learned K, counted 1 2 3, found red, matched shapes, and traced! You are a SUPERSTAR!" }
      ]
    }
  }
};

var JJ_WEEK_2 = {
  child: "jj",
  week: 2,
  phase: "Phase 1",
  startDate: "2026-04-20",
  focusLetters: ["N", "D"],
  focusNumbers: [1, 2, 3, 4],
  focusColors: ["blue"],
  focusShapes: ["square", "triangle"],
  reviewLetters: ["K"],
  days: {
    Monday: {
      theme: "Letters N and D",
      title: "N is for Nathan!",
      audioIntro: "Good morning, JJ! Two new letters today — N and D! N is for your uncle Nathan, and D is for Daddy!",
      activities: [
        { id: "w2m01", type: "letter_intro", letter: "N", stars: 1, word: "Nathan", image: "boy", audioPrompt: "This is the letter N! N says nuh. N is for Nathan — your uncle Nathan!", audioCorrect: "You know N! Nuh!" },
        { id: "w2m02", type: "find_letter", target: "N", options: ["N", "M", "H"], stars: 1, audioPrompt: "Can you find the letter N? N has two tall lines with a diagonal between them!", audioCorrect: "You found N! Great job!", audioWrong: "N has two tall lines with a diagonal line in the middle." },
        { id: "w2m03", type: "letter_intro", letter: "D", stars: 2, word: "Daddy", image: "dad", audioPrompt: "This is the letter D! D says duh. D is for Daddy! The big belly is on the RIGHT side!", audioCorrect: "D for Daddy! Duh!" }
      ]
    },
    Tuesday: {
      theme: "Number 4",
      title: "Counting to Four!",
      audioIntro: "Good morning! Today we learn the number 4! Four is like the number after three!",
      activities: [
        { id: "w2t01", type: "count_with_me", targetNumber: 4, objects: "moons", stars: 1, audioPrompt: "Count the moons! Tap each one. One... two... three... four!", audioCorrect: "Four moons! You counted to four!" },
        { id: "w2t02", type: "find_number", target: 4, options: [2, 4, 6], stars: 1, audioPrompt: "Can you find the number 4? It looks like a flag on a pole!", audioCorrect: "That is 4! Four!", audioWrong: "4 looks like a flag on a pole with a line going across." },
        { id: "w2t03", type: "quantity_match", numbers: [2, 4, 1], stars: 2, audioPrompt: "Match each number to the right group! Count the dots carefully — 1, 2, and 4!", audioCorrect: "Perfect matching! You counted each group!", audioWrong: "Count the dots in each group, then match to the number." }
      ]
    },
    Wednesday: {
      theme: "Blue and Shapes",
      title: "Blue Shapes Day!",
      audioIntro: "Good morning! Today we explore the color blue and find squares and triangles! Three fun activities!",
      activities: [
        { id: "w2w01", type: "color_hunt", targetColor: "blue", count: 3, stars: 1, audioPrompt: "Find 3 blue things! Blue is the color of the sky and the ocean!", audioCorrect: "You found blue! Beautiful!", audioWrong: "That is not blue — look for the color of the sky!" },
        { id: "w2w02", type: "shape_match", target: "square", options: ["circle", "square", "triangle"], stars: 1, audioPrompt: "Which one is a square? A square has 4 equal sides — all the same length!", audioCorrect: "That is a square! Four equal sides!", audioWrong: "A square has 4 sides all the same length and 4 corners." },
        { id: "w2w03", type: "pattern_next", pattern: [{shape:"circle",color:"red"},{shape:"square",color:"blue"},{shape:"circle",color:"red"},{shape:"square",color:"blue"}], answer: {shape:"circle",color:"red"}, options: [{shape:"circle",color:"red"},{shape:"square",color:"blue"},{shape:"triangle",color:"green"}], stars: 2, audioPrompt: "Circle, square, circle, square... what comes next? Look at the pattern!", audioCorrect: "Circle! Red circle! You see the pattern!", audioWrong: "Look again: circle, square, circle, square... what always comes after a square?" }
      ]
    },
    Thursday: {
      theme: "Letter D Review",
      title: "Trace Letter D!",
      audioIntro: "Good morning! Today we practice the letter D — Daddy's letter! We will trace it today!",
      activities: [
        { id: "w2th01", type: "find_letter", target: "D", options: ["B", "D", "P"], stars: 1, audioPrompt: "Find the letter D! Remember — D has a big belly on the RIGHT side!", audioCorrect: "D! Belly on the right! That is Daddy's letter!", audioWrong: "D has a big round belly on the RIGHT side. B has two bumps. P has one bump up top." },
        { id: "w2th02", type: "letter_trace", letter: "D", stars: 1, audioPrompt: "Trace the letter D! One straight line down, then a big curve to the right!", audioCorrect: "Beautiful D! Daddy would be so proud!" },
        { id: "w2th03", type: "audio_story", stars: 2, story: "Nathan had a big blue ball. He threw it up, up, up! It came back down. Nathan caught it and said wow!", question: "What color was Nathan's ball?", answer: "Blue", options: ["Blue", "Red", "Yellow"], audioPrompt: "Story time! Listen carefully to the story about Nathan!", audioCorrect: "Blue! Nathan's ball was blue! Great listening!", audioWrong: "Listen again — Nathan's ball was blue, the same color we learned today!" }
      ]
    },
    Friday: {
      theme: "Sparkle Free Play",
      title: "Sparkle Friday!",
      audioIntro: "HAPPY FRIDAY! Great week, JJ! A quick challenge, then drawing and a big celebration!",
      activities: [
        { id: "w2f01", type: "sparkle_challenge", stars: 2, questions: [
          { prompt: "Find the letter N!", answer: "N", options: ["N", "M", "H"] },
          { prompt: "Find the number 4!", answer: "4", options: ["2", "4", "6"] },
          { prompt: "Which one is blue?", answer: "blue", options: ["blue", "red", "yellow"] }
        ], audioPrompt: "Three quick questions — you know all of these! Let's go!" },
        { id: "w2f02", type: "free_draw", stars: 1, audioPrompt: "Drawing time! Draw something blue — maybe a square, or Nathan, or anything you want!" },
        { id: "w2f03", type: "star_celebration", stars: 3, message: "Week 2 done! You learned N and D! That is 3 letters of KINDLE — K, N, D!" }
      ]
    }
  }
};

var JJ_WEEK_3 = {
  child: "jj",
  week: 3,
  phase: "Phase 1",
  startDate: "2026-04-27",
  focusLetters: ["L", "E"],
  focusNumbers: [1, 2, 3, 4, 5],
  focusColors: ["yellow"],
  focusShapes: ["rectangle", "star"],
  reviewLetters: ["K", "N", "D"],
  days: {
    Monday: {
      theme: "Letters L and E — KINDLE complete!",
      title: "Two new letters — then spell KINDLE!",
      audioIntro: "Good morning, JJ! TODAY is a HUGE day! We learn L and E — and then we can spell your whole name KINDLE! Let us go!",
      activities: [
        { id: "w3m01", type: "letter_intro", letter: "L", stars: 1, word: "LeShawd", image: "boy", audioPrompt: "This is the letter L! L says luh. L is for LeShawd — your uncle LeShawd!", audioCorrect: "L for LeShawd! Luh!" },
        { id: "w3m02", type: "find_letter", target: "L", options: ["L", "I", "T"], stars: 1, audioPrompt: "Find the letter L! L is a tall line with a short foot at the bottom!", audioCorrect: "You found L!", audioWrong: "L is tall with a short line at the bottom going to the right." },
        { id: "w3m03", type: "letter_intro", letter: "E", stars: 2, word: "Excellent", image: "star", audioPrompt: "This is the letter E! E says eh. E is the LAST letter of KINDLE! E for Excellent — and YOU are excellent!", audioCorrect: "E! The last letter of your name KINDLE!" }
      ]
    },
    Tuesday: {
      theme: "Number 5",
      title: "Five — a Whole Hand!",
      audioIntro: "Good morning! Today is all about the number 5 — that is a whole hand of fingers!",
      activities: [
        { id: "w3t01", type: "count_with_me", targetNumber: 5, objects: "flowers", stars: 1, audioPrompt: "Count the flowers! One... two... three... four... FIVE! That is a whole hand!", audioCorrect: "Five flowers! Five is a whole hand of fingers!" },
        { id: "w3t02", type: "find_number", target: 5, options: [3, 5, 2], stars: 1, audioPrompt: "Find the number 5! Five has a flat top and a round belly at the bottom!", audioCorrect: "That is 5! Five!", audioWrong: "5 has a flat top, then curves into a round belly at the bottom." },
        { id: "w3t03", type: "quantity_match", numbers: [3, 5, 1], stars: 2, audioPrompt: "Match 1, 3, and 5 to the right groups! Count carefully!", audioCorrect: "Perfect! You matched 1, 3, and 5!", audioWrong: "Count the dots in each group carefully, then match to the number." }
      ]
    },
    Wednesday: {
      theme: "Yellow and New Shapes",
      title: "Yellow Sunshine Day!",
      audioIntro: "Good morning! Today we find yellow things and learn two new shapes — rectangle and star!",
      activities: [
        { id: "w3w01", type: "color_hunt", targetColor: "yellow", count: 3, stars: 1, audioPrompt: "Find 3 yellow things! Yellow like the sun and bananas!", audioCorrect: "Yellow! Bright like sunshine!", audioWrong: "That is not yellow — look for the warm bright color of the sun." },
        { id: "w3w02", type: "shape_match", target: "rectangle", options: ["square", "rectangle", "circle"], stars: 1, audioPrompt: "Which one is a rectangle? A rectangle is like a stretched-out square — two long sides and two short sides!", audioCorrect: "That is a rectangle! Long sides and short sides!", audioWrong: "A rectangle has 4 sides but two sides are longer. A square has all 4 sides the same." },
        { id: "w3w03", type: "pattern_next", pattern: [{shape:"circle",color:"red"},{shape:"circle",color:"blue"},{shape:"circle",color:"yellow"},{shape:"circle",color:"red"},{shape:"circle",color:"blue"}], answer: {shape:"circle",color:"yellow"}, options: [{shape:"circle",color:"yellow"},{shape:"circle",color:"red"},{shape:"circle",color:"blue"}], stars: 2, audioPrompt: "Red, blue, yellow, red, blue... what comes next?", audioCorrect: "Yellow! You see the three-color pattern!", audioWrong: "The pattern is red, blue, yellow, then it repeats. What comes after red and blue?" }
      ]
    },
    Thursday: {
      theme: "Spell KINDLE! + Trace E",
      title: "KINDLE Moment!",
      audioIntro: "Good morning! Today is the BIG day — you know all 6 letters of KINDLE! We are going to trace E and then spell your whole name!",
      activities: [
        { id: "w3th01", type: "find_letter", target: "E", options: ["E", "F", "3"], stars: 1, audioPrompt: "Find the letter E! Be careful — E has three lines pointing RIGHT. The number 3 has bumps pointing left!", audioCorrect: "E! Three lines pointing right! That is not the number 3!", audioWrong: "E has three horizontal lines pointing to the RIGHT. The number 3 has bumps." },
        { id: "w3th02", type: "letter_trace", letter: "E", stars: 1, audioPrompt: "Trace the letter E! One tall line down, then three short lines going to the right — top, middle, bottom!", audioCorrect: "Beautiful E! The last letter of KINDLE!" },
        { id: "w3th03", type: "name_builder", name: "KINDLE", letters: ["K", "I", "N", "D", "L", "E"], stars: 3, audioPrompt: "THE BIG MOMENT! You know all 6 letters! Tap K, I, N, D, L, E to spell KINDLE — YOUR NAME!", audioCorrect: "K-I-N-D-L-E! KINDLE! YOU SPELLED YOUR NAME! This is INCREDIBLE!" }
      ]
    },
    Friday: {
      theme: "KINDLE Celebration!",
      title: "KINDLE CELEBRATION!",
      audioIntro: "HAPPY FRIDAY and HAPPY KINDLE CELEBRATION! You can spell your whole name! Let us celebrate!",
      activities: [
        { id: "w3f01", type: "sparkle_challenge", stars: 2, questions: [
          { prompt: "Spell the first letter of KINDLE!", answer: "K", options: ["K", "L", "E"] },
          { prompt: "Find the number 5!", answer: "5", options: ["3", "5", "2"] },
          { prompt: "Which one is yellow?", answer: "yellow", options: ["yellow", "blue", "red"] }
        ], audioPrompt: "Three quick questions — then a big celebration!" },
        { id: "w3f02", type: "free_draw", stars: 1, audioPrompt: "Draw something yellow! Maybe the sun, a banana, or your favorite yellow thing!" },
        { id: "w3f03", type: "star_celebration", stars: 5, message: "KINDLE CELEBRATION! You can spell K-I-N-D-L-E! Your whole name! You are a SUPERSTAR!" }
      ]
    }
  }
};

var JJ_WEEK_4 = {
  child: "jj",
  week: 4,
  phase: "Phase 1",
  startDate: "2026-05-04",
  focusLetters: ["J", "B"],
  focusNumbers: [1, 2, 3, 4, 5],
  focusColors: ["green"],
  focusShapes: ["heart", "diamond"],
  reviewLetters: ["K", "I", "N", "D", "L", "E"],
  days: {
    Monday: {
      theme: "Letters J and B — Family letters!",
      title: "J is for JJ and Jennifer!",
      audioIntro: "Good morning, JJ! Two very special letters today — J is for YOU and for Mommy Jennifer! And B is for Buggsy your big brother!",
      activities: [
        { id: "w4m01", type: "letter_intro", letter: "J", stars: 1, word: "Jennifer", image: "girl", audioPrompt: "This is the letter J! J says juh. J is for Jennifer — your Mommy! And J is for JJ — that is YOUR letter!", audioCorrect: "J! That is YOUR letter, JJ!" },
        { id: "w4m02", type: "find_letter", target: "J", options: ["J", "L", "I"], stars: 1, audioPrompt: "Find the letter J! J has a hook at the bottom like a candy cane!", audioCorrect: "J! The first letter of YOUR name!", audioWrong: "J has a straight line that curves into a hook at the bottom." },
        { id: "w4m03", type: "letter_intro", letter: "B", stars: 2, word: "Buggsy", image: "boy", audioPrompt: "This is B! B says buh. B is for Buggsy — your big brother! B has TWO bumps on the right side!", audioCorrect: "B for Buggsy! Buh! Two bumps!" }
      ]
    },
    Tuesday: {
      theme: "More and Less",
      title: "Which Has More?",
      audioIntro: "Good morning! Today we practice counting and learn which group has MORE and which has LESS!",
      activities: [
        { id: "w4t01", type: "count_with_me", targetNumber: 5, objects: "rainbows", stars: 1, audioPrompt: "Count the rainbows! One... two... three... four... five! Five beautiful rainbows!", audioCorrect: "Five rainbows! You counted them all!" },
        { id: "w4t02", type: "more_or_less", groupA: 3, groupB: 5, stars: 1, audioPrompt: "Which group has MORE? Count both groups — which one has more?", audioCorrect: "5 is more than 3! The bigger number has more!", audioWrong: "Count each group carefully. The group with more things is the bigger number." },
        { id: "w4t03", type: "quantity_match", numbers: [5, 2, 4], stars: 2, audioPrompt: "Match 2, 4, and 5 to the right groups! Count the dots in each group!", audioCorrect: "Perfect matching! You counted each group!", audioWrong: "Count the dots in each group, then find the matching number." }
      ]
    },
    Wednesday: {
      theme: "Green and Hearts",
      title: "Green Hearts Day!",
      audioIntro: "Good morning! Today we find green things and learn about heart and diamond shapes!",
      activities: [
        { id: "w4w01", type: "color_hunt", targetColor: "green", count: 3, stars: 1, audioPrompt: "Find 3 green things! Green is the color of grass and leaves and frogs!", audioCorrect: "Green! Like a frog or a leaf!", audioWrong: "That is not green — look for the color of grass and trees." },
        { id: "w4w02", type: "shape_match", target: "heart", options: ["circle", "heart", "star"], stars: 1, audioPrompt: "Which one is a heart? Hearts have two bumps on top and a point at the bottom!", audioCorrect: "That is a heart! Hearts mean love!", audioWrong: "A heart has two bumps at the top and a pointy bottom." },
        { id: "w4w03", type: "pattern_next", pattern: [{shape:"circle",color:"blue"},{shape:"circle",color:"blue"},{shape:"star",color:"gold"},{shape:"circle",color:"blue"},{shape:"circle",color:"blue"}], answer: {shape:"star",color:"gold"}, options: [{shape:"circle",color:"blue"},{shape:"star",color:"gold"},{shape:"heart",color:"pink"}], stars: 2, audioPrompt: "Circle, circle, star, circle, circle... what comes next? Look at the pattern carefully!", audioCorrect: "Star! Circle, circle, star — the star comes every third spot!", audioWrong: "Count: circle, circle, star... circle, circle... what comes after two circles?" }
      ]
    },
    Thursday: {
      theme: "Trace Letter J",
      title: "Trace Your Letter!",
      audioIntro: "Good morning! Today we trace the letter J — YOUR letter! And we will find B and hear a story!",
      activities: [
        { id: "w4th01", type: "find_letter", target: "B", options: ["D", "B", "P"], stars: 1, audioPrompt: "Find the letter B! Remember — B has TWO bumps on the right side!", audioCorrect: "B! Two bumps — that is Buggsy's letter!", audioWrong: "B has TWO bumps on the right. D has ONE big belly. P has one bump up top." },
        { id: "w4th02", type: "letter_trace", letter: "J", stars: 1, audioPrompt: "Now trace YOUR letter J! Straight line down, then curve into a hook at the bottom!", audioCorrect: "Beautiful J! That is YOUR letter!" },
        { id: "w4th03", type: "audio_story", stars: 2, story: "JJ and Buggsy built a fort with green blankets. It was big and cozy. They sat inside and counted to five!", question: "What color were the blankets?", answer: "Green", options: ["Green", "Blue", "Red"], audioPrompt: "Story time! Listen to the story about JJ and Buggsy!", audioCorrect: "Green! The blankets were green! You are a great listener!", audioWrong: "Listen again — the blankets were green, just like the color we learned this week!" }
      ]
    },
    Friday: {
      theme: "One Month Champion!",
      title: "ONE MONTH CHAMPION!",
      audioIntro: "HAPPY FRIDAY and HAPPY ONE MONTH! You have been learning for four whole weeks! Let us celebrate everything you know!",
      activities: [
        { id: "w4f01", type: "sparkle_challenge", stars: 3, questions: [
          { prompt: "Find the letter J!", answer: "J", options: ["J", "L", "I"] },
          { prompt: "Which group has MORE? 3 or 5?", answer: "5", options: ["3", "5"] },
          { prompt: "Which one is green?", answer: "green", options: ["green", "blue", "yellow"] }
        ], audioPrompt: "One month challenge! Three questions — you know all of these!" },
        { id: "w4f02", type: "free_draw", stars: 1, audioPrompt: "Drawing time! Draw something green — or draw yourself, JJ! You are one month stronger!" },
        { id: "w4f03", type: "star_celebration", stars: 5, message: "ONE MONTH CHAMPION! You know K, I, N, D, L, E, J, and B! You can spell KINDLE! You are INCREDIBLE!" }
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
      theme: "Letters A and M — Phase 2 begins!",
      title: "A is for Apple!",
      audioIntro: "WELCOME BACK, JJ! Phase 2 starts today! Two brand new letters — A and M! A is for Apple and M is for Mama!",
      activities: [
        { id: "w5m01", type: "letter_intro", letter: "A", stars: 1, word: "Apple", image: "apple", audioPrompt: "This is the letter A! A says ah. A is for Apple — crunch! A looks like a tent with a line across the middle!", audioCorrect: "You know A! Ah!" },
        { id: "w5m02", type: "find_letter", target: "A", options: ["A", "H", "N"], stars: 1, audioPrompt: "Find the letter A! It looks like a little tent — two slanted lines and a line across the middle!", audioCorrect: "You found A!", audioWrong: "A looks like a tent with a line across the middle." },
        { id: "w5m03", type: "letter_intro", letter: "M", stars: 2, word: "Mama", image: "heart", audioPrompt: "This is the letter M! M says mmm. M is for Mama! M has TWO humps like two mountains!", audioCorrect: "M for Mama! Mmm!" }
      ]
    },
    Tuesday: {
      theme: "Numbers 6 and 7",
      title: "Counting Higher!",
      audioIntro: "Good morning! Today we count to 6 and 7 — bigger numbers! 6 has a curly tail and 7 looks like a flag!",
      activities: [
        { id: "w5t01", type: "count_with_me", targetNumber: 7, objects: "stars", stars: 1, audioPrompt: "Count 7 stars! One... two... three... four... five... six... SEVEN! Tap each one!", audioCorrect: "Seven stars! Amazing counting!" },
        { id: "w5t02", type: "find_number", target: 6, options: [5, 6, 9], stars: 1, audioPrompt: "Find the number 6! Be careful — 6 has a curly tail at the BOTTOM. 9 has a curly tail at the TOP!", audioCorrect: "That is 6! Six!", audioWrong: "6 has a curly tail at the bottom. 9 has a curly tail at the top." },
        { id: "w5t03", type: "quantity_match", numbers: [5, 6, 7], stars: 2, audioPrompt: "Match 5, 6, and 7 to the right groups! Count the dots carefully!", audioCorrect: "Perfect! You matched 5, 6, and 7!", audioWrong: "Count the dots in each group carefully, then match to the number." }
      ]
    },
    Wednesday: {
      theme: "Yellow and Triangles",
      title: "Yellow Triangle Day!",
      audioIntro: "Good morning! Today we find yellow things and learn about triangles! Triangles have THREE sides!",
      activities: [
        { id: "w5w01", type: "color_hunt", targetColor: "yellow", count: 3, stars: 1, audioPrompt: "Find 3 YELLOW things! Yellow is the color of sunshine, bananas, and daffodils!", audioCorrect: "Yellow! Bright like the sun!", audioWrong: "That is not yellow — look for the warm bright color of the sun." },
        { id: "w5w02", type: "shape_match", target: "triangle", options: ["circle", "square", "triangle"], stars: 1, audioPrompt: "Find the triangle! A triangle has 3 sides and 3 pointy corners!", audioCorrect: "Triangle! Three sides, three corners!", audioWrong: "A triangle has THREE sides and THREE pointy corners." },
        { id: "w5w03", type: "pattern_next", pattern: [{shape:"triangle",color:"yellow"},{shape:"circle",color:"red"},{shape:"triangle",color:"yellow"},{shape:"circle",color:"red"}], answer: {shape:"triangle",color:"yellow"}, options: [{shape:"triangle",color:"yellow"},{shape:"circle",color:"red"},{shape:"moon",color:"purple"}], stars: 2, audioPrompt: "Triangle, circle, triangle, circle... what comes next?", audioCorrect: "Triangle! You see the pattern!", audioWrong: "Triangle, circle, triangle, circle... what always comes after a circle?" }
      ]
    },
    Thursday: {
      theme: "Letter A and M Trace",
      title: "Trace A and M!",
      audioIntro: "Good morning! Today we trace the letters A and M and listen to a short story!",
      activities: [
        { id: "w5th01", type: "find_letter", target: "M", options: ["M", "N", "W"], stars: 1, audioPrompt: "Find the letter M! M has two humps going UP. W has humps going DOWN. Find M!", audioCorrect: "M! Two mountains going up! That is Mama's letter!", audioWrong: "M has humps going UP like mountains. W is upside-down M." },
        { id: "w5th02", type: "letter_trace", letter: "A", stars: 1, audioPrompt: "Trace the letter A! Down to the left, down to the right, then a little line across the middle!", audioCorrect: "Beautiful A for Apple!" },
        { id: "w5th03", type: "audio_story", stars: 2, story: "A little ant found an apple under a tree. The apple was big and yellow. The ant said mmm and ate a tiny bite!", question: "What color was the apple?", answer: "Yellow", options: ["Yellow", "Red", "Green"], audioPrompt: "Story time! Listen carefully to the story about an ant!", audioCorrect: "Yellow! The apple was yellow! Wonderful listening!", audioWrong: "Listen again — the apple was yellow, just like the color we learned this week!" }
      ]
    },
    Friday: {
      theme: "Phase 2 Week 1 Celebration!",
      title: "Phase 2 Week 1 Done!",
      audioIntro: "HAPPY FRIDAY! Phase 2 Week 1 is complete! You know A and M now — plus all your KINDLE letters! Let us celebrate!",
      activities: [
        { id: "w5f01", type: "sparkle_challenge", stars: 2, questions: [
          { prompt: "Find the letter A!", answer: "A", options: ["A", "H", "N"] },
          { prompt: "How many sides does a triangle have?", answer: "3", options: ["2", "3", "4"] },
          { prompt: "Which number has a curly tail at the bottom?", answer: "6", options: ["6", "9", "5"] }
        ], audioPrompt: "Three questions from this week — you know all of these!" },
        { id: "w5f02", type: "free_draw", stars: 1, audioPrompt: "Drawing time! Draw an apple, a triangle, or anything you want! Be creative!" },
        { id: "w5f03", type: "star_celebration", stars: 5, message: "Phase 2 Week 1 done! 10 letters: K, I, N, D, L, E, J, B, A, M! INCREDIBLE!" }
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
      audioIntro: "Good morning! Two new letters today — S and T! S is for SPARKLE — your kingdom! And T is for Tiger! Roar!",
      activities: [
        { id: "w6m01", type: "letter_intro", letter: "S", stars: 1, word: "Sparkle", image: "star", audioPrompt: "This is S! S says sss like a snake. S is for SPARKLE — that is YOUR kingdom!", audioCorrect: "S for Sparkle! Sss!" },
        { id: "w6m02", type: "find_letter", target: "S", options: ["S", "Z", "C"], stars: 1, audioPrompt: "Find the letter S! S curves like a snake — one way then the other!", audioCorrect: "You found S! It curves like a snake!", audioWrong: "S curves up then down — like a snake wiggling." },
        { id: "w6m03", type: "letter_intro", letter: "T", stars: 2, word: "Tiger", image: "tiger", audioPrompt: "This is T! T says tuh. T is for Tiger! T has a line across the top like a table! Roar!", audioCorrect: "T for Tiger! Tuh!" }
      ]
    },
    Tuesday: {
      theme: "Number 8 — Like a Snowman!",
      title: "Crazy Eights!",
      audioIntro: "Good morning! Today is ALL about the number 8! Eight looks like a snowman — two circles stacked on top of each other!",
      activities: [
        { id: "w6t01", type: "count_with_me", targetNumber: 8, objects: "stars", stars: 1, audioPrompt: "Count 8 stars! One... two... three... four... five... six... seven... EIGHT!", audioCorrect: "Eight stars! You counted all the way to eight!" },
        { id: "w6t02", type: "find_number", target: 8, options: [3, 6, 8], stars: 1, audioPrompt: "Find the number 8! It looks like a snowman — two circles stacked up!", audioCorrect: "Eight! Like a snowman!", audioWrong: "8 is two circles stacked on top of each other. 6 only has one loop." },
        { id: "w6t03", type: "quantity_match", numbers: [6, 7, 8], stars: 2, audioPrompt: "Match 6, 7, and 8 to the right groups! Big numbers!", audioCorrect: "Perfect! You matched 6, 7, and 8!", audioWrong: "Count the dots in each group carefully." }
      ]
    },
    Wednesday: {
      theme: "Purple Stars",
      title: "Purple Starlight!",
      audioIntro: "Good morning! A magical day — we find PURPLE things and learn about STAR shapes! Purple stars are your sparkle kingdom!",
      activities: [
        { id: "w6w01", type: "color_hunt", targetColor: "purple", count: 3, stars: 1, audioPrompt: "Find 3 PURPLE things! Purple is the color of grapes and amethyst gems!", audioCorrect: "Purple! Like a magical gem!", audioWrong: "That is not purple — look for a dark, rich color between red and blue." },
        { id: "w6w02", type: "shape_match", target: "star", options: ["circle", "star", "square"], stars: 1, audioPrompt: "Find the star! A star has 5 pointy tips sticking out!", audioCorrect: "Star! Five pointy tips!", audioWrong: "A star has 5 pointy tips. Count the points!" },
        { id: "w6w03", type: "pattern_next", pattern: [{shape:"star",color:"purple"},{shape:"triangle",color:"yellow"},{shape:"star",color:"purple"},{shape:"triangle",color:"yellow"}], answer: {shape:"star",color:"purple"}, options: [{shape:"star",color:"purple"},{shape:"triangle",color:"yellow"},{shape:"heart",color:"pink"}], stars: 2, audioPrompt: "Purple star, yellow triangle, purple star, yellow triangle... what comes next?", audioCorrect: "Purple star! You see the pattern!", audioWrong: "Star, triangle, star, triangle... what always comes after a triangle?" }
      ]
    },
    Thursday: {
      theme: "Trace S and T",
      title: "Snake and Table Letters!",
      audioIntro: "Good morning! Today we trace S and T — and hear a sparkle story!",
      activities: [
        { id: "w6th01", type: "find_letter", target: "T", options: ["T", "I", "L"], stars: 1, audioPrompt: "Find the letter T! T has a line across the TOP — like a table!", audioCorrect: "T! Line across the top — like a table!", audioWrong: "T has a line going down and a line across the TOP." },
        { id: "w6th02", type: "letter_trace", letter: "S", stars: 1, audioPrompt: "Trace the letter S! Curve up, then curve back down — like a snake sliding!", audioCorrect: "Sss! Beautiful snake S!" },
        { id: "w6th03", type: "audio_story", stars: 2, story: "A sparkly star lit up the purple sky. A tiger named Tara looked up and said wow! The star was so bright and beautiful.", question: "What color was the sky?", answer: "Purple", options: ["Purple", "Blue", "Yellow"], audioPrompt: "Story time! Listen to the sparkle star story!", audioCorrect: "Purple! The sky was purple! Amazing listening!", audioWrong: "Listen again — the sky was purple, just like the color we learned this week!" }
      ]
    },
    Friday: {
      theme: "Week 6 Sparkle Celebration!",
      title: "12 Letters! Let us celebrate!",
      audioIntro: "HAPPY FRIDAY! You know 12 letters now — K, I, N, D, L, E, J, B, A, M, S, and T! Let us celebrate!",
      activities: [
        { id: "w6f01", type: "sparkle_challenge", stars: 2, questions: [
          { prompt: "Find the letter S!", answer: "S", options: ["S", "Z", "C"] },
          { prompt: "Which number looks like a snowman?", answer: "8", options: ["6", "8", "3"] },
          { prompt: "What shape has 5 points?", answer: "star", options: ["triangle", "star", "circle"] }
        ], audioPrompt: "Three questions from this week — you know all of these!" },
        { id: "w6f02", type: "free_draw", stars: 1, audioPrompt: "Drawing time! Draw a purple star or a tiger or anything in your sparkle kingdom!" },
        { id: "w6f03", type: "star_celebration", stars: 5, message: "12 letters! K, I, N, D, L, E, J, B, A, M, S, T! You are a LETTER MASTER!" }
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
      theme: "Letters O and C — Last two Phase 2 letters!",
      title: "O is for Orange!",
      audioIntro: "Good morning, JJ! The LAST two Phase 2 letters today — O and C! O is a perfect circle! C is like O but with a little opening! Let us go!",
      activities: [
        { id: "w7m01", type: "letter_intro", letter: "O", stars: 1, word: "Orange", image: "orange", audioPrompt: "This is O! O says oh. O is for Orange — round and delicious! O is a perfect circle!", audioCorrect: "O for Orange! Oh!" },
        { id: "w7m02", type: "find_letter", target: "O", options: ["O", "C", "D"], stars: 1, audioPrompt: "Find O! O is a COMPLETE circle. C has an opening. Which one is fully closed all the way around?", audioCorrect: "O! A perfect circle!", audioWrong: "O is completely closed all the way around. C has an opening on the right." },
        { id: "w7m03", type: "letter_intro", letter: "C", stars: 2, word: "Cat", image: "cat", audioPrompt: "This is C! C says kuh — just like K! C is for Cat! Meow! C looks like O but with a bite taken out of the right side!", audioCorrect: "C for Cat! Kuh!" }
      ]
    },
    Tuesday: {
      theme: "Numbers 9 and 10 — COUNT TO TEN!",
      title: "Counting to TEN!",
      audioIntro: "TODAY IS HUGE! We learn 9 and 10! TEN! You will be able to count ALL the way to TEN with BOTH hands!",
      activities: [
        { id: "w7t01", type: "count_with_me", targetNumber: 10, objects: "gems", stars: 2, audioPrompt: "Count ALL THE WAY to TEN! One... two... three... four... five... six... seven... eight... nine... TEN! Tap each one!", audioCorrect: "TEN! You counted to TEN! That is BOTH hands! Amazing!" },
        { id: "w7t02", type: "find_number", target: 9, options: [6, 9, 8], stars: 1, audioPrompt: "Find the number 9! Be careful — 6 and 9 look similar but are FLIPPED! 9 has the loop at the TOP!", audioCorrect: "That is 9! Nine! Loop at the top!", audioWrong: "9 has the loop at the TOP. 6 has the loop at the BOTTOM." },
        { id: "w7t03", type: "quantity_match", numbers: [8, 9, 10], stars: 2, audioPrompt: "Match 8, 9, and 10 to the right groups! These are the biggest numbers!", audioCorrect: "Perfect! You matched 8, 9, and 10!", audioWrong: "Count the dots in each group carefully." }
      ]
    },
    Wednesday: {
      theme: "Orange and Hearts",
      title: "Orange Heart Day!",
      audioIntro: "Good morning! A warm and loving day — we find ORANGE things and learn about HEART shapes! Orange is warm and hearts mean love!",
      activities: [
        { id: "w7w01", type: "color_hunt", targetColor: "orange", count: 3, stars: 1, audioPrompt: "Find 3 ORANGE things! Orange is the warm color between red and yellow — like a sunset!", audioCorrect: "Orange! Warm and beautiful!", audioWrong: "That is not orange — look for a warm color between red and yellow, like a pumpkin." },
        { id: "w7w02", type: "shape_match", target: "heart", options: ["circle", "heart", "star"], stars: 1, audioPrompt: "Find the heart! A heart has two bumps at the top and a pointy bottom — it means love!", audioCorrect: "Heart! Two bumps on top, pointy at the bottom! Love!", audioWrong: "A heart has two bumps at the top and one point at the bottom." },
        { id: "w7w03", type: "pattern_next", pattern: [{shape:"heart",color:"orange"},{shape:"star",color:"purple"},{shape:"heart",color:"orange"},{shape:"star",color:"purple"}], answer: {shape:"heart",color:"orange"}, options: [{shape:"heart",color:"orange"},{shape:"star",color:"purple"},{shape:"moon",color:"yellow"}], stars: 2, audioPrompt: "Orange heart, purple star, orange heart, purple star... what comes next?", audioCorrect: "Orange heart! You see the pattern!", audioWrong: "Heart, star, heart, star... what always comes after a star?" }
      ]
    },
    Thursday: {
      theme: "Trace O and C",
      title: "Circle Letters!",
      audioIntro: "Good morning! Today we trace O and C — the circle letters! And we will hear an orange story!",
      activities: [
        { id: "w7th01", type: "find_letter", target: "C", options: ["C", "O", "S"], stars: 1, audioPrompt: "Find the letter C! C is like O with an opening on the right side!", audioCorrect: "C! Open on the right side — like a moon shape!", audioWrong: "C is like O but with an opening. O is fully closed. Find the one with an opening!" },
        { id: "w7th02", type: "letter_trace", letter: "O", stars: 1, audioPrompt: "Trace the letter O! Go all the way around in a big circle — do not stop until you reach the beginning!", audioCorrect: "Perfect circle O! Round and round!" },
        { id: "w7th03", type: "audio_story", stars: 2, story: "An orange cat named Coco climbed an oak tree. She looked down and saw ten little birds below. Coco counted them all!", question: "How many birds did Coco see?", answer: "Ten", options: ["Ten", "Five", "Three"], audioPrompt: "Story time! Listen to the story about Coco the orange cat!", audioCorrect: "Ten! Coco counted ten birds! Great listening!", audioWrong: "Listen again — Coco counted ten little birds below the tree!" }
      ]
    },
    Friday: {
      theme: "Phase 2 Grand Review!",
      title: "14 Letters! You are AMAZING!",
      audioIntro: "HAPPY FRIDAY! You now know FOURTEEN letters — and you can count to TEN! One more week to celebrate! Let us go!",
      activities: [
        { id: "w7f01", type: "sparkle_challenge", stars: 2, questions: [
          { prompt: "Find the letter O!", answer: "O", options: ["O", "C", "D"] },
          { prompt: "How high can you count now?", answer: "10", options: ["5", "8", "10"] },
          { prompt: "What warm color did we learn?", answer: "orange", options: ["orange", "blue", "green"] }
        ], audioPrompt: "Three questions — you know all of these!" },
        { id: "w7f02", type: "free_draw", stars: 1, audioPrompt: "Drawing time! Draw an orange heart, or Coco the cat, or the number 10! Have fun!" },
        { id: "w7f03", type: "star_celebration", stars: 5, message: "14 letters! Numbers 1-10! 5 colors! 4 shapes! You are INCREDIBLE, JJ!" }
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
      theme: "Assessment — All Your Letters!",
      title: "Letter Champion Challenge!",
      audioIntro: "Good morning, JJ! This is ASSESSMENT WEEK — we check everything you learned! Today: ALL your letters! Show me what you know!",
      activities: [
        { id: "w8m01", type: "sparkle_challenge", stars: 3, questions: [
          { prompt: "Find K!", answer: "K", options: ["K", "X", "T"] },
          { prompt: "Find N!", answer: "N", options: ["N", "M", "A"] },
          { prompt: "Find E!", answer: "E", options: ["E", "S", "F"] }
        ], audioPrompt: "KINDLE letters! Find K, then N, then E — three letters from your name!" },
        { id: "w8m02", type: "find_letter", target: "S", options: ["S", "Z", "C"], stars: 1, audioPrompt: "Find S! The snake letter!", audioCorrect: "S! You know your letters so well!", audioWrong: "S curves like a snake — up then down." },
        { id: "w8m03", type: "name_builder", name: "KINDLE", letters: ["K", "I", "N", "D", "L", "E"], stars: 3, audioPrompt: "SPELL YOUR NAME one more time! You know all 6 letters of KINDLE!", audioCorrect: "K-I-N-D-L-E! KINDLE! You are a LETTER CHAMPION!" }
      ]
    },
    Tuesday: {
      theme: "Assessment — Count to 10!",
      title: "Number Champion Challenge!",
      audioIntro: "Good morning! Today we show off our counting! Count to TEN and match numbers — you have got this!",
      activities: [
        { id: "w8t01", type: "count_with_me", targetNumber: 10, objects: "stars", stars: 2, audioPrompt: "Count ALL the way to TEN! One... two... three... four... five... six... seven... eight... nine... TEN!", audioCorrect: "TEN! You can count to ten! BOTH hands!" },
        { id: "w8t02", type: "find_number", target: 9, options: [6, 9, 8], stars: 1, audioPrompt: "Find 9! Remember — 9 has the loop at the TOP, 6 has the loop at the BOTTOM!", audioCorrect: "Nine! Loop at the top!", audioWrong: "9 has the loop at the top. 6 has the loop at the bottom." },
        { id: "w8t03", type: "quantity_match", numbers: [4, 7, 10], stars: 2, audioPrompt: "Final match! Show me you know 4, 7, and 10!", audioCorrect: "PERFECT! You matched 4, 7, and 10! Number champion!", audioWrong: "Count the dots carefully. 4 has four, 7 has seven, 10 has ten." }
      ]
    },
    Wednesday: {
      theme: "Assessment — Colors and Shapes!",
      title: "Rainbow Shape Challenge!",
      audioIntro: "Good morning! Today we show everything we know about colors and shapes! You know 5 colors and 4 shapes — let us prove it!",
      activities: [
        { id: "w8w01", type: "color_hunt", targetColor: "orange", count: 3, stars: 1, audioPrompt: "Find 3 ORANGE things! The warm sunset color!", audioCorrect: "Orange! You know your colors!" },
        { id: "w8w02", type: "shape_match", target: "triangle", options: ["circle", "star", "triangle"], stars: 1, audioPrompt: "Find the triangle! Three sides, three corners — which one is it?", audioCorrect: "Triangle! Three sides!", audioWrong: "A triangle has 3 sides and 3 pointy corners." },
        { id: "w8w03", type: "pattern_next", pattern: [{shape:"circle",color:"red"},{shape:"circle",color:"blue"},{shape:"circle",color:"yellow"},{shape:"circle",color:"red"},{shape:"circle",color:"blue"}], answer: {shape:"circle",color:"yellow"}, options: [{shape:"circle",color:"yellow"},{shape:"circle",color:"red"},{shape:"circle",color:"blue"}], stars: 2, audioPrompt: "Red, blue, yellow, red, blue... what comes next? You know this pattern!", audioCorrect: "Yellow! You are a PATTERN MASTER!", audioWrong: "Red, blue, yellow repeats. What comes after red and blue?" }
      ]
    },
    Thursday: {
      theme: "Assessment — Sounds and Stories",
      title: "Sound and Story Champion!",
      audioIntro: "Good morning! Today we check sounds and listen to one last story! You have worked so hard, JJ!",
      activities: [
        { id: "w8th01", type: "sparkle_challenge", stars: 2, questions: [
          { prompt: "Kuh... KINDLE! Which letter?", answer: "K", options: ["K", "A", "S"] },
          { prompt: "Sss... Sparkle! Which letter?", answer: "S", options: ["S", "T", "C"] },
          { prompt: "Oh... Orange! Which letter?", answer: "O", options: ["O", "A", "C"] }
        ], audioPrompt: "Sound champion challenge! Match the sound to the letter!" },
        { id: "w8th02", type: "letter_trace", letter: "K", stars: 1, audioPrompt: "Trace K one last time — the first letter of KINDLE, YOUR name!", audioCorrect: "K! The first letter of YOUR name!" },
        { id: "w8th03", type: "audio_story", stars: 2, story: "JJ learned 14 letters, 10 numbers, 5 colors, and 4 shapes. Her Mommy Jennifer and Daddy were so proud. They said JJ, you are amazing!", question: "How many letters did JJ learn?", answer: "14", options: ["10", "14", "5"], audioPrompt: "One last story — listen carefully! This story is about YOU, JJ!", audioCorrect: "14 letters! You learned 14 letters! This story is about YOU!", audioWrong: "Listen again — JJ learned 14 letters! And that JJ is YOU!" }
      ]
    },
    Friday: {
      theme: "PHASE 2 GRAND FINALE!",
      title: "PHASE 2 COMPLETE!",
      audioIntro: "THIS IS IT, JJ! THE GRAND FINALE OF PHASE 2! You did EIGHT WEEKS of learning! You know 14 letters, numbers to 10, 5 colors, and 4 shapes! LET US CELEBRATE!",
      activities: [
        { id: "w8f01", type: "sparkle_challenge", stars: 3, questions: [
          { prompt: "How many letters did you learn?", answer: "14", options: ["8", "10", "14"] },
          { prompt: "What number has two digits?", answer: "10", options: ["9", "10", "8"] },
          { prompt: "S is for...", answer: "Sparkle", options: ["Sparkle", "Tiger", "Moon"] }
        ], audioPrompt: "ULTIMATE Sparkle Challenge! Three big questions!" },
        { id: "w8f02", type: "free_draw", stars: 2, audioPrompt: "Grand finale drawing! Draw your favorite thing you learned — a letter, a number, a color, or KINDLE your name! This is your masterpiece!" },
        { id: "w8f03", type: "star_celebration", stars: 10, message: "PHASE 2 COMPLETE! 14 letters! Numbers 1-10! 5 colors! 4 shapes! You are ready for PHASE 3! KINDLE, you are ABSOLUTELY INCREDIBLE!" }
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
  vocabularyOverride: [
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
  vocabularyOverride: [
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
  vocabularyOverride: [
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
  vocabularyOverride: [
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
  vocabularyOverride: [
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
  vocabularyOverride: [
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
  vocabularyOverride: [
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
  vocabularyOverride: [
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
  vocabularyOverride: [
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
  vocabularyOverride: [
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
  vocabularyOverride: [
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
  vocabularyOverride: [
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

var BUGGSY_WEEK_13 = {
  child: "buggsy",
  week: 13,
  startDate: "2026-07-06",
  vocabularyOverride: [
    { word: "parallel", definition: "Lines that run side by side and never cross", sentence: "Railroad tracks are parallel lines." },
    { word: "perpendicular", definition: "Lines that meet at a right angle (90 degrees)", sentence: "The corner of a book shows perpendicular lines." },
    { word: "stanza", definition: "A group of lines in a poem, like a paragraph", sentence: "The poem had four stanzas with different rhymes." },
    { word: "migrate", definition: "To move from one place to another, usually with the seasons", sentence: "Many birds migrate south for the winter." },
    { word: "acute", definition: "An angle smaller than 90 degrees", sentence: "A slice of pizza forms an acute angle at the point." }
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
      brainBreakPrompt: "Stand up! March in place for 15 seconds, then freeze like a statue!",
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
        title: "Geometry & Life Cycles",
        math: {
          title: "Lines, Angles, and Triangles",
          questions: [
            { q: "Which angle is ACUTE?", type: "multiple_choice", choices: ["45 degrees", "90 degrees", "120 degrees", "180 degrees"], correct: 0, standard: "TEKS 4.7A", explanation: "An acute angle is less than 90 degrees. 45 < 90, so it is acute." },
            { q: "What type of angle does the corner of a book form?", type: "multiple_choice", choices: ["Acute", "Right (90 degrees)", "Obtuse", "Straight"], correct: 1, standard: "TEKS 4.7A", explanation: "A book corner is a right angle = exactly 90 degrees." },
            { q: "Two lines that never cross no matter how far they extend are called —", type: "multiple_choice", choices: ["Perpendicular", "Parallel", "Intersecting", "Diagonal"], correct: 1, standard: "TEKS 4.6A", explanation: "Parallel lines run side by side and never meet." },
            { q: "A triangle with one right angle is called a —", type: "multiple_choice", choices: ["Equilateral triangle", "Right triangle", "Obtuse triangle", "Scalene triangle"], correct: 1, standard: "TEKS 4.6B", explanation: "A right triangle has exactly one 90-degree angle." },
            { q: "A student says an angle of 100 degrees is acute. Is this correct?", type: "error_analysis", choices: ["Yes — any angle is acute", "No — 100 degrees is obtuse (greater than 90)", "No — 100 degrees is a right angle", "Yes — acute means large"], correct: 1, standard: "TEKS 4.7A", explanation: "Acute < 90. Right = 90. Obtuse > 90 and < 180. 100 > 90, so it is obtuse." }
          ]
        },
        science: {
          title: "Life Cycles",
          questions: [
            { q: "Which shows the correct life cycle of a butterfly?", type: "multiple_choice", choices: ["Egg → larva → pupa → adult", "Egg → pupa → larva → adult", "Larva → egg → adult → pupa", "Adult → egg → larva → pupa"], correct: 0, standard: "TEKS 4.10B", explanation: "Complete metamorphosis: egg → larva (caterpillar) → pupa (chrysalis) → adult." },
            { q: "How is a frog's life cycle different from a butterfly's?", type: "multiple_choice", choices: ["Frogs don't have eggs", "Frogs go through incomplete metamorphosis with a tadpole stage", "Frogs skip the larva stage", "There is no difference"], correct: 1, standard: "TEKS 4.10B", explanation: "Frogs: egg → tadpole → tadpole with legs → adult frog. Tadpoles live in water; adults live on land." },
            { q: "Which organism does NOT go through metamorphosis?", type: "multiple_choice", choices: ["Butterfly", "Frog", "Dog", "Beetle"], correct: 2, standard: "TEKS 4.10B", explanation: "Dogs are mammals — they grow larger but don't change body form. Insects and amphibians go through metamorphosis." }
          ]
        }
      },
      factSprint: { operation: "mixed", range: [6, 12], count: 20, timeLimit: 100 },
      vocabulary: ["parallel", "perpendicular"]
    },
    Tuesday: {
      cold_passage: {
        title: "The Road Not Taken (adapted)",
        passage: "Two roads diverged in a yellow wood,\nAnd sorry I could not travel both\nAnd be one traveler, long I stood\nAnd looked down one as far as I could\nTo where it bent in the undergrowth;\n\nThen took the other, as just as fair,\nAnd having perhaps the better claim,\nBecause it was grassy and wanted wear;\nThough as for that the passing there\nHad worn them really about the same,\n\nI shall be telling this with a sigh\nSomewhere ages and ages hence:\nTwo roads diverged in a wood, and I —\nI took the one less traveled by,\nAnd that has made all the difference.",
        paragraphs: ["Two roads diverged in a yellow wood, / And sorry I could not travel both / And be one traveler, long I stood / And looked down one as far as I could / To where it bent in the undergrowth;", "Then took the other, as just as fair, / And having perhaps the better claim, / Because it was grassy and wanted wear; / Though as for that the passing there / Had worn them really about the same,", "I shall be telling this with a sigh / Somewhere ages and ages hence: / Two roads diverged in a wood, and I — / I took the one less traveled by, / And that has made all the difference."],
        vocabWords: ["diverged", "undergrowth", "hence"],
        passageVisibility: "full",
        questions: [
          { q: "What is the speaker's problem at the beginning?", type: "multiple_choice", choices: ["He is lost in the woods", "He must choose between two paths", "He is afraid of the dark", "He forgot which way to go"], correct: 1, standard: "TEKS 4.8A" },
          { q: "What does 'diverged' mean?", type: "multiple_choice", choices: ["Came together", "Split apart", "Disappeared", "Grew taller"], correct: 1, standard: "TEKS 4.2B" },
          { q: "Why does the speaker choose the second road?", type: "multiple_choice", choices: ["It was shorter", "It was grassy and less worn", "Someone told him to", "It had a sign"], correct: 1, standard: "TEKS 4.6B" },
          { q: "This poem is really about —", type: "multiple_choice", choices: ["A nature walk", "Making choices in life", "Getting lost in the forest", "Building a road"], correct: 1, standard: "TEKS 4.7A", explanation: "The roads are a metaphor for life choices. The speaker chose the less popular path and it 'made all the difference.'" },
          { q: "Which poetic device is 'two roads diverged in a yellow wood'?", type: "multiple_choice", choices: ["Simile", "Personification", "Metaphor", "Alliteration"], correct: 2, standard: "TEKS 4.8A", explanation: "The roads are a metaphor for life's choices — the poet isn't literally talking about roads." },
          { q: "What rhyme scheme does this poem follow?", type: "multiple_choice", choices: ["AABB", "ABAB", "ABAAB", "No rhyme"], correct: 2, standard: "TEKS 4.8A", explanation: "The stanzas follow ABAAB: wood/both/stood/could/undergrowth." }
        ]
      },
      writing: {
        prompt: "Write your own poem (at least 3 stanzas, 4 lines each) about a choice you had to make. Use at least one metaphor and one example of imagery (describing something you see, hear, or feel).",
        standard: "TEKS 4.11A",
        minSentences: 12,
        skillFocus: "poetry writing"
      }
    },
    Wednesday: {
      module: {
        title: "Symmetry & Inherited Traits",
        math: {
          title: "Symmetry and Geometric Patterns",
          questions: [
            { q: "How many lines of symmetry does a square have?", type: "multiple_choice", choices: ["1", "2", "4", "8"], correct: 2, standard: "TEKS 4.6D", explanation: "A square has 4 lines of symmetry: horizontal, vertical, and 2 diagonal." },
            { q: "Which letter has exactly ONE line of symmetry?", type: "multiple_choice", choices: ["H", "A", "O", "X"], correct: 1, standard: "TEKS 4.6D", explanation: "A has one vertical line of symmetry. H has 2, O has many, X has 2." },
            { q: "Spiral: Estimate 34 x 21.", type: "computation", choices: ["600", "700", "800", "500"], correct: 1, standard: "TEKS 4.4G", explanation: "34 rounds to 30, 21 rounds to 20. 30 x 20 = 600. More precisely: 34 x 21 = 714, so 700 is closest." },
            { q: "Spiral: What is 5/6 - 2/6?", type: "computation", choices: ["3/6 = 1/2", "3/12", "7/6", "3/0"], correct: 0, standard: "TEKS 4.3E", explanation: "Same denominator: 5 - 2 = 3, so 3/6 = 1/2." }
          ]
        },
        science: {
          title: "Inherited Traits vs. Learned Behaviors",
          questions: [
            { q: "Which is an INHERITED trait?", type: "multiple_choice", choices: ["Speaking English", "Eye color", "Playing piano", "Riding a bike"], correct: 1, standard: "TEKS 4.10A", explanation: "Eye color is passed from parents through genes. Languages and skills are learned." },
            { q: "A dog fetching a ball is an example of —", type: "multiple_choice", choices: ["An inherited trait", "A learned behavior", "A structural adaptation", "A life cycle stage"], correct: 1, standard: "TEKS 4.10A", explanation: "Fetching is taught — it's a learned behavior, not something dogs are born knowing." },
            { q: "Spiral: What type of energy transfer happens when you touch a hot stove?", type: "multiple_choice", choices: ["Convection", "Radiation", "Conduction", "Evaporation"], correct: 2, standard: "TEKS 4.6A" }
          ]
        }
      },
      investigation: {
        prompt: "Wolfkid's pack noticed that wolf pups from different parents have different fur colors. Design an investigation to compare inherited traits (fur color, eye color, ear shape) across 3 wolf families. Create a data table and look for patterns.",
        teks: "TEKS 4.10A, 4.2A",
        subject: "Science",
        materials: ["photos of 3 wolf families (5 members each)", "data table", "colored pencils for coding"],
        guideQuestions: ["Which traits appear in both parents AND pups?", "Which traits skip a generation?", "What patterns do you see across families?"]
      }
    },
    Thursday: {
      cold_passage: {
        title: "The Last Passenger Pigeon",
        passage: "Martha was a passenger pigeon, and she was the last of her kind. She lived her entire life at the Cincinnati Zoo, never knowing the sky the way her ancestors did. Just a century earlier, passenger pigeons were the most abundant bird in North America. Flocks so large they darkened the sky for hours would pass over cities and farms. Eyewitnesses described billions of birds stretching from horizon to horizon. But humans hunted them relentlessly. Professional hunters killed thousands at a time with nets and guns. Forests where the pigeons nested were cut down for farmland. By the 1890s, the once-countless flocks had dwindled to a handful of birds. On September 1, 1914, Martha died at the age of 29. With her death, the passenger pigeon was officially extinct. Her story remains a powerful reminder that even the most abundant species can disappear if we don't protect them.",
        paragraphs: ["Martha was a passenger pigeon, and she was the last of her kind. She lived her entire life at the Cincinnati Zoo, never knowing the sky the way her ancestors did.", "Just a century earlier, passenger pigeons were the most abundant bird in North America. Flocks so large they darkened the sky for hours would pass over cities and farms. Eyewitnesses described billions of birds stretching from horizon to horizon.", "But humans hunted them relentlessly. Professional hunters killed thousands at a time with nets and guns. Forests where the pigeons nested were cut down for farmland.", "By the 1890s, the once-countless flocks had dwindled to a handful of birds. On September 1, 1914, Martha died at the age of 29.", "With her death, the passenger pigeon was officially extinct. Her story remains a powerful reminder that even the most abundant species can disappear if we don't protect them."],
        vocabWords: ["abundant", "relentlessly", "dwindled"],
        passageVisibility: "full",
        questions: [
          { q: "How many passenger pigeons existed before hunting began?", type: "multiple_choice", choices: ["Thousands", "Millions", "Billions", "Hundreds"], correct: 2, standard: "TEKS 4.6A" },
          { q: "What does 'dwindled' mean?", type: "multiple_choice", choices: ["Grew rapidly", "Gradually decreased", "Flew away", "Changed color"], correct: 1, standard: "TEKS 4.2B" },
          { q: "What TWO factors caused the pigeons to go extinct?", type: "multiple_choice", choices: ["Disease and cold weather", "Hunting and habitat loss (deforestation)", "Pollution and drought", "Predators and storms"], correct: 1, standard: "TEKS 4.6C" },
          { q: "What is the author's PURPOSE for writing this passage?", type: "multiple_choice", choices: ["To entertain with a bird story", "To inform and warn about extinction", "To persuade readers to visit zoos", "To describe what pigeons look like"], correct: 1, standard: "TEKS 4.10A" }
        ]
      },
      grammarSprint: {
        title: "Grammar Sprint: Complex Sentences",
        standard: "TEKS 4.11D",
        questions: [
          { q: "Which is a COMPLEX sentence?", choices: ["The dog ran fast.", "The dog ran fast, and the cat hid.", "Because it rained, the game was canceled.", "The dog ran. The cat hid."], correct: 2, explanation: "A complex sentence has an independent clause and a dependent clause joined by a subordinating conjunction (because, although, when, if)." },
          { q: "Choose the correct subordinating conjunction: ___ she studied hard, she passed the test.", choices: ["But", "Because", "And", "Or"], correct: 1, explanation: "'Because' shows cause and effect — studying led to passing." },
          { q: "Which sentence uses a comma correctly with a dependent clause?", choices: ["After the movie we ate dinner.", "After the movie, we ate dinner.", "After, the movie we ate dinner.", "After the movie we, ate dinner."], correct: 1, explanation: "When a dependent clause comes FIRST, put a comma after it." },
          { q: "Combine: 'It was cold outside. She wore a coat.'", choices: ["It was cold outside she wore a coat.", "Because it was cold outside, she wore a coat.", "It was cold outside, she wore a coat.", "Cold outside she wore a coat."], correct: 1, explanation: "Use 'because' to show the reason, with a comma after the dependent clause." },
          { q: "Which word is a subordinating conjunction?", choices: ["And", "But", "Although", "Or"], correct: 2, explanation: "Although, because, when, if, since, unless, while — these start dependent clauses." }
        ]
      },
      wolfkidEpisode: {
        title: "Episode 13: The Angle of Approach",
        scenario: "The pack needs to build a bridge across a ravine. Wolfkid must measure angles to determine if the support beams will hold. The bridge design requires all angles to sum to 180 degrees per triangle section.",
        writingPrompt: "Write a CER paragraph: Based on the angle measurements, will the bridge design hold? If any triangle section doesn't sum to 180 degrees, identify the error.",
        data: { sectionA: "60+60+60=180", sectionB: "45+90+45=180", sectionC: "50+80+60=190" }
      }
    },
    Friday: {
      module: {
        title: "Friday Review — Geometry & Life Cycles",
        math: {
          title: "Week 13 Review",
          questions: [
            { q: "An angle of 135 degrees is —", type: "multiple_choice", choices: ["Acute", "Right", "Obtuse", "Straight"], correct: 2, standard: "TEKS 4.7A", explanation: "135 > 90 and < 180, so it is obtuse." },
            { q: "Spiral: 36 x 24 = ?", type: "computation", choices: ["864", "844", "824", "884"], correct: 0, standard: "TEKS 4.4E", explanation: "36 x 24 = 36 x 20 + 36 x 4 = 720 + 144 = 864." },
            { q: "How many lines of symmetry does an equilateral triangle have?", type: "multiple_choice", choices: ["0", "1", "2", "3"], correct: 3, standard: "TEKS 4.6D", explanation: "An equilateral triangle has 3 lines of symmetry (one through each vertex)." },
            { q: "Spiral: A frequency table shows Cat=15, Dog=20, Fish=10. What fraction chose Fish?", type: "computation", choices: ["10/45", "10/35", "10/20", "15/45"], correct: 0, standard: "TEKS 4.8A" }
          ]
        },
        science: {
          title: "Weekly Science Review",
          questions: [
            { q: "Egg → larva → pupa → adult is the life cycle of —", type: "multiple_choice", choices: ["A frog", "A butterfly", "A dog", "A fish"], correct: 1, standard: "TEKS 4.10B" },
            { q: "Spiral: Erosion is the ___ of weathered material.", type: "multiple_choice", choices: ["Breaking down", "Movement", "Creation", "Melting"], correct: 1, standard: "TEKS 4.7B" }
          ]
        }
      },
      factSprint: { operation: "mixed", range: [7, 12], count: 25, timeLimit: 100 },
      writing: {
        prompt: "Write a poem (at least 2 stanzas) from the perspective of an animal going through metamorphosis. What does the butterfly feel inside the chrysalis? What does the tadpole think as it grows legs?",
        standard: "TEKS 4.11A",
        minSentences: 8,
        skillFocus: "creative poetry"
      }
    }
  }
};

var BUGGSY_WEEK_14 = {
  child: "buggsy",
  week: 14,
  startDate: "2026-07-13",
  vocabularyOverride: [
    { word: "convert", definition: "To change from one form or unit to another", sentence: "You can convert inches to centimeters using a formula." },
    { word: "fossil", definition: "The preserved remains of an ancient living thing", sentence: "Scientists found a dinosaur fossil buried in the rock." },
    { word: "cite", definition: "To reference a source as evidence for a claim", sentence: "In your essay, cite the text to support your answer." },
    { word: "excavate", definition: "To dig out carefully from the ground", sentence: "Archaeologists excavate ancient ruins layer by layer." },
    { word: "capacity", definition: "The maximum amount a container can hold", sentence: "The capacity of the bathtub is 40 gallons." }
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
      brainBreakPrompt: "Brain break! Pick: wall push-ups (10), balance on one foot (20 seconds), or desk drumming (15 seconds).",
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
        title: "Measurement Conversion & Fossils",
        math: {
          title: "Customary & Metric Measurement",
          questions: [
            { q: "How many inches are in 3 feet?", type: "computation", choices: ["24", "30", "36", "48"], correct: 2, standard: "TEKS 4.8A", explanation: "1 foot = 12 inches. 3 x 12 = 36 inches." },
            { q: "Which is longer: 1 meter or 1 yard?", type: "multiple_choice", choices: ["1 meter (it's about 39 inches)", "1 yard (it's 36 inches)", "They are equal", "Cannot compare"], correct: 0, standard: "TEKS 4.8B", explanation: "1 meter ≈ 39.37 inches. 1 yard = 36 inches. A meter is slightly longer." },
            { q: "A recipe calls for 2 cups of milk. How many fluid ounces is that?", type: "computation", choices: ["8 fl oz", "12 fl oz", "16 fl oz", "32 fl oz"], correct: 2, standard: "TEKS 4.8A", explanation: "1 cup = 8 fluid ounces. 2 cups = 16 fl oz." },
            { q: "Convert 5,000 grams to kilograms.", type: "computation", choices: ["5 kg", "50 kg", "500 kg", "0.5 kg"], correct: 0, standard: "TEKS 4.8B", explanation: "1 kilogram = 1,000 grams. 5,000 / 1,000 = 5 kg." },
            { q: "A student says 2 miles = 2,000 feet. Is this correct?", type: "error_analysis", choices: ["Yes, correct", "No — 2 miles = 10,560 feet", "No — 2 miles = 5,280 feet", "No — 2 miles = 3,000 feet"], correct: 1, standard: "TEKS 4.8A", explanation: "1 mile = 5,280 feet. 2 miles = 10,560 feet. The student's answer is way off." }
          ]
        },
        science: {
          title: "Fossils & Earth's History",
          questions: [
            { q: "Fossils are usually found in which type of rock?", type: "multiple_choice", choices: ["Igneous", "Sedimentary", "Metamorphic", "Volcanic"], correct: 1, standard: "TEKS 4.7A", explanation: "Fossils form in sedimentary rock because layers of sediment slowly bury and preserve organisms." },
            { q: "What can fossils tell scientists?", type: "multiple_choice", choices: ["What the weather is today", "What organisms lived long ago and what the environment was like", "How to make new species", "Nothing useful"], correct: 1, standard: "TEKS 4.7A", explanation: "Fossils are evidence of past life and ancient environments." },
            { q: "If you find a fossil of a fish in a desert, what can you conclude?", type: "multiple_choice", choices: ["Fish can live in deserts", "That area was once covered by water", "The fossil is fake", "Fish evolved into lizards"], correct: 1, standard: "TEKS 4.7A", explanation: "A fish fossil in a desert means that area was once an ocean, lake, or sea." }
          ]
        }
      },
      factSprint: { operation: "divide", range: [6, 12], count: 20, timeLimit: 100 },
      vocabulary: ["convert", "fossil"]
    },
    Tuesday: {
      cold_passage: {
        title: "The Deep-Sea Discovery",
        passage: "In 1977, scientists aboard the research submarine Alvin made one of the most surprising discoveries in the history of biology. Two and a half miles below the surface of the Pacific Ocean, where no sunlight could reach, they found thriving communities of strange creatures living near volcanic vents on the ocean floor. These hydrothermal vents spew superheated water — as hot as 700 degrees Fahrenheit — rich in chemicals from deep within the Earth. Giant tube worms up to six feet long, eyeless shrimp, and ghostly white crabs clustered around the vents. The scientists were stunned. Until then, all known food chains depended on sunlight and photosynthesis. But these creatures survived through chemosynthesis — using chemical energy from the vents instead of sunlight. The discovery changed our understanding of where life can exist. If life can thrive in such extreme conditions on Earth, some scientists believe it might also exist on other planets or moons with similar environments.",
        paragraphs: ["In 1977, scientists aboard the research submarine Alvin made one of the most surprising discoveries in the history of biology.", "Two and a half miles below the surface of the Pacific Ocean, where no sunlight could reach, they found thriving communities of strange creatures living near volcanic vents on the ocean floor.", "These hydrothermal vents spew superheated water — as hot as 700 degrees Fahrenheit — rich in chemicals from deep within the Earth. Giant tube worms up to six feet long, eyeless shrimp, and ghostly white crabs clustered around the vents.", "The scientists were stunned. Until then, all known food chains depended on sunlight and photosynthesis. But these creatures survived through chemosynthesis — using chemical energy from the vents instead of sunlight.", "The discovery changed our understanding of where life can exist. If life can thrive in such extreme conditions on Earth, some scientists believe it might also exist on other planets or moons with similar environments."],
        vocabWords: ["hydrothermal", "chemosynthesis", "thriving"],
        passageVisibility: "full",
        questions: [
          { q: "Where were the deep-sea creatures discovered?", type: "multiple_choice", choices: ["On the beach", "Near volcanic vents 2.5 miles deep", "In a lake", "In the Arctic Ocean"], correct: 1, standard: "TEKS 4.6A" },
          { q: "How do these creatures get energy without sunlight?", type: "multiple_choice", choices: ["Photosynthesis", "Chemosynthesis — using chemical energy", "They eat sunlight that sinks", "They don't need energy"], correct: 1, standard: "TEKS 4.6B" },
          { q: "What does 'thriving' mean?", type: "multiple_choice", choices: ["Barely surviving", "Growing and doing well", "Moving quickly", "Shrinking"], correct: 1, standard: "TEKS 4.2B" },
          { q: "Why did this discovery change scientists' understanding?", type: "multiple_choice", choices: ["It proved sunlight isn't needed for all life", "It showed oceans are warm", "It found new continents", "It proved fish can fly"], correct: 0, standard: "TEKS 4.6D" },
          { q: "What is the MAIN idea of this passage?", type: "multiple_choice", choices: ["Submarines are useful tools", "Life can exist in unexpected places without sunlight", "The Pacific Ocean is very deep", "Tube worms are interesting animals"], correct: 1, standard: "TEKS 4.7A" },
          { q: "How is the passage organized?", type: "multiple_choice", choices: ["Compare and contrast", "Problem and solution", "Chronological + cause and effect", "Persuasive argument"], correct: 2, standard: "TEKS 4.9D", explanation: "The passage tells the story chronologically (1977 discovery) and explains cause/effect (why this matters)." }
        ]
      },
      writing: {
        prompt: "Write an informational paragraph about a scientific discovery that interests you. Cite at least 2 specific facts (you can use facts from the passage or make up realistic ones). Include a topic sentence, supporting details, and a concluding sentence.",
        standard: "TEKS 4.11B",
        minSentences: 7,
        skillFocus: "informational writing"
      }
    },
    Wednesday: {
      module: {
        title: "Elapsed Time & Fossil Layers",
        math: {
          title: "Elapsed Time & Unit Conversion",
          questions: [
            { q: "A movie starts at 2:45 PM and ends at 5:10 PM. How long is the movie?", type: "word_problem", choices: ["2 hours 15 minutes", "2 hours 25 minutes", "3 hours 25 minutes", "2 hours 35 minutes"], correct: 1, standard: "TEKS 4.8C", explanation: "2:45 to 5:10 = 2 hours 25 minutes." },
            { q: "How many minutes are in 3 hours and 15 minutes?", type: "computation", choices: ["180", "195", "315", "215"], correct: 1, standard: "TEKS 4.8A", explanation: "3 hours = 180 minutes + 15 = 195 minutes." },
            { q: "Spiral: What is the perimeter of a rectangle that is 18 cm by 11 cm?", type: "computation", choices: ["29 cm", "58 cm", "198 cm", "56 cm"], correct: 1, standard: "TEKS 4.5D", explanation: "P = 2(18) + 2(11) = 36 + 22 = 58 cm." },
            { q: "Spiral: Round 45,672 to the nearest thousand.", type: "computation", choices: ["45,000", "46,000", "45,700", "50,000"], correct: 1, standard: "TEKS 4.2B", explanation: "The hundreds digit is 6 (5+), so round up to 46,000." }
          ]
        },
        science: {
          title: "Fossil Layers — Relative Age",
          questions: [
            { q: "In undisturbed rock layers, the oldest fossils are found —", type: "multiple_choice", choices: ["At the top", "In the middle", "At the bottom", "Scattered randomly"], correct: 2, standard: "TEKS 4.7A", explanation: "In undisturbed layers, the bottom layers were deposited first and are the oldest." },
            { q: "Scientist finds Layer A (trilobite fossils) below Layer B (dinosaur fossils). Which is older?", type: "multiple_choice", choices: ["Layer A (trilobites)", "Layer B (dinosaurs)", "They are the same age", "Cannot determine"], correct: 0, standard: "TEKS 4.7A", explanation: "Lower layers are older. Trilobites lived before dinosaurs." },
            { q: "Spiral: Which material is a good insulator?", type: "multiple_choice", choices: ["Copper wire", "Wooden spoon", "Aluminum foil", "Iron nail"], correct: 1, standard: "TEKS 4.6A" }
          ]
        }
      },
      investigation: {
        prompt: "Wolfkid's pack found a cliff with 5 visible rock layers. Each layer contains different fossils. Create a model of the layers, label each fossil type, and determine which layer is oldest and which is youngest. Explain your reasoning.",
        teks: "TEKS 4.7A, 4.2B",
        subject: "Science",
        materials: ["5 colors of clay/paper", "fossil stickers or drawings", "cross-section diagram template"],
        guideQuestions: ["Which layer was deposited first?", "If you found a fish fossil in layer 3 and a plant fossil in layer 1, what can you conclude?", "What would happen to the order if the layers were disturbed by an earthquake?"]
      }
    },
    Thursday: {
      cold_passage: {
        title: "How a Seed Becomes a Forest",
        passage: "It begins with a single seed, no bigger than your fingernail. Inside that tiny package is everything needed to grow a tree that could live for hundreds of years. When conditions are right — enough water, warmth, and light — the seed cracks open and sends a tiny root downward into the soil. Next, a small green shoot pushes upward toward the light. This baby tree, called a seedling, is incredibly fragile. A single footstep could crush it. But if the seedling survives, it will slowly grow into a sapling — a young tree with a thin trunk and a few branches. Over decades, the sapling thickens, grows taller, and develops a canopy of leaves. A mature oak tree can produce up to 70,000 acorns in a single year. Each acorn is a new seed. Most will be eaten by squirrels or fail to sprout, but a few will take root and begin the cycle again. One tree can give rise to an entire forest over centuries.",
        paragraphs: ["It begins with a single seed, no bigger than your fingernail. Inside that tiny package is everything needed to grow a tree that could live for hundreds of years.", "When conditions are right — enough water, warmth, and light — the seed cracks open and sends a tiny root downward into the soil. Next, a small green shoot pushes upward toward the light.", "This baby tree, called a seedling, is incredibly fragile. A single footstep could crush it. But if the seedling survives, it will slowly grow into a sapling — a young tree with a thin trunk and a few branches.", "Over decades, the sapling thickens, grows taller, and develops a canopy of leaves. A mature oak tree can produce up to 70,000 acorns in a single year.", "Each acorn is a new seed. Most will be eaten by squirrels or fail to sprout, but a few will take root and begin the cycle again. One tree can give rise to an entire forest over centuries."],
        vocabWords: ["sapling", "canopy", "fragile"],
        passageVisibility: "full",
        questions: [
          { q: "What is the correct order of a tree's growth?", type: "multiple_choice", choices: ["Seed → sapling → seedling → tree", "Seed → seedling → sapling → mature tree", "Seedling → seed → tree → sapling", "Tree → seed → seedling → sapling"], correct: 1, standard: "TEKS 4.6A" },
          { q: "What does 'fragile' mean?", type: "multiple_choice", choices: ["Very strong", "Easily broken or damaged", "Fast growing", "Brightly colored"], correct: 1, standard: "TEKS 4.2B" },
          { q: "How many acorns can a mature oak produce in one year?", type: "multiple_choice", choices: ["700", "7,000", "70,000", "700,000"], correct: 2, standard: "TEKS 4.6A" },
          { q: "How is this passage organized?", type: "multiple_choice", choices: ["Compare and contrast", "Sequential/chronological order", "Problem and solution", "Persuasive argument"], correct: 1, standard: "TEKS 4.9D" }
        ]
      },
      grammarSprint: {
        title: "Grammar Sprint: Prepositional Phrases",
        standard: "TEKS 4.11D",
        questions: [
          { q: "What is the prepositional phrase in: 'The cat slept under the table.'?", choices: ["The cat", "slept under", "under the table", "the table"], correct: 2, explanation: "A prepositional phrase starts with a preposition (under) and ends with its object (table)." },
          { q: "Which word is a preposition?", choices: ["Run", "Beautiful", "Between", "Quickly"], correct: 2, explanation: "Between is a preposition. Others: run (verb), beautiful (adjective), quickly (adverb)." },
          { q: "Choose the sentence with a prepositional phrase:", choices: ["She ran quickly.", "The book is interesting.", "The bird flew over the fence.", "He laughed loudly."], correct: 2, explanation: "'Over the fence' is a prepositional phrase (preposition + object)." },
          { q: "How many prepositional phrases: 'The dog ran through the park and jumped over the log.'?", choices: ["1", "2", "3", "0"], correct: 1, explanation: "Two: 'through the park' and 'over the log'." },
          { q: "Add a prepositional phrase: 'The flowers bloomed ___.'", choices: ["beautifully", "in the garden", "yesterday", "quickly"], correct: 1, explanation: "'In the garden' tells WHERE the flowers bloomed — it's a prepositional phrase." }
        ]
      },
      wolfkidEpisode: {
        title: "Episode 14: The Fossil Record",
        scenario: "The pack found fossils at two different sites. Site A has marine fossils (fish, shells). Site B, 50 miles away on a mountain, has the SAME marine fossils. Wolfkid must explain how marine fossils ended up on a mountaintop.",
        writingPrompt: "Write a CER paragraph: How did fish fossils get to the top of a mountain? Use evidence about rock layers, tectonic plates, and fossil formation.",
        data: { siteA: "sea level, limestone, fish + shell fossils", siteB: "5,000 ft elevation, same limestone, identical fossils" }
      }
    },
    Friday: {
      module: {
        title: "Friday Review — Measurement & Fossils",
        math: {
          title: "Week 14 Review",
          questions: [
            { q: "How many cups are in 1 gallon?", type: "computation", choices: ["8", "12", "16", "4"], correct: 2, standard: "TEKS 4.8A", explanation: "1 gallon = 4 quarts = 8 pints = 16 cups." },
            { q: "A basketball game starts at 7:30 PM and lasts 2 hours 15 minutes. What time does it end?", type: "word_problem", choices: ["9:30 PM", "9:45 PM", "10:00 PM", "9:15 PM"], correct: 1, standard: "TEKS 4.8C", explanation: "7:30 + 2 hours = 9:30 + 15 minutes = 9:45 PM." },
            { q: "Spiral: 468 / 6 = ?", type: "computation", choices: ["76", "78", "80", "74"], correct: 1, standard: "TEKS 4.4F", explanation: "468 / 6 = 78." },
            { q: "Spiral: Which is greater: 3/4 or 5/8?", type: "multiple_choice", choices: ["3/4", "5/8", "They are equal"], correct: 0, standard: "TEKS 4.3D", explanation: "3/4 = 6/8. Since 6/8 > 5/8, 3/4 is greater." }
          ]
        },
        science: {
          title: "Weekly Science Review",
          questions: [
            { q: "Fossils help scientists understand —", type: "multiple_choice", choices: ["Future weather", "What life was like long ago", "How to build rockets", "Current animal behavior"], correct: 1, standard: "TEKS 4.7A" },
            { q: "Spiral: Complete metamorphosis stages:", type: "multiple_choice", choices: ["Egg → adult", "Egg → larva → pupa → adult", "Egg → pupa → adult", "Egg → tadpole → adult"], correct: 1, standard: "TEKS 4.10B" }
          ]
        }
      },
      factSprint: { operation: "mixed", range: [4, 12], count: 25, timeLimit: 100 },
      writing: {
        prompt: "Free Write Friday! Imagine you are an archaeologist who just discovered a fossil of an animal no one has ever seen before. Describe the fossil, what the animal might have looked like when alive, and what its environment might have been.",
        standard: "TEKS 4.11A",
        minSentences: 10,
        skillFocus: "creative/informational"
      }
    }
  }
};

var BUGGSY_WEEK_15 = {
  child: "buggsy",
  week: 15,
  startDate: "2026-07-20",
  vocabularyOverride: [
    { word: "hypothesis", definition: "An educated guess that can be tested with an experiment", sentence: "My hypothesis is that plants grow faster in sunlight than in shade." },
    { word: "variable", definition: "Something that can change or be changed in an experiment", sentence: "The variable we changed was the amount of water each plant received." },
    { word: "reliable", definition: "Can be trusted to be accurate or correct", sentence: "We ran the experiment three times to make sure our results were reliable." },
    { word: "data", definition: "Facts, numbers, or information collected during an experiment", sentence: "We recorded all the data in a table so we could find patterns." },
    { word: "conclusion", definition: "The final decision based on evidence and data", sentence: "Our conclusion is that salt water freezes at a lower temperature." }
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
      brainBreakPrompt: "Movement time! Do the robot dance for 15 seconds, then do 5 slow deep breaths.",
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
        title: "Advanced Data & Scientific Inquiry",
        math: {
          title: "Stem-and-Leaf Plots & Mean",
          questions: [
            { q: "In a stem-and-leaf plot, the stems are 2,3,4 and the leaves for stem 3 are 1,5,7,9. What numbers does stem 3 represent?", type: "multiple_choice", choices: ["3,1,5,7,9", "31,35,37,39", "21,25,27,29", "13,15,17,19"], correct: 1, standard: "TEKS 4.8C", explanation: "Stem 3 with leaves 1,5,7,9 = 31, 35, 37, 39." },
            { q: "Find the mean (average) of: 10, 20, 30, 40, 50", type: "computation", choices: ["25", "30", "35", "40"], correct: 1, standard: "TEKS 4.8C", explanation: "Sum = 150. Count = 5. Mean = 150/5 = 30." },
            { q: "A dot plot shows: 5(2 dots), 6(4 dots), 7(3 dots), 8(1 dot). What is the median?", type: "computation", choices: ["5", "6", "7", "6.5"], correct: 1, standard: "TEKS 4.8C", explanation: "10 values sorted: 5,5,6,6,6,6,7,7,7,8. Middle = 5th and 6th = both 6. Median = 6." },
            { q: "Spiral: A store sells items for $4.75 each. You buy 8. How much total?", type: "word_problem", choices: ["$36.00", "$38.00", "$32.00", "$40.00"], correct: 1, standard: "TEKS 4.4B", explanation: "$4.75 x 8 = $38.00." },
            { q: "A student finds the mean of {12, 18, 24} and gets 24. Is this correct?", type: "error_analysis", choices: ["Yes", "No — the mean is 18", "No — the mean is 12", "No — the mean is 54"], correct: 1, standard: "TEKS 4.8C", explanation: "Sum = 54. Count = 3. Mean = 54/3 = 18. The student used the max, not the average." }
          ]
        },
        science: {
          title: "Scientific Inquiry — Designing Fair Tests",
          questions: [
            { q: "In an experiment, the variable you CHANGE on purpose is called —", type: "multiple_choice", choices: ["Dependent variable", "Independent variable", "Control variable", "Constant"], correct: 1, standard: "TEKS 4.2A", explanation: "The independent variable is what you change. The dependent variable is what you measure." },
            { q: "Why do scientists repeat experiments multiple times?", type: "multiple_choice", choices: ["Because they forgot the first time", "To make reliable results that can be trusted", "Because teachers require it", "To use more materials"], correct: 1, standard: "TEKS 4.2B", explanation: "Repeating experiments confirms that results are reliable, not just a fluke." },
            { q: "In a plant growth experiment, you change the amount of water. What should stay the SAME?", type: "multiple_choice", choices: ["The type of plant, sunlight, and soil", "Nothing — change everything", "Only the pot size", "The water amount"], correct: 0, standard: "TEKS 4.2A", explanation: "Constants (things kept the same) ensure a fair test. Only change ONE variable." }
          ]
        }
      },
      factSprint: { operation: "mixed", range: [8, 12], count: 20, timeLimit: 90 },
      vocabulary: ["hypothesis", "variable"]
    },
    Tuesday: {
      cold_passage: {
        title: "The Invention of the Telephone",
        passage: "On March 10, 1876, Alexander Graham Bell spoke the first words ever transmitted by telephone: 'Mr. Watson, come here. I want to see you.' His assistant, Thomas Watson, heard the message clearly from another room. Years of experimentation had led to this moment. Bell, a teacher of the deaf, understood how sound waves traveled through air. He believed that if sound could vibrate a thin metal disc, those vibrations could be converted to electrical signals, sent through a wire, and then converted back to sound. The path to invention was not smooth. Bell filed his patent just hours before another inventor, Elisha Gray, filed his own telephone design. Many historians still debate whether Bell or Gray should receive credit for the invention. What is certain is that the telephone transformed human communication forever. Within 50 years of Bell's first call, telephones connected millions of people across the country.",
        paragraphs: ["On March 10, 1876, Alexander Graham Bell spoke the first words ever transmitted by telephone: 'Mr. Watson, come here. I want to see you.' His assistant, Thomas Watson, heard the message clearly from another room.", "Years of experimentation had led to this moment. Bell, a teacher of the deaf, understood how sound waves traveled through air.", "He believed that if sound could vibrate a thin metal disc, those vibrations could be converted to electrical signals, sent through a wire, and then converted back to sound.", "The path to invention was not smooth. Bell filed his patent just hours before another inventor, Elisha Gray, filed his own telephone design. Many historians still debate whether Bell or Gray should receive credit for the invention.", "What is certain is that the telephone transformed human communication forever. Within 50 years of Bell's first call, telephones connected millions of people across the country."],
        vocabWords: ["transmitted", "patent", "vibrations"],
        passageVisibility: "full",
        questions: [
          { q: "When did Bell make the first telephone call?", type: "multiple_choice", choices: ["1776", "1876", "1976", "1826"], correct: 1, standard: "TEKS 4.6A" },
          { q: "What was Bell's day job?", type: "multiple_choice", choices: ["Electrician", "Teacher of the deaf", "Doctor", "Musician"], correct: 1, standard: "TEKS 4.6A" },
          { q: "What does 'transmitted' mean?", type: "multiple_choice", choices: ["Destroyed", "Sent from one place to another", "Created", "Written down"], correct: 1, standard: "TEKS 4.2B" },
          { q: "Why do historians debate who invented the telephone?", type: "multiple_choice", choices: ["No one remembers", "Bell and Gray filed patents hours apart", "Watson actually invented it", "It was invented in another country"], correct: 1, standard: "TEKS 4.6B" },
          { q: "Which statement BEST summarizes this passage?", type: "multiple_choice", choices: ["Bell invented the telephone in 1876 after years of work, though another inventor nearly beat him to it", "Alexander Graham Bell was a teacher who liked electricity", "The telephone was invented by Thomas Watson", "Many people helped invent the telephone over 50 years"], correct: 0, standard: "TEKS 4.7B" },
          { q: "What is the author's purpose?", type: "multiple_choice", choices: ["To persuade readers to use telephones", "To inform readers about the invention of the telephone", "To entertain with a fictional story", "To compare phones and radios"], correct: 1, standard: "TEKS 4.10A" }
        ]
      },
      writing: {
        prompt: "Write a well-organized paragraph about an invention that changed the world. State your opinion about which invention is MOST important and support it with at least 2 reasons. Cite specific facts.",
        standard: "TEKS 4.11B",
        minSentences: 7,
        skillFocus: "opinion + evidence"
      }
    },
    Wednesday: {
      module: {
        title: "Perimeter & Area Review + Controls",
        math: {
          title: "Perimeter, Area, and Mixed Review",
          questions: [
            { q: "A garden is 12 m long and 8 m wide. What is the area?", type: "computation", choices: ["40 sq m", "96 sq m", "20 sq m", "48 sq m"], correct: 1, standard: "TEKS 4.5C", explanation: "Area = 12 x 8 = 96 square meters." },
            { q: "Same garden — what is the perimeter?", type: "computation", choices: ["20 m", "40 m", "96 m", "48 m"], correct: 1, standard: "TEKS 4.5D", explanation: "P = 2(12) + 2(8) = 24 + 16 = 40 meters." },
            { q: "Spiral: Find the mean of {8, 12, 16, 20}.", type: "computation", choices: ["12", "14", "16", "13"], correct: 1, standard: "TEKS 4.8C", explanation: "Sum = 56. Count = 4. Mean = 56/4 = 14." },
            { q: "Spiral: 3/5 + 4/5 = ?", type: "computation", choices: ["7/10", "7/5 = 1 2/5", "1/5", "12/5"], correct: 1, standard: "TEKS 4.3E", explanation: "Same denominator: 3 + 4 = 7, so 7/5 = 1 2/5." }
          ]
        },
        science: {
          title: "Control Groups & Fair Testing",
          questions: [
            { q: "In an experiment testing if fertilizer helps plants grow, the plant WITHOUT fertilizer is called —", type: "multiple_choice", choices: ["The hypothesis", "The control group", "The variable", "The conclusion"], correct: 1, standard: "TEKS 4.2A", explanation: "The control group is the baseline — it receives no treatment so you can compare results." },
            { q: "A student tests if music helps plants grow. She plays music to Plant A but not Plant B. Plant B is the —", type: "multiple_choice", choices: ["Independent variable", "Control", "Dependent variable", "Hypothesis"], correct: 1, standard: "TEKS 4.2A", explanation: "Plant B (no music) is the control — the standard for comparison." },
            { q: "Spiral: A fish fossil in a desert tells us the area was once —", type: "multiple_choice", choices: ["A forest", "Covered by water", "A desert for millions of years", "Very hot"], correct: 1, standard: "TEKS 4.7A" }
          ]
        }
      },
      investigation: {
        prompt: "Design a FAIR TEST to answer: Does the color of light affect how fast a plant grows? You have 4 plants, colored cellophane (red, blue, green), and a clear wrap. Include your hypothesis, variables (independent, dependent, controlled), procedure, and how you will record data.",
        teks: "TEKS 4.2A, 4.2B, 4.3A",
        subject: "Science",
        materials: ["4 identical plants", "red, blue, green cellophane", "clear wrap (control)", "ruler", "data table", "lamp"],
        guideQuestions: ["What is your independent variable?", "What is your dependent variable?", "What are your constants?", "Why do you need the clear-wrap plant?"]
      }
    },
    Thursday: {
      cold_passage: {
        title: "Fireflies: Nature's Light Show",
        passage: "On warm summer evenings, fireflies put on one of nature's most magical shows. These tiny beetles produce light through a chemical reaction called bioluminescence. Inside their abdomens, a substance called luciferin combines with oxygen and an enzyme called luciferase to create a glow with almost no heat — scientists call it 'cold light.' Each species of firefly has its own unique flash pattern. Males fly through the air flashing a specific rhythm, and females on the ground respond with their own pattern. It is a conversation written in light. But not all firefly signals are friendly. Some female fireflies of the genus Photuris have learned to mimic the flash patterns of other species. When a male approaches, expecting a mate, the Photuris female captures and eats him. Scientists call them 'femme fatale fireflies.' Sadly, firefly populations are declining worldwide due to light pollution, habitat loss, and pesticide use. The very light that humans add to the night sky makes it harder for fireflies to see each other's signals.",
        paragraphs: ["On warm summer evenings, fireflies put on one of nature's most magical shows. These tiny beetles produce light through a chemical reaction called bioluminescence.", "Inside their abdomens, a substance called luciferin combines with oxygen and an enzyme called luciferase to create a glow with almost no heat — scientists call it 'cold light.'", "Each species of firefly has its own unique flash pattern. Males fly through the air flashing a specific rhythm, and females on the ground respond with their own pattern. It is a conversation written in light.", "But not all firefly signals are friendly. Some female fireflies of the genus Photuris have learned to mimic the flash patterns of other species. When a male approaches, expecting a mate, the Photuris female captures and eats him.", "Sadly, firefly populations are declining worldwide due to light pollution, habitat loss, and pesticide use. The very light that humans add to the night sky makes it harder for fireflies to see each other's signals."],
        vocabWords: ["bioluminescence", "mimic", "declining"],
        passageVisibility: "full",
        questions: [
          { q: "How do fireflies produce light?", type: "multiple_choice", choices: ["Electricity", "A chemical reaction (bioluminescence)", "Sunlight stored in their bodies", "Friction"], correct: 1, standard: "TEKS 4.6A" },
          { q: "What does 'mimic' mean?", type: "multiple_choice", choices: ["To create something new", "To copy or imitate", "To destroy", "To ignore"], correct: 1, standard: "TEKS 4.2B" },
          { q: "Why are 'femme fatale fireflies' dangerous to other fireflies?", type: "multiple_choice", choices: ["They are poisonous", "They mimic flash patterns to lure and eat males", "They are very fast", "They carry diseases"], correct: 1, standard: "TEKS 4.6B" },
          { q: "What threatens firefly populations?", type: "multiple_choice", choices: ["Cold weather only", "Light pollution, habitat loss, and pesticides", "Other insects", "Too much rain"], correct: 1, standard: "TEKS 4.6C" }
        ]
      },
      grammarSprint: {
        title: "Grammar Sprint: Verb Tenses",
        standard: "TEKS 4.11D",
        questions: [
          { q: "Which sentence is in PAST tense?", choices: ["She walks to school.", "She walked to school.", "She will walk to school.", "She is walking to school."], correct: 1, explanation: "'Walked' is past tense (-ed ending)." },
          { q: "Change to future tense: 'The dog runs in the park.'", choices: ["The dog ran in the park.", "The dog will run in the park.", "The dog running in the park.", "The dog has run in the park."], correct: 1, explanation: "'Will run' is future tense (will + base verb)." },
          { q: "Which sentence has CONSISTENT verb tense?", choices: ["She opened the door and walks inside.", "She opened the door and walked inside.", "She opens the door and walked inside.", "She will open the door and walks inside."], correct: 1, explanation: "Both verbs are past tense: opened, walked. Consistent!" },
          { q: "What tense is: 'Scientists have discovered a new species.'?", choices: ["Past", "Present", "Present perfect", "Future"], correct: 2, explanation: "'Have discovered' is present perfect — it describes a past action with present relevance." },
          { q: "Fix: 'Yesterday, I eat a sandwich and drank milk.'", choices: ["Yesterday, I ate a sandwich and drank milk.", "Yesterday, I eat a sandwich and drink milk.", "Yesterday, I eating a sandwich and drinking milk.", "Yesterday, I will eat a sandwich and drink milk."], correct: 0, explanation: "'Ate' is the past tense of 'eat' — both verbs should match (past tense)." }
        ]
      },
      wolfkidEpisode: {
        title: "Episode 15: The Experiment",
        scenario: "Wolfkid must design an experiment to test which type of soil (clay, sand, or loam) retains the most water. The pack needs this data to choose the best location for a new garden.",
        writingPrompt: "Write a full lab report: Hypothesis, Materials, Procedure (numbered steps), Data Table (predicted), and Expected Conclusion. Make sure you identify your independent and dependent variables.",
        data: { soilTypes: ["clay", "sand", "loam"], waterAmount: "200mL per sample", measurementTool: "graduated cylinder" }
      }
    },
    Friday: {
      module: {
        title: "Friday Review — Data & Inquiry",
        math: {
          title: "Week 15 Review",
          questions: [
            { q: "Find the median of {3, 7, 9, 12, 15}.", type: "computation", choices: ["7", "9", "12", "10"], correct: 1, standard: "TEKS 4.8C", explanation: "Already sorted. Middle (3rd) value = 9." },
            { q: "Spiral: A rectangle has area 84 sq cm and width 7 cm. Length?", type: "computation", choices: ["11 cm", "12 cm", "13 cm", "14 cm"], correct: 1, standard: "TEKS 4.5C", explanation: "A = l x w. 84 = l x 7. l = 12 cm." },
            { q: "In a stem-and-leaf plot, stem 5 has leaves 0,2,2,8. What is the mode?", type: "computation", choices: ["50", "52", "58", "55"], correct: 1, standard: "TEKS 4.8C", explanation: "52 appears twice (most frequent) — it is the mode." },
            { q: "Spiral: How many inches in 5 feet?", type: "computation", choices: ["50", "55", "60", "48"], correct: 2, standard: "TEKS 4.8A", explanation: "5 x 12 = 60 inches." }
          ]
        },
        science: {
          title: "Weekly Science Review",
          questions: [
            { q: "The independent variable is what you —", type: "multiple_choice", choices: ["Measure", "Keep the same", "Change on purpose", "Observe"], correct: 2, standard: "TEKS 4.2A" },
            { q: "Spiral: Older fossils are found in ___ rock layers.", type: "multiple_choice", choices: ["Upper", "Middle", "Lower", "Any"], correct: 2, standard: "TEKS 4.7A" }
          ]
        }
      },
      factSprint: { operation: "mixed", range: [6, 12], count: 30, timeLimit: 100 },
      writing: {
        prompt: "ECR Practice: A classmate says 'You only need to do an experiment once to prove your hypothesis.' Do you agree or disagree? Write a CER paragraph explaining why scientists repeat experiments and why a single trial is not enough.",
        standard: "TEKS 4.11A",
        minSentences: 6,
        skillFocus: "argumentative/CER"
      }
    }
  }
};

var BUGGSY_WEEK_16 = {
  child: "buggsy",
  week: 16,
  startDate: "2026-07-27",
  vocabularyOverride: [
    { word: "budget", definition: "A plan for how to spend and save money", sentence: "Our family budget helps us decide what to buy each month." },
    { word: "income", definition: "Money earned from working or other sources", sentence: "Dad's income comes from his job at the office." },
    { word: "expense", definition: "Money spent on things you need or want", sentence: "Rent and groceries are our biggest expenses." },
    { word: "profit", definition: "Money earned after subtracting all costs", sentence: "If you sell lemonade for $50 and your supplies cost $15, your profit is $35." },
    { word: "consumer", definition: "A person who buys and uses goods or services", sentence: "As a consumer, you have the right to return defective products." }
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
      brainBreakPrompt: "Assessment break! Pick: stretch, water, or close your eyes for 15 seconds.",
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
        title: "Financial Literacy & Science Review",
        math: {
          title: "Financial Literacy — Budgets & Expenses",
          questions: [
            { q: "Marcus earns $12 per hour and works 8 hours. After spending $45 on supplies, how much does he have left?", type: "word_problem", choices: ["$51", "$41", "$61", "$49"], correct: 0, standard: "TEKS 4.10A", explanation: "$12 x 8 = $96. $96 - $45 = $51." },
            { q: "Which is a VARIABLE expense (changes each month)?", type: "multiple_choice", choices: ["Rent ($1,200/month)", "Grocery bill", "Car payment ($350/month)", "Insurance ($200/month)"], correct: 1, standard: "TEKS 4.10B", explanation: "Grocery spending varies month to month. Rent, car payment, and insurance are fixed." },
            { q: "You have $50 to spend. You buy a book for $12.99 and lunch for $8.75. How much is left?", type: "word_problem", choices: ["$28.26", "$29.26", "$27.26", "$30.26"], correct: 0, standard: "TEKS 4.10A", explanation: "$50 - $12.99 - $8.75 = $28.26." },
            { q: "A lemonade stand earns $65 in sales. Supplies cost $20. What is the profit?", type: "word_problem", choices: ["$85", "$45", "$35", "$55"], correct: 1, standard: "TEKS 4.10A", explanation: "Profit = Revenue - Cost = $65 - $20 = $45." },
            { q: "Why is saving money important?", type: "multiple_choice", choices: ["It's not important", "To have money for emergencies and future goals", "To make banks happy", "Because the government requires it"], correct: 1, standard: "TEKS 4.10A", explanation: "Saving builds a safety net for unexpected expenses and helps reach long-term goals." }
          ]
        },
        science: {
          title: "ASSESSMENT: Cumulative Science Review (Weeks 9-15)",
          questions: [
            { q: "Which is NOT a method to separate a mixture?", type: "multiple_choice", choices: ["Evaporation", "Magnetism", "Filtering", "Photosynthesis"], correct: 3, standard: "TEKS 4.5B" },
            { q: "Heat transfers through direct contact is called —", type: "multiple_choice", choices: ["Convection", "Conduction", "Radiation", "Insulation"], correct: 1, standard: "TEKS 4.6A" },
            { q: "The independent variable is what you —", type: "multiple_choice", choices: ["Observe", "Change on purpose", "Keep the same", "Predict"], correct: 1, standard: "TEKS 4.2A" }
          ]
        }
      },
      factSprint: { operation: "mixed", range: [2, 12], count: 30, timeLimit: 120 },
      vocabulary: ["budget", "income"]
    },
    Tuesday: {
      cold_passage: {
        title: "ASSESSMENT: Extended Constructed Response",
        passage: "Climate change is one of the biggest challenges facing our planet today. Earth's average temperature has risen about 2 degrees Fahrenheit since the late 1800s. While 2 degrees might not sound like much, it has enormous effects. Glaciers are melting, sea levels are rising, and weather patterns are becoming more extreme. The main cause is the burning of fossil fuels like coal, oil, and natural gas. When these fuels burn, they release carbon dioxide and other greenhouse gases into the atmosphere. These gases trap heat from the sun, warming the planet like a blanket. Scientists around the world agree that human activities are the primary driver of recent climate change. Many solutions exist: renewable energy from solar panels and wind turbines, electric vehicles, energy-efficient buildings, and protecting forests that absorb carbon dioxide. Some countries have already made significant progress, while others are just beginning.",
        paragraphs: ["Climate change is one of the biggest challenges facing our planet today. Earth's average temperature has risen about 2 degrees Fahrenheit since the late 1800s.", "While 2 degrees might not sound like much, it has enormous effects. Glaciers are melting, sea levels are rising, and weather patterns are becoming more extreme.", "The main cause is the burning of fossil fuels like coal, oil, and natural gas. When these fuels burn, they release carbon dioxide and other greenhouse gases into the atmosphere.", "These gases trap heat from the sun, warming the planet like a blanket. Scientists around the world agree that human activities are the primary driver of recent climate change.", "Many solutions exist: renewable energy from solar panels and wind turbines, electric vehicles, energy-efficient buildings, and protecting forests that absorb carbon dioxide. Some countries have already made significant progress, while others are just beginning."],
        vocabWords: ["atmosphere", "renewable", "efficient"],
        passageVisibility: "full",
        questions: [
          { q: "How much has Earth's average temperature risen since the late 1800s?", type: "multiple_choice", choices: ["10 degrees", "2 degrees Fahrenheit", "100 degrees", "0.2 degrees"], correct: 1, standard: "TEKS 4.6A" },
          { q: "What causes greenhouse gases to increase?", type: "multiple_choice", choices: ["Planting trees", "Burning fossil fuels", "Using solar panels", "Recycling"], correct: 1, standard: "TEKS 4.6B" },
          { q: "What does 'renewable' mean in this context?", type: "multiple_choice", choices: ["Can be used once", "Can be replaced naturally and used again", "Is very expensive", "Comes from underground"], correct: 1, standard: "TEKS 4.2B" },
          { q: "What is the MAIN idea?", type: "multiple_choice", choices: ["Solar panels are expensive", "Climate change is caused primarily by human activities, but solutions exist", "The temperature rose 2 degrees", "Some countries are doing well"], correct: 1, standard: "TEKS 4.7A" },
          { q: "The author compares greenhouse gases to a blanket. This is an example of —", type: "multiple_choice", choices: ["Simile", "Metaphor", "Personification", "Alliteration"], correct: 0, standard: "TEKS 4.8A", explanation: "Uses 'like a blanket' — the word 'like' makes it a simile." },
          { q: "Which text structure does the author use MOST?", type: "multiple_choice", choices: ["Chronological order", "Compare and contrast", "Cause and effect + problem and solution", "Description only"], correct: 2, standard: "TEKS 4.9D", explanation: "The passage explains what causes climate change (cause/effect) and what solutions exist (problem/solution)." }
        ]
      },
      writing: {
        prompt: "STAAR ECR Practice: Based on the passage, explain how greenhouse gases cause climate change AND describe two solutions mentioned in the text. Use specific evidence from the passage. Write at least 3 paragraphs (intro, body, conclusion).",
        standard: "TEKS 4.11A, 4.11B",
        minSentences: 15,
        skillFocus: "STAAR ECR format"
      }
    },
    Wednesday: {
      module: {
        title: "ASSESSMENT: Cumulative Math (Weeks 9-15)",
        math: {
          title: "Cumulative Math Assessment",
          questions: [
            { q: "Round 78,345 to the nearest thousand.", type: "computation", choices: ["78,000", "78,300", "79,000", "80,000"], correct: 0, standard: "TEKS 4.2B" },
            { q: "567 / 9 = ?", type: "computation", choices: ["61", "62", "63", "64"], correct: 2, standard: "TEKS 4.4F" },
            { q: "What type of angle is 90 degrees?", type: "multiple_choice", choices: ["Acute", "Right", "Obtuse", "Straight"], correct: 1, standard: "TEKS 4.7A" },
            { q: "A garden is 15m x 9m. What is the area?", type: "computation", choices: ["24 sq m", "48 sq m", "135 sq m", "120 sq m"], correct: 2, standard: "TEKS 4.5C" }
          ]
        },
        science: {
          title: "Cumulative Science Assessment",
          questions: [
            { q: "Weathering → Erosion → ___", type: "multiple_choice", choices: ["Condensation", "Deposition", "Evaporation", "Photosynthesis"], correct: 1, standard: "TEKS 4.7B" },
            { q: "Why is a control group important in an experiment?", type: "multiple_choice", choices: ["It makes the experiment longer", "It provides a baseline for comparison", "It is required by law", "It uses more materials"], correct: 1, standard: "TEKS 4.2A" },
            { q: "Which rock type forms from layers of pressed sediment?", type: "multiple_choice", choices: ["Igneous", "Metamorphic", "Sedimentary", "Mineral"], correct: 2, standard: "TEKS 4.7A" }
          ]
        }
      },
      investigation: {
        prompt: "ASSESSMENT: Design a complete investigation to answer: Does the temperature of water affect how fast sugar dissolves? Write your hypothesis, list all variables, write a step-by-step procedure, create a data table, and state your expected conclusion.",
        teks: "TEKS 4.2A, 4.2B, 4.5A",
        subject: "Science",
        materials: ["3 cups of water (cold, room temp, hot)", "sugar", "spoon", "timer", "thermometer"],
        guideQuestions: ["What is your independent variable?", "What will you measure?", "How many trials will you run? Why?"]
      }
    },
    Thursday: {
      cold_passage: {
        title: "ASSESSMENT: Reading Analysis",
        passage: "In the small town of Millbrook, the old library was falling apart. The roof leaked, the shelves were warped, and the heating system had broken years ago. Every winter, the librarian, Ms. Chen, wore two coats while she helped visitors find books. The town council said there was no money for repairs. Then twelve-year-old Anika had an idea. She organized a read-a-thon, where students collected pledges for every book they read in a month. She printed flyers, spoke at a town meeting, and posted on the community bulletin board. Her classmates thought she was crazy — who would pay kids to read? But Anika believed in the power of a good story. By the end of the month, 87 students had participated. They read a combined 412 books and raised $14,350. The town council, inspired by the students' effort, matched the funds. Six months later, Millbrook had a beautifully renovated library with a new roof, heating system, and a children's reading corner named 'Anika's Nook.'",
        paragraphs: ["In the small town of Millbrook, the old library was falling apart. The roof leaked, the shelves were warped, and the heating system had broken years ago.", "Every winter, the librarian, Ms. Chen, wore two coats while she helped visitors find books. The town council said there was no money for repairs.", "Then twelve-year-old Anika had an idea. She organized a read-a-thon, where students collected pledges for every book they read in a month.", "She printed flyers, spoke at a town meeting, and posted on the community bulletin board. Her classmates thought she was crazy — who would pay kids to read? But Anika believed in the power of a good story.", "By the end of the month, 87 students had participated. They read a combined 412 books and raised $14,350. The town council, inspired by the students' effort, matched the funds.", "Six months later, Millbrook had a beautifully renovated library with a new roof, heating system, and a children's reading corner named 'Anika's Nook.'"],
        vocabWords: ["renovated", "pledges", "participated"],
        passageVisibility: "full",
        questions: [
          { q: "What was the MAIN problem in the story?", type: "multiple_choice", choices: ["Kids didn't want to read", "The library was falling apart and there was no money to fix it", "Ms. Chen was cold", "Anika needed a school project"], correct: 1, standard: "TEKS 4.6A" },
          { q: "What does 'renovated' mean?", type: "multiple_choice", choices: ["Torn down", "Restored and made like new", "Moved to a new location", "Painted a different color"], correct: 1, standard: "TEKS 4.2B" },
          { q: "What can you INFER about Anika's character?", type: "multiple_choice", choices: ["She gives up easily", "She is determined, creative, and a natural leader", "She doesn't like reading", "She does what her friends tell her"], correct: 1, standard: "TEKS 4.6D" },
          { q: "What is the THEME of this story?", type: "multiple_choice", choices: ["Libraries are boring", "One person's initiative can inspire a whole community", "Reading is hard work", "Town councils always help"], correct: 1, standard: "TEKS 4.7A" }
        ]
      },
      grammarSprint: {
        title: "ASSESSMENT: Grammar Cumulative (Weeks 9-15)",
        standard: "TEKS 4.11D",
        questions: [
          { q: "Which is a complex sentence?", choices: ["She ran and jumped.", "Although it rained, we played outside.", "The dog barked.", "He ate lunch."], correct: 1, explanation: "Has a dependent clause (Although it rained) + independent clause." },
          { q: "Choose the correct verb: The group of scientists ___ excited.", choices: ["are", "is", "were being", "be"], correct: 1, explanation: "'Group' is singular (collective noun) → 'is'." },
          { q: "Fix: 'Their going to they're house over there.'", choices: ["They're going to their house over there.", "There going to their house over they're.", "Their going to there house over they're.", "They're going to they're house over their."], correct: 0, explanation: "They're = they are. Their = possessive. There = location." },
          { q: "Find the prepositional phrase: 'The bird sang in the tall tree.'", choices: ["The bird", "sang in", "in the tall tree", "the tall tree"], correct: 2, explanation: "'In the tall tree' starts with preposition 'in' and ends with object 'tree'." },
          { q: "What tense: 'By next year, she will have graduated.'?", choices: ["Past", "Present", "Future", "Future perfect"], correct: 3, explanation: "'Will have graduated' = future perfect tense (completed action in the future)." }
        ]
      },
      wolfkidEpisode: {
        title: "Episode 16: The Final Report",
        scenario: "Wolfkid presents the pack's semester findings to the Council of Elders. The report must cover investigations from weeks 9-15, with data, conclusions, and recommendations for next semester.",
        writingPrompt: "Write a 4-paragraph summary report for the Council. Paragraph 1: Best investigation and why. Paragraph 2: Most surprising finding. Paragraph 3: What the pack should study next. Paragraph 4: What YOU learned about being a scientist.",
        data: { investigations: "Mixtures, erosion, insulation, inherited traits, fossil layers, fair testing, soil water retention" }
      }
    },
    Friday: {
      module: {
        title: "ASSESSMENT: Cumulative Review (All Standards)",
        math: {
          title: "Semester Assessment",
          questions: [
            { q: "4/7 + 2/7 = ?", type: "computation", choices: ["6/14", "6/7", "2/7", "8/7"], correct: 1, standard: "TEKS 4.3E" },
            { q: "Estimate 67 x 31.", type: "computation", choices: ["1,800", "2,100", "1,500", "2,400"], correct: 1, standard: "TEKS 4.4G", explanation: "67 rounds to 70, 31 rounds to 30. 70 x 30 = 2,100." },
            { q: "A rectangle: perimeter=56 cm, width=12 cm. What is the length?", type: "word_problem", choices: ["14 cm", "16 cm", "18 cm", "20 cm"], correct: 1, standard: "TEKS 4.5D", explanation: "P = 2l + 2w. 56 = 2l + 24. 2l = 32. l = 16 cm." },
            { q: "Which is a fixed expense?", type: "multiple_choice", choices: ["Movie tickets", "Monthly rent", "New shoes", "Vacation spending"], correct: 1, standard: "TEKS 4.10B" }
          ]
        },
        science: {
          title: "Semester Science Assessment",
          questions: [
            { q: "Metal is a good conductor because it —", type: "multiple_choice", choices: ["Is shiny", "Transfers heat quickly", "Is heavy", "Is magnetic"], correct: 1, standard: "TEKS 4.6A" },
            { q: "The CONTROL group in an experiment is —", type: "multiple_choice", choices: ["The group you change", "The group that stays normal for comparison", "The hypothesis", "The conclusion"], correct: 1, standard: "TEKS 4.2A" }
          ]
        }
      },
      factSprint: { operation: "mixed", range: [2, 12], count: 30, timeLimit: 120 },
      writing: {
        prompt: "SEMESTER REFLECTION: Write 3 paragraphs. (1) What subject are you strongest in and why? Give specific examples. (2) What was your biggest challenge and how did you work through it? (3) What are your goals for next semester?",
        standard: "TEKS 4.11A",
        minSentences: 15,
        skillFocus: "reflection + goal setting"
      }
    }
  }
};

// ════════════════════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ════════════════════════════════════════════════════════════════════

function getCurriculumSeedVersion() { return 9; }

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

  // Wire SpellingCatalog into each BUGGSY week before serialising
  var BUGGSY_WEEKS = [
    BUGGSY_WEEK_1, BUGGSY_WEEK_2, BUGGSY_WEEK_3, BUGGSY_WEEK_4,
    BUGGSY_WEEK_5, BUGGSY_WEEK_6, BUGGSY_WEEK_7, BUGGSY_WEEK_8,
    BUGGSY_WEEK_9, BUGGSY_WEEK_10, BUGGSY_WEEK_11, BUGGSY_WEEK_12,
    BUGGSY_WEEK_13, BUGGSY_WEEK_14, BUGGSY_WEEK_15, BUGGSY_WEEK_16
  ];
  for (var wi = 0; wi < BUGGSY_WEEKS.length; wi++) {
    var wk = BUGGSY_WEEKS[wi];
    wk.vocabulary = wk.vocabularyOverride || getSpellingWords_(wk.grade || 4, wk.week).newWords;
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

  // Buggsy Weeks 9-16 (v8)
  rows.push([9, 'buggsy', BUGGSY_WEEK_9.startDate, JSON.stringify(BUGGSY_WEEK_9)]);
  rows.push([10, 'buggsy', BUGGSY_WEEK_10.startDate, JSON.stringify(BUGGSY_WEEK_10)]);
  rows.push([11, 'buggsy', BUGGSY_WEEK_11.startDate, JSON.stringify(BUGGSY_WEEK_11)]);
  rows.push([12, 'buggsy', BUGGSY_WEEK_12.startDate, JSON.stringify(BUGGSY_WEEK_12)]);
  rows.push([13, 'buggsy', BUGGSY_WEEK_13.startDate, JSON.stringify(BUGGSY_WEEK_13)]);
  rows.push([14, 'buggsy', BUGGSY_WEEK_14.startDate, JSON.stringify(BUGGSY_WEEK_14)]);
  rows.push([15, 'buggsy', BUGGSY_WEEK_15.startDate, JSON.stringify(BUGGSY_WEEK_15)]);
  rows.push([16, 'buggsy', BUGGSY_WEEK_16.startDate, JSON.stringify(BUGGSY_WEEK_16)]);

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

// CurriculumSeed.gs — v9

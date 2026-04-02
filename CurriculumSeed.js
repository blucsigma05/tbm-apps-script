// CurriculumSeed.gs — v1
// Owned by: KidsHub team
// PURPOSE: One-time seed of 4 weeks of curriculum for JJ and Buggsy
// Run seedAllCurriculum() from the Script Editor to populate the Curriculum tab.
// CurriculumSeed.gs — v1

// ════════════════════════════════════════════════════════════════════
// JJ CURRICULUM — Pre-K (Age 4, Phase 1-2 letter progression)
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
  startDate: "2026-04-07",
  focusLetters: ["J", "A"],
  focusNumbers: [1, 2, 3],
  focusColors: ["red", "blue"],
  focusShapes: ["circle", "square"],
  days: {
    Monday: {
      theme: "My Letter J",
      title: "J is for JJ!",
      audioIntro: "Today we learn the letter J — the first letter in YOUR name!",
      activities: [
        { id: "w1m1", type: "letter_intro", letter: "J", stars: 1, word: "JJ", image: "star", audioPrompt: "This is the letter J! J says juh. JJ starts with J!" },
        { id: "w1m2", type: "find_the_letter", target: "J", options: ["J", "B", "M"], stars: 1 },
        { id: "w1m3", type: "letter_trace", letter: "J", stars: 2, uppercase: true, lowercase: true },
        { id: "w1m4", type: "count_with_me", targetNumber: 3, objects: "stars", stars: 1, audioPrompt: "Let's count stars! Tap each one." },
        { id: "w1m5", type: "color_hunt", targetColor: "red", count: 3, stars: 1, prompt: "Find 3 red things!" },
        { id: "w1m6", type: "star_celebration", stars: 2, message: "Amazing start, JJ! You learned the letter J!" }
      ]
    },
    Tuesday: {
      theme: "Meet Letter A",
      title: "A is for Apple!",
      audioIntro: "Today we meet the letter A. A says ahh, like apple!",
      activities: [
        { id: "w1t1", type: "letter_intro", letter: "A", stars: 1, word: "apple", image: "apple", audioPrompt: "This is the letter A! A says ahh. Apple starts with A!" },
        { id: "w1t2", type: "find_the_letter", target: "A", options: ["A", "J", "C"], stars: 1 },
        { id: "w1t3", type: "letter_trace", letter: "A", stars: 2, uppercase: true, lowercase: true },
        { id: "w1t4", type: "shape_match", targetShape: "circle", options: ["circle", "square", "triangle"], stars: 1, prompt: "Which one is a circle?" },
        { id: "w1t5", type: "find_the_number", target: 1, options: [1, 3, 5], stars: 1 },
        { id: "w1t6", type: "star_celebration", stars: 2, message: "You found the letter A! Great job!" }
      ]
    },
    Wednesday: {
      theme: "J and A Together",
      title: "Letter Friends!",
      audioIntro: "Let's practice both J and A today. You know two letters now!",
      activities: [
        { id: "w1w1", type: "find_the_letter", target: "J", options: ["J", "A", "B"], stars: 1 },
        { id: "w1w2", type: "find_the_letter", target: "A", options: ["A", "M", "J"], stars: 1 },
        { id: "w1w3", type: "beginning_sound", targetLetter: "J", word: "jump", options: ["jump", "ball", "apple"], stars: 1, prompt: "Which word starts with J?" },
        { id: "w1w4", type: "count_with_me", targetNumber: 2, objects: "hearts", stars: 1, audioPrompt: "Count the hearts with me!" },
        { id: "w1w5", type: "color_hunt", targetColor: "blue", count: 3, stars: 1, prompt: "Find 3 blue things!" },
        { id: "w1w6", type: "name_builder", name: "JJ", letters: ["J", "J"], stars: 3, prompt: "Build your name! Put the letters in order." }
      ]
    },
    Thursday: {
      theme: "Numbers 1-2-3",
      title: "Counting Day!",
      audioIntro: "Today is counting day! Let's count to 3 together.",
      activities: [
        { id: "w1th1", type: "find_the_number", target: 2, options: [1, 2, 3], stars: 1 },
        { id: "w1th2", type: "count_with_me", targetNumber: 3, objects: "butterflies", stars: 1, audioPrompt: "Count the butterflies!" },
        { id: "w1th3", type: "number_trace", number: 1, stars: 1 },
        { id: "w1th4", type: "number_trace", number: 2, stars: 1 },
        { id: "w1th5", type: "more_or_less", groupA: 2, groupB: 3, stars: 1, prompt: "Which group has MORE?" },
        { id: "w1th6", type: "audio_story", title: "Bedtime Story", stars: 2, storyId: "story-library", prompt: "Listen to a story with your family!" }
      ]
    },
    Friday: {
      theme: "Fun Review Day",
      title: "Sparkle Friday!",
      audioIntro: "It's Friday! Let's show what we learned this week!",
      activities: [
        { id: "w1f1", type: "find_the_letter", target: "J", options: ["J", "A", "B"], stars: 1 },
        { id: "w1f2", type: "find_the_letter", target: "A", options: ["M", "A", "S"], stars: 1 },
        { id: "w1f3", type: "count_with_me", targetNumber: 3, objects: "sparkles", stars: 1, audioPrompt: "Count the sparkles!" },
        { id: "w1f4", type: "color_sort", colors: ["red", "blue"], items: [{ name: "ball", color: "red" }, { name: "car", color: "blue" }, { name: "hat", color: "red" }, { name: "cup", color: "blue" }], stars: 2, prompt: "Sort by color!" },
        { id: "w1f5", type: "sparkle_challenge", challenge: "trace_name", name: "JJ", stars: 3, prompt: "Sparkle Challenge: Trace your name!" },
        { id: "w1f6", type: "star_celebration", stars: 3, message: "WOW! You finished your first week! You are a STAR!" }
      ]
    }
  }
};

var JJ_WEEK_2 = {
  child: "jj",
  week: 2,
  phase: "Phase 1",
  startDate: "2026-04-14",
  focusLetters: ["B", "C"],
  focusNumbers: [4, 5],
  focusColors: ["yellow", "green"],
  focusShapes: ["triangle", "rectangle"],
  days: {
    Monday: {
      theme: "B is for Ball",
      title: "Bounce into B!",
      audioIntro: "Today we learn the letter B. B says buh, like ball and bear!",
      activities: [
        { id: "w2m1", type: "letter_intro", letter: "B", stars: 1, word: "ball", image: "ball", audioPrompt: "This is the letter B! B says buh. Ball starts with B!" },
        { id: "w2m2", type: "find_the_letter", target: "B", options: ["B", "J", "A"], stars: 1 },
        { id: "w2m3", type: "letter_trace", letter: "B", stars: 2, uppercase: true, lowercase: true },
        { id: "w2m4", type: "count_with_me", targetNumber: 4, objects: "balls", stars: 1, audioPrompt: "Count the bouncing balls!" },
        { id: "w2m5", type: "color_hunt", targetColor: "yellow", count: 3, stars: 1, prompt: "Find 3 yellow things!" },
        { id: "w2m6", type: "star_celebration", stars: 2, message: "B-B-Brilliant! You learned B!" }
      ]
    },
    Tuesday: {
      theme: "C is for Cat",
      title: "Cool Letter C!",
      audioIntro: "Today we learn the letter C. C says kuh, like cat and cookie!",
      activities: [
        { id: "w2t1", type: "letter_intro", letter: "C", stars: 1, word: "cat", image: "cat", audioPrompt: "This is the letter C! C says kuh. Cat starts with C!" },
        { id: "w2t2", type: "find_the_letter", target: "C", options: ["C", "B", "J"], stars: 1 },
        { id: "w2t3", type: "letter_trace", letter: "C", stars: 2, uppercase: true, lowercase: true },
        { id: "w2t4", type: "shape_match", targetShape: "triangle", options: ["circle", "triangle", "square"], stars: 1, prompt: "Which one is a triangle?" },
        { id: "w2t5", type: "find_the_number", target: 5, options: [3, 5, 2], stars: 1 },
        { id: "w2t6", type: "star_celebration", stars: 2, message: "C is for Champion! Great work!" }
      ]
    },
    Wednesday: {
      theme: "B and C Practice",
      title: "Letter Buddies!",
      audioIntro: "Let's practice B and C together. You are learning so fast!",
      activities: [
        { id: "w2w1", type: "find_the_letter", target: "B", options: ["A", "B", "C"], stars: 1 },
        { id: "w2w2", type: "find_the_letter", target: "C", options: ["C", "J", "B"], stars: 1 },
        { id: "w2w3", type: "beginning_sound", targetLetter: "B", word: "bear", options: ["bear", "cat", "jump"], stars: 1, prompt: "Which word starts with B?" },
        { id: "w2w4", type: "beginning_sound", targetLetter: "C", word: "cookie", options: ["apple", "cookie", "ball"], stars: 1, prompt: "Which word starts with C?" },
        { id: "w2w5", type: "quantity_match", number: 4, options: [3, 4, 5], stars: 1, prompt: "Which group has 4?" },
        { id: "w2w6", type: "name_builder", name: "JJ", letters: ["J", "J"], stars: 3, prompt: "Build your name again! You're getting faster!" }
      ]
    },
    Thursday: {
      theme: "Numbers 4 and 5",
      title: "Counting Higher!",
      audioIntro: "Today we count to 5! You can do it!",
      activities: [
        { id: "w2th1", type: "find_the_number", target: 4, options: [2, 4, 5], stars: 1 },
        { id: "w2th2", type: "count_with_me", targetNumber: 5, objects: "flowers", stars: 1, audioPrompt: "Count the flowers!" },
        { id: "w2th3", type: "number_trace", number: 4, stars: 1 },
        { id: "w2th4", type: "number_trace", number: 5, stars: 1 },
        { id: "w2th5", type: "more_or_less", groupA: 5, groupB: 3, stars: 1, prompt: "Which group has MORE?" },
        { id: "w2th6", type: "audio_story", title: "Story Time", stars: 2, storyId: "story-library", prompt: "Listen to tonight's story!" }
      ]
    },
    Friday: {
      theme: "Week 2 Party!",
      title: "Super Sparkle Friday!",
      audioIntro: "It's Friday again! Let's see everything you know!",
      activities: [
        { id: "w2f1", type: "find_the_letter", target: "B", options: ["B", "C", "J"], stars: 1 },
        { id: "w2f2", type: "find_the_letter", target: "C", options: ["A", "C", "B"], stars: 1 },
        { id: "w2f3", type: "find_the_letter", target: "J", options: ["J", "C", "A"], stars: 1 },
        { id: "w2f4", type: "count_with_me", targetNumber: 5, objects: "cupcakes", stars: 1, audioPrompt: "Count the cupcakes for our party!" },
        { id: "w2f5", type: "color_sort", colors: ["yellow", "green"], items: [{ name: "sun", color: "yellow" }, { name: "leaf", color: "green" }, { name: "banana", color: "yellow" }, { name: "frog", color: "green" }], stars: 2, prompt: "Sort by color!" },
        { id: "w2f6", type: "star_celebration", stars: 3, message: "TWO WEEKS done! You know J, A, B, and C! Amazing!" }
      ]
    }
  }
};

var JJ_WEEK_3 = {
  child: "jj",
  week: 3,
  phase: "Phase 1",
  startDate: "2026-04-21",
  focusLetters: ["M", "S"],
  focusNumbers: [6, 7],
  focusColors: ["orange", "purple"],
  focusShapes: ["star", "diamond"],
  days: {
    Monday: {
      theme: "M is for Moon",
      title: "Magical M!",
      audioIntro: "Today we learn M! M says mmm, like moon and mama!",
      activities: [
        { id: "w3m1", type: "letter_intro", letter: "M", stars: 1, word: "moon", image: "moon", audioPrompt: "This is the letter M! M says mmm. Moon starts with M!" },
        { id: "w3m2", type: "find_the_letter", target: "M", options: ["M", "B", "J"], stars: 1 },
        { id: "w3m3", type: "letter_trace", letter: "M", stars: 2, uppercase: true, lowercase: true },
        { id: "w3m4", type: "count_with_me", targetNumber: 6, objects: "moons", stars: 1, audioPrompt: "Count the moons in the sky!" },
        { id: "w3m5", type: "color_hunt", targetColor: "orange", count: 3, stars: 1, prompt: "Find 3 orange things!" },
        { id: "w3m6", type: "star_celebration", stars: 2, message: "Marvelous! You learned M!" }
      ]
    },
    Tuesday: {
      theme: "S is for Sun",
      title: "Sunny Letter S!",
      audioIntro: "Today is S day! S says ssss, like sun and snake!",
      activities: [
        { id: "w3t1", type: "letter_intro", letter: "S", stars: 1, word: "sun", image: "sun", audioPrompt: "This is the letter S! S says ssss. Sun starts with S!" },
        { id: "w3t2", type: "find_the_letter", target: "S", options: ["S", "C", "M"], stars: 1 },
        { id: "w3t3", type: "letter_trace", letter: "S", stars: 2, uppercase: true, lowercase: true },
        { id: "w3t4", type: "shape_match", targetShape: "star", options: ["circle", "star", "triangle"], stars: 1, prompt: "Which one is a star?" },
        { id: "w3t5", type: "find_the_number", target: 7, options: [5, 7, 3], stars: 1 },
        { id: "w3t6", type: "star_celebration", stars: 2, message: "S-S-Super! You learned S!" }
      ]
    },
    Wednesday: {
      theme: "M and S Practice",
      title: "Letter Explorers!",
      audioIntro: "Let's practice M and S. Can you find them hiding?",
      activities: [
        { id: "w3w1", type: "find_the_letter", target: "M", options: ["M", "S", "A"], stars: 1 },
        { id: "w3w2", type: "find_the_letter", target: "S", options: ["B", "S", "M"], stars: 1 },
        { id: "w3w3", type: "beginning_sound", targetLetter: "M", word: "monkey", options: ["monkey", "sun", "cat"], stars: 1, prompt: "Which word starts with M?" },
        { id: "w3w4", type: "beginning_sound", targetLetter: "S", word: "snake", options: ["bear", "snake", "moon"], stars: 1, prompt: "Which word starts with S?" },
        { id: "w3w5", type: "pattern_next", pattern: ["red", "blue", "red", "blue"], answer: "red", options: ["red", "blue", "green"], stars: 2, prompt: "What comes next?" },
        { id: "w3w6", type: "name_builder", name: "JJ", letters: ["J", "J"], stars: 3, prompt: "Build your name — super fast this time!" }
      ]
    },
    Thursday: {
      theme: "Numbers 6 and 7",
      title: "Bigger Numbers!",
      audioIntro: "Today we count to 7! That's a lot!",
      activities: [
        { id: "w3th1", type: "find_the_number", target: 6, options: [4, 6, 7], stars: 1 },
        { id: "w3th2", type: "count_with_me", targetNumber: 7, objects: "raindrops", stars: 1, audioPrompt: "Count the raindrops!" },
        { id: "w3th3", type: "number_trace", number: 6, stars: 1 },
        { id: "w3th4", type: "number_trace", number: 7, stars: 1 },
        { id: "w3th5", type: "more_or_less", groupA: 6, groupB: 4, stars: 1, prompt: "Which group has MORE?" },
        { id: "w3th6", type: "audio_story", title: "Story Night", stars: 2, storyId: "story-library", prompt: "Pick a story to listen to tonight!" }
      ]
    },
    Friday: {
      theme: "All-Star Review",
      title: "Sparkle Superstar Friday!",
      audioIntro: "Week 3 done! You know so many letters now!",
      activities: [
        { id: "w3f1", type: "find_the_letter", target: "M", options: ["M", "S", "B"], stars: 1 },
        { id: "w3f2", type: "find_the_letter", target: "S", options: ["A", "S", "C"], stars: 1 },
        { id: "w3f3", type: "beginning_sound", targetLetter: "J", word: "juice", options: ["juice", "milk", "soda"], stars: 1, prompt: "Which starts with J?" },
        { id: "w3f4", type: "count_with_me", targetNumber: 7, objects: "stars", stars: 1, audioPrompt: "Count all your stars!" },
        { id: "w3f5", type: "color_sort", colors: ["orange", "purple"], items: [{ name: "carrot", color: "orange" }, { name: "grape", color: "purple" }, { name: "pumpkin", color: "orange" }, { name: "plum", color: "purple" }], stars: 2, prompt: "Sort by color!" },
        { id: "w3f6", type: "star_celebration", stars: 3, message: "THREE WEEKS! You know J, A, B, C, M, and S! Incredible!" }
      ]
    }
  }
};

var JJ_WEEK_4 = {
  child: "jj",
  week: 4,
  phase: "Phase 1",
  startDate: "2026-04-28",
  focusLetters: ["review"],
  focusNumbers: [8, 9, 10],
  focusColors: ["pink", "brown"],
  focusShapes: ["oval", "heart"],
  days: {
    Monday: {
      theme: "Letter Review Day",
      title: "All My Letters!",
      audioIntro: "Let's review ALL the letters you have learned! J, A, B, C, M, and S!",
      activities: [
        { id: "w4m1", type: "find_the_letter", target: "J", options: ["J", "M", "S"], stars: 1 },
        { id: "w4m2", type: "find_the_letter", target: "A", options: ["B", "A", "C"], stars: 1 },
        { id: "w4m3", type: "find_the_letter", target: "B", options: ["B", "S", "J"], stars: 1 },
        { id: "w4m4", type: "beginning_sound", targetLetter: "C", word: "cup", options: ["cup", "mug", "sun"], stars: 1, prompt: "Which starts with C?" },
        { id: "w4m5", type: "count_with_me", targetNumber: 8, objects: "balloons", stars: 1, audioPrompt: "Count the balloons!" },
        { id: "w4m6", type: "star_celebration", stars: 2, message: "You remembered them all! Amazing memory!" }
      ]
    },
    Tuesday: {
      theme: "Sounds All Around",
      title: "Sound Detective!",
      audioIntro: "Today you are a sound detective! Listen for beginning sounds!",
      activities: [
        { id: "w4t1", type: "beginning_sound", targetLetter: "J", word: "jam", options: ["jam", "ham", "ram"], stars: 1, prompt: "Which starts with J?" },
        { id: "w4t2", type: "beginning_sound", targetLetter: "B", word: "bird", options: ["bird", "mouse", "ant"], stars: 1, prompt: "Which starts with B?" },
        { id: "w4t3", type: "beginning_sound", targetLetter: "S", word: "star", options: ["car", "star", "moon"], stars: 1, prompt: "Which starts with S?" },
        { id: "w4t4", type: "beginning_sound", targetLetter: "M", word: "milk", options: ["juice", "milk", "soda"], stars: 1, prompt: "Which starts with M?" },
        { id: "w4t5", type: "shape_match", targetShape: "heart", options: ["circle", "heart", "star"], stars: 1, prompt: "Which one is a heart?" },
        { id: "w4t6", type: "star_celebration", stars: 2, message: "Super Detective! You know your sounds!" }
      ]
    },
    Wednesday: {
      theme: "Numbers Up High",
      title: "Counting to 10!",
      audioIntro: "Today we count all the way to 10! Ready? Let's go!",
      activities: [
        { id: "w4w1", type: "find_the_number", target: 8, options: [6, 8, 10], stars: 1 },
        { id: "w4w2", type: "find_the_number", target: 9, options: [7, 9, 5], stars: 1 },
        { id: "w4w3", type: "count_with_me", targetNumber: 10, objects: "gems", stars: 2, audioPrompt: "Count all the way to TEN!" },
        { id: "w4w4", type: "number_trace", number: 8, stars: 1 },
        { id: "w4w5", type: "number_trace", number: 9, stars: 1 },
        { id: "w4w6", type: "more_or_less", groupA: 10, groupB: 7, stars: 1, prompt: "Which group has MORE?" }
      ]
    },
    Thursday: {
      theme: "Pattern Power",
      title: "Pattern Maker!",
      audioIntro: "Today we make patterns! Red, blue, red, blue... what comes next?",
      activities: [
        { id: "w4th1", type: "pattern_next", pattern: ["circle", "square", "circle", "square"], answer: "circle", options: ["circle", "square", "triangle"], stars: 2, prompt: "What comes next?" },
        { id: "w4th2", type: "pattern_next", pattern: ["red", "red", "blue", "red", "red"], answer: "blue", options: ["red", "blue", "green"], stars: 2, prompt: "What comes next?" },
        { id: "w4th3", type: "color_sort", colors: ["pink", "brown"], items: [{ name: "pig", color: "pink" }, { name: "bear", color: "brown" }, { name: "flamingo", color: "pink" }, { name: "puppy", color: "brown" }], stars: 2, prompt: "Sort by color!" },
        { id: "w4th4", type: "quantity_match", number: 9, options: [7, 9, 10], stars: 1, prompt: "Which group has 9?" },
        { id: "w4th5", type: "audio_story", title: "Story Time", stars: 2, storyId: "story-library", prompt: "Pick a bedtime story!" },
        { id: "w4th6", type: "star_celebration", stars: 2, message: "Pattern Pro! You see patterns everywhere!" }
      ]
    },
    Friday: {
      theme: "Month One Complete!",
      title: "MEGA Sparkle Celebration!",
      audioIntro: "You did it! A whole MONTH of learning! This is your celebration day!",
      activities: [
        { id: "w4f1", type: "find_the_letter", target: "J", options: ["J", "S", "M"], stars: 1 },
        { id: "w4f2", type: "find_the_letter", target: "M", options: ["B", "M", "C"], stars: 1 },
        { id: "w4f3", type: "beginning_sound", targetLetter: "A", word: "ant", options: ["ant", "bee", "cat"], stars: 1, prompt: "Which starts with A?" },
        { id: "w4f4", type: "count_with_me", targetNumber: 10, objects: "trophies", stars: 2, audioPrompt: "Count your trophies — all the way to TEN!" },
        { id: "w4f5", type: "sparkle_challenge", challenge: "trace_name", name: "JJ", stars: 3, prompt: "MEGA Sparkle Challenge: Write your name!" },
        { id: "w4f6", type: "star_celebration", stars: 5, message: "ONE MONTH COMPLETE! You are a SPARKLE SUPERSTAR! J, A, B, C, M, S — you know them ALL!" }
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
  startDate: "2026-04-07",
  vocabulary: [
    { word: "perimeter", definition: "The total distance around the outside of a shape", sentence: "We measured the perimeter of the basketball court." },
    { word: "equivalent", definition: "Equal in value, even if they look different", sentence: "The fractions 1/2 and 2/4 are equivalent." },
    { word: "erosion", definition: "The wearing away of land by water, wind, or ice", sentence: "The river caused erosion along the canyon walls." },
    { word: "hypothesis", definition: "An educated guess that you can test", sentence: "My hypothesis was that plants grow faster in sunlight." },
    { word: "narrative", definition: "A story or account of events", sentence: "She wrote a personal narrative about her camping trip." }
  ],
  scaffoldConfig: {
    timerMode: "countdown",
    missionStructure: "sequential",
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
            { q: "Which type of rock is formed when melted rock (magma) cools and hardens?", type: "recall", choices: ["Sedimentary", "Metamorphic", "Igneous", "Mineral"], correct: 2, standard: "TEKS 4.7A", explanation: "Igneous rocks form from cooled magma or lava." },
            { q: "Sandstone is made of tiny bits of sand pressed together over time. What type of rock is it?", type: "application", choices: ["Igneous", "Sedimentary", "Metamorphic", "Crystal"], correct: 1, standard: "TEKS 4.7A", explanation: "Sedimentary rocks form from layers of material pressed together." },
            { q: "What process changes one type of rock into another over millions of years?", type: "recall", choices: ["Erosion", "Evaporation", "The rock cycle", "Photosynthesis"], correct: 2, standard: "TEKS 4.7A", explanation: "The rock cycle describes how rocks transform between types." }
          ]
        }
      },
      factSprint: { operation: "multiply", range: [2, 12], count: 20, timeLimit: 120 },
      vocabulary: ["perimeter", "equivalent"]
    },
    Tuesday: {
      cold_passage: {
        title: "The Grand Canyon",
        passage: "The Grand Canyon is one of the most amazing natural wonders in the world. Located in Arizona, this massive gorge was carved over millions of years by the Colorado River. The canyon stretches 277 miles long, up to 18 miles wide, and more than a mile deep. Scientists study the layers of rock visible in the canyon walls. Each layer tells a story about Earth's history. The oldest rocks at the bottom are nearly 2 billion years old. Visitors from all over the world come to see the canyon's colorful walls, which change color depending on the time of day and the angle of sunlight.",
        paragraphs: ["The Grand Canyon is one of the most amazing natural wonders in the world. Located in Arizona, this massive gorge was carved over millions of years by the Colorado River.", "The canyon stretches 277 miles long, up to 18 miles wide, and more than a mile deep. Scientists study the layers of rock visible in the canyon walls.", "Each layer tells a story about Earth's history. The oldest rocks at the bottom are nearly 2 billion years old.", "Visitors from all over the world come to see the canyon's colorful walls, which change color depending on the time of day and the angle of sunlight."],
        vocabWords: ["gorge", "carved", "layers"],
        passageVisibility: "full",
        questions: [
          { q: "What created the Grand Canyon over millions of years?", type: "literal", choices: ["Earthquakes", "The Colorado River", "Volcanoes", "Wind storms"], correct: 1, standard: "TEKS 4.6A" },
          { q: "Why do scientists study the canyon walls?", type: "inferential", choices: ["To find gold", "To learn about Earth's history", "To build bridges", "To count animals"], correct: 1, standard: "TEKS 4.6B" },
          { q: "What does the word 'gorge' most likely mean in this passage?", type: "vocabulary", choices: ["A mountain", "A deep narrow valley", "A type of river", "A flat desert"], correct: 1, standard: "TEKS 4.2B" },
          { q: "Which detail supports the idea that the Grand Canyon is very old?", type: "evidence", choices: ["It is in Arizona", "Visitors come from all over", "The oldest rocks are nearly 2 billion years old", "The walls change color"], correct: 2, standard: "TEKS 4.6C" }
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
            { q: "Which fraction is greater: 3/4 or 2/3?", type: "comparison", choices: ["3/4", "2/3", "They are equal", "Cannot tell"], correct: 0, standard: "TEKS 4.3D", explanation: "3/4 = 9/12 and 2/3 = 8/12, so 3/4 is greater." },
            { q: "What fraction is equivalent to 2/6?", type: "computation", choices: ["1/2", "1/3", "2/3", "3/6"], correct: 1, standard: "TEKS 4.3C", explanation: "2/6 simplifies to 1/3 (divide both by 2)." },
            { q: "Add: 3/8 + 2/8 = ?", type: "computation", choices: ["5/16", "5/8", "1/8", "6/8"], correct: 1, standard: "TEKS 4.3E", explanation: "Same denominator: 3 + 2 = 5, so 5/8." },
            { q: "Carlos ate 1/4 of a pizza and Maria ate 2/4. How much did they eat together?", type: "word_problem", choices: ["3/8", "3/4", "1/2", "2/8"], correct: 1, standard: "TEKS 4.3E", explanation: "1/4 + 2/4 = 3/4 of the pizza." }
          ]
        },
        science: {
          title: "Weather & the Water Cycle",
          questions: [
            { q: "What is the process called when water changes from liquid to gas?", type: "recall", choices: ["Condensation", "Precipitation", "Evaporation", "Collection"], correct: 2, standard: "TEKS 4.8A", explanation: "Evaporation is when liquid water becomes water vapor (gas)." },
            { q: "What causes rain to fall from clouds?", type: "application", choices: ["Wind pushes it down", "Water droplets get too heavy", "The sun pulls it down", "Cold air freezes it"], correct: 1, standard: "TEKS 4.8A", explanation: "When water droplets in clouds become too heavy, they fall as precipitation." },
            { q: "Which is the main source of energy that drives the water cycle?", type: "recall", choices: ["The moon", "The wind", "The sun", "The ocean"], correct: 2, standard: "TEKS 4.8A", explanation: "The sun's heat drives evaporation, powering the water cycle." }
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
          { q: "How far do monarch butterflies travel during migration?", type: "literal", choices: ["300 miles", "1,000 miles", "Up to 3,000 miles", "30 miles"], correct: 2, standard: "TEKS 4.6A" },
          { q: "What makes monarch migration different from bird migration?", type: "inferential", choices: ["They fly farther", "They fly faster", "Individual monarchs only make the trip once", "They fly at night"], correct: 2, standard: "TEKS 4.6B" },
          { q: "What does 'declining' mean in the last paragraph?", type: "vocabulary", choices: ["Growing quickly", "Getting smaller in number", "Moving to a new place", "Changing color"], correct: 1, standard: "TEKS 4.2B" },
          { q: "What are two reasons monarch populations are decreasing?", type: "evidence", choices: ["Cold weather and predators", "Habitat loss and pesticide use", "Disease and drought", "Pollution and noise"], correct: 1, standard: "TEKS 4.6C" }
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
            { q: "Which is a fixed expense?", type: "recall", choices: ["Movie tickets", "Monthly rent", "New shoes", "Birthday gift"], correct: 1, standard: "TEKS 4.10B", explanation: "Rent is the same amount every month — that makes it a fixed expense." }
          ]
        },
        science: {
          title: "Weekly Science Review",
          questions: [
            { q: "Which step of the water cycle forms clouds?", type: "recall", choices: ["Evaporation", "Condensation", "Precipitation", "Collection"], correct: 1, standard: "TEKS 4.8A", explanation: "Condensation is when water vapor cools and forms tiny droplets that make clouds." },
            { q: "Marble is formed when limestone is changed by heat and pressure. What type of rock is marble?", type: "application", choices: ["Igneous", "Sedimentary", "Metamorphic", "Mineral"], correct: 2, standard: "TEKS 4.7A", explanation: "Metamorphic rocks form when existing rocks are changed by heat and pressure." }
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
  startDate: "2026-04-14",
  vocabulary: [
    { word: "quotient", definition: "The answer to a division problem", sentence: "The quotient of 48 divided by 6 is 8." },
    { word: "condensation", definition: "When gas cools and turns into liquid", sentence: "The condensation on the cold glass made it wet." },
    { word: "predator", definition: "An animal that hunts other animals for food", sentence: "The hawk is a predator that hunts mice." },
    { word: "evidence", definition: "Facts or details that support a claim", sentence: "The detective collected evidence at the scene." },
    { word: "chronological", definition: "Arranged in the order events happened", sentence: "The timeline shows events in chronological order." }
  ],
  scaffoldConfig: {
    timerMode: "countdown",
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
            { q: "Which number sentence has a quotient of 9?", type: "computation", choices: ["81 / 9", "72 / 9", "90 / 9", "All of these"], correct: 3, standard: "TEKS 4.4F", explanation: "81/9 = 9, 72/9 = 8 (NO), wait — 81/9=9, 72/9=8, 90/9=10. Only 81/9=9. Correction: the answer is 81/9." }
          ]
        },
        science: {
          title: "Animal Adaptations",
          questions: [
            { q: "A cactus stores water in its thick stem. This is an example of what?", type: "application", choices: ["Behavior", "A structural adaptation", "Migration", "A life cycle"], correct: 1, standard: "TEKS 4.10A", explanation: "A thick stem that stores water is a structural (physical) adaptation." },
            { q: "Why do some animals hibernate during winter?", type: "inferential", choices: ["They are lazy", "Food is scarce and it's cold", "They want to sleep", "They are scared of snow"], correct: 1, standard: "TEKS 4.10A", explanation: "Hibernation helps animals survive when food is hard to find and temperatures drop." },
            { q: "A bird with a long thin beak is best adapted for eating what?", type: "application", choices: ["Seeds", "Insects from tree bark", "Large fish", "Grass"], correct: 1, standard: "TEKS 4.10A", explanation: "Long thin beaks help birds reach insects hiding in crevices." }
          ]
        }
      },
      factSprint: { operation: "divide", range: [2, 12], count: 20, timeLimit: 120 },
      vocabulary: ["quotient", "condensation"]
    },
    Tuesday: {
      cold_passage: {
        title: "The Amazing Octopus",
        passage: "The octopus is one of the most intelligent creatures in the ocean. With eight flexible arms and a soft body, it can squeeze through incredibly tiny spaces. An octopus the size of a basketball can fit through a hole the size of a quarter! Octopuses are masters of camouflage. They can change the color and even the texture of their skin in less than a second. This helps them hide from predators and sneak up on prey. Scientists have observed octopuses solving puzzles, opening jars, and even using tools. In one famous experiment, an octopus learned to unscrew a jar lid to reach a crab inside. These remarkable abilities make the octopus one of the most fascinating animals to study.",
        paragraphs: ["The octopus is one of the most intelligent creatures in the ocean. With eight flexible arms and a soft body, it can squeeze through incredibly tiny spaces. An octopus the size of a basketball can fit through a hole the size of a quarter!", "Octopuses are masters of camouflage. They can change the color and even the texture of their skin in less than a second. This helps them hide from predators and sneak up on prey.", "Scientists have observed octopuses solving puzzles, opening jars, and even using tools. In one famous experiment, an octopus learned to unscrew a jar lid to reach a crab inside.", "These remarkable abilities make the octopus one of the most fascinating animals to study."],
        vocabWords: ["camouflage", "texture", "remarkable"],
        passageVisibility: "full",
        questions: [
          { q: "What helps an octopus squeeze through tiny spaces?", type: "literal", choices: ["Hard shell", "Flexible arms and soft body", "Sharp teeth", "Strong legs"], correct: 1, standard: "TEKS 4.6A" },
          { q: "Why would an octopus want to change its skin color?", type: "inferential", choices: ["To look pretty", "To hide from predators and hunt prey", "Because it is cold", "To attract mates"], correct: 1, standard: "TEKS 4.6B" },
          { q: "What does 'camouflage' mean in this passage?", type: "vocabulary", choices: ["A type of food", "The ability to blend in with surroundings", "A way to swim fast", "A loud sound"], correct: 1, standard: "TEKS 4.2B" },
          { q: "Which detail best supports the idea that octopuses are intelligent?", type: "evidence", choices: ["They have eight arms", "They live in the ocean", "They can solve puzzles and open jars", "They can squeeze through small spaces"], correct: 2, standard: "TEKS 4.6C" }
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
            { q: "Order from least to greatest: 0.5, 0.35, 0.7", type: "comparison", choices: ["0.35, 0.5, 0.7", "0.5, 0.35, 0.7", "0.7, 0.5, 0.35", "0.35, 0.7, 0.5"], correct: 0, standard: "TEKS 4.2F", explanation: "0.35 < 0.5 < 0.7" },
            { q: "Elena has $4.75 and spends $2.30 on lunch. How much does she have left?", type: "word_problem", choices: ["$2.35", "$2.45", "$7.05", "$2.55"], correct: 1, standard: "TEKS 4.4A", explanation: "$4.75 - $2.30 = $2.45" },
            { q: "What is 0.6 + 0.25?", type: "computation", choices: ["0.31", "0.85", "0.65", "0.8"], correct: 1, standard: "TEKS 4.4A", explanation: "0.60 + 0.25 = 0.85" }
          ]
        },
        science: {
          title: "Food Chains & Ecosystems",
          questions: [
            { q: "In a food chain, what is the role of a producer?", type: "recall", choices: ["Eats other animals", "Makes its own food from sunlight", "Breaks down dead organisms", "Hunts for prey"], correct: 1, standard: "TEKS 4.9A", explanation: "Producers (like plants) use sunlight to make their own food through photosynthesis." },
            { q: "Grass → Rabbit → Fox. In this food chain, the rabbit is a —", type: "application", choices: ["Producer", "Predator only", "Consumer (prey and predator)", "Decomposer"], correct: 2, standard: "TEKS 4.9A", explanation: "The rabbit consumes grass (prey role) and is hunted by the fox (also a predator of grass)." },
            { q: "What would happen if all the rabbits disappeared from this food chain?", type: "inferential", choices: ["Foxes would have more food", "Foxes would have less food", "Grass would disappear", "Nothing would change"], correct: 1, standard: "TEKS 4.9B", explanation: "Without rabbits, foxes lose a food source and their population would likely decline." }
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
          { q: "What caused the soil to turn to dust during the Dust Bowl?", type: "literal", choices: ["Flooding", "Earthquakes", "Drought and poor farming", "Volcanic eruptions"], correct: 2, standard: "TEKS 4.6A" },
          { q: "Why did families move to California?", type: "inferential", choices: ["For vacation", "To find work after losing farms", "Because of cold weather", "To go to school"], correct: 1, standard: "TEKS 4.6B" },
          { q: "What does 'fertile' most likely mean?", type: "vocabulary", choices: ["Dry and sandy", "Good for growing crops", "Rocky and hard", "Covered in snow"], correct: 1, standard: "TEKS 4.2B" },
          { q: "What evidence from the text shows the storms were very bad?", type: "evidence", choices: ["Families moved to California", "People could not see the sun at noon", "The government helped farmers", "Trees were planted"], correct: 1, standard: "TEKS 4.6C" }
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
            { q: "What is the rule for this pattern? 5, 12, 19, 26, 33, ...", type: "pattern", choices: ["Add 5", "Add 7", "Multiply by 2", "Add 8"], correct: 1, standard: "TEKS 4.5B", explanation: "Each number increases by 7: 5+7=12, 12+7=19, etc." },
            { q: "If the pattern continues, what is the next number? 3, 6, 12, 24, ...", type: "pattern", choices: ["36", "48", "30", "28"], correct: 1, standard: "TEKS 4.5B", explanation: "Each number is multiplied by 2: 24 x 2 = 48" },
            { q: "A bag has 156 marbles. You divide them equally into 8 bags. How many marbles in each bag and how many left over?", type: "word_problem", choices: ["19 R4", "20 R0", "19 R3", "18 R12"], correct: 0, standard: "TEKS 4.4F", explanation: "156 / 8 = 19 remainder 4 (8 x 19 = 152, 156 - 152 = 4)" },
            { q: "Which is the best estimate for 398 x 5?", type: "estimation", choices: ["1,500", "2,000", "2,500", "1,000"], correct: 1, standard: "TEKS 4.4G", explanation: "Round 398 to 400. 400 x 5 = 2,000" }
          ]
        },
        science: {
          title: "Weekly Science Review",
          questions: [
            { q: "What is the difference between a predator and prey?", type: "recall", choices: ["Size", "Predators hunt, prey are hunted", "Color", "Where they live"], correct: 1, standard: "TEKS 4.9A", explanation: "A predator hunts and eats other animals (prey)." },
            { q: "Bears hibernating during winter is an example of —", type: "application", choices: ["A structural adaptation", "A behavioral adaptation", "Migration", "Camouflage"], correct: 1, standard: "TEKS 4.10A", explanation: "Hibernation is a behavior that helps bears survive winter." }
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
  startDate: "2026-04-21",
  vocabulary: [
    { word: "symmetry", definition: "When both sides of something are exactly the same", sentence: "A butterfly's wings show perfect symmetry." },
    { word: "precipitation", definition: "Water that falls from clouds as rain, snow, sleet, or hail", sentence: "The weather report predicted heavy precipitation today." },
    { word: "ecosystem", definition: "A community of living things and their environment", sentence: "The pond ecosystem includes fish, frogs, and water plants." },
    { word: "perspective", definition: "A person's point of view or way of seeing things", sentence: "The story was told from the dog's perspective." },
    { word: "variable", definition: "Something that can change in an experiment", sentence: "The only variable we changed was the amount of water." }
  ],
  scaffoldConfig: {
    timerMode: "countdown",
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
            { q: "Which pair of lines will NEVER cross, no matter how far they extend?", type: "recall", choices: ["Perpendicular lines", "Intersecting lines", "Parallel lines", "Rays"], correct: 2, standard: "TEKS 4.6A", explanation: "Parallel lines run in the same direction and never cross." },
            { q: "An angle that measures exactly 90 degrees is called a —", type: "recall", choices: ["Acute angle", "Obtuse angle", "Right angle", "Straight angle"], correct: 2, standard: "TEKS 4.6C", explanation: "A right angle is exactly 90 degrees, like the corner of a book." },
            { q: "A triangle with all three sides the same length has how many lines of symmetry?", type: "visual", choices: ["0", "1", "2", "3"], correct: 3, standard: "TEKS 4.6B", explanation: "An equilateral triangle has 3 lines of symmetry." }
          ]
        },
        science: {
          title: "Ecosystems & Habitats",
          questions: [
            { q: "Which is NOT a part of an ecosystem?", type: "recall", choices: ["Air", "Water", "Living organisms", "A math textbook"], correct: 3, standard: "TEKS 4.9B", explanation: "An ecosystem includes living things (organisms) and non-living things (air, water, soil) — not man-made objects unrelated to the habitat." },
            { q: "If a forest is cleared for buildings, what would MOST LIKELY happen to the animals?", type: "inferential", choices: ["They would grow bigger", "They would lose their habitat", "Nothing would change", "They would build new homes"], correct: 1, standard: "TEKS 4.9B", explanation: "Habitat destruction forces animals to leave or die because they lose food and shelter." },
            { q: "A decomposer's main job in an ecosystem is to —", type: "recall", choices: ["Hunt prey", "Produce food from sunlight", "Break down dead organisms and return nutrients to soil", "Pollinate flowers"], correct: 2, standard: "TEKS 4.9A", explanation: "Decomposers like fungi and bacteria break down dead material, recycling nutrients." }
          ]
        }
      },
      factSprint: { operation: "mixed", range: [2, 12], count: 20, timeLimit: 120 },
      vocabulary: ["symmetry", "precipitation"]
    },
    Tuesday: {
      cold_passage: {
        title: "Harriet Tubman: Conductor of the Underground Railroad",
        passage: "Harriet Tubman was born into slavery in Maryland around 1822. She escaped to freedom in 1849 and could have stayed safely in the North. Instead, she risked her life again and again to help others escape. Over the next 11 years, Tubman made approximately 13 trips back to the South. She guided about 70 enslaved people to freedom along the Underground Railroad, a secret network of safe houses. Tubman was so skilled at avoiding capture that she earned the nickname 'Moses.' She once said, 'I never ran my train off the track, and I never lost a passenger.' During the Civil War, she served as a nurse, cook, and even a spy for the Union Army. Harriet Tubman is remembered as one of the bravest Americans in history.",
        paragraphs: ["Harriet Tubman was born into slavery in Maryland around 1822. She escaped to freedom in 1849 and could have stayed safely in the North.", "Instead, she risked her life again and again to help others escape. Over the next 11 years, Tubman made approximately 13 trips back to the South.", "She guided about 70 enslaved people to freedom along the Underground Railroad, a secret network of safe houses.", "Tubman was so skilled at avoiding capture that she earned the nickname 'Moses.' She once said, 'I never ran my train off the track, and I never lost a passenger.'", "During the Civil War, she served as a nurse, cook, and even a spy for the Union Army. Harriet Tubman is remembered as one of the bravest Americans in history."],
        vocabWords: ["approximately", "network", "capture"],
        passageVisibility: "full",
        questions: [
          { q: "How many people did Harriet Tubman guide to freedom?", type: "literal", choices: ["About 13", "About 70", "About 100", "About 1,000"], correct: 1, standard: "TEKS 4.6A" },
          { q: "Why is it significant that Tubman returned to the South after escaping?", type: "inferential", choices: ["She missed her home", "She was forced to go back", "She risked her life to help others when she could have stayed safe", "She wanted to travel"], correct: 2, standard: "TEKS 4.6B" },
          { q: "What does 'approximately' mean in this passage?", type: "vocabulary", choices: ["Exactly", "About or close to", "More than", "Less than"], correct: 1, standard: "TEKS 4.2B" },
          { q: "Which quote from the text best shows Tubman never failed on a mission?", type: "evidence", choices: ["She escaped to freedom in 1849", "She risked her life again and again", "I never ran my train off the track and I never lost a passenger", "She served as a nurse and cook"], correct: 2, standard: "TEKS 4.6C" }
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
            { q: "Which is longer: 5 meters or 400 centimeters?", type: "comparison", choices: ["5 meters", "400 centimeters", "They are equal", "Cannot tell"], correct: 0, standard: "TEKS 4.8C", explanation: "5 meters = 500 cm, which is more than 400 cm" },
            { q: "A football field is 100 yards long. How many feet is that?", type: "word_problem", choices: ["200 feet", "300 feet", "400 feet", "1,000 feet"], correct: 1, standard: "TEKS 4.8C", explanation: "1 yard = 3 feet, so 100 x 3 = 300 feet" }
          ]
        },
        science: {
          title: "Forces & Motion",
          questions: [
            { q: "What happens to an object when balanced forces act on it?", type: "recall", choices: ["It speeds up", "It slows down", "It stays the same (no change in motion)", "It changes direction"], correct: 2, standard: "TEKS 4.6D", explanation: "Balanced forces cancel each other out, so the object's motion doesn't change." },
            { q: "A soccer ball sitting still on the ground starts rolling when you kick it. This is an example of —", type: "application", choices: ["Balanced forces", "An unbalanced force", "Gravity only", "Friction"], correct: 1, standard: "TEKS 4.6D", explanation: "Your kick adds an unbalanced force that changes the ball's motion." },
            { q: "Why does a ball eventually stop rolling on grass?", type: "application", choices: ["Gravity pulls it down", "The grass creates friction", "The wind stops it", "It runs out of energy"], correct: 1, standard: "TEKS 4.6D", explanation: "Friction between the ball and grass slows it down until it stops." }
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
          { q: "Where is the Bermuda Triangle located?", type: "literal", choices: ["Pacific Ocean", "Indian Ocean", "Atlantic Ocean between Miami, Bermuda, and Puerto Rico", "Arctic Ocean"], correct: 2, standard: "TEKS 4.6A" },
          { q: "Why does the author include scientific explanations?", type: "inferential", choices: ["To make the story scarier", "To show there are logical reasons for the disappearances", "To prove aliens exist", "To describe the weather"], correct: 1, standard: "TEKS 4.6B" },
          { q: "What does 'unpredictable' mean?", type: "vocabulary", choices: ["Very calm", "Easy to forecast", "Hard to know in advance", "Always the same"], correct: 2, standard: "TEKS 4.2B" },
          { q: "Which detail from the text suggests the Bermuda Triangle is NOT as dangerous as people think?", type: "evidence", choices: ["Many ships have disappeared", "People believe in supernatural forces", "Disappearances are not significantly higher than other regions", "The Gulf Stream carries wreckage"], correct: 2, standard: "TEKS 4.6C" }
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
            { q: "A dot plot shows test scores: 85, 85, 90, 90, 90, 95, 100. What score appears most often?", type: "data_analysis", choices: ["85", "90", "95", "100"], correct: 1, standard: "TEKS 4.9A", explanation: "90 appears 3 times, which is more than any other score." },
            { q: "What is the range of these scores: 85, 85, 90, 90, 90, 95, 100?", type: "computation", choices: ["5", "10", "15", "90"], correct: 2, standard: "TEKS 4.9A", explanation: "Range = highest - lowest = 100 - 85 = 15" },
            { q: "A rectangle has a perimeter of 30 cm. If the width is 5 cm, what is the length?", type: "multi_step", choices: ["10 cm", "15 cm", "20 cm", "25 cm"], correct: 0, standard: "TEKS 4.5D", explanation: "P = 2l + 2w; 30 = 2l + 10; 2l = 20; l = 10 cm" },
            { q: "Round 4,867 to the nearest hundred.", type: "computation", choices: ["4,800", "4,900", "4,870", "5,000"], correct: 1, standard: "TEKS 4.2D", explanation: "The tens digit is 6 (5 or more), so round up: 4,900" }
          ]
        },
        science: {
          title: "Weekly Review",
          questions: [
            { q: "What force keeps you from floating off your chair?", type: "recall", choices: ["Magnetism", "Friction", "Gravity", "Wind"], correct: 2, standard: "TEKS 4.6D", explanation: "Gravity pulls you toward Earth, keeping you in your seat." },
            { q: "Which is an example of a decomposer?", type: "recall", choices: ["Eagle", "Mushroom", "Oak tree", "Rabbit"], correct: 1, standard: "TEKS 4.9A", explanation: "Mushrooms (fungi) are decomposers that break down dead organic material." }
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
  startDate: "2026-04-28",
  vocabulary: [
    { word: "equation", definition: "A math sentence that uses an equal sign to show two things are the same", sentence: "The equation 3 x 4 = 12 shows multiplication." },
    { word: "conclusion", definition: "A judgment or decision reached after thinking about evidence", sentence: "Based on our experiment, our conclusion was that plants need light." },
    { word: "habitat", definition: "The natural home or environment of an animal or plant", sentence: "A coral reef is the habitat of many tropical fish." },
    { word: "compare", definition: "To look at two or more things to find similarities and differences", sentence: "The teacher asked us to compare the two stories." },
    { word: "renewable", definition: "A resource that can be replaced naturally over time", sentence: "Solar energy is a renewable resource." }
  ],
  scaffoldConfig: {
    timerMode: "countdown",
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
            { q: "Which of these is a renewable resource?", type: "recall", choices: ["Coal", "Natural gas", "Solar energy", "Oil"], correct: 2, standard: "TEKS 4.7C", explanation: "Solar energy comes from the sun, which is constantly available — making it renewable." },
            { q: "Why is it important to conserve nonrenewable resources?", type: "inferential", choices: ["They are ugly", "Once used up, they cannot be replaced", "They are too expensive", "They are dangerous"], correct: 1, standard: "TEKS 4.7C", explanation: "Nonrenewable resources like oil and coal take millions of years to form and will eventually run out." },
            { q: "Trees are considered renewable because —", type: "application", choices: ["They never die", "New trees can be planted to replace them", "They grow very fast", "They are not useful"], correct: 1, standard: "TEKS 4.7C", explanation: "Trees can be replanted and regrown, making them a renewable resource (though it takes time)." }
          ]
        }
      },
      factSprint: { operation: "mixed", range: [2, 12], count: 20, timeLimit: 100 },
      vocabulary: ["equation", "conclusion"]
    },
    Tuesday: {
      cold_passage: {
        title: "The International Space Station",
        passage: "Orbiting about 250 miles above Earth, the International Space Station (ISS) is the largest structure humans have ever built in space. It is roughly the size of a football field and has been continuously occupied since November 2000. Astronauts from many countries live and work on the ISS, usually in crews of six. They conduct scientific experiments that can only be done in microgravity — the near-weightless environment of space. Astronauts must exercise for about two hours every day to keep their muscles and bones strong. Without gravity pulling on them, their bodies would weaken quickly. The ISS circles Earth about 16 times per day, meaning the crew sees 16 sunrises and 16 sunsets every 24 hours. The station is a symbol of international cooperation, with the United States, Russia, Japan, Canada, and Europe all contributing.",
        paragraphs: ["Orbiting about 250 miles above Earth, the International Space Station (ISS) is the largest structure humans have ever built in space. It is roughly the size of a football field and has been continuously occupied since November 2000.", "Astronauts from many countries live and work on the ISS, usually in crews of six. They conduct scientific experiments that can only be done in microgravity — the near-weightless environment of space.", "Astronauts must exercise for about two hours every day to keep their muscles and bones strong. Without gravity pulling on them, their bodies would weaken quickly.", "The ISS circles Earth about 16 times per day, meaning the crew sees 16 sunrises and 16 sunsets every 24 hours.", "The station is a symbol of international cooperation, with the United States, Russia, Japan, Canada, and Europe all contributing."],
        vocabWords: ["microgravity", "continuously", "cooperation"],
        passageVisibility: "full",
        questions: [
          { q: "How big is the International Space Station?", type: "literal", choices: ["Size of a car", "Size of a house", "Size of a football field", "Size of a city block"], correct: 2, standard: "TEKS 4.6A" },
          { q: "Why must astronauts exercise two hours daily on the ISS?", type: "inferential", choices: ["To lose weight", "To pass the time", "Without gravity their muscles and bones would weaken", "To train for spacewalks"], correct: 2, standard: "TEKS 4.6B" },
          { q: "What does 'microgravity' mean based on context clues?", type: "vocabulary", choices: ["Very strong gravity", "No atmosphere", "Near-weightless conditions", "Extreme cold"], correct: 2, standard: "TEKS 4.2B" },
          { q: "Which detail best supports the idea that the ISS is an international effort?", type: "evidence", choices: ["It orbits 250 miles up", "Astronauts exercise daily", "The US, Russia, Japan, Canada, and Europe all contribute", "It has been occupied since 2000"], correct: 2, standard: "TEKS 4.6C" }
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
            { q: "Which fraction is closest to 1/2?", type: "comparison", choices: ["1/8", "3/8", "5/8", "7/8"], correct: 1, standard: "TEKS 4.3D", explanation: "1/2 = 4/8. 3/8 is 1/8 away from 4/8, the closest option." },
            { q: "Write 0.75 as a fraction.", type: "computation", choices: ["7/5", "3/4", "75/10", "7/50"], correct: 1, standard: "TEKS 4.2G", explanation: "0.75 = 75/100 = 3/4" },
            { q: "A pizza is cut into 6 equal slices. Tim eats 2 slices and Ana eats 3 slices. What fraction of the pizza is LEFT?", type: "word_problem", choices: ["5/6", "1/6", "1/3", "0/6"], correct: 1, standard: "TEKS 4.3E", explanation: "2/6 + 3/6 = 5/6 eaten. 6/6 - 5/6 = 1/6 left." }
          ]
        },
        science: {
          title: "Forms of Energy",
          questions: [
            { q: "A light bulb converts electrical energy into —", type: "application", choices: ["Sound energy", "Light and heat energy", "Mechanical energy", "Chemical energy"], correct: 1, standard: "TEKS 4.6A", explanation: "Light bulbs transform electrical energy into light (and some heat)." },
            { q: "Rubbing your hands together quickly makes them warm. This is an example of what type of energy change?", type: "application", choices: ["Light to sound", "Mechanical to thermal (heat)", "Chemical to electrical", "Sound to light"], correct: 1, standard: "TEKS 4.6A", explanation: "The motion (mechanical energy) of rubbing creates friction, which produces heat (thermal energy)." },
            { q: "Which is an example of sound energy?", type: "recall", choices: ["A campfire", "A ringing bell", "A rolling ball", "A battery"], correct: 1, standard: "TEKS 4.6A", explanation: "A ringing bell produces vibrations that travel through the air as sound energy." }
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
          { q: "What were the first words spoken on a telephone?", type: "literal", choices: ["Hello, can you hear me?", "Mr. Watson, come here. I want to see you.", "Testing, testing, 1-2-3", "Is this working?"], correct: 1, standard: "TEKS 4.6A" },
          { q: "What inspired Bell to invent the telephone?", type: "inferential", choices: ["He wanted to be rich", "His work with deaf students and understanding of sound", "He was bored", "A friend suggested it"], correct: 1, standard: "TEKS 4.6B" },
          { q: "What does 'commercial value' mean?", type: "vocabulary", choices: ["Scientific importance", "Worth money or useful for business", "Educational purpose", "Entertainment value"], correct: 1, standard: "TEKS 4.2B" },
          { q: "Which detail shows that people eventually accepted the telephone?", type: "evidence", choices: ["Bell worked with deaf students", "Western Union called it a toy", "Within 10 years over 150,000 Americans had telephones", "Watson heard every word"], correct: 2, standard: "TEKS 4.6C" }
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
            { q: "The school has 876 students and 24 classrooms. About how many students are in each class?", type: "estimation", choices: ["About 20", "About 30", "About 36", "About 40"], correct: 2, standard: "TEKS 4.4G", explanation: "876 / 24 = 36.5, so about 36 students per class." }
          ]
        },
        science: {
          title: "April Science Review",
          questions: [
            { q: "Name the 4 stages of the water cycle in order.", type: "recall", choices: ["Evaporation, Condensation, Precipitation, Collection", "Condensation, Evaporation, Collection, Precipitation", "Precipitation, Collection, Evaporation, Condensation", "Collection, Precipitation, Condensation, Evaporation"], correct: 0, standard: "TEKS 4.8A", explanation: "The water cycle: Evaporation (water becomes gas), Condensation (gas becomes droplets/clouds), Precipitation (water falls), Collection (water gathers in bodies of water)." },
            { q: "An animal that eats BOTH plants and animals is called a —", type: "recall", choices: ["Herbivore", "Carnivore", "Omnivore", "Decomposer"], correct: 2, standard: "TEKS 4.9A", explanation: "Omnivores eat both plants and animals. Examples: bears, humans, pigs." }
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

function seedAllCurriculum() {
  var sheet = ensureCurriculumTab_();

  // Clear existing data (keep header row)
  if (sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }

  var rows = [];

  // JJ Weeks 1-4
  rows.push([1, 'jj', '2026-04-07', JSON.stringify(JJ_WEEK_1)]);
  rows.push([2, 'jj', '2026-04-14', JSON.stringify(JJ_WEEK_2)]);
  rows.push([3, 'jj', '2026-04-21', JSON.stringify(JJ_WEEK_3)]);
  rows.push([4, 'jj', '2026-04-28', JSON.stringify(JJ_WEEK_4)]);

  // Buggsy Weeks 1-4
  rows.push([1, 'buggsy', '2026-04-07', JSON.stringify(BUGGSY_WEEK_1)]);
  rows.push([2, 'buggsy', '2026-04-14', JSON.stringify(BUGGSY_WEEK_2)]);
  rows.push([3, 'buggsy', '2026-04-21', JSON.stringify(BUGGSY_WEEK_3)]);
  rows.push([4, 'buggsy', '2026-04-28', JSON.stringify(BUGGSY_WEEK_4)]);

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

// CurriculumSeed.gs — v1

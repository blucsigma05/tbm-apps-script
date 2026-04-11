---
name: audio-pipeline
description: >
  Audio asset pipeline for the Thompson education platform. Use when
  generating, storing, wiring, or debugging audio for JJ (Sparkle) or
  Buggsy (Wolfkid) education surfaces. Covers ElevenLabs generation,
  Google Drive storage, Web Speech API fallback, preload behavior, and
  QA expectations. Trigger on: audio, ElevenLabs, voice, Nia, Marco,
  speech, TTS, sound, celebration, pronunciation, phoneme, mp3, audio
  clip, phrases.json.
---

1. **Cardinal Rule:** "Audio is product behavior for JJ, not decoration. She cannot read. If audio fails, the learning surface is broken. Every JJ-facing flow must have a working audio path with a visible loading state."

2. **Voice Registry:**

| Voice | Character | Child | ElevenLabs Voice ID | Model | Use For |
|---|---|---|---|---|---|
| Nia | Sparkle guide | JJ | A2YMjtICNQnO93UAZ8l6 | eleven_v3 | Instructions, feedback, celebrations, letter phrases |
| Marco | Wolfkid commander | Buggsy | RYPzpPBmugfktRI79EC9 | eleven_v3 | Instructions, feedback |
| IPA | Phoneme sounds | Both | (same voices) | eleven_flash_v2_5 | Individual letter sounds, phonics |

3. **Audio Source of Truth:**
   - `phrases.json` (repo root) — master list of all audio clips
   - `node generate-audio.js` — batch generator (local Node.js)
   - Google Drive: `Kids & Family/Audio Files/output/jj/` and `/buggsy/`
   - Drive folder ID (Letters): `1rXWVBD9QMruWOj6AlNB4mY2E9wzWGctm`
   - Files: A.mp3 through Z.mp3 + celebration clips

4. **Audio Priority Order (JJ):**
   1. ElevenLabs Nia (pre-generated MP3 from Drive) — ALL instructions, feedback, celebrations
   2. Web Speech API — ONLY as fallback when ElevenLabs audio hasn't loaded yet
   3. NEVER mix voices mid-activity. If Nia starts, Nia finishes.

5. **Audio Priority Order (Buggsy):**
   1. ElevenLabs Marco — instructions and feedback
   2. Web Speech API — fallback
   3. Audio is OPTIONAL for Buggsy. He must READ, not listen.

6. **Loading and Playback Rules:**
   - Show a loading indicator while audio fetches — never silent dead air
   - Instruction audio plays AFTER visual elements render (not during)
   - Celebration audio starts WITH confetti, not after
   - Tap/click sounds: preload at init, play immediately (<50ms)
   - Audio should not block interaction — play async
   - Rotate celebration clips (don't play the same one every time)

7. **Web Speech API Constraints:**
   - Works in: Chrome, Android WebView, Fully Kiosk Browser
   - Fails on: isolated phonics sounds, custom voices
   - Never use for raw phoneme sounds — use ElevenLabs IPA model
   - Configuration: rate 0.9, pitch 1.1 for JJ
   - Pattern:
   ```javascript
   function speak(text, onEnd) {
     var u = new SpeechSynthesisUtterance(text);
     u.rate = 0.9; u.pitch = 1.1;
     if (onEnd) u.onend = onEnd;
     speechSynthesis.speak(u);
   }
   ```

8. **ElevenLabs Clip Delivery:**
   - GAS function `getAudioClip(filename)` reads from Drive, returns base64
   - Client plays via: `new Audio('data:audio/mp3;base64,' + data).play()`
   - Clips are pre-generated, not real-time — latency is Drive read, not generation

9. **Adding New Audio — Workflow:**
   1. Add entry to `phrases.json` with text, voice, and target path
   2. Run `node generate-audio.js` locally
   3. Verify clips in Drive output folder
   4. Update Notion Audio Clip Queue DB if tracking
   5. Wire in module: `google.script.run.withSuccessHandler(play).getAudioClip(name)`

10. **QA Expectations:**
    - Every JJ game type must have instruction audio
    - No mid-activity voice switching (Nia → robot → Nia)
    - Correct answer audio fires immediately
    - Wrong answer audio is gentle, not punishing
    - Celebration audio at session complete
    - Loading indicator visible while audio loads

11. **Guardrails:**
    - Never ship a JJ surface without audio verification
    - Never use Web Speech API as primary for JJ (it's fallback only)
    - Never play the same celebration clip twice in a row
    - Never block user interaction waiting for audio to finish
    - Never hardcode Drive file IDs in modules — use the GAS audio function

import assert from "node:assert/strict";
import test from "node:test";
import { formatTime, startLetterMusic, revealLetterMusic, WHATSAPP_URL } from "./experience-utils.ts";

test("WhatsApp draft goes to Gogo and keeps Felicia's message", () => {
  const url = new URL(WHATSAPP_URL);
  assert.equal(url.origin, "https://wa.me");
  assert.equal(url.pathname, "/6287776119582");
  assert.match(url.searchParams.get("text") ?? "", /menerima permintaan maafmu/);
  assert.match(url.searchParams.get("text") ?? "", /kita sama-sama belajar sayang/);
});

test("player time is readable", () => {
  assert.equal(formatTime(0), "0:00");
  assert.equal(formatTime(259), "4:19");
  assert.equal(formatTime(Number.NaN), "0:00");
});

test("opening the letter starts playback silently, then reveals the volume", async () => {
  let played = false;
  const audio = { currentTime: 42, volume: 1, play: async () => { played = true; } };
  await startLetterMusic(audio);
  assert.equal(played, true);
  assert.equal(audio.currentTime, 0);
  assert.equal(audio.volume, 0);
  revealLetterMusic(audio);
  assert.equal(audio.volume, 0.65);
});

export const WHATSAPP_MESSAGE = "Hai sayangku gogo, aku menerima permintaan maafmu dengan ikhlas dan tulus, terimakasih sudah mau menurunkan egomu ya, kita sama-sama belajar sayang.";

export const WHATSAPP_URL = `https://wa.me/6287776119582?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

export function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

type LetterAudio = Pick<HTMLAudioElement, "currentTime" | "volume" | "play">;

export function startLetterMusic(audio: LetterAudio) {
  audio.currentTime = 0;
  audio.volume = 0;
  return audio.play();
}

export function revealLetterMusic(audio: Pick<HTMLAudioElement, "volume">) {
  audio.volume = 0.65;
}

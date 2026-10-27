"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { formatTime, revealLetterMusic, startLetterMusic, WHATSAPP_URL } from "./experience-utils";

type Screen = "opening" | "envelope" | "time" | "letter" | "question" | "yes" | "promise";
type Curtain = "cover" | "reveal" | null;

const flowerPositions = Array.from({ length: 36 }, (_, index) => {
  const column = index % 6;
  const row = Math.floor(index / 6);
  return {
    left: `${column * 20}%`,
    top: `${row * 20}%`,
    delay: `${Math.hypot(column - 2.5, row - 2.5) * 28}ms`,
    rotate: `${(index * 71) % 360}deg`,
  };
});

const FLOWER_COVER_MS = 950;
const FLOWER_HOLD_MS = 2000;
const FLOWER_REVEAL_MS = 750;

function BloomArt({ mood = "calm" }: { mood?: "calm" | "happy" | "quiet" }) {
  const [touches, setTouches] = useState(0);
  return <button className={`bloom-art ${mood}${touches ? " bloomed" : ""}`} type="button" aria-label="Sentuh bunga magnolia biru agar mekar" onClick={() => setTouches(value => value + 1)}>
    <span className="bloom-glow" aria-hidden="true" />
    <span className="bloom-orbit orbit-one" aria-hidden="true" />
    <span className="bloom-orbit orbit-two" aria-hidden="true" />
    <span className="magnolia-core" aria-hidden="true" />
    <span className="bloom-spark spark-one" aria-hidden="true">✦</span>
    <span className="bloom-spark spark-two" aria-hidden="true">✧</span>
    <span className="bloom-spark spark-three" aria-hidden="true">✦</span>
    {touches > 0 && <span className="bloom-burst" key={touches} aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <i key={index} style={{ "--angle": `${index * 45}deg`, "--delay": `${index * 35}ms` } as CSSProperties} />)}</span>}
    <span className="bloom-hint">{touches ? "harapan kecil, perlahan" : "sentuh untuk mekar"}</span>
  </button>;
}

function FlowerCurtain({ phase }: { phase: Exclude<Curtain, null> }) {
  return <div className={`flower-curtain ${phase}`} aria-hidden="true">
    <div className="curtain-wash" />
    {flowerPositions.map((flower, index) => <span className="curtain-flower" key={index} style={{ "--x": flower.left, "--y": flower.top, "--delay": flower.delay, "--rotate": flower.rotate } as CSSProperties} />)}
    <span className="curtain-heart">♡</span>
  </div>;
}

export default function Experience({ letter }: { letter: string }) {
  const [screen, setScreen] = useState<Screen>("opening");
  const [curtain, setCurtain] = useState<Curtain>(null);
  const [leavingFor, setLeavingFor] = useState<Screen | null>(null);
  const [letterProgress, setLetterProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioNotice, setAudioNotice] = useState("");
  const [showMiniPlayer, setShowMiniPlayer] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const musicPlayerRef = useRef<HTMLDivElement>(null);
  const history = useRef<{ screen: Screen; scroll: number }[]>([]);
  const busy = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const pendingScroll = useRef(0);
  const pendingLetterMusic = useRef(false);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useLayoutEffect(() => { window.scrollTo(0, pendingScroll.current); }, [screen]);
  useEffect(() => {
    if (screen !== "letter" || !pendingLetterMusic.current) return;
    pendingLetterMusic.current = false;
    const audio = audioRef.current;
    if (audio) revealLetterMusic(audio);
  }, [screen]);
  useEffect(() => {
    if (screen !== "letter") return;
    const update = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setLetterProgress(total > 0 ? Math.min(100, window.scrollY / total * 100) : 100);
      setShowMiniPlayer((musicPlayerRef.current?.getBoundingClientRect().bottom ?? 0) < 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [screen]);

  function change(next: Screen, back = false) {
    if (busy.current) return;
    let restoreScroll = 0;
    if (back) {
      const previous = history.current.pop();
      if (!previous) return;
      next = previous.screen;
      restoreScroll = previous.scroll;
    } else {
      history.current.push({ screen, scroll: window.scrollY });
    }
    if (!(["letter", "question", "yes", "promise"] as Screen[]).includes(next)) audioRef.current?.pause();
    busy.current = true;
    setLeavingFor(next);
    pendingScroll.current = restoreScroll;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setScreen(next);
      setLeavingFor(null);
      busy.current = false;
      return;
    }
    setCurtain("cover");
    timers.current.push(setTimeout(() => {
      setScreen(next);
      setCurtain("reveal");
      timers.current.push(setTimeout(() => {
        setCurtain(null);
        setLeavingFor(null);
        busy.current = false;
      }, FLOWER_REVEAL_MS));
    }, FLOWER_COVER_MS + FLOWER_HOLD_MS));
  }

  function playMusic() {
    const audio = audioRef.current;
    if (!audio) return;
    revealLetterMusic(audio);
    void audio.play().then(() => setAudioNotice("")).catch(() => setAudioNotice("Tekan Play untuk mendengarkan lagunya."));
  }

  function openLetter() {
    if (busy.current) return;
    const audio = audioRef.current;
    if (audio) {
      pendingLetterMusic.current = true;
      void startLetterMusic(audio).then(() => setAudioNotice("")).catch(() => setAudioNotice("Tekan Play untuk mendengarkan lagunya."));
    }
    change("letter");
  }

  function forgive() {
    change("yes");
  }

  const button = (label: string, next: Screen, className = "") => <button className={`pill ${className}`} type="button" disabled={Boolean(curtain)} onClick={() => change(next)}>{label}</button>;
  const back = () => <button className="pill back" type="button" disabled={Boolean(curtain)} onClick={() => change("opening", true)}>Kembali</button>;

  return <main className="experience">
    <audio ref={audioRef} src="/music/panasea.mp3" preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onTimeUpdate={event => { setCurrentTime(event.currentTarget.currentTime); if (Number.isFinite(event.currentTarget.duration)) setDuration(event.currentTarget.duration); }} onDurationChange={event => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)} onError={() => { setPlaying(false); setAudioNotice("Lagu tidak dapat dimuat. Silakan tekan Play lagi."); }} />
    <div className="ambient-petals" aria-hidden="true">{Array.from({ length: 7 }, (_, index) => <span key={index} />)}</div>
    {screen === "opening" && <section className="scene center opening" key="opening">
      <span className="tiny-star star-one" aria-hidden="true">✦</span><span className="tiny-star star-two" aria-hidden="true">✦</span>
      <h1 className="script write">Maafkan aku, cintaku</h1>
      <p>Sebuah surat kecil berisi permintaan maaf, rasa syukur atas maaf yang telah diberikan, dan janji untuk belajar mencintaimu dengan lebih baik. Sebab bagiku, kamu bukan sekadar seseorang yang ingin kumiliki, melainkan hati yang ingin kujaga. 🤍</p>
      {button("Mulai", "envelope")}
    </section>}

    {screen === "envelope" && <section className="scene center envelope-scene" key="envelope">
      <button className={`envelope-art${leavingFor === "letter" ? " opening" : ""}`} type="button" aria-label="Buka surat" onClick={openLetter}><span className="envelope-back"/><span className="envelope-letter"/><span className="envelope-front"/><span className="envelope-flap"/><span className="envelope-seal">♡</span></button>
      <div className="choice-stack"><button className="pill" type="button" disabled={Boolean(curtain)} onClick={openLetter}>Baca surat</button>{button("Aku butuh waktu", "time", "quiet-choice")}</div>
      {back()}
    </section>}

    {screen === "time" && <section className="scene center space-scene" key="time">
      <h1 className="script write">Ambil waktu yang kamu butuhkan, sayang</h1>
      <div className="space-row"><p>Aku selalu menunggu mu dan tidak akan pergi kemana-mana, sayang</p><BloomArt mood="quiet" /></div>
      {back()}
    </section>}

    {screen === "letter" && <section className="scene letter-scene" key="letter">
      <div className="read-progress" aria-hidden="true"><span style={{ width: `${letterProgress}%` }} /></div>
      <article className="letter-inner">
        <h1 className="script write">Maafkan Aku</h1>
        <figure className="memory"><Image src="/photos/felicia-memory.jpeg" alt="Felicia dan Tornagogo berfoto bersama" width={720} height={1280} priority /></figure>
        <div className="music-player" ref={musicPlayerRef} role="group" aria-label="Pemutar musik">
          <span className={`music-disc${playing ? " spinning" : ""}`} aria-hidden="true">♪</span>
          <div className="music-details"><div className="music-title"><strong>Panasea</strong><span>Rumahsakit</span></div><input type="range" aria-label="Atur posisi lagu Panasea" min="0" max={duration || 0} step="1" value={Math.min(currentTime, duration || 0)} disabled={!duration} onChange={event => { if (audioRef.current) audioRef.current.currentTime = Number(event.target.value); }} style={{ "--music-progress": `${duration ? currentTime / duration * 100 : 0}%` } as CSSProperties} /><div className="music-time"><span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span></div></div>
          <button className="music-toggle" type="button" aria-label={playing ? "Jeda musik" : "Putar musik"} onClick={() => playing ? audioRef.current?.pause() : playMusic()}>{playing ? "❚❚" : "▶"}</button>
          {audioNotice && <p className="music-notice" role="status">{audioNotice}</p>}
        </div>
        <p className="letter-intro">Untukmu, Eis.</p>
        <p className="letter-copy">{letter}</p>
        <div className="letter-actions">{back()}{button("Lanjutkan", "question")}</div>
      </article>
    </section>}

    {screen === "question" && <section className="scene center question-scene" key="question">
      <h1 className="script write">Sanggupkah engkau memaafkanku, sayangku?</h1>
      <div className="question-flower"><BloomArt /></div>
      <div className="question-actions"><button className="pill" type="button" disabled={Boolean(curtain)} onClick={forgive}>Iya</button>{button("Aku butuh waktu", "time", "quiet-choice")}</div>
      <div className="question-back">{back()}</div>
    </section>}

    {screen === "yes" && <section className="scene center yes-scene" key="yes">
      <h1 className="script write">YESSSSS!</h1>
      <BloomArt mood="happy" />
      <p>Terimakasih sudah menerima permintaan maafku dengan ikhlas sayanggg, akuu cinta kamu</p>
      <a className="pill whatsapp-link" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">Kirim pesan ke Gogo ↗</a>
      <small className="whatsapp-note">Pesannya masih bisa diedit sebelum dikirim.</small>
      {button("Lanjutkan", "promise", "continue-choice")}
      {back()}
    </section>}

    {screen === "promise" && <section className="scene center promise-scene" key="promise">
      <h1 className="script write">Aku Berjanji</h1>
      <BloomArt mood="happy" />
      <p>Aku berjanji akan belajar menjadi lebih baik, mencintaimu dengan lebih dewasa, dan tidak mengulangi kesalahan yang sama. Terima kasih telah memaafkanku dan memberiku kesempatan untuk memperbaiki diri. Semoga ke depannya, aku lebih sering menjadi alasan senyummu daripada air matamu. 🤍</p>
      {back()}
    </section>}
    {(screen === "letter" && showMiniPlayer || screen === "question" || screen === "yes" || screen === "promise") && <button className="music-float" type="button" aria-label={playing ? "Jeda Panasea" : "Putar Panasea"} title={playing ? "Jeda Panasea" : "Putar Panasea"} onClick={() => playing ? audioRef.current?.pause() : playMusic()}><span aria-hidden="true">♫</span><span aria-hidden="true">{playing ? "❚❚" : "▶"}</span></button>}
    {curtain && <FlowerCurtain phase={curtain} />}
  </main>;
}

"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function BgAudio() {
  const pathname = usePathname();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [volume, setVolume] = useState(0.4);

  const audioSrc = pathname.includes("/play") ? "/podikayarana-pooramayi.mp4" : "/bg-audio.webm";

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (hasInteracted && isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => console.log(e));
      }
    }
  }, [audioSrc, hasInteracted, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;

    const handleInteraction = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        audio.play()
          .then(() => setIsPlaying(true))
          .catch(e => console.log("Audio play failed:", e));
      }
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
    };

    document.addEventListener("click", handleInteraction);
    document.addEventListener("keydown", handleInteraction);

    return () => {
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasInteracted]);

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(e => console.log(e));
    }
  };

  return (
    <>
      <audio ref={audioRef} src={audioSrc} loop />
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 p-2 px-3 border-[3px] border-blue-900/30 rounded-xl bg-white/70 backdrop-blur-sm shadow-sm text-blue-900 transition-all rounded-[255px_15px_225px_15px/15px_225px_15px_255px] rotate-2">
        <button
          onClick={toggleMute}
          className="hover:scale-105 active:scale-95 transition-transform outline-none"
          title={isPlaying ? "Pause Background Music" : "Play Background Music"}
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 text-red-500">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          )}
        </button>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-16 md:w-24 accent-red-400 cursor-pointer"
          title="Volume Control"
        />
      </div>
    </>
  );
}

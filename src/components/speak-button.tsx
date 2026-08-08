"use client";

import { Pause, Play, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function SpeakButton({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => () => { pausedRef.current = false; utteranceRef.current = null; window.speechSynthesis.cancel(); }, []);

  function start() {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    utterance.lang = "zh-CN";
    utterance.rate = 0.9;
    pausedRef.current = false;
    utterance.onstart = () => { setSpeaking(true); setPaused(false); };
    utterance.onend = () => { if (!pausedRef.current) { setSpeaking(false); setPaused(false); utteranceRef.current = null; } };
    utterance.onerror = () => { if (!pausedRef.current) { setSpeaking(false); setPaused(false); utteranceRef.current = null; } };
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
    setPaused(false);
  }

  function toggle() {
    if (!speaking) return start();
    if (paused) {
      pausedRef.current = false;
      setPaused(false);
      if (window.speechSynthesis.paused) window.speechSynthesis.resume(); else start();
    } else {
      pausedRef.current = true;
      setPaused(true);
      window.speechSynthesis.pause();
    }
  }

  return <Button type="button" variant="secondary" size="sm" onClick={toggle} aria-label={speaking && !paused ? "暂停语音播报" : speaking ? "继续语音播报" : "开始语音播报"}>{speaking ? (paused ? <Play size={16} /> : <Pause size={16} />) : <Volume2 size={16} />}{speaking ? (paused ? "继续播报" : "暂停播报") : "语音播报"}</Button>;
}

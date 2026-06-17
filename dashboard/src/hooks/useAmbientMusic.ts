import { useEffect, useRef } from 'react';

export const useAmbientMusic = (isPlaying: boolean) => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const timerIDRef = useRef<number | null>(null);

  // Scheduler variables
  const nextNoteTimeRef = useRef<number>(0);
  const currentNoteRef = useRef<number>(0);

  useEffect(() => {
    // Only initialize the audio context once
    if (!audioCtxRef.current && isPlaying) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContext();
      
      // Master gain for fade in/out
      masterGainRef.current = audioCtxRef.current.createGain();
      masterGainRef.current.gain.value = 0;
      masterGainRef.current.connect(audioCtxRef.current.destination);
    }

    const scheduleNote = (noteNumber: number, time: number) => {
      if (!audioCtxRef.current || !masterGainRef.current) return;
      const ctx = audioCtxRef.current;
      
      // High-pitched tension notes (e.g. C minor scale fragments, 2 octaves up)
      // C6, C6, D6, C6, Eb6, C6, D6, C6
      const notes = [1046.50, 1046.50, 1174.66, 1046.50, 1244.51, 1046.50, 1174.66, 1046.50];
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Sine wave for a pure "ting" bell-like sound
      osc.type = 'sine';
      osc.frequency.value = notes[noteNumber];

      // Envelope: sharp attack, rapid decay (like a "ting")
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.15, time + 0.01); // Quick attack
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15); // Fast decay

      osc.connect(gain);
      gain.connect(masterGainRef.current);

      osc.start(time);
      osc.stop(time + 0.2); // Clean up oscillator
    };

    const nextNote = () => {
      const tempo = 130; // BPM
      const secondsPerBeat = 60.0 / tempo;
      const secondsPerSixteenth = 0.25 * secondsPerBeat;
      
      nextNoteTimeRef.current += secondsPerSixteenth;
      currentNoteRef.current++;
      if (currentNoteRef.current >= 8) {
        currentNoteRef.current = 0;
      }
    };

    const scheduler = () => {
      if (!audioCtxRef.current) return;
      // Schedule ahead time
      const scheduleAheadTime = 0.1; 
      
      while (nextNoteTimeRef.current < audioCtxRef.current.currentTime + scheduleAheadTime) {
        scheduleNote(currentNoteRef.current, nextNoteTimeRef.current);
        nextNote();
      }
      
      timerIDRef.current = window.setTimeout(scheduler, 25.0);
    };

    if (isPlaying && audioCtxRef.current && masterGainRef.current) {
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      
      // Start the sequencer
      nextNoteTimeRef.current = audioCtxRef.current.currentTime + 0.1;
      scheduler();

      // Fade in gently over 2 seconds
      masterGainRef.current.gain.setTargetAtTime(0.6, audioCtxRef.current.currentTime, 1.0);
      
    } else if (!isPlaying && audioCtxRef.current && masterGainRef.current) {
      // Stop the sequencer
      if (timerIDRef.current !== null) {
        window.clearTimeout(timerIDRef.current);
        timerIDRef.current = null;
      }

      // Fade out gently
      masterGainRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.2);
      
      // Suspend audio context after fade out
      const ctx = audioCtxRef.current;
      setTimeout(() => {
        if (ctx.state === 'running') {
          ctx.suspend();
        }
      }, 1000);
    }
    
    return () => {
      if (timerIDRef.current !== null) {
        window.clearTimeout(timerIDRef.current);
      }
    };
  }, [isPlaying]);
};

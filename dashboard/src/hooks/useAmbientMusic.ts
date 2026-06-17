import { useEffect, useRef } from 'react';

export const useAmbientMusic = (isPlaying: boolean) => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    // Only initialize the audio context once
    if (!audioCtxRef.current && isPlaying) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContext();
      
      // Master gain for fade in/out
      masterGainRef.current = audioCtxRef.current.createGain();
      masterGainRef.current.gain.value = 0;
      masterGainRef.current.connect(audioCtxRef.current.destination);

      // Frequencies for a mysterious, futuristic drone (A minor 9 / A suspended chord)
      const freqs = [110.0, 164.81, 220.0, 329.63, 493.88];
      
      freqs.forEach((freq, i) => {
        const osc = audioCtxRef.current!.createOscillator();
        const oscGain = audioCtxRef.current!.createGain();
        const panner = audioCtxRef.current!.createStereoPanner?.() || audioCtxRef.current!.createPanner();

        // Base oscillator (sine wave for deep ambient sound)
        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.value = freq;

        // Spread the oscillators across the stereo field
        if (panner instanceof StereoPannerNode) {
          panner.pan.value = (Math.random() * 2) - 1; // -1 to +1
        }

        // Each oscillator has its own low volume
        oscGain.gain.value = 0.05 + (Math.random() * 0.05);
        
        // Connect the graph: Osc -> Gain -> Panner -> Master
        osc.connect(oscGain);
        oscGain.connect(panner);
        panner.connect(masterGainRef.current!);

        osc.start();

        // Create a slow, pulsing LFO to modulate the gain for an evolving sound
        const lfo = audioCtxRef.current!.createOscillator();
        const lfoGain = audioCtxRef.current!.createGain();
        
        lfo.type = 'sine';
        lfo.frequency.value = 0.05 + Math.random() * 0.1; // Very slow pulse (0.05Hz - 0.15Hz)
        
        // The LFO modulates the oscillator's gain to make it swell and fade
        lfoGain.gain.value = oscGain.gain.value * 0.8; 
        lfo.connect(lfoGain);
        lfoGain.connect(oscGain.gain);
        
        lfo.start();
      });
    }

    if (isPlaying && audioCtxRef.current && masterGainRef.current) {
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      // Fade in gently over 3 seconds
      masterGainRef.current.gain.setTargetAtTime(0.4, audioCtxRef.current.currentTime, 1.5);
    } else if (!isPlaying && audioCtxRef.current && masterGainRef.current) {
      // Fade out gently
      masterGainRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.5);
      
      // Suspend audio context after fade out to save CPU
      const ctx = audioCtxRef.current;
      setTimeout(() => {
        if (ctx.state === 'running') {
          ctx.suspend();
        }
      }, 2000);
    }
  }, [isPlaying]);
};

import { useEffect, useRef } from 'react';

export function useSoundEffects(state) {
  const previousRef = useRef(state);
  const audioRef = useRef(null);

  const play = (src) => {
    if (!src) return;
    try {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(src);
      audio.volume = state.ui.masterVolume;
      audio.play().catch(() => {});
      audioRef.current = audio;
    } catch {}
  };

  useEffect(() => {
    const prev = previousRef.current;
    if (!prev) return;
    if (prev.runtime.status !== state.runtime.status) {
      if (state.runtime.status === 'running') play(state.media.sounds.start);
      if (state.runtime.status === 'paused') play(state.media.sounds.pause);
      if (state.runtime.status === 'ended') play(state.media.sounds.stop);
    }
    if (prev.bells.length !== state.bells.length && state.bells[0]) {
      play(state.media.sounds[state.bells[0].team === 'support' ? 'bellSelf' : 'bellOpponent']);
    }
    if (prev.runtime.activeQuestion?.endAt !== state.runtime.activeQuestion?.endAt && state.runtime.activeQuestion) {
      play(state.media.sounds.acceptQuestion);
    }
    if (prev.runtime.showMotion !== state.runtime.showMotion || prev.runtime.showRound !== state.runtime.showRound) {
      play(state.media.sounds.toggleOverlay);
    }
    previousRef.current = state;
  }, [state]);

  return { play };
}

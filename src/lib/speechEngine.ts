export function speakChunks(chunks: string[], rate = 1) {
  if (typeof window === "undefined") return;

  window.speechSynthesis.cancel();

  let index = 0;

  const speakNext = () => {
    if (index >= chunks.length) return;

    const utterance = new SpeechSynthesisUtterance(chunks[index]);

    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      index++;
      speakNext();
    };

    window.speechSynthesis.speak(utterance);
  };

  speakNext();
}

export function pauseSpeech() {
  window.speechSynthesis.pause();
}

export function resumeSpeech() {
  window.speechSynthesis.resume();
}

export function stopSpeech() {
  window.speechSynthesis.cancel();
}
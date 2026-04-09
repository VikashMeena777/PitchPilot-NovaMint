"use client";

import { useState, useEffect, useCallback } from "react";

interface TypewriterProps {
  /** Array of words/phrases to cycle through */
  words: string[];
  /** Typing speed in ms per character */
  typingSpeed?: number;
  /** Deleting speed in ms per character */
  deletingSpeed?: number;
  /** Pause duration after typing completes (ms) */
  pauseDuration?: number;
  /** CSS class for the wrapper */
  className?: string;
  /** CSS class for the cursor */
  cursorClassName?: string;
}

export function Typewriter({
  words,
  typingSpeed = 80,
  deletingSpeed = 50,
  pauseDuration = 2000,
  className = "",
  cursorClassName = "",
}: TypewriterProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const handleTyping = useCallback(() => {
    const currentWord = words[currentWordIndex];

    if (isPaused) return;

    if (!isDeleting) {
      if (currentText.length < currentWord.length) {
        setCurrentText(currentWord.slice(0, currentText.length + 1));
      } else {
        setIsPaused(true);
        setTimeout(() => {
          setIsPaused(false);
          setIsDeleting(true);
        }, pauseDuration);
      }
    } else {
      if (currentText.length > 0) {
        setCurrentText(currentText.slice(0, -1));
      } else {
        setIsDeleting(false);
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
      }
    }
  }, [currentText, isDeleting, isPaused, currentWordIndex, words, pauseDuration]);

  useEffect(() => {
    const speed = isDeleting ? deletingSpeed : typingSpeed;
    const timer = setTimeout(handleTyping, speed);
    return () => clearTimeout(timer);
  }, [handleTyping, isDeleting, typingSpeed, deletingSpeed]);

  return (
    <span className={`inline-flex items-baseline ${className}`}>
      {/* Static text span — no AnimatePresence, no key changes, no disappearing */}
      <span className="inline-block min-w-[1ch]">
        {currentText}
      </span>
      {/* Blinking cursor */}
      <span
        className={`inline-block w-[3px] h-[0.85em] ml-0.5 rounded-full animate-cursor-blink ${cursorClassName}`}
        style={{
          background: "linear-gradient(180deg, var(--pp-accent1-light), var(--pp-accent2))",
        }}
      />
    </span>
  );
}

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

interface TypingAnimationProps {
  stages?: string[];
  defaultStages?: boolean;
  speed?: number;
  className?: string;
  pauseBetweenStages?: number;
  pauseAfterComplete?: number;
}

const DEFAULT_STAGES = [
  "Thinking...",
  "Analyzing client requirements...", 
  "Validating information...",
  "Calculating costs...",
  "Filling the form...",
  "Finalizing offer..."
];

export const TypingAnimation: React.FC<TypingAnimationProps> = ({
  stages,
  defaultStages = true,
  speed = 80,
  className = "",
  pauseBetweenStages = 1200,
  pauseAfterComplete = 1800
}) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  const stageTexts = useMemo(() => {
    return stages || (defaultStages ? DEFAULT_STAGES : ["Loading..."]);
  }, [stages, defaultStages]);

  useEffect(() => {
    const stage = stageTexts[currentStageIndex];
    let charIndex = 0;
    let isDeleting = false;
    let typingTimer: NodeJS.Timeout;

    const type = () => {
      if (!isDeleting && charIndex < stage.length) {
        // Typing forward
        setCurrentText(stage.slice(0, charIndex + 1));
        charIndex++;
        typingTimer = setTimeout(type, speed);
      } else if (!isDeleting && charIndex === stage.length) {
        // Finished typing, wait then start deleting
        typingTimer = setTimeout(() => {
          isDeleting = true;
          type();
        }, pauseAfterComplete);
      } else if (isDeleting && charIndex > 0) {
        // Deleting backward (faster than typing)
        setCurrentText(stage.slice(0, charIndex - 1));
        charIndex--;
        typingTimer = setTimeout(type, speed / 3);
      } else if (isDeleting && charIndex === 0) {
        // Finished deleting, move to next stage
        isDeleting = false;
        const nextIndex = (currentStageIndex + 1) % stageTexts.length;
        setCurrentStageIndex(nextIndex);
        typingTimer = setTimeout(type, pauseBetweenStages);
      }
    };

    // Start typing after a short delay
    typingTimer = setTimeout(type, 400);

    return () => {
      clearTimeout(typingTimer);
    };
  }, [currentStageIndex, speed, stageTexts, pauseBetweenStages, pauseAfterComplete]);

  // Cursor blinking effect
  useEffect(() => {
    const cursorTimer = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);

    return () => clearInterval(cursorTimer);
  }, []);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Animated thinking dots */}
      <div className="flex items-center gap-1">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: '#243F7B' }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Typing text with cursor */}
      <div className="text-sm text-gray-700 min-h-[20px] flex items-center">
        <span className="font-medium">
          {currentText}
        </span>
        <motion.span
          animate={{ opacity: showCursor ? 1 : 0 }}
          transition={{ duration: 0.1 }}
          className="inline-block w-0.5 h-4 ml-1"
          style={{ backgroundColor: '#243F7B' }}
        />
      </div>
    </div>
  );
};
'use client';

import { useState } from 'react';
import VibeAI from './VibeAI';

export default function ChatbotTrigger() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-110"
        aria-label="Open AI Assistant"
      >
        <span className="text-lg font-bold">AI</span>
      </button>

      {/* Chatbot Window */}
      <VibeAI isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
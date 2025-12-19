// components/AIChatButton.tsx
import React from "react";

export default function AIChatButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-1">
      {/* Chatbot button */}
      <button
        onClick={onClick}
        aria-label="Åbn AI-chat"
        className="
          w-14 h-14 rounded-full
          bg-accent text-white
          shadow-lg hover:bg-accent/90
          flex items-center justify-center
          text-xl
        "
      >
        💬
      </button>

      {/* Juridisk disclaimer */}
      <div className="text-[11px] text-gray-500 max-w-[180px] text-right leading-snug">
        AI-assistenten giver generel information og kan tage fejl.
        Svar erstatter ikke professionel rådgivning.
      </div>
    </div>
  );
}

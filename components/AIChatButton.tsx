// components/AIChatButton.tsx
export default function AIChatButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="
        fixed bottom-6 right-6 z-40
        bg-accent text-white 
        px-5 py-3 rounded-full shadow-lg
        hover:bg-accent/90 transition
      "
      aria-label="Åbn Gaarsdal Assistent"
    >
      Chat
    </button>
  );
}

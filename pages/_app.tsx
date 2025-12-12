import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useState } from "react";
import AIChatButton from "../components/AIChatButton";
import AIChat from "../components/AIChat";

export default function App({ Component, pageProps }: AppProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Component {...pageProps} />

      {/* AI CHAT BUBBLE */}
      <AIChatButton onClick={() => setOpen(true)} />

      {/* AI CHAT WINDOW */}
      <AIChat open={open} onClose={() => setOpen(false)} />
    </>
  );
}

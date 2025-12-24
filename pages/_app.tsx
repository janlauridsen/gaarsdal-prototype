import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useState } from "react";
import AIChatButton from "../components/AIChatButton";
import AIChat from "../components/AIChat";

export default function App({ Component, pageProps }: AppProps) {
  const [open, setOpen] = useState(false);


  return (
    <>
      {/* Sideindhold */}
      <Component {...pageProps} />

      {/* Chatboblen */}
      <AIChatButton onClick={() => setOpen(true)} />

      {/* Chatvinduet */}
      <AIChat open={open} onClose={() => setOpen(false)} />
    </>
  );
}

import { useState, useEffect, useRef, useMemo } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeQuickMode, setActiveQuickMode] = useState<'home' | 'sandbox' | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Optional: dynamic quick replies if your backend embeds state in assistant content as JSON.
  // If you instead return { state: { allowed_transitions: [...] } } from /api/chat,
  // you should wire quickReplies to that directly (recommended).
  const quickReplies = useMemo(() => {
    const lastAssistant = messages
      .slice()
      .reverse()
      .find((m) => m.role === 'assistant');

    if (!lastAssistant?.content) return [];

    try {
      const parsed = JSON.parse(lastAssistant.content.trim());
      const allowed = parsed?.state?.allowed_transitions ?? parsed?.allowed_transitions;
      if (Array.isArray(allowed)) return allowed.filter((x) => typeof x === 'string');
    } catch {
      // ignore
    }

    return [];
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      const assistantMessage: Message = { role: 'assistant', content: data.reply };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Der skete en fejl. Prøv igen.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // UI-friendly transitions: click instead of typing command
  const sendTransition = (nodeId: string) => {
    sendMessage(`EXPLICIT_TRANSITION:${nodeId}`);
  };

  // UI-friendly: paste an example sandbox form
  const sendSandboxExample = () => {
    const example = [
      'topic: alkohol om aftenen',
      'goal: drikke mindre',
      'time_patterns: aftenen',
      'situational_triggers: arbejdsstress',
      'relational_patterns: familien',
      'preferred_tone: rolig og direkte',
      'support_direction: ro før jeg kommer hjem',
      'interest_in_methods: gåtur; pause; registrering',
    ].join('\n');

    sendMessage(example);
  };

  return (
    <div className="chatbot">
      <div className="chatHeader">
        <div className="chatTitle">Gaarsdal</div>

        <div className="chatModes">
          <button
            className={activeQuickMode === 'home' ? 'modeBtn active' : 'modeBtn'}
            onClick={() => setActiveQuickMode(activeQuickMode === 'home' ? null : 'home')}
            type="button"
          >
            Menu
          </button>

          <button
            className={activeQuickMode === 'sandbox' ? 'modeBtn active' : 'modeBtn'}
            onClick={() => setActiveQuickMode(activeQuickMode === 'sandbox' ? null : 'sandbox')}
            type="button"
          >
            Sandbox
          </button>
        </div>
      </div>

      {activeQuickMode === 'home' && (
        <div className="quickPanel">
          <div className="quickPanelTitle">Hurtige valg</div>

          <div className="quickRow">
            {['HOME', 'GEN_HYPNO', 'TRIAGE', 'METHOD_FIT', 'BOOKING', 'DEV_SANDBOX_INTRO'].map(
              (id) => (
                <button key={id} className="chip" onClick={() => sendTransition(id)} type="button">
                  {id}
                </button>
              )
            )}
          </div>

          {quickReplies.length > 0 && (
            <>
              <div className="quickPanelTitle" style={{ marginTop: 10 }}>
                Tilladte transitions (fra state)
              </div>
              <div className="quickRow">
                {quickReplies.map((id) => (
                  <button key={id} className="chip" onClick={() => sendTransition(id)} type="button">
                    {id}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {activeQuickMode === 'sandbox' && (
        <div className="quickPanel">
          <div className="quickPanelTitle">Sandbox (UI test)</div>
          <div className="quickRow">
            <button className="chip" onClick={() => sendTransition('DEV_SANDBOX_INTRO')} type="button">
              Start sandbox
            </button>
            <button className="chip" onClick={() => sendMessage('ok')} type="button">
              Ok
            </button>
            <button className="chip" onClick={sendSandboxExample} type="button">
              Indsæt eksempel-form
            </button>
            <button className="chip" onClick={() => sendTransition('HOME')} type="button">
              Tilbage til HOME
            </button>
          </div>
          <div className="hint">
            Tip: Du kan stadig skrive frit. Chips sender standard-kommandoer, så flow føles mere som UI.
          </div>
        </div>
      )}

      <div className="messages">
        {messages.map((m, idx) => (
          <div key={idx} className={`message ${m.role}`}>
            {m.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
      >
        <input
          className="composerInput"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Skriv en besked…"
        />
        <button className="composerBtn" type="submit" disabled={loading}>
          {loading ? '…' : 'Send'}
        </button>
      </form>
    </div>
  );
}

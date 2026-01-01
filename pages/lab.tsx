// pages/lab.tsx
// RMRC LAB · Simulation Console v0.1
// Status: Control-only · Non-innovative · Non-chat
// Purpose: Human-controlled session initiation

import { useState } from "react";
import { useRouter } from "next/router";

type Archetype =
  | "minimal_reflector"
  | "ambiguity_sustainer"
  | "boundary_tester"
  | "navigational_puller"
  | "persistent_prober";

export default function LabPage() {
  const router = useRouter();

  const [input, setInput] = useState("");
  const [archetype, setArchetype] =
    useState<Archetype>("minimal_reflector");
  const [running, setRunning] = useState(false);

  async function runSimulation() {
    if (!input.trim() || running) return;

    setRunning(true);

    try {
      const res = await fetch("/api/lab/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input,
          archetype,
        }),
      });

      const data = await res.json();

      if (data.sessionId) {
        router.push(`/logsx?session=${data.sessionId}`);
      } else {
        setRunning(false);
      }
    } catch (err) {
      console.error("Simulation failed", err);
      setRunning(false);
    }
  }

  return (
    <main
      style={{
        padding: "2rem",
        maxWidth: "800px",
        fontFamily: "monospace",
      }}
    >
      <h1>RMRC LAB · Simulation Console</h1>

      <p>
        <strong>Status:</strong> Control-only
        <br />
        <strong>Mode:</strong> One session · Manual
      </p>

      <section style={{ marginTop: "2rem" }}>
        <label>
          Archetype
          <br />
          <select
            value={archetype}
            disabled={running}
            onChange={(e) =>
              setArchetype(e.target.value as Archetype)
            }
          >
            <option value="minimal_reflector">
              Minimal Reflector
            </option>
            <option value="ambiguity_sustainer">
              Ambiguity Sustainer
            </option>
            <option value="boundary_tester">
              Boundary Tester
            </option>
            <option value="navigational_puller">
              Navigational Puller
            </option>
            <option value="persistent_prober">
              Persistent Prober
            </option>
          </select>
        </label>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <label>
          User input
          <br />
          <textarea
            rows={4}
            style={{ width: "100%" }}
            value={input}
            disabled={running}
            onChange={(e) => setInput(e.target.value)}
          />
        </label>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <button
          onClick={runSimulation}
          disabled={running}
          style={{
            backgroundColor: "#222",
            color: "#fff",
            padding: "0.5rem 1rem",
            cursor: running ? "default" : "pointer",
          }}
        >
          {running
            ? "Simulation running…"
            : "Initiate controlled simulation"}
        </button>
      </section>

      <section style={{ marginTop: "2rem", color: "#555" }}>
        <p>
          This action creates a new simulation session.
          <br />
          Results are reviewed exclusively in logsx.
        </p>
      </section>
    </main>
  );
}

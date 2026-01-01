// pages/lab.tsx
// RMRC LAB · Simulation Console v0
// Status: Control-only · Non-innovative · Non-chat

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
    if (!input.trim()) return;

    setRunning(true);

    const res = await fetch("/api/lab/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input,
        archetype,
      }),
    });

    const data = await res.json();

    setRunning(false);

    if (data.sessionId) {
      router.push(`/logsx?session=${data.sessionId}`);
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
        <strong>Status:</strong> Control-only<br />
        <strong>Mode:</strong> One session · Manual
      </p>

      <section style={{ marginTop: "2rem" }}>
        <label>
          Archetype
          <br />
          <select
            value={archetype}
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
            onChange={(e) => setInput(e.target.value)}
          />
        </label>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <button
          onClick={runSimulation}
          disabled={running}
        >
          {running ? "Running simulation…" : "Run simulation"}
        </button>
      </section>

      <section style={{ marginTop: "2rem", color: "#555" }}>
        <p>
          Simulation results are not shown here.<br />
          Review full session details in logsx.
        </p>
      </section>
    </main>
  );
}

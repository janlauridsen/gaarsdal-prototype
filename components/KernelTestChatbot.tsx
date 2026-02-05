"use client"

import { useState } from "react"

type KernelResponse = {
  state: any
  transition: any
  log: any
}

const initialState = {
  conversation_id: "kernel-test",
  revision: 0,
  active_node: "HOME",
  allowed_transitions: ["GEN_HYPNO", "TRIAGE", "BOOKING"],
  meta: {},
  status: "active",
  parentese_stack: [],
}

const ACTIONS = [
  "HOME",
  "GEN_HYPNO",
  "TRIAGE",
  "BOOKING",
  "MAIL",
  "TLF",
  "AKUT",
]

export default function KernelTestChatbot() {
  const [state, setState] = useState<any>(initialState)
  const [logs, setLogs] = useState<any[]>([])
  const [text, setText] = useState("")

  async function send(input: any) {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state, input }),
    })

    const data: KernelResponse = await res.json()
    setState(data.state)
    setLogs((l) => [...l, data.log])
  }

  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <h2>Kernel Test UI</h2>

      <div>
        <b>active_node:</b> {state.active_node}
      </div>
      <div>
        <b>status:</b> {state.status}
      </div>
      <div>
        <b>allowed_transitions:</b>{" "}
        {JSON.stringify(state.allowed_transitions)}
      </div>

      <hr />

      <div>
        {ACTIONS.map((a) => (
          <button
            key={a}
            style={{ marginRight: 6, marginBottom: 6 }}
            onClick={() =>
              send({ type: "EXPLICIT_TRANSITION", target: a })
            }
          >
            {a}
          </button>
        ))}
      </div>

      <hr />

      <div>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="FREE_TEXT"
        />
        <button
          onClick={() => {
            send({ type: "FREE_TEXT", text })
            setText("")
          }}
        >
          Send
        </button>
      </div>

      <hr />

      <h3>Logs</h3>
      <pre style={{ maxHeight: 300, overflow: "auto" }}>
        {JSON.stringify(logs, null, 2)}
      </pre>
    </div>
  )
}

import { useState } from "react";

export default function AdminDiffTurns() {
  const [sessionId, setSessionId] = useState("");
  const [base, setBase] = useState("screening-v4.4");
  const [compare, setCompare] = useState("screening-v4.5");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    setData(null);

    try {
      const res = await fetch(
        `/api/admin/diff/${sessionId}?base=${base}&compare=${compare}`
      );
      if (!res.ok) throw new Error(await res.text());
      setData(await res.json());
    } catch (e: any) {
      setError(e.message || "Fejl");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50 text-gray-900">
      <h1 className="text-2xl font-semibold mb-6">
        Prompt Diff – Turn for Turn
      </h1>

      {/* Controls */}
      <div className="flex gap-3 mb-6">
        <input
          placeholder="Session ID"
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          className="border p-2 rounded w-96"
        />
        <input
          value={base}
          onChange={(e) => setBase(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          value={compare}
          onChange={(e) => setCompare(e.target.value)}
          className="border p-2 rounded"
        />
        <button
          onClick={load}
          className="bg-black text-white px-4 rounded"
        >
          Vis
        </button>
      </div>

      {loading && <p>Indlæser…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {/* TURN DIFF */}
      {data && (
        <div className="space-y-8">
          {data.base.replay.turns.map((baseTurn: any, i: number) => {
            const compareTurn = data.compare.replay.turns[i];

            return (
              <div
                key={i}
                className="bg-white border rounded p-4"
              >
                <div className="text-sm text-gray-500 mb-2">
                  Turn #{i}
                </div>

                {/* USER */}
                <div className="mb-3">
                  <div className="text-xs font-semibold text-gray-600">
                    User
                  </div>
                  <div className="text-sm whitespace-pre-wrap">
                    {baseTurn.userText}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* BASE */}
                  <div>
                    <div className="text-xs font-semibold mb-1">
                      Base ({base})
                    </div>
                    <pre className="text-xs whitespace-pre-wrap bg-gray-100 p-2 rounded">
                      {baseTurn.assistantText}
                    </pre>
                    <div className="text-xs text-gray-500 mt-1">
                      {baseTurn.assistantText.length} tegn
                      {baseTurn.isClosing && " · CLOSING"}
                    </div>
                  </div>

                  {/* COMPARE */}
                  <div>
                    <div className="text-xs font-semibold mb-1">
                      Compare ({compare})
                    </div>
                    <pre className="text-xs whitespace-pre-wrap bg-gray-100 p-2 rounded">
                      {compareTurn?.assistantText}
                    </pre>
                    <div className="text-xs text-gray-500 mt-1">
                      {compareTurn?.assistantText.length} tegn
                      {compareTurn?.isClosing && " · CLOSING"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

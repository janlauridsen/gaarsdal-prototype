import { useState } from "react";

export default function AdminDiffBatch() {
  const [sessions, setSessions] = useState("");
  const [base, setBase] = useState("screening-v4.4");
  const [compare, setCompare] = useState("screening-v4.5");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadBatch() {
    setLoading(true);
    setError("");
    setData(null);

    try {
      const res = await fetch(
        `/api/admin/diff-batch?base=${base}&compare=${compare}&sessions=${sessions}`
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
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-2xl font-semibold mb-6">
        Prompt Diff – Batch
      </h1>

      <div className="flex gap-3 mb-6">
        <input
          placeholder="sessionId1,sessionId2,…"
          value={sessions}
          onChange={(e) => setSessions(e.target.value)}
          className="border p-2 rounded w-[420px]"
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
          onClick={loadBatch}
          className="bg-black text-white px-4 rounded"
        >
          Kør
        </button>
      </div>

      {loading && <p>Indlæser…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {data && (
        <div className="bg-white p-6 rounded border">
          <h2 className="font-semibold mb-4">Overblik</h2>

          <ul className="space-y-1 text-sm">
            <li>Sessions: {data.eval.totalSessions}</li>
            <li>Med lukning: {data.eval.aggregates.withClosing}</li>
            <li>Gentaget lukning: {data.eval.aggregates.repeatedClosing}</li>
            <li>Spørgsmål stillet: {data.eval.aggregates.askedQuestions}</li>
            <li>For lange svar: {data.eval.aggregates.excessiveLength}</li>
          </ul>

          <h3 className="font-semibold mt-6 mb-2">
            Sessions med issues
          </h3>

          <ul className="text-sm space-y-1">
            {data.eval.sessions
              .filter((s: any) => s.eval.issues.length > 0)
              .map((s: any) => (
                <li key={s.replay.sessionId}>
                  {s.replay.sessionId} ({s.eval.issues.length} issues)
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}

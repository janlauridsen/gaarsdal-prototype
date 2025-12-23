import { useState } from "react";

export default function AdminDiff() {
  const [sessionId, setSessionId] = useState("");
  const [base, setBase] = useState("screening-v4.4");
  const [compare, setCompare] = useState("screening-v4.5");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadDiff() {
    setLoading(true);
    setError("");
    setData(null);

    try {
      const res = await fetch(
        `/api/admin/diff/${sessionId}?base=${base}&compare=${compare}`
      );

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message || "Fejl ved hentning");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50 text-gray-900">
      <h1 className="text-2xl font-semibold mb-6">
        Prompt Diff – Session
      </h1>

      {/* Controls */}
      <div className="flex gap-4 mb-6">
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
          onClick={loadDiff}
          className="bg-black text-white px-4 rounded"
        >
          Diff
        </button>
      </div>

      {loading && <p>Indlæser…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {/* RESULT */}
      {data && (
        <div className="grid grid-cols-2 gap-6">
          {/* BASE */}
          <div className="bg-white p-4 rounded border">
            <h2 className="font-semibold mb-2">
              Base – {base}
            </h2>

            <pre className="text-xs whitespace-pre-wrap">
              {JSON.stringify(data.base.eval, null, 2)}
            </pre>
          </div>

          {/* COMPARE */}
          <div className="bg-white p-4 rounded border">
            <h2 className="font-semibold mb-2">
              Compare – {compare}
            </h2>

            <pre className="text-xs whitespace-pre-wrap">
              {JSON.stringify(data.compare.eval, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

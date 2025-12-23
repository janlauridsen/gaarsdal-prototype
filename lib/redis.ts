const url = process.env.UPSTASH_REDIS_REST_URL!;
const token = process.env.UPSTASH_REDIS_REST_TOKEN!;

async function redisRequest(path: string, value?: any) {
  const res = await fetch(`${url}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: value !== undefined ? JSON.stringify(value) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upstash error ${res.status}: ${text}`);
  }
}

export async function redisSet(key: string, value: any) {
  await redisRequest(`/set/${encodeURIComponent(key)}`, value);
}

/**
 * Append-only log (chronological order)
 */
export async function redisAppend(key: string, value: any) {
  await redisRequest(`/rpush/${encodeURIComponent(key)}`, value);
}

export default function handler(_: NextApiRequest, res: NextApiResponse) {
  res.status(410).json({
    ok: false,
    error: "Deprecated admin endpoint. Use session-based admin API.",
  });
}

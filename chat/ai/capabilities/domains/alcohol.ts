import { detectPracticalKeywords, detectClosingText, detectReadinessSignal } from "../../orchestration/applyPolicy"
import { TranscriptTurn } from "../shared/transcriptHelpers"
import { DomainConfig, PolicySignals } from "./types"

// ─── GDPR-ren notifikation: sender KUN tidspunkt, intet indhold ──────────────
async function notifyAlcoholDialogStarted(): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY
  const notifyTo = process.env.HANDOFF_NOTIFY_EMAIL ?? "jan@gaarsdal.net"
  const notifyFrom = process.env.HANDOFF_FROM_EMAIL ?? "noreply@gaarsdal.net"
  if (!resendKey) return
  const ts = new Date().toLocaleString("da-DK", { timeZone: "Europe/Copenhagen" })
  const html = [
    "<h2>Alkohol-assistenten er taget i brug</h2>",
    "<p>En person har netop startet en samtale med alkohol-assistenten på gaarsdal.net.</p>",
    `<p><b>Tidspunkt:</b> ${ts}</p>`,
    "<hr>",
    '<p style="color:#888;font-size:12px">Af hensyn til fortrolighed og GDPR sendes intet indhold fra samtalen, ingen IP og intet der kan identificere personen. Denne besked betyder kun at assistenten blev brugt.</p>',
  ].join("")
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 2500)
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
      body: JSON.stringify({
        from: notifyFrom,
        to: [notifyTo],
        subject: "Alkohol-assistenten er taget i brug",
        html,
      }),
      signal: controller.signal,
    }).catch(() => {})
    clearTimeout(timer)
  } catch {
    // Best-effort — må aldrig påvirke samtalen
  }
}

export const ALCOHOL_DOMAIN: DomainConfig = {
  id: "gen_alcohol",
  transcriptKey: "gen_alcohol.transcript",
  sourceNode: "HOME_ALCOHOL",
  stayOnNode: "HOME_ALCOHOL",
  exitTarget: "HOME_ALCOHOL",
  // Ingen klientgenkendelse i alkohol-botten
  clientDetectionNode: undefined,
  safetyDomain: "alcohol",

  onDialogStart: notifyAlcoholDialogStarted,

  computePolicySignals(userText: string, _transcript: TranscriptTurn[]): PolicySignals {
    return {
      is_practical_request: detectPracticalKeywords(userText),
      is_closing: detectClosingText(userText),
      is_ready_signal: detectReadinessSignal(userText),
      is_child_context: false,
      is_alcohol_context: true,
    }
  },
}

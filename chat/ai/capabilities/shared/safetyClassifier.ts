import { LlmClient } from "../../types"

export type SafetyDomain = "standard" | "children" | "alcohol"
export type SafetyClass = { crisis: boolean; dependency: boolean }

// ─── Krise-fraser (første-person, bruger om sig selv) ────────────────────────
// Samlet liste fra genChildren (den rigere version vinder)
const CRISIS_PHRASES_FIRST_PERSON = [
  "gøre mig selv ondt", "slå mig selv", "skade mig selv",
  "vil ikke leve", "ikke leve mere", "ikke her mere", "gider leve",
  "tage mit eget liv", "ende det hele", "selvmord",
  "ingen vej ud", "nogen vej ud", "ingen udvej", "nogen udvej",
  "ikke lyst til at leve", "ingen grund til at fortsætte",
  "lyst til at give op", "lyst til at slippe for det hele",
  "slippe for det hele", "ville være lettere hvis jeg ikke var her",
  "vil hellere dø", "hellere dø", "vil dø", "ønsker jeg var død",
  "ikke eksistere", "leve mere",
  "træt af livet", "træt af at leve", "orker ikke mere", "orker ikke livet",
  "kan ikke mere", "magter ikke mere", "ser ingen mening", "ingen mening med",
  "livet er meningsløst", "alt er meningsløst", "vil ikke være her",
]

// Ord der indikerer at det handler om et barn (ikke brugeren selv)
const CHILD_CONTEXT_WORDS = ["min søn", "min datter", "mit barn", "barnet", "han ", "hun ", "ham ", "hende "]

// Fast-path afhængigheds-fraser (kun alcohol-domænet)
const DEPENDENCY_PHRASES = [
  "ryster om morgen", "rysten om morgen", "ryster indtil", "ryster til jeg",
  "skælver om morgen", "morgenøl", "morgen øl", "øl om morgenen", "drikke om morgenen",
  "drikker om morgenen", "får det bedre når jeg drikker", "stabil når jeg",
  "sved om natten", "sveder når jeg ikke", "kramper", "delirium", "abstinens",
  "ryster når jeg ikke", "skal have noget at drikke for at",
]

const HATEFUL_PHRASES = [
  "pædofil", "pædofile", "krænker", "krænkere",
  "voldtægtsmand", "voldtægtsmænd", "pervers", "perverse",
  "racist", "racister", "nazist", "nazister",
  "islamist", "terrorist", "jihad",
  "nigger", "neger", "bøsse", "luder", "hora",
]

const DEFAMATION_TARGETS = ["jan", "hypnoterapi", "hypnoterapeut", "terapeut"]

export function detectHatefulContent(userText: string): boolean {
  const t = userText.toLowerCase()
  const hasHateful = HATEFUL_PHRASES.some((p) => t.includes(p))
  if (!hasHateful) return false
  // Returner kun true hvis det er en anklage (ikke et spørgsmål om tegn/symptomer)
  const isQuestion = t.includes("hvad er") || t.includes("hvad betyder") || t.includes("hvad er tegn")
  return !isQuestion
}

export function detectFastCrisis(userText: string, domain: SafetyDomain): boolean {
  const textLower = userText.toLowerCase()
  const isAboutChild = CHILD_CONTEXT_WORDS.some((w) => textLower.includes(w))
  const selfHarmCrisis = textLower.includes("selvskade") && !isAboutChild
  return selfHarmCrisis || CRISIS_PHRASES_FIRST_PERSON.some((p) => textLower.includes(p))
}

export function detectFastDependency(userText: string, domain: SafetyDomain): boolean {
  if (domain !== "alcohol") return false
  const t = userText.toLowerCase()
  return DEPENDENCY_PHRASES.some((p) => t.includes(p))
}

export async function classifySafety(
  llm: LlmClient,
  userText: string,
  recentContext: string,
  fastCrisis: boolean,
  fastDependency: boolean,
  domain: SafetyDomain,
): Promise<SafetyClass> {
  // Fast-path: åbenlyse tilfælde fanget af fraser → spring LLM-kald over
  if (fastCrisis || fastDependency) {
    return { crisis: fastCrisis, dependency: fastDependency }
  }

  try {
    const contextLine =
      domain === "alcohol"
        ? "Du er en sikkerhedsklassifikator for en samtale om alkohol."
        : "Du er en sikkerhedsklassifikator for en samtale hvor en forælder eller en ung (8-18 år) søger råd om barnets/den unges trivsel."

    const crisisRules =
      domain === "alcohol"
        ? "crisis = true HVIS beskeden udtrykker akut psykisk nød hos SKRIBENTEN selv: livstræthed, " +
          "håbløshed, ikke at ville leve/være her, meningsløshed, selvmordstanker, at give op på livet. " +
          "Fang BETYDNINGEN uanset formulering — fx 'træt af det hele', 'orker ikke mere', 'ser ingen udvej'."
        : "crisis = true KUN HVIS beskeden udtrykker AKUT fare: at skribenten (eller barnet) har selvmordstanker, " +
          "vil gøre skade på sig selv/andre, eller er i umiddelbar nød lige nu. " +
          "crisis = false ved ALMINDELIGE bekymringer om et barns trivsel — også selvom de bruger kliniske ord. " +
          "VIGTIGE eksempler der IKKE er crisis: 'mit barn har angst', 'mit barn er ked af det', " +
          "'mit barn vil ikke i skole', 'mit barn sover dårligt', 'mit barn bliver mobbet', " +
          "'mit barn trækker sig'. Dette er normale henvendelser om et barns udfordringer — sæt crisis=false. " +
          "Kun ved EKSPLICITTE tegn på selvmordsfare, selvskade eller akut fare sættes crisis=true. Er du i tvivl: false."

    const depRules =
      domain === "alcohol"
        ? "dependency = true KUN HVIS beskeden beskriver FYSISKE abstinenssymptomer: rysten/skælven der lindres " +
          "af alkohol, morgendrik for at stabilisere, sved/uro/kvalme når man IKKE drikker, kramper, delirium. " +
          "dependency = false ved almindelige drikkevaner uden fysiske abstinenser. Eksempler der IKKE er dependency: " +
          "'tager den første genstand efter arbejde', 'et par glas vin hver aften', 'drikker for at slappe af'. " +
          "Kræv et TYDELIGT fysisk symptom. Er du i tvivl: false."
        : "dependency = false ALTID (ikke relevant i denne kontekst)."

    const raw = await llm.chatJson({
      model: process.env.SAFETY_MODEL ?? process.env.HYPNO_MODEL ?? "gpt-4.1-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            contextLine +
            " Vurder KUN brugerens seneste besked (med kontekst) for to ting. Svar i JSON.\n\n" +
            crisisRules +
            "\n\n" +
            depRules +
            "\n\n" +
            'Svar PRÆCIST: {"crisis": boolean, "dependency": boolean}',
        },
        {
          role: "user",
          content: JSON.stringify({ recent_context: recentContext, latest_message: userText }),
        },
      ],
    })

    return {
      crisis: raw?.crisis === true,
      dependency: domain === "alcohol" ? raw?.dependency === true : false,
    }
  } catch {
    // Fail-safe: fald tilbage på fast-path
    return { crisis: fastCrisis, dependency: fastDependency }
  }
}

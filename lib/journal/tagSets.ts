export type TagOption = { key: string; label_da: string }

export const perceivedBenefitTags: TagOption[] = [
  { key: "calm", label_da: "Ro" },
  { key: "numb", label_da: "Bedøvelse" },
  { key: "relief", label_da: "Lettelse" },
  { key: "reward", label_da: "Belønning" },
  { key: "fun", label_da: "Sjov" },
  { key: "social_ease", label_da: "Social lethed" },
  { key: "confidence", label_da: "Selvtillid" },
  { key: "escape", label_da: "Flugt fra tanker" },
  { key: "sleep_help", label_da: "Hjælper mig med at falde i søvn" },
  { key: "celebrate", label_da: "Fejring" },
  { key: "boredom_fix", label_da: "Mod kedsomhed" },
  { key: "routine", label_da: "Vane/ritual" },
]

export const perceivedCostTags: TagOption[] = [
  { key: "poor_sleep", label_da: "Dårlig søvn" },
  { key: "anxiety", label_da: "Angst/uro" },
  { key: "shame", label_da: "Skam" },
  { key: "regret", label_da: "Fortrydelse" },
  { key: "conflict", label_da: "Konflikter" },
  { key: "low_energy", label_da: "Lav energi" },
  { key: "hangover", label_da: "Tømmermænd" },
  { key: "cravings_worse", label_da: "Mere lyst bagefter" },
  { key: "missed_goals", label_da: "Sårer mine mål" },
  { key: "productivity", label_da: "Lav produktivitet" },
  { key: "health", label_da: "Helbred" },
  { key: "money", label_da: "Økonomi" },
  { key: "relationship", label_da: "Relationer" },
  { key: "memory", label_da: "Hukommelse/blackout" },
]

export const desiredOutcomeTags: TagOption[] = [
  { key: "better_sleep", label_da: "Bedre søvn" },
  { key: "more_energy", label_da: "Mere energi" },
  { key: "calm_without", label_da: "Ro uden alkohol" },
  { key: "self_control", label_da: "Mere selvkontrol" },
  { key: "health", label_da: "Bedre helbred" },
  { key: "mood_stable", label_da: "Mere stabilt humør" },
  { key: "relationships", label_da: "Bedre relationer" },
  { key: "productivity", label_da: "Mere overskud" },
  { key: "weight", label_da: "Vægt/krop" },
  { key: "save_money", label_da: "Spare penge" },
  { key: "anxiety_less", label_da: "Mindre angst" },
  { key: "pride", label_da: "Stolthed/selvrespekt" },
]

export const ambivalenceTags: TagOption[] = [
  { key: "stress", label_da: "Stress" },
  { key: "social_pressure", label_da: "Socialt pres" },
  { key: "habit", label_da: "Vane" },
  { key: "boredom", label_da: "Kedsomhed" },
  { key: "reward", label_da: "“Jeg har fortjent det”" },
  { key: "loneliness", label_da: "Ensomhed" },
  { key: "emotions", label_da: "Svære følelser" },
  { key: "fatigue", label_da: "Træthed" },
  { key: "access", label_da: "Let tilgængeligt" },
  { key: "partner_friends", label_da: "Omgivelser drikker" },
  { key: "fear_missing_out", label_da: "FOMO" },
  { key: "coping_skills", label_da: "Mangler strategier" },
]

export function asKeySet(opts: TagOption[]): Set<string> {
  return new Set(opts.map((o) => o.key))
}

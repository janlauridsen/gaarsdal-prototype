/**
 * RMRC Runtime Profile Registry
 *
 * Declares which boards and roles are enabled
 * for a given runtime configuration.
 *
 * Data only — no logic.
 */

export interface RuntimeProfile {
  profileId: string;
  enabledBoards: string[];
  enabledRoles: string[];
  notes?: string;
}

export const runtimeProfiles: RuntimeProfile[] = [
  {
    profileId: "reflective_minimal",
    enabledBoards: ["reflective"],
    enabledRoles: [
      "mirror",
      "context_holder"
    ],
    notes:
      "Pure reflective profile. No navigation, no boundaries."
  },
  {
    profileId: "reflective_with_boundaries",
    enabledBoards: ["reflective", "boundary"],
    enabledRoles: [
      "mirror",
      "context_holder",
      "boundary_guardian",
      "authority_diffuser"
    ],
    notes:
      "Reflective dialogue with ethical and relational protection."
  },
  {
    profileId: "full_reflective_navigation",
    enabledBoards: ["reflective", "boundary", "navigation"],
    enabledRoles: [
      "mirror",
      "context_holder",
      "boundary_guardian",
      "authority_diffuser",
      "dialog_navigator"
    ],
    notes:
      "Full reflective experience with rare, optional navigation."
  }
];

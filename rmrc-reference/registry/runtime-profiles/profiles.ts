/**
 * RMRC Runtime Profile Registry
 *
 * This file declares runtime profiles used to configure
 * which boards and roles are active during a session.
 * It contains data only — no logic, no imports.
 */

export interface RuntimeProfile {
  profileId: string;
  enabledBoards: string[];
  enabledRoles: string[];
  notes?: string;
}

/**
 * Canonical runtime profiles
 */
export const runtimeProfiles: RuntimeProfile[] = [
  {
    profileId: "reflective_minimal",
    enabledBoards: ["reflective"],
    enabledRoles: ["mirror", "context_holder"],
    notes:
      "Minimal reflective profile focused purely on mirroring and contextual holding.",
  },
  {
    profileId: "reflective_with_boundaries",
    enabledBoards: ["reflective", "boundary"],
    enabledRoles: [
      "mirror",
      "context_holder",
      "boundary_guardian",
      "authority_diffuser",
    ],
    notes:
      "Reflective profile with ethical and relational boundary protection enabled.",
  },
  {
    profileId: "full_reflective_navigation",
    enabledBoards: ["reflective", "boundary", "navigation"],
    enabledRoles: [
      "mirror",
      "context_holder",
      "boundary_guardian",
      "authority_diffuser",
      "dialog_navigator",
    ],
    notes:
      "Full reflective profile with optional navigation support for gentle movement.",
  },
];

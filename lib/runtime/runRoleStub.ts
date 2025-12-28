// lib/runtime/runRoleStub.ts

export function runRoleStub(
  role: string,
  userText: string
): string {
  switch (role) {
    case "spejler":
      return `Spejling (stub): ${userText}`;

    case "afgraenser":
      return "Afgrænsning (stub): ingen rådgivning eller behandling.";

    default:
      return "Ukendt rolle (stub)";
  }
}

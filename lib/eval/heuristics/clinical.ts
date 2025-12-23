export function containsAdvisoryLanguage(
  text: string
): boolean {
  return /(du bør|det anbefales|overvej at|jeg vil råde|du kan med fordel)/i.test(
    text
  );
}

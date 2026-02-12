# Vedligeholdelse af triage-dokumenter

## Formål

Denne guide gør det eksplicit, hvad du/jeres team skal gøre for at holde dokumentationen aktuel i repoet.

## Fast proces ved ændringer

1. Opdatér `../triage-design-v1.md` hvis struktur/kontrakt ændres.
2. Opdatér `NODE-CATALOG.md` hvis noder/exits/meta ændres.
3. Opdatér `DECISION-TABLE.md` hvis regler/outcomes ændres.
4. Opdatér dato/ejerfelter.
5. Fjern eller udfyld relevante `UDFYLD`-felter.

## Reviewkrav (skal være opfyldt)

- [ ] Teknisk review
- [ ] Fagligt review
- [ ] Produktgodkendelse

## Definition of Ready for implementation

Dokumentpakken er klar når:

- Der ikke er kritiske `UDFYLD`-felter tilbage i de dele, der skal implementeres nu.
- Node-katalog og beslutningstabel er konsistente med master-spec.
- Ejer + dato-felter er udfyldt.

CQC ANALYSIS GUIDE

Version 1.0 – Normativ analyse-ramme

Formål

Denne guide definerer, hvordan dialogkvalitet analyseres ved hjælp af CQC (Core Quality Criteria).

Guiden bruges til:

batch-analyse af logdata

replay-baseret evaluering

menneskelig beslutningsstøtte

Guiden må ikke bruges til:

runtime-styring

automatisk prompt-optimering

scoring af enkelt-svar

Analyse sker altid på aggregater og mønstre, aldrig på isolerede hændelser.

Grundprincipper

CQC evaluerer tendenser, ikke korrekthed

Ét datapunkt er aldrig afgørende

Gentagelse over cases er centralt

Fravær af signal er også et signal

Analyse giver indsigt, ikke handling

CQC-1 · Relevans
Definition

Relevans måler i hvilken grad systemets svar forholder sig til brugerens eksplicitte emne og intention.

Analytiske spørgsmål

Hvor ofte driver svar væk fra brugerens eksplicitte emne?

Forekommer temaskift uden brugerinitiering?

Sker irrelevans systematisk i bestemte test-case-kategorier?

Typiske mønstre at observere

For tidlig introduktion af behandlingsforklaringer

Skift fra brugerens bekymring til systemets domæneinteresse

Gentagen “default framing” uanset input

Bemærkning

Relevans vurderes over tid og på tværs af cases, ikke pr. turn.

CQC-2 · Afgrænsning
Definition

Afgrænsning måler systemets evne til at skelne klart mellem:

forklaring vs. løsning

støtte vs. rådgivning

mulighed vs. løfte

Analytiske spørgsmål

Overforklares der i forhold til brugerens behov?

Gentages disclaimers mekanisk?

Flyttes grænser gradvist uden tydeligt signal?

Typiske mønstre at observere

Standarddisclaimers uanset kontekst

Lange forklaringer i afklarings-mode

Uklar adskillelse mellem information og invitation

CQC-3 · Fremdrift
Definition

Fremdrift måler, om dialogen bevæger sig meningsfuldt, eller om den stagnerer.

Analytiske spørgsmål

Efter hvor mange turns stopper svarene med at ændre sig?

Hvor ofte gentager evaluator de samme signaler (fx chips)?

Ses cirkulære svarmønstre?

Typiske mønstre at observere

Semantisk gentagelse med sproglig variation

Manglende overgang mod afrunding

Vedvarende “åbne” svar uden progression

Bemærkning

Manglende fremdrift er ikke nødvendigvis en fejl, men et mønster der kræver fortolkning.

CQC-4 · Manglende perspektiver
Definition

Dette kriterium måler, om systemet systematisk undlader vigtige afklarende perspektiver.

Analytiske spørgsmål

Peger evaluator gentagne gange på samme mangler?

Forbliver mangler uløste på tværs af turns?

Ændrer reshape-adfærd sig ikke trods gentagne signaler?

Typiske mønstre at observere

Udeladte begrænsninger

Manglende forventningsafstemning

Fravær af naturlige næste afklaringspunkter

CQC-5 · Kontekstfølsomhed
Definition

Kontekstfølsomhed måler systemets evne til at tilpasse tone, tempo og tilgang til brugerens signaler.

Analytiske spørgsmål

Bliver tonen ensartet på tværs af forskellige case-typer?

Forekommer over-empati i neutrale inputs?

Forekommer analyse-pres i sårbarheds-mode?

Typiske mønstre at observere

Flad tone uanset følelsesniveau

For hurtig metodeintroduktion

Manglende skift mellem afklarings- og sårbarheds-mode

Analyseprincipper (kritisk)

Ingen CQC vurderes isoleret

Ingen numerisk “score” afgør kvalitet

Konflikter mellem CQC er forventelige

Stabilitet er vigtigere end maksimering

Ændringsdisciplin

Denne guide:

ændres sjældent

versionsstyres eksplicit

revideres kun efter længere tids stabil drift

Hvis systemet ikke kan forbedres yderligere ift. denne guide:

er det et signal om modenhed

ikke en fejl

Afsluttende note (normativ)

CQC er en kvalitetslinse, ikke sandheden selv.
Hvis analysen gentagne gange ikke forklarer oplevet kvalitet, er det rammen, ikke systemet, der skal udfordres.

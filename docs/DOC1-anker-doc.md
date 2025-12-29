📄 DOC 1 (anker-dokument)
Titel

RMRC · Fractal Board Architecture
Subtitle: A Non-Agentic, Reflective AI System Design

Formål

Dette dokument definerer RMRC’s grundlæggende arkitektur og ontologi.
Det er den autoritative forklaringsmodel for systemet.

Disposition

Executive intent (hvad RMRC er – og ikke er)

Grundantagelser og designprincipper

Fraktal arkitektur: systemet som gentagende struktur

Bord-analogien (Boards som meningsrum)

Roller vs. lag vs. boards

AI-kaldets rolle i arkitekturen

Hvad systemet eksplicit ikke gør

Konsekvenser for implementering, test og governance

Læsevejledning: hvordan resten af dokumenterne bruges

📄 DOC 2
Titel

RMRC · Role & Board Registry
Subtitle: Structural Contracts for Reflective Dialogue

Formål

At fastlåse hvilke roller der findes, og hvilket bord de hører til, uden at blande prompts eller kode ind.

Disposition

Hvad en rolle er (og ikke er)

Hvad et board er

Board-typer (fx Reflective, Boundary, Navigation)

Rolle-kontrakter (formål, input, output, forbud)

Rolle-til-board mapping

Statisk vs. fremtidig udvidelse

Designrationale (hvorfor disse roller – og ikke flere)

📄 DOC 3
Titel

RMRC · Prompt & Configuration Strategy
Subtitle: Versioned AI Behavior Without Code Drift

Formål

At sikre, at AI-adfærd kan ændres uden kodeændringer, og at ChatGPT kan bruges aktivt til analyse og redesign.

Disposition

Problemet med spredte prompts

Central prompt-registry (konceptuelt)

Prompt-versionering

Sammenhæng mellem:

runtime

prompt-version

log-entries

AI-meta vs. AI-product prompts

Hvordan ChatGPT bruges til:

prompt-analyse

forslag

regressionstest

Hvad der ikke må være konfigurerbart

📄 DOC 4
Titel

RMRC · Logging, Replay & Learning Loop
Subtitle: Auditability Without Adaptive Drift

Formål

At definere logging som observations- og læringsgrundlag, ikke som adaptiv runtime-mekanisme.

Disposition

Loggingens rolle i RMRC

Hvad der logges (og hvorfor)

Hvad der aldrig logges

Replay-begrebet

AI-assisteret analyse af logs

Sammenlignende test (før/efter prompt-ændringer)

Klar adskillelse mellem:

drift

analyse

beslutning

# Logging Contract – RMRC

Logs anvendes til:
- arkitektonisk evaluering
- mønstergenkendelse
- UX- og dialogkvalitet

Logs anvendes ikke til:
- runtime-tilpasning
- automatisk optimering
- feedback loops i produktion


Der kan logges signaler fra:
- Konsolidering
- Navigation (mode)
- Brugerperspektiv-Evaluator (meta)

Alle logs er observerende.
Ingen logs påvirker dialogens forløb.

SYSTEM_MODE = "RMRC"
ARCHITECTURE_VERSION = "post-screening"

"architecture": "RMRC",
"mode": "reflective_dialogue"

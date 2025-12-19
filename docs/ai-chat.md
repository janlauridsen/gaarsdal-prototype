(AI-chat og API-dokumentation)

# AI Chat

## Formål
AI-chatten fungerer som en digital assistent for besøgende.

## Flow
1. Bruger skriver besked
2. Frontend sender POST til `/api/chat`
3. API svarer med AI-genereret tekst
4. UI opdateres med svaret

## API Endpoint

### POST `/api/chat`

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Hej" }
  ]
}


Response:

{
  "content": "Hej! Hvordan kan jeg hjælpe?"
}

Forbedringer (roadmap)

Error handling

Typing indicator

Persistente chats

Rate limiting


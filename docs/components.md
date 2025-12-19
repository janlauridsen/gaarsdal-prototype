(Detaljeret komponent-dokumentation)

# UI Komponenter

Denne fil beskriver alle komponenter i `/components`.

---

## Hero

**Formål:**  
Viser hero-sektion med overskrift, tekst og CTA.

**Props:**
- `title: string`
- `lead: string`
- `primary: { label: string; href: string }`
- `secondary?: { label: string; href: string }`

---

## Header

**Formål:**  
Topnavigation med responsiv mobilmenu.

**State:**
- `open: boolean` – styrer mobilmenu

**Noter:**
- Lukker menu automatisk ved resize
- Sticky position

---

## Footer

**Formål:**  
Footer med kontaktinformation.

**Props:**
- `contact?: { phone?: string; email?: string }`

---

## AIChatButton

**Formål:**  
Fast knap der åbner AI-chat.

**Props:**
- `onClick: () => void`

---

## AIChat

**Formål:**  
Modal-lignende chatinterface.

**State:**
- `messages`
- `input`
- `loading`

**Props:**
- `onClose: () => void`

**Afhængigheder:**
- `/api/chat`

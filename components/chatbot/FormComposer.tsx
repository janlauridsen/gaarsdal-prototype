"use client"

import { useState } from "react"
import type { FormFieldSpec } from "./types"
import styles from "../Chatbot.module.css"

type Props = {
  fields: FormFieldSpec[]
  onSend: (text: string) => void
  loading: boolean
  disabled: boolean
}

export default function FormComposer({ fields, onSend, loading, disabled }: Props) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  const handleChange = (id: string, value: string) => {
    setValues((prev) => ({ ...prev, [id]: value }))
    if (errors[id]) setErrors((prev) => ({ ...prev, [id]: false }))
  }

  const handleSubmit = () => {
    const newErrors: Record<string, boolean> = {}
    let hasError = false

    for (const field of fields) {
      if (field.required && !values[field.id]?.trim()) {
        newErrors[field.id] = true
        hasError = true
      }
    }

    if (hasError) {
      setErrors(newErrors)
      return
    }

    // Serialize to key: value format that parseFormText expects
    const lines = fields
      .filter((f) => values[f.id]?.trim())
      .map((f) => `${f.id}: ${values[f.id].trim()}`)
      .join("\n")

    onSend(lines)
    setValues({})
    setErrors({})
  }

  return (
    <div className={styles.formComposer}>
      {fields.map((field) => (
        <div key={field.id} className={styles.formField}>
          <label className={styles.formLabel}>
            {field.label}
            {field.required && <span className={styles.formRequired}> *</span>}
          </label>
          <input
            className={`${styles.formInput}${errors[field.id] ? ` ${styles.formInputError}` : ""}`}
            type={field.id === "email" || field.id === "kontakt" ? "text" : "text"}
            value={values[field.id] ?? ""}
            placeholder={field.placeholder ?? field.label}
            disabled={disabled || loading}
            onChange={(e) => handleChange(field.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleSubmit()
              }
            }}
          />
          {errors[field.id] && (
            <span className={styles.formError}>{field.label} er påkrævet</span>
          )}
        </div>
      ))}
      <button
        className={styles.formSubmitBtn}
        onClick={handleSubmit}
        disabled={disabled || loading}
      >
        {loading ? "Sender…" : "Send"}
      </button>
    </div>
  )
}

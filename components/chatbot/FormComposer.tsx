"use client"

import { useState } from "react"
import type { FormFieldSpec } from "./types"
import styles from "../Chatbot.module.css"

type Props = {
  fields: FormFieldSpec[]
  onSend: (text: string) => void
  onCancel?: () => void
  secondaryAction?: { label: string; onClick: () => void }
  loading: boolean
  disabled: boolean
  initialValues?: Record<string, string>
  summary?: string
}

export default function FormComposer({ fields, onSend, onCancel, secondaryAction, loading, disabled, initialValues, summary }: Props) {
  const [values, setValues] = useState<Record<string, string>>(initialValues ?? {})
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
    if (hasError) { setErrors(newErrors); return }

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
      {/* Escape row — top */}
      {(onCancel || secondaryAction) && (
        <div className={styles.formEscapeRow}>
          {onCancel && (
            <button type="button" onClick={onCancel} className={styles.formEscapeBtn}>
              ← Tilbage
            </button>
          )}
          {secondaryAction && (
            <button type="button" onClick={secondaryAction.onClick} className={styles.formSecondaryBtn}>
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}

      {/* Summary panel */}
      {summary && (
        <div style={{ fontSize: "13px", color: "#6B675F", background: "#F9F8F5", borderRadius: "8px", padding: "10px 12px", marginBottom: "8px", lineHeight: 1.5 }}>
          <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#9CA3AF", display: "block", marginBottom: "3px" }}>Baseret på vores samtale</span>
          {summary}
        </div>
      )}

      {/* Fields */}
      {fields.map((field) => (
        <div key={field.id} className={styles.formField}>
          <label className={styles.formLabel}>
            {field.label}
            {field.required && <span className={styles.formRequired}> *</span>}
          </label>
          <input
            className={`${styles.formInput}${errors[field.id] ? ` ${styles.formInputError}` : ""}`}
            type="text"
            value={values[field.id] ?? ""}
            placeholder={field.placeholder ?? field.label}
            disabled={disabled || loading}
            onChange={(e) => handleChange(field.id, e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSubmit() } }}
          />
          {errors[field.id] && (
            <span className={styles.formError}>{field.label} er påkrævet</span>
          )}
        </div>
      ))}

      {/* Submit */}
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

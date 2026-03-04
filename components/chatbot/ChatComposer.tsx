"use client"

import type { KeyboardEvent, RefObject } from "react"
import { PaperAirplaneIcon } from "@heroicons/react/24/outline"

import styles from "../Chatbot.module.css"

type Props = {
  textareaRef: RefObject<HTMLTextAreaElement>
  value: string
  placeholder: string
  disabled: boolean
  loading: boolean
  onChange: (value: string) => void
  onSend: (text: string) => void
}

export default function ChatComposer({ textareaRef, value, placeholder, disabled, loading, onChange, onSend }: Props) {
  return (
    <div className={styles.inputRow}>
      <textarea
        ref={textareaRef}
        className={styles.textarea}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        disabled={disabled}
        onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            const text = value.trim()
            if (!text) return
            onSend(text)
          }
        }}
      />
      <button
        className={styles.sendBtn}
        onClick={() => {
          const text = value.trim()
          if (!text) return
          onSend(text)
        }}
        title="Send"
        aria-label="Send"
        disabled={disabled || loading || !value.trim()}
      >
        <PaperAirplaneIcon className={styles.sendBtnIcon} />
      </button>
    </div>
  )
}

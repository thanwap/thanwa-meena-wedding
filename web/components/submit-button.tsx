"use client"

import { useFormStatus } from "react-dom"

interface SubmitButtonProps {
  label: string
  loadingLabel?: string
  className?: string
}

export function SubmitButton({ label, loadingLabel, className }: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className={
        className ??
        "w-full cursor-pointer rounded bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
      }
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="animate-spin h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12" cy="12" r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
            />
          </svg>
          {loadingLabel ?? label}
        </span>
      ) : (
        label
      )}
    </button>
  )
}

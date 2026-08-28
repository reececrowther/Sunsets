'use client'

import { useState } from 'react'
import { NotifyModal } from './NotifyModal'

interface Props {
  children:  React.ReactNode
  style?:    React.CSSProperties
  className?: string
}

export function NotifyButton({ children, style, className }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className}
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', ...style }}
      >
        {children}
      </button>
      <NotifyModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}

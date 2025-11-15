"use client"

import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type PageHeroProps = {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  children?: ReactNode
  className?: string
}

export function PageHero({ eyebrow, title, description, actions, children, className }: PageHeroProps) {
  return (
    <section
      className={cn(
        "rounded-[40px] border border-white/10 bg-gradient-to-br from-[#050407] via-[#09060f] to-[#0d0b14] p-8 text-white shadow-[0_35px_120px_rgba(0,0,0,0.55)] space-y-6",
        className,
      )}
    >
      <div className="space-y-3">
        {eyebrow && <p className="text-xs uppercase tracking-[0.4em] text-white/50">{eyebrow}</p>}
        <h1 className="font-display text-4xl leading-tight">{title}</h1>
        {description && <p className="text-white/70">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      {children}
    </section>
  )
}

"use client"

import { PageHero } from "@/components/page-hero"

const faqs = [
  {
    question: "How do I recover a kit draft?",
    answer: "Drafts live in My Projects. Resume slicing or publish as a finished kit from there.",
  },
  {
    question: "Can I share private kits?",
    answer: "Set visibility to private or friends-only when publishing. Only invited users can access.",
  },
  {
    question: "Where are my uploaded stems stored?",
    answer: "All media is secured in our cloud vault with redundant backups.",
  },
]

export default function HelpPage() {
  return (
    <div className="w-full max-w-4xl space-y-6 px-4 py-10 lg:px-0">
      <PageHero eyebrow="Support" title="Help center" description="Answers for the most common kit-building questions." />
      <div className="space-y-4">
        {faqs.map((faq) => (
          <div
            key={faq.question}
            className="rounded-[28px] border border-white/10 bg-black/30 p-5 text-white shadow-[0_25px_80px_rgba(5,5,7,0.65)]"
          >
            <p className="text-lg font-semibold">{faq.question}</p>
            <p className="text-sm text-white/70">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

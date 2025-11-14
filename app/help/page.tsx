"use client"

import { Card, CardContent } from "@/components/ui/card"

const faqs = [
  { question: "How do I recover a kit draft?", answer: "Drafts live in My Projects. Resume slicing or publish as a finished kit from there." },
  { question: "Can I share private kits?", answer: "Set visibility to private or friends-only when publishing. Only invited users can access." },
  { question: "Where are my uploaded stems stored?", answer: "All media is secured in our cloud vault with redundant backups." },
]

export default function HelpPage() {
  return (
    <div className="px-4 py-10 md:px-12 lg:px-16">
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">Support</p>
          <h1 className="font-display text-4xl text-white">Help center</h1>
          <p className="text-white/70">Answers for the most common kit-building questions.</p>
        </div>
        <div className="grid gap-4">
          {faqs.map((faq) => (
            <Card key={faq.question} className="border-white/10 bg-white/5 text-white">
              <CardContent className="space-y-2 p-4">
                <p className="text-lg font-semibold">{faq.question}</p>
                <p className="text-sm text-white/60">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

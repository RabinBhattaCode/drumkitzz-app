"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Download, Play, AudioWaveformIcon as Waveform } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Kit } from "@/components/my-kits-panel"

export default function KitDetailPage({ params }: { params: { id: string } }) {
  const [kit, setKit] = useState<Kit | null>(null)
  const [slices, setSlices] = useState<any[]>([])

  useEffect(() => {
    // Load kit from localStorage
    const savedKits = localStorage.getItem("drumkitzz-kits")
    if (savedKits) {
      try {
        const kits: Kit[] = JSON.parse(savedKits)
        const foundKit = kits.find((k) => k.id === params.id)
        if (foundKit) {
          setKit(foundKit)

          // Generate mock slices for demo
          const mockSlices = Array.from({ length: foundKit.sliceCount }, (_, i) => ({
            id: `slice-${i}`,
            name: `${foundKit.name.split(" ")[0]}_${["Kick", "Snare", "Hat", "Perc", "Tom"][i % 5]}_${Math.floor(i / 5) + 1}`,
            type: ["kick", "snare", "hat", "perc", "tom"][i % 5],
            duration: Math.floor(Math.random() * 500) + 100,
          }))
          setSlices(mockSlices)
        }
      } catch (error) {
        console.error("Error parsing saved kits:", error)
      }
    }
  }, [params.id])

  if (!kit) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Kit not found</h1>
        <Link href="/my-kits">
          <Button>Back to My Kits</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <Link href="/my-kits" className="flex items-center text-blue-600 mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to My Kits
      </Link>

      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="md:w-1/3">
          <div className="relative h-64 w-full rounded-lg overflow-hidden shadow-md">
            <Image src={kit.image || "/placeholder.svg"} alt={kit.name} fill className="object-cover" />
          </div>
        </div>

        <div className="md:w-2/3">
          <h1 className="text-3xl font-bold mb-2">{kit.name}</h1>
          <p className="text-gray-500 mb-4">Created on {new Date(kit.createdAt).toLocaleDateString()}</p>

          <div className="flex items-center gap-3 mb-6">
            <Button className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download Kit
            </Button>
            <Button variant="outline">Edit Kit</Button>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <h2 className="font-semibold mb-2">Kit Details</h2>
            <ul className="space-y-1 text-sm">
              <li>
                <span className="font-medium">Total Slices:</span> {kit.sliceCount}
              </li>
              <li>
                <span className="font-medium">Format:</span> WAV
              </li>
              <li>
                <span className="font-medium">Includes:</span> MIDI, Metadata
              </li>
            </ul>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Slices ({slices.length})</h2>

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="grid grid-cols-12 bg-gray-100 p-3 rounded-t-lg font-medium text-sm">
          <div className="col-span-1">#</div>
          <div className="col-span-4">Name</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-3">Duration</div>
          <div className="col-span-2">Actions</div>
        </div>

        <div className="divide-y">
          {slices.map((slice, index) => (
            <div key={slice.id} className="grid grid-cols-12 p-3 items-center text-sm hover:bg-gray-50">
              <div className="col-span-1">{index + 1}</div>
              <div className="col-span-4 font-medium">{slice.name}</div>
              <div className="col-span-2 capitalize">{slice.type}</div>
              <div className="col-span-3">{slice.duration}ms</div>
              <div className="col-span-2 flex gap-2">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Play className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Waveform className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

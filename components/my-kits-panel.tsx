"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Download, Box } from "lucide-react"

export type Kit = {
  id: string
  name: string
  image: string
  createdAt: string
  sliceCount: number
}

export function MyKitsPanel() {
  // Use a ref to directly access the panel element
  const panelRef = useRef<HTMLDivElement>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [kits, setKits] = useState<Kit[]>([])

  // Load sample kits
  useEffect(() => {
    const sampleKits: Kit[] = [
      {
        id: "kit-1",
        name: "Boom Bap Kit",
        image: "/acoustic-drum-kit.png",
        createdAt: new Date().toISOString(),
        sliceCount: 12,
      },
      {
        id: "kit-2",
        name: "Lo-Fi Drums",
        image: "/lofi-drums.png",
        createdAt: new Date().toISOString(),
        sliceCount: 8,
      },
      {
        id: "kit-3",
        name: "Trap Essentials",
        image: "/trap-drums.png",
        createdAt: new Date().toISOString(),
        sliceCount: 15,
      },
    ]
    setKits(sampleKits)
  }, [])

  // Direct DOM manipulation to ensure the toggle works
  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.style.width = collapsed ? "96px" : "224px"
      console.log("Panel width set to:", collapsed ? "96px" : "224px")
    }
  }, [collapsed])

  // Simple toggle function with direct DOM manipulation
  function handleToggle() {
    console.log("Toggle clicked, current state:", collapsed)
    setCollapsed(!collapsed)
    console.log("New state will be:", !collapsed)

    // Force update the panel width immediately
    if (panelRef.current) {
      const newWidth = !collapsed ? "96px" : "224px"
      panelRef.current.style.width = newWidth
      console.log("Panel width immediately set to:", newWidth)
    }
  }

  return (
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        height: "100vh",
        backgroundColor: "#353438",
        transition: "width 0.3s",
        zIndex: 10,
        borderLeft: "1px solid #4a4a4a",
        width: collapsed ? "96px" : "224px",
      }}
    >
      {/* Header with toggle button */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "12px 0",
          borderBottom: "1px solid #4a4a4a",
        }}
      >
        <button
          onClick={handleToggle}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "4px 12px",
            backgroundColor: "#2B292C",
            color: "white",
            borderRadius: "4px",
            border: "none",
            cursor: "pointer",
          }}
        >
          <Box size={16} />
          {!collapsed && <span style={{ marginLeft: "8px" }}>My Kits</span>}
        </button>
      </div>

      {/* Kits list */}
      <div style={{ height: "calc(100vh - 44px)", overflow: "auto", padding: "8px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {kits.map((kit) => (
            <div
              key={kit.id}
              style={{
                backgroundColor: "#2B292C",
                borderRadius: "8px",
                padding: "8px",
                display: "flex",
                flexDirection: collapsed ? "column" : "column",
                alignItems: collapsed ? "center" : "flex-start",
              }}
            >
              {collapsed ? (
                <>
                  <div
                    style={{
                      position: "relative",
                      width: "48px",
                      height: "48px",
                      borderRadius: "6px",
                      overflow: "hidden",
                      marginBottom: "8px",
                    }}
                  >
                    <Image
                      src={kit.image || "/placeholder.svg"}
                      alt={kit.name}
                      fill
                      style={{ objectFit: "cover" }}
                      sizes="48px"
                    />
                  </div>
                  <button
                    style={{
                      height: "24px",
                      width: "24px",
                      padding: 0,
                      backgroundColor: "transparent",
                      border: "none",
                      color: "#a0a0a0",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Download size={12} />
                  </button>
                </>
              ) : (
                <>
                  <div style={{ display: "flex", marginBottom: "4px" }}>
                    <div
                      style={{
                        position: "relative",
                        width: "48px",
                        height: "48px",
                        borderRadius: "6px",
                        overflow: "hidden",
                        marginRight: "8px",
                        flexShrink: 0,
                      }}
                    >
                      <Image
                        src={kit.image || "/placeholder.svg"}
                        alt={kit.name}
                        fill
                        style={{ objectFit: "cover" }}
                        sizes="48px"
                      />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h3
                        style={{
                          color: "white",
                          fontSize: "14px",
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          margin: 0,
                        }}
                      >
                        {kit.name}
                      </h3>
                      <p style={{ color: "#a0a0a0", fontSize: "12px", margin: "4px 0 0 0" }}>{kit.sliceCount} slices</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                    <Link
                      href={`/my-kits/${kit.id}`}
                      style={{ color: "#60a5fa", fontSize: "12px", textDecoration: "none" }}
                    >
                      View
                    </Link>
                    <button
                      style={{
                        fontSize: "12px",
                        color: "#a0a0a0",
                        backgroundColor: "transparent",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Download size={12} style={{ marginRight: "4px" }} />
                      Download
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

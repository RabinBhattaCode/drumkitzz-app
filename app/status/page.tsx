"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Mock data - in a real app, this would come from your monitoring service
const mockSystemStatus = {
  api: { status: "operational", uptime: 99.98, responseTime: 120 },
  database: { status: "operational", uptime: 99.95, responseTime: 45 },
  storage: { status: "operational", uptime: 100, responseTime: 85 },
  auth: { status: "operational", uptime: 99.99, responseTime: 230 },
  cdn: { status: "operational", uptime: 99.97, responseTime: 65 },
}

const mockIncidents = [
  {
    id: "inc-001",
    title: "API Latency Issues",
    status: "resolved",
    created_at: "2023-04-15T08:23:00Z",
    resolved_at: "2023-04-15T10:45:00Z",
    components: ["api"],
    description: "We experienced elevated latency in our API endpoints due to database connection pool exhaustion.",
  },
  {
    id: "inc-002",
    title: "Storage Service Degradation",
    status: "resolved",
    created_at: "2023-03-22T14:10:00Z",
    resolved_at: "2023-03-22T16:30:00Z",
    components: ["storage"],
    description: "Our storage service experienced degraded performance due to a network issue with our cloud provider.",
  },
]

// Mock performance data for the charts
const generatePerformanceData = () => {
  const data = []
  const now = new Date()

  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000)
    data.push({
      time: time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      api: Math.floor(Math.random() * 50) + 100,
      database: Math.floor(Math.random() * 20) + 30,
      storage: Math.floor(Math.random() * 30) + 60,
    })
  }

  return data
}

export default function StatusPage() {
  const [performanceData, setPerformanceData] = useState(generatePerformanceData())
  const [lastUpdated, setLastUpdated] = useState(new Date())

  useEffect(() => {
    // In a real app, you would fetch this data from your monitoring service
    const interval = setInterval(() => {
      setPerformanceData(generatePerformanceData())
      setLastUpdated(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">System Status</h1>
          <p className="text-muted-foreground">Current operational status of all systems</p>
        </div>

        <div className="text-sm text-muted-foreground">Last updated: {lastUpdated.toLocaleString()}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        {Object.entries(mockSystemStatus).map(([key, value]) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="capitalize">{key}</CardTitle>
              <CardDescription>
                <Badge variant={value.status === "operational" ? "outline" : "destructive"}>{value.status}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uptime</span>
                  <span className="font-medium">{value.uptime}%</span>
                </div>
                <Progress value={value.uptime} className="h-1" />

                <div className="flex justify-between text-sm">
                  <span>Response Time</span>
                  <span className="font-medium">{value.responseTime}ms</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>System Performance (Last 24 Hours)</CardTitle>
          <CardDescription>Response times in milliseconds</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ChartContainer
              config={{
                api: {
                  label: "API",
                  color: "hsl(var(--chart-1))",
                },
                database: {
                  label: "Database",
                  color: "hsl(var(--chart-2))",
                },
                storage: {
                  label: "Storage",
                  color: "hsl(var(--chart-3))",
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line type="monotone" dataKey="api" stroke="var(--color-api)" strokeWidth={2} />
                  <Line type="monotone" dataKey="database" stroke="var(--color-database)" strokeWidth={2} />
                  <Line type="monotone" dataKey="storage" stroke="var(--color-storage)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Incidents</CardTitle>
          <CardDescription>Past system incidents and their resolution</CardDescription>
        </CardHeader>
        <CardContent>
          {mockIncidents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No incidents reported in the last 90 days.</div>
          ) : (
            <div className="space-y-6">
              {mockIncidents.map((incident) => (
                <div key={incident.id} className="border-b pb-6 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{incident.title}</h3>
                    <Badge variant="outline">{incident.status}</Badge>
                  </div>

                  <div className="text-sm text-muted-foreground mb-2">
                    <span>
                      {new Date(incident.created_at).toLocaleString()} -
                      {incident.resolved_at ? new Date(incident.resolved_at).toLocaleString() : "Ongoing"}
                    </span>
                  </div>

                  <div className="flex gap-2 mb-2">
                    {incident.components.map((component) => (
                      <Badge key={component} variant="secondary" className="capitalize">
                        {component}
                      </Badge>
                    ))}
                  </div>

                  <p className="text-sm">{incident.description}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

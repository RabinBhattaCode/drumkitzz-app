"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { AuditEventType } from "@/lib/audit-logger"

export default function SecurityDashboard() {
  // Initialize Supabase client inside component to avoid build-time errors
  const supabase = typeof window !== 'undefined' ? createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  ) : null;
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [securityEvents, setSecurityEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("24h")

  useEffect(() => {
    async function fetchSecurityData() {
      if (!supabase) return; // Skip if Supabase not initialized

      setLoading(true)

      // Calculate time range
      const now = new Date()
      let startTime: Date

      switch (timeRange) {
        case "24h":
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case "7d":
          startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case "30d":
          startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        default:
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      }

      // Fetch audit logs
      const { data: logs, error: logsError } = await supabase
        .from("audit_logs")
        .select("*")
        .gte("created_at", startTime.toISOString())
        .order("created_at", { ascending: false })
        .limit(100)

      if (logsError) {
        console.error("Error fetching audit logs:", logsError)
      } else {
        setAuditLogs(logs || [])
      }

      // Fetch security violation events
      const { data: violations, error: violationsError } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("event_type", AuditEventType.SECURITY_VIOLATION)
        .gte("created_at", startTime.toISOString())
        .order("created_at", { ascending: false })

      if (violationsError) {
        console.error("Error fetching security violations:", violationsError)
      } else {
        setSecurityEvents(violations || [])
      }

      setLoading(false)
    }

    fetchSecurityData()
  }, [timeRange])

  // Prepare chart data
  const eventCounts = auditLogs.reduce((acc: Record<string, number>, log) => {
    acc[log.event_type] = (acc[log.event_type] || 0) + 1
    return acc
  }, {})

  const chartData = Object.entries(eventCounts).map(([type, count]) => ({
    name: type.replace("user.", "").replace("sample.", "").replace("drumkit.", ""),
    count,
  }))

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Security Dashboard</h1>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Security Overview</h2>
          <p className="text-muted-foreground">Monitor security events and audit logs</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <span className="mr-2">Time Range:</span>
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="border rounded p-1">
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>

          <Button onClick={() => window.location.reload()}>Refresh Data</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Events</CardTitle>
            <CardDescription>All audit events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{auditLogs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Security Violations</CardTitle>
            <CardDescription>Potential security issues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-red-500">{securityEvents.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Unique Users</CardTitle>
            <CardDescription>Users with recorded activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {new Set(auditLogs.map((log) => log.user_id).filter(Boolean)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="mb-8">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="audit-logs">Audit Logs</TabsTrigger>
          <TabsTrigger value="security-events">Security Events</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Event Distribution</CardTitle>
              <CardDescription>Breakdown of events by type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ChartContainer
                  config={{
                    count: {
                      label: "Count",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="count" fill="var(--color-count)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit-logs">
          <Card>
            <CardHeader>
              <CardTitle>Recent Audit Logs</CardTitle>
              <CardDescription>Latest {auditLogs.length} events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Time</th>
                      <th className="text-left p-2">Event</th>
                      <th className="text-left p-2">User</th>
                      <th className="text-left p-2">IP Address</th>
                      <th className="text-left p-2">Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-2 text-sm">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="p-2">{log.event_type}</td>
                        <td className="p-2">{log.user_id || "Anonymous"}</td>
                        <td className="p-2 font-mono text-sm">{log.ip_address}</td>
                        <td className="p-2">
                          <Badge
                            variant={
                              log.severity === "critical"
                                ? "destructive"
                                : log.severity === "error"
                                  ? "destructive"
                                  : log.severity === "warning"
                                    ? "warning"
                                    : "outline"
                            }
                          >
                            {log.severity || "info"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security-events">
          <Card>
            <CardHeader>
              <CardTitle>Security Violations</CardTitle>
              <CardDescription>Potential security threats detected</CardDescription>
            </CardHeader>
            <CardContent>
              {securityEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No security violations detected in the selected time period.
                </div>
              ) : (
                <div className="space-y-4">
                  {securityEvents.map((event, index) => (
                    <Card key={index}>
                      <CardHeader className="py-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg text-red-500">Security Violation</CardTitle>
                          <Badge variant="destructive">{event.severity}</Badge>
                        </div>
                        <CardDescription>{new Date(event.created_at).toLocaleString()}</CardDescription>
                      </CardHeader>
                      <CardContent className="py-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium">User ID</p>
                            <p className="text-sm">{event.user_id || "Anonymous"}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">IP Address</p>
                            <p className="text-sm font-mono">{event.ip_address}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Resource</p>
                            <p className="text-sm">{event.resource_type || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">User Agent</p>
                            <p className="text-sm truncate">{event.user_agent || "N/A"}</p>
                          </div>
                        </div>

                        {event.details && (
                          <div className="mt-4">
                            <p className="text-sm font-medium">Details</p>
                            <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                              {JSON.stringify(event.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="py-2">
                        <Button variant="outline" size="sm">
                          Investigate
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

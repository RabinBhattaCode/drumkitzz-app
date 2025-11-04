import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export enum AuditEventType {
  USER_LOGIN = "user.login",
  USER_LOGOUT = "user.logout",
  USER_REGISTER = "user.register",
  USER_UPDATE = "user.update",
  USER_DELETE = "user.delete",
  SAMPLE_UPLOAD = "sample.upload",
  SAMPLE_DELETE = "sample.delete",
  DRUMKIT_CREATE = "drumkit.create",
  DRUMKIT_UPDATE = "drumkit.update",
  DRUMKIT_DELETE = "drumkit.delete",
  ADMIN_ACTION = "admin.action",
  SECURITY_VIOLATION = "security.violation",
}

export type AuditLogEntry = {
  event_type: AuditEventType
  user_id?: string
  ip_address?: string
  user_agent?: string
  resource_id?: string
  resource_type?: string
  details?: Record<string, any>
  severity?: "info" | "warning" | "error" | "critical"
}

export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    // Add timestamp
    const timestamp = new Date().toISOString()

    // Insert into audit_logs table
    const { error } = await supabase.from("audit_logs").insert({
      ...entry,
      created_at: timestamp,
    })

    if (error) {
      console.error("Failed to log audit event:", error)
    }

    // For critical events, we might want to trigger additional alerts
    if (entry.severity === "critical") {
      await triggerSecurityAlert(entry)
    }
  } catch (error) {
    console.error("Error in audit logging:", error)
  }
}

async function triggerSecurityAlert(entry: AuditLogEntry): Promise<void> {
  // This could send an email, SMS, or notification to security personnel
  console.error("SECURITY ALERT:", entry)

  // Example: Send to a webhook or notification service
  // await fetch(process.env.SECURITY_WEBHOOK_URL, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(entry),
  // })
}

// Middleware function to log API requests
export async function logApiRequest(
  req: Request,
  userId?: string,
  resourceType?: string,
  resourceId?: string,
): Promise<void> {
  const url = new URL(req.url)
  const userAgent = req.headers.get("user-agent") || undefined
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"

  await logAuditEvent({
    event_type: AuditEventType.ADMIN_ACTION,
    user_id: userId,
    ip_address: typeof ip === "string" ? ip.split(",")[0].trim() : "unknown",
    user_agent: userAgent,
    resource_type: resourceType || url.pathname,
    resource_id: resourceId,
    details: {
      method: req.method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams.entries()),
    },
    severity: "info",
  })
}

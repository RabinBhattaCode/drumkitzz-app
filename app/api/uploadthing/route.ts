import { createRouteHandler } from "uploadthing/next"

import { appFileRouter } from "./core"

export const runtime = "nodejs"

export const { GET, POST } = createRouteHandler({
  router: appFileRouter,
})

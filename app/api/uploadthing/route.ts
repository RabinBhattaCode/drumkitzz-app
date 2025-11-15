import { createRouteHandler } from "uploadthing/next"

import { audioFileRouter } from "./core"

export const { GET, POST } = createRouteHandler({
  router: audioFileRouter,
})

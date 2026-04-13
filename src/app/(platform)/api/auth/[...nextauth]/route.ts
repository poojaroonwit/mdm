import NextAuth from "next-auth"
import { buildAuthOptions } from "@/lib/auth"

async function authHandler(req: Request, context: any) {
  const authOptions = await buildAuthOptions()
  const handler = NextAuth(authOptions)
  return handler(req, context)
}

export { authHandler as GET, authHandler as POST }

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const searchTerm = 'widget-avatar-1772692711375.png'
  const versions = await prisma.chatbotVersion.findMany()

  console.log(`Searching ${versions.length} versions for "${searchTerm}"...`)
  for (const v of versions) {
    const configStr = JSON.stringify(v.config)
    if (configStr.includes(searchTerm)) {
      console.log(`\nFOUND in Version: ${v.id} (Chatbot: ${v.chatbotId})`)
      const config = v.config as any
      for (const [key, val] of Object.entries(config)) {
        if (String(val).includes(searchTerm)) {
          console.log(`  - ${key}: ${val}`)
        }
      }
    }
  }
}

main().finally(() => prisma.$disconnect())

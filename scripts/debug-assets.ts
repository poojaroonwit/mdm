import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const versions = await prisma.chatbotVersion.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  console.log(`Checking ${versions.length} recent versions...`)
  for (const v of versions) {
    const config = v.config as any
    console.log(`\nVersion: ${v.id} (Chatbot: ${v.chatbotId})`)
    const fields = ['avatarImageUrl', 'logo', 'headerLogo', 'headerAvatarImageUrl', 'widgetOpenBackgroundImage', 'widgetCloseImageUrl']
    let found = false
    for (const f of fields) {
      if (config[f]) {
        const val = String(config[f])
        const preview = val.length > 100 ? val.substring(0, 100) + '...' : val
        console.log(`  - ${f}: ${preview}`)
        found = true
      }
    }
    if (!found) console.log('  - No asset fields found in config')
  }
}

main().finally(() => prisma.$disconnect())

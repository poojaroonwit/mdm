/**
 * Migration script to update relative asset URLs (/uploads/...) to absolute MinIO URLs.
 * Run with: npx tsx scripts/migrate-avatar-urls.ts
 */
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

// The public base URL for MinIO assets
const PUBLIC_BASE = process.env.MINIO_PUBLIC_URL || 'https://dev-ncc-udp.qsncc.com'
const BUCKET = process.env.MINIO_UPLOADS_BUCKET || 'udp'

function convertToAbsolute(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return url || null
  if (url.startsWith('/uploads/')) {
    const relativePath = url.replace(/^\/uploads\//, '')
    return `${PUBLIC_BASE}/${BUCKET}/${relativePath}`
  }
  return url
}

async function main() {
  console.log('🚀 Starting Asset URL Migration...')
  console.log(`📍 Using Public Base: ${PUBLIC_BASE}`)
  console.log(`📍 Using Bucket: ${BUCKET}`)

  // 1. Update Chatbot top-level fields (logo)
  const chatbots = await prisma.chatbot.findMany({
    where: {
      OR: [
        { logo: { startsWith: '/uploads/' } }
      ]
    }
  })

  console.log(`\nFound ${chatbots.length} Chatbot records with relative logo paths.`)

  for (const chatbot of chatbots) {
    const newLogo = convertToAbsolute(chatbot.logo)
    
    await prisma.chatbot.update({
      where: { id: chatbot.id },
      data: { logo: newLogo }
    })
    console.log(`✅ Updated Chatbot [${chatbot.name}]: logo -> ${newLogo}`)
  }

  // 2. Update ChatbotVersion records (config JSON)
  const versions = await prisma.chatbotVersion.findMany()
  console.log(`\nChecking ${versions.length} ChatbotVersion records for nested URLs...`)

  let versionUpdateCount = 0
  for (const version of versions) {
    const config = version.config as any
    if (!config) continue

    let updated = false
    const newConfig = { ...config }

    // List of fields that might contain URLs based on Chatbot type definition
    const urlFields = [
      'avatarImageUrl', 
      'logo', 
      'headerLogo', 
      'headerAvatarImageUrl', 
      'widgetOpenBackgroundImage', 
      'widgetCloseImageUrl',
      'pwaIconUrl'
    ]

    for (const field of urlFields) {
      if (newConfig[field] && typeof newConfig[field] === 'string' && newConfig[field].startsWith('/uploads/')) {
        const oldVal = newConfig[field]
        newConfig[field] = convertToAbsolute(oldVal)
        updated = true
        console.log(`   - Field [${field}]: ${oldVal} -> ${newConfig[field]}`)
      }
    }

    if (updated) {
      await prisma.chatbotVersion.update({
        where: { id: version.id },
        data: { config: newConfig }
      })
      versionUpdateCount++
      console.log(`✅ Updated Version [${version.id}] for Chatbot [${version.chatbotId}]`)
    }
  }

  console.log(`\nUpdated ${versionUpdateCount} version records.`)
  console.log('\n✨ Migration Complete!')
}

main()
  .catch((e) => {
    console.error('❌ Migration Failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

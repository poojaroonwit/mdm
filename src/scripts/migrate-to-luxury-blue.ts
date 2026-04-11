import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const OLD_PINK = '#db2777'
const OLD_BLUE = '#1e40af'
const LUXURY_BLUE = '#1e40af'

async function main() {
  console.log('Starting Migration to Luxury Blue...')

  // 1. Update Chatbots
  const chatbotUpdate = await prisma.chatbot.updateMany({
    where: {
      OR: [
        { primaryColor: OLD_PINK },
        { primaryColor: OLD_BLUE }
      ]
    },
    data: {
      primaryColor: LUXURY_BLUE
    }
  })
  console.log(`Updated ${chatbotUpdate.count} chatbots to Luxury Blue.`)

  // 2. Update Chatbot Versions (JSON config)
  // This is trickier because we need to update a nested field.
  // We'll fetch them and update individually for precision if there aren't too many.
  
  const versions = await prisma.chatbotVersion.findMany({
    where: {
      OR: [
        {
          config: {
            path: ['theme', 'color', 'accent', 'primary'],
            equals: OLD_PINK
          }
        },
        {
          config: {
            path: ['theme', 'color', 'accent', 'primary'],
            equals: OLD_BLUE
          }
        },
        {
            config: {
              path: ['theme', 'primaryColor'],
              equals: OLD_PINK
            }
          },
          {
            config: {
              path: ['theme', 'primaryColor'],
              equals: OLD_BLUE
            }
          }
      ]
    }
  })

  console.log(`Found ${versions.length} versions requiring configuration updates.`)

  for (const v of versions) {
    let config = v.config as any
    
    // Deeply update the config
    if (config.theme) {
      if (config.theme.color?.accent?.primary === OLD_PINK || config.theme.color?.accent?.primary === OLD_BLUE) {
        config.theme.color.accent.primary = LUXURY_BLUE
      }
      if (config.theme.primaryColor === OLD_PINK || config.theme.primaryColor === OLD_BLUE) {
        config.theme.primaryColor = LUXURY_BLUE
      }
    }

    await prisma.chatbotVersion.update({
      where: { id: v.id },
      data: { config }
    })
  }

  console.log('Migration to Luxury Blue completed successfully.')
}

main()
  .catch(e => {
    console.error('Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

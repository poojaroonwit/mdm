import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Checking for pink chatbots...')
  const chatbots = await prisma.chatbot.findMany({
    where: {
      OR: [
        { primaryColor: '#db2777' },
        { 
          config: {
            path: ['theme', 'color', 'accent', 'primary'],
            equals: '#db2777'
          }
        }
      ]
    }
  })
  
  console.log(`Found ${chatbots.length} chatbots with pink color.`)
  for (const cb of chatbots) {
    console.log(`- ${cb.name} (${cb.id})`)
  }

  const versions = await prisma.chatbotVersion.findMany({
    where: {
      config: {
        path: ['theme', 'color', 'accent', 'primary'],
        equals: '#db2777'
      }
    }
  })

  console.log(`Found ${versions.length} versions with pink color.`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

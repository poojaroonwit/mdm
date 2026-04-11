import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding storage connections...')

  // Check if MinIO connection already exists
  const existingMinio = await prisma.storageConnection.findFirst({
    where: {
      type: 'minio',
      name: 'Local MinIO'
    }
  })

  if (!existingMinio) {
    console.log('Creating Local MinIO connection...')
    await prisma.storageConnection.create({
      data: {
        name: 'Local MinIO',
        type: 'minio',
        description: 'Default local MinIO storage',
        isActive: true,
        status: 'connected',
        config: {
          endpoint: 'http://localhost:9000',
          accessKey: 'minioadmin',
          secretKey: 'minioadmin',
          bucket: 'default',
          useSSL: false
        }
      }
    })
    console.log('✓ Created Local MinIO connection')
  } else {
    console.log('✓ Local MinIO connection already exists')
  }
}

main()
  .catch((e) => {
    console.error('Error seeding storage connections:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

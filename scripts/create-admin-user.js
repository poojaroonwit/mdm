const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const prisma = new PrismaClient()
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@example.com').trim().toLowerCase()
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123'
const ADMIN_NAME = (process.env.ADMIN_NAME || 'Admin User').trim()
const ADMIN_ROLE = process.env.ADMIN_ROLE || 'ADMIN'

if (!process.env.DATABASE_URL) {
  console.error('Missing required DATABASE_URL environment variable')
  process.exit(1)
}

async function createAdminUser() {
  try {
    console.log(`Creating admin user bootstrap for ${ADMIN_EMAIL}...`)

    if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) {
      throw new Error('ADMIN_PASSWORD must be at least 8 characters long')
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL }
    })

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12)
    const allowedLoginMethods = ['email']

    if (existingUser) {
      console.log('Admin user already exists. Updating password and resetting security flags...')

      const updatedUser = await prisma.user.update({
        where: { email: ADMIN_EMAIL },
        data: {
          name: ADMIN_NAME,
          password: hashedPassword,
          role: ADMIN_ROLE,
          isActive: true,
          lockoutUntil: null,
          failedLoginAttempts: 0,
          requiresPasswordChange: false,
          allowedLoginMethods
        }
      })

      console.log('Updated admin user:')
      console.log('  - Password reset')
      console.log('  - Set to active')
      console.log('  - Unlocked account')
      console.log('  - Allowed login methods: email')
      return updatedUser
    }

    const adminUser = await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        name: ADMIN_NAME,
        password: hashedPassword,
        role: ADMIN_ROLE,
        isActive: true,
        allowedLoginMethods
      }
    })

    console.log('Created admin user:')
    console.log(`   Email: ${adminUser.email}`)
    console.log(`   Password: ${ADMIN_PASSWORD}`)
    console.log(`   Role: ${adminUser.role}`)
    console.log(`   ID: ${adminUser.id}`)

    return adminUser
  } catch (error) {
    console.error('Error creating admin user:', error)
    throw error
  }
}

if (require.main === module) {
  createAdminUser()
    .then(() => {
      console.log('Admin user creation completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Admin user creation failed:', error)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}

module.exports = { createAdminUser }

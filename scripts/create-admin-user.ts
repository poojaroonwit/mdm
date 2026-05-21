import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const email = (process.env.ADMIN_EMAIL || 'admin@example.com').trim().toLowerCase()
const password = process.env.ADMIN_PASSWORD || 'password123'
const name = (process.env.ADMIN_NAME || 'Admin User').trim()
const role = process.env.ADMIN_ROLE || 'ADMIN'

async function main() {
  if (!password || password.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters long')
  }

  console.log(`Checking if user ${email} exists...`)

  const existing = await prisma.user.findUnique({
    where: { email }
  })

  if (existing) {
    console.log(`User ${email} already exists. Updating password...`)
    const hashedPassword = await bcrypt.hash(password, 12)

    await prisma.user.update({
      where: { email },
      data: {
        name,
        password: hashedPassword,
        role,
        isActive: true,
        lockoutUntil: null,
        failedLoginAttempts: 0,
        requiresPasswordChange: false,
        allowedLoginMethods: ['email', 'credentials']
      }
    })

    console.log(`Password updated and role set to ${role}.`)
    return
  }

  console.log(`Creating new user ${email}...`)
  const hashedPassword = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role,
      isActive: true,
      allowedLoginMethods: ['email', 'credentials']
    }
  })

  console.log('User created successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

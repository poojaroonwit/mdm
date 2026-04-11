import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'admin@example.com' } })
  console.log('User found:', !!user)
  if (user) {
    console.log('isActive:', user.isActive)
    console.log('role:', user.role)
    console.log('has password:', !!user.password)
    console.log('allowedLoginMethods:', user.allowedLoginMethods)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

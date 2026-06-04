
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUserRole() {
    const email = 'admin@example.com' // Assuming this is the user
    const user = await prisma.user.findUnique({
        where: { email }
    })

    console.log('User:', user?.email)
    console.log('Role:', user?.role)
}

checkUserRole()
    .catch(console.error)
    .finally(() => prisma.$disconnect())


import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addMemberToSpace() {
    const spaceId = '932fa808-215e-4c45-b7f7-805ceb5cb4c2'
    const userEmail = 'jane.doe@example.com'
    
    console.log(`Adding ${userEmail} to space ${spaceId}...`)

    const user = await prisma.user.findUnique({
        where: { email: userEmail }
    })

    if (!user) {
        console.error('❌ User not found!')
        return
    }

    try {
        await prisma.spaceMember.upsert({
            where: {
                spaceId_userId: {
                    spaceId,
                    userId: user.id
                }
            },
            update: { role: 'member' },
            create: {
                spaceId,
                userId: user.id,
                role: 'member'
            }
        })
        console.log('✅ Success! User added to space.')
    } catch (error) {
        console.error('❌ Error adding member:', error)
    }
}

addMemberToSpace()
    .catch(console.error)
    .finally(() => prisma.$disconnect())

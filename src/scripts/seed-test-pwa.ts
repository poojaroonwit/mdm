import { PrismaClient } from '@prisma/client'
// deepcode ignore javascript/NoHardcodedPasswords: Test data for development seeding

const prisma = new PrismaClient()

async function main() {
    console.log('Creating test user...')

    // Create or find a test user first
    const user = await prisma.user.upsert({
        where: { email: 'test@example.com' },
        update: {},
        create: {
            email: 'test@example.com',
            name: 'Test User',
            // deepcode ignore NoHardcodedPasswords: Test data for development only
            password: '$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u', // hashed 'password'
        }
    })

    console.log('Created/found user:', user.id)
    console.log('Creating test chatbot with PWA settings...')

    const chatbot = await prisma.chatbot.create({
        data: {
            name: 'Test PWA Chatbot',
            description: 'Test chatbot for PWA banner verification',
            apiEndpoint: 'https://api.openai.com/v1/chat/completions', // Required field
            apiAuthType: 'bearer',
            primaryColor: '#1e40af',
            fontColor: '#000000',
            fontFamily: 'Inter',
            fontSize: '14px',
            borderRadius: '8px',
            borderWidth: '1px',
            borderColor: '#e5e7eb',
            messageBoxColor: '#ffffff',
            deploymentType: 'popover',
            engineType: 'chatkit',
            createdBy: user.id, // Required field
        }
    })

    // Create a version with PWA settings
    await prisma.chatbotVersion.create({
        data: {
            chatbotId: chatbot.id,
            version: '1.0.0',
            isPublished: true,
            createdBy: user.id,
            config: {
                // PWA Settings
                pwaEnabled: true,
                pwaInstallScope: 'website', // Top overlay mode - the fix we're testing!
                pwaBannerText: 'Install for quick access',
                pwaBannerBgColor: '#1e40af',
                pwaBannerFontColor: '#ffffff',
                pwaBannerButtonBgColor: '#ffffff',
                pwaBannerButtonTextColor: '#1e40af',
                // Widget settings
                widgetPosition: 'bottom-right',
                widgetSize: '60px',
                widgetBackgroundColor: '#1e40af',
                chatbotEnabled: true,
            }
        }
    })

    console.log('Created chatbot:', chatbot.id)
    console.log('')
    console.log('Test the embed API at:')
    console.log(`http://localhost:3000/api/embed?id=${chatbot.id}`)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())

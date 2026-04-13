import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Default system settings
const defaultSettings = {
    siteName: 'Unified Data Platform',
    deletePolicyDays: 30,
    enableAuditTrail: true,
    requireEmailVerification: true,
    requireAdminApproval: false,
    uiProtectionEnabled: false
}

// GET /api/system-settings - Get current system settings
export async function GET() {
    try {
        // Fetch ALL settings from the database
        const allSettings = await prisma.systemSetting.findMany()

        // Find the 'global' record
        const settingsRecord = allSettings.find(s => s.key === 'global')

        // Parse global settings
        let globalSettings = {}
        if (settingsRecord) {
            try {
                globalSettings = JSON.parse(settingsRecord.value)
            } catch (e) {
                console.error('Failed to parse global settings blob:', e)
            }
        }

        // Create a flat map of all individual settings
        // Individual keys in the table override values in the 'global' blob
        const individualSettings = allSettings.reduce((acc: Record<string, any>, s) => {
            if (s.key !== 'global') {
                // Try to parse as JSON if it looks like an object/array, otherwise use as string/number/boolean
                if (s.value === 'true') acc[s.key] = true
                else if (s.value === 'false') acc[s.key] = false
                else if (!isNaN(Number(s.value)) && s.value.trim() !== '') acc[s.key] = Number(s.value)
                else {
                    try {
                        acc[s.key] = JSON.parse(s.value)
                    } catch {
                        acc[s.key] = s.value
                    }
                }
                // Legacy support mapping
                if (s.key === 'appName') acc['siteName'] = acc[s.key]
            }
            return acc
        }, {})

        const mergedSettings = {
            ...defaultSettings,
            ...globalSettings,
            ...individualSettings
        }

        return NextResponse.json({
            success: true,
            settings: mergedSettings
        })
    } catch (error) {
        console.error('Failed to load system settings:', error)
        // Return default settings on error
        return NextResponse.json({
            success: true,
            settings: defaultSettings
        })
    }
}

// PUT /api/system-settings - Update system settings
export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { settings } = body

        if (!settings) {
            return NextResponse.json(
                { success: false, error: 'Settings object is required' },
                { status: 400 }
            )
        }

        // Merge with defaults to ensure all fields exist
        const mergedSettings = { ...defaultSettings, ...settings }

        // Upsert settings in database (store as JSON string)
        const result = await prisma.systemSetting.upsert({
            where: { key: 'global' },
            update: {
                value: JSON.stringify(mergedSettings),
                updatedAt: new Date()
            },
            create: {
                key: 'global',
                value: JSON.stringify(mergedSettings)
            }
        })

        return NextResponse.json({
            success: true,
            settings: mergedSettings
        })
    } catch (error) {
        console.error('Failed to save system settings:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to save settings' },
            { status: 500 }
        )
    }
}

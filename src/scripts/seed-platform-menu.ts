
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedPlatformMenu() {
    console.log('🌱 Seeding Clean Platform Menu...')

    interface MenuItem {
        name: string
        slug: string
        href: string
        icon: string
        priority: number
        requiredRoles: string[]
        section?: string
        isVisible?: boolean
    }
    
    interface MenuGroup {
        name: string
        slug: string
        icon: string
        priority: number
        isVisible: boolean
        items: MenuItem[]
    }

    const groups: MenuGroup[] = [
        {
            name: 'Overview',
            slug: 'overview',
            icon: 'Monitor',
            priority: 10,
            isVisible: true,
            items: [
                { name: 'Dashboard', slug: 'dashboard', href: '/dashboard', icon: 'BarChart3', priority: 10, requiredRoles: ['USER'] },
                { name: 'Spaces', slug: 'spaces', href: '/spaces', icon: 'Layout', priority: 20, requiredRoles: ['USER'] },
                { name: 'Projects', slug: 'projects', href: '/admin/projects', icon: 'Kanban', priority: 30, requiredRoles: ['USER'] },
                { name: 'Tasks', slug: 'tasks', href: '/tasks', icon: 'CheckCircle2', priority: 40, requiredRoles: ['USER'] },
                { name: 'Workflows', slug: 'workflows', href: '/workflows', icon: 'GitBranch', priority: 50, requiredRoles: ['USER'] },
                { name: 'Assignments', slug: 'assignments', href: '/assignments', icon: 'CheckCircle2', priority: 60, requiredRoles: ['USER'] },
            ]
        },
        {
            name: 'Tools',
            slug: 'tools',
            icon: 'FlaskConical',
            priority: 20,
            isVisible: true,
            items: [
                { name: 'AI Chat', slug: 'ai-chat-ui', href: '/tools/ai-chat-ui', icon: 'MessageCircle', priority: 10, requiredRoles: ['USER'], section: 'AI' },
                { name: 'Business Intelligence', slug: 'bi', href: '/tools/bi', icon: 'BarChart3', priority: 15, requiredRoles: ['USER'], section: 'Analytics' },
                { name: 'Marketplace', slug: 'marketplace', href: '/marketplace', icon: 'Store', priority: 20, requiredRoles: ['USER'], section: 'Extensions' },
                { name: 'Knowledge', slug: 'knowledge', href: '/knowledge', icon: 'BookOpen', priority: 30, requiredRoles: ['USER'], section: 'Extensions' },
                { name: 'PWA Builder', slug: 'pwa-builder', href: '/tools/pwa', icon: 'Smartphone', priority: 40, requiredRoles: ['ADMIN'], section: 'Developer' },
                { name: 'Notebooks', slug: 'notebook', href: '/tools/notebook', icon: 'FileText', priority: 50, requiredRoles: ['USER'], section: 'Analytics' },
                { name: 'BigQuery', slug: 'bigquery', href: '/tools/bigquery', icon: 'Database', priority: 60, requiredRoles: ['ADMIN'], section: 'Analytics' },
                { name: 'Ontology', slug: 'ontology', href: '/tools/ontology', icon: 'Network', priority: 70, requiredRoles: ['ADMIN'], section: 'Definition' },
            ]
        },
        {
            name: 'Settings',
            slug: 'system',
            icon: 'Settings',
            priority: 30,
            isVisible: true,
            items: [
                { name: 'Users', slug: 'users', href: '/admin/users', icon: 'Users', priority: 10, requiredRoles: ['ADMIN'], section: 'Access' },
                { name: 'Roles', slug: 'roles', href: '/admin/roles', icon: 'ShieldCheck', priority: 20, requiredRoles: ['ADMIN'], section: 'Access' },
                { name: 'Permissions', slug: 'permission-tester', href: '/admin/permission-tester', icon: 'Key', priority: 25, requiredRoles: ['ADMIN'], section: 'Access' },
                { name: 'Change Requests', slug: 'change-requests', href: '/admin/change-requests', icon: 'GitBranch', priority: 28, requiredRoles: ['ADMIN'], section: 'Access' },
                { name: 'Settings', slug: 'settings', href: '/admin/settings', icon: 'Settings', priority: 30, requiredRoles: ['ADMIN'], section: 'Config' },
                { name: 'Audit Logs', slug: 'audit', href: '/admin/audit', icon: 'FileText', priority: 40, requiredRoles: ['ADMIN'], section: 'Security' },
                { name: 'Security', slug: 'security', href: '/admin/security', icon: 'Shield', priority: 50, requiredRoles: ['ADMIN'], section: 'Security' },
                { name: 'Notifications', slug: 'notifications', href: '/admin/notifications', icon: 'Bell', priority: 60, requiredRoles: ['ADMIN'], section: 'Config' },
                { name: 'Themes', slug: 'themes', href: '/admin/themes', icon: 'Palette', priority: 70, requiredRoles: ['ADMIN'], section: 'Config' },
                { name: 'Integrations', slug: 'integrations', href: '/admin/integrations', icon: 'Zap', priority: 80, requiredRoles: ['ADMIN'], section: 'Config' },
                { name: 'Page Templates', slug: 'page-templates', href: '/admin/page-templates', icon: 'Layout', priority: 90, requiredRoles: ['ADMIN'], section: 'Config' },
                { name: 'Space Layouts', slug: 'space-layouts', href: '/admin/space-layouts', icon: 'Layout', priority: 95, requiredRoles: ['ADMIN'], section: 'Config' }
            ]
        },
        {
            name: 'Infrastructure',
            slug: 'infrastructure',
            icon: 'Network',
            priority: 40,
            isVisible: true,
            items: [
                { name: 'Instances', slug: 'infra-instances', href: '/infrastructure/instances', icon: 'Server', priority: 10, requiredRoles: ['ADMIN'], section: 'Compute' },
                { name: 'Monitoring', slug: 'infra-monitoring', href: '/infrastructure/monitoring', icon: 'Activity', priority: 20, requiredRoles: ['ADMIN'], section: 'Compute' },
                { name: 'Storage', slug: 'storage', href: '/admin/storage', icon: 'HardDrive', priority: 30, requiredRoles: ['ADMIN'], section: 'Storage' },
                { name: 'Database', slug: 'database', href: '/admin/database', icon: 'Database', priority: 40, requiredRoles: ['ADMIN'], section: 'Storage' },
                { name: 'Cache', slug: 'cache', href: '/admin/cache', icon: 'Zap', priority: 50, requiredRoles: ['ADMIN'], section: 'Performance' },
                { name: 'Backup', slug: 'backup', href: '/admin/backup', icon: 'History', priority: 60, requiredRoles: ['ADMIN'], section: 'Maintenance' },
                { name: 'Logs', slug: 'logs', href: '/admin/logs', icon: 'FileCode', priority: 70, requiredRoles: ['ADMIN'], section: 'Maintenance' },
                { name: 'Kernels', slug: 'kernels', href: '/admin/kernels', icon: 'Code', priority: 80, requiredRoles: ['ADMIN'], section: 'Compute' }
            ]
        },
        {
            name: 'Data Management',
            slug: 'data-management',
            icon: 'FolderKanban',
            priority: 50,
            isVisible: true,
            items: [
                { name: 'Data Models', slug: 'data-models', href: '/admin/data', icon: 'FileText', priority: 10, requiredRoles: ['USER'], section: 'Definition' },
                { name: 'Assets', slug: 'assets', href: '/admin/assets', icon: 'Paperclip', priority: 15, requiredRoles: ['USER'], section: 'Content' },
                { name: 'Attachments', slug: 'attachments', href: '/admin/attachments', icon: 'Paperclip', priority: 17, requiredRoles: ['USER'], section: 'Content' },
                { name: 'Import/Export', slug: 'import-export', href: '/admin/import-export', icon: 'Cloud', priority: 20, requiredRoles: ['MANAGER'], section: 'Tools' },
                { name: 'Data Governance', slug: 'data-governance', href: '/admin/data-governance', icon: 'ShieldCheck', priority: 25, requiredRoles: ['ADMIN'], section: 'Governance' },
                { name: 'Schema Migrations', slug: 'schema-migrations', href: '/admin/schema-migrations', icon: 'GitBranch', priority: 35, requiredRoles: ['ADMIN'], section: 'Tools' },
                { name: 'SQL Linting', slug: 'sql-linting', href: '/admin/sql-linting', icon: 'CheckCircle2', priority: 36, requiredRoles: ['ADMIN'], section: 'Tools' },
                { name: 'Data Masking', slug: 'data-masking', href: '/admin/data-masking', icon: 'Eye', priority: 37, requiredRoles: ['ADMIN'], section: 'Tools' },
                { name: 'Analytics', slug: 'analytics', href: '/admin/analytics', icon: 'BarChart3', priority: 40, requiredRoles: ['ADMIN'], section: 'Analysis' }
            ]
        }
    ]

    // Clear existing menu to ensure clean state if requested, 
    // but here we use upsert logic for safety and continuity.

    for (const group of groups) {
        // Upsert Group
        const groupRecord = await prisma.menuGroup.upsert({
            where: { slug: group.slug },
            update: {
                name: group.name,
                icon: group.icon,
                priority: group.priority,
                isVisible: group.isVisible
            },
            create: {
                name: group.name,
                slug: group.slug,
                icon: group.icon,
                priority: group.priority,
                isVisible: group.isVisible
            }
        })

        const groupId = groupRecord.id

        // Upsert Items
        for (const item of group.items) {
            await prisma.menuItem.upsert({
                where: { slug: item.slug },
                update: {
                    groupId: groupId,
                    name: item.name,
                    icon: item.icon,
                    href: item.href,
                    section: item.section || null,
                    priority: item.priority,
                    requiredRoles: item.requiredRoles,
                    isVisible: true
                },
                create: {
                    groupId: groupId,
                    name: item.name,
                    slug: item.slug,
                    icon: item.icon,
                    href: item.href,
                    section: item.section || null,
                    priority: item.priority,
                    requiredRoles: item.requiredRoles,
                    isVisible: true,
                    isBuiltin: true
                }
            })
        }
    }

    // Optional: Hide groups/items that are no longer in our seed list but were previously seeded
    const groupSlugs = groups.map(g => g.slug)
    const itemSlugs = groups.flatMap(g => g.items.map(i => i.slug))

    await prisma.menuGroup.updateMany({
        where: { slug: { notIn: groupSlugs } },
        data: { isVisible: false }
    })

    await prisma.menuItem.updateMany({
        where: { slug: { notIn: itemSlugs } },
        data: { isVisible: false }
    })

    console.log('✅ Platform Menu Seeded Successfully')
    await prisma.$disconnect()
}

seedPlatformMenu()
    .catch((e) => {
        console.error(e)
        prisma.$disconnect()
        process.exit(1)
    })

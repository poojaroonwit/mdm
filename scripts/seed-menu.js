/**
 * Seed Menu Configuration
 * 
 * This script seeds the menu_groups and menu_items tables with the
 * initial menu configuration that was previously hardcoded in PlatformSidebar.tsx
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Menu groups matching the hardcoded groupMetadata
const menuGroups = [
    { slug: 'overview', name: 'Homepage', icon: 'Monitor', priority: 10 },
    { slug: 'tools', name: 'Tools', icon: 'FlaskConical', priority: 20 },
    { slug: 'infrastructure', name: 'Infrastructure', icon: 'Network', priority: 30 },
    { slug: 'system', name: 'System', icon: 'Settings', priority: 40 },
    { slug: 'data-management', name: 'Data Management', icon: 'FolderKanban', priority: 50 },
];

// Menu items matching the hardcoded groupedTabs
const menuItems = [
    // Overview group
    { groupSlug: 'overview', slug: 'overview', name: 'Homepage', icon: 'Monitor', href: '/', section: null, priority: 10 },

    // Tools group - Only built-in items (plugin items will be added on plugin install)
    { groupSlug: 'tools', slug: 'bi', name: 'BI & Reports', icon: 'BarChart3', href: '/tools/bi', section: 'Reporting', priority: 10 },
    { groupSlug: 'tools', slug: 'ai-chat-ui', name: 'Chatbot UI Manager', icon: 'MessageCircle', href: '/tools/ai-chat-ui', section: 'Website Embed widget', priority: 30 },
    { groupSlug: 'tools', slug: 'vector-store', name: 'Vector Store Database', icon: 'Database', href: '/tools/vector-store', section: 'Website Embed widget', priority: 35 },
    { groupSlug: 'tools', slug: 'pwa', name: 'PWA Manager', icon: 'Monitor', href: '/tools/pwa', section: 'Website Embed widget', priority: 40 },
    // Note: bigquery (SQL Query), ai-analyst, notebook (Data Science) are plugin-dependent
    // They will be added automatically when their plugins are installed
    { groupSlug: 'tools', slug: 'storage', name: 'Storage', icon: 'HardDrive', href: '/tools/storage', section: 'Data Tools', priority: 70 },
    { groupSlug: 'tools', slug: 'data-governance', name: 'Data Governance', icon: 'Shield', href: '/tools/data-governance', section: 'Data Tools', priority: 80 },

    // System group
    { groupSlug: 'system', slug: 'marketplace', name: 'Marketplace', icon: 'Store', href: '/marketplace', section: 'Integrations', priority: 10 },
    { groupSlug: 'system', slug: 'users', name: 'Users & Roles', icon: 'Users', href: '/system/users', section: 'Management', priority: 20 },
    { groupSlug: 'system', slug: 'space-layouts', name: 'Space Layouts', icon: 'Layout', href: '/system/space-layouts', section: 'Management', priority: 30 },
    { groupSlug: 'system', slug: 'assets', name: 'Asset Management', icon: 'Database', href: '/system/assets', section: 'Management', priority: 40 },
    { groupSlug: 'system', slug: 'logs', name: 'Logs', icon: 'FileText', href: '/system/logs', section: 'System', priority: 50 },
    { groupSlug: 'system', slug: 'audit', name: 'Audit Logs', icon: 'History', href: '/system/audit', section: 'System', priority: 60 },
    { groupSlug: 'system', slug: 'database', name: 'Database Data Models', icon: 'Database', href: '/system/database', section: 'System', priority: 70 },
    { groupSlug: 'system', slug: 'change-requests', name: 'Change Requests', icon: 'GitBranch', href: '/system/change-requests', section: 'System', priority: 80 },
    { groupSlug: 'system', slug: 'sql-linting', name: 'SQL Linting', icon: 'CheckCircle2', href: '/system/sql-linting', section: 'System', priority: 90 },
    { groupSlug: 'system', slug: 'schema-migrations', name: 'Schema Migrations', icon: 'FileCode', href: '/system/schema-migrations', section: 'System', priority: 100 },
    { groupSlug: 'system', slug: 'data-masking', name: 'Data Masking', icon: 'ShieldCheck', href: '/system/data-masking', section: 'System', priority: 110 },
    { groupSlug: 'system', slug: 'cache', name: 'Cache', icon: 'Zap', href: '/system/cache', section: 'System', priority: 120 },
    { groupSlug: 'system', slug: 'backup', name: 'Backup & Recovery', icon: 'Cloud', href: '/system/backup', section: 'System', priority: 130 },
    { groupSlug: 'system', slug: 'security', name: 'Security', icon: 'Shield', href: '/system/security', section: 'Security', priority: 140 },
    { groupSlug: 'system', slug: 'performance', name: 'Performance', icon: 'Activity', href: '/system/performance', section: 'Security', priority: 150 },
    { groupSlug: 'system', slug: 'settings', name: 'System Settings', icon: 'Settings', href: '/system/settings', section: 'Integrations', priority: 160 },
    { groupSlug: 'system', slug: 'themes', name: 'Theme & Branding', icon: 'Palette', href: '/system/themes', section: 'Integrations', priority: 170 },


    // Data Management group
    { groupSlug: 'data-management', slug: 'space-selection', name: 'Data Management', icon: 'FolderKanban', href: '/admin/space-selection', section: null, priority: 10 },

    // Infrastructure group
    { groupSlug: 'infrastructure', slug: 'infrastructure', name: 'Infrastructure', icon: 'Network', href: '/infrastructure', section: null, priority: 10 },
];

async function seedMenuConfig() {
    console.log('🍽️  Seeding menu configuration...');

    // Create groups
    const groupMap = new Map();
    for (const group of menuGroups) {
        try {
            const existing = await prisma.menuGroup.findUnique({ where: { slug: group.slug } });
            if (existing) {
                console.log(`  ⏭️  Group "${group.name}" already exists, skipping.`);
                groupMap.set(group.slug, existing.id);
            } else {
                const created = await prisma.menuGroup.create({ data: group });
                console.log(`  ✅ Created group: ${group.name}`);
                groupMap.set(group.slug, created.id);
            }
        } catch (e) {
            console.error(`  ❌ Failed to create group ${group.slug}:`, e.message);
        }
    }

    // Create items
    let created = 0, skipped = 0;
    for (const item of menuItems) {
        const groupId = groupMap.get(item.groupSlug);
        if (!groupId) {
            console.error(`  ❌ Group not found for item ${item.slug}`);
            continue;
        }

        try {
            const existing = await prisma.menuItem.findUnique({ where: { slug: item.slug } });
            if (existing) {
                skipped++;
                continue;
            }

            await prisma.menuItem.create({
                data: {
                    groupId,
                    slug: item.slug,
                    name: item.name,
                    icon: item.icon,
                    href: item.href,
                    section: item.section,
                    priority: item.priority,
                    isBuiltin: true,
                    isVisible: true,
                }
            });
            created++;
        } catch (e) {
            console.error(`  ❌ Failed to create item ${item.slug}:`, e.message);
        }
    }

    console.log(`\n🍽️  Menu seeding complete: ${created} items created, ${skipped} skipped.`);
}

async function run() {
    try {
        await seedMenuConfig();
        await prisma.$disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding menu:', error.message);
        await prisma.$disconnect();
        process.exit(1);
    }
}

run();

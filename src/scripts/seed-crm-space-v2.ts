
import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function seedCrmSpaceV2() {
    console.log('🌱 Seeding CRM Space V2...')

    // 1. Find or Create Admin User (for createdBy fields)
    let adminUser = await prisma.user.findFirst({
        where: { email: 'admin@example.com' }
    })

    if (!adminUser) {
        console.log('Admin user not found, creating placeholder admin...')
        adminUser = await prisma.user.create({
            data: {
                email: 'admin@example.com',
                name: 'Admin User',
                password: 'placeholder_password_hash', 
                role: 'ADMIN'
            }
        })
    }
    
    const userId = adminUser.id

    // 2. Upsert CRM Space
    const crmSpace = await prisma.space.upsert({
        where: { slug: 'crm' },
        update: {
            name: 'CRM Workspace',
            icon: 'Users',
            description: 'Customer Relationship Management Space',
            isActive: true,
            sidebarConfig: {
              items: [
                { id: 'dashboard', type: 'page', pageId: 'crm-dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
                { id: 'customers', type: 'page', pageId: 'crm-customers', label: 'Manage Customers', icon: 'Users' },
                { id: 'opportunities', type: 'page', pageId: 'crm-opportunities', label: 'Opportunities', icon: 'TrendingUp' }
              ]
            }
        },
        create: {
            name: 'CRM Workspace',
            slug: 'crm',
            icon: 'Users',
            description: 'Customer Relationship Management Space',
            createdBy: userId,
            isActive: true,
            sidebarConfig: {
              items: [
                { id: 'dashboard', type: 'page', pageId: 'crm-dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
                { id: 'customers', type: 'page', pageId: 'crm-customers', label: 'Manage Customers', icon: 'Users' },
                 { id: 'opportunities', type: 'page', pageId: 'crm-opportunities', label: 'Opportunities', icon: 'TrendingUp' }
              ]
            }
        }
    })
    
    console.log(`✅ CRM Space ensured: ${crmSpace.id}`)

    // 3. Upsert Data Models
    
    // Customer Model
    let custModel = await prisma.dataModel.findFirst({
        where: { 
            name: 'Customer', 
            spaces: { some: { spaceId: crmSpace.id } }
        }
    })
    
    if (!custModel) {
        custModel = await prisma.dataModel.create({
            data: {
                name: 'Customer',
                description: 'Companies and Contacts',
                createdBy: userId,
                spaces: { create: { spaceId: crmSpace.id } },
                attributes: {
                    create: [
                        { name: 'first_name', displayName: 'First Name', type: 'TEXT', isRequired: true, order: 10 },
                        { name: 'last_name', displayName: 'Last Name', type: 'TEXT', isRequired: true, order: 20 },
                        { name: 'email', displayName: 'Email', type: 'EMAIL', isRequired: false, isUnique: true, order: 30 },
                        { name: 'company', displayName: 'Company', type: 'TEXT', order: 35 },
                        { name: 'status', displayName: 'Status', type: 'SELECT', options: ["Active", "Lead", "Lost"], order: 40 },
                        { name: 'phone', displayName: 'Phone', type: 'TEXT', order: 50 },
                        { name: 'avatar', displayName: 'Avatar', type: 'TEXT', order: 60 }
                    ]
                }
            }
        })
        console.log('✅ Created Customer Data Model')
    } else {
        console.log('ℹ️ Customer Data Model already exists')
    }

    // Opportunity Model
    let oppModel = await prisma.dataModel.findFirst({
        where: { name: 'Opportunity', creator: { id: userId } }
    })
    
    if (!oppModel) {
        oppModel = await prisma.dataModel.create({
            data: {
                name: 'Opportunity',
                description: 'Sales Deals',
                createdBy: userId,
                spaces: { create: { spaceId: crmSpace.id } },
                attributes: {
                    create: [
                        { name: 'title', displayName: 'Deal Title', type: 'TEXT', isRequired: true, order: 10 },
                        { name: 'value', displayName: 'Value', type: 'NUMBER', isRequired: true, order: 20 },
                        { name: 'stage', displayName: 'Stage', type: 'SELECT', options: ["New", "Discovery", "Proposal", "Won", "Lost"], order: 30 },
                        { name: 'close_date', displayName: 'Expected Close', type: 'DATE', order: 40 },
                        { name: 'customer_id', displayName: 'Customer', type: 'RELATION', order: 50, dataEntityModelId: custModel.id }
                    ]
                }
            }
        })
         console.log('✅ Created Opportunity Data Model')
    } else {
        console.log('ℹ️ Opportunity Data Model already exists')
    }

    // 4. Seed Data Data Records (Example customers)
    
    // Helper to get attributes map
    const getAttributesMap = async (modelId: string) => {
        const attrs = await prisma.attribute.findMany({ where: { dataModelId: modelId } })
        return attrs.reduce((acc, curr) => {
            acc[curr.name] = curr.id
            return acc
        }, {} as Record<string, string>)
    }

    const custAttrs = await getAttributesMap(custModel.id)
    const oppAttrs = await getAttributesMap(oppModel.id)

    const exampleCustomers = [
        { first_name: 'John', last_name: 'Doe', email: 'john@acme.com', company: 'Acme Corp', status: 'Active', phone: '555-0100', avatar: 'https://i.pravatar.cc/150?u=john' },
        { first_name: 'Jane', last_name: 'Smith', email: 'jane@techstart.io', company: 'TechStart', status: 'Lead', phone: '555-0101', avatar: 'https://i.pravatar.cc/150?u=jane' },
        { first_name: 'Robert', last_name: 'Johnson', email: 'bob@globex.com', company: 'Globex', status: 'Active', phone: '555-0102', avatar: 'https://i.pravatar.cc/150?u=bob' },
        { first_name: 'Emily', last_name: 'Davis', email: 'emily@soylent.com', company: 'Soylent Corp', status: 'Lost', phone: '555-0103', avatar: 'https://i.pravatar.cc/150?u=emily' },
        { first_name: 'Michael', last_name: 'Wilson', email: 'mike@initech.com', company: 'Initech', status: 'Active', phone: '555-0104', avatar: 'https://i.pravatar.cc/150?u=mike' }
    ]

    for (const cust of exampleCustomers) {
        // Check if exists by email
        // We look for a DataRecord that has a DataRecordValue with attribute=email and value=cust.email
        const emailAttrId = custAttrs['email']
        const existingRec = await prisma.dataRecord.findFirst({
            where: {
                dataModelId: custModel.id,
                values: {
                    some: {
                        attributeId: emailAttrId,
                        value: cust.email
                    }
                }
            }
        })

        if (!existingRec) {
            // Create Record
            const record = await prisma.dataRecord.create({
                data: {
                    dataModelId: custModel.id,
                    createdBy: userId
                }
            })

            // Create Values
            for (const [key, value] of Object.entries(cust)) {
                if (custAttrs[key]) {
                    await prisma.dataRecordValue.create({
                        data: {
                            dataRecordId: record.id,
                            attributeId: custAttrs[key],
                            value: String(value)
                        }
                    })
                }
            }
            console.log(`   + Added customer: ${cust.email}`)
        } else {
             console.log(`   . Customer ${cust.email} already exists`)
        }
    }
    console.log('✅ Seeded Customers')

    // Seed Opportunities
    const exampleOpps = [
        { title: 'Q1 License Deal', value: 50000, stage: 'Proposal', close_date: '2025-03-31' },
        { title: 'Consulting Project', value: 12000, stage: 'Discovery', close_date: '2025-02-15' },
        { title: 'Enterprise Plan', value: 120000, stage: 'New', close_date: '2025-06-30' }
    ]
    
    // Just blindly add opportunities if they don't exist by title
    for (const opp of exampleOpps) {
        const titleAttrId = oppAttrs['title']
        const existingRec = await prisma.dataRecord.findFirst({
            where: {
                dataModelId: oppModel.id,
                values: {
                    some: {
                        attributeId: titleAttrId,
                        value: opp.title
                    }
                }
            }
        })

        if (!existingRec) {
             const record = await prisma.dataRecord.create({
                data: {
                    dataModelId: oppModel.id,
                    createdBy: userId
                }
            })

            for (const [key, value] of Object.entries(opp)) {
                if (oppAttrs[key]) {
                    await prisma.dataRecordValue.create({
                        data: {
                            dataRecordId: record.id,
                            attributeId: oppAttrs[key],
                            value: String(value)
                        }
                    })
                }
            }
            console.log(`   + Added opportunity: ${opp.title}`)
        }
    }
    console.log('✅ Seeded Opportunities')
    
    // 5. Seed Pages Configuration to system_settings
    
    // Define the Pages
    const pages = [
      {
        id: 'crm-dashboard',
        name: 'crm-dashboard',
        displayName: 'Dashboard',
        description: 'CRM Overview',
        path: '/crm-dashboard',
        isCustom: true,
        order: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Dashboard Layout
        placedWidgets: [
          // KPI Widgets
          { id: 'w1', type: 'kpi-card', x: 0, y: 0, w: 3, h: 4, properties: { title: 'Total Revenue', value: '$1.2M', trend: '+12%', icon: 'DollarSign' } },
          { id: 'w2', type: 'kpi-card', x: 3, y: 0, w: 3, h: 4, properties: { title: 'Active Deals', value: '45', trend: '+5', icon: 'Briefcase' } },
          { id: 'w3', type: 'kpi-card', x: 6, y: 0, w: 3, h: 4, properties: { title: 'Win Rate', value: '64%', trend: '-2%', icon: 'Percent' } },
          { id: 'w4', type: 'kpi-card', x: 9, y: 0, w: 3, h: 4, properties: { title: 'Avg Deal Size', value: '$25k', trend: '+8%', icon: 'BarChart' } },
          // Recent Deals Table
          { id: 'w5', type: 'data-table', x: 0, y: 4, w: 8, h: 8, properties: { title: 'Recent Opportunities', dataModelId: oppModel.id } },
          // Chart
          { id: 'w6', type: 'chart', x: 8, y: 4, w: 4, h: 8, properties: { title: 'Deals by Stage', chartType: 'bar' } }
        ]
      },
      {
        id: 'crm-customers',
        name: 'crm-customers',
        displayName: 'Manage Customers',
        description: 'Customer Database',
        path: '/crm-customers',
        isCustom: true,
        order: 2,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Customer List Layout
        placedWidgets: [
           { 
             id: 'cust-list-1', 
             type: 'data-table', 
             x: 0, y: 0, w: 12, h: 12, 
             properties: { 
               title: 'All Customers', 
               dataModelId: custModel.id,
               pageSize: 10,
               enableSearch: true,
               enableFilters: true
             } 
           }
        ]
      },
      {
        id: 'crm-opportunities',
        name: 'crm-opportunities',
        displayName: 'Opportunities',
        description: 'Sales Pipeline',
        path: '/crm-opportunities',
        isCustom: true,
        order: 3,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        placedWidgets: [
          {
            id: 'opp-board-1',
            type: 'kanban-board',
            x: 0, y: 0, w: 12, h: 12,
            properties: {
              title: 'Deal Pipeline',
              dataModelId: oppModel.id,
              groupByInfo: { attribute: 'stage' }
            }
          }
        ]
      }
    ]

    const seedsConfig = {
      id: `config_${crmSpace.id}`,
      spaceId: crmSpace.id,
      pages,
      sidebarConfig: {
        items: [
           { id: 'dashboard', type: 'page', pageId: 'crm-dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
           { id: 'customers', type: 'page', pageId: 'crm-customers', label: 'Manage Customers', icon: 'Users' },
           { id: 'opportunities', type: 'page', pageId: 'crm-opportunities', label: 'Opportunities', icon: 'TrendingUp' }
        ],
        background: '#ffffff',
        textColor: '#374151',
        fontSize: '14px'
      },
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const configKey = `spaces_editor_config_${crmSpace.id}`
    const configValue = JSON.stringify(seedsConfig)

    console.log('Saving Pages to system_settings...')
    
    // Using raw query to upsert into system_settings with safe uuid
    const existing = await prisma.$queryRaw`SELECT 1 FROM system_settings WHERE key = ${configKey}` as any[]
    
    if (existing.length > 0) {
       await prisma.$executeRaw`UPDATE system_settings SET value = ${configValue}, updated_at = NOW() WHERE key = ${configKey}`
       console.log('✅ Updated CRM Pages configuration')
    } else {
       // Generate a UUID JS-side
       const newId = uuidv4()
       await prisma.$executeRaw`INSERT INTO system_settings (id, key, value, created_at, updated_at) VALUES (${newId}::uuid, ${configKey}, ${configValue}, NOW(), NOW())`
       console.log('✅ Created CRM Pages configuration')
    }

    console.log('✅ CRM Space Data & Pages Seeding Complete!')
}

seedCrmSpaceV2()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

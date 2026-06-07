import { prisma } from './prisma'
import { User, Space, DataModel, DataRecord, Attribute, Notification } from '@prisma/client'

// User ORM Operations
export class UserORM {
  static async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        createdSpaces: true,
        spaceMemberships: {
          include: {
            space: true
          }
        }
      }
    })
  }

  static async create(data: {
    email: string
    name: string
    password: string
    role?: string
  }) {
    return prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: data.password,
        role: data.role || 'USER'
      }
    })
  }

  static async update(id: string, data: Partial<User>) {
    return prisma.user.update({
      where: { id },
      data
    })
  }

  static async delete(id: string) {
    return prisma.user.delete({
      where: { id }
    })
  }
}

// Space ORM Operations
export class SpaceORM {
  static async findAll() {
    return prisma.space.findMany({
      where: { deletedAt: null },
      include: {
        creator: true,
        members: {
          include: {
            user: true
          }
        },
        dataModels: {
          include: {
            dataModel: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  static async findBySlug(slug: string) {
    return prisma.space.findUnique({
      where: { slug },
      include: {
        creator: true,
        members: {
          include: {
            user: true
          }
        },
        dataModels: {
          include: {
            dataModel: true
          }
        }
      }
    })
  }

  static async findUserSpaces(userId: string) {
    return prisma.space.findMany({
      where: {
        deletedAt: null,
        members: {
          some: {
            userId
          }
        }
      },
      include: {
        creator: true,
        members: {
          include: {
            user: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  static async create(data: {
    name: string
    description?: string
    slug: string
    isDefault?: boolean
    createdBy: string
    features?: any
    sidebarConfig?: any
    tags?: string[]
  }) {
    // Check if tags column exists and use raw query if needed, otherwise store in features
    const space = await prisma.space.create({
      data: {
        name: data.name,
        description: data.description,
        slug: data.slug,
        isDefault: data.isDefault || false,
        createdBy: data.createdBy,
        features: data.features || {},
        sidebarConfig: data.sidebarConfig || {}
      }
    })

    // If tags are provided, update the space with tags using raw query
    if (data.tags && data.tags.length > 0) {
      await prisma.$executeRaw`
        UPDATE spaces 
        SET tags = ${JSON.stringify(data.tags)}::jsonb 
        WHERE id = ${space.id}
      `
    }

    return space
  }

  static async addMember(spaceId: string, userId: string, role: string = 'MEMBER') {
    return prisma.spaceMember.create({
      data: {
        spaceId,
        userId,
        role
      }
    })
  }

  static async update(id: string, data: Partial<Space>) {
    const { createdBy, createdAt, ...updateData } = data
    return prisma.space.update({
      where: { id },
      data: updateData as any
    })
  }

  static async delete(id: string) {
    return prisma.space.update({
      where: { id },
      data: { deletedAt: new Date() }
    })
  }
}

// DataModel ORM Operations
export class DataModelORM {
  static async findAll() {
    return prisma.dataModel.findMany({
      where: { deletedAt: null },
      include: {
        creator: true,
        spaces: {
          include: {
            space: true
          }
        },
        attributes: true,
        dataRecords: {
          include: {
            values: {
              include: {
                attribute: true
              }
            }
          }
        }
      },
      orderBy: { sortOrder: 'asc' }
    })
  }

  static async findBySpace(spaceId: string) {
    return prisma.dataModel.findMany({
      where: {
        deletedAt: null,
        spaces: {
          some: {
            spaceId
          }
        }
      },
      include: {
        creator: true,
        attributes: true,
        dataRecords: {
          include: {
            values: {
              include: {
                attribute: true
              }
            }
          }
        }
      },
      orderBy: { sortOrder: 'asc' }
    })
  }

  static async create(data: {
    name: string
    description?: string
    createdBy: string
    sortOrder?: number
  }) {
    return prisma.dataModel.create({
      data: {
        name: data.name,
        description: data.description,
        createdBy: data.createdBy,
        sortOrder: data.sortOrder || 0
      }
    })
  }

  static async linkToSpace(dataModelId: string, spaceId: string) {
    return prisma.dataModelSpace.create({
      data: {
        dataModelId,
        spaceId
      }
    })
  }

  static async update(id: string, data: Partial<DataModel>) {
    return prisma.dataModel.update({
      where: { id },
      data
    })
  }

  static async delete(id: string) {
    return prisma.dataModel.update({
      where: { id },
      data: { deletedAt: new Date() }
    })
  }
}

// Attribute ORM Operations
export class AttributeORM {
  static async findByDataModel(dataModelId: string) {
    return prisma.attribute.findMany({
      where: { dataModelId },
      orderBy: { createdAt: 'asc' }
    })
  }

  static async create(data: {
    name: string
    type: string
    description?: string
    dataModelId: string
  }) {
    return prisma.attribute.create({
      data: {
        name: data.name,
        displayName: data.name,
        type: data.type,
        description: data.description,
        dataModelId: data.dataModelId
      }
    })
  }

  static async update(id: string, data: Partial<Attribute>) {
    const { dataModelId, createdAt, ...updateData } = data
    return prisma.attribute.update({
      where: { id },
      data: updateData as any
    })
  }

  static async delete(id: string) {
    return prisma.attribute.delete({
      where: { id }
    })
  }
}

// DataRecord ORM Operations
export class DataRecordORM {
  static async findByDataModel(dataModelId: string) {
    return prisma.dataRecord.findMany({
      where: { 
        dataModelId,
        deletedAt: null 
      },
      include: {
        creator: true,
        values: {
          include: {
            attribute: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  static async create(data: {
    dataModelId: string
    createdBy: string
    values?: Array<{
      attributeId: string
      value: string
    }>
  }) {
    return prisma.dataRecord.create({
      data: {
        dataModelId: data.dataModelId,
        createdBy: data.createdBy,
        values: data.values ? {
          create: data.values
        } : undefined
      },
      include: {
        values: {
          include: {
            attribute: true
          }
        }
      }
    })
  }

  static async update(id: string, data: Partial<DataRecord>) {
    return prisma.dataRecord.update({
      where: { id },
      data
    })
  }

  static async delete(id: string) {
    return prisma.dataRecord.update({
      where: { id },
      data: { deletedAt: new Date() }
    })
  }
}

// Notification ORM Operations
export class NotificationORM {
  static async findByUser(userId: string, filters?: {
    type?: string
    status?: string
    priority?: string
    limit?: number
    offset?: number
  }) {
    const where: any = {
      userId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    }

    if (filters?.type) where.type = filters.type
    if (filters?.status) where.status = filters.status
    if (filters?.priority) where.priority = filters.priority

    return prisma.notification.findMany({
      where,
      include: {
        user: true
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
      skip: filters?.offset || 0
    })
  }

  static async create(data: {
    userId: string
    type: string
    title: string
    message: string
    priority?: string
    data?: any
    actionUrl?: string
    actionLabel?: string
    expiresAt?: Date
  }) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        priority: data.priority || 'MEDIUM',
        data: data.data,
        actionUrl: data.actionUrl,
        actionLabel: data.actionLabel,
        expiresAt: data.expiresAt
      }
    })
  }

  static async markAsRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { 
        status: 'READ',
        readAt: new Date()
      }
    })
  }

  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { 
        userId,
        status: 'UNREAD'
      },
      data: { 
        status: 'READ',
        readAt: new Date()
      }
    })
  }

  static async delete(id: string) {
    return prisma.notification.delete({
      where: { id }
    })
  }
}

// System Settings ORM Operations
export class SystemSettingsORM {
  static async getAll() {
    const settings = await prisma.systemSetting.findMany({
      orderBy: { key: 'asc' }
    })
    
    return settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)
  }

  static async get(key: string) {
    const setting = await prisma.systemSetting.findUnique({
      where: { key }
    })
    return setting?.value
  }

  static async set(key: string, value: string) {
    return prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    })
  }

  static async setMultiple(settings: Record<string, string>) {
    const operations = Object.entries(settings).map(([key, value]) =>
      prisma.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      })
    )
    
    return Promise.all(operations)
  }
}

// All ORM classes are already exported above as individual class exports

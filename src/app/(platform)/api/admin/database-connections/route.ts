import { requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getSecretsManager } from '@/lib/secrets-manager'
import { encryptApiKey } from '@/lib/encryption'
import { createAuditContext } from '@/lib/audit-context-helper'
import { requireSpaceAccess } from '@/lib/space-access'

export async function GET() {
  try {
    const connections = await prisma.externalConnection.findMany({
      include: {
        space: {
          select: {
            id: true,
            name: true
          }
        },
        dataModels: {
          select: {
            id: true,
            name: true,
            description: true,
          }
        }
      }
    })

    const formattedConnections = connections.map(conn => ({
      id: conn.id,
      name: conn.name,
      spaceId: conn.spaceId,
      spaceName: conn.space.name,
      type: conn.dbType,
      host: conn.host,
      port: conn.port || 5432,
      database: conn.database,
      username: conn.username,
      isActive: conn.isActive,
      status: 'connected', // This would be determined by actual connection testing
      lastConnected: conn.updatedAt,
      connectionPool: {
        min: 1,
        max: 10,
        current: 2,
        idle: 1
      },
      dataModels: conn.dataModels
    }))

    return NextResponse.json({ connections: formattedConnections })
  } catch (error) {
    console.error('Error fetching database connections:', error)
    return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 })
  }
}

async function postHandler(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    // TODO: Add requireSpaceAccess check if spaceId is available

    // Check if user has admin privileges
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 },
      )
    }

    const body = await request.json()
    const { name, spaceId, type, host, port, database, username, password } =
      body

    const secretsManager = getSecretsManager()
    const useVault = secretsManager.getBackend() === 'vault'

    let storedPassword = password || null

    if (useVault && password) {
      // Store password in Vault (will update with actual ID after insert)
      const connectionId = `temp-${Date.now()}`
      const auditContext = createAuditContext(
        request,
        session.user,
        'Admin database connection creation',
      )
      await secretsManager.storeSecret(
        `database-connections/${connectionId}/credentials`,
        {
          password: password,
          username: username,
          host: host,
          port: port ? parseInt(port.toString()) : undefined,
          database: database,
        },
        undefined,
        auditContext,
      )
      storedPassword = `vault://${connectionId}/password`
    } else if (!useVault && password) {
      // Encrypt for database storage
      storedPassword = encryptApiKey(password)
    }

    const connection = await prisma.externalConnection.create({
      data: {
        name,
        spaceId,
        dbType: type,
        host,
        port: port || 5432,
        database,
        username,
        password: storedPassword,
        isActive: true,
      },
      include: {
        space: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Update Vault path with actual connection ID if using Vault
    if (useVault && connection.id && password) {
      const actualId = connection.id
      // Get the temp ID from the stored password reference
      const tempMatch = storedPassword?.match(/temp-(\d+)/)
      if (tempMatch) {
        const tempId = `temp-${tempMatch[1]}`
        const vaultCreds = await secretsManager.getDatabaseCredentials(tempId)
        if (vaultCreds) {
          // Store with actual ID
          await secretsManager.storeDatabaseCredentials(actualId, vaultCreds)
          // Delete temp entry
          try {
            await secretsManager.deleteSecret(
              `database-connections/${tempId}/credentials`,
            )
          } catch (error) {
            // Ignore if already deleted
          }
          // Update database with correct Vault path
          await prisma.externalConnection.update({
            where: { id: actualId },
            data: { password: `vault://${actualId}/password` },
          })
        }
      }
    }

    return NextResponse.json({
      connection: {
        id: connection.id,
        name: connection.name,
        spaceId: connection.spaceId,
        spaceName: connection.space.name,
        type: connection.dbType,
        host: connection.host,
        port: connection.port,
        database: connection.database,
        username: connection.username,
        isActive: connection.isActive,
        status: 'connected',
        lastConnected: connection.createdAt,
        connectionPool: {
          min: 1,
          max: 10,
          current: 1,
          idle: 0,
        },
        dataModels: [],
      },
    })
  } catch (error) {
    console.error('Error creating database connection:', error)
    return NextResponse.json(
      { error: 'Failed to create database connection' },
      { status: 500 },
    )
  }
}

export const POST = withErrorHandling(
  postHandler,
  'POST /api/admin/database-connections',
)

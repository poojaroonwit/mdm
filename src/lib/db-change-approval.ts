/**
 * Database Change Approval Workflow System
 * Manages approval workflows for database schema changes
 */

import { query } from './db'

export type ChangeRequestStatus = 'pending' | 'approved' | 'rejected' | 'merged' | 'cancelled'
export type ChangeType = 'CREATE_TABLE' | 'ALTER_TABLE' | 'DROP_TABLE' | 'CREATE_INDEX' | 'DROP_INDEX' | 'DATA_MIGRATION' | 'SCHEMA_CHANGE'

export interface ChangeRequest {
  id?: string
  title: string
  description?: string
  changeType: ChangeType
  sqlStatement: string
  rollbackSql?: string
  requestedBy: string
  requestedByName?: string
  spaceId?: string
  connectionId?: string
  status: ChangeRequestStatus
  approvers: string[] // User IDs who need to approve
  approvals: Array<{
    userId: string
    userName?: string
    approved: boolean
    comment?: string
    timestamp: Date
  }>
  rejections: Array<{
    userId: string
    userName?: string
    reason: string
    timestamp: Date
  }>
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
  mergedAt?: Date
  mergedBy?: string
}

export interface ApprovalRule {
  id?: string
  name: string
  description?: string
  changeTypes: ChangeType[]
  requiresApproval: boolean
  minApprovers: number
  requiredRoles: string[] // User roles that can approve
  spaceId?: string // If null, applies to all spaces
  enabled: boolean
}

class DatabaseChangeApproval {
  private initialized = false

  async initialize() {
    if (this.initialized) return

    try {
      // Create change_requests table
      await query(`
        CREATE TABLE IF NOT EXISTS public.change_requests (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          change_type TEXT NOT NULL,
          sql_statement TEXT NOT NULL,
          rollback_sql TEXT,
          requested_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          requested_by_name TEXT,
          space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
          connection_id TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          approvers JSONB DEFAULT '[]'::jsonb,
          approvals JSONB DEFAULT '[]'::jsonb,
          rejections JSONB DEFAULT '[]'::jsonb,
          metadata JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          merged_at TIMESTAMPTZ,
          merged_by UUID REFERENCES public.users(id) ON DELETE SET NULL
        );

        CREATE INDEX IF NOT EXISTS idx_change_requests_status ON public.change_requests(status);
        CREATE INDEX IF NOT EXISTS idx_change_requests_requested_by ON public.change_requests(requested_by);
        CREATE INDEX IF NOT EXISTS idx_change_requests_space_id ON public.change_requests(space_id);
        CREATE INDEX IF NOT EXISTS idx_change_requests_created_at ON public.change_requests(created_at DESC);
      `)

      // Create approval_rules table
      await query(`
        CREATE TABLE IF NOT EXISTS public.approval_rules (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          change_types JSONB NOT NULL DEFAULT '[]'::jsonb,
          requires_approval BOOLEAN NOT NULL DEFAULT true,
          min_approvers INTEGER NOT NULL DEFAULT 1,
          required_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
          space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
          enabled BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_approval_rules_enabled ON public.approval_rules(enabled);
        CREATE INDEX IF NOT EXISTS idx_approval_rules_space_id ON public.approval_rules(space_id);
      `)

      this.initialized = true
      console.log('✅ Database change approval system initialized')
    } catch (error) {
      console.error('❌ Failed to initialize change approval system:', error)
      throw error
    }
  }

  async createChangeRequest(
    request: Omit<ChangeRequest, 'id' | 'status' | 'approvals' | 'rejections' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    await this.initialize()

    try {
      // Determine if approval is required
      const requiresApproval = await this.checkRequiresApproval(request.changeType, request.spaceId)

      const status: ChangeRequestStatus = requiresApproval ? 'pending' : 'approved'

      const result = await query(`
        INSERT INTO public.change_requests (
          title, description, change_type, sql_statement, rollback_sql,
          requested_by, requested_by_name, space_id, connection_id,
          status, approvers, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
      `, [
        request.title,
        request.description || null,
        request.changeType,
        request.sqlStatement,
        request.rollbackSql || null,
        request.requestedBy,
        request.requestedByName || null,
        request.spaceId || null,
        request.connectionId || null,
        status,
        JSON.stringify(request.approvers || []),
        request.metadata ? JSON.stringify(request.metadata) : null
      ])

      const changeRequestId = result.rows[0]?.id

      // If no approval required, auto-merge
      if (!requiresApproval) {
        await this.mergeChangeRequest(changeRequestId, request.requestedBy)
      }

      return changeRequestId
    } catch (error) {
      console.error('❌ Failed to create change request:', error)
      throw error
    }
  }

  async approveChangeRequest(
    changeRequestId: string,
    userId: string,
    userName?: string,
    comment?: string
  ): Promise<boolean> {
    await this.initialize()

    try {
      // Get current change request
      const current = await this.getChangeRequest(changeRequestId)
      if (!current) {
        throw new Error('Change request not found')
      }

      if (current.status !== 'pending') {
        throw new Error(`Cannot approve change request with status: ${current.status}`)
      }

      // Check if user is in approvers list
      if (!current.approvers.includes(userId)) {
        throw new Error('User is not authorized to approve this change request')
      }

      // Check if already approved by this user
      if (current.approvals.some(a => a.userId === userId && a.approved)) {
        throw new Error('User has already approved this change request')
      }

      // Add approval
      const newApproval = {
        userId,
        userName: userName || null,
        approved: true,
        comment: comment || null,
        timestamp: new Date()
      }

      const updatedApprovals = [...current.approvals, newApproval]

      // Check if we have enough approvals
      const rule = await this.getApprovalRule(current.changeType, current.spaceId)
      const minApprovers = rule?.minApprovers || 1
      const hasEnoughApprovals = updatedApprovals.filter(a => a.approved).length >= minApprovers

      const newStatus: ChangeRequestStatus = hasEnoughApprovals ? 'approved' : 'pending'

      await query(`
        UPDATE public.change_requests
        SET approvals = $1, status = $2, updated_at = NOW()
        WHERE id = $3
      `, [JSON.stringify(updatedApprovals), newStatus, changeRequestId])

      return hasEnoughApprovals
    } catch (error) {
      console.error('❌ Failed to approve change request:', error)
      throw error
    }
  }

  async rejectChangeRequest(
    changeRequestId: string,
    userId: string,
    userName: string,
    reason: string
  ): Promise<void> {
    await this.initialize()

    try {
      const current = await this.getChangeRequest(changeRequestId)
      if (!current) {
        throw new Error('Change request not found')
      }

      if (current.status !== 'pending') {
        throw new Error(`Cannot reject change request with status: ${current.status}`)
      }

      const newRejection = {
        userId,
        userName,
        reason,
        timestamp: new Date()
      }

      const updatedRejections = [...current.rejections, newRejection]

      await query(`
        UPDATE public.change_requests
        SET rejections = $1, status = 'rejected', updated_at = NOW()
        WHERE id = $2
      `, [JSON.stringify(updatedRejections), changeRequestId])
    } catch (error) {
      console.error('❌ Failed to reject change request:', error)
      throw error
    }
  }

  async mergeChangeRequest(changeRequestId: string, mergedBy: string): Promise<void> {
    await this.initialize()

    try {
      const current = await this.getChangeRequest(changeRequestId)
      if (!current) {
        throw new Error('Change request not found')
      }

      if (current.status !== 'approved') {
        throw new Error(`Cannot merge change request with status: ${current.status}`)
      }

      // Execute the SQL statement
      // Note: In production, this should be done in a transaction with proper error handling
      await query(current.sqlStatement)

      // Update status
      await query(`
        UPDATE public.change_requests
        SET status = 'merged', merged_at = NOW(), merged_by = $1, updated_at = NOW()
        WHERE id = $2
      `, [mergedBy, changeRequestId])
    } catch (error) {
      console.error('❌ Failed to merge change request:', error)
      throw error
    }
  }

  async getChangeRequest(id: string): Promise<ChangeRequest | null> {
    await this.initialize()

    try {
      const result = await query(`
        SELECT * FROM public.change_requests WHERE id = $1
      `, [id])

      if (result.rows.length === 0) {
        return null
      }

      const row = result.rows[0]
      return this.mapRowToChangeRequest(row)
    } catch (error) {
      console.error('❌ Failed to get change request:', error)
      return null
    }
  }

  async getChangeRequests(filters?: {
    status?: ChangeRequestStatus
    requestedBy?: string
    spaceId?: string
    limit?: number
    offset?: number
  }): Promise<ChangeRequest[]> {
    await this.initialize()

    try {
      const conditions: string[] = []
      const params: any[] = []
      let paramIndex = 1

      if (filters?.status) {
        conditions.push(`status = $${paramIndex++}`)
        params.push(filters.status)
      }

      if (filters?.requestedBy) {
        conditions.push(`requested_by = $${paramIndex++}`)
        params.push(filters.requestedBy)
      }

      if (filters?.spaceId) {
        conditions.push(`space_id = $${paramIndex++}`)
        params.push(filters.spaceId)
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
      const limit = filters?.limit || 50
      const offset = filters?.offset || 0

      const result = await query(`
        SELECT * FROM public.change_requests
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `, [...params, limit, offset])

      return result.rows.map(row => this.mapRowToChangeRequest(row))
    } catch (error) {
      console.error('❌ Failed to get change requests:', error)
      return []
    }
  }

  private mapRowToChangeRequest(row: any): ChangeRequest {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      changeType: row.change_type as ChangeType,
      sqlStatement: row.sql_statement,
      rollbackSql: row.rollback_sql,
      requestedBy: row.requested_by,
      requestedByName: row.requested_by_name,
      spaceId: row.space_id,
      connectionId: row.connection_id,
      status: row.status as ChangeRequestStatus,
      approvers: row.approvers || [],
      approvals: (row.approvals || []).map((a: any) => ({
        ...a,
        timestamp: new Date(a.timestamp)
      })),
      rejections: (row.rejections || []).map((r: any) => ({
        ...r,
        timestamp: new Date(r.timestamp)
      })),
      metadata: row.metadata,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      mergedAt: row.merged_at ? new Date(row.merged_at) : undefined,
      mergedBy: row.merged_by
    }
  }

  async checkRequiresApproval(changeType: ChangeType, spaceId?: string): Promise<boolean> {
    await this.initialize()

    try {
      const rule = await this.getApprovalRule(changeType, spaceId)
      return rule?.requiresApproval ?? true // Default to requiring approval
    } catch (error) {
      console.error('❌ Failed to check approval requirement:', error)
      return true // Default to requiring approval on error
    }
  }

  async getApprovalRule(changeType: ChangeType, spaceId?: string): Promise<ApprovalRule | null> {
    await this.initialize()

    try {
      // First try to find space-specific rule
      if (spaceId) {
        const spaceResult = await query(`
          SELECT * FROM public.approval_rules
          WHERE space_id = $1 
            AND enabled = true
            AND change_types @> to_jsonb($2::text)
          ORDER BY created_at DESC
          LIMIT 1
        `, [spaceId, changeType])

        if (spaceResult.rows.length > 0) {
          return this.mapRowToApprovalRule(spaceResult.rows[0])
        }
      }

      // Fall back to global rule
      const globalResult = await query(`
        SELECT * FROM public.approval_rules
        WHERE space_id IS NULL
          AND enabled = true
          AND change_types @> to_jsonb($1::text)
        ORDER BY created_at DESC
        LIMIT 1
      `, [changeType])

      if (globalResult.rows.length > 0) {
        return this.mapRowToApprovalRule(globalResult.rows[0])
      }

      return null
    } catch (error) {
      console.error('❌ Failed to get approval rule:', error)
      return null
    }
  }

  private mapRowToApprovalRule(row: any): ApprovalRule {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      changeTypes: row.change_types || [],
      requiresApproval: row.requires_approval,
      minApprovers: row.min_approvers,
      requiredRoles: row.required_roles || [],
      spaceId: row.space_id,
      enabled: row.enabled
    }
  }

  async createApprovalRule(rule: Omit<ApprovalRule, 'id'>): Promise<string> {
    await this.initialize()

    try {
      const result = await query(`
        INSERT INTO public.approval_rules (
          name, description, change_types, requires_approval,
          min_approvers, required_roles, space_id, enabled
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [
        rule.name,
        rule.description || null,
        JSON.stringify(rule.changeTypes),
        rule.requiresApproval,
        rule.minApprovers,
        JSON.stringify(rule.requiredRoles),
        rule.spaceId || null,
        rule.enabled
      ])

      return result.rows[0]?.id
    } catch (error) {
      console.error('❌ Failed to create approval rule:', error)
      throw error
    }
  }
}

// Export singleton instance
export const changeApproval = new DatabaseChangeApproval()


import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'

async function postHandler(request: NextRequest) {
    const authResult = await requireAdmin()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    // Check if user has admin privileges
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    // Read file content
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'File must contain at least a header and one data row' }, { status: 400 })
    }

    // Parse CSV
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    const requiredHeaders = ['name', 'email', 'password']
    const missingHeaders = requiredHeaders.filter(h => !headers.map(h2 => h2.toLowerCase()).includes(h.toLowerCase()))
    
    if (missingHeaders.length > 0) {
      return NextResponse.json(
        { error: `Missing required columns: ${missingHeaders.join(', ')}` },
        { status: 400 }
      )
    }

    const results = {
      success: [] as Array<{ email: string; name: string }>,
      failed: [] as Array<{ email: string; error: string }>
    }

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      try {
        // Parse CSV line (handling quoted values)
        const values: string[] = []
        let current = ''
        let inQuotes = false
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j]
          if (char === '"') {
            inQuotes = !inQuotes
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim())
            current = ''
          } else {
            current += char
          }
        }
        values.push(current.trim())

        // Map values to headers
        const row: any = {}
        headers.forEach((header, index) => {
          row[header.toLowerCase()] = values[index]?.replace(/^"|"$/g, '') || ''
        })

        const name = row.name || row.name
        const email = row.email || row.email
        const password = row.password || row.password
        const role = (row.role || row.role || 'USER').toUpperCase()
        const isActive = row.isactive !== undefined ? row.isactive === 'true' || row.isactive === '1' : true

        // Validate required fields
        if (!name || !email || !password) {
          results.failed.push({ email: email || 'unknown', error: 'Missing required fields' })
          continue
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          results.failed.push({ email, error: 'Invalid email format' })
          continue
        }

        // Validate role
        const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER']
        const userRole = allowedRoles.includes(role) ? role : 'USER'

        // Check if user already exists
        const existing = await query(
          'SELECT id FROM users WHERE email = $1 LIMIT 1',
          [email]
        )

        if (existing.rows.length > 0) {
          results.failed.push({ email, error: 'User with this email already exists' })
          continue
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12)

        // Create user
        const result = await query(
          `INSERT INTO users (email, name, password, role, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
           RETURNING id, email, name, role`,
          [email, name, hashedPassword, userRole, isActive]
        )

        results.success.push({ email, name })
      } catch (error: any) {
        results.failed.push({ email: 'unknown', error: error.message || 'Failed to process row' })
      }
    }

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: lines.length - 1,
        succeeded: results.success.length,
        failed: results.failed.length
      }
    })
}

export const POST = withErrorHandling(postHandler, 'POST /api/admin/users/import')


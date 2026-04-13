/**
 * API v1 - Data Models
 * 
 * This is a redirect/wrapper to maintain backward compatibility
 * while migrating to the new structure.
 * 
 * TODO: Migrate actual implementation here
 */

import { NextRequest, NextResponse } from 'next/server'

// Re-export from original location for now
// This allows gradual migration
export { GET, POST } from '../../data-models/route'


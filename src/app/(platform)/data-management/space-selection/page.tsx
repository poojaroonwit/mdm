'use client'

import { redirect } from 'next/navigation'

// Redirect to admin space-selection - this route is deprecated
export default function SpaceSelectionPage() {
  redirect('/admin/space-selection')
}


'use client'

import { redirect } from 'next/navigation'

// Redirect to the main knowledge base page
export default function KnowledgeBasePage() {
    redirect('/knowledge')
}

'use client'

import { useEffect, useState } from 'react'

type Industry = {
  id: string
  name: string
  description: string | null
}

export default function IndustriesPage() {
  const [industries, setIndustries] = useState<Industry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        // Use Next.js API route for internal access
        const res = await fetch('/api/industries?limit=1000', { cache: 'no-store' })
        if (!res.ok) {
          const text = await res.text()
          throw new Error(`Failed to fetch industries (${res.status}): ${text}`)
        }
        const result = await res.json()
        // API returns { industries: [...] }
        setIndustries(result.industries || [])
      } catch (e: any) {
        setError(e?.message || 'Failed to load industries')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Industries</h1>
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Industries</h1>
        <div className="text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Industries</h1>
      {industries.length === 0 ? (
        <div className="text-muted-foreground">No industries found.</div>
      ) : (
        <div className="overflow-x-auto border rounded-md">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Name</th>
                <th className="text-left px-4 py-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {industries.map((ind) => (
                <tr key={ind.id} className="border-t">
                  <td className="px-4 py-2">{ind.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">{ind.description || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}



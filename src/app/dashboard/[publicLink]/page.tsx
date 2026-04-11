import { notFound } from 'next/navigation'
import { query } from '@/lib/db'

interface PublicDashboardPageProps {
  params: Promise<{
    publicLink: string
  }>
}

export default async function PublicDashboardPage({ params }: PublicDashboardPageProps) {
  const { publicLink } = await params

  // Fetch dashboard by public link using raw SQL
  // Note: Dashboard model doesn't exist in Prisma schema
  const { rows } = await query(
    `SELECT * FROM dashboards WHERE public_link = $1 AND visibility = 'PUBLIC' LIMIT 1`,
    [publicLink]
  )

  if (rows.length === 0) {
    notFound()
  }

  const dashboard = rows[0] as any

  // Fetch dashboard elements
  const { rows: elements } = await query(
    `SELECT * FROM dashboard_elements WHERE dashboard_id = $1 ORDER BY position`,
    [dashboard.id]
  )

  // Fetch dashboard datasources
  const { rows: datasources } = await query(
    `SELECT * FROM dashboard_datasources WHERE dashboard_id = $1`,
    [dashboard.id]
  )

  dashboard.elements = elements
  dashboard.datasources = datasources

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{dashboard.name}</h1>
          {dashboard.description && (
            <p className="text-gray-600 mt-2">{dashboard.description}</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="grid grid-cols-12 gap-4">
            {dashboard.elements.map((element: any) => (
              <div
                key={element.id}
                className="col-span-12 md:col-span-6 lg:col-span-4"
                style={{
                  gridColumn: `span ${element.width || 4}`,
                  gridRow: `span ${element.height || 3}`
                }}
              >
                <div className="h-full bg-card border border-border rounded-lg p-4 shadow-lg">
                  <h3 className="font-medium text-sm mb-2">{element.name}</h3>
                  <div className="text-xs text-muted-foreground mb-4">
                    {element.type} - {element.chart_type || 'Chart'}
                  </div>
                  
                  {/* Render chart content based on type */}
                  <div className="h-48 flex items-center justify-center bg-muted rounded">
                    <div className="text-center text-gray-500">
                      <div className="text-sm font-medium">{element.chart_type || element.type}</div>
                      <div className="text-xs mt-1">Interactive Chart</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Powered by Dashboard Builder</p>
        </div>
      </div>
    </div>
  )
}

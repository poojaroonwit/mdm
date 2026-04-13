import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { notFound } from 'next/navigation'

interface PageProps {
    params: Promise<{
        id: string
    }>
}

export default async function ProjectOverviewPage({ params }: PageProps) {
    const { id } = await params
    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            cycles: {
                where: { status: 'ACTIVE' },
                take: 1
            },
            _count: {
                select: {
                    tickets: true,
                    modules: true,
                    cycles: true
                }
            }
        }
    })

    if (!project) {
        notFound()
    }

    const activeCycle = project.cycles[0]

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                    <p className="text-muted-foreground mt-1">{project.description || 'No description'}</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground uppercase bg-secondary px-2 py-1 rounded">
                        {project.status}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Issues
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{project._count.tickets}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Modules
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{project._count.modules}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Active Cycle
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {activeCycle ? activeCycle.name : 'None'}
                        </div>
                        {activeCycle && (
                            <p className="text-xs text-muted-foreground mt-1">
                                Ends {activeCycle.endDate ? new Date(activeCycle.endDate).toLocaleDateString() : 'N/A'}
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* TODO: Add Activity Stream or Recent Issues */}
        </div>
    )
}

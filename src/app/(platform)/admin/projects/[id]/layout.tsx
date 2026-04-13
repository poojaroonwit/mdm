import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'

interface LayoutProps {
    children: React.ReactNode
    params: Promise<{
        id: string
    }>
}

export default async function Layout({ children, params }: LayoutProps) {
    const { id } = await params
    const project = await prisma.project.findUnique({
        where: { id },
        select: { id: true, name: true }
    })

    if (!project) {
        notFound()
    }

    // TODO: Add ProjectLayout component when implemented
    return (
        <div className="container mx-auto py-6">
            <h1 className="text-2xl font-bold mb-4">{project.name}</h1>
            {children}
        </div>
    )
}

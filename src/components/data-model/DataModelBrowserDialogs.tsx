import { DataModelDrawer } from '@/app/admin/features/system/components/DataModelDrawer'
import { ExternalConnectionWizard } from '@/app/admin/features/system/components/ExternalConnectionWizard'
import type { DataModel } from './dataModelBrowserModel'

interface DataModelBrowserDialogsProps {
    editingModel: DataModel | null
    showExternalWizard: boolean
    showNewModelDrawer: boolean
    spaceId: string
    handleSaveExternalConnection: (data: any) => Promise<void>
    handleSaveModel: (formData: any) => Promise<void>
    setShowExternalWizard: (open: boolean) => void
    setShowNewModelDrawer: (open: boolean) => void
}

export function DataModelBrowserDialogs({
    editingModel,
    showExternalWizard,
    showNewModelDrawer,
    spaceId,
    handleSaveExternalConnection,
    handleSaveModel,
    setShowExternalWizard,
    setShowNewModelDrawer,
}: DataModelBrowserDialogsProps) {
    return (
        <>
            <DataModelDrawer
                open={showNewModelDrawer}
                onOpenChange={setShowNewModelDrawer}
                initialData={editingModel}
                onSubmit={handleSaveModel}
            />

            <ExternalConnectionWizard
                open={showExternalWizard}
                onOpenChange={setShowExternalWizard}
                onSubmit={handleSaveExternalConnection}
                spaceId={spaceId}
            />
        </>
    )
}

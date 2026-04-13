'use client'

import { useState, useEffect } from 'react'
import { BigQueryInterface } from '@plugins/sql-query/src/components/BigQueryInterface'
import { BreadcrumbActions } from '@plugins/sql-query/src/components/BreadcrumbActions'
import { useSpaces } from '@/hooks'
import { useBreadcrumbActions } from '../hooks'

export default function BigQueryPage() {
  const [selectedSpace, setSelectedSpace] = useState('all')
  const { spaces, loading: spacesLoading, error: spacesError, refetch: refetchSpaces } = useSpaces()
  const { setBreadcrumbActions } = useBreadcrumbActions()

  useEffect(() => {
    const breadcrumbActions = (
      <BreadcrumbActions
        selectedSpace={selectedSpace}
        spaces={spaces}
        spacesLoading={spacesLoading}
        spacesError={spacesError}
        onSpaceChange={setSelectedSpace}
        onRetrySpaces={refetchSpaces}
      />
    )
    setBreadcrumbActions(breadcrumbActions)

    // Cleanup when component unmounts
    return () => {
      setBreadcrumbActions(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSpace, spaces, spacesLoading, spacesError, refetchSpaces])

  return (
    <div>
      <BigQueryInterface 
        selectedSpace={selectedSpace}
        onSpaceChange={setSelectedSpace}
      />
    </div>
  )
}


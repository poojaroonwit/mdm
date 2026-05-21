import { NextRequest, NextResponse } from 'next/server'
import { getHubPluginDetail } from '../../../../lib/hub-data'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params
  const plugin = await getHubPluginDetail(params.slug)

  if (!plugin) {
    return NextResponse.json({ error: 'Plugin not found' }, { status: 404 })
  }

  return NextResponse.json(plugin)
}

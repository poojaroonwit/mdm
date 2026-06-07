import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import type { RecordConfigData } from './record-config-model'

interface RecordStylingTabProps {
  config: RecordConfigData
  onConfigUpdate: (updates: Partial<RecordConfigData>) => void
}

export function RecordStylingTab({ config, onConfigUpdate }: RecordStylingTabProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Styling Options</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="theme">Theme</Label>
          <Select
            value={config.styling.theme}
            onValueChange={(value) => onConfigUpdate({ styling: { ...config.styling, theme: value as any } })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="minimal">Minimal</SelectItem>
              <SelectItem value="modern">Modern</SelectItem>
              <SelectItem value="classic">Classic</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="font-size">Font Size</Label>
          <Select
            value={config.styling.fontSize}
            onValueChange={(value) => onConfigUpdate({ styling: { ...config.styling, fontSize: value as any } })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="border-radius">Border Radius</Label>
          <Input
            id="border-radius"
            type="number"
            value={config.styling.borderRadius}
            onChange={(event) => onConfigUpdate({
              styling: { ...config.styling, borderRadius: parseInt(event.target.value) || 8 }
            })}
            min="0"
            max="20"
          />
        </div>
      </CardContent>
    </Card>
  )
}

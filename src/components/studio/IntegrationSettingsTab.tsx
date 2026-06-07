import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Settings } from 'lucide-react'

const settingsSections = [
  {
    title: 'Global Settings',
    items: [
      ['Auto-sync Integrations', 'Automatically sync data from integrations', true],
      ['Error Notifications', 'Send notifications when integrations fail', true],
      ['Rate Limit Monitoring', 'Monitor and alert on rate limit usage', true]
    ]
  },
  {
    title: 'Security Settings',
    items: [
      ['API Key Encryption', 'Encrypt stored API keys', true],
      ['Webhook Signature Validation', 'Validate webhook signatures', true],
      ['IP Whitelisting', 'Restrict access by IP address', false]
    ]
  },
  {
    title: 'Monitoring',
    items: [
      ['Performance Monitoring', 'Monitor integration performance', true],
      ['Usage Analytics', 'Track integration usage', true],
      ['Health Checks', 'Regular health checks for integrations', true]
    ]
  }
]

export function IntegrationSettingsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Integration Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {settingsSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-lg font-semibold mb-4">{section.title}</h3>
              <div className="space-y-4">
                {section.items.map(([label, description, enabled]) => (
                  <div key={label as string} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{label}</div>
                      <div className="text-sm text-muted-foreground">{description}</div>
                    </div>
                    <Switch defaultChecked={Boolean(enabled)} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

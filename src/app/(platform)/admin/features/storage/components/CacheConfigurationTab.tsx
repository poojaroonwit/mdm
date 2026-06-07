'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { TabsContent } from '@/components/ui/tabs'

export function CacheConfigurationTab({ config }: { config: any }) {
  return (        <TabsContent value="config" className="space-y-6">
          <h3 className="text-lg font-semibold">Cache Configuration</h3>
          {config && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Memory Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="max-memory">Max Memory</Label>
                    <Input
                      id="max-memory"
                      value={config.maxMemory}
                      placeholder="1gb"
                    />
                  </div>
                  <div>
                    <Label htmlFor="eviction-policy">Eviction Policy</Label>
                    <Select value={config.evictionPolicy}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="allkeys-lru">All Keys LRU</SelectItem>
                        <SelectItem value="allkeys-lfu">All Keys LFU</SelectItem>
                        <SelectItem value="volatile-lru">Volatile LRU</SelectItem>
                        <SelectItem value="volatile-lfu">Volatile LFU</SelectItem>
                        <SelectItem value="noeviction">No Eviction</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="default-ttl">Default TTL (seconds)</Label>
                    <Input
                      id="default-ttl"
                      type="number"
                      value={config.ttl}
                      placeholder="3600"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch checked={config.compression} />
                      <Label>Enable Compression</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={config.persistence} />
                      <Label>Enable Persistence</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={config.clustering} />
                      <Label>Enable Clustering</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
  )
}
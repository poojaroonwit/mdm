'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Save, Trash2 } from 'lucide-react'

interface PerformanceConfigurationTabsProps {
  cacheConfig: any
  costBudget: any
  rateLimit: any
  retryConfig: any
  saving: boolean
  clearCache: () => void
  saveCacheConfig: () => void
  saveCostBudget: () => void
  saveRateLimit: () => void
  saveRetryConfig: () => void
  setCacheConfig: (config: any) => void
  setCostBudget: (config: any) => void
  setRateLimit: (config: any) => void
  setRetryConfig: (config: any) => void
}

export function PerformanceConfigurationTabs({
  cacheConfig,
  costBudget,
  rateLimit,
  retryConfig,
  saving,
  clearCache,
  saveCacheConfig,
  saveCostBudget,
  saveRateLimit,
  saveRetryConfig,
  setCacheConfig,
  setCostBudget,
  setRateLimit,
  setRetryConfig
}: PerformanceConfigurationTabsProps) {
  return (
    <>
          {/* Rate Limiting Tab */}
          <TabsContent value="rate-limit" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Rate Limiting</CardTitle>
                <CardDescription>
                  Control how many requests users can make per time period to prevent abuse and control costs.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Rate Limiting</Label>
                  <Switch
                    checked={rateLimit.enabled}
                    onCheckedChange={(checked) => setRateLimit({ ...rateLimit, enabled: checked })}
                  />
                </div>

                {rateLimit.enabled && (
                  <div className="space-y-4 pl-4 border-l-2 border-muted">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Max Requests per Minute</Label>
                        <Input
                          type="number"
                          value={rateLimit.maxRequestsPerMinute || ''}
                          onChange={(e) => setRateLimit({ ...rateLimit, maxRequestsPerMinute: parseInt(e.target.value) || 0 })}
                          placeholder="60"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Requests per Hour</Label>
                        <Input
                          type="number"
                          value={rateLimit.maxRequestsPerHour || ''}
                          onChange={(e) => setRateLimit({ ...rateLimit, maxRequestsPerHour: parseInt(e.target.value) || 0 })}
                          placeholder="1000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Requests per Day</Label>
                        <Input
                          type="number"
                          value={rateLimit.maxRequestsPerDay || ''}
                          onChange={(e) => setRateLimit({ ...rateLimit, maxRequestsPerDay: parseInt(e.target.value) || 0 })}
                          placeholder="10000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Requests per Month (Optional)</Label>
                        <Input
                          type="number"
                          value={rateLimit.maxRequestsPerMonth || ''}
                          onChange={(e) => setRateLimit({ ...rateLimit, maxRequestsPerMonth: parseInt(e.target.value) || 0 })}
                          placeholder="Unlimited"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Burst Limit (Optional)</Label>
                        <Input
                          type="number"
                          value={rateLimit.burstLimit || ''}
                          onChange={(e) => setRateLimit({ ...rateLimit, burstLimit: parseInt(e.target.value) || 0 })}
                          placeholder="Allow burst of N requests"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Window Size (seconds)</Label>
                        <Input
                          type="number"
                          value={rateLimit.windowSize}
                          onChange={(e) => setRateLimit({ ...rateLimit, windowSize: parseInt(e.target.value) || 60 })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Block Duration (seconds)</Label>
                      <Input
                        type="number"
                        value={rateLimit.blockDuration}
                        onChange={(e) => setRateLimit({ ...rateLimit, blockDuration: parseInt(e.target.value) || 300 })}
                        placeholder="300"
                      />
                      <p className="text-xs text-muted-foreground">
                        How long to block users when they exceed the rate limit
                      </p>
                    </div>
                  </div>
                )}

                <Button onClick={saveRateLimit} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Rate Limit Config
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cache Tab */}
          <TabsContent value="cache" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Response Caching</CardTitle>
                <CardDescription>
                  Cache responses to reduce API costs and improve response times for duplicate queries.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Caching</Label>
                  <Switch
                    checked={cacheConfig.enabled}
                    onCheckedChange={(checked) => setCacheConfig({ ...cacheConfig, enabled: checked })}
                  />
                </div>

                {cacheConfig.enabled && (
                  <div className="space-y-4 pl-4 border-l-2 border-muted">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>TTL (Time to Live) in seconds</Label>
                        <Input
                          type="number"
                          value={cacheConfig.ttl}
                          onChange={(e) => setCacheConfig({ ...cacheConfig, ttl: parseInt(e.target.value) || 3600 })}
                          placeholder="3600"
                        />
                        <p className="text-xs text-muted-foreground">How long cached responses are valid</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Max Cache Size</Label>
                        <Input
                          type="number"
                          value={cacheConfig.maxSize}
                          onChange={(e) => setCacheConfig({ ...cacheConfig, maxSize: parseInt(e.target.value) || 1000 })}
                          placeholder="1000"
                        />
                        <p className="text-xs text-muted-foreground">Maximum number of cached responses</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Cache Strategy</Label>
                      <Select
                        value={cacheConfig.strategy}
                        onValueChange={(value: string) => setCacheConfig({ ...cacheConfig, strategy: value as 'exact' | 'semantic' | 'fuzzy' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="exact">Exact Match</SelectItem>
                          <SelectItem value="semantic">Semantic Match</SelectItem>
                          <SelectItem value="fuzzy">Fuzzy Match</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {cacheConfig.strategy === 'exact' && 'Cache only exact message matches'}
                        {cacheConfig.strategy === 'semantic' && 'Cache similar messages (normalized, case-insensitive)'}
                        {cacheConfig.strategy === 'fuzzy' && 'Cache based on first N words'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Include Context in Cache Key</Label>
                        <p className="text-xs text-muted-foreground">Include conversation history in cache key for more precise matching</p>
                      </div>
                      <Switch
                        checked={cacheConfig.includeContext}
                        onCheckedChange={(checked) => setCacheConfig({ ...cacheConfig, includeContext: checked })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Cache Key Prefix (Optional)</Label>
                      <Input
                        value={cacheConfig.cacheKeyPrefix || ''}
                        onChange={(e) => setCacheConfig({ ...cacheConfig, cacheKeyPrefix: e.target.value || null })}
                        placeholder="Optional prefix for cache keys"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={saveCacheConfig} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Cache Config
                  </Button>
                  <Button onClick={clearCache} variant="destructive" disabled={saving}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Cache
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Retry Tab */}
          <TabsContent value="retry" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Retry Logic</CardTitle>
                <CardDescription>
                  Configure automatic retries with exponential backoff for failed API requests.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Retry Logic</Label>
                  <Switch
                    checked={retryConfig.enabled}
                    onCheckedChange={(checked) => setRetryConfig({ ...retryConfig, enabled: checked })}
                  />
                </div>

                {retryConfig.enabled && (
                  <div className="space-y-4 pl-4 border-l-2 border-muted">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Max Retries</Label>
                        <Input
                          type="number"
                          value={retryConfig.maxRetries}
                          onChange={(e) => setRetryConfig({ ...retryConfig, maxRetries: parseInt(e.target.value) || 3 })}
                          placeholder="3"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Initial Delay (ms)</Label>
                        <Input
                          type="number"
                          value={retryConfig.initialDelay}
                          onChange={(e) => setRetryConfig({ ...retryConfig, initialDelay: parseInt(e.target.value) || 1000 })}
                          placeholder="1000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Delay (ms)</Label>
                        <Input
                          type="number"
                          value={retryConfig.maxDelay}
                          onChange={(e) => setRetryConfig({ ...retryConfig, maxDelay: parseInt(e.target.value) || 30000 })}
                          placeholder="30000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Backoff Multiplier</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={retryConfig.backoffMultiplier}
                          onChange={(e) => setRetryConfig({ ...retryConfig, backoffMultiplier: parseFloat(e.target.value) || 2.0 })}
                          placeholder="2.0"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Retryable Status Codes</Label>
                      <Input
                        value={retryConfig.retryableStatusCodes.join(', ')}
                        onChange={(e) => setRetryConfig({ ...retryConfig, retryableStatusCodes: e.target.value.split(',').map(s => s.trim()) })}
                        placeholder="500, 502, 503, 504"
                      />
                      <p className="text-xs text-muted-foreground">Comma-separated list of HTTP status codes to retry</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Enable Jitter</Label>
                        <p className="text-xs text-muted-foreground">Add randomness to retry delays to prevent thundering herd</p>
                      </div>
                      <Switch
                        checked={retryConfig.jitter}
                        onCheckedChange={(checked) => setRetryConfig({ ...retryConfig, jitter: checked })}
                      />
                    </div>
                  </div>
                )}

                <Button onClick={saveRetryConfig} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Retry Config
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cost Budget Tab */}
          <TabsContent value="budget" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Cost Budget & Tracking</CardTitle>
                <CardDescription>
                  Set spending limits and track costs per chatbot, user, or thread.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Cost Tracking</Label>
                  <Switch
                    checked={costBudget.enabled}
                    onCheckedChange={(checked) => setCostBudget({ ...costBudget, enabled: checked })}
                  />
                </div>

                {costBudget.enabled && (
                  <div className="space-y-4 pl-4 border-l-2 border-muted">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Monthly Budget (USD)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={costBudget.monthlyBudget || ''}
                          onChange={(e) => setCostBudget({ ...costBudget, monthlyBudget: parseFloat(e.target.value) || null })}
                          placeholder="Unlimited"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Daily Budget (USD)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={costBudget.dailyBudget || ''}
                          onChange={(e) => setCostBudget({ ...costBudget, dailyBudget: parseFloat(e.target.value) || null })}
                          placeholder="Unlimited"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Alert Threshold (0-1)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="1"
                          value={costBudget.alertThreshold}
                          onChange={(e) => setCostBudget({ ...costBudget, alertThreshold: parseFloat(e.target.value) || 0.8 })}
                          placeholder="0.8"
                        />
                        <p className="text-xs text-muted-foreground">Alert when budget reaches this percentage</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Alert Email</Label>
                        <Input
                          type="email"
                          value={costBudget.alertEmail || ''}
                          onChange={(e) => setCostBudget({ ...costBudget, alertEmail: e.target.value || null })}
                          placeholder="admin@example.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Tracking Options</Label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="font-normal">Track Costs Per User</Label>
                          <Switch
                            checked={costBudget.trackPerUser}
                            onCheckedChange={(checked) => setCostBudget({ ...costBudget, trackPerUser: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="font-normal">Track Costs Per Thread</Label>
                          <Switch
                            checked={costBudget.trackPerThread}
                            onCheckedChange={(checked) => setCostBudget({ ...costBudget, trackPerThread: checked })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Button onClick={saveCostBudget} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Budget Config
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
    </>
  )
}
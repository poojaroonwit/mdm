'use client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CrudDialog } from '@/components/ui/crud-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge } from '@/components/ui/status-badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Database, Eye, Key, Play, Plus, Trash2 } from 'lucide-react'
import { CacheConfigurationTab } from './CacheConfigurationTab'
interface CacheManagementTabsProps {
  clearCache: (instanceId: string) => void
  config: any
  createInstance: () => void
  createKey: () => void
  deleteKey: (key: string) => void
  filteredKeys: any[]
  formatBytes: (bytes: number) => string
  getCacheIcon: (type: string) => React.ReactNode
  getStatusIcon: (status: string) => React.ReactNode
  instances: any[]
  isLoading: boolean
  loadKeys: (instanceId: string) => void
  newInstance: any
  newKey: any
  searchTerm: string
  selectedInstance: any
  setNewInstance: (instance: any) => void
  setNewKey: (key: any) => void
  setSearchTerm: (term: string) => void
  setSelectedInstance: (instance: any) => void
  setShowCreateInstance: (open: boolean) => void
  setShowKeyDialog: (open: boolean) => void
  showCreateInstance: boolean
  showKeyDialog: boolean
  stats: any
  testConnection: (instanceId: string) => void
}
export function CacheManagementTabs({
  clearCache,
  config,
  createInstance,
  createKey,
  deleteKey,
  filteredKeys,
  formatBytes,
  getCacheIcon,
  getStatusIcon,
  instances,
  isLoading,
  loadKeys,
  newInstance,
  newKey,
  searchTerm,
  selectedInstance,
  setNewInstance,
  setNewKey,
  setSearchTerm,
  setSelectedInstance,
  setShowCreateInstance,
  setShowKeyDialog,
  showCreateInstance,
  showKeyDialog,
  stats,
  testConnection,
}: CacheManagementTabsProps) {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']
  return (      <div className="w-full">
      <Tabs defaultValue="instances">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="instances">Instances</TabsTrigger>
          <TabsTrigger value="keys">Keys</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="config">Config</TabsTrigger>
        </TabsList>
        <TabsContent value="instances" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Cache Instances</h3>
            <CrudDialog
              open={showCreateInstance}
              onOpenChange={setShowCreateInstance}
              title="Add Cache Instance"
              description="Configure a new cache instance"
              trigger={(
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Instance
                </Button>
              )}
              footer={(
                <>
                  <Button className="rounded-xl font-bold" variant="outline" onClick={() => setShowCreateInstance(false)}>
                    Cancel
                  </Button>
                  <Button className="rounded-xl font-bold" onClick={createInstance} disabled={!newInstance.name || !newInstance.host}>
                    Create Instance
                  </Button>
                </>
              )}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="instance-name">Instance Name</Label>
                    <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800"
                      id="instance-name"
                      value={newInstance.name}
                      onChange={(e) => setNewInstance({ ...newInstance, name: e.target.value })}
                      placeholder="Redis Cache"
                    />
                  </div>
                  <div>
                    <Label htmlFor="instance-type">Cache Type</Label>
                    <Select value={newInstance.type} onValueChange={(value: any) => setNewInstance({ ...newInstance, type: value })}>
                      <SelectTrigger className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="redis">Redis</SelectItem>
                        <SelectItem value="memcached">Memcached</SelectItem>
                        <SelectItem value="memory">In-Memory</SelectItem>
                        <SelectItem value="file">File Cache</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="instance-host">Host</Label>
                    <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800"
                      id="instance-host"
                      value={newInstance.host}
                      onChange={(e) => setNewInstance({ ...newInstance, host: e.target.value })}
                      placeholder="localhost"
                    />
                  </div>
                  <div>
                    <Label htmlFor="instance-port">Port</Label>
                    <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800"
                      id="instance-port"
                      type="number"
                      value={newInstance.port}
                      onChange={(e) => setNewInstance({ ...newInstance, port: parseInt(e.target.value) })}
                      placeholder="6379"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="instance-password">Password (Optional)</Label>
                  <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800"
                    id="instance-password"
                    type="password"
                    value={newInstance.password}
                    onChange={(e) => setNewInstance({ ...newInstance, password: e.target.value })}
                    placeholder="password"
                  />
                </div>
              </div>
            </CrudDialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {instances.length === 0 && !isLoading ? (
              <div className="col-span-full text-center py-12">
                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Cache Instances</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first cache instance to get started
                </p>
                <Button onClick={() => setShowCreateInstance(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Instance
                </Button>
              </div>
            ) : (
              instances.map(instance => (
              <Card key={instance.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {getCacheIcon(instance.type)}
                      {instance.name}
                    </CardTitle>
                    {getStatusIcon(instance.status)}
                  </div>
                  <CardDescription>
                    {instance.host}:{instance.port} • {instance.type}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <StatusBadge status={instance.status} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Memory Usage</span>
                      <span>{formatBytes(instance.memory.used)} / {formatBytes(instance.memory.total)}</span>
                    </div>
                    <Progress value={(instance.memory.used / instance.memory.total) * 100} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Keys:</span>
                      <div className="font-medium">{instance.stats.keys.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Hit Rate:</span>
                      <div className="font-medium">
                        {((instance.stats.hits / (instance.stats.hits + instance.stats.misses)) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedInstance(instance)
                        loadKeys(instance.id)
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View Keys
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testConnection(instance.id)}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Test
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => clearCache(instance.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              ))
            )}
          </div>
        </TabsContent>
        <TabsContent value="keys" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Cache Keys</h3>
            {selectedInstance && (
              <div className="flex items-center gap-2">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search keys..."
                  className="w-64"
                />
                <CrudDialog
                  open={showKeyDialog}
                  onOpenChange={setShowKeyDialog}
                  title="Add Cache Key"
                  description="Add a new key-value pair to the cache"
                  trigger={(
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Key
                    </Button>
                  )}
                  footer={(
                    <>
                      <Button className="rounded-xl font-bold" variant="outline" onClick={() => setShowKeyDialog(false)}>
                        Cancel
                      </Button>
                      <Button className="rounded-xl font-bold" onClick={createKey} disabled={!newKey.key || !newKey.value}>
                        Add Key
                      </Button>
                    </>
                  )}
                >
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="key-name">Key</Label>
                      <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800"
                        id="key-name"
                        value={newKey.key}
                        onChange={(e) => setNewKey({ ...newKey, key: e.target.value })}
                        placeholder="user:123"
                      />
                    </div>
                    <div>
                      <Label htmlFor="key-value">Value</Label>
                      <Textarea className="rounded-xl border-zinc-200 dark:border-zinc-800"
                        id="key-value"
                        value={newKey.value}
                        onChange={(e) => setNewKey({ ...newKey, value: e.target.value })}
                        placeholder="Cache value"
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label htmlFor="key-ttl">TTL (seconds)</Label>
                      <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800"
                        id="key-ttl"
                        type="number"
                        value={newKey.ttl}
                        onChange={(e) => setNewKey({ ...newKey, ttl: parseInt(e.target.value) })}
                        placeholder="3600"
                      />
                    </div>
                  </div>
                </CrudDialog>
              </div>
            )}
          </div>

          {selectedInstance ? (
            <div className="space-y-4">
              {filteredKeys.length === 0 ? (
                <div className="text-center py-12">
                  <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Cache Keys</h3>
                  <p className="text-muted-foreground mb-4">
                    This cache instance has no keys yet
                  </p>
                  <Button onClick={() => setShowKeyDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Key
                  </Button>
                </div>
              ) : (
                filteredKeys.map(key => (
                <Card key={key.key}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{key.key}</div>
                        <div className="text-sm text-muted-foreground">
                          {key.type} • {formatBytes(key.size)} • {key.hitCount} hits
                        </div>
                        {key.ttl && (
                          <div className="text-xs text-muted-foreground">
                            TTL: {key.ttl}s
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {key.isExpired && (
                          <Badge variant="destructive" className="text-xs">Expired</Badge>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteKey(key.key)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                ))
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a Cache Instance</h3>
              <p className="text-muted-foreground">
                Choose a cache instance to view and manage keys
              </p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="analytics" className="space-y-6">
          <h3 className="text-lg font-semibold">Cache Analytics</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Hit/Miss Ratio</CardTitle>
                <CardDescription>Cache performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Hits', value: stats?.hitRate || 0, fill: '#00C49F' },
                        { name: 'Misses', value: stats?.missRate || 0, fill: '#FF8042' }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {[0, 1].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Memory Usage</CardTitle>
                <CardDescription>Cache memory utilization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {instances.map(instance => (
                    <div key={instance.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{instance.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatBytes(instance.memory.used)} / {formatBytes(instance.memory.total)}
                        </span>
                      </div>
                      <Progress value={(instance.memory.used / instance.memory.total) * 100} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <CacheConfigurationTab config={config} />
      </Tabs>
      </div>
  )
}

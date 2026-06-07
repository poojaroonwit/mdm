import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ApiRequest, AuthType } from '../types'

interface RequestAuthTabProps {
  request: ApiRequest
  updateRequest: (updates: Partial<ApiRequest>) => void
}

export function RequestAuthTab({ request, updateRequest }: RequestAuthTabProps) {
  return (
    <div className="space-y-4">
      <Select
        value={request.authType || 'none'}
        onValueChange={(value) => updateRequest({ authType: value as AuthType })}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          <SelectItem value="bearer">Bearer Token</SelectItem>
          <SelectItem value="basic">Basic Auth</SelectItem>
          <SelectItem value="apikey">API Key</SelectItem>
          <SelectItem value="oauth2">OAuth 2.0</SelectItem>
          <SelectItem value="oidc">OIDC</SelectItem>
        </SelectContent>
      </Select>

      {request.authType === 'bearer' && (
        <div className="space-y-2">
          <Input
            value={request.authConfig?.bearerToken || ''}
            onChange={(e) =>
              updateRequest({
                authConfig: { ...request.authConfig, bearerToken: e.target.value },
              })
            }
            placeholder="Bearer token"
            type="password"
          />
        </div>
      )}

      {request.authType === 'basic' && (
        <div className="space-y-2">
          <Input
            value={request.authConfig?.username || ''}
            onChange={(e) =>
              updateRequest({
                authConfig: { ...request.authConfig, username: e.target.value },
              })
            }
            placeholder="Username"
          />
          <Input
            value={request.authConfig?.password || ''}
            onChange={(e) =>
              updateRequest({
                authConfig: { ...request.authConfig, password: e.target.value },
              })
            }
            placeholder="Password"
            type="password"
          />
        </div>
      )}

      {request.authType === 'apikey' && (
        <div className="space-y-2">
          <Input
            value={request.authConfig?.apiKeyName || ''}
            onChange={(e) =>
              updateRequest({
                authConfig: { ...request.authConfig, apiKeyName: e.target.value },
              })
            }
            placeholder="API Key Name"
          />
          <Input
            value={request.authConfig?.apiKeyValue || ''}
            onChange={(e) =>
              updateRequest({
                authConfig: { ...request.authConfig, apiKeyValue: e.target.value },
              })
            }
            placeholder="API Key Value"
            type="password"
          />
          <Select
            value={request.authConfig?.apiKeyLocation || 'header'}
            onValueChange={(value: string) =>
              updateRequest({
                authConfig: { ...request.authConfig, apiKeyLocation: value as 'header' | 'query' },
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="header">Header</SelectItem>
              <SelectItem value="query">Query</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {request.authType === 'oauth2' && (
        <div className="space-y-2">
          <Select
            value={request.authConfig?.oauth2Config?.grantType || 'authorization_code'}
            onValueChange={(value: any) =>
              updateRequest({
                authConfig: {
                  ...request.authConfig,
                  oauth2Config: {
                    ...request.authConfig?.oauth2Config,
                    grantType: value,
                  },
                },
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="authorization_code">Authorization Code</SelectItem>
              <SelectItem value="client_credentials">Client Credentials</SelectItem>
              <SelectItem value="password">Password</SelectItem>
              <SelectItem value="implicit">Implicit</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={request.authConfig?.oauth2Config?.authorizationUrl || ''}
            onChange={(e) =>
              updateRequest({
                authConfig: {
                  ...request.authConfig,
                  oauth2Config: {
                    ...request.authConfig?.oauth2Config,
                    authorizationUrl: e.target.value,
                    grantType: request.authConfig?.oauth2Config?.grantType || 'authorization_code',
                  },
                },
              })
            }
            placeholder="Authorization URL"
          />
          <Input
            value={request.authConfig?.oauth2Config?.accessTokenUrl || ''}
            onChange={(e) =>
              updateRequest({
                authConfig: {
                  ...request.authConfig,
                  oauth2Config: {
                    ...request.authConfig?.oauth2Config,
                    accessTokenUrl: e.target.value,
                    grantType: request.authConfig?.oauth2Config?.grantType || 'authorization_code',
                  },
                },
              })
            }
            placeholder="Access Token URL"
          />
          <Input
            value={request.authConfig?.oauth2Config?.clientId || ''}
            onChange={(e) =>
              updateRequest({
                authConfig: {
                  ...request.authConfig,
                  oauth2Config: {
                    ...request.authConfig?.oauth2Config,
                    clientId: e.target.value,
                    grantType: request.authConfig?.oauth2Config?.grantType || 'authorization_code',
                  },
                },
              })
            }
            placeholder="Client ID"
          />
          <Input
            value={request.authConfig?.oauth2Config?.clientSecret || ''}
            onChange={(e) =>
              updateRequest({
                authConfig: {
                  ...request.authConfig,
                  oauth2Config: {
                    ...request.authConfig?.oauth2Config,
                    clientSecret: e.target.value,
                    grantType: request.authConfig?.oauth2Config?.grantType || 'authorization_code',
                  },
                },
              })
            }
            placeholder="Client Secret"
            type="password"
          />
          <Input
            value={request.authConfig?.oauth2Config?.scope || ''}
            onChange={(e) =>
              updateRequest({
                authConfig: {
                  ...request.authConfig,
                  oauth2Config: {
                    ...request.authConfig?.oauth2Config,
                    scope: e.target.value,
                    grantType: request.authConfig?.oauth2Config?.grantType || 'authorization_code',
                  },
                },
              })
            }
            placeholder="Scope"
          />
          <Input
            value={request.authConfig?.oauth2Config?.callbackUrl || ''}
            onChange={(e) =>
              updateRequest({
                authConfig: {
                  ...request.authConfig,
                  oauth2Config: {
                    ...request.authConfig?.oauth2Config,
                    callbackUrl: e.target.value,
                    grantType: request.authConfig?.oauth2Config?.grantType || 'authorization_code',
                  },
                },
              })
            }
            placeholder="Callback URL"
          />
        </div>
      )}

      {request.authType === 'oidc' && (
        <div className="space-y-2">
          <Input
            value={request.authConfig?.oidcConfig?.issuerUrl || ''}
            onChange={(e) =>
              updateRequest({
                authConfig: {
                  ...request.authConfig,
                  oidcConfig: {
                    ...request.authConfig?.oidcConfig,
                    issuerUrl: e.target.value,
                  },
                },
              })
            }
            placeholder="Issuer URL"
          />
          <Input
            value={request.authConfig?.oidcConfig?.clientId || ''}
            onChange={(e) =>
              updateRequest({
                authConfig: {
                  ...request.authConfig,
                  oidcConfig: {
                    ...request.authConfig?.oidcConfig,
                    clientId: e.target.value,
                  },
                },
              })
            }
            placeholder="Client ID"
          />
          <Input
            value={request.authConfig?.oidcConfig?.clientSecret || ''}
            onChange={(e) =>
              updateRequest({
                authConfig: {
                  ...request.authConfig,
                  oidcConfig: {
                    ...request.authConfig?.oidcConfig,
                    clientSecret: e.target.value,
                  },
                },
              })
            }
            placeholder="Client Secret"
            type="password"
          />
          <Input
            value={request.authConfig?.oidcConfig?.scope || ''}
            onChange={(e) =>
              updateRequest({
                authConfig: {
                  ...request.authConfig,
                  oidcConfig: {
                    ...request.authConfig?.oidcConfig,
                    scope: e.target.value,
                  },
                },
              })
            }
            placeholder="Scope"
          />
          <Input
            value={request.authConfig?.oidcConfig?.callbackUrl || ''}
            onChange={(e) =>
              updateRequest({
                authConfig: {
                  ...request.authConfig,
                  oidcConfig: {
                    ...request.authConfig?.oidcConfig,
                    callbackUrl: e.target.value,
                  },
                },
              })
            }
            placeholder="Callback URL"
          />
        </div>
      )}
    </div>
  )
}

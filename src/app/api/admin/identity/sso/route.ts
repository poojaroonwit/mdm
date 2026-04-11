import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SignJWT } from 'jose';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { getResolvedSSOProvider, normalizeSSOProviderName } from '@/lib/sso';
import { getConfiguredSiteUrl } from '@/lib/system-runtime-settings';
import {
  isDomainAllowed,
  mapOAuthProfile,
  resolveAzureGroupIds,
  resolveMappedRoleFromGroups,
} from '@/lib/identity-utils';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-key-for-development'
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = normalizeSSOProviderName(searchParams.get('provider'));
    const redirectUriParam = searchParams.get('redirect_uri');
    const state = searchParams.get('state');

    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
    }

    const oauthProvider = await getResolvedSSOProvider(provider);
    if (!oauthProvider) {
      return NextResponse.json({ error: 'OAuth provider not found or disabled' }, { status: 404 });
    }

    const siteUrl = await getConfiguredSiteUrl(request);

    const oauthUrls = {
      google: {
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        params: new URLSearchParams({
          client_id: oauthProvider.clientId,
          redirect_uri: redirectUriParam || `${siteUrl}/auth/callback/google`,
          response_type: 'code',
          scope: oauthProvider.scopes.length > 0 ? oauthProvider.scopes.join(' ') : 'openid email profile',
          state: state || `google-${Date.now()}`,
          access_type: 'offline',
          prompt: 'consent',
        }),
      },
      github: {
        authUrl: 'https://github.com/login/oauth/authorize',
        params: new URLSearchParams({
          client_id: oauthProvider.clientId,
          redirect_uri: redirectUriParam || `${siteUrl}/auth/callback/github`,
          scope: oauthProvider.scopes.length > 0 ? oauthProvider.scopes.join(' ') : 'user:email',
          state: state || `github-${Date.now()}`,
        }),
      },
      'azure-ad': {
        authUrl:
          oauthProvider.authorizationUrl ||
          `https://login.microsoftonline.com/${oauthProvider.tenantId || 'common'}/oauth2/v2.0/authorize`,
        params: new URLSearchParams({
          client_id: oauthProvider.clientId,
          redirect_uri: redirectUriParam || `${siteUrl}/auth/callback/azure-ad`,
          response_type: 'code',
          scope:
            oauthProvider.scopes.length > 0
              ? oauthProvider.scopes.join(' ')
              : 'openid email profile offline_access User.Read',
          state: state || `azure-ad-${Date.now()}`,
        }),
      },
    };

    const oauthConfig = oauthUrls[provider];
    if (!oauthConfig) {
      return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
    }

    const authUrl = `${oauthConfig.authUrl}?${oauthConfig.params.toString()}`;

    return NextResponse.json({
      success: true,
      authUrl,
      state: oauthConfig.params.get('state'),
      provider,
    });
  } catch (error) {
    console.error('SSO auth URL generation error:', error);
    return NextResponse.json({ error: 'Failed to generate auth URL' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, redirectUri } = body;
    const provider = normalizeSSOProviderName(body.provider);

    if (!provider || !code) {
      return NextResponse.json({ error: 'Provider and authorization code are required' }, { status: 400 });
    }

    const oauthProvider = await getResolvedSSOProvider(provider);
    if (!oauthProvider) {
      return NextResponse.json({ error: 'OAuth provider not found or disabled' }, { status: 404 });
    }

    let tokenResponse;
    let userInfo;
    let azureAccessToken: string | null = null;
    const siteUrl = await getConfiguredSiteUrl(request);

    if (provider === 'google') {
      const googleTokenData = new URLSearchParams({
        client_id: oauthProvider.clientId,
        client_secret: oauthProvider.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri || `${siteUrl}/auth/callback/google`,
      });

      tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: googleTokenData.toString(),
      });

      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok) throw new Error(tokenData.error_description || 'Google token exchange failed');

      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      userInfo = await userInfoResponse.json();
    } else if (provider === 'github') {
      const githubTokenData = new URLSearchParams({
        client_id: oauthProvider.clientId,
        client_secret: oauthProvider.clientSecret,
        code,
        redirect_uri: redirectUri || `${siteUrl}/auth/callback/github`,
      });

      tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: githubTokenData.toString(),
      });

      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok) throw new Error(tokenData.error_description || 'GitHub token exchange failed');

      const userInfoResponse = await fetch('https://api.github.com/user', {
        headers: { Authorization: `token ${tokenData.access_token}` },
      });
      userInfo = await userInfoResponse.json();

      if (!userInfo.email) {
        const emailsResponse = await fetch('https://api.github.com/user/emails', {
          headers: { Authorization: `token ${tokenData.access_token}` },
        });
        const emails = await emailsResponse.json();
        userInfo.email = emails.find((entry: any) => entry.primary)?.email || emails[0]?.email;
      }
    } else if (provider === 'azure-ad') {
      const microsoftTokenData = new URLSearchParams({
        client_id: oauthProvider.clientId,
        client_secret: oauthProvider.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri || `${siteUrl}/auth/callback/azure-ad`,
        scope:
          oauthProvider.scopes.length > 0
            ? oauthProvider.scopes.join(' ')
            : 'openid email profile offline_access User.Read',
      });

      tokenResponse = await fetch(
        oauthProvider.tokenUrl ||
          `https://login.microsoftonline.com/${oauthProvider.tenantId || 'common'}/oauth2/v2.0/token`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: microsoftTokenData.toString(),
        }
      );

      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok) throw new Error(tokenData.error_description || 'Microsoft token exchange failed');
      azureAccessToken = tokenData.access_token || null;

      const userInfoResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      userInfo = await userInfoResponse.json();
      userInfo.email = userInfo.mail || userInfo.userPrincipalName;
    } else {
      return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
    }

    const mappedProfile = mapOAuthProfile(userInfo, provider);
    const resolvedEmail = mappedProfile.email?.toLowerCase()

    if (!resolvedEmail) {
      return NextResponse.json({ error: 'Could not retrieve user email from provider' }, { status: 400 });
    }

    if (!isDomainAllowed(resolvedEmail, oauthProvider.allowedDomains)) {
      return NextResponse.json({ error: 'This email domain is not allowed for this provider' }, { status: 403 });
    }

    if (oauthProvider.requireEmailVerified && mappedProfile.emailVerified === false) {
      return NextResponse.json({ error: 'This provider did not return a verified email address' }, { status: 403 });
    }

    const mappedRole =
      provider === 'azure-ad'
        ? resolveMappedRoleFromGroups(
            await resolveAzureGroupIds(userInfo, azureAccessToken),
            oauthProvider.groupRoleMappings
          )
        : null

    let user = await db.user.findFirst({
      where: { email: resolvedEmail },
    });

    if (!user) {
      if (!oauthProvider.allowSignup) {
        return NextResponse.json({ error: 'User not found and auto-signup is disabled' }, { status: 404 });
      }

      user = await db.user.create({
        data: {
          email: resolvedEmail,
          name: mappedProfile.name || userInfo.login || userInfo.given_name || 'SSO User',
          password: await bcrypt.hash(randomUUID(), 12),
          role: mappedRole || oauthProvider.defaultRole || 'USER',
          isActive: true,
          allowedLoginMethods: [provider],
        },
      });
    } else if (mappedRole && user.role !== mappedRole) {
      user = await db.user.update({
        where: { id: user.id },
        data: { role: mappedRole },
      });
    }

    if (user.allowedLoginMethods.length > 0 && !user.allowedLoginMethods.includes(provider)) {
      return NextResponse.json({ error: 'This user is not allowed to sign in with this provider' }, { status: 403 });
    }

    const token = await new SignJWT({
      sub: user.id,
      email: user.email,
      role: user.role,
      provider,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(JWT_SECRET);

    const sessionId = randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await db.userSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        expiresAt,
        isActive: true,
        lastActivityAt: new Date(),
      },
    });

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      session: {
        id: sessionId,
        expiresAt: expiresAt.toISOString(),
      },
      provider,
    });

    response.cookies.set('appkit_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 3600,
    });

    return response;
  } catch (error: any) {
    console.error('SSO token exchange error:', error);
    return NextResponse.json({ error: error.message || 'Failed to exchange authorization code' }, { status: 500 });
  }
}

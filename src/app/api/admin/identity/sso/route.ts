import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SignJWT } from 'jose';
import { randomUUID } from 'crypto';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-key-for-development'
);

/**
 * GET /api/admin/identity/sso
 * Generate OAuth authorization URL
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');
    const redirectUriParam = searchParams.get('redirect_uri');
    const state = searchParams.get('state');

    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
    }

    const oauthProvider = await db.oAuthProvider.findFirst({
      where: {
        providerName: provider,
        isEnabled: true,
      },
    });

    if (!oauthProvider) {
      return NextResponse.json({ error: 'OAuth provider not found or disabled' }, { status: 404 });
    }

    const scopes = Array.isArray(oauthProvider.scopes) ? (oauthProvider.scopes as string[]) : [];
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const oauthUrls = {
      google: {
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        params: new URLSearchParams({
          client_id: oauthProvider.clientId,
          redirect_uri: redirectUriParam || `${siteUrl}/auth/callback/google`,
          response_type: 'code',
          scope: scopes.length > 0 ? scopes.join(' ') : 'openid email profile',
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
          scope: scopes.length > 0 ? scopes.join(' ') : 'user:email',
          state: state || `github-${Date.now()}`,
        }),
      },
      microsoft: {
        authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        params: new URLSearchParams({
          client_id: oauthProvider.clientId,
          redirect_uri: redirectUriParam || `${siteUrl}/auth/callback/microsoft`,
          response_type: 'code',
          scope: scopes.length > 0 ? scopes.join(' ') : 'openid email profile',
          state: state || `microsoft-${Date.now()}`,
        }),
      },
    };

    const oauthConfig = oauthUrls[provider as keyof typeof oauthUrls];
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

/**
 * POST /api/admin/identity/sso
 * Handle OAuth callback / exchange code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, code, state, redirectUri } = body;

    if (!provider || !code) {
      return NextResponse.json({ error: 'Provider and authorization code are required' }, { status: 400 });
    }

    const oauthProvider = await db.oAuthProvider.findFirst({
      where: {
        providerName: provider,
        isEnabled: true,
      },
    });

    if (!oauthProvider) {
      return NextResponse.json({ error: 'OAuth provider not found or disabled' }, { status: 404 });
    }

    let tokenResponse;
    let userInfo;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    if (provider === 'google') {
      const tokenUrl = 'https://oauth2.googleapis.com/token';
      const googleTokenData = new URLSearchParams({
        client_id: oauthProvider.clientId,
        client_secret: oauthProvider.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri || `${siteUrl}/auth/callback/google`,
      });

      tokenResponse = await fetch(tokenUrl, {
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
      const tokenUrl = 'https://github.com/login/oauth/access_token';
      const githubTokenData = new URLSearchParams({
        client_id: oauthProvider.clientId,
        client_secret: oauthProvider.clientSecret,
        code,
        redirect_uri: redirectUri || `${siteUrl}/auth/callback/github`,
      });

      tokenResponse = await fetch(tokenUrl, {
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
        userInfo.email = emails.find((e: any) => e.primary)?.email || emails[0]?.email;
      }
    } else if (provider === 'microsoft') {
      const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
      const microsoftTokenData = new URLSearchParams({
        client_id: oauthProvider.clientId,
        client_secret: oauthProvider.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri || `${siteUrl}/auth/callback/microsoft`,
        scope: 'openid email profile',
      });

      tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: microsoftTokenData.toString(),
      });

      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok) throw new Error(tokenData.error_description || 'Microsoft token exchange failed');

      const userInfoResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      userInfo = await userInfoResponse.json();
      userInfo.email = userInfo.mail || userInfo.userPrincipalName;
    } else {
      return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
    }

    if (!userInfo?.email) {
      return NextResponse.json({ error: 'Could not retrieve user email from provider' }, { status: 400 });
    }

    let user = await db.user.findFirst({
      where: { email: userInfo.email.toLowerCase() },
    });

    if (!user) {
      if (!oauthProvider.allowSignup) {
        return NextResponse.json({ error: 'User not found and auto-signup is disabled' }, { status: 404 });
      }

      user = await db.user.create({
        data: {
          email: userInfo.email.toLowerCase(),
          name: userInfo.name || userInfo.login || userInfo.given_name || 'SSO User',
          password: randomUUID(), // SSO users don't need a password but schema might require it
          role: oauthProvider.defaultRole || 'USER',
          isActive: true,
        },
      });
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

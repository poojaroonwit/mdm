import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-middleware';
import { z } from 'zod';
import { createAuditLog } from '@/lib/audit';
import { encryptApiKey } from '@/lib/encryption';
import { clearSSOProviderCache, normalizeSSOProviderName, SSO_SECRET_MASK } from '@/lib/sso';

const providerSchema = z.object({
  id: z.string().uuid().optional(),
  providerName: z.string().min(1),
  displayName: z.string().min(1),
  isEnabled: z.boolean().default(true),
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  authorizationUrl: z.string().url().optional().nullable(),
  tokenUrl: z.string().url().optional().nullable(),
  userinfoUrl: z.string().url().optional().nullable(),
  scopes: z.array(z.string()).default([]),
  claimsMapping: z.record(z.string(), z.string()).default({}),
  allowSignup: z.boolean().default(true),
  requireEmailVerified: z.boolean().default(true),
  autoLinkByEmail: z.boolean().default(false),
  iconUrl: z.string().optional().nullable(),
  buttonColor: z.string().optional().nullable(),
  buttonText: z.string().optional().nullable(),
  jwksUrl: z.string().url().optional().nullable(),
  allowedDomains: z.array(z.string()).default([]),
  defaultRole: z.string().optional().nullable(),
  displayOrder: z.number().int().default(0),
  platformConfig: z.any().optional(),
});

/**
 * GET /api/admin/identity/sso-providers
 * List all SSO providers
 */
export async function GET(req: NextRequest) {
  const adminResult = await requireAdmin();
  if (!adminResult.success) return adminResult.response;
  const admin = adminResult.session.user;

  try {
    const providers = await db.oAuthProvider.findMany({
      orderBy: { displayOrder: 'asc' },
    });
    return NextResponse.json(
      providers.map((provider) => ({
        ...provider,
        providerName: normalizeSSOProviderName(provider.providerName) || provider.providerName,
        clientSecret: provider.clientSecret ? SSO_SECRET_MASK : '',
      }))
    );
  } catch (error) {
    console.error('[SSO_PROVIDERS_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/identity/sso-providers
 * Create or update an SSO provider
 */
export async function POST(req: NextRequest) {
  const adminResult = await requireAdmin();
  if (!adminResult.success) return adminResult.response;
  const admin = adminResult.session.user;

  try {
    const body = await req.json();
    const validatedData = providerSchema.parse(body);

    const normalizedProviderName =
      normalizeSSOProviderName(validatedData.providerName) || validatedData.providerName;
    const { id, clientSecret, ...data } = validatedData;
    const providerData = {
      ...data,
      providerName: normalizedProviderName,
    };
    const encryptClientSecret = (secret: string) => {
      const encryptedSecret = encryptApiKey(secret);
      if (!encryptedSecret) {
        throw new Error('Failed to encrypt client secret');
      }
      return encryptedSecret;
    };

    let result;

    if (id) {
      const existing = await db.oAuthProvider.findUnique({
        where: { id },
      });

      if (!existing) {
        return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
      }

      const resolvedSecret =
        clientSecret === SSO_SECRET_MASK
          ? existing.clientSecret
          : encryptClientSecret(clientSecret);

      result = await db.oAuthProvider.update({
        where: { id },
        data: {
          ...providerData,
          clientSecret: resolvedSecret,
        },
      });

      await createAuditLog({
        userId: admin.id,
        action: 'SSO_PROVIDER_UPDATE',
        entityType: 'oAuthProvider',
        entityId: id,
        oldValue: existing,
        newValue: result,
      });
    } else {
      const resolvedSecret = encryptClientSecret(clientSecret);

      result = await db.oAuthProvider.create({
        data: {
          ...providerData,
          clientSecret: resolvedSecret,
        },
      });

      await createAuditLog({
        userId: admin.id,
        action: 'SSO_PROVIDER_CREATE',
        entityType: 'oAuthProvider',
        entityId: result.id,
        newValue: result,
      });
    }

    clearSSOProviderCache();
    return NextResponse.json({
      ...result,
      clientSecret: result.clientSecret ? SSO_SECRET_MASK : '',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: error.issues }, { status: 400 });
    }
    console.error('[SSO_PROVIDERS_POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/identity/sso-providers?id=...
 * Delete an SSO provider
 */
export async function DELETE(req: NextRequest) {
  const adminResult = await requireAdmin();
  if (!adminResult.success) return adminResult.response;
  const admin = adminResult.session.user;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing ID parameter' }, { status: 400 });
    }

    const existing = await db.oAuthProvider.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    await db.oAuthProvider.delete({
      where: { id },
    });

    clearSSOProviderCache();
    await createAuditLog({
      userId: admin.id,
      action: 'SSO_PROVIDER_DELETE',
      entityType: 'oAuthProvider',
      entityId: id,
      oldValue: existing,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[SSO_PROVIDERS_DELETE]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;

    await prisma.user.update({
        where: { id },
        data: { 
            isTwoFactorEnabled: false,
            twoFactorSecret: null,
            twoFactorBackupCodes: []
        }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error resetting 2FA:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

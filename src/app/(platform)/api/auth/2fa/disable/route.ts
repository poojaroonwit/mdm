import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // For extra security, we might require password confirmation here, 
    // but for now we trust the session (which might be 2FA authenticated already).
    
    await prisma.user.update({
        where: { id: session.user.id },
        data: { 
            isTwoFactorEnabled: false,
            twoFactorSecret: null,
            twoFactorBackupCodes: []
        }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disabling 2FA:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

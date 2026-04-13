import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { authenticator } from "otplib";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { code } = await req.json();
    if (!code) {
        return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || !user.twoFactorSecret) {
         return NextResponse.json({ error: "2FA setup not initiated" }, { status: 400 });
    }

    const isValid = authenticator.check(code, user.twoFactorSecret);

    if (!isValid) {
        return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => 
        Math.floor(100000 + Math.random() * 900000).toString()
    );

    await prisma.user.update({
        where: { id: user.id },
        data: { 
            isTwoFactorEnabled: true,
            twoFactorBackupCodes: backupCodes
        }
    });

    return NextResponse.json({ success: true, backupCodes });
  } catch (error) {
    console.error("Error enabling 2FA:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

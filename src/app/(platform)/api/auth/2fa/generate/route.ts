import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { authenticator } from "otplib";
import qrcode from "qrcode";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
         return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isTwoFactorEnabled) {
         return NextResponse.json({ error: "2FA is already enabled" }, { status: 400 });
    }

    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.email, "MDM Platform", secret);
    const qrCodeUrl = await qrcode.toDataURL(otpauth);

    // Store secret temporarily or just return it? 
    // Standard practice: Don't save to DB until confirmed (enable step).
    // Or save it but keep isTwoFactorEnabled = false.
    // I'll save it to DB now so the Enable step can verify against it. 
    // This allows re-requesting QR code if simple refresh.
    
    await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorSecret: secret }
    });

    return NextResponse.json({ secret, qrCodeUrl });
  } catch (error) {
    console.error("Error generating 2FA:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

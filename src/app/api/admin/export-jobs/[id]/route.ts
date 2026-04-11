import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    // Check ownership or admin
    const job = await prisma.exportJob.findUnique({ where: { id } });
    if (!job) {
         return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    await prisma.exportJob.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting export job:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
     const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      try {
        const { id } = await params;
        const job = await prisma.exportJob.findUnique({ 
            where: { id },
            include: { profile: true }
        });
        if (!job) {
             return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }
        return NextResponse.json(job);
      } catch (error) {
           return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
      }
}

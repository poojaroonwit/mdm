import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

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
     const profile = await prisma.exportProfile.findUnique({
      where: { id },
       include: {
        creator: {
            select: {
                id: true,
                name: true,
                avatar: true
            }
        }
      }
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    
    // Check if user has access to space
    if (profile.spaceId) {
        const spaceMember = await prisma.spaceMember.findFirst({
            where: {
                spaceId: profile.spaceId,
                userId: session.user.id
            }
        });
         if (!spaceMember) {
             return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
    }


    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching export profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { name, description, config } = body;

    const existingProfile = await prisma.exportProfile.findUnique({ where: { id } });
    if (!existingProfile) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (existingProfile.spaceId) {
        const spaceMember = await prisma.spaceMember.findFirst({
            where: {
                spaceId: existingProfile.spaceId,
                userId: session.user.id
            }
        });
         if (!spaceMember) {
             return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
    }

    const profile = await prisma.exportProfile.update({
      where: { id },
      data: {
        name,
        description,
        config: config !== undefined ? config : undefined,
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error updating export profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

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
    const existingProfile = await prisma.exportProfile.findUnique({ where: { id } });
    if (!existingProfile) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

     if (existingProfile.spaceId) {
        const spaceMember = await prisma.spaceMember.findFirst({
            where: {
                spaceId: existingProfile.spaceId,
                userId: session.user.id
            }
        });
         if (!spaceMember) {
             return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
    }

    // Soft delete
    await prisma.exportProfile.update({
        where: { id },
        data: { deletedAt: new Date() }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting export profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

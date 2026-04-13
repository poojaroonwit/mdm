import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const spaceId = searchParams.get("spaceId");

    if (!spaceId) {
       return NextResponse.json({ error: "Space ID is required" }, { status: 400 });
    }
    
    // Check if user has access to space
    const spaceMember = await prisma.spaceMember.findFirst({
        where: {
            spaceId: spaceId,
            userId: session.user.id
        }
    });

    if (!spaceMember) {
         return NextResponse.json({ error: "Forbidden: No access to space" }, { status: 403 });
    }

    const profiles = await prisma.exportProfile.findMany({
      where: {
        spaceId: spaceId,
        deletedAt: null,
      },
      orderBy: {
        updatedAt: 'desc',
      },
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

    return NextResponse.json(profiles);
  } catch (error) {
    console.error("Error fetching export profiles:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, description, type, config, spaceId } = body;

     if (!name || !type || !spaceId) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
     }

      // Check if user has access to space
    const spaceMember = await prisma.spaceMember.findFirst({
        where: {
            spaceId: spaceId,
            userId: session.user.id
        }
    });

    if (!spaceMember) {
         return NextResponse.json({ error: "Forbidden: No access to space" }, { status: 403 });
    }

    const profile = await prisma.exportProfile.create({
      data: {
        name,
        description,
        type,
        config: config || {},
        createdBy: session.user.id,
        spaceId: spaceId,
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error creating export profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

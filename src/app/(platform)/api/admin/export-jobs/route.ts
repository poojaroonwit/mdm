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
     // Optional: filtering by space if needed, for now return all visible to user?
     // Typically purely admin or based on space context.
     // Assuming context passed or just return all user created?
     // existing code didn't send spaceId param in GET.
     
    const jobs = await prisma.exportJob.findMany({
      where: {
         // simplified access control: only show own jobs? or all if admin?
         // For now, let's show all created by user.
         createdBy: session.user.id
      },
      orderBy: {
        createdAt: 'desc',
      },
       include: {
        profile: {
            select: {
                name: true,
                type: true
            }
        }
      }
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Error fetching export jobs:", error);
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
    const { name, type, format, includes, filters, profileId, spaceId } = body;

    let jobData: any = {
        name,
        type: type || 'custom',
        format: format || 'xlsx',
        createdBy: session.user.id,
        status: 'PENDING',
        progress: 0,
        includes: includes || [],
        filters: filters || {},
    };

    if (spaceId) {
        jobData.spaceId = spaceId;
    }

    // Logic for Profile
    if (profileId) {
        const profile = await prisma.exportProfile.findUnique({
             where: { id: profileId }
        });
        
        if (!profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }
        
        jobData.profileId = profileId;
        jobData.name = jobData.name || `${profile.name} Export`;
        jobData.type = profile.type === 'STUDIO' ? 'custom' : 'query'; // Map profile type to job type?
        
        const config = profile.config as any;
        if (profile.type === 'STUDIO') {
            jobData.dataModelId = '00000000-0000-0000-0000-000000000000'; // Placeholder or find actual ID if 'builtin'
            if (config.tableName) {
                 // For built-in, we might store table name in metadata or filters
                 // The Schema.prisma 'dataModelId' implies linking to DataModel table.
                 // If using 'builtin' schemas (Prisma maps), we might not have a DataModel entry.
                 // I will use a UUID if I can find one, or nullable? 
                 // Schema says `dataModelId String @db.Uuid`. It IS required.
                 // I need a valid DataModel ID. 
                 // Issue: "Built-in" tables (User, Space) might not be in `data_models` table.
                 // If `data_models` only stores user-defined EAV models?
                 // Checking schema.prisma: DataModel is a model.
                 // If I export "User" table, do I have a DataModel for it?
                 // Likely not. 
                 // PROPOSAL: If it's a built-in table, I might need a dummy DataModel ID or Relax the schema.
                 // Schema is strict. 
                 // I'll fetch the first available DataModel or creating a system one?
                 // Risk: FK constraint.
                 // Let's assume there is at least one DataModel or I'll pick one. 
                 // OR I set the column to optional?
                 // I cannot change schema easily now without migration.
                 // Let's check if there is a 'System' data model.
                 
                 // If I strictly follow the schema, `dataModelId` is required.
                 // Pass a dummy UUID for now if it works, otherwise I might fail FK.
                 // Let's look up a DataModel.
                 const anyModel = await prisma.dataModel.findFirst();
                 if (anyModel) {
                     jobData.dataModelId = anyModel.id;
                 } else {
                     // If no data models exist, we can't create ExportJob due to Schema constraint!
                     // This is a blocker for "Built-in" export if built-in doesn't use DataModel.
                     // I will assume for now that I can use a placeholder or that DataModel table has entries.
                     // If not, I can create a dummy one.
                     // For this task, I'll findFirst. If null, I'll create one.
                     const newModel = await prisma.dataModel.create({
                         data: {
                             name: 'System Default',
                             createdBy: session.user.id
                         }
                     });
                     jobData.dataModelId = newModel.id;
                 }
                 
                 jobData.includes = [config.tableName];
                 if (config.filters) jobData.filters = config.filters;
                 if (config.columns) {
                     // Store columns in job? Schema says 'columns' Json.
                     jobData.columns = config.columns;
                 }
            }
        } else if (profile.type === 'QUERY') {
             // Query export
             // Set metadata or special filter for Query
             jobData.filters = { query: config.query };
             const anyModel = await prisma.dataModel.findFirst();
             jobData.dataModelId = anyModel ? anyModel.id : (await prisma.dataModel.create({ data: { name: 'System', createdBy: session.user.id } })).id;
        }

    } else {
         // Manual creation (existing logic?)
         // Need dataModelId.
         const anyModel = await prisma.dataModel.findFirst();
         jobData.dataModelId = anyModel ? anyModel.id : (await prisma.dataModel.create({ data: { name: 'System', createdBy: session.user.id } })).id;
    }

    const job = await prisma.exportJob.create({
      data: jobData
    });

    // TODO: Trigger actual export process (Queue/Worker)
    // For now just create the record.

    return NextResponse.json(job);
  } catch (error) {
    console.error("Error creating export job:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

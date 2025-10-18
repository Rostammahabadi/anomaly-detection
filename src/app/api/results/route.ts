import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getAuthUser } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's logs with analysis results
    const logs = await prisma.log.findMany({
      where: {
        user_id: user.userId,
      },
      orderBy: {
        upload_date: "desc",
      },
      select: {
        id: true,
        filename: true,
        upload_date: true,
        parsed_data: true,
        analysis_result: true,
      },
    });

    return NextResponse.json({
      logs,
    });
  } catch (error) {
    console.error("Results fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

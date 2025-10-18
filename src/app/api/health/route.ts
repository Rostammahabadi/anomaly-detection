import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const timestamp = new Date().toISOString();
    const environment = process.env.NODE_ENV || 'unknown';
    const hasJwtSecret = !!process.env.JWT_SECRET;
    const hasOpenAiKey = !!process.env.OPENAI_API_KEY;

    return NextResponse.json({
      status: "healthy",
      timestamp,
      environment,
      version: "1.0.0",
      config: {
        jwtSecretConfigured: hasJwtSecret,
        openAiKeyConfigured: hasOpenAiKey,
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

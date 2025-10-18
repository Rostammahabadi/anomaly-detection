import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getAuthUser } from "@/lib/auth";
import { parseApacheLogs, analyzeLogs } from "@/lib/logParser";
import OpenAI from "openai";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.name.endsWith(".txt") && !file.name.endsWith(".log")) {
      return NextResponse.json(
        { error: "Invalid file type. Only .txt and .log files are allowed" },
        { status: 400 }
      );
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 }
      );
    }

    // Read file content
    const content = await file.text();

    // Parse logs
    const parseResult = parseApacheLogs(content);

    if (parseResult.entries.length === 0) {
      return NextResponse.json(
        { error: "No valid Apache access log entries found in the file" },
        { status: 400 }
      );
    }

    // Perform basic analysis
    const analysis = analyzeLogs(parseResult);

    // AI Integration: Send parsed logs to OpenAI for threat detection and summarization
    let aiInsights = "";
    try {
      if (process.env.OPENAI_API_KEY) {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        const prompt = `Analyze these Apache access logs for key SOC analyst learnings, including potential threats, unusual patterns, and a summarized timeline of events. Focus on security implications and provide actionable insights.

Log entries (first 50 for brevity):
${parseResult.entries
  .slice(0, 50)
  .map(
    (entry) =>
      `${entry.timestamp.toISOString()} ${entry.ip} ${entry.method} ${
        entry.url
      } ${entry.status}`
  )
  .join("\n")}

Basic stats: ${analysis.totalEntries} total entries, ${
          analysis.uniqueIPs
        } unique IPs, ${analysis.anomalies.length} detected anomalies.

Please provide:
1. Summary of traffic patterns
2. Potential security concerns
3. Anomalies or suspicious activities
4. Recommendations for SOC analysts`;

        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1000,
          temperature: 0.3,
        });

        aiInsights =
          completion.choices[0]?.message?.content || "AI analysis unavailable";
      }
    } catch (error) {
      console.error("OpenAI analysis error:", error);
      aiInsights = "AI analysis failed - basic analysis only";
    }

    // Enhanced analysis with AI insights
    const enhancedAnalysis = {
      ...analysis,
      aiInsights,
    };

    // Store analysis in database
    const logEntry = await prisma.log.create({
      data: {
        user_id: user.userId,
        filename: file.name,
        parsed_data: JSON.parse(JSON.stringify(parseResult.entries)),
        analysis_result: JSON.parse(JSON.stringify(enhancedAnalysis)),
      },
    });

    return NextResponse.json({
      message: "File uploaded and analyzed successfully",
      logId: logEntry.id,
      analysis: enhancedAnalysis,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

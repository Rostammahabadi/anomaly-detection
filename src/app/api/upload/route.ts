import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getAuthUser } from "@/lib/auth";
import { validateFileUpload } from "@/lib/middleware";
import { withRateLimit, uploadRateLimiter } from "@/lib/rateLimit";
import { parseApacheLogs, analyzeLogs } from "@/lib/logParser";
import OpenAI from "openai";

const prisma = new PrismaClient();

async function uploadHandler(request: NextRequest) {
  try {
    // Authenticate user
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    // Validate file upload
    const validation = validateFileUpload(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
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

    /**
     * AI Integration for Threat Detection and Log Analysis
     *
     * This section uses OpenAI's GPT model to perform advanced security analysis
     * of the parsed Apache access logs. The AI provides:
     * - Threat detection and risk assessment
     * - Pattern analysis and anomaly identification
     * - SOC analyst insights and recommendations
     * - Timeline summarization and security implications
     *
     * The AI analysis complements the rule-based anomaly detection by providing
     * contextual understanding and identifying sophisticated attack patterns
     * that might not be caught by simple threshold-based rules.
     */
    let aiInsights = "";
    try {
      if (process.env.OPENAI_API_KEY) {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        // Prepare comprehensive log data for AI analysis
        const logSample = parseResult.entries
          .slice(0, 100) // Increased sample size for better analysis
          .map(
            (entry) =>
              `${entry.timestamp.toISOString()} | ${entry.ip} | ${
                entry.method
              } | ${entry.url} | ${entry.status} | ${entry.size}B`
          )
          .join("\n");

        // Enhanced AI prompt for comprehensive security analysis
        const prompt = `You are a cybersecurity expert analyzing Apache access logs for a Security Operations Center (SOC). Provide a comprehensive security analysis of these web server logs.

LOG DATA SAMPLE (first 100 entries):
${logSample}

BASIC STATISTICS:
- Total Requests: ${analysis.totalEntries}
- Unique IP Addresses: ${analysis.uniqueIPs}
- Time Range: ${analysis.summary.timeRange.start.toISOString()} to ${analysis.summary.timeRange.end.toISOString()}
- Duration: ${Math.round(analysis.summary.timeRange.duration)} minutes
- Status Codes: ${Object.entries(analysis.statusDistribution)
          .map(([code, count]) => `${code}:${count}`)
          .join(", ")}
- HTTP Methods: ${Object.entries(analysis.methodDistribution)
          .map(([method, count]) => `${method}:${count}`)
          .join(", ")}

DETECTED ANOMALIES (Rule-based):
${analysis.anomalies
  .map(
    (a) =>
      `- ${a.description} (${a.confidence}% confidence, severity: ${a.severity})`
  )
  .join("\n")}

TOP TRAFFIC SOURCES:
${analysis.summary.topIPs
  .slice(0, 5)
  .map((ip) => `- ${ip.ip}: ${ip.count} requests (${ip.percentage}%)`)
  .join("\n")}

MOST REQUESTED ENDPOINTS:
${analysis.summary.topEndpoints
  .slice(0, 5)
  .map((ep) => `- ${ep.url}: ${ep.count} requests (${ep.percentage}%)`)
  .join("\n")}

SECURITY ANALYSIS REQUEST:
As a SOC analyst, provide a comprehensive analysis including:

1. **THREAT ASSESSMENT**: Identify potential security threats, attack patterns, or suspicious activities beyond the rule-based detections
2. **ANOMALY ANALYSIS**: Evaluate the detected anomalies, their severity levels, and identify any additional suspicious patterns not caught by rules
3. **TRAFFIC ANALYSIS**: Describe normal vs. abnormal traffic patterns and identify potential attack campaigns or coordinated intrusions
4. **TIMELINE SUMMARY**: Summarize activity over time, identify peak periods, and detect temporal attack patterns or campaign phases
5. **ATTACK PATTERN RECOGNITION**: Look for coordinated attacks, scanning behavior, multi-stage intrusions, or APT indicators
6. **RECOMMENDATIONS**: Provide actionable security recommendations with priority levels and implementation timelines
7. **RISK LEVEL**: Assign an overall risk level (Low/Medium/High/Critical) with detailed justification

Specifically analyze for and provide evidence of:
- **Brute force attacks**: Failed login patterns, rapid authentication attempts, password spraying
- **Injection attacks**: SQL injection, command injection, template injection, or other input sanitization bypasses
- **Directory traversal**: Path manipulation attempts, file inclusion exploits, LFI/RFI vulnerabilities
- **Reconnaissance**: Port scanning, version detection, information gathering, vulnerability probing
- **DDoS patterns**: Traffic flooding, resource exhaustion, amplification attacks
- **Data exfiltration**: Unusual outbound traffic, large file downloads, encoded data transfers
- **Malware indicators**: Suspicious file access, command execution patterns, persistence mechanisms
- **Zero-day exploits**: Unusual error patterns, unexpected system behavior, crash-inducing requests

Provide specific evidence for each finding with IP addresses, timestamps, request patterns, and confidence levels. Flag any IPs, user agents, or URL patterns requiring immediate investigation, blocking, or alerting.`;

        console.log("🤖 Making OpenAI API call with model: gpt-5-nano");
        console.log("📊 Sending analysis data:", {
          totalEntries: analysis.totalEntries,
          uniqueIPs: analysis.uniqueIPs,
          anomaliesCount: analysis.anomalies.length,
        });

        const completion = await openai.chat.completions.create({
          model: "gpt-4o", // Try gpt-4o, the most recent available model
          messages: [
            {
              role: "system",
              content:
                "You are an expert cybersecurity analyst specializing in web application security and log analysis. Provide detailed, actionable insights for SOC teams.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_completion_tokens: 1500, // Increased for more comprehensive analysis
        });
        console.log("content:", completion.choices?.[0]?.message);
        console.log("🔍 OpenAI response received:", {
          choicesCount: completion.choices?.length,
          firstChoice: completion.choices?.[0],
          message: completion.choices?.[0]?.message,
          content:
            completion.choices?.[0]?.message?.content?.substring(0, 200) +
            "...",
        });

        aiInsights =
          completion.choices[0]?.message?.content || "AI analysis unavailable";

        // Add metadata about the AI analysis
        aiInsights = `🤖 AI-Powered Security Analysis (Generated by OpenAI GPT-4o)\n\n${aiInsights}\n\n---\n*Analysis performed on ${new Date().toISOString()} using ${
          parseResult.entries.length
        } log entries*`;
      } else {
        aiInsights =
          "⚠️ OpenAI API key not configured - AI analysis disabled. Only rule-based anomaly detection available.";
      }
    } catch (error) {
      console.error("OpenAI analysis error:", error);
      aiInsights = `❌ AI analysis failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }. Rule-based analysis still available.`;

      // Log additional context for debugging
      console.log("AI Analysis Context:", {
        totalEntries: analysis.totalEntries,
        hasApiKey: !!process.env.OPENAI_API_KEY,
        error: error instanceof Error ? error.message : String(error),
      });
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

// Apply rate limiting to upload attempts (by user ID)
export const POST = withRateLimit(uploadRateLimiter, (request) => {
  const user = getAuthUser(request);
  return user?.userId?.toString() || "unknown";
})(uploadHandler);

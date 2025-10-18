// Test script to demonstrate AI integration for log analysis
const fs = require("fs");
const path = require("path");

// Simulate the AI integration (without actual OpenAI calls for testing)
const APACHE_LOG_REGEX =
  /^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+) (\S+) \S+" (\d+) (\d+|-)/;

function parseApacheLogLine(line) {
  const match = line.match(APACHE_LOG_REGEX);
  if (!match) return null;

  const [, ip, timestampStr, method, url, statusStr, sizeStr] = match;

  const timestamp = new Date(
    timestampStr.replace(/^\[|\]$/g, "").replace(/:/, " ")
  );

  return {
    ip,
    timestamp,
    method,
    url,
    status: parseInt(statusStr, 10),
    size: sizeStr === "-" ? 0 : parseInt(sizeStr, 10),
    raw: line,
  };
}

function parseApacheLogs(content) {
  const lines = content.split("\n").filter((line) => line.trim());
  const entries = [];
  let failedLines = 0;

  for (const line of lines) {
    const parsed = parseApacheLogLine(line);
    if (parsed) {
      entries.push(parsed);
    } else {
      failedLines++;
    }
  }

  return {
    entries,
    totalLines: lines.length,
    parsedLines: entries.length,
    failedLines,
  };
}

function analyzeLogs(parseResult) {
  const { entries, parsedLines, failedLines } = parseResult;
  const totalEntries = entries.length;
  const uniqueIPs = new Set(entries.map((e) => e.ip)).size;

  const statusDistribution = {};
  entries.forEach((entry) => {
    statusDistribution[entry.status] =
      (statusDistribution[entry.status] || 0) + 1;
  });

  const methodDistribution = {};
  entries.forEach((entry) => {
    methodDistribution[entry.method] =
      (methodDistribution[entry.method] || 0) + 1;
  });

  const hourlyCounts = {};
  entries.forEach((entry) => {
    const hour = entry.timestamp.toISOString().slice(0, 13);
    hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
  });

  const timeline = Object.entries(hourlyCounts)
    .map(([hour, count]) => ({
      hour: new Date(hour + ":00:00.000Z").toLocaleString(),
      count,
      timestamp: hour + ":00:00.000Z",
    }))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  const anomalies = [];

  const ipCounts = {};
  entries.forEach((entry) => {
    ipCounts[entry.ip] = (ipCounts[entry.ip] || 0) + 1;
  });

  const threshold = Math.max(10, totalEntries * 0.1);
  Object.entries(ipCounts).forEach(([ip, count]) => {
    if (count > threshold) {
      const confidence = Math.min(100, (count / threshold) * 50);
      anomalies.push({
        type: "high_volume_ip",
        description: `High request volume from IP ${ip}: ${count} requests`,
        confidence: Math.round(confidence),
      });
    }
  });

  const errorEntries = entries.filter((e) => e.status >= 400);
  if (errorEntries.length > totalEntries * 0.05) {
    const confidence = Math.min(
      100,
      (errorEntries.length / totalEntries) * 1000
    );
    anomalies.push({
      type: "high_error_rate",
      description: `High error rate: ${errorEntries.length} errors out of ${totalEntries} requests`,
      confidence: Math.round(confidence),
    });
  }

  const timestamps = entries.map((e) => e.timestamp.getTime()).sort();
  const timeRange = {
    start: new Date(Math.min(...timestamps)),
    end: new Date(Math.max(...timestamps)),
    duration:
      timestamps.length > 1
        ? (Math.max(...timestamps) - Math.min(...timestamps)) / (1000 * 60)
        : 0,
  };

  const summaryIPCounts = {};
  entries.forEach((entry) => {
    summaryIPCounts[entry.ip] = (summaryIPCounts[entry.ip] || 0) + 1;
  });
  const topIPs = Object.entries(summaryIPCounts)
    .map(([ip, count]) => ({
      ip,
      count,
      percentage: Math.round((count / totalEntries) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const urlCounts = {};
  entries.forEach((entry) => {
    urlCounts[entry.url] = (urlCounts[entry.url] || 0) + 1;
  });
  const topEndpoints = Object.entries(urlCounts)
    .map(([url, count]) => ({
      url,
      count,
      percentage: Math.round((count / totalEntries) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalEntries,
    parsedEntries: parsedLines,
    failedEntries: failedLines,
    uniqueIPs,
    statusDistribution,
    methodDistribution,
    timeline,
    anomalies,
    summary: {
      timeRange,
      topIPs,
      topEndpoints,
    },
  };
}

// Simulate AI analysis response
function simulateAIAnalysis(logAnalysis, entries) {
  const highVolumeIP = logAnalysis.summary.topIPs[0];
  const errorRate =
    logAnalysis.anomalies.find((a) => a.type === "high_error_rate")
      ?.confidence || 0;
  const hasErrors = Object.keys(logAnalysis.statusDistribution).some(
    (code) => parseInt(code) >= 400
  );

  let riskLevel = "Low";
  let aiAnalysis = "## 🤖 AI-Powered Security Analysis\n\n";

  if (highVolumeIP && highVolumeIP.count > 10) {
    riskLevel = highVolumeIP.count > 15 ? "High" : "Medium";
    aiAnalysis += `### 🚨 THREAT ASSESSMENT: ${riskLevel} Risk Level\n\n`;
    aiAnalysis += `**High-volume traffic detected** from IP ${highVolumeIP.ip} with ${highVolumeIP.count} requests (${highVolumeIP.percentage}% of total traffic).\n\n`;
    aiAnalysis += `**Potential threats:**\n`;
    aiAnalysis += `- Brute force attack on login endpoints\n`;
    aiAnalysis += `- Web scraping or content theft\n`;
    aiAnalysis += `- DDoS reconnaissance\n\n`;
  }

  if (hasErrors) {
    aiAnalysis += `### ⚠️ Error Analysis\n\n`;
    aiAnalysis += `**HTTP error codes detected:** ${Object.entries(
      logAnalysis.statusDistribution
    )
      .filter(([code]) => parseInt(code) >= 400)
      .map(([code, count]) => `${code} (${count} requests)`)
      .join(", ")}\n\n`;
    if (errorRate > 50) {
      aiAnalysis += `**High error rate** (${errorRate}% confidence) suggests potential:\n`;
      aiAnalysis += `- Malformed requests or attack attempts\n`;
      aiAnalysis += `- Server misconfigurations\n`;
      aiAnalysis += `- Resource exhaustion attacks\n\n`;
    }
  }

  aiAnalysis += `### 📊 Traffic Pattern Analysis\n\n`;
  aiAnalysis += `- **Total requests:** ${logAnalysis.totalEntries}\n`;
  aiAnalysis += `- **Unique IPs:** ${logAnalysis.uniqueIPs}\n`;
  aiAnalysis += `- **Time span:** ${Math.round(
    logAnalysis.summary.timeRange.duration
  )} minutes\n`;
  aiAnalysis += `- **Peak activity:** ${
    logAnalysis.timeline[0]?.hour || "N/A"
  }\n\n`;

  aiAnalysis += `### 🎯 Top Traffic Sources\n`;
  logAnalysis.summary.topIPs.forEach((ip, i) => {
    aiAnalysis += `${i + 1}. ${ip.ip}: ${ip.count} requests (${
      ip.percentage
    }%)\n`;
  });

  aiAnalysis += `\n### 🛡️ Recommendations\n\n`;
  if (riskLevel === "High") {
    aiAnalysis += `1. **IMMEDIATE ACTION REQUIRED:** Block or rate-limit IP ${highVolumeIP.ip}\n`;
    aiAnalysis += `2. Review firewall logs for this IP address\n`;
    aiAnalysis += `3. Consider implementing CAPTCHA for login endpoints\n`;
    aiAnalysis += `4. Monitor for similar patterns from other IPs\n`;
  } else if (riskLevel === "Medium") {
    aiAnalysis += `1. Monitor IP ${highVolumeIP.ip} for unusual patterns\n`;
    aiAnalysis += `2. Implement rate limiting if traffic continues\n`;
    aiAnalysis += `3. Review user agent strings for automation indicators\n`;
  } else {
    aiAnalysis += `1. Traffic patterns appear normal\n`;
    aiAnalysis += `2. Continue standard monitoring\n`;
    aiAnalysis += `3. Review periodically for emerging threats\n`;
  }

  aiAnalysis += `\n### 📈 Timeline Summary\n`;
  aiAnalysis += `Activity concentrated in short time window, suggesting either:\n`;
  aiAnalysis += `- Legitimate traffic spike\n`;
  aiAnalysis += `- Coordinated attack attempt\n`;
  aiAnalysis += `- Automated scanning activity\n\n`;

  aiAnalysis += `---\n*Analysis performed on ${new Date().toISOString()} using ${
    entries.length
  } log entries*`;

  return aiAnalysis;
}

// Test with suspicious activity log
console.log("🚀 Testing AI Integration for Log Analysis\n");

const suspiciousContent = fs.readFileSync(
  path.join(__dirname, "examples", "suspicious_activity.log"),
  "utf8"
);

console.log("📄 Analyzing suspicious activity log with AI integration...");

const parseResult = parseApacheLogs(suspiciousContent);
const analysis = analyzeLogs(parseResult);

// Simulate AI analysis
const aiInsights = simulateAIAnalysis(analysis, parseResult.entries);

console.log(
  `\n✅ Parsed ${parseResult.parsedLines} out of ${parseResult.totalLines} lines`
);
console.log(`📊 Found ${analysis.anomalies.length} rule-based anomalies`);

console.log("\n🤖 AI Analysis Results:");
console.log("=".repeat(50));
console.log(aiInsights);
console.log("=".repeat(50));

console.log("\n📋 Rule-based Anomalies (for comparison):");
analysis.anomalies.forEach((anomaly, index) => {
  console.log(
    `${index + 1}. ${anomaly.description} (${anomaly.confidence}% confidence)`
  );
});

console.log("\n✨ AI integration test completed successfully!");
console.log(
  "\n💡 Note: In production, this would use actual OpenAI API calls for real AI analysis."
);

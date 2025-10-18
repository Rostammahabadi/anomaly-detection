// Test script for enhanced log parsing with summary statistics
const fs = require("fs");
const path = require("path");

// Import the parsing functions (simplified version for testing)
const APACHE_LOG_REGEX =
  /^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+) (\S+) \S+" (\d+) (\d+|-)/;

function parseApacheLogLine(line) {
  const match = line.match(APACHE_LOG_REGEX);
  if (!match) return null;

  const [, ip, timestampStr, method, url, statusStr, sizeStr] = match;

  // Parse timestamp - Apache format: [10/Oct/2025:13:55:36 -0700]
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

  // Status distribution
  const statusDistribution = {};
  entries.forEach((entry) => {
    statusDistribution[entry.status] =
      (statusDistribution[entry.status] || 0) + 1;
  });

  // Method distribution
  const methodDistribution = {};
  entries.forEach((entry) => {
    methodDistribution[entry.method] =
      (methodDistribution[entry.method] || 0) + 1;
  });

  // Timeline by hour (more readable format)
  const hourlyCounts = {};
  entries.forEach((entry) => {
    const hour = entry.timestamp.toISOString().slice(0, 13); // YYYY-MM-DDTHH
    hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
  });

  const timeline = Object.entries(hourlyCounts)
    .map(([hour, count]) => ({
      hour: new Date(hour + ":00:00.000Z").toLocaleString(),
      count,
      timestamp: hour + ":00:00.000Z",
    }))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  // Basic anomaly detection
  const anomalies = [];

  // High request volume from single IP
  const ipCounts = {};
  entries.forEach((entry) => {
    ipCounts[entry.ip] = (ipCounts[entry.ip] || 0) + 1;
  });

  const threshold = Math.max(10, totalEntries * 0.1); // At least 10 requests or 10% of total
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

  // 4xx/5xx status codes
  const errorEntries = entries.filter((e) => e.status >= 400);
  if (errorEntries.length > totalEntries * 0.05) {
    // More than 5% errors
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

  // Generate summary statistics
  const timestamps = entries.map((e) => e.timestamp.getTime()).sort();
  const timeRange = {
    start: new Date(Math.min(...timestamps)),
    end: new Date(Math.max(...timestamps)),
    duration:
      timestamps.length > 1
        ? (Math.max(...timestamps) - Math.min(...timestamps)) / (1000 * 60)
        : 0,
  };

  // Top IPs by request count
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

  // Top endpoints by request count
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

// Test with suspicious activity log
console.log("🚀 Testing Enhanced Log Parser with Summary Statistics\n");

// Read suspicious activity file
const suspiciousContent = fs.readFileSync(
  path.join(__dirname, "examples", "suspicious_activity.log"),
  "utf8"
);
console.log("📄 Analyzing suspicious activity log...");

// Parse and analyze
const parseResult = parseApacheLogs(suspiciousContent);
const analysis = analyzeLogs(parseResult);

console.log(
  `\n✅ Parsed ${parseResult.parsedLines} out of ${parseResult.totalLines} lines`
);
console.log(`📊 Found ${analysis.anomalies.length} anomalies\n`);

// Enhanced Analysis Summary
console.log("📈 Enhanced Analysis Summary:");
console.log("- Total Entries:", analysis.totalEntries);
console.log("- Parsed Entries:", analysis.parsedEntries);
console.log("- Failed Entries:", analysis.failedEntries);
console.log("- Unique IPs:", analysis.uniqueIPs);
console.log("- Status Distribution:", analysis.statusDistribution);
console.log("- Method Distribution:", analysis.methodDistribution);

// Time Range Summary
console.log("\n⏰ Time Range Analysis:");
console.log("- Start Time:", analysis.summary.timeRange.start.toISOString());
console.log("- End Time:", analysis.summary.timeRange.end.toISOString());
console.log(
  "- Duration:",
  Math.round(analysis.summary.timeRange.duration),
  "minutes"
);

// Top IPs
console.log("\n🏆 Top IPs by Request Volume:");
analysis.summary.topIPs.forEach((ip, index) => {
  console.log(
    `${index + 1}. ${ip.ip}: ${ip.count} requests (${ip.percentage}%)`
  );
});

// Top Endpoints
console.log("\n🎯 Top Endpoints by Request Volume:");
analysis.summary.topEndpoints.forEach((endpoint, index) => {
  console.log(
    `${index + 1}. ${endpoint.url}: ${endpoint.count} requests (${
      endpoint.percentage
    }%)`
  );
});

// Detected anomalies
if (analysis.anomalies.length > 0) {
  console.log("\n🚨 Detected Anomalies:");
  analysis.anomalies.forEach((anomaly, index) => {
    console.log(
      `${index + 1}. ${anomaly.description} (${anomaly.confidence}% confidence)`
    );
  });
}

// Timeline summary
console.log("\n📅 Request Timeline (by hour):");
analysis.timeline.forEach((entry) => {
  console.log(`- ${entry.hour}: ${entry.count} requests`);
});

console.log("\n✨ Enhanced log parsing test completed successfully!");

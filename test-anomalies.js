// Test script for anomaly detection in log parsing
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

  for (const line of lines) {
    const parsed = parseApacheLogLine(line);
    if (parsed) {
      entries.push(parsed);
    }
  }

  return entries;
}

function analyzeLogs(entries) {
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

  // Timeline by hour
  const hourlyCounts = {};
  entries.forEach((entry) => {
    const hour = entry.timestamp.toISOString().slice(0, 13); // YYYY-MM-DDTHH
    hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
  });

  const timeline = Object.entries(hourlyCounts)
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour.localeCompare(b.hour));

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

  return {
    totalEntries,
    uniqueIPs,
    statusDistribution,
    methodDistribution,
    timeline,
    anomalies,
  };
}

// Test with suspicious activity log
console.log("🚨 Testing Anomaly Detection\n");

// Read suspicious activity file
const suspiciousContent = fs.readFileSync(
  path.join(__dirname, "examples", "suspicious_activity.log"),
  "utf8"
);
console.log("📄 Suspicious activity log loaded");

// Parse and analyze
const parsedEntries = parseApacheLogs(suspiciousContent);
const analysis = analyzeLogs(parsedEntries);

console.log(`\n✅ Parsed ${parsedEntries.length} log entries`);
console.log(`📊 Found ${analysis.anomalies.length} anomalies\n`);

// Show analysis results
console.log("📈 Analysis Summary:");
console.log("- Total Entries:", analysis.totalEntries);
console.log("- Unique IPs:", analysis.uniqueIPs);
console.log("- Status Distribution:", analysis.statusDistribution);
console.log("- Method Distribution:", analysis.methodDistribution);

// Show detected anomalies
if (analysis.anomalies.length > 0) {
  console.log("\n🚨 Detected Anomalies:");
  analysis.anomalies.forEach((anomaly, index) => {
    console.log(
      `${index + 1}. ${anomaly.description} (${anomaly.confidence}% confidence)`
    );
  });
} else {
  console.log("\n✅ No anomalies detected");
}

// Show timeline summary
console.log("\n⏰ Timeline Summary:");
analysis.timeline.forEach((entry) => {
  console.log(`- ${entry.hour}: ${entry.count} requests`);
});

console.log("\n🎯 Anomaly detection test completed!");

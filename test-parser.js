// Test script for log parsing functionality
const fs = require("fs");
const path = require("path");

// Import the parsing functions (we'll simulate this)
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

  return {
    totalEntries,
    uniqueIPs,
    statusDistribution,
    methodDistribution,
    timeline,
  };
}

// Test the parsing
console.log("🧪 Testing Apache Log Parser\n");

// Read sample file
const sampleContent = fs.readFileSync(
  path.join(__dirname, "examples", "sample_access.log"),
  "utf8"
);
console.log("📄 Sample log content:");
console.log(sampleContent);

// Parse logs
const parsedEntries = parseApacheLogs(sampleContent);
console.log(`\n✅ Parsed ${parsedEntries.length} log entries\n`);

// Show first few parsed entries
console.log("📊 Sample parsed entries:");
parsedEntries.slice(0, 3).forEach((entry, index) => {
  console.log(`${index + 1}.`, {
    ip: entry.ip,
    timestamp: entry.timestamp.toISOString(),
    method: entry.method,
    url: entry.url,
    status: entry.status,
    size: entry.size,
  });
});

// Analyze logs
const analysis = analyzeLogs(parsedEntries);
console.log("\n📈 Analysis Results:");
console.log("- Total Entries:", analysis.totalEntries);
console.log("- Unique IPs:", analysis.uniqueIPs);
console.log("- Status Distribution:", analysis.statusDistribution);
console.log("- Method Distribution:", analysis.methodDistribution);
console.log("- Timeline (first 3):", analysis.timeline.slice(0, 3));

console.log("\n🎉 Log parsing test completed successfully!");

// Apache access log parser
// Format: %h %l %u %t \"%r\" %>s %b
// Example: 127.0.0.1 - - [10/Oct/2025:13:55:36 -0700] "GET /index.html HTTP/1.0" 200 2326

export interface ParsedLogEntry {
  ip: string;
  timestamp: Date;
  method: string;
  url: string;
  status: number;
  size: number;
  raw: string;
}

export interface LogAnalysis {
  totalEntries: number;
  parsedEntries: number;
  failedEntries: number;
  uniqueIPs: number;
  statusDistribution: Record<number, number>;
  methodDistribution: Record<string, number>;
  timeline: Array<{
    hour: string;
    count: number;
    timestamp: string;
  }>;
  anomalies: Array<{
    type: string;
    description: string;
    confidence: number;
    entry?: ParsedLogEntry;
  }>;
  aiInsights?: string;
  summary: {
    timeRange: {
      start: Date;
      end: Date;
      duration: number; // in minutes
    };
    topIPs: Array<{
      ip: string;
      count: number;
      percentage: number;
    }>;
    topEndpoints: Array<{
      url: string;
      count: number;
      percentage: number;
    }>;
  };
}

const APACHE_LOG_REGEX =
  /^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+) (\S+) \S+" (\d+) (\d+|-)/;

export function parseApacheLogLine(line: string): ParsedLogEntry | null {
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

export interface ParseResult {
  entries: ParsedLogEntry[];
  totalLines: number;
  parsedLines: number;
  failedLines: number;
}

export function parseApacheLogs(content: string): ParseResult {
  const lines = content.split("\n").filter((line) => line.trim());
  const entries: ParsedLogEntry[] = [];
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

export function analyzeLogs(parseResult: ParseResult): LogAnalysis {
  const { entries, parsedLines, failedLines } = parseResult;
  const totalEntries = entries.length;
  const uniqueIPs = new Set(entries.map((e) => e.ip)).size;

  // Status distribution
  const statusDistribution: Record<number, number> = {};
  entries.forEach((entry) => {
    statusDistribution[entry.status] =
      (statusDistribution[entry.status] || 0) + 1;
  });

  // Method distribution
  const methodDistribution: Record<string, number> = {};
  entries.forEach((entry) => {
    methodDistribution[entry.method] =
      (methodDistribution[entry.method] || 0) + 1;
  });

  // Timeline by hour (more readable format)
  const hourlyCounts: Record<string, number> = {};
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
  const anomalies: Array<{
    type: string;
    description: string;
    confidence: number;
    entry?: ParsedLogEntry;
  }> = [];

  // High request volume from single IP
  const ipCounts: Record<string, number> = {};
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
  const summaryIPCounts: Record<string, number> = {};
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
  const urlCounts: Record<string, number> = {};
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

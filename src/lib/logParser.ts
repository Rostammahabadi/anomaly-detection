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
  isAnomalous?: boolean;
  anomalyReason?: string;
  anomalyConfidence?: number;
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
    ip?: string;
    severity: "low" | "medium" | "high" | "critical";
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

// Helper function to detect time-window based anomalies
function detectTimeWindowAnomalies(entries: ParsedLogEntry[]) {
  const anomalies: Array<{
    type: string;
    description: string;
    confidence: number;
    ip?: string;
    severity: "low" | "medium" | "high" | "critical";
  }> = [];
  const timeWindowMs = 5 * 60 * 1000; // 5 minutes
  const requestThreshold = 50; // >50 requests in 5 minutes

  // Group entries by IP
  const ipGroups: Record<string, ParsedLogEntry[]> = {};
  entries.forEach((entry) => {
    if (!ipGroups[entry.ip]) {
      ipGroups[entry.ip] = [];
    }
    ipGroups[entry.ip].push(entry);
  });

  // Check each IP for time-window anomalies
  Object.entries(ipGroups).forEach(([ip, ipEntries]) => {
    if (ipEntries.length < requestThreshold) return;

    // Sort by timestamp
    ipEntries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Sliding window analysis
    for (let i = 0; i < ipEntries.length; i++) {
      const windowStart = ipEntries[i].timestamp.getTime();
      const windowEnd = windowStart + timeWindowMs;

      let windowCount = 1; // Count the current entry

      // Count entries within the time window
      for (let j = i + 1; j < ipEntries.length; j++) {
        if (ipEntries[j].timestamp.getTime() <= windowEnd) {
          windowCount++;
        } else {
          break; // No more entries in this window
        }
      }

      if (windowCount > requestThreshold) {
        const excessRequests = windowCount - requestThreshold;
        const confidence = Math.min(
          100,
          (excessRequests / requestThreshold) * 100
        );

        anomalies.push({
          type: "time_window_high_volume",
          description: `Unusual number of requests from IP ${ip}: ${windowCount} requests in 5-minute window (threshold: ${requestThreshold})`,
          confidence: Math.round(confidence),
          ip,
          severity:
            windowCount > requestThreshold * 2
              ? "critical"
              : windowCount > requestThreshold * 1.5
              ? "high"
              : "medium",
        });
        break; // Only report once per IP
      }
    }
  });

  return anomalies;
}

// Helper function to detect rapid-fire requests (potential DoS)
function detectRapidRequests(entries: ParsedLogEntry[]) {
  const anomalies: Array<{
    type: string;
    description: string;
    confidence: number;
    ip?: string;
    severity: "low" | "medium" | "high" | "critical";
  }> = [];
  const rapidThreshold = 10; // 10 requests per second
  const timeWindowMs = 1000; // 1 second

  // Group by IP and check for rapid bursts
  const ipGroups: Record<string, ParsedLogEntry[]> = {};
  entries.forEach((entry) => {
    if (!ipGroups[entry.ip]) {
      ipGroups[entry.ip] = [];
    }
    ipGroups[entry.ip].push(entry);
  });

  Object.entries(ipGroups).forEach(([ip, ipEntries]) => {
    if (ipEntries.length < rapidThreshold) return;

    ipEntries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Check for rapid bursts
    for (let i = 0; i < ipEntries.length - rapidThreshold + 1; i++) {
      const startTime = ipEntries[i].timestamp.getTime();
      const endTime = ipEntries[i + rapidThreshold - 1].timestamp.getTime();

      if (endTime - startTime <= timeWindowMs) {
        const confidence = Math.min(
          100,
          (rapidThreshold / (timeWindowMs / 1000) / 10) * 100
        );
        anomalies.push({
          type: "rapid_fire_requests",
          description: `Rapid-fire requests detected from IP ${ip}: ${rapidThreshold} requests in ${
            endTime - startTime
          }ms`,
          confidence: Math.round(confidence),
          ip,
          severity: "critical",
        });
        break; // Only report once per IP
      }
    }
  });

  return anomalies;
}

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

  // Enhanced anomaly detection
  const anomalies: Array<{
    type: string;
    description: string;
    confidence: number;
    entry?: ParsedLogEntry;
    ip?: string;
    severity: "low" | "medium" | "high" | "critical";
  }> = [];

  // Sort entries by timestamp for time-window analysis
  const sortedEntries = entries.sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  // 1. Time-window based anomaly detection (>50 requests in 5 minutes)
  const timeWindowAnomalies = detectTimeWindowAnomalies(sortedEntries);
  anomalies.push(...timeWindowAnomalies);

  // 2. Overall high request volume from single IP
  const ipCounts: Record<string, number> = {};
  entries.forEach((entry) => {
    ipCounts[entry.ip] = (ipCounts[entry.ip] || 0) + 1;
  });

  const volumeThreshold = Math.max(10, totalEntries * 0.1); // At least 10 requests or 10% of total
  Object.entries(ipCounts).forEach(([ip, count]) => {
    if (count > volumeThreshold) {
      const confidence = Math.min(100, (count / volumeThreshold) * 50);
      const severity = count > volumeThreshold * 2 ? "high" : "medium";
      anomalies.push({
        type: "high_volume_ip_overall",
        description: `Unusual number of requests from IP ${ip}: ${count} total requests (${Math.round(
          (count / totalEntries) * 100
        )}% of all traffic)`,
        confidence: Math.round(confidence),
        ip,
        severity,
      });
    }
  });

  // 3. High error rate (4xx/5xx status codes)
  const errorEntries = entries.filter((e) => e.status >= 400);
  const errorRate = errorEntries.length / totalEntries;
  if (errorRate > 0.05) {
    // More than 5% errors
    const confidence = Math.min(100, errorRate * 1000);
    const severity =
      errorRate > 0.2 ? "high" : errorRate > 0.1 ? "medium" : "low";
    anomalies.push({
      type: "high_error_rate",
      description: `High error rate: ${
        errorEntries.length
      } errors out of ${totalEntries} requests (${Math.round(
        errorRate * 100
      )}%)`,
      confidence: Math.round(confidence),
      severity,
    });
  }

  // 4. Unusual HTTP methods
  const methodCounts: Record<string, number> = {};
  entries.forEach((entry) => {
    methodCounts[entry.method] = (methodCounts[entry.method] || 0) + 1;
  });

  Object.entries(methodCounts).forEach(([method, count]) => {
    // Flag unusual methods (anything other than GET, POST, HEAD)
    if (!["GET", "POST", "HEAD"].includes(method) && count > 0) {
      const confidence = Math.min(100, (count / totalEntries) * 2000);
      anomalies.push({
        type: "unusual_http_method",
        description: `Unusual HTTP method detected: ${method} (${count} requests)`,
        confidence: Math.round(confidence),
        severity: "medium",
      });
    }
  });

  // 5. Suspicious URL patterns
  const suspiciousUrls = entries.filter(
    (entry) =>
      entry.url.includes("../") ||
      entry.url.includes("..\\") ||
      entry.url.includes("<script") ||
      entry.url.includes("union select") ||
      entry.url.includes("script>") ||
      entry.url.match(/\/admin|\/wp-admin|\/administrator|\/manager/i) ||
      entry.url.includes("phpmyadmin") ||
      entry.url.includes("web.config") ||
      entry.url.includes(".env")
  );

  if (suspiciousUrls.length > 0) {
    const confidence = Math.min(
      100,
      (suspiciousUrls.length / totalEntries) * 5000
    );
    anomalies.push({
      type: "suspicious_urls",
      description: `Suspicious URL patterns detected: ${suspiciousUrls.length} potentially malicious requests`,
      confidence: Math.round(confidence),
      severity: "high",
    });
  }

  // 6. Rapid-fire requests (potential DoS)
  const rapidRequests = detectRapidRequests(sortedEntries);
  anomalies.push(...rapidRequests);

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

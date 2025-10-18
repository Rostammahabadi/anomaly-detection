"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ParsedLogEntry {
  ip: string;
  timestamp: string;
  method: string;
  url: string;
  status: number;
  size: number;
  raw: string;
}

interface LogEntry {
  id: number;
  filename: string;
  upload_date: string;
  parsed_data: ParsedLogEntry[];
  analysis_result: {
    totalEntries: number;
    parsedEntries: number;
    failedEntries: number;
    uniqueIPs: number;
    statusDistribution: Record<number, number>;
    methodDistribution: Record<string, number>;
    timeline: Array<{ hour: string; count: number; timestamp: string }>;
    anomalies: Array<{
      type: string;
      description: string;
      confidence: number;
      ip?: string;
      severity: "low" | "medium" | "high" | "critical";
    }>;
    summary: {
      timeRange: {
        start: Date;
        end: Date;
        duration: number;
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
    aiInsights?: string;
  };
}

export default function ResultsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchResults();
  }, [router]);

  const fetchResults = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/results", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(response.data.logs);
    } catch (error) {
      console.error("Failed to fetch results:", error);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const getAnomalyForEntry = (entry: ParsedLogEntry) => {
    if (!selectedLog?.analysis_result?.anomalies) return null;

    // Check if this entry is related to any anomaly
    return selectedLog.analysis_result.anomalies.find((anomaly) => {
      if (anomaly.ip === entry.ip) {
        return true;
      }
      // Could add more sophisticated matching logic here
      return false;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analysis Results</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => router.push("/upload")}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Upload New File
            </button>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-gray-500">
              No analysis results yet. Upload a log file to get started.
            </p>
            <button
              onClick={() => router.push("/upload")}
              className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Upload File
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Log List Table */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Your Analyses</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Filename
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Upload Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Parsed Summary
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        className={`cursor-pointer hover:bg-gray-50 ${
                          selectedLog?.id === log.id ? "bg-indigo-50" : ""
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {log.filename}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(log.upload_date).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(log.upload_date).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center space-x-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {log.analysis_result.totalEntries} entries
                              </span>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {log.analysis_result.uniqueIPs} IPs
                              </span>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                {log.analysis_result.anomalies.length} anomalies
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Analysis Details */}
            <div className="lg:col-span-2">
              {selectedLog ? (
                <div className="space-y-6">
                  <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">
                      Analysis: {selectedLog.filename}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <h3 className="text-sm font-semibold text-blue-900">
                          Total Entries
                        </h3>
                        <p className="text-2xl font-bold text-blue-600">
                          {selectedLog.analysis_result.totalEntries}
                        </p>
                        <p className="text-xs text-blue-700">
                          {selectedLog.analysis_result.parsedEntries} parsed,{" "}
                          {selectedLog.analysis_result.failedEntries} failed
                        </p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <h3 className="text-sm font-semibold text-green-900">
                          Unique IPs
                        </h3>
                        <p className="text-2xl font-bold text-green-600">
                          {selectedLog.analysis_result.uniqueIPs}
                        </p>
                        {selectedLog.analysis_result.summary?.topIPs?.[0] && (
                          <p className="text-xs text-green-700">
                            Top:{" "}
                            {selectedLog.analysis_result.summary.topIPs[0].ip}
                          </p>
                        )}
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg text-center">
                        <h3 className="text-sm font-semibold text-yellow-900">
                          Anomalies
                        </h3>
                        <p className="text-2xl font-bold text-yellow-600">
                          {selectedLog.analysis_result.anomalies.length}
                        </p>
                        <p className="text-xs text-yellow-700">
                          {selectedLog.analysis_result.anomalies.length > 0
                            ? "Detected"
                            : "None found"}
                        </p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg text-center">
                        <h3 className="text-sm font-semibold text-purple-900">
                          Time Range
                        </h3>
                        <p className="text-lg font-bold text-purple-600">
                          {Math.round(
                            (selectedLog.analysis_result.summary?.timeRange
                              ?.duration || 0) / 60
                          )}{" "}
                          min
                        </p>
                        <p className="text-xs text-purple-700">
                          {selectedLog.analysis_result.summary?.timeRange?.start
                            ? new Date(
                                selectedLog.analysis_result.summary.timeRange.start
                              ).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Timeline Chart */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3">
                        Request Timeline
                      </h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={selectedLog.analysis_result.timeline}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="hour" />
                            <YAxis />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey="count"
                              stroke="#3b82f6"
                              strokeWidth={2}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Full Parsed Data */}
                    <div className="mb-6">
                      <button
                        onClick={() => toggleSection("parsed-data")}
                        className="flex items-center justify-between w-full text-left p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <h3 className="text-lg font-semibold text-gray-900">
                          Full Parsed Data (
                          {selectedLog.parsed_data?.length || 0} entries)
                        </h3>
                        <svg
                          className={`w-5 h-5 transition-transform ${
                            expandedSections["parsed-data"]
                              ? "transform rotate-180"
                              : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      {expandedSections["parsed-data"] && (
                        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                          <div className="space-y-2">
                            {selectedLog.parsed_data?.map(
                              (entry: ParsedLogEntry, index: number) => {
                                const anomaly = getAnomalyForEntry(entry);
                                return (
                                  <div
                                    key={index}
                                    className={`p-3 rounded border text-sm relative group ${
                                      anomaly
                                        ? "bg-red-50 border-red-300 shadow-sm"
                                        : "bg-white"
                                    }`}
                                    title={
                                      anomaly
                                        ? `${anomaly.description} (${anomaly.confidence}% confidence)`
                                        : undefined
                                    }
                                  >
                                    {anomaly && (
                                      <div className="absolute top-2 right-2">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                          ⚠️ {anomaly.confidence}%
                                        </span>
                                      </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-xs">
                                      <div>
                                        <strong>IP:</strong> {entry.ip}
                                      </div>
                                      <div>
                                        <strong>Time:</strong>{" "}
                                        {new Date(
                                          entry.timestamp
                                        ).toLocaleString()}
                                      </div>
                                      <div>
                                        <strong>Method:</strong> {entry.method}
                                      </div>
                                      <div>
                                        <strong>URL:</strong> {entry.url}
                                      </div>
                                      <div>
                                        <strong>Status:</strong> {entry.status}
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                            ) || (
                              <p className="text-gray-500 text-center py-4">
                                No parsed data available
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Anomalies */}
                    {selectedLog.analysis_result.anomalies.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3 text-red-900">
                          Detected Anomalies
                        </h3>
                        <div className="space-y-2">
                          {selectedLog.analysis_result.anomalies.map(
                            (anomaly, index) => {
                              const severityColors = {
                                low: "bg-yellow-50 border-yellow-200 text-yellow-800",
                                medium:
                                  "bg-orange-50 border-orange-200 text-orange-800",
                                high: "bg-red-50 border-red-200 text-red-800",
                                critical:
                                  "bg-red-100 border-red-300 text-red-900",
                              };

                              return (
                                <div
                                  key={index}
                                  className={`p-3 border rounded-lg ${
                                    severityColors[anomaly.severity] ||
                                    severityColors.medium
                                  }`}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className="text-sm font-medium">
                                        {anomaly.description}
                                      </p>
                                      <div className="flex items-center space-x-2 mt-1">
                                        <span className="text-xs">
                                          Confidence: {anomaly.confidence}%
                                        </span>
                                        <span
                                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                            anomaly.severity === "critical"
                                              ? "bg-red-200 text-red-900"
                                              : anomaly.severity === "high"
                                              ? "bg-red-100 text-red-800"
                                              : anomaly.severity === "medium"
                                              ? "bg-orange-100 text-orange-800"
                                              : "bg-yellow-100 text-yellow-800"
                                          }`}
                                        >
                                          {anomaly.severity?.toUpperCase() ||
                                            "MEDIUM"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    )}

                    {/* AI Insights */}
                    {selectedLog.analysis_result.aiInsights && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-purple-900">
                          🤖 AI Analysis Insights
                        </h3>
                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                          {/* Display AI-powered security analysis generated by OpenAI GPT */}
                          <div className="text-purple-800 prose prose-sm max-w-none">
                            <ReactMarkdown>
                              {selectedLog.analysis_result.aiInsights}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white shadow rounded-lg p-6 text-center">
                  <p className="text-gray-500">
                    Select an analysis from the list to view details.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

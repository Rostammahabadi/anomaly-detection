"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface LogEntry {
  id: number;
  filename: string;
  upload_date: string;
  analysis_result: {
    totalEntries: number;
    uniqueIPs: number;
    statusDistribution: Record<number, number>;
    methodDistribution: Record<string, number>;
    timeline: Array<{ hour: string; count: number }>;
    anomalies: Array<{
      type: string;
      description: string;
      confidence: number;
    }>;
    aiInsights?: string;
  };
}

export default function ResultsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
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
            {/* Log List */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Your Analyses</h2>
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`p-3 rounded-lg border cursor-pointer hover:bg-gray-50 ${
                      selectedLog?.id === log.id
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200"
                    }`}
                  >
                    <p className="font-medium text-sm">{log.filename}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(log.upload_date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-600">
                      {log.analysis_result.totalEntries} entries
                    </p>
                  </div>
                ))}
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <h3 className="text-lg font-semibold text-blue-900">
                          Total Entries
                        </h3>
                        <p className="text-2xl font-bold text-blue-600">
                          {selectedLog.analysis_result.totalEntries}
                        </p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <h3 className="text-lg font-semibold text-green-900">
                          Unique IPs
                        </h3>
                        <p className="text-2xl font-bold text-green-600">
                          {selectedLog.analysis_result.uniqueIPs}
                        </p>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg text-center">
                        <h3 className="text-lg font-semibold text-yellow-900">
                          Anomalies
                        </h3>
                        <p className="text-2xl font-bold text-yellow-600">
                          {selectedLog.analysis_result.anomalies.length}
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

                    {/* Anomalies */}
                    {selectedLog.analysis_result.anomalies.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3 text-red-900">
                          Detected Anomalies
                        </h3>
                        <div className="space-y-2">
                          {selectedLog.analysis_result.anomalies.map(
                            (anomaly, index) => (
                              <div
                                key={index}
                                className="p-3 bg-red-50 border border-red-200 rounded-lg"
                              >
                                <p className="text-sm font-medium text-red-800">
                                  {anomaly.description}
                                </p>
                                <p className="text-xs text-red-600 mt-1">
                                  Confidence: {anomaly.confidence}%
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* AI Insights */}
                    {selectedLog.analysis_result.aiInsights && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-purple-900">
                          AI Analysis Insights
                        </h3>
                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                          <p className="text-purple-800 whitespace-pre-line">
                            {selectedLog.analysis_result.aiInsights}
                          </p>
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

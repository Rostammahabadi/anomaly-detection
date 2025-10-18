"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

interface AnalysisResult {
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
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("token");
      const response = await axios.post("/api/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setResult(response.data.analysis);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Log File Analysis
          </h1>
          <div className="flex space-x-4">
            <button
              onClick={() => router.push("/results")}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              View Results
            </button>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Apache Access Log File
            </label>
            <input
              type="file"
              accept=".txt,.log"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            <p className="mt-1 text-sm text-gray-500">
              Supported formats: .txt, .log (max 10MB)
            </p>
          </div>

          {file && (
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                Selected file: {file.name}
              </p>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {uploading ? "Analyzing..." : "Upload and Analyze"}
              </button>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900">
                    Total Entries
                  </h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {result.totalEntries}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900">
                    Unique IPs
                  </h3>
                  <p className="text-2xl font-bold text-green-600">
                    {result.uniqueIPs}
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-yellow-900">
                    Anomalies Detected
                  </h3>
                  <p className="text-2xl font-bold text-yellow-600">
                    {result.anomalies.length}
                  </p>
                </div>
              </div>

              {result.anomalies.length > 0 && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-red-900 mb-3">
                    Detected Anomalies
                  </h3>
                  <div className="space-y-2">
                    {result.anomalies.map((anomaly, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-2 bg-white rounded border"
                      >
                        <div>
                          <p className="text-sm font-medium text-red-800">
                            {anomaly.description}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-red-600">
                          {anomaly.confidence}% confidence
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.aiInsights && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-900 mb-3">
                    AI Analysis Insights
                  </h3>
                  <p className="text-purple-800 whitespace-pre-line">
                    {result.aiInsights}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

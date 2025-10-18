"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Simple landing page for Vercel deployment
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Cybersecurity Log Analysis Tool
          </h1>
          <p className="text-gray-600 mb-8">
            Upload and analyze Apache access logs for security insights
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/login"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Get Started - Login
          </Link>

          {isClient && (
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-indigo-600 hover:text-indigo-500"
              >
                Sign in here
              </Link>
            </p>
          )}
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>Features:</p>
          <ul className="mt-2 space-y-1">
            <li>• Apache log parsing & analysis</li>
            <li>• AI-powered threat detection</li>
            <li>• Anomaly detection & reporting</li>
            <li>• Interactive timeline charts</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

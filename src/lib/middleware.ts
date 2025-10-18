import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "./auth";

/**
 * JWT Authentication Middleware
 * Protects API routes by verifying JWT tokens
 * Returns 401 Unauthorized if token is missing or invalid
 */
export function withAuth(
  handler: (
    request: NextRequest,
    user: { userId: number; username: string }
  ) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest) => {
    try {
      const user = getAuthUser(request);

      if (!user) {
        return NextResponse.json(
          { error: "Authentication required. Please log in." },
          { status: 401 }
        );
      }

      // Check if token is expired or user exists
      // Additional validation can be added here

      return handler(request, user);
    } catch (error) {
      console.error("Authentication middleware error:", error);
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }
  };
}

/**
 * File Upload Validation
 * Validates file uploads for security and size constraints
 */
export function validateFileUpload(file: File): {
  valid: boolean;
  error?: string;
} {
  // Check if file exists
  if (!file) {
    return { valid: false, error: "No file provided" };
  }

  // Check file type
  const allowedExtensions = [".txt", ".log"];
  const fileName = file.name.toLowerCase();
  const hasValidExtension = allowedExtensions.some((ext) =>
    fileName.endsWith(ext)
  );

  if (!hasValidExtension) {
    return {
      valid: false,
      error: "Invalid file type. Only .txt and .log files are allowed",
    };
  }

  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size (${(file.size / (1024 * 1024)).toFixed(
        1
      )}MB) exceeds the 10MB limit`,
    };
  }

  // Check if file is not empty
  if (file.size === 0) {
    return { valid: false, error: "File is empty" };
  }

  // Additional security checks can be added here
  // - Check for malicious file signatures
  // - Scan for embedded scripts
  // - Validate file content structure

  return { valid: true };
}

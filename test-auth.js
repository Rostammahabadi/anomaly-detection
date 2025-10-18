// Simple test script for authentication API
// Run with: node test-auth.js

const axios = require("axios");

const BASE_URL = "http://localhost:3000";

async function testAuth() {
  try {
    console.log("🧪 Testing Authentication System\n");

    // Test 1: Signup
    console.log("1. Testing user signup...");
    const signupResponse = await axios.post(`${BASE_URL}/api/auth/signup`, {
      username: "testuser",
      password: "testpass123",
    });
    console.log("✅ Signup successful:", signupResponse.data.message);

    // Test 2: Login
    console.log("\n2. Testing user login...");
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: "testuser",
      password: "testpass123",
    });
    console.log("✅ Login successful:", loginResponse.data.message);

    const token = loginResponse.data.token;
    console.log("📝 JWT Token received");

    // Test 3: Access protected route
    console.log("\n3. Testing protected route access...");
    const resultsResponse = await axios.get(`${BASE_URL}/api/results`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("✅ Protected route access successful:", resultsResponse.data);

    // Test 4: Test invalid credentials
    console.log("\n4. Testing invalid credentials...");
    try {
      await axios.post(`${BASE_URL}/api/auth/login`, {
        username: "testuser",
        password: "wrongpassword",
      });
    } catch (error) {
      console.log(
        "✅ Invalid credentials properly rejected:",
        error.response.data.error
      );
    }

    console.log("\n🎉 All authentication tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  }
}

// Run the test
testAuth();

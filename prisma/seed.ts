import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create test users
  const users = [
    { username: "admin", password: "admin123" },
    { username: "analyst", password: "analyst123" },
    { username: "testuser", password: "testpass123" },
  ];

  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = await prisma.user.upsert({
      where: { username: userData.username },
      update: {},
      create: {
        username: userData.username,
        password_hash: hashedPassword,
      },
    });

    console.log(`✅ Created user: ${user.username}`);
  }

  // Create sample log analysis entries
  const sampleAnalysis = {
    totalEntries: 25,
    uniqueIPs: 8,
    statusDistribution: { "200": 20, "404": 3, "500": 2 },
    methodDistribution: { GET: 22, POST: 3 },
    timeline: [
      { hour: "2025-10-18T14:00", count: 5 },
      { hour: "2025-10-18T14:01", count: 8 },
      { hour: "2025-10-18T14:02", count: 12 },
    ],
    anomalies: [
      {
        type: "high_error_rate",
        description: "High error rate: 5 errors out of 25 requests",
        confidence: 75,
      },
    ],
    aiInsights:
      "Sample AI analysis for demonstration purposes. The log shows normal web traffic with some error responses that may indicate potential issues.",
  };

  // Get the first user to associate logs with
  const adminUser = await prisma.user.findFirst({
    where: { username: "admin" },
  });

  if (adminUser) {
    const logEntry = await prisma.log.create({
      data: {
        user_id: adminUser.id,
        filename: "sample_analysis.log",
        parsed_data: [
          {
            ip: "192.168.1.100",
            timestamp: new Date("2025-10-18T14:00:15Z"),
            method: "GET",
            url: "/index.html",
            status: 200,
            size: 2326,
            raw: '192.168.1.100 - - [18/Oct/2025:14:00:15 +0000] "GET /index.html HTTP/1.1" 200 2326',
          },
        ],
        analysis_result: sampleAnalysis,
      },
    });

    console.log(`✅ Created sample log entry: ${logEntry.filename}`);
  }

  console.log("🎉 Database seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

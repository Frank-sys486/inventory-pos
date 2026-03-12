import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Hardcoded Discord Webhook for FinOpenPOS Reports
    const webhookUrl = "https://discord.com/api/webhooks/1481525446352044053/LR3jv0ynMkQJdEQ2oduD3KsaQ9fimti1YQ_dzXyBpdlbL4XVNA3CijCu_EKA8GNUCfAV";

    const APP_NAME = "MC Hardware System (FinOpenPOS)";
    const APP_VERSION = "1.0.0";
    const HWID = process.env.ALLOWED_HWID || "NOT_SET";

    const payload = {
      username: "System Monitor",
      avatar_url: "https://cdn-icons-png.flaticon.com/512/564/564619.png",
      embeds: [
        {
          title: "🚨 POS ERROR REPORT",
          color: 0xE74C3C, // Red
          description: `An error occurred in the production environment of **${APP_NAME}**.`,
          fields: [
            { name: "Application", value: `\`${APP_NAME}\``, inline: true },
            { name: "Version", value: `\`v${APP_VERSION}\``, inline: true },
            { name: "HWID (Client ID)", value: `\`${HWID}\``, inline: true },
            { name: "Timestamp", value: new Date().toLocaleString(), inline: false },
            { name: "Error Message", value: `**${data.message || "Unknown error"}**`, inline: false },
            { name: "Page URL", value: data.location || "N/A", inline: false },
            { 
              name: "Stack Trace", 
              value: `\`\`\`js\n${(data.stack || "No stack trace").substring(0, 1000)}\n\`\`\``, 
              inline: false 
            },
          ],
          footer: {
            text: "FinOpenPOS Error Logging System",
          },
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Discord Webhook Error:", errorText);
        return NextResponse.json({ success: false, status: response.status }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send error report:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

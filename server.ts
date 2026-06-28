import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up JSON body parser with increased limit to support base64 image uploads
app.use(express.json({ limit: "10mb" }));

// Initialize Google Gen AI client with telemetry header
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API: Analyze image of community issues using Gemini 3.5 Flash
app.post("/api/reports/analyze", async (req, res) => {
  const { image, mimeType } = req.body;

  if (!image) {
    return res.status(400).json({ error: "No image provided" });
  }

  const ai = getGeminiClient();

  if (!ai) {
    console.log("No valid GEMINI_API_KEY found, returning demo analysis.");
    // Fail-safe mock analysis for user evaluation if API key is not configured
    return res.json({
      category: "Pothole",
      severity: "High",
      description: "[DEMO MODE - API Key Missing] Medium-sized structural pothole on primary driving lane, posing a hazard to passing vehicle suspension systems.",
      cautionTips: "Approach with reduced speed. Watch for sudden braking from vehicles ahead avoiding this zone.",
      isDemo: true
    });
  }

  try {
    const imagePart = {
      inlineData: {
        mimeType: mimeType || "image/jpeg",
        data: image,
      },
    };

    const textPart = {
      text: `Analyze this photo of a public safety, municipal, or neighborhood infrastructure issue and perform a precise safety risk assessment:

1. Category: Determine the best fit from the approved list.
2. Severity Assessment:
   - 'Critical': Direct threat to life, limb, or severe property damage (e.g., exposed live electrical wires, massive sinkholes, active flooding).
   - 'High': High accident risk, immediate attention required (e.g., major potholes on fast roads, broken streetlights at blind intersections).
   - 'Medium': Needs repair but not immediately life-threatening (e.g., standard water leakage, minor street cracks).
   - 'Low': Cosmetic or low-impact issues (e.g., localized graffiti, minor litter).
3. Problem Description: Provide a professional, concise, objective description outlining the exact physical elements of the hazard.
4. Actionable Safety Tips: Provide structured, highly localized, and category-specific safety advice for citizens. Include instructions on maintaining safe distance, visibility warnings, speed reductions, and temporary non-intrusive safety measures (e.g., 'If safe to do so, mark with a high-visibility hazard marker'). Keep the tone authoritative, helpful, and community-minded.`,
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: "Must be exactly one of: 'Pothole', 'Water Leakage', 'Broken Streetlight', 'Waste Management', 'Infrastructure'",
            },
            severity: {
              type: Type.STRING,
              description: "Must be exactly one of: 'Low', 'Medium', 'High', 'Critical'",
            },
            description: {
              type: Type.STRING,
              description: "A short, professional, objective description of the visual issue.",
            },
            cautionTips: {
              type: Type.STRING,
              description: "Direct safety advice or warnings for pedestrians/drivers approaching this area.",
            },
          },
          required: ["category", "severity", "description", "cautionTips"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini API");
    }

    const parsed = JSON.parse(text);
    return res.json({ ...parsed, isDemo: false });
  } catch (error: any) {
    console.error("Gemini Image Analysis Error:", error);
    return res.status(500).json({
      error: "Failed to perform AI image analysis.",
      details: error.message || error,
    });
  }
});

// API: Synthesize neighborhood trends & predict municipal upgrades
app.post("/api/reports/predict", async (req, res) => {
  const { reports } = req.body;

  if (!reports || !Array.isArray(reports)) {
    return res.status(400).json({ error: "Reports list is required" });
  }

  const ai = getGeminiClient();

  if (!ai || reports.length === 0) {
    // Elegant predictive fallback summary
    return res.json({
      overview: "Hyperlocal analysis identifies a cluster of road hazards and light outrages near downtown lanes. Early action is highly recommended to protect evening traffic.",
      predictions: [
        {
          zone: "Main Street & 5th Avenue",
          recommendation: "Conduct joint road leveling and bulb refitting over the weekend.",
          reason: "Clustered pothole reports alongside damaged streetlights increase incident risk by 40% at night."
        },
        {
          zone: "Residential Park Area",
          recommendation: "Deploy waste containers and schedule bi-weekly collections.",
          reason: "Repetitive waste reports point to insufficient collection points for the local density."
        }
      ],
      isDemo: true
    });
  }

  try {
    const formattedData = reports.map((r: any) => ({
      category: r.category,
      severity: r.severity,
      lat: r.lat,
      lng: r.lng,
      address: r.formattedAddress,
      status: r.status,
    }));

    const prompt = `Analyze this list of community incidents and return a structured JSON synthesis report.
Identify spatial clusters or overlapping categories, evaluate structural risks, and write recommendations for public upgrades.

Incidents Data:
${JSON.stringify(formattedData, null, 2)}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overview: {
              type: Type.STRING,
              description: "A summary synthesis identifying the core infrastructure health of the region.",
            },
            predictions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  zone: {
                    type: Type.STRING,
                    description: "The street name or area coordinates cluster identified.",
                  },
                  recommendation: {
                    type: Type.STRING,
                    description: "The proactive upgrade proposed (e.g. repave street, repair mains).",
                  },
                  reason: {
                    type: Type.STRING,
                    description: "Why Gemini recommends this (referencing clusters or categories).",
                  },
                },
                required: ["zone", "recommendation", "reason"],
              },
            },
          },
          required: ["overview", "predictions"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty predictive synthesis response");
    }

    const parsed = JSON.parse(text);
    return res.json({ ...parsed, isDemo: false });
  } catch (error: any) {
    console.error("Gemini Predictive Upgrades Error:", error);
    return res.status(500).json({
      error: "Failed to generate AI predictive analysis.",
      details: error.message || error,
    });
  }
});

// Configure Vite Middlewares or Static Asset Serving
async function bootServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Community Hero Backend] Server running at http://0.0.0.0:${PORT}`);
  });
}

bootServer();

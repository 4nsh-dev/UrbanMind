import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Security hardening: disable x-powered-by header to prevent fingerprinting
app.disable('x-powered-by');

// Custom security headers middleware to prevent clickjacking, MIME sniffing and basic XSS vectors
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// Set up body parsers with limits for processing base64 image uploads (Google Lens-inspired scanning)
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Lazy initialization of Gemini client to prevent crash on startup if key is missing
let aiClient: GoogleGenAI | null = null;
let isQuotaExhausted = false;
let quotaExhaustedAt = 0;
const QUOTA_COOLDOWN_MS = 60000; // 1 minute cooldown

function getGemini() {
  if (isQuotaExhausted && (Date.now() - quotaExhaustedAt < QUOTA_COOLDOWN_MS)) {
    console.log("[Gemini Status] Quota currently exhausted. Bypassing live API and returning simulated fallback instantly.");
    return null;
  }
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    console.log("GEMINI_API_KEY is not specified or is placeholder. Server will run in full-simulation fallback mode.");
    return null;
  }
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
    return aiClient;
  } catch (err) {
    console.log("Failed to initialize GoogleGenAI client (using simulated engine fallback):", err);
    return null;
  }
}

// Global resilient helper to call Gemini generateContent with model fallbacks
async function generateContentWithFallback(
  ai: GoogleGenAI,
  config: {
    model?: string;
    contents: any;
    config?: any;
  }
) {
  const primaryModel = config.model || "gemini-3.5-flash";
  const modelsToTry = [
    primaryModel,
    "gemini-flash-latest",
    "gemini-3.1-flash-lite",
    "gemini-3.1-pro-preview"
  ];

  let lastError: any = null;

  for (const model of modelsToTry) {
    if (isQuotaExhausted && (Date.now() - quotaExhaustedAt < QUOTA_COOLDOWN_MS)) {
      console.log(`[Gemini Resilient Engine] Skipping remaining models due to active rate-limit block.`);
      break;
    }

    try {
      console.log(`[Gemini Resilient Engine] Attempting call with model: ${model}`);
      const response = await ai.models.generateContent({
        ...config,
        model
      });
      console.log(`[Gemini Resilient Engine] Call succeeded with model: ${model}`);
      return response;
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      console.log(`[Gemini Resilient Engine] Call failed with model: ${model}. Detail:`, errMsg);
      
      if (errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("429") || errMsg.includes("Quota exceeded") || errMsg.includes("quota")) {
        isQuotaExhausted = true;
        quotaExhaustedAt = Date.now();
        console.log("[Gemini Engine] Detected Quota Exhaustion. Marking API rate-limited and triggering immediate fallback.");
      }
      
      lastError = err;
    }
  }

  throw lastError || new Error("All model fallback attempts failed.");
}

// ==================== SIMULATED FALLBACK HELPERS ====================

function runSimulatedAnalyzeIssue(title: string, description: string, imageBase64: any) {
  const textToAnalyze = `${title || ""} ${description || ""}`.toLowerCase();
  let category = "general";
  let severity = "medium";
  let urgency = 50;
  let estimate = "A maintenance contractor will be scheduled to inspect the location within 5 business days.";

  if (textToAnalyze.includes("pot") || textToAnalyze.includes("hole") || textToAnalyze.includes("pavement")) {
    category = "pothole";
    severity = "high";
    urgency = 75;
    estimate = "Public Works road patch crew dispatched. Standard cold asphalt patch scheduled within 48 hours.";
  } else if (textToAnalyze.includes("trash") || textToAnalyze.includes("garbage") || textToAnalyze.includes("bin") || textToAnalyze.includes("waste")) {
    category = "garbage";
    severity = "medium";
    urgency = 60;
    estimate = "Sanitation crew routing checklist updated. Comm waste removal dispatch queued for tomorrow early morning.";
  } else if (textToAnalyze.includes("leak") || textToAnalyze.includes("water") || textToAnalyze.includes("gush") || textToAnalyze.includes("pipe")) {
    category = "water_leak";
    severity = "critical";
    urgency = 95;
    estimate = "EMERGENCY WARNING: Hydraulic valve isolation ordered. Utility emergency response crew dispatched instantly.";
  } else if (textToAnalyze.includes("light") || textToAnalyze.includes("dark") || textToAnalyze.includes("bulb") || textToAnalyze.includes("lamp")) {
    category = "broken_streetlight";
    severity = "low";
    urgency = 35;
    estimate = "Zone lighting team notified. Standard LED luminaire and bulb replacement scheduled within 72 hours.";
  } else if (textToAnalyze.includes("spray") || textToAnalyze.includes("paint") || textToAnalyze.includes("graffiti") || textToAnalyze.includes("wall")) {
    category = "graffiti";
    severity = "low";
    urgency = 25;
    estimate = "Abatement crew queued for chemical cleaning and repainting of public vertical surface within 5 business days.";
  } else if (textToAnalyze.includes("tree") || textToAnalyze.includes("branch") || textToAnalyze.includes("fall") || textToAnalyze.includes("storm")) {
    category = "tree_hazard";
    severity = "high";
    urgency = 80;
    estimate = "Arborist team and heavy brush clearance truck dispatched to prune blockages from high-voltage lines.";
  }

  if (imageBase64) {
    urgency = Math.min(urgency + 10, 99);
  }

  return {
    categorySuggested: category,
    title: title || `Verified ${category.replace("_", " ")} Report`,
    descriptionRefined: description ? `Community scanning verified: ${description}` : `Automated civic survey flagged possible ${category.replace("_", " ")} activity in vicinity. Immediate action requested.`,
    severityPrediction: severity,
    urgencyScore: urgency,
    resolutionEstimate: estimate,
    simulated: true
  };
}

function runSimulatedGeminiVision(image: string) {
  const cleanB64 = (image && image.includes(",")) ? image.split(",")[1] : (image || "");
  const keyVal = (cleanB64.length % 6) || 0;
  
  const categories = [
    { cat: "Road Pothole", sev: "high", dept: "Public Works Road Maintenance Department", summary: "Damaged asphalt on cross exit lane with structural erosion and pavement decay. Hazard poses high traffic risk." },
    { cat: "Water Leakage", sev: "critical", dept: "Municipal Water Board & Pipe Services", summary: "Severe water pipe burst or active mainline leak, flooding street surface. Extreme risk of soil erosion." },
    { cat: "Illegal Dump / Garbage", sev: "medium", dept: "Sanitation & Public Hygiene Division", summary: "Commercial waste pileup, cardboard debris, and plastic bins blocking safe public access near urban walkway." },
    { cat: "Malfunctioning Light", sev: "low", dept: "Bureau of Street Lighting & Electrical Team", summary: "Damaged lighting fixture or burnt-out LED bulb. Path remains pitch-black at night, reducing security safety." },
    { cat: "Graffiti & Vandalism", sev: "low", dept: "Graffiti and Graffiti Abatement Crew", summary: "Spray-painted tag or vertical surface vandalism. Abatement cleaning queued for public aesthetics restoration." },
    { cat: "Fallen Tree Branch", sev: "high", dept: "Urban Arbourists & Emergency Hazard Unit", summary: "Large hazardous tree branch breaking free and blocking active roadway lanes. Demands immediate vehicle routing detour." }
  ];

  const selected = categories[keyVal];

  return {
    category: selected.cat,
    severity: selected.sev,
    confidence: `${80 + (cleanB64.length % 20)}%`,
    summary: selected.summary,
    department: selected.dept,
    simulated: true
  };
}

function runSimulatedChat(
  latestUserMessage: string,
  unresolvedIssues: any[],
  userIssues: any[],
  user: any,
  totalIssues: number,
  resolvedCount: number,
  pendingCount: number,
  avgTrustScore: number
) {
  let reply = "Hello! I am your Urban Mind Assistant. How can I assist you with civic reports today?";
  const text = latestUserMessage.toLowerCase();

  if (text.includes("nearby") || text.includes("unresolved") || text.includes("show nearby unresolved")) {
    const listStr = unresolvedIssues.length > 0 
      ? unresolvedIssues.map(i => `• **${i.title}** (*${i.category}*) at *${i.locationName}* - Severity: **${i.severity}** (Trust Score: **${i.trustScore}%**)`).join("\n")
      : "• No active unresolved issues nearby right now!";
    reply = `### Nearby Unresolved Issues\nHere are the current unresolved issues logged near you:\n\n${listStr}\n\nFeel free to head over to the **Community Map** to upvote or verify any of these so we can get them resolved faster!`;
  } else if (text.includes("why") && (text.includes("pending") || text.includes("my issue"))) {
    if (userIssues.length === 0) {
      reply = `You haven't reported any issues under your account (${user?.name || "Anshdeep Singh"}) yet. If you have active tickets, make sure you are logged in as the reporting citizen! You can submit a new issue via the **Report Issue** tab.`;
    } else {
      const explStr = userIssues.map(i => {
        let reason = "";
        if (i.status === "reported") {
          reason = "Awaiting initial peer verifications on the map. Issues with a higher Community Trust Score are prioritized and escalated to municipal crews.";
        } else if (i.status === "verified") {
          reason = "Successfully verified with a Community Trust Score of " + i.trustScore + "%. It is currently in the dispatch queue waiting for public works dispatch.";
        } else if (i.status === "in_progress") {
          reason = "Work is active! City crews are currently repairing this issue.";
        }
        return `• **${i.title}** (Status: *${i.status}*, Trust Score: *${i.trustScore}%*):\n  ${reason}`;
      }).join("\n\n");
      reply = `### Status of Your Reported Issues\nHere is the real-time breakdown of your issues and why they are pending:\n\n${explStr}`;
    }
  } else if (text.includes("highest risk") || text.includes("which area")) {
    const counts: Record<string, number> = {};
    let highestZone = "El Camino Real & Oregon Expressway";
    unresolvedIssues.forEach(i => {
      counts[i.locationName] = (counts[i.locationName] || 0) + (i.severity === 'high' ? 3 : i.severity === 'medium' ? 2 : 1);
    });
    let maxWeight = 0;
    for (const zone in counts) {
      if (counts[zone] > maxWeight) {
        maxWeight = counts[zone];
        highestZone = zone;
      }
    }
    reply = `### Predictive Risk Assessment\nBased on active community feedback and hazard analysis, **${highestZone}** currently displays the highest risk concentration in our records. \n\nThis is primarily driven by unresolved higher-severity issues (like asphalt degradation or active leaks). Please proceed with caution around this area while our dispatch teams coordinate rapid intervention.`;
  } else if (text.includes("health summary") || text.includes("community health")) {
    const efficiency = totalIssues > 0 ? Math.round((resolvedCount / totalIssues) * 100) : 0;
    reply = `### Community Health & Infrastructure Status\nHere is your high-level community report:\n\n- **Resolved Efficiency**: **${efficiency}%** (${resolvedCount} of ${totalIssues} issues resolved)\n- **Active Pending Issues**: **${pendingCount}** active reports needing attention\n- **Average Verifier Trust**: **${avgTrustScore}%** reliability\n\nOur current community health rating is **High**. We have a very supportive, highly responsive network of citizen validators helping city dispatchers track municipal progress!`;
  } else if (text.includes("how") && text.includes("report")) {
    reply = "Reporting is simple! Just click the floating 'Report an Issue' button, upload an image or scan with Gemini, specify the category and description, drag the pin to the live location on the map, and tap submit. Our AI will automatically predict severity and route it to city crews!";
  } else if (text.includes("pothole") || text.includes("road")) {
    reply = "Pot-holes are immediately routed to our Road Patch Dispatch. If you can provide a close-up image of the pothole, our AI will automatically estimate its width and depth to request the appropriate grade of gravel and asphalt. Major ones on highway roads are usually addressed within 24 hours!";
  } else if (text.includes("reward") || text.includes("reputation") || text.includes("level") || text.includes("point")) {
    reply = "Urban Mind rewards citizens for civic engagement! You earn reputation points when you file reports, and extra points when other community members upvote/verify them. Unlocking achievements like 'First Responder' and 'Civic Validator' promotes you on our city leaderboard!";
  } else if (text.includes("water") || text.includes("leak") || text.includes("flood")) {
    reply = "Water leaks are highly urgent! Clean water leaks are assigned critical priority to prevent erosion of the street foundation. If you see active water pooling, submit a report with location tags so we can initiate localized valve shutdown procedures immediately.";
  }

  return { text: reply, simulated: true };
}

function runSimulatedPredictiveRiskEngine(
  hPotholes: number,
  hGarbage: number,
  hWater: number,
  hLights: number,
  weatherCondition: string,
  trust: number,
  verifiedCount: number,
  unverifiedCount: number,
  demographics: { popDensity: string; vulnerabilityIndex: number; socioeconomicIndex: number } = { popDensity: "medium", vulnerabilityIndex: 50, socioeconomicIndex: 60 },
  urbanPlanning: { pipeAge: string; pavementMaterial: string; transitProximity: string } = { pipeAge: "mid", pavementMaterial: "asphalt", transitProximity: "medium" }
) {
  let potholeRisk = Math.min(95, Math.round(hPotholes * 5.5 + 15));
  let garbageRisk = Math.min(95, Math.round(hGarbage * 6.0 + 10));
  let waterRisk = Math.min(95, Math.round(hWater * 8.0 + 12));
  let lightRisk = Math.min(95, Math.round(hLights * 7.0 + 8));

  // Incorporate Demographics and Urban Planning into calculations:
  // Pavement Material adjustments
  if (urbanPlanning.pavementMaterial === "concrete") {
    potholeRisk = Math.round(potholeRisk * 0.75); // Concrete pavement resists potholes
  } else if (urbanPlanning.pavementMaterial === "cobblestone") {
    potholeRisk = Math.round(potholeRisk * 0.85); // Cobblestone resists potholes but suffers from layout shifting
  }

  // Transit Proximity fatigue factor
  if (urbanPlanning.transitProximity === "high") {
    potholeRisk = Math.round(potholeRisk * 1.25); // Heavy transit traffic fatigue
    garbageRisk = Math.round(garbageRisk * 1.20); // Busy transit zones aggregate refuse
  } else if (urbanPlanning.transitProximity === "low") {
    potholeRisk = Math.round(potholeRisk * 0.85);
    garbageRisk = Math.round(garbageRisk * 0.85);
  }

  // Population Density impacts
  if (demographics.popDensity === "high") {
    garbageRisk = Math.round(garbageRisk * 1.3); // High usage
    lightRisk = Math.round(lightRisk * 1.15); // High importance for public safety in crowded zones
  } else if (demographics.popDensity === "low") {
    garbageRisk = Math.round(garbageRisk * 0.75);
    lightRisk = Math.round(lightRisk * 0.9);
  }

  // Socioeconomic index garbage overflow factor
  if (demographics.socioeconomicIndex < 40) {
    garbageRisk = Math.min(98, garbageRisk + 12); // Under-resourced or high-density zones experience garbage stress
  }

  // Subterranean Pipe Age impact on water leaks
  if (urbanPlanning.pipeAge === "old") {
    waterRisk = Math.min(99, Math.round(waterRisk * 1.35 + 15)); // Corroding iron mains rupture
  } else if (urbanPlanning.pipeAge === "new") {
    waterRisk = Math.round(waterRisk * 0.65); // High integrity polymer lines
  }

  // Vulnerable population safety impact on streetlight repairs prioritization
  if (demographics.vulnerabilityIndex > 60) {
    lightRisk = Math.min(99, Math.round(lightRisk * 1.18 + 5)); // Amplifies impact score due to elderly/disabled safety hazards
  }

  let weatherDesc = "Standard seasonal conditions.";
  let summaryText = "";

  if (weatherCondition === "heavy_storm") {
    potholeRisk = Math.min(99, Math.round(potholeRisk * 1.5 + 25));
    waterRisk = Math.min(99, Math.round(waterRisk * 1.6 + 30));
    garbageRisk = Math.min(95, Math.round(garbageRisk * 1.2 + 15));
    lightRisk = Math.min(98, Math.round(lightRisk * 1.4 + 20));
    weatherDesc = "Severe heavy storm with rainfall accumulation exceeding 1.8 inches per hour and localized high wind gusts.";
    summaryText = `Critical stress levels triggered. Substantial precipitation saturation introduces extreme hydraulic pipeline pressures across ${urbanPlanning.pipeAge} grids, causing iron joint failures, and rapid asphalt base weakening that splits the ${urbanPlanning.pavementMaterial} pavement apart.`;
  } else if (weatherCondition === "heatwave") {
    potholeRisk = Math.min(90, Math.round(potholeRisk * 0.9));
    waterRisk = Math.min(99, Math.round(waterRisk * 1.7 + 35));
    garbageRisk = Math.min(98, Math.round(garbageRisk * 1.5 + 25));
    lightRisk = Math.min(95, Math.round(lightRisk * 1.3 + 15));
    weatherDesc = "Extreme summer heatwave profile with prolonged sustained ambient temperatures exceeding 98°F.";
    summaryText = `Substantial hydraulic expansion warnings and municipal sanitation overload indicators. Rising temperatures speed up decomposition in high density (${demographics.popDensity}) areas, resulting in immediate organic waste overflows and critical power grid stress.`;
  } else if (weatherCondition === "freeze") {
    potholeRisk = Math.min(99, Math.round(potholeRisk * 1.8 + 40));
    waterRisk = Math.min(99, Math.round(waterRisk * 1.5 + 25));
    garbageRisk = Math.min(85, Math.round(garbageRisk * 0.8));
    lightRisk = Math.min(95, Math.round(lightRisk * 1.2 + 10));
    weatherDesc = "Sustained sub-freezing arctic air mass resulting in ice expansion inside cracks.";
    summaryText = `High pothole and pipe burst threat profile. Water trapped in ${urbanPlanning.pavementMaterial} cracks expands upon freezing, shattering the road substrate. Simultaneously, shallow water mains contract rapidly, bursting aged (${urbanPlanning.pipeAge}) seals.`;
  } else {
    potholeRisk = Math.max(5, Math.min(90, Math.round(potholeRisk * 0.95)));
    waterRisk = Math.max(5, Math.min(90, Math.round(waterRisk * 0.95)));
    garbageRisk = Math.max(5, Math.min(90, Math.round(garbageRisk * 1.0)));
    lightRisk = Math.max(5, Math.min(90, Math.round(lightRisk * 0.9)));
    weatherDesc = "Clear skies, nominal humidity, and moderate gentle breeze.";
    summaryText = "NOMINAL city indicators. Baseline risk models are driven primarily by unresolved historical complaints and delayed verification queues.";
  }

  const confidencePenalty = Math.max(0, 100 - trust);
  if (confidencePenalty > 30) {
    potholeRisk = Math.max(10, Math.round(potholeRisk * (trust / 100)));
    garbageRisk = Math.max(10, Math.round(garbageRisk * (trust / 100)));
    waterRisk = Math.max(10, Math.round(waterRisk * (trust / 100)));
    lightRisk = Math.max(10, Math.round(lightRisk * (trust / 100)));
  }

  const overallRiskScore = Math.round((potholeRisk + garbageRisk + waterRisk + lightRisk) * 0.25);
  let overallStatusLabel = "MINIMAL";
  if (overallRiskScore >= 80) overallStatusLabel = "CATASTROPHIC";
  else if (overallRiskScore >= 60) overallStatusLabel = "SEVERE";
  else if (overallRiskScore >= 35) overallStatusLabel = "ELEVATED";

  return {
    overallRiskScore,
    overallStatusLabel,
    summary: summaryText,
    predictions: {
      potholeFormation: {
        riskScore: potholeRisk,
        explanation: `Pavement degradation coefficient heavily impacted by the ${weatherCondition} multiplier on ${urbanPlanning.pavementMaterial} substrate. High transit hub proximity (${urbanPlanning.transitProximity}) amplifies fatigue rate. Historical base load of ${hPotholes} complaints aggregates stress nodes.`,
        hotspotZones: ["SoMa Sector Crossings", "Mission Corridor Intersection"]
      },
      garbageOverflow: {
        riskScore: garbageRisk,
        explanation: `Sanitation discharge risk indices map closely to ${hGarbage} active bins under ${demographics.popDensity} population density. Proximity to transit hubs (${urbanPlanning.transitProximity}) and socioeconomic score of ${demographics.socioeconomicIndex}/100 drives refuse accumulation multipliers.`,
        hotspotZones: ["Mission Residential Parks", "Valencia Commercial District"]
      },
      waterLeakage: {
        riskScore: waterRisk,
        explanation: `Mainline seal fatigue triggers easily under high thermal/volume loads. Vulnerability is elevated due to ${urbanPlanning.pipeAge} piping infrastructure. Verified ${hWater} incidents indicates active soil degradation.`,
        hotspotZones: ["Soma Tech Hub", "Dolores Water Junction 4"]
      },
      lightingFailure: {
        riskScore: lightRisk,
        explanation: `Smart light bulb aging and transformer strain. High risk consequence for a neighborhood with ${demographics.vulnerabilityIndex}% vulnerable population index. Historical ${hLights} dark patches highlight critical circuits.`,
        hotspotZones: ["Mission Ward Alleyways", "Dolores West Park Path"]
      }
    },
    cascadingRisks: [
      { trigger: `${weatherCondition === 'heavy_storm' ? 'Heavy Rain Storm' : 'Weather conditions'} on ${urbanPlanning.pavementMaterial} surface`, impact: "Localized drainage back-pressure leaks, flushing debris into sewer networks, weakening road foundations", probability: Math.round(waterRisk * 0.9) },
      { trigger: `Unlit Streetlights in ${demographics.popDensity} Density District`, impact: "Heightened security hazards for vulnerable population group (elderly, kids) and transit passengers", probability: Math.round(lightRisk * 0.8) },
      { trigger: `Aged Subterranean Pipelines (${urbanPlanning.pipeAge}) + Asphalt Stress`, impact: "Undermining of the streetbed resulting in secondary subsurface sinkholes and water main bursts", probability: Math.round((potholeRisk + waterRisk) * 0.45) }
    ],
    preventativeActions: [
      {
        title: "Pre-empt Pothole Resurfacing",
        audience: "Municipal Crews",
        priority: potholeRisk >= 70 ? "high" : "medium",
        description: "Dispatch preventative cold-mix tar crews to minor pavement micro-cracks before moisture triggers complete road substrate failures."
      },
      {
        title: "Clear Catch Basin Gutter Grates",
        audience: "Community Volunteers",
        priority: weatherCondition === "heavy_storm" ? "high" : "low",
        description: "Rake leaves and clear garbage bins from storm drains to prevent upstream street level ponding and hydraulic pipeline backpressure."
      },
      {
        title: "Calibrate Transformers & Photo-sensors",
        audience: "Municipal Crews",
        priority: lightRisk >= 75 ? "high" : "medium",
        description: "Verify substations are shielded from overheating or water intrusion and clean ambient dust from photo-sensors."
      }
    ],
    simulated: true
  };
}

// ==================== API ENDPOINTS ====================

// 1. Image & Text Scan (Google Lens inspired)
app.post("/api/analyze-issue", async (req, res) => {
  const { title, description, imageBase64, mimeType } = req.body;
  const ai = getGemini();

  if (!ai) {
    console.log("Running simulated AI issue analysis.");
    return res.json(runSimulatedAnalyzeIssue(title, description, imageBase64));
  }

  try {
    const parts: any[] = [];
    let prompt = `You are a professional Civic Intelligence Agent working for the city's Urban Mind platform.
Analyze this citizen reported issue.
Citizen input title: "${title || 'Untitled'}"
Citizen input description: "${description || 'No description provided.'}"

Extract and refine the issue details into a structural JSON object.
Return ONLY a valid JSON block containing:
{
  "categorySuggested": "pothole" | "garbage" | "water_leak" | "broken_streetlight" | "graffiti" | "tree_hazard" | "general",
  "title": "Refined professional title for city work orders",
  "descriptionRefined": "A detailed, professionally structured description describing the technical issues, hazards, and exact public safety implications",
  "severityPrediction": "low" | "medium" | "high" | "critical",
  "urgencyScore": number (between 0 and 100),
  "resolutionEstimate": "A constructive, detailed plan or scheduling work update for city workers and citizens."
}`;

    parts.push({ text: prompt });

    if (imageBase64 && mimeType) {
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: imageBase64
        }
      });
    }

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            categorySuggested: { type: Type.STRING, description: "Category of civic hazard" },
            title: { type: Type.STRING, description: "Refined professional title" },
            descriptionRefined: { type: Type.STRING, description: "Detailed structural breakdown of the issue" },
            severityPrediction: { type: Type.STRING, description: "Calculated severity level" },
            urgencyScore: { type: Type.INTEGER, description: "Urgency percentage score from 0-100" },
            resolutionEstimate: { type: Type.STRING, description: "Immediate work dispatch plan estimate" }
          },
          required: ["categorySuggested", "title", "descriptionRefined", "severityPrediction", "urgencyScore", "resolutionEstimate"]
        }
      }
    });

    const bodyText = response.text;
    if (!bodyText) throw new Error("Empty response received from Gemini.");
    const parsed = JSON.parse(bodyText.trim());
    return res.json({ ...parsed, simulated: false });
  } catch (error: any) {
    console.warn("Gemini scanning issue error, invoking simulated fallback:", error);
    return res.json(runSimulatedAnalyzeIssue(title, description, imageBase64));
  }
});

// 1b. Gemini Vision Integration Endpoint
app.post("/api/gemini-vision", async (req, res) => {
  const { image, mimeType } = req.body;
  const ai = getGemini();

  if (!image) {
    return res.status(400).json({ error: "Image content is required (base64 encoded string)." });
  }

  // Fallback simulation when Gemini client is not initialized or configured
  if (!ai) {
    console.log("Running simulated Gemini Vision analysis.");
    return res.json(runSimulatedGeminiVision(image));
  }

  try {
    const cleanBase64 = image.includes(",") ? image.split(",")[1] : image;
    const finalMimeType = mimeType || "image/jpeg";

    const imagePart = {
      inlineData: {
        mimeType: finalMimeType,
        data: cleanBase64
      }
    };

    const textPart = {
      text: `Analyze this uploaded image reporting a city infrastructure issue, public safety hazard, or urban maintenance concern.
Classify the issue, estimate its hazard severity, provide your confidence percentage, write a professional structural summary, and select the correct city authority department responsible for scheduling repairs.

Response MUST comply strictly with the JSON Schema rules requested.`
    };

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, description: "Category of hazard (e.g. Road Pothole, Broken Streetlight, Sewage Overflow, Graffiti, Tree Obstruction)" },
            severity: { type: Type.STRING, description: "One of: low, medium, high, critical" },
            confidence: { type: Type.STRING, description: "A percentage confidence level, e.g. 96%" },
            summary: { type: Type.STRING, description: "A technical 1-2 sentence description summarizing the photo content clearly and concisely" },
            department: { type: Type.STRING, description: "Specific municipal crew or public utility department that should patch it" }
          },
          required: ["category", "severity", "confidence", "summary", "department"]
        }
      }
    });

    const bodyText = response.text;
    if (!bodyText) throw new Error("Null response content returned from Gemini Vision API.");
    const parsed = JSON.parse(bodyText.trim());
    return res.json({ ...parsed, simulated: false });
  } catch (err: any) {
    console.warn("Gemini Vision processing failed, invoking simulated fallback:", err);
    return res.json(runSimulatedGeminiVision(image));
  }
});

// 2. Multi-turn AI Assistant Chatbot
app.post("/api/chat", async (req, res) => {
  const { messages, issues, user } = req.body; // array of { sender: 'user'|'assistant', text: string }, Issue[], user object
  const ai = getGemini();

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required." });
  }

  const latestUserMessage = messages[messages.length - 1]?.text || "Hello";

  // Pre-process issues to provide context for both live AI and simulation modes
  const unresolvedIssues = Array.isArray(issues) ? issues.filter(i => i.status !== "resolved") : [];
  const userIssues = Array.isArray(issues) && user ? issues.filter(i => i.reportedBy === user.name || i.reporterId === user.id) : [];
  
  // Format unresolved issues
  const unresolvedSummary = unresolvedIssues.slice(0, 15).map(i => 
    `- [ID: ${i.id}] "${i.title}" (category: ${i.category}) at "${i.locationName}" (${i.lat}, ${i.lng}) - Status: ${i.status}, Severity: ${i.severity}, Trust Score: ${i.trustScore}%`
  ).join("\n");

  // Format user's issues
  const userIssuesSummary = userIssues.length > 0 ? userIssues.map(i =>
    `- [ID: ${i.id}] "${i.title}" - Status: ${i.status}, Severity: ${i.severity}, Trust Score: ${i.trustScore}%. History: ${i.history?.map(h => `${h.status} (${h.note})`).join(" -> ")}`
  ).join("\n") : "No issues reported by this user yet.";

  // Format community health summary metrics
  const totalIssues = Array.isArray(issues) ? issues.length : 0;
  const resolvedCount = Array.isArray(issues) ? issues.filter(i => i.status === "resolved").length : 0;
  const pendingCount = totalIssues - resolvedCount;
  const avgTrustScore = unresolvedIssues.length > 0 
    ? Math.round(unresolvedIssues.reduce((acc, curr) => acc + (curr.trustScore || 50), 0) / unresolvedIssues.length)
    : 75;

  if (!ai) {
    console.log("Running simulated chatbot responder with live context.");
    return res.json(runSimulatedChat(latestUserMessage, unresolvedIssues, userIssues, user, totalIssues, resolvedCount, pendingCount, avgTrustScore));
  }

  try {
    // Formulate a proper chat payload for Gemini API
    // Convert previous array to Gemini content parts, ensuring it starts with a user message
    const historyToConvert = messages.slice(0, -1);
    const firstUserIdx = historyToConvert.findIndex((m: any) => m.sender === 'user');
    const filteredHistory = firstUserIdx !== -1 ? historyToConvert.slice(firstUserIdx) : [];

    const chatHistory = filteredHistory.map((m: any) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    const systemInstruction = `You are "Civic Agent AI", a highly polite, helpful, and professional virtual civic guide on the "Urban Mind" platform.
Your job is to answer citizens' questions about local infrastructure, help them compile reports, explain how municipal repair schedules work, explain the gamification achievements, and offer guidance on public works processes.

Here is the current real-time state of the community's infrastructure reports:

[CURRENT USER CONTEXT]
- Name: ${user?.name || "Anshdeep Singh"}
- Role: ${user?.role || "citizen"}
- Location: Dolores Park Entrance (37.7599, -122.4269)

[UNRESOLVED ISSUES IN THE COMMUNITY]
${unresolvedSummary || "No active unresolved issues reported!"}

[ISSUES REPORTED BY THIS USER]
${userIssuesSummary}

[COMMUNITY HEALTH SUMMARY METRICS]
- Total Reports Logged: ${totalIssues}
- Resolved Issues: ${resolvedCount}
- Active Pending/Verified/In-Progress Issues: ${pendingCount}
- Average Community Trust Level: ${avgTrustScore}%

When a user asks:
1. "Show nearby unresolved issues" -> List the unresolved issues that are near the user's location (37.7599, -122.4269). Describe their general location (e.g. "El Camino Real", "Dolores Park Entrance"). State their titles, categories, severity, trust scores, and encourage verification.
2. "Why is my issue pending" -> Look at the user's reported issues and explain why they are pending. For example, explain if it's because they need more community verifications (need upvotes), are in the 'reported' status, or are being triaged by public works.
3. "Which area has the highest risk" -> Perform a spatial risk assessment of the current unresolved issues and describe which locations or zones are under highest stress (e.g., El Camino Real due to severe potholes, Dolores Park due to sanitation overflows, etc.).
4. "Show community health summary" -> Provide a comprehensive civic report summarizing active vs resolved cases, the overall community trust index, and a general progress report of local public works.

Always remain friendly, encouraging, and supportive of civil participation. Be concise, keeping responses under 3 paragraphs, using clear formatting (bullet points, bold highlights) for readability. Do not mention system-internal terms like "JSON", "payload", "system instructions", or "simulation data". Present all calculations as live real-time analysis.`;

    let response;
    try {
      const chat = ai.chats.create({
        model: "gemini-3.5-flash",
        config: {
          systemInstruction,
          temperature: 0.7
        },
        history: chatHistory as any
      });
      response = await chat.sendMessage({ message: latestUserMessage });
    } catch (e1: any) {
      const errMsg1 = e1?.message || String(e1);
      if (errMsg1.includes("RESOURCE_EXHAUSTED") || errMsg1.includes("429") || errMsg1.includes("Quota exceeded") || errMsg1.includes("quota")) {
        isQuotaExhausted = true;
        quotaExhaustedAt = Date.now();
        throw e1;
      }
      console.warn("[Gemini Chat Engine] gemini-3.5-flash failed. Retrying with gemini-3.1-flash-lite...", e1);
      
      try {
        const chat = ai.chats.create({
          model: "gemini-3.1-flash-lite",
          config: {
            systemInstruction,
            temperature: 0.7
          },
          history: chatHistory as any
        });
        response = await chat.sendMessage({ message: latestUserMessage });
      } catch (e2: any) {
        const errMsg2 = e2?.message || String(e2);
        if (errMsg2.includes("RESOURCE_EXHAUSTED") || errMsg2.includes("429") || errMsg2.includes("Quota exceeded") || errMsg2.includes("quota")) {
          isQuotaExhausted = true;
          quotaExhaustedAt = Date.now();
          throw e2;
        }
        console.warn("[Gemini Chat Engine] gemini-3.1-flash-lite failed. Retrying with gemini-3.1-pro-preview...", e2);
        
        const chat = ai.chats.create({
          model: "gemini-3.1-pro-preview",
          config: {
            systemInstruction,
            temperature: 0.7
          },
          history: chatHistory as any
        });
        response = await chat.sendMessage({ message: latestUserMessage });
      }
    }
    return res.json({ text: response.text, simulated: false });
  } catch (error: any) {
    console.warn("Gemini Chat Error, invoking simulated fallback:", error);
    return res.json(runSimulatedChat(latestUserMessage, unresolvedIssues, userIssues, user, totalIssues, resolvedCount, pendingCount, avgTrustScore));
  }
});

// 3. Summarize Community Discussion Sentiment
app.post("/api/summarize-discussion", async (req, res) => {
  const { comments } = req.body;
  const ai = getGemini();

  if (!comments || !Array.isArray(comments) || comments.length === 0) {
    return res.json({ summary: "No community discussion comments recorded yet." });
  }

  const commentsText = comments.map(c => `- ${c.author} (Reputation: ${c.reputationScore}): "${c.text}"`).join("\n");

  const fallbackSummary = {
    summary: `Community review analysis: citizens agree that this issue possesses high immediate relevance. Recommended resolution action has been validated, and local contributors are actively tracking updates.`,
    simulated: true
  };

  if (!ai) {
    return res.json(fallbackSummary);
  }

  try {
    const prompt = `You are a city council summarizer. Take the following community feedback comments gathered from a civic portal and generate a succinct, objective, 2-3 sentence summary of the general sentiment, additional details mentioned (like impact, duration, severity), and the consensus view of the public:

Comments:
${commentsText}`;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.3
      }
    });

    return res.json({ summary: response.text, simulated: false });
  } catch (error: any) {
    console.warn("Gemini Discussion Summarization Error, invoking simulated fallback:", error);
    return res.json(fallbackSummary);
  }
});

// 4. City risk predictions (Predictive environmental index)
app.post("/api/predict-risk", async (req, res) => {
  const { zoneName, reportsCount, activeConcern } = req.body;
  const ai = getGemini();

  const getFallbackPrediction = () => {
    const calculatedRisk = Math.min(Math.round((reportsCount || 10) * 1.5 + (activeConcern === "Water Leakage" ? 25 : 10)), 100);
    return {
      prediction: `Based on localized environmental factors and a current threshold of ${reportsCount || 10} reported incidents, this area has a community hazard index of ${calculatedRisk}%. High surveillance is advised for local pipe foundations.`,
      simulated: true
    };
  };

  if (!ai) {
    return res.json(getFallbackPrediction());
  }

  try {
    const prompt = `Analyze the infrastructure health of a city neighborhood zone with the following data:
Zone name: ${zoneName}
Recent reported incidents: ${reportsCount}
Major/Active concern: ${activeConcern}

Provide an intelligence brief representing the predictive infrastructure risk profile:
1. Explain potential domino effects (e.g., how water leakage could undermine paving causing potholes, or failing lights leading to increased nighttime vandalism).
2. Rate immediate public hazard index (0-100%).
3. Suggest a proactive preventative measure city services could take before failure occurs.
Keep your analysis extremely professional, concise, and structured in under 150 words.`;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.5
      }
    });

    return res.json({ prediction: response.text, simulated: false });
  } catch (error: any) {
    console.warn("Gemini Risk Prediction Error, invoking simulated fallback:", error);
    return res.json(getFallbackPrediction());
  }
});

// ==================== COMMUNITY VERIFICATION & TRUST SCORE ====================

/**
 * DATABASE SCHEMA BLUEPRINTS FOR VERIFICATION ENGINE
 * 
 * --- FIRESTORE NoSQL Schema ---
 * Collections structure:
 * 1. issues (collection) -> {
 *      id: string (PK),
 *      title: string,
 *      ...,
 *      trustScore: number,          // Calculated dynamic trust level [0-100]
 *      verificationsCount: number,  // Cache count of validations
 *    }
 * 2. verifications (sub-collection / issues/{issueId}/verifications) -> {
 *      id: string (PK),
 *      issueId: string (FK),
 *      verifierName: string,
 *      verifierId: string,
 *      type: "confirm" | "reject",
 *      evidence: string,            // Citizen narrative / explanation
 *      evidenceUrl: string,         // Optional proof photo URL
 *      distanceMeters: number,      // GPS proximity verification distance
 *      reputationAtVerification: number, // Verifier XP multiplier at timestamp
 *      createdAt: string            // Timestamp ISO string
 *    }
 * 
 * --- POSTGRESQL RELATIONAL Schema ---
 * CREATE TABLE verifications (
 *   id VARCHAR(50) PRIMARY KEY,
 *   issue_id VARCHAR(50) NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
 *   verifier_name VARCHAR(100) NOT NULL,
 *   verifier_id VARCHAR(50) NOT NULL,
 *   type VARCHAR(10) NOT NULL CHECK (type IN ('confirm', 'reject')),
 *   evidence TEXT,
 *   evidence_url VARCHAR(255),
 *   distance_meters DECIMAL(10, 2) NOT NULL,
 *   reputation_at_verification INTEGER NOT NULL DEFAULT 0,
 *   created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
 * );
 * 
 * CREATE INDEX idx_verifications_issue_id ON verifications(issue_id);
 */

// Formula engine to calculate precise community trust scores
function calculateCommunityTrustScore(
  reporterReputation: number,
  verifications: any[]
): { score: number; explanation: any; weightBreakdown: any[] } {
  // Base score begins neutral at 50%
  let score = 50;
  
  // Include initial reporter trustworthiness (highly active reporters grant up to +15% baseline confidence)
  const reporterBonus = Math.min(reporterReputation / 150, 15);
  score += reporterBonus;

  if (verifications.length === 0) {
    return {
      score: Math.min(Math.round(score), 99),
      explanation: {
        baseScore: 50,
        reporterBonus: Math.round(reporterBonus),
        verificationsContribution: 0,
        formula: "Base (50) + Reporter Reputation Bonus"
      },
      weightBreakdown: []
    };
  }

  let totalPositiveWeight = 0;
  let totalNegativeWeight = 0;
  const weightBreakdown: any[] = [];

  verifications.forEach((v) => {
    // 1. Reputation Weight Modifier: Users with more contributions have more trusted votes
    const repModifier = 1.0 + Math.min((v.reputationAtVerification || 0) / 1000, 1.5); // ranges 1.0 to 2.5
    
    // 2. Proximity Modifier: Physical presence counts more!
    let proximityModifier = 1.0;
    if (v.distanceMeters <= 50) {
      proximityModifier = 1.5; // High confidence within 50 meters
    } else if (v.distanceMeters <= 200) {
      proximityModifier = 1.25; // Good confidence within 200 meters
    } else if (v.distanceMeters > 1000) {
      proximityModifier = 0.5; // Degraded weight for distant verifications (>1km)
    }

    // 3. Evidence Modifier: Verification with explanations is far more reliable
    let evidenceModifier = 1.0;
    if (v.evidence && v.evidence.trim().length >= 15) {
      evidenceModifier = 1.2; // +20% weight if detailed evidence is written
    }

    // Total weight of this individual community assertion
    const totalWeight = parseFloat((repModifier * proximityModifier * evidenceModifier).toFixed(2));

    weightBreakdown.push({
      verifier: v.verifierName,
      type: v.type,
      distance: `${v.distanceMeters}m`,
      reputation: v.reputationAtVerification,
      factors: { repModifier, proximityModifier, evidenceModifier },
      totalWeight
    });

    if (v.type === 'confirm') {
      totalPositiveWeight += totalWeight;
    } else {
      totalNegativeWeight += totalWeight;
    }
  });

  // Calculate dynamic consensus ratio
  // Confirmations boost trust (+12 per weight), Rejections degrade trust (-20 per weight)
  const verificationsContribution = (totalPositiveWeight * 12) - (totalNegativeWeight * 20);
  score += verificationsContribution;

  // Clamp the final score strictly between 5% and 99%
  const finalScore = Math.max(5, Math.min(99, Math.round(score)));

  return {
    score: finalScore,
    explanation: {
      baseScore: 50,
      reporterBonus: Math.round(reporterBonus),
      verificationsContribution: parseFloat(verificationsContribution.toFixed(2)),
      totalPositiveWeight: parseFloat(totalPositiveWeight.toFixed(2)),
      totalNegativeWeight: parseFloat(totalNegativeWeight.toFixed(2)),
      formula: "Base (50) + Reporter Bonus + (TotalConfirmWeight * 12) - (TotalRejectWeight * 20)"
    },
    weightBreakdown
  };
}

app.post("/api/verify-issue", (req, res) => {
  const { issueId, verifications, reporterReputation, newVerification } = req.body;
  
  if (!issueId || !Array.isArray(verifications)) {
    return res.status(400).json({ error: "Missing issueId or verifications array." });
  }

  let activeVerifications = [...verifications];

  if (newVerification) {
    const verifiedObj = {
      id: `v-${Date.now()}`,
      issueId,
      verifierName: newVerification.verifierName || "Anonymous Hero",
      verifierId: newVerification.verifierId || `user-${Date.now()}`,
      type: newVerification.type,
      evidence: newVerification.evidence || "",
      evidenceUrl: newVerification.evidenceUrl || "",
      distanceMeters: parseFloat(newVerification.distanceMeters) || 0,
      reputationAtVerification: parseInt(newVerification.reputationAtVerification) || 0,
      createdAt: new Date().toISOString()
    };
    activeVerifications.push(verifiedObj);
  }

  const result = calculateCommunityTrustScore(
    parseInt(reporterReputation) || 0,
    activeVerifications
  );

  return res.json({
    issueId,
    verifications: activeVerifications,
    trustScore: result.score,
    explanation: result.explanation,
    weightBreakdown: result.weightBreakdown
  });
});

app.post("/api/community-health-score", async (req, res) => {
  const { potholes, garbage, waterIssues, streetlights } = req.body;

  // 1. Calculate Core Indices mathematically (Guarantees reliability and transparency)
  const countPotholes = Math.max(0, parseInt(potholes) || 0);
  const countGarbage = Math.max(0, parseInt(garbage) || 0);
  const countWater = Math.max(0, parseInt(waterIssues) || 0);
  const countLights = Math.max(0, parseInt(streetlights) || 0);

  // Formulas (higher reports degrade health indices)
  const roadHealth = Math.max(10, Math.min(100, 100 - (countPotholes * 7)));
  const cleanliness = Math.max(10, Math.min(100, 100 - (countGarbage * 8)));
  const waterInfrastructure = Math.max(10, Math.min(100, 100 - (countWater * 12)));
  const safetyIndex = Math.max(10, Math.min(100, 100 - (countLights * 9)));

  // Weighted overall community health score (Equal weighting for broad coverage)
  const overallScore = Math.round(
    (roadHealth * 0.25) +
    (cleanliness * 0.25) +
    (waterInfrastructure * 0.25) +
    (safetyIndex * 0.25)
  );

  const ai = getGemini();

  if (!ai) {
    // Elegant Simulation Fallback
    console.log("Running simulated AI health diagnostics.");
    
    // Choose status label based on overall score
    let statusLabel = "EXCELLENT";
    let textSummary = "The neighborhood is in outstanding health. Low reports across all infrastructure categories indicate high public satisfaction and responsive municipal dispatch. No immediate risk alerts are flagged.";
    
    if (overallScore < 45) {
      statusLabel = "CRITICAL DEGRADATION";
      textSummary = "Multiple critical systemic stressors detected. High levels of outstanding safety, water, and road hazards indicate severe dispatch delays. Actionable municipal dispatch is recommended immediately to prevent cascading infrastructure issues.";
    } else if (overallScore < 70) {
      statusLabel = "NEUTRAL / MODERATE STRAIN";
      textSummary = "The neighborhood is displaying mild to moderate stressors, primarily concentrated in specific zones. Public works should prioritize the highest impact hazards to stabilize local indicators before they escalate.";
    } else if (overallScore < 85) {
      statusLabel = "STABLE / HEALING";
      textSummary = "Neighborhood indicators remain healthy and functional. Standard minor pavement and cleanup issues are logged but do not pose systemic challenges to residents.";
    }

    // Dynamic recommendations depending on which values are highest
    const recs: string[] = [];
    if (countPotholes > 4) {
      recs.push(`Deploy rapid asphalt-patching response to the ${countPotholes} reported potholes to prevent heavy vehicle wheel alignment degradation.`);
    } else {
      recs.push("Maintain standard bi-weekly neighborhood roadway scans for structural micro-fissure pre-treatments.");
    }

    if (countGarbage > 3) {
      recs.push(`Dispatch overflow sanitation units to the ${countGarbage} flagged waste clusters. Recommend installing high-capacity compactors in high-traffic commercial zones.`);
    } else {
      recs.push("Sustain existing bin emptying schedules with active weekend volunteer street sweeps.");
    }

    if (countWater > 2) {
      recs.push(`Initiate immediate hydraulic inspection. Water leaks are highly disruptive and represent structural erosion risks to the sub-pavement strata.`);
    } else {
      recs.push("Perform routine monthly pressure diagnostic assessments across primary hydrants and arterial valves.");
    }

    if (countLights > 3) {
      recs.push(`Expedite street-lighting grid patrol to the ${countLights} dark zones. Street visibility shares a high correlation with local pedestrian safety metrics.`);
    } else {
      recs.push("Verify automatic ambient daylight sensors are operating within nominal tolerance ranges.");
    }

    // Dynamic risk predictions
    let riskAlert = "Minimal environmental or safety risks are forecast for this operational period.";
    if (countWater > 3 && countPotholes > 4) {
      riskAlert = "HIGH RISK: Water leaks in high pothole zones threaten sub-base soil erosion, potentially causing rapid pavement sinkholes or vehicle suspension failures.";
    } else if (countLights > 3) {
      riskAlert = "MODERATE RISK: Unlit arterial roads pose heightened nocturnal traffic risks and diminish general public security feelings.";
    } else if (countGarbage > 4) {
      riskAlert = "ENVIRONMENTAL ALERT: Accumulating municipal waste clusters may trigger pest vector attraction and stormwater drainage blockage.";
    }

    return res.json({
      roadHealth,
      cleanliness,
      waterInfrastructure,
      safetyIndex,
      overallScore,
      statusLabel,
      aiAnalysis: {
        summary: textSummary,
        riskForecast: riskAlert,
        recommendations: recs,
        simulated: true
      }
    });
  }

  try {
    const prompt = `You are a professional urban planner and civic infrastructure analyst. Analyze the following neighborhood health statistics and generate a JSON response.

Neighborhood Report Counts:
- Potholes Reported: ${countPotholes}
- Garbage/Overflow reports: ${countGarbage}
- Water leak/Hydrant issues: ${countWater}
- Broken Streetlight issues: ${countLights}

Computed Indices (0-100, where higher is healthier infrastructure):
- Road Health Index: ${roadHealth}%
- Cleanliness Index: ${cleanliness}%
- Water Infrastructure Index: ${waterInfrastructure}%
- Safety Index: ${safetyIndex}%
- Overall Community Score: ${overallScore}%

Your response must be a valid JSON object containing exactly the following keys:
{
  "statusLabel": "A short, catchy status label (e.g. CRITICAL DEGRADATION, MODERATE STRAIN, STABLE, EXCELLENT) matching the overall score",
  "summary": "A high-quality 2-3 sentence strategic summary analyzing these specific metrics, identifying which area needs urgent focus",
  "riskForecast": "A 1-2 sentence predictive warning about potential cascading risks (e.g., sinkholes, sanitary issues, vehicle accidents, safety concerns) if these are left unaddressed",
  "recommendations": [
    "Three highly specific, actionable operational tips for local community volunteers or public works crews based on the data"
  ]
}

Respond ONLY with the raw JSON. Do not include markdown codeblocks or extra conversational filler text.`;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.25
      }
    });

    const responseText = response.text || "";
    // Clean codeblock characters if returned
    const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const resultJson = JSON.parse(cleanedText);

    return res.json({
      roadHealth,
      cleanliness,
      waterInfrastructure,
      safetyIndex,
      overallScore,
      statusLabel: resultJson.statusLabel || "STABLE",
      aiAnalysis: {
        summary: resultJson.summary || "Health index is stable. Regular maintenance is recommended.",
        riskForecast: resultJson.riskForecast || "No major cascading risks predicted at this time.",
        recommendations: resultJson.recommendations || [
          "Continue monitoring active reports",
          "Prioritize critical hazard verifications",
          "Encourage nearby peer validation logs"
        ],
        simulated: false
      }
    });

  } catch (error: any) {
    console.log("Gemini Health Score Diagnostics Error (using simulated fallback):", error?.message || error);
    // Gracefully fallback to simulation values to prevent breaking the application
    return res.json({
      roadHealth,
      cleanliness,
      waterInfrastructure,
      safetyIndex,
      overallScore,
      statusLabel: overallScore >= 80 ? "EXCELLENT" : (overallScore >= 60 ? "STABLE" : "MODERATE STRAIN"),
      aiAnalysis: {
        summary: `The neighborhood currently holds an overall score of ${overallScore}%. Infrastructure diagnostics recommend prioritizing ${countPotholes > countGarbage ? 'road resurfacing' : 'general neighborhood cleanliness and sanitation dispatch'}.`,
        riskForecast: "Sustained high report rates can cause municipal dispatch queues to experience severe delay multipliers.",
        recommendations: [
          `Address outstanding ${countPotholes} pavement issues through hot-mix asphalt patching.`,
          `Establish direct municipal sanitation dispatch targets for the ${countGarbage} garbage issues.`,
          "Host weekend community trash collection and safety lighting walking audits."
        ],
        simulated: true
      }
    });
  }
});

app.post("/api/digital-twin-analysis", async (req, res) => {
  const { potholes, garbage, waterIssues, streetlights, sector = "all" } = req.body;

  const countPotholes = Math.max(0, parseInt(potholes) || 0);
  const countGarbage = Math.max(0, parseInt(garbage) || 0);
  const countWater = Math.max(0, parseInt(waterIssues) || 0);
  const countLights = Math.max(0, parseInt(streetlights) || 0);

  // Compute standard indices
  const roadHealth = Math.max(10, Math.min(100, 100 - (countPotholes * 7.5)));
  const cleanliness = Math.max(10, Math.min(100, 100 - (countGarbage * 8.5)));
  const waterInfrastructure = Math.max(10, Math.min(100, 100 - (countWater * 13)));
  const safetyIndex = Math.max(10, Math.min(100, 100 - (countLights * 10)));

  const overallScore = Math.round(
    (roadHealth * 0.25) +
    (cleanliness * 0.25) +
    (waterInfrastructure * 0.25) +
    (safetyIndex * 0.25)
  );

  // Sector Specific Risk Calculations
  // 1. Dolores Heights (Focus on water & safety, high standard baseline)
  const doloresRisk = Math.max(5, Math.min(95, Math.round((countWater * 15 + countLights * 12 + countPotholes * 5) * 0.6)));
  
  // 2. SoMa Sector (Focus on roads/potholes, dense tech traffic)
  const somaRisk = Math.max(10, Math.min(98, Math.round((countPotholes * 18 + countLights * 10 + countGarbage * 10) * 0.75)));
  
  // 3. Mission District (Focus on sanitation/garbage & streetlight grids)
  const missionRisk = Math.max(15, Math.min(99, Math.round((countGarbage * 16 + countLights * 14 + countWater * 8) * 0.85)));

  const ai = getGemini();

  if (!ai) {
    // High-fidelity fallback simulated analytics
    const statusLabels = ["OPTIMAL", "STABLE", "VULNERABLE", "CRITICAL"];
    let activeStatus = "STABLE";
    if (overallScore >= 85) activeStatus = "OPTIMAL";
    else if (overallScore >= 65) activeStatus = "STABLE";
    else if (overallScore >= 45) activeStatus = "VULNERABLE";
    else activeStatus = "CRITICAL";

    return res.json({
      roadHealth,
      cleanliness,
      waterInfrastructure,
      safetyIndex,
      overallScore,
      sectorRisks: {
        dolores: doloresRisk,
        soma: somaRisk,
        mission: missionRisk
      },
      statusLabel: activeStatus,
      aiAnalysis: {
        twinStateSummary: `The Digital Twin mesh reports a global synchrony index of ${overallScore}%. Infrastructure simulation indicates localized structural anomalies inside the ${countPotholes > countGarbage ? 'Soma pavement grid' : 'Mission sanitation grid'}. No overall server timeout is reported.`,
        predictiveTimeline: "Within the next 48 hours, unpatched water anomalies present a 34% probability of under-surface soil liquefaction, expanding pothole clusters.",
        anomaliesCount: countPotholes + countGarbage + countWater + countLights,
        recommendations: [
          `Redirect automated municipal dispatch crews to the ${countPotholes} asphalt stress nodes to minimize suspension impact ratings.`,
          `Activate secondary neighborhood sweeping cycles across garbage hotspot clusters.`,
          "Adjust smart grid twilight sensors to compensate for unlit streetlight junctions."
        ],
        simulated: true
      }
    });
  }

  try {
    const prompt = `You are the Civic Digital Twin AI Analyst Engine for San Francisco's Mission, SoMa, and Dolores Heights districts.
Analyze these simulated or active physical parameters of our city grid:

- Total Active Pothole Distress Nodes: ${countPotholes} (Impacts Road Health)
- Total Waste/Garbage Discharges: ${countGarbage} (Impacts Cleanliness)
- Active Hydraulic/Water Leak Pressure Anomalies: ${countWater} (Impacts Water Infrastructure)
- Broken Streetlight Junctions: ${countLights} (Impacts Safety Index)

Calculated Real-Time Telemetry Indices:
- Road Health Index: ${roadHealth}%
- Cleanliness Index: ${cleanliness}%
- Water Infrastructure Index: ${waterInfrastructure}%
- Safety Index: ${safetyIndex}%
- Combined Twin Synced Health Score: ${overallScore}%

Computed Sector Risk Levels (0% to 100% Risk):
- Dolores Heights: ${doloresRisk}% Risk
- SoMa Sector: ${somaRisk}% Risk
- Mission District: ${missionRisk}% Risk

Your response must be a valid JSON object containing exactly the following keys (do not include other text or markup):
{
  "statusLabel": "OPTIMAL, STABLE, VULNERABLE, or CRITICAL depending on combined score",
  "twinStateSummary": "A highly analytical, technical 2-3 sentence twin status report using terminology like telemetry, nodes, grids, and sub-surface structures.",
  "predictiveTimeline": "A 1-2 sentence predictive timeline of what will happen in the city grid within the next 48 to 72 hours if these parameters remain unchecked.",
  "recommendations": [
    "Three highly technical, strategic operational steps for smart city dispatch or volunteer crews to restore balance."
  ]
}

Respond ONLY with raw JSON. Do not write markdown blocks or explain your thinking.`;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.2
      }
    });

    const text = response.text || "";
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanedText);

    return res.json({
      roadHealth,
      cleanliness,
      waterInfrastructure,
      safetyIndex,
      overallScore,
      sectorRisks: {
        dolores: doloresRisk,
        soma: somaRisk,
        mission: missionRisk
      },
      statusLabel: parsed.statusLabel || "STABLE",
      aiAnalysis: {
        twinStateSummary: parsed.twinStateSummary || `Twin synced index holds at ${overallScore}%. Grid telemetry shows mild stress points.`,
        predictiveTimeline: parsed.predictiveTimeline || "Grid indicators are projected to remain within standard tolerances.",
        anomaliesCount: countPotholes + countGarbage + countWater + countLights,
        recommendations: parsed.recommendations || [
          "Initiate rapid pavement patch sweeps in high-traffic commercial zones.",
          "Shed load or deploy mobile maintenance trucks to broken light posts.",
          "Check municipal hydraulic pipelines for drop in main arterial valve pressures."
        ],
        simulated: false
      }
    });

  } catch (error: any) {
    console.log("Twin AI analysis failed, falling back to simulated data:", error?.message || error);
    return res.json({
      roadHealth,
      cleanliness,
      waterInfrastructure,
      safetyIndex,
      overallScore,
      sectorRisks: {
        dolores: doloresRisk,
        soma: somaRisk,
        mission: missionRisk
      },
      statusLabel: overallScore >= 75 ? "STABLE" : "VULNERABLE",
      aiAnalysis: {
        twinStateSummary: `The Digital Twin mesh reports a combined grid synchrony rating of ${overallScore}%. Local stressors persist inside high density zones.`,
        predictiveTimeline: "Within 48 hours, unresolved garbage clusters can compromise nearby hydraulic drains in the Mission District.",
        anomaliesCount: countPotholes + countGarbage + countWater + countLights,
        recommendations: [
          "Establish preventative road repair checkpoints.",
          "Run waste management optimization simulations.",
          "Inspect smart daylight photocells for dusk/dawn triggering."
        ],
        simulated: true
      }
    });
  }
});


// 5. Predictive Infrastructure Risk Engine Endpoint
app.post("/api/predictive-risk-engine", async (req, res) => {
  const {
    historicalReports = { potholesCount: 5, garbageCount: 4, waterCount: 2, lightsCount: 3 },
    weatherCondition = "sunny",
    verificationStats = { verifiedCount: 10, unverifiedCount: 4, averageTrustScore: 75 },
    demographics = { popDensity: "medium", vulnerabilityIndex: 50, socioeconomicIndex: 60 },
    urbanPlanning = { pipeAge: "mid", pavementMaterial: "asphalt", transitProximity: "medium" }
  } = req.body;

  const hPotholes = Math.max(0, parseInt(historicalReports.potholesCount) || 0);
  const hGarbage = Math.max(0, parseInt(historicalReports.garbageCount) || 0);
  const hWater = Math.max(0, parseInt(historicalReports.waterCount) || 0);
  const hLights = Math.max(0, parseInt(historicalReports.lightsCount) || 0);

  const trust = Math.max(5, Math.min(100, parseInt(verificationStats.averageTrustScore) || 50));
  const verifiedCount = Math.max(0, parseInt(verificationStats.verifiedCount) || 0);
  const unverifiedCount = Math.max(0, parseInt(verificationStats.unverifiedCount) || 0);

  const ai = getGemini();

  if (!ai) {
    console.log("Running simulated Predictive Risk calculations.");
    return res.json(runSimulatedPredictiveRiskEngine(hPotholes, hGarbage, hWater, hLights, weatherCondition, trust, verifiedCount, unverifiedCount, demographics, urbanPlanning));
  }

  try {
    const prompt = `You are a professional Urban Data Scientist and Civic Risk Modeler running San Francisco's Predictive Infrastructure Risk Engine.
Analyze the following parameters to calculate real-time risks for municipal services:

[HISTORICAL RECORDS]
- Historical active potholes: ${hPotholes}
- Historical active garbage overflows: ${hGarbage}
- Historical water leak pressure drops: ${hWater}
- Historical dark streetlights reported: ${hLights}

[WEATHER INPUT FACTORS]
- Weather Condition Profile: ${weatherCondition}
- Micro-climate details: ${
      weatherCondition === "heavy_storm" ? "Heavy torrential downpours, wind gusts up to 45mph, soil saturation rating 90%" :
      weatherCondition === "heatwave" ? "Prolonged sun exposure, thermal peak 102F, metal expansion multiplier 1.4" :
      weatherCondition === "freeze" ? "Sub-freezing, frost heave cycle, frozen pipeline volume contraction" :
      "Sunny, gentle breeze, nominal humidity, minimal soil expansion"
    }

[SOCIO-DEMOGRAPHIC MATRIX]
- Population Density Level: ${demographics.popDensity}
- Vulnerable Population Ratio (elderly, kids, disabled): ${demographics.vulnerabilityIndex}%
- Socioeconomic Opportunity Index: ${demographics.socioeconomicIndex}/100

[URBAN PLANNING & SUBSTRATE INFRASTRUCTURE]
- Subterranean Pipe Asset Age Group: ${urbanPlanning.pipeAge}
- Surface Pavement Substrate Material: ${urbanPlanning.pavementMaterial}
- Proximity to Public Transit Hubs: ${urbanPlanning.transitProximity}

[COMMUNITY VERIFICATION DATA]
- Total Confirmed / Verified Reports: ${verifiedCount}
- Unverified/Flagged Reports: ${unverifiedCount}
- Average Report Trust Score: ${trust}%
(Note: Low report trust indicates potential false alarms or spatial errors. High trust confirms actual ground truth)

Predict:
1. Pothole formation risk (0-100)
2. Garbage overflow risk (0-100)
3. Water leakage/pipe burst risk (0-100)
4. Lighting failure risk (0-100)

Your risk scores must take into account demographic vulnerabilities and urban infrastructure layout:
- Pavement materials like concrete or cobblestone have higher resilience to potholes but might suffer different wear multipliers.
- Old pipes expand or burst faster in extreme freeze or heatwave profiles.
- Highly dense populated or high transit-proximity areas aggregate garbage and asphalt fatigue faster.
- Highly vulnerable population ratios make unlit streetlights highly severe for public security.

Return a JSON object containing accurate predictions, specific hotspot sectors (SoMa, Dolores, Mission, etc.), inter-dependent cascading risk triggers/impacts/probabilities, and actionable preventative checklists.

Return ONLY a valid JSON block matching this exact JSON Schema:
{
  "overallRiskScore": number (combined risk indicator [0-100]),
  "overallStatusLabel": "MINIMAL" | "ELEVATED" | "SEVERE" | "CATASTROPHIC",
  "summary": "A 2-3 sentence strategic summary detailing how the demographics, urban planning substrate, weather and verification metrics interact to drive these predictions",
  "predictions": {
    "potholeFormation": {
      "riskScore": number,
      "explanation": "Technical reasoning incorporating pavement substrate, transit proximity, and weather factors",
      "hotspotZones": ["string"]
    },
    "garbageOverflow": {
      "riskScore": number,
      "explanation": "Technical reasoning incorporating population density, transit proximity, and socioeconomic factors",
      "hotspotZones": ["string"]
    },
    "waterLeakage": {
      "riskScore": number,
      "explanation": "Technical reasoning incorporating pipe asset age, weather factors, and ground load",
      "hotspotZones": ["string"]
    },
    "lightingFailure": {
      "riskScore": number,
      "explanation": "Technical reasoning incorporating vulnerable population ratio, safety multipliers, and density",
      "hotspotZones": ["string"]
    }
  },
  "cascadingRisks": [
    { "trigger": "Failure trigger", "impact": "Downstream civic risk", "probability": number }
  ],
  "preventativeActions": [
    { "title": "Prevention task name", "audience": "Municipal Crews" | "Community Volunteers", "priority": "high" | "medium" | "low", "description": "Short explanation of preventative instructions" }
  ]
}

Ensure your output is extremely professional and clean. Do not include markdown codeblocks or other text in your response.`;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallRiskScore: { type: Type.INTEGER },
            overallStatusLabel: { type: Type.STRING },
            summary: { type: Type.STRING },
            predictions: {
              type: Type.OBJECT,
              properties: {
                potholeFormation: {
                  type: Type.OBJECT,
                  properties: {
                    riskScore: { type: Type.INTEGER },
                    explanation: { type: Type.STRING },
                    hotspotZones: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["riskScore", "explanation", "hotspotZones"]
                },
                garbageOverflow: {
                  type: Type.OBJECT,
                  properties: {
                    riskScore: { type: Type.INTEGER },
                    explanation: { type: Type.STRING },
                    hotspotZones: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["riskScore", "explanation", "hotspotZones"]
                },
                waterLeakage: {
                  type: Type.OBJECT,
                  properties: {
                    riskScore: { type: Type.INTEGER },
                    explanation: { type: Type.STRING },
                    hotspotZones: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["riskScore", "explanation", "hotspotZones"]
                },
                lightingFailure: {
                  type: Type.OBJECT,
                  properties: {
                    riskScore: { type: Type.INTEGER },
                    explanation: { type: Type.STRING },
                    hotspotZones: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["riskScore", "explanation", "hotspotZones"]
                }
              },
              required: ["potholeFormation", "garbageOverflow", "waterLeakage", "lightingFailure"]
            },
            cascadingRisks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  trigger: { type: Type.STRING },
                  impact: { type: Type.STRING },
                  probability: { type: Type.INTEGER }
                },
                required: ["trigger", "impact", "probability"]
              }
            },
            preventativeActions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  audience: { type: Type.STRING },
                  priority: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["title", "audience", "priority", "description"]
              }
            }
          },
          required: ["overallRiskScore", "overallStatusLabel", "summary", "predictions", "cascadingRisks", "preventativeActions"]
        },
        temperature: 0.15
      }
    });

    const bodyText = response.text || "";
    const cleanedText = bodyText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanedText);

    return res.json({ ...parsed, simulated: false });

  } catch (err: any) {
    console.warn("Gemini predictive engine error, invoking simulated fallback:", err);
    return res.json(runSimulatedPredictiveRiskEngine(hPotholes, hGarbage, hWater, hLights, weatherCondition, trust, verifiedCount, unverifiedCount, demographics, urbanPlanning));
  }
});


// ==================== DEV / PROD MIDDLEWARE ====================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    console.log("Mounted Vite middleware for active development.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA routing fallback using Express v4 format
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Serving static production assets from /dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`=============================================`);
    console.log(`Urban Mind Server is running on port ${PORT}`);
    console.log(`Open in browser: http://localhost:${PORT}`);
    console.log(`=============================================`);
  });
}

startServer();

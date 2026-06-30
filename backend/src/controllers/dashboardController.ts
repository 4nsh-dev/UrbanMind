import { Request, Response } from "express";
import Issue from "../models/Issue.js";
import User from "../models/User.js";

// 1. Dashboard metrics queries (Aggregation workflows)
export async function getDashboardStats(req: Request, res: Response) {
  try {
    // Collect fundamental document count metrics
    const totalCount = await Issue.countDocuments();
    const reportedCount = await Issue.countDocuments({ status: "reported" });
    const verifiedCount = await Issue.countDocuments({ status: "verified" });
    const inProgressCount = await Issue.countDocuments({ status: "in_progress" });
    const resolvedCount = await Issue.countDocuments({ status: "resolved" });

    // Multi-criteria category division aggregation
    const categoryBreakdown = await Issue.aggregate([
      {
        $group: {
          _id: "$category",
          total: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          category: "$_id",
          total: 1,
          resolved: 1,
          unresolved: { $subtract: ["$total", "$resolved"] },
          _id: 0,
        },
      },
    ]);

    // Severity indexes
    const severityBreakdown = await Issue.aggregate([
      {
        $group: {
          _id: "$severity",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          severity: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Roster leaderboard standings
    const leadRoster = await User.find({})
      .sort({ reputationPoints: -1 })
      .limit(10)
      .select("name avatarUrl reputationPoints role");

    return res.json({
      summary: {
        total: totalCount,
        reported: reportedCount,
        verified: verifiedCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        openCases: reportedCount + verifiedCount + inProgressCount,
      },
      categories: categoryBreakdown,
      severities: severityBreakdown,
      leaderboard: leadRoster,
    });
  } catch (error: any) {
    console.error("Dashboard stats aggregation failure:", error);
    return res.status(500).json({ error: error.message });
  }
}

// 2. City Integrity and Safety Coefficient computation (Health score APIs)
export async function getCityHealthScore(req: Request, res: Response) {
  try {
    const totalIssues = await Issue.countDocuments();
    
    if (totalIssues === 0) {
      return res.json({
        healthScore: 100,
        integrityLabel: "A+",
        status: "Pristine",
        description: "Zero incidents reported across community sectors. Urban health index is perfectly pristine.",
      });
    }

    // High severity issues negatively impact safety score
    const criticalIncidents = await Issue.countDocuments({
      severity: "critical",
      status: { $ne: "resolved" },
    });

    const highIncidents = await Issue.countDocuments({
      severity: "high",
      status: { $ne: "resolved" },
    });

    const activeIssues = await Issue.countDocuments({
      status: { $ne: "resolved" },
    });

    const resolvedIssues = await Issue.countDocuments({
      status: "resolved",
    });

    // Formulas: Resolution Efficiency Coefficient
    const resolutionRatio = resolvedIssues / totalIssues;

    // Penalty calculations
    const hazardPenalty = (criticalIncidents * 15) + (highIncidents * 5);
    const activeCasesPenalty = activeIssues * 1.5;

    // Safety health score starts from 100
    let healthScore = 100 * resolutionRatio - hazardPenalty - activeCasesPenalty;
    
    // Clamp score values from 0 to 100
    healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));

    let label = "F";
    let message = "CRITICAL SITUATION: Infrastructure parameters are severely unstable. Urgent attention is recommended.";

    if (healthScore >= 90) {
      label = "A";
      message = "EXCELLENT STATUS: High municipal integrity coefficient with speedy resolution cycles.";
    } else if (healthScore >= 80) {
      label = "B";
      message = "GOOD STATUS: Minor local issues recorded. Local crews are effectively controlling hazards.";
    } else if (healthScore >= 70) {
      label = "C";
      message = "STABLE STATUS: Moderate hazard backlog. Recommended prioritization of water leakages and light bulbs.";
    } else if (healthScore >= 50) {
      label = "D";
      message = "WARNING LEVEL: Backlog rates are expanding. Elevated critical road damage counts registered.";
    }

    return res.json({
      healthScore,
      integrityLabel: label,
      metrics: {
        totalIssues,
        unresolvedCritical: criticalIncidents,
        unresolvedHigh: highIncidents,
        unresolvedTotal: activeIssues,
        resolvedTotal: resolvedIssues,
        resolutionPercentage: Math.round(resolutionRatio * 100),
      },
      statusText: message,
    });
  } catch (error: any) {
    console.error("City health index calculation failure:", error);
    return res.status(500).json({ error: error.message });
  }
}

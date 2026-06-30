import { Response } from "express";
import { IRequestWithUser } from "../middleware/auth.js";
import Issue from "../models/Issue.js";
import User from "../models/User.js";

// 1. File a new street incident
export async function createIssue(req: IRequestWithUser, res: Response) {
  try {
    const { title, description, category, latitude, longitude, locationName, aiAnalysis } = req.body;
    const reporterId = req.user?.id;
    const imageUrl = (req as any).uploadedFileUrl;

    if (!title || !description || !category || !latitude || !longitude || !locationName) {
      return res.status(400).json({ error: "Missing required parameters to log new issue." });
    }

    // Retrieve citizen name
    const citizen = await User.findById(reporterId);
    if (!citizen) {
      return res.status(404).json({ error: "Reporter profile context not found." });
    }

    const newIssue = new Issue({
      title,
      description,
      category,
      imageUrl,
      reporterId,
      reportedBy: citizen.name,
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
      locationName,
      status: "reported",
      history: [
        {
          status: "reported",
          timestamp: new Date(),
          note: "Incident reported, logged in community ledger.",
          updatedBy: citizen.name,
        },
      ],
      aiAnalysis, // embedded Gemini metrics
    });

    await newIssue.save();

    // Award XP points for filing the report
    citizen.reputationPoints += 100;

    // Check achievement unlock: first reporter
    const hasFirstArrived = citizen.unlockedAchievements.some(a => a.achievementId === "first_responder");
    if (!hasFirstArrived) {
      citizen.unlockedAchievements.push({
        achievementId: "first_responder",
        unlockedAt: new Date(),
      });
    }

    await citizen.save();

    return res.status(201).json({
      message: "Incident reported successfully. +100 XP awarded!",
      issue: newIssue,
      xpGained: 100,
    });
  } catch (error: any) {
    console.error("Error creating issue:", error);
    return res.status(500).json({ error: error.message });
  }
}

// 2. Fetch all incidents (supports spatial geo searching)
export async function getAllIssues(req: IRequestWithUser, res: Response) {
  try {
    const { category, status, lat, lng, radiusInMeters } = req.query;
    const queryFilter: any = {};

    if (category) queryFilter.category = category;
    if (status) queryFilter.status = status;

    // GIS spatial proximity search if coordinates are parsed
    if (lat && lng) {
      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      const radius = parseFloat((radiusInMeters as string) || "5000"); // 5km fallback

      queryFilter.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: radius,
        },
      };
    }

    const issues = await Issue.find(queryFilter).sort({ createdAt: -1 });
    return res.json({ count: issues.length, data: issues });
  } catch (error: any) {
    console.error("Error fetching issue catalog:", error);
    return res.status(500).json({ error: error.message });
  }
}

// 3. Fetch specific incident logs
export async function getIssueById(req: IRequestWithUser, res: Response) {
  try {
    const { id } = req.params;
    const issue = await Issue.findById(id);

    if (!issue) {
      return res.status(404).json({ error: "Incident document not found in system databases." });
    }

    return res.json(issue);
  } catch (error: any) {
    console.error("Error fetching single issue details:", error);
    return res.status(500).json({ error: error.message });
  }
}

// 4. Verify/Vote on incidents (+25 reputation XP adjustment)
export async function voteIssue(req: IRequestWithUser, res: Response) {
  try {
    const { id } = req.params;
    const { type } = req.body; // 'up' or 'down'
    const voterId = req.user?.id;

    if (!voterId) return res.status(401);
    if (type !== "up" && type !== "down") {
      return res.status(400).json({ error: "Vote type parameter must be 'up' or 'down'." });
    }

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(444).json({ error: "Target issue missing." });
    }

    // Check if user has already voted
    const existingIndex = issue.verifications.findIndex(v => v.userId.toString() === voterId);

    if (existingIndex > -1) {
      // Undo or toggle vote
      const prevVote = issue.verifications[existingIndex].voteType;
      if (prevVote === type) {
        issue.verifications.splice(existingIndex, 1);
        if (type === "up") issue.upvotes = Math.max(0, issue.upvotes - 1);
        else issue.downvotes = Math.max(0, issue.downvotes - 1);
      } else {
        issue.verifications[existingIndex].voteType = type;
        if (type === "up") {
          issue.upvotes += 1;
          issue.downvotes = Math.max(0, issue.downvotes - 1);
        } else {
          issue.downvotes += 1;
          issue.upvotes = Math.max(0, issue.upvotes - 1);
        }
      }
    } else {
      // Create new vote entry
      issue.verifications.push({
        userId: new mongoose.Types.ObjectId(voterId),
        voteType: type,
        timestamp: new Date(),
      });
      if (type === "up") issue.upvotes += 1;
      else issue.downvotes += 1;
    }

    // Auto-escalation trigger: If an issue gets 10+ upvotes and is still marked 'reported', upgrade status to 'verified'
    let statusUpdated = false;
    if (issue.upvotes >= 10 && issue.status === "reported") {
      issue.status = "verified";
      issue.history.push({
        status: "verified",
        timestamp: new Date(),
        note: "Escalated: Automated community audit verification threshold surpassed (+10 community votes).",
        updatedBy: "Peer Validator Network",
      });
      statusUpdated = true;
    }

    await issue.save();

    // Reward the voter with reputation points for active verification
    const voter = await User.findById(voterId);
    if (voter) {
      voter.reputationPoints += 25;
      await voter.save();
    }

    return res.json({
      message: "Community verification vote processed. XP points updated!",
      upvotes: issue.upvotes,
      downvotes: issue.downvotes,
      status: issue.status,
      statusUpdated,
    });
  } catch (error: any) {
    console.error("Error logging vote:", error);
    return res.status(500).json({ error: error.message });
  }
}

// 5. Add a comment onto an issue forum thread
export async function addComment(req: IRequestWithUser, res: Response) {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user?.id;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Empty comment posts are prohibited." });
    }

    const citizen = await User.findById(userId);
    if (!citizen) return res.status(404).json({ error: "User identity lost." });

    const issue = await Issue.findById(id);
    if (!issue) return res.status(404).json({ error: "Issue does not exist." });

    issue.comments.push({
      userId: citizen._id as any,
      author: citizen.name,
      avatar: citizen.avatarUrl,
      text: text.trim(),
      timestamp: new Date(),
    });

    await issue.save();

    // Reward citizen with conversational XP
    citizen.reputationPoints += 50;
    await citizen.save();

    return res.status(201).json({
      message: "Comment added. +50 XP granted!",
      commentsCount: issue.comments.length,
      comment: issue.comments[issue.comments.length - 1],
    });
  } catch (error: any) {
    console.error("Error creating comment:", error);
    return res.status(500).json({ error: error.message });
  }
}

// 6. Update incident status (Restrict to city authorities / admin)
export async function updateIssueStatus(req: IRequestWithUser, res: Response) {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    const authorityId = req.user?.id;

    if (!status || !note || !note.trim()) {
      return res.status(400).json({ error: "Status transitions require descriptive administrative log notes." });
    }

    const issue = await Issue.findById(id);
    if (!issue) return res.status(404).json({ error: "Record not found." });

    const authority = await User.findById(authorityId);
    const authorityName = authority ? authority.name : "City Operations dispatcher";

    issue.status = status;
    issue.history.push({
      status,
      timestamp: new Date(),
      note: note.trim(),
      updatedBy: authorityName,
    });

    await issue.save();

    // If case has been successfully resolved, give a massive XP reward to the original reporter!
    if (status === "resolved") {
      const reporter = await User.findById(issue.reporterId);
      if (reporter) {
        reporter.reputationPoints += 150; // Massively congratulate reporter!
        await reporter.save();
      }
    }

    return res.json({
      message: `System status modified to: '${status}'. Audit trail verified.`,
      issue,
    });
  } catch (error: any) {
    console.error("Error modifying triage state:", error);
    return res.status(500).json({ error: error.message });
  }
}

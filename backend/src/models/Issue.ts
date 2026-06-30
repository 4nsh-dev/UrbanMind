import mongoose, { Schema, Document } from "mongoose";

export interface IComment {
  userId: mongoose.Types.ObjectId;
  author: string;
  avatar: string;
  text: string;
  timestamp: Date;
}

export interface IVerification {
  userId: mongoose.Types.ObjectId;
  voteType: "up" | "down";
  timestamp: Date;
}

export interface IHistoryLog {
  status: "reported" | "verified" | "in_progress" | "resolved";
  timestamp: Date;
  note: string;
  updatedBy: string;
}

export interface IIssue extends Document {
  title: string;
  description: string;
  imageUrl?: string;
  category: "pothole" | "garbage" | "water_leak" | "broken_streetlight" | "graffiti" | "tree_hazard" | "general";
  severity: "low" | "medium" | "high" | "critical";
  status: "reported" | "verified" | "in_progress" | "resolved";
  reporterId: mongoose.Types.ObjectId;
  reportedBy: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  locationName: string;
  upvotes: number;
  downvotes: number;
  verifications: IVerification[];
  comments: IComment[];
  history: IHistoryLog[];
  aiAnalysis?: {
    categorySuggested: string;
    descriptionRefined: string;
    severityPrediction: string;
    urgencyScore: number;
    resolutionEstimate: string;
    analyzedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  author: { type: String, required: true },
  avatar: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const VerificationSchema = new Schema<IVerification>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  voteType: { type: String, enum: ["up", "down"], required: true },
  timestamp: { type: Date, default: Date.now },
});

const HistoryLogSchema = new Schema<IHistoryLog>({
  status: { type: String, enum: ["reported", "verified", "in_progress", "resolved"], required: true },
  timestamp: { type: Date, default: Date.now },
  note: { type: String, required: true },
  updatedBy: { type: String, required: true },
});

const IssueSchema: Schema<IIssue> = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    imageUrl: { type: String },
    category: {
      type: String,
      enum: ["pothole", "garbage", "water_leak", "broken_streetlight", "graffiti", "tree_hazard", "general"],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      index: true,
    },
    status: {
      type: String,
      enum: ["reported", "verified", "in_progress", "resolved"],
      default: "reported",
      index: true,
    },
    reporterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reportedBy: { type: String, required: true },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    locationName: { type: String, required: true },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    verifications: [VerificationSchema],
    comments: [CommentSchema],
    history: [HistoryLogSchema],
    aiAnalysis: {
      categorySuggested: String,
      descriptionRefined: String,
      severityPrediction: String,
      urgencyScore: Number,
      resolutionEstimate: String,
      analyzedAt: { type: Date, default: Date.now },
    },
  },
  {
    timestamps: true,
  }
);

// Geo-spatial index to query coordinates quickly!
IssueSchema.index({ location: "2dsphere" });

export default mongoose.model<IIssue>("Issue", IssueSchema);

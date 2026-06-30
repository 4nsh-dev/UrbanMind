import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  avatarUrl: string;
  role: "citizen" | "city_authority" | "admin";
  reputationPoints: number;
  unlockedAchievements: Array<{
    achievementId: string;
    unlockedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    avatarUrl: {
      type: String,
      default: "https://api.dicebear.com/7.x/pixel-art/svg?seed=default",
    },
    role: {
      type: String,
      enum: ["citizen", "city_authority", "admin"],
      default: "citizen",
    },
    reputationPoints: {
      type: Number,
      default: 0,
    },
    unlockedAchievements: [
      {
        achievementId: { type: String, required: true },
        unlockedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Virtual for level computation
UserSchema.virtual("level").get(function (this: IUser) {
  return Math.floor(this.reputationPoints / 1000) + 1;
});

UserSchema.set("toJSON", { virtuals: true });
UserSchema.set("toObject", { virtuals: true });

export default mongoose.model<IUser>("User", UserSchema);

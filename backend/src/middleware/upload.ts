import multer from "multer";
import admin from "firebase-admin";
import { Request, Response, NextFunction } from "express";

// Initialize Multer memory engine to accept incoming stream buffers
const uploadBuffer = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB file ceiling
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("File rejection: Only image assets are supported."));
    }
  },
});

export const parseSingleImage = uploadBuffer.single("image");

// Lazy initialization of Firebase Admin to prevent crashes if credential keys are missing
let firebaseBucket: any = null;

function getStorageBucket() {
  if (firebaseBucket) return firebaseBucket;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET;

  if (!projectId || !clientEmail || !privateKey || !bucketName) {
    console.warn("⚠️ Firebase configuration profiles are missing. Image uploads will auto-initialize in Mock fallback modes.");
    return null;
  }

  try {
    const formattedKey = privateKey.replace(/\\n/g, "\n");
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: formattedKey,
      }),
      storageBucket: bucketName,
    });

    firebaseBucket = admin.storage().bucket();
    return firebaseBucket;
  } catch (error) {
    console.error("🔴 Failed to initialize Firebase connection, reverting to simulation fallback:", error);
    return null;
  }
}

export async function uploadToFirebase(req: Request, res: Response, next: NextFunction) {
  if (!req.file) {
    return next(); // Proceed without file upload if not present
  }

  const bucket = getStorageBucket();

  if (!bucket) {
    // Elegant Simulation Fallback returns clean pixel art placeholders
    console.log("Simulating file cloud compression & bucket storage.");
    const seedId = Math.random().toString(36).substring(7);
    (req as any).uploadedFileUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=hero_${seedId}`;
    return next();
  }

  try {
    const blob = bucket.file(`incidents/${Date.now()}_${req.file.originalname}`);
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    blobStream.on("error", (err: any) => {
      console.error("Firebase Storage write error:", err);
      return res.status(500).json({ error: "Failed to upload image asset to Firebase Storage bucket." });
    });

    blobStream.on("finish", async () => {
      // Make file public if permissions allow or fetch verified download parameters
      try {
        await blob.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        (req as any).uploadedFileUrl = publicUrl;
        next();
      } catch (err) {
        console.warn("Could not execute makePublic() on storage blob. Standard tokenized URLs fallback: ", err);
        const [signedUrl] = await blob.getSignedUrl({
          action: "read",
          expires: "03-09-2499",
        });
        (req as any).uploadedFileUrl = signedUrl;
        next();
      }
    });

    blobStream.end(req.file.buffer);
  } catch (error) {
    console.error("Critical Firebase pipeline error during stream handling:", error);
    return res.status(500).json({ error: "Image storage transaction failed." });
  }
}

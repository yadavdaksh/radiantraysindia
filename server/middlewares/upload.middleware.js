import multer from "multer";

export const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

export const imageUpload = memoryUpload.fields([
  { name: "image", maxCount: 1 },
  { name: "images", maxCount: 20 },
  { name: "document", maxCount: 1 },
]);


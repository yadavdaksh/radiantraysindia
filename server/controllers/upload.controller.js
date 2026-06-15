import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createR2Key,
  deleteObjectFromR2,
  getOptimizedImageUrl,
  uploadBufferToR2,
} from "../utils/r2.js";

const getFile = (req) => req.file || req.files?.image?.[0] || req.files?.document?.[0];

export const uploadAsset = asyncHandler(async (req, res) => {
  const file = getFile(req);
  if (!file) throw new ApiError(400, "File is required");

  const folder = req.body.folder || "assets";
  const key = createR2Key(folder, file.originalname);
  const uploaded = await uploadBufferToR2({
    buffer: file.buffer,
    key,
    contentType: file.mimetype,
  });

  res.status(201).json(
    new ApiResponsive(201, {
      key: uploaded.key,
      url: uploaded.url,
      optimizedUrl: getOptimizedImageUrl(uploaded.url, { width: 1600 }),
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    }, "Asset uploaded")
  );
});

export const deleteAsset = asyncHandler(async (req, res) => {
  const { key } = req.body;
  if (!key) throw new ApiError(400, "Asset key is required");

  await deleteObjectFromR2(key);
  res.json(new ApiResponsive(200, null, "Asset deleted"));
});


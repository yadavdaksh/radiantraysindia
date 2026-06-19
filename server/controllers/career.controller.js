import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logActivity } from "../utils/logActivity.js";
import { createR2Key, uploadBufferToR2, deleteObjectFromR2 } from "../utils/r2.js";

function toSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function uniqueSlug(title, excludeId = null) {
  const base = toSlug(title);
  let slug = base;
  let n = 1;
  while (true) {
    const existing = await prisma.job.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) break;
    slug = `${base}-${n++}`;
  }
  return slug;
}

// ── Resume Upload (public) ────────────────────────────────────────────────────

export const uploadResume = asyncHandler(async (req, res) => {
  const file = req.files?.resume?.[0];
  if (!file) throw new ApiError(400, "Resume file is required");

  const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
  if (!allowed.includes(file.mimetype)) {
    throw new ApiError(400, "Only PDF or Word documents are accepted");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new ApiError(400, "File must be under 5 MB");
  }

  const key = createR2Key("resumes", file.originalname);
  const uploaded = await uploadBufferToR2({ buffer: file.buffer, key, contentType: file.mimetype });

  res.json(new ApiResponsive(200, { url: uploaded.url, key: uploaded.key }, "Resume uploaded"));
});

export const deleteResume = asyncHandler(async (req, res) => {
  const { key } = req.body;
  if (!key) throw new ApiError(400, "Key required");
  if (!key.startsWith("resumes/")) throw new ApiError(403, "Invalid key");
  await deleteObjectFromR2(key);
  res.json(new ApiResponsive(200, null, "Resume deleted"));
});

// ── Public ────────────────────────────────────────────────────────────────────

export const listActiveJobs = asyncHandler(async (_req, res) => {
  const jobs = await prisma.job.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true, title: true, slug: true, location: true, type: true,
      department: true, experience: true, salaryMin: true, salaryMax: true,
      qualification: true, createdAt: true,
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(new ApiResponsive(200, jobs));
});

export const getJobBySlug = asyncHandler(async (req, res) => {
  const job = await prisma.job.findUnique({
    where: { slug: req.params.slug },
    select: {
      id: true, title: true, slug: true, description: true, requirements: true,
      location: true, type: true, department: true, experience: true,
      salaryMin: true, salaryMax: true, qualification: true, status: true, createdAt: true,
    },
  });
  if (!job || job.status !== "ACTIVE") throw new ApiError(404, "Job not found");
  res.json(new ApiResponsive(200, job));
});

export const applyForJob = asyncHandler(async (req, res) => {
  const { name, email, phone, resumeUrl, coverLetter } = req.body;
  if (!name || !email || !phone || !resumeUrl) {
    throw new ApiError(400, "Name, email, phone and resume are required");
  }

  const job = await prisma.job.findUnique({ where: { slug: req.params.slug } });
  if (!job || job.status !== "ACTIVE") throw new ApiError(404, "Job not found or no longer accepting applications");

  const existing = await prisma.jobApplication.findFirst({
    where: { jobId: job.id, email: email.toLowerCase() },
  });
  if (existing) throw new ApiError(409, "You have already applied for this position");

  const application = await prisma.jobApplication.create({
    data: {
      jobId: job.id,
      name,
      email: email.toLowerCase(),
      phone,
      resumeUrl,
      coverLetter: coverLetter || null,
    },
  });

  res.status(201).json(new ApiResponsive(201, application, "Application submitted successfully"));
});

// ── Admin ─────────────────────────────────────────────────────────────────────

export const adminListJobs = asyncHandler(async (req, res) => {
  const status = req.query.status;
  const where = status ? { status } : {};
  const jobs = await prisma.job.findMany({
    where,
    include: { _count: { select: { applications: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(new ApiResponsive(200, jobs));
});

export const adminGetJob = asyncHandler(async (req, res) => {
  const job = await prisma.job.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { applications: true } } },
  });
  if (!job) throw new ApiError(404, "Job not found");
  res.json(new ApiResponsive(200, job));
});

export const adminCreateJob = asyncHandler(async (req, res) => {
  const { title, description, requirements, location, type, salaryMin, salaryMax, qualification, experience, department, status } = req.body;
  if (!title || !description || !location) {
    throw new ApiError(400, "Title, description and location are required");
  }

  const slug = await uniqueSlug(title);
  const job = await prisma.job.create({
    data: {
      title, slug, description,
      requirements: requirements || null,
      location, type: type || "FULL_TIME",
      salaryMin: salaryMin ? Number(salaryMin) : null,
      salaryMax: salaryMax ? Number(salaryMax) : null,
      qualification: qualification || null,
      experience: experience || null,
      department: department || null,
      status: status || "ACTIVE",
    },
  });

  logActivity({ type: "CREATE", title: `Job created: ${job.title}`, entityType: "job", entityId: job.id, actorId: req.user?.id });
  res.status(201).json(new ApiResponsive(201, job, "Job created"));
});

export const adminUpdateJob = asyncHandler(async (req, res) => {
  const existing = await prisma.job.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "Job not found");

  const { title, description, requirements, location, type, salaryMin, salaryMax, qualification, experience, department, status } = req.body;

  const slug = title && title !== existing.title ? await uniqueSlug(title, existing.id) : existing.slug;

  const job = await prisma.job.update({
    where: { id: req.params.id },
    data: {
      title: title ?? existing.title,
      slug,
      description: description ?? existing.description,
      requirements: requirements !== undefined ? requirements : existing.requirements,
      location: location ?? existing.location,
      type: type ?? existing.type,
      salaryMin: salaryMin !== undefined ? (salaryMin ? Number(salaryMin) : null) : existing.salaryMin,
      salaryMax: salaryMax !== undefined ? (salaryMax ? Number(salaryMax) : null) : existing.salaryMax,
      qualification: qualification !== undefined ? qualification : existing.qualification,
      experience: experience !== undefined ? experience : existing.experience,
      department: department !== undefined ? department : existing.department,
      status: status ?? existing.status,
    },
  });

  logActivity({ type: "UPDATE", title: `Job updated: ${job.title}`, entityType: "job", entityId: job.id, actorId: req.user?.id });
  res.json(new ApiResponsive(200, job, "Job updated"));
});

export const adminDeleteJob = asyncHandler(async (req, res) => {
  const existing = await prisma.job.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "Job not found");
  await prisma.job.update({ where: { id: req.params.id }, data: { status: "CLOSED" } });
  logActivity({ type: "DELETE", title: `Job closed: ${existing.title}`, entityType: "job", entityId: req.params.id, actorId: req.user?.id });
  res.json(new ApiResponsive(200, null, "Job closed"));
});

export const adminListApplications = asyncHandler(async (req, res) => {
  const where = req.params.id ? { jobId: req.params.id } : {};
  const applications = await prisma.jobApplication.findMany({
    where,
    include: { job: { select: { title: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(new ApiResponsive(200, applications));
});

export const adminUpdateApplication = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status) throw new ApiError(400, "Status required");

  const application = await prisma.jobApplication.update({
    where: { id: req.params.id },
    data: { status },
    include: { job: { select: { title: true } } },
  });

  logActivity({ type: "UPDATE", title: `Application ${status}: ${application.name} for ${application.job.title}`, entityType: "jobApplication", entityId: application.id, actorId: req.user?.id });
  res.json(new ApiResponsive(200, application, "Application updated"));
});

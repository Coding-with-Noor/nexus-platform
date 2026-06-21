const express = require("express")
const router = express.Router()
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const Document = require("../models/Documents")
const { authenticateToken } = require("../middleware/auth")

let storage
const hasCloudinary = process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_CLOUD_NAME

if (hasCloudinary) {
  const { CloudinaryStorage } = require("multer-storage-cloudinary")
  const { cloudinary } = require("../config/cloudinary")
  storage = new CloudinaryStorage({
    cloudinary,
    params: (req, file) => {
      const folderBase = `nexus/documents/${req.user ? req.user.userId : "public"}`
      return {
        folder: folderBase,
        allowed_formats: ["pdf", "doc", "docx", "txt", "jpg", "jpeg", "png"],
        resource_type: "auto",
      }
    },
  })
} else {
  const uploadDir = path.join(__dirname, "../uploads")
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname))
    },
  })
}

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
})

// Upload a new document (creates Document + first version)
router.post("/upload", authenticateToken, upload.single("document"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" })

    const fileUrl = req.file.filename && !hasCloudinary ? `/uploads/${req.file.filename}` : req.file.path
    const version = {
      versionNumber: 1,
      filename: req.file.originalname,
      url: fileUrl,
      publicId: req.file.filename || req.file.public_id,
      size: req.file.size || req.file.bytes || 0,
      uploadedBy: req.user.userId,
      uploadedAt: new Date(),
    }

    const doc = new Document({
      filename: req.file.originalname,
      ownerId: req.user.userId,
      versions: [version],
      currentVersion: 1,
    })

    await doc.save()

    return res.status(201).json({ message: "Uploaded", document: doc })
  } catch (err) {
    console.error("Upload error:", err)
    return res.status(500).json({ message: "Failed to upload document" })
  }
})

// Upload a new version for an existing document
router.post("/:id/version", authenticateToken, upload.single("document"), async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id)
    if (!doc) return res.status(404).json({ message: "Document not found" })

    const newVersionNumber = doc.currentVersion + 1
    const fileUrl = req.file.filename && !hasCloudinary ? `/uploads/${req.file.filename}` : req.file.path

    const version = {
      versionNumber: newVersionNumber,
      filename: req.file.originalname,
      url: fileUrl,
      publicId: req.file.filename || req.file.public_id,
      size: req.file.size || req.file.bytes || 0,
      uploadedBy: req.user.userId,
      uploadedAt: new Date(),
    }

    doc.versions.push(version)
    doc.currentVersion = newVersionNumber
    await doc.save()

    res.status(200).json({ message: "Version uploaded", document: doc })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to upload new version" })
  }
})

// Upload signature for a specific version
let signatureStorage
if (hasCloudinary) {
  const { CloudinaryStorage } = require("multer-storage-cloudinary")
  const { cloudinary } = require("../config/cloudinary")
  signatureStorage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "nexus/signatures",
      allowed_formats: ["png", "jpg", "jpeg"],
      resource_type: "image",
    },
  })
} else {
  signatureStorage = storage // reuse the disk storage setup
}

const signatureUpload = multer({ storage: signatureStorage })

router.post(
  "/:id/version/:versionNumber/signature",
  authenticateToken,
  signatureUpload.single("signature"),
  async (req, res) => {
    try {
      const { id, versionNumber } = req.params
      const doc = await Document.findById(id)
      if (!doc) return res.status(404).json({ message: "Document not found" })

      const version = doc.versions.find((v) => v.versionNumber === Number(versionNumber))
      if (!version) return res.status(404).json({ message: "Version not found" })

      version.signatureUrl = req.file.filename && !hasCloudinary ? `/uploads/${req.file.filename}` : req.file.path
      version.signaturePublicId = req.file.filename || req.file.public_id

      await doc.save()

      return res.status(200).json({ message: "Signature attached", document: doc })
    } catch (err) {
      console.error(err)
      res.status(500).json({ message: "Failed to attach signature" })
    }
  },
)

// List documents (paginated)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const skip = (page - 1) * limit
    const docs = await Document.find({ ownerId: req.user.userId })
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
    res.json({ documents: docs })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to fetch documents" })
  }
})

// Get document by id
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id)
    if (!doc) return res.status(404).json({ message: "Document not found" })
    res.json({ document: doc })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to fetch document" })
  }
})

// Delete document (all versions)
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id)
    if (!doc) return res.status(404).json({ message: "Document not found" })
    if (doc.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized to delete this document" })
    }

    const uploadDir = path.join(__dirname, "../uploads")

    for (const v of doc.versions) {
      try {
        if (hasCloudinary && v.publicId) {
          const { cloudinary } = require("../config/cloudinary")
          await cloudinary.uploader.destroy(v.publicId, { resource_type: "auto" })
        } else if (v.publicId && !hasCloudinary) {
          const filePath = path.join(uploadDir, v.publicId)
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
        }
        if (hasCloudinary && v.signaturePublicId) {
          const { cloudinary } = require("../config/cloudinary")
          await cloudinary.uploader.destroy(v.signaturePublicId, { resource_type: "image" })
        } else if (v.signaturePublicId && !hasCloudinary) {
          const sigPath = path.join(uploadDir, v.signaturePublicId)
          if (fs.existsSync(sigPath)) fs.unlinkSync(sigPath)
        }
      } catch (err) {
        console.warn("File delete warning:", err)
      }
    }

    await doc.deleteOne()
    res.json({ message: "Document deleted" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to delete document" })
  }
})

module.exports = router


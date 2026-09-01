const School = require('../models/School');
const { sanitizeAdmissionNumber } = require('../utils/photoStorageHelper');
const { uploadPhoto } = require('../services/storageService');

/**
 * @desc Upload student photo (Base64 or binary data) & automatically rename to admission number
 * @route POST /api/upload/photo
 * @access Private (School Admin / Super Admin)
 */
exports.uploadStudentPhoto = async (req, res, next) => {
  try {
    const { imageBase64, fileName, admissionNumber, schoolCode: passedSchoolCode } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        message: 'No image data provided',
      });
    }

    // Determine school code
    let schoolCode = passedSchoolCode;
    if (!schoolCode && req.user && req.user.schoolId) {
      if (req.user.schoolId.code) {
        schoolCode = req.user.schoolId.code;
      } else {
        const schoolDoc = await School.findById(req.user.schoolId._id || req.user.schoolId);
        if (schoolDoc) schoolCode = schoolDoc.code;
      }
    }

    if (!schoolCode) schoolCode = 'SCHOOL';

    // Match base64 data header or raw base64
    const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer;
    let ext = 'jpg';

    if (matches && matches.length === 3) {
      const mime = matches[1];
      if (mime.includes('png')) ext = 'png';
      else if (mime.includes('webp')) ext = 'webp';
      else if (mime.includes('gif')) ext = 'gif';
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(imageBase64, 'base64');
    }

    // Check size limit: 5MB
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'Image size exceeds 5MB limit',
      });
    }

    // Determine student photo identifier name: use admissionNumber if provided, or timestamp temp name
    const effectiveAdm = admissionNumber
      ? sanitizeAdmissionNumber(admissionNumber)
      : `temp_${Date.now()}_${Math.round(Math.random() * 1e6)}`;

    const saved = await uploadPhoto({
      buffer,
      ext,
      admissionNumber: effectiveAdm,
      schoolCode,
      req,
    });

    return res.status(200).json({
      success: true,
      message: 'Student photo uploaded and saved successfully',
      data: {
        photoUrl: saved.photoUrl,
        fileName: saved.fileName,
        relativeUrl: saved.relativeUrl || saved.photoUrl,
        admissionNumber: admissionNumber ? sanitizeAdmissionNumber(admissionNumber) : null,
        schoolCode,
        size: buffer.length,
        isCloud: saved.isCloud,
      },
    });
  } catch (error) {
    next(error);
  }
};


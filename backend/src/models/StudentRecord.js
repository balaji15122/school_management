const mongoose = require('mongoose');

const studentRecordSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: [true, 'School ID is required'],
      index: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Submitter user ID is required'],
      index: true,
    },
    // 1. Student Full Name
    name: {
      type: String,
      required: [true, 'Student Full Name is required'],
      trim: true,
    },
    // 2. Student Photo
    photoUrl: {
      type: String,
      default: null,
    },
    photoFileName: {
      type: String,
      default: null,
    },
    // 3. Admission Number / Student ID
    admissionNumber: {
      type: String,
      required: [true, 'Admission Number / Student ID is required'],
      trim: true,
      uppercase: true,
    },
    // 4. Class
    class: {
      type: String,
      required: [true, 'Class is required'],
      trim: true,
    },
    // 5. Section
    section: {
      type: String,
      required: [true, 'Section is required'],
      trim: true,
      uppercase: true,
    },
    // 6. Roll Number
    rollNumber: {
      type: String,
      required: [true, 'Roll Number is required'],
      trim: true,
    },
    // 7. Date of Birth
    dob: {
      type: Date,
      required: [true, 'Date of Birth is required'],
    },
    // 8. Gender
    gender: {
      type: String,
      enum: {
        values: ['male', 'female', 'other'],
        message: '{VALUE} is not a valid gender',
      },
      required: [true, 'Gender is required'],
      lowercase: true,
    },
    // 9. Blood Group (optional)
    bloodGroup: {
      type: String,
      default: '',
      trim: true,
      uppercase: true,
    },
    // 10. Academic Session (e.g., 2026–27)
    academicSession: {
      type: String,
      required: [true, 'Academic Session is required'],
      trim: true,
      default: '2026–27',
    },
    status: {
      type: String,
      enum: ['draft', 'forwarded', 'pending', 'verified', 'rejected'],
      default: 'forwarded',
      index: true,
    },
    forwardedAt: {
      type: Date,
      default: Date.now,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index ensures admission numbers are unique per school, but allow duplicates across different schools
studentRecordSchema.index({ schoolId: 1, admissionNumber: 1 }, { unique: true });
studentRecordSchema.index({ schoolId: 1, status: 1, createdAt: -1 });
studentRecordSchema.index({ schoolId: 1, class: 1, section: 1 });
studentRecordSchema.index({ schoolId: 1, academicSession: 1 });
studentRecordSchema.index({
  name: 'text',
  admissionNumber: 'text',
  rollNumber: 'text',
  academicSession: 'text',
});

const StudentRecord = mongoose.model('StudentRecord', studentRecordSchema);

module.exports = StudentRecord;

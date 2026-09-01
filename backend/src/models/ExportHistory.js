const mongoose = require('mongoose');

const exportHistorySchema = new mongoose.Schema(
  {
    exportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      default: null, // null means all schools export
    },
    exportType: {
      type: String,
      enum: [
        'single_school',
        'single_school_package',
        'all_schools',
        'all_schools_package',
        'filtered',
        'photos_only',
      ],
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    filtersApplied: {
      type: Object,
      default: {},
    },
    recordCount: {
      type: Number,
      default: 0,
    },
    fileSizeBytes: {
      type: Number,
      default: 0,
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

exportHistorySchema.index({ createdAt: -1 });
exportHistorySchema.index({ schoolId: 1, createdAt: -1 });

const ExportHistory = mongoose.model('ExportHistory', exportHistorySchema);

module.exports = ExportHistory;

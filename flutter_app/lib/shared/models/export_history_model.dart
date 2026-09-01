import 'school_model.dart';
import 'user_model.dart';

class ExportHistoryModel {
  final String id;
  final UserModel? exportedBy;
  final SchoolModel? school;
  final String exportType;
  final String fileName;
  final Map<String, dynamic> filtersApplied;
  final int recordCount;
  final int fileSizeBytes;
  final DateTime? createdAt;

  ExportHistoryModel({
    required this.id,
    this.exportedBy,
    this.school,
    required this.exportType,
    required this.fileName,
    this.filtersApplied = const {},
    this.recordCount = 0,
    this.fileSizeBytes = 0,
    this.createdAt,
  });

  factory ExportHistoryModel.fromJson(Map<String, dynamic> json) {
    return ExportHistoryModel(
      id: json['id'] ?? json['_id'] ?? '',
      exportedBy: json['exportedBy'] != null && json['exportedBy'] is Map<String, dynamic>
          ? UserModel.fromJson(json['exportedBy'])
          : null,
      school: json['schoolId'] != null && json['schoolId'] is Map<String, dynamic>
          ? SchoolModel.fromJson(json['schoolId'])
          : null,
      exportType: json['exportType'] ?? 'single_school',
      fileName: json['fileName'] ?? 'export.xlsx',
      filtersApplied: json['filtersApplied'] ?? {},
      recordCount: json['recordCount'] ?? 0,
      fileSizeBytes: json['fileSizeBytes'] ?? 0,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt']) : null,
    );
  }
}

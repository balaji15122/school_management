import 'school_model.dart';

class StudentModel {
  final String id;
  final dynamic school; // SchoolModel or map or id
  final dynamic submittedBy;
  final String name; // Student Full Name
  final String? photoUrl; // Student Photo
  final String admissionNumber; // Admission Number / Student ID
  final String studentClass; // Class
  final String section; // Section
  final String rollNumber; // Roll Number
  final DateTime? dob; // Date of Birth
  final String gender; // Gender
  final String bloodGroup; // Blood Group (optional)
  final String academicSession; // Academic Session (e.g., 2026–27)
  final String status; // 'draft', 'forwarded', 'pending', 'verified', 'rejected'
  final DateTime? forwardedAt;
  final String? rejectionReason;
  final dynamic verifiedBy;
  final DateTime? verifiedAt;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  StudentModel({
    required this.id,
    required this.school,
    required this.submittedBy,
    required this.name,
    this.photoUrl,
    required this.admissionNumber,
    required this.studentClass,
    required this.section,
    required this.rollNumber,
    this.dob,
    required this.gender,
    this.bloodGroup = '',
    this.academicSession = '2026–27',
    this.status = 'forwarded',
    this.forwardedAt,
    this.rejectionReason,
    this.verifiedBy,
    this.verifiedAt,
    this.createdAt,
    this.updatedAt,
  });

  bool get isDraft => status.toLowerCase() == 'draft';
  bool get isForwarded => status.toLowerCase() == 'forwarded' || status.toLowerCase() == 'pending';
  bool get isPending => isForwarded;
  bool get isVerified => status.toLowerCase() == 'verified';
  bool get isRejected => status.toLowerCase() == 'rejected';

  String get schoolName {
    if (school is SchoolModel) return (school as SchoolModel).name;
    if (school is Map) return school['name']?.toString() ?? 'N/A';
    return 'N/A';
  }

  String get schoolCode {
    if (school is SchoolModel) return (school as SchoolModel).code;
    if (school is Map) return school['code']?.toString() ?? '';
    return '';
  }

  String get submitterName {
    if (submittedBy is Map) return submittedBy['name']?.toString() ?? 'Staff';
    return 'Staff';
  }

  factory StudentModel.fromJson(Map<String, dynamic> json) {
    dynamic parsedSchool = json['schoolId'];
    if (parsedSchool is Map<String, dynamic>) {
      parsedSchool = SchoolModel.fromJson(parsedSchool);
    }

    return StudentModel(
      id: json['id'] ?? json['_id'] ?? '',
      school: parsedSchool,
      submittedBy: json['submittedBy'],
      name: json['name'] ?? '',
      photoUrl: json['photoUrl'],
      admissionNumber: json['admissionNumber'] ?? '',
      studentClass: json['class'] ?? '',
      section: json['section'] ?? '',
      rollNumber: json['rollNumber'] ?? '',
      dob: json['dob'] != null ? DateTime.tryParse(json['dob']) : null,
      gender: json['gender'] ?? 'other',
      bloodGroup: json['bloodGroup'] ?? '',
      academicSession: json['academicSession'] ?? '2026–27',
      status: json['status'] ?? 'forwarded',
      forwardedAt: json['forwardedAt'] != null
          ? DateTime.tryParse(json['forwardedAt'])
          : (json['createdAt'] != null ? DateTime.tryParse(json['createdAt']) : null),
      rejectionReason: json['rejectionReason'],
      verifiedBy: json['verifiedBy'],
      verifiedAt: json['verifiedAt'] != null ? DateTime.tryParse(json['verifiedAt']) : null,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt']) : null,
      updatedAt: json['updatedAt'] != null ? DateTime.tryParse(json['updatedAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'photoUrl': photoUrl,
      'admissionNumber': admissionNumber,
      'class': studentClass,
      'section': section,
      'rollNumber': rollNumber,
      'dob': dob?.toIso8601String(),
      'gender': gender,
      'bloodGroup': bloodGroup,
      'academicSession': academicSession,
      'status': status,
      'rejectionReason': rejectionReason,
    };
  }
}

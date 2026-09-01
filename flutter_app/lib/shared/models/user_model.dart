import 'school_model.dart';

class UserModel {
  final String id;
  final String name;
  final String email;
  final String phone;
  final String role; // 'super_admin', 'school_admin'
  final dynamic school; // SchoolModel or map or null
  final bool isActive;
  final DateTime? createdAt;

  UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.role,
    this.school,
    this.isActive = true,
    this.createdAt,
  });

  bool get isSuperAdmin => role == 'super_admin';
  bool get isSchoolAdmin => role == 'school_admin';
  bool get isAdminPortalUser => isSuperAdmin || isSchoolAdmin;

  String? get schoolId {
    if (school == null) return null;
    if (school is SchoolModel) return (school as SchoolModel).id;
    if (school is Map) return school['id'] ?? school['_id'];
    return school.toString();
  }

  String? get schoolName {
    if (school == null) return isSuperAdmin ? 'All Platform Schools' : 'N/A';
    if (school is SchoolModel) return (school as SchoolModel).name;
    if (school is Map) return school['name']?.toString() ?? 'N/A';
    return null;
  }

  String? get schoolCode {
    if (school == null) return null;
    if (school is SchoolModel) return (school as SchoolModel).code;
    if (school is Map) return school['code']?.toString();
    return null;
  }

  factory UserModel.fromJson(Map<String, dynamic> json) {
    dynamic parsedSchool;
    if (json['schoolId'] != null) {
      if (json['schoolId'] is Map<String, dynamic>) {
        parsedSchool = SchoolModel.fromJson(json['schoolId']);
      } else {
        parsedSchool = json['schoolId'];
      }
    }

    return UserModel(
      id: json['id'] ?? json['_id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'] ?? '',
      role: json['role'] ?? 'school_admin',
      school: parsedSchool,
      isActive: json['isActive'] ?? true,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'role': role,
      'schoolId': school is SchoolModel ? (school as SchoolModel).toJson() : school,
      'isActive': isActive,
      'createdAt': createdAt?.toIso8601String(),
    };
  }
}

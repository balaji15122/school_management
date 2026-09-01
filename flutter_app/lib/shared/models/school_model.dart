class SchoolStats {
  final int totalStudents;
  final int verified;
  final int pending;
  final int rejected;

  SchoolStats({
    this.totalStudents = 0,
    this.verified = 0,
    this.pending = 0,
    this.rejected = 0,
  });

  factory SchoolStats.fromJson(Map<String, dynamic> json) {
    return SchoolStats(
      totalStudents: json['totalStudents'] ?? json['total'] ?? 0,
      verified: json['verified'] ?? 0,
      pending: json['pending'] ?? 0,
      rejected: json['rejected'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'totalStudents': totalStudents,
    'verified': verified,
    'pending': pending,
    'rejected': rejected,
  };
}

class SchoolModel {
  final String id;
  final String name;
  final String code;
  final String address;
  final String contactEmail;
  final String contactPhone;
  final dynamic adminUser;
  final bool isActive;
  final SchoolStats? stats;
  final DateTime? createdAt;

  SchoolModel({
    required this.id,
    required this.name,
    required this.code,
    this.address = '',
    this.contactEmail = '',
    this.contactPhone = '',
    this.adminUser,
    this.isActive = true,
    this.stats,
    this.createdAt,
  });

  factory SchoolModel.fromJson(Map<String, dynamic> json) {
    return SchoolModel(
      id: json['id'] ?? json['_id'] ?? '',
      name: json['name'] ?? '',
      code: json['code'] ?? '',
      address: json['address'] ?? '',
      contactEmail: json['contactEmail'] ?? '',
      contactPhone: json['contactPhone'] ?? '',
      adminUser: json['adminUser'] ?? json['adminUserId'],
      isActive: json['isActive'] ?? true,
      stats: json['stats'] != null ? SchoolStats.fromJson(json['stats']) : null,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'code': code,
      'address': address,
      'contactEmail': contactEmail,
      'contactPhone': contactPhone,
      'isActive': isActive,
      'stats': stats?.toJson(),
      'createdAt': createdAt?.toIso8601String(),
    };
  }
}

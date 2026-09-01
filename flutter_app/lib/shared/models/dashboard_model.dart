import 'student_model.dart';

class DashboardSummary {
  final int totalSchools;
  final int totalStudents;
  final int verified;
  final int pending;
  final int rejected;

  DashboardSummary({
    this.totalSchools = 0,
    this.totalStudents = 0,
    this.verified = 0,
    this.pending = 0,
    this.rejected = 0,
  });

  factory DashboardSummary.fromJson(Map<String, dynamic> json) {
    return DashboardSummary(
      totalSchools: json['totalSchools'] ?? 0,
      totalStudents: json['totalStudents'] ?? 0,
      verified: json['verified'] ?? 0,
      pending: json['pending'] ?? 0,
      rejected: json['rejected'] ?? 0,
    );
  }
}

class DailySubmission {
  final String date;
  final int count;

  DailySubmission({required this.date, required this.count});

  factory DailySubmission.fromJson(Map<String, dynamic> json) {
    return DailySubmission(
      date: json['date'] ?? '',
      count: json['count'] ?? 0,
    );
  }
}

class ClassDistribution {
  final String studentClass;
  final int count;

  ClassDistribution({required this.studentClass, required this.count});

  factory ClassDistribution.fromJson(Map<String, dynamic> json) {
    return ClassDistribution(
      studentClass: json['class'] ?? '',
      count: json['count'] ?? 0,
    );
  }
}

class DashboardStatsModel {
  final DashboardSummary summary;
  final List<DailySubmission> dailySubmissions;
  final List<ClassDistribution> classDistribution;
  final List<StudentModel> recentSubmissions;

  DashboardStatsModel({
    required this.summary,
    this.dailySubmissions = const [],
    this.classDistribution = const [],
    this.recentSubmissions = const [],
  });

  factory DashboardStatsModel.fromJson(Map<String, dynamic> json) {
    return DashboardStatsModel(
      summary: DashboardSummary.fromJson(json['summary'] ?? {}),
      dailySubmissions: (json['dailySubmissions'] as List<dynamic>?)
              ?.map((e) => DailySubmission.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      classDistribution: (json['classDistribution'] as List<dynamic>?)
              ?.map((e) => ClassDistribution.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      recentSubmissions: (json['recentSubmissions'] as List<dynamic>?)
              ?.map((e) => StudentModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

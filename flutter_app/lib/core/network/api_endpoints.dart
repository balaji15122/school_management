import 'package:flutter/foundation.dart';

class ApiEndpoints {
  // Configurable base URL
  static String get baseUrl {
    const fromEnv = String.fromEnvironment('API_URL');
    if (fromEnv.isNotEmpty) return fromEnv;
    if (kIsWeb) {
      return 'http://localhost:5050/api';
    }
    // Works for physical devices (with adb reverse tcp:5050 tcp:5050) & desktop
    return 'http://localhost:5050/api';
  }

  // Auth
  static const String login = '/auth/login';
  static const String registerSchool = '/auth/register-school';
  static const String refreshToken = '/auth/refresh-token';
  static const String getMe = '/auth/me';
  static const String logout = '/auth/logout';

  // Students
  static const String students = '/students';
  static const String forwardStudents = '/students/forward';
  static const String bulkForward = '/students/bulk/forward';
  static const String bulkStatus = '/students/bulk/status';
  static String studentById(String id) => '/students/$id';
  static String forwardStudent(String id) => '/students/$id/forward';
  static String studentStatus(String id) => '/students/$id/status';

  // Schools
  static const String schools = '/schools';
  static String schoolById(String id) => '/schools/$id';
  static String schoolByCode(String code) => '/schools/by-code/$code';

  // Export
  static String exportSingleSchool(String schoolId) => '/export/school/$schoolId/xlsx';
  static String exportSchoolPackage(String schoolId) => '/export/school/$schoolId/package';
  static String exportSchoolPhotos(String schoolId) => '/export/school/$schoolId/photos';
  static const String exportAllSchools = '/export/all/xlsx';
  static const String exportAllSchoolsPackage = '/export/all/package';
  static const String exportFiltered = '/export/filtered/xlsx';
  static const String exportHistory = '/export/history';

  // Upload
  static const String uploadPhoto = '/upload/photo';

  // Dashboard
  static const String dashboardStats = '/dashboard/stats';

  // Users
  static const String users = '/users';
  static String toggleUserStatus(String id) => '/users/$id/toggle-status';
}

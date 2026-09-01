class AppConstants {
  static const String appName = 'EduCloud';
  static const String appTagline = 'Multi-Tenant School Data Management';
  
  // Storage Keys
  static const String keyAccessToken = 'educloud_access_token';
  static const String keyRefreshToken = 'educloud_refresh_token';
  static const String keyUserData = 'educloud_user_data';
  static const String keyThemeMode = 'educloud_theme_mode';
  static const String keyStudentFormDraft = 'educloud_student_form_draft';

  // Classes list
  static const List<String> schoolClasses = [
    'Grade 1',
    'Grade 2',
    'Grade 3',
    'Grade 4',
    'Grade 5',
    'Grade 6',
    'Grade 7',
    'Grade 8',
    'Grade 9',
    'Grade 10',
    'Grade 11',
    'Grade 12',
  ];

  // Sections
  static const List<String> classSections = ['A', 'B', 'C', 'D', 'E'];

  // Genders
  static const List<String> genders = ['Male', 'Female', 'Other'];

  // Blood Groups
  static const List<String> bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  // Academic Sessions
  static const List<String> academicSessions = [
    '2026–27',
    '2025–26',
    '2024–25',
    '2027–28',
  ];

  // Statuses
  static const List<String> statuses = ['draft', 'forwarded', 'verified', 'rejected'];
}

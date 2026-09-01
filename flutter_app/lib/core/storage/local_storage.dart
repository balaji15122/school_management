import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_constants.dart';

class LocalStorage {
  static SharedPreferences? _prefs;

  static Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  static Future<void> saveTokens({required String accessToken, required String refreshToken}) async {
    await init();
    await _prefs!.setString(AppConstants.keyAccessToken, accessToken);
    await _prefs!.setString(AppConstants.keyRefreshToken, refreshToken);
  }

  static Future<String?> getAccessToken() async {
    await init();
    return _prefs!.getString(AppConstants.keyAccessToken);
  }

  static Future<String?> getRefreshToken() async {
    await init();
    return _prefs!.getString(AppConstants.keyRefreshToken);
  }

  static Future<void> saveUserData(Map<String, dynamic> userData) async {
    await init();
    await _prefs!.setString(AppConstants.keyUserData, jsonEncode(userData));
  }

  static Future<Map<String, dynamic>?> getUserData() async {
    await init();
    final str = _prefs!.getString(AppConstants.keyUserData);
    if (str != null && str.isNotEmpty) {
      try {
        return jsonDecode(str) as Map<String, dynamic>;
      } catch (_) {
        return null;
      }
    }
    return null;
  }

  static Future<void> clearSession() async {
    await init();
    await _prefs!.remove(AppConstants.keyAccessToken);
    await _prefs!.remove(AppConstants.keyRefreshToken);
    await _prefs!.remove(AppConstants.keyUserData);
  }

  // Theme mode
  static Future<void> saveThemeMode(String mode) async {
    await init();
    await _prefs!.setString(AppConstants.keyThemeMode, mode);
  }

  static Future<String> getThemeMode() async {
    await init();
    return _prefs!.getString(AppConstants.keyThemeMode) ?? 'dark';
  }

  // Form Draft Caching (Offline support)
  static Future<void> saveStudentFormDraft(Map<String, dynamic> draftData) async {
    await init();
    await _prefs!.setString(AppConstants.keyStudentFormDraft, jsonEncode(draftData));
  }

  static Future<Map<String, dynamic>?> getStudentFormDraft() async {
    await init();
    final str = _prefs!.getString(AppConstants.keyStudentFormDraft);
    if (str != null && str.isNotEmpty) {
      try {
        return jsonDecode(str) as Map<String, dynamic>;
      } catch (_) {
        return null;
      }
    }
    return null;
  }

  static Future<void> clearStudentFormDraft() async {
    await init();
    await _prefs!.remove(AppConstants.keyStudentFormDraft);
  }
}

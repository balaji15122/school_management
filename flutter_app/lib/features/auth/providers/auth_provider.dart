import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/storage/local_storage.dart';
import '../../../shared/models/user_model.dart';

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

final currentUserProvider = StateProvider<UserModel?>((ref) => null);

// Theme Mode Provider
class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  ThemeModeNotifier() : super(ThemeMode.dark) {
    _loadTheme();
  }

  Future<void> _loadTheme() async {
    final mode = await LocalStorage.getThemeMode();
    state = mode == 'light' ? ThemeMode.light : ThemeMode.dark;
  }

  Future<void> toggleTheme() async {
    final newMode = state == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    state = newMode;
    await LocalStorage.saveThemeMode(newMode == ThemeMode.light ? 'light' : 'dark');
  }
}

final themeModeProvider = StateNotifierProvider<ThemeModeNotifier, ThemeMode>((ref) {
  return ThemeModeNotifier();
});

// Auth State
class AuthState {
  final bool isLoading;
  final bool isAuthenticated;
  final String? error;
  final UserModel? user;

  AuthState({
    this.isLoading = false,
    this.isAuthenticated = false,
    this.error,
    this.user,
  });

  AuthState copyWith({
    bool? isLoading,
    bool? isAuthenticated,
    String? error,
    UserModel? user,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      error: error,
      user: user ?? this.user,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final Ref ref;

  AuthNotifier(this.ref) : super(AuthState(isLoading: true)) {
    checkAuthStatus();
  }

  ApiClient get _api => ref.read(apiClientProvider);

  Future<void> checkAuthStatus() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final token = await LocalStorage.getAccessToken();
      if (token == null) {
        state = state.copyWith(isLoading: false, isAuthenticated: false, user: null);
        ref.read(currentUserProvider.notifier).state = null;
        return;
      }

      final res = await _api.get(ApiEndpoints.getMe);
      if (res['success'] == true && res['data'] != null) {
        final user = UserModel.fromJson(res['data']);
        ref.read(currentUserProvider.notifier).state = user;
        state = state.copyWith(isLoading: false, isAuthenticated: true, user: user);
      } else {
        await LocalStorage.clearSession();
        state = state.copyWith(isLoading: false, isAuthenticated: false, user: null);
        ref.read(currentUserProvider.notifier).state = null;
      }
    } catch (_) {
      // Offline fallback: check cached user data
      final cached = await LocalStorage.getUserData();
      if (cached != null) {
        final user = UserModel.fromJson(cached);
        ref.read(currentUserProvider.notifier).state = user;
        state = state.copyWith(isLoading: false, isAuthenticated: true, user: user);
      } else {
        state = state.copyWith(isLoading: false, isAuthenticated: false, user: null);
        ref.read(currentUserProvider.notifier).state = null;
      }
    }
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await _api.post(
        ApiEndpoints.login,
        data: {'email': email.trim(), 'password': password},
      );

      if (res['success'] == true) {
        final data = res['data'];
        final accessToken = data['accessToken'];
        final refreshToken = data['refreshToken'];
        final userJson = data['user'];

        final user = UserModel.fromJson(userJson);

        await LocalStorage.saveTokens(accessToken: accessToken, refreshToken: refreshToken);
        await LocalStorage.saveUserData(userJson);

        ref.read(currentUserProvider.notifier).state = user;
        state = state.copyWith(isLoading: false, isAuthenticated: true, user: user);
        return true;
      }
      state = state.copyWith(isLoading: false, error: res['message'] ?? 'Login failed');
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<bool> registerSchool({
    required String schoolName,
    required String schoolCode,
    required String schoolAddress,
    required String schoolContactEmail,
    required String schoolContactPhone,
    required String adminName,
    required String adminEmail,
    required String adminPhone,
    required String adminPassword,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await _api.post(
        ApiEndpoints.registerSchool,
        data: {
          'schoolName': schoolName,
          'schoolCode': schoolCode,
          'schoolAddress': schoolAddress,
          'schoolContactEmail': schoolContactEmail,
          'schoolContactPhone': schoolContactPhone,
          'adminName': adminName,
          'adminEmail': adminEmail,
          'adminPhone': adminPhone,
          'adminPassword': adminPassword,
        },
      );

      if (res['success'] == true) {
        final data = res['data'];
        final accessToken = data['accessToken'];
        final refreshToken = data['refreshToken'];
        final userJson = data['user'];
        final user = UserModel.fromJson(userJson);

        await LocalStorage.saveTokens(accessToken: accessToken, refreshToken: refreshToken);
        await LocalStorage.saveUserData(userJson);

        ref.read(currentUserProvider.notifier).state = user;
        state = state.copyWith(isLoading: false, isAuthenticated: true, user: user);
        return true;
      }
      state = state.copyWith(isLoading: false, error: res['message'] ?? 'Registration failed');
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<void> logout() async {
    try {
      await _api.post(ApiEndpoints.logout);
    } catch (_) {}
    await LocalStorage.clearSession();
    ref.read(currentUserProvider.notifier).state = null;
    state = AuthState(isLoading: false, isAuthenticated: false, user: null);
  }
}

final authNotifierProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref);
});

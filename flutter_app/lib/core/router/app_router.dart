import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/admin_portal/dashboard/presentation/admin_dashboard_screen.dart';
import '../../features/admin_portal/export_center/presentation/export_center_screen.dart';
import '../../features/admin_portal/schools/presentation/schools_management_screen.dart';
import '../../features/admin_portal/students/presentation/admin_students_screen.dart';
import '../../features/admin_portal/users/presentation/users_management_screen.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/register_school_screen.dart';
import '../../features/auth/providers/auth_provider.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authNotifierProvider);

  return GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
      final isAuth = authState.isAuthenticated;
      final user = authState.user;
      final loc = state.matchedLocation;

      final isPublicRoute = loc == '/login' || loc == '/register-school';

      // Still checking initial token
      if (authState.isLoading) return null;

      // 1. Not logged in -> go to /login if trying to access protected routes
      if (!isAuth) {
        return isPublicRoute ? null : '/login';
      }

      // 2. Logged in and on a public auth screen -> redirect to dashboard
      if (isPublicRoute) {
        return '/admin/dashboard';
      }

      // 3. Super admin only routes
      if ((loc == '/admin/schools' || loc == '/admin/users') && user?.role != 'super_admin') {
        return '/admin/dashboard';
      }

      return null;
    },
    routes: [
      // Public Auth Routes
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register-school',
        builder: (context, state) => const RegisterSchoolScreen(),
      ),

      // Admin & School Portal Routes
      GoRoute(
        path: '/admin/dashboard',
        builder: (context, state) => const AdminDashboardScreen(),
      ),
      GoRoute(
        path: '/admin/schools',
        builder: (context, state) => const SchoolsManagementScreen(),
      ),
      GoRoute(
        path: '/admin/students',
        builder: (context, state) => const AdminStudentsScreen(),
      ),
      GoRoute(
        path: '/admin/export',
        builder: (context, state) => const ExportCenterScreen(),
      ),
      GoRoute(
        path: '/admin/users',
        builder: (context, state) => const UsersManagementScreen(),
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Text('Page not found: ${state.uri}'),
      ),
    ),
  );
});

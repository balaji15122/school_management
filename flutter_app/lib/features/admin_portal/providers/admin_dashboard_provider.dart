import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../shared/models/dashboard_model.dart';
import '../../auth/providers/auth_provider.dart';

final adminDashboardStatsProvider = FutureProvider.autoDispose<DashboardStatsModel>((ref) async {
  final api = ref.read(apiClientProvider);
  final res = await api.get(ApiEndpoints.dashboardStats);
  if (res['success'] == true && res['data'] != null) {
    return DashboardStatsModel.fromJson(res['data']);
  }
  throw Exception('Failed to load dashboard metrics');
});

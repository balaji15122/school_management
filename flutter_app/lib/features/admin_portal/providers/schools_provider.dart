import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../shared/models/school_model.dart';
import '../../auth/providers/auth_provider.dart';

final schoolsListProvider = FutureProvider.autoDispose<List<SchoolModel>>((ref) async {
  final api = ref.read(apiClientProvider);
  final res = await api.get(ApiEndpoints.schools);
  if (res['success'] == true && res['data'] != null) {
    return (res['data'] as List<dynamic>)
        .map((e) => SchoolModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }
  return [];
});

class SchoolsNotifier extends StateNotifier<AsyncValue<void>> {
  final Ref ref;

  SchoolsNotifier(this.ref) : super(const AsyncValue.data(null));

  Future<bool> createSchool({
    required String name,
    required String code,
    required String address,
    required String contactEmail,
    required String contactPhone,
  }) async {
    state = const AsyncValue.loading();
    try {
      final api = ref.read(apiClientProvider);
      final res = await api.post(
        ApiEndpoints.schools,
        data: {
          'name': name,
          'code': code.toUpperCase(),
          'address': address,
          'contactEmail': contactEmail,
          'contactPhone': contactPhone,
        },
      );

      if (res['success'] == true) {
        state = const AsyncValue.data(null);
        ref.invalidate(schoolsListProvider);
        return true;
      }
      state = AsyncValue.error(res['message'] ?? 'Failed to create school', StackTrace.current);
      return false;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }
}

final schoolsNotifierProvider = StateNotifierProvider<SchoolsNotifier, AsyncValue<void>>((ref) {
  return SchoolsNotifier(ref);
});

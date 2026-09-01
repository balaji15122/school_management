import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:school_management/core/network/api_client.dart';
import 'package:school_management/core/network/api_endpoints.dart';
import 'package:school_management/core/utils/file_downloader.dart';
import 'package:school_management/shared/models/export_history_model.dart';
import 'package:school_management/features/auth/providers/auth_provider.dart';

final exportHistoryProvider = FutureProvider.autoDispose<List<ExportHistoryModel>>((ref) async {
  final api = ref.read(apiClientProvider);
  final res = await api.get(ApiEndpoints.exportHistory);
  if (res['success'] == true && res['data'] != null) {
    return (res['data'] as List<dynamic>)
        .map((e) => ExportHistoryModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }
  return [];
});

class ExportNotifier extends StateNotifier<AsyncValue<void>> {
  final Ref ref;

  ExportNotifier(this.ref) : super(const AsyncValue.data(null));

  ApiClient get _api => ref.read(apiClientProvider);

  Future<bool> exportSingleSchool(String schoolId, String schoolName, [Map<String, dynamic>? queryParams]) async {
    state = const AsyncValue.loading();
    try {
      final bytes = await _api.downloadBytes(
        ApiEndpoints.exportSingleSchool(schoolId),
        queryParameters: queryParams,
      );
      if (bytes.isNotEmpty) {
        final clean = schoolName.replaceAll(RegExp(r'[^a-zA-Z0-9_-]'), '_');
        final fileName = '${clean}_Students_${DateTime.now().toIso8601String().split('T')[0]}.xlsx';
        FileDownloader.saveFileFromBytes(bytes: bytes, fileName: fileName);
        state = const AsyncValue.data(null);
        ref.invalidate(exportHistoryProvider);
        return true;
      }
      state = AsyncValue.error('Received empty export file', StackTrace.current);
      return false;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }

  Future<bool> exportSchoolPackage(String schoolId, String schoolName, [Map<String, dynamic>? queryParams]) async {
    state = const AsyncValue.loading();
    try {
      final bytes = await _api.downloadBytes(
        ApiEndpoints.exportSchoolPackage(schoolId),
        queryParameters: queryParams,
      );
      if (bytes.isNotEmpty) {
        final clean = schoolName.replaceAll(RegExp(r'[^a-zA-Z0-9_-]'), '_');
        final fileName = '${clean}_Data_Package_${DateTime.now().toIso8601String().split('T')[0]}.zip';
        FileDownloader.saveFileFromBytes(bytes: bytes, fileName: fileName);
        state = const AsyncValue.data(null);
        ref.invalidate(exportHistoryProvider);
        return true;
      }
      state = AsyncValue.error('Received empty package file', StackTrace.current);
      return false;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }

  Future<bool> exportSchoolPhotos(String schoolId, String schoolName, [Map<String, dynamic>? queryParams]) async {
    state = const AsyncValue.loading();
    try {
      final bytes = await _api.downloadBytes(
        ApiEndpoints.exportSchoolPhotos(schoolId),
        queryParameters: queryParams,
      );
      if (bytes.isNotEmpty) {
        final clean = schoolName.replaceAll(RegExp(r'[^a-zA-Z0-9_-]'), '_');
        final fileName = '${clean}_Photos_${DateTime.now().toIso8601String().split('T')[0]}.zip';
        FileDownloader.saveFileFromBytes(bytes: bytes, fileName: fileName);
        state = const AsyncValue.data(null);
        ref.invalidate(exportHistoryProvider);
        return true;
      }
      state = AsyncValue.error('Received empty photos archive', StackTrace.current);
      return false;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }

  Future<bool> exportAllSchools() async {
    state = const AsyncValue.loading();
    try {
      final bytes = await _api.downloadBytes(ApiEndpoints.exportAllSchools);
      if (bytes.isNotEmpty) {
        final fileName = 'All_Schools_Master_Workbook_${DateTime.now().toIso8601String().split('T')[0]}.xlsx';
        FileDownloader.saveFileFromBytes(bytes: bytes, fileName: fileName);
        state = const AsyncValue.data(null);
        ref.invalidate(exportHistoryProvider);
        return true;
      }
      state = AsyncValue.error('Received empty workbook', StackTrace.current);
      return false;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }

  Future<bool> exportAllSchoolsPackage() async {
    state = const AsyncValue.loading();
    try {
      final bytes = await _api.downloadBytes(ApiEndpoints.exportAllSchoolsPackage);
      if (bytes.isNotEmpty) {
        final fileName = 'All_Schools_Master_Package_${DateTime.now().toIso8601String().split('T')[0]}.zip';
        FileDownloader.saveFileFromBytes(bytes: bytes, fileName: fileName);
        state = const AsyncValue.data(null);
        ref.invalidate(exportHistoryProvider);
        return true;
      }
      state = AsyncValue.error('Received empty master package', StackTrace.current);
      return false;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }

  Future<bool> exportFiltered(Map<String, dynamic> queryParams) async {
    state = const AsyncValue.loading();
    try {
      final bytes = await _api.downloadBytes(
        ApiEndpoints.exportFiltered,
        queryParameters: queryParams,
      );
      if (bytes.isNotEmpty) {
        final fileName = 'Filtered_Students_Export_${DateTime.now().toIso8601String().split('T')[0]}.xlsx';
        FileDownloader.saveFileFromBytes(bytes: bytes, fileName: fileName);
        state = const AsyncValue.data(null);
        ref.invalidate(exportHistoryProvider);
        return true;
      }
      state = AsyncValue.error('Received empty export file', StackTrace.current);
      return false;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }
}

final exportNotifierProvider = StateNotifierProvider<ExportNotifier, AsyncValue<void>>((ref) {
  return ExportNotifier(ref);
});

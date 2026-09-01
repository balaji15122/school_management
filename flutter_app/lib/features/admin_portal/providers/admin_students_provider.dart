import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../shared/models/student_model.dart';
import '../../auth/providers/auth_provider.dart';

class StudentFilterState {
  final String? schoolId;
  final String? studentClass;
  final String? section;
  final String? academicSession;
  final String? status;
  final String search;
  final int page;
  final int limit;

  StudentFilterState({
    this.schoolId,
    this.studentClass,
    this.section,
    this.academicSession,
    this.status,
    this.search = '',
    this.page = 1,
    this.limit = 25,
  });

  StudentFilterState copyWith({
    String? schoolId,
    String? studentClass,
    String? section,
    String? academicSession,
    String? status,
    String? search,
    int? page,
    int? limit,
    bool clearSchoolId = false,
  }) {
    return StudentFilterState(
      schoolId: clearSchoolId ? null : (schoolId ?? this.schoolId),
      studentClass: studentClass ?? this.studentClass,
      section: section ?? this.section,
      academicSession: academicSession ?? this.academicSession,
      status: status ?? this.status,
      search: search ?? this.search,
      page: page ?? this.page,
      limit: limit ?? this.limit,
    );
  }

  Map<String, dynamic> toQueryParams() {
    final params = <String, dynamic>{
      'page': page,
      'limit': limit,
    };
    if (schoolId != null && schoolId!.isNotEmpty && schoolId != 'all') {
      params['schoolId'] = schoolId;
    }
    if (studentClass != null && studentClass!.isNotEmpty && studentClass != 'all') {
      params['class'] = studentClass;
    }
    if (section != null && section!.isNotEmpty && section != 'all') {
      params['section'] = section;
    }
    if (academicSession != null && academicSession!.isNotEmpty && academicSession != 'all') {
      params['academicSession'] = academicSession;
    }
    if (status != null && status!.isNotEmpty && status != 'all') {
      params['status'] = status;
    }
    if (search.isNotEmpty) {
      params['search'] = search;
    }
    return params;
  }
}

class StudentFilterNotifier extends StateNotifier<StudentFilterState> {
  StudentFilterNotifier() : super(StudentFilterState());

  void setSchoolId(String? schoolId) => state = state.copyWith(schoolId: schoolId, page: 1);
  void clearSchoolId() => state = state.copyWith(clearSchoolId: true, page: 1);
  void setClass(String? cls) => state = state.copyWith(studentClass: cls, page: 1);
  void setSection(String? sec) => state = state.copyWith(section: sec, page: 1);
  void setAcademicSession(String? ses) => state = state.copyWith(academicSession: ses, page: 1);
  void setStatus(String? st) => state = state.copyWith(status: st, page: 1);
  void setSearch(String q) => state = state.copyWith(search: q, page: 1);
  void setPage(int p) => state = state.copyWith(page: p);
  void resetFilters() => state = StudentFilterState();
}

final studentFilterProvider =
    StateNotifierProvider<StudentFilterNotifier, StudentFilterState>((ref) {
  return StudentFilterNotifier();
});

// Selected student IDs for bulk actions
final selectedStudentIdsProvider = StateProvider<Set<String>>((ref) => {});

// Student List Future Provider
final adminStudentsListProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final api = ref.read(apiClientProvider);
  final filter = ref.watch(studentFilterProvider);

  final res = await api.get(
    ApiEndpoints.students,
    queryParameters: filter.toQueryParams(),
  );

  if (res['success'] == true && res['data'] != null) {
    final list = (res['data'] as List<dynamic>)
        .map((e) => StudentModel.fromJson(e as Map<String, dynamic>))
        .toList();
    final pagination = res['pagination'] ?? {'total': list.length, 'page': 1, 'totalPages': 1};

    return {
      'students': list,
      'pagination': pagination,
    };
  }
  return {'students': <StudentModel>[], 'pagination': {'total': 0, 'page': 1, 'totalPages': 1}};
});

// Admin Students Actions Notifier
class AdminStudentsActionNotifier extends StateNotifier<AsyncValue<void>> {
  final Ref ref;

  AdminStudentsActionNotifier(this.ref) : super(const AsyncValue.data(null));

  Future<bool> createStudent(Map<String, dynamic> data) async {
    state = const AsyncValue.loading();
    try {
      final api = ref.read(apiClientProvider);
      final res = await api.post(ApiEndpoints.students, data: data);
      if (res['success'] == true) {
        state = const AsyncValue.data(null);
        ref.invalidate(adminStudentsListProvider);
        return true;
      }
      state = AsyncValue.error(res['message'] ?? 'Failed to create student', StackTrace.current);
      return false;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }

  Future<bool> updateStudent({required String studentId, required Map<String, dynamic> data}) async {
    state = const AsyncValue.loading();
    try {
      final api = ref.read(apiClientProvider);
      final res = await api.patch(ApiEndpoints.studentById(studentId), data: data);
      if (res['success'] == true) {
        state = const AsyncValue.data(null);
        ref.invalidate(adminStudentsListProvider);
        return true;
      }
      state = AsyncValue.error(res['message'] ?? 'Failed to update student', StackTrace.current);
      return false;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }

  Future<bool> deleteStudent(String studentId) async {
    state = const AsyncValue.loading();
    try {
      final api = ref.read(apiClientProvider);
      final res = await api.delete(ApiEndpoints.studentById(studentId));
      if (res['success'] == true) {
        state = const AsyncValue.data(null);
        ref.invalidate(adminStudentsListProvider);
        return true;
      }
      state = AsyncValue.error(res['message'] ?? 'Failed to delete student', StackTrace.current);
      return false;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }

  Future<bool> forwardToSuperAdmin({String? studentId, List<String>? ids}) async {
    state = const AsyncValue.loading();
    try {
      final api = ref.read(apiClientProvider);
      final endpoint = studentId != null
          ? ApiEndpoints.forwardStudent(studentId)
          : (ids != null && ids.isNotEmpty ? ApiEndpoints.bulkForward : ApiEndpoints.forwardStudents);
      
      final res = await api.patch(
        endpoint,
        data: ids != null ? {'ids': ids} : {},
      );

      if (res['success'] == true) {
        state = const AsyncValue.data(null);
        ref.read(selectedStudentIdsProvider.notifier).state = {};
        ref.invalidate(adminStudentsListProvider);
        return true;
      }
      state = AsyncValue.error(res['message'] ?? 'Failed to forward to Super Admin', StackTrace.current);
      return false;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }

  Future<bool> updateStatus({
    required String studentId,
    required String status,
    String? rejectionReason,
  }) async {
    state = const AsyncValue.loading();
    try {
      final api = ref.read(apiClientProvider);
      final res = await api.patch(
        ApiEndpoints.studentStatus(studentId),
        data: {
          'status': status,
          'rejectionReason': rejectionReason ?? '',
        },
      );

      if (res['success'] == true) {
        state = const AsyncValue.data(null);
        ref.invalidate(adminStudentsListProvider);
        return true;
      }
      state = AsyncValue.error(res['message'] ?? 'Failed to update status', StackTrace.current);
      return false;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }

  Future<bool> bulkUpdateStatus({
    required List<String> ids,
    required String status,
    String? rejectionReason,
  }) async {
    state = const AsyncValue.loading();
    try {
      final api = ref.read(apiClientProvider);
      final res = await api.patch(
        ApiEndpoints.bulkStatus,
        data: {
          'ids': ids,
          'status': status,
          'rejectionReason': rejectionReason ?? '',
        },
      );

      if (res['success'] == true) {
        state = const AsyncValue.data(null);
        ref.read(selectedStudentIdsProvider.notifier).state = {};
        ref.invalidate(adminStudentsListProvider);
        return true;
      }
      state = AsyncValue.error(res['message'] ?? 'Bulk update failed', StackTrace.current);
      return false;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }
}

final adminStudentsActionProvider =
    StateNotifierProvider<AdminStudentsActionNotifier, AsyncValue<void>>((ref) {
  return AdminStudentsActionNotifier(ref);
});

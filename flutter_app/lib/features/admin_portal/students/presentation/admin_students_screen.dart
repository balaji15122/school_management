import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:school_management/core/theme/app_colors.dart';
import 'package:school_management/core/utils/formatters.dart';
import 'package:school_management/shared/models/school_model.dart';
import 'package:school_management/shared/models/student_model.dart';
import 'package:school_management/shared/widgets/confirmation_dialog.dart';
import 'package:school_management/shared/widgets/empty_state_view.dart';
import 'package:school_management/shared/widgets/error_state_view.dart';
import 'package:school_management/shared/widgets/responsive_scaffold.dart';
import 'package:school_management/shared/widgets/status_badge.dart';
import 'package:school_management/features/auth/providers/auth_provider.dart';
import 'package:school_management/features/admin_portal/export_center/providers/export_provider.dart';
import 'package:school_management/features/admin_portal/providers/schools_provider.dart';
import 'package:school_management/features/admin_portal/providers/admin_students_provider.dart';
import 'package:school_management/features/admin_portal/students/widgets/student_detail_modal.dart';
import 'package:school_management/features/admin_portal/students/widgets/student_filter_bar.dart';
import 'package:school_management/features/admin_portal/students/widgets/student_form_dialog.dart';

class AdminStudentsScreen extends ConsumerWidget {
  const AdminStudentsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final studentsAsync = ref.watch(adminStudentsListProvider);
    final selectedIds = ref.watch(selectedStudentIdsProvider);
    final user = ref.watch(currentUserProvider);
    final filter = ref.watch(studentFilterProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isSuperAdmin = user?.isSuperAdmin ?? false;

    return ResponsiveScaffold(
      title: isSuperAdmin ? 'All School Students' : 'Student Admissions & Upload',
      currentRoute: '/admin/students',
      actions: [
        if (!isSuperAdmin) ...[
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.accent,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
            onPressed: () => StudentFormDialog.show(context),
            icon: const Icon(Icons.add_rounded, size: 16),
            label: const Text('Add Student', style: TextStyle(fontSize: 12)),
          ),
          const SizedBox(width: 8),
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8)),
            onPressed: () async {
              final confirmed = await ConfirmationDialog.show(
                context,
                title: 'Forward All Drafts',
                message: 'Send all draft student records to Super Admin for verification?',
                confirmLabel: 'Forward All',
              );
              if (confirmed && context.mounted) {
                await ref.read(adminStudentsActionProvider.notifier).forwardToSuperAdmin();
              }
            },
            icon: const Icon(Icons.send_rounded, size: 14),
            label: const Text('Forward All Drafts', style: TextStyle(fontSize: 12)),
          ),
          const SizedBox(width: 8),
        ],
        OutlinedButton.icon(
          style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8)),
          onPressed: () async {
            if (isSuperAdmin) {
              final selectedSchoolId = filter.schoolId;
              final schoolsList = ref.read(schoolsListProvider).valueOrNull ?? [];

              if (selectedSchoolId != null && selectedSchoolId != 'all') {
                final targetSchool = schoolsList.firstWhere(
                  (s) => s.id == selectedSchoolId,
                  orElse: () => SchoolModel(
                    id: selectedSchoolId,
                    name: 'School',
                    code: 'SCH',
                  ),
                );
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Generating Complete Package (Excel + Photos) for ${targetSchool.name}...')),
                );
                await ref.read(exportNotifierProvider.notifier).exportSchoolPackage(targetSchool.id, targetSchool.name, filter.toQueryParams());
              } else {
                _showSelectSchoolExportDialog(context, ref, schoolsList, filter.toQueryParams());
              }
            } else {
              final schoolId = user?.schoolId ?? '';
              final schoolName = user?.schoolName ?? 'School';
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Generating Complete Package (Excel + Photos) for $schoolName...')),
              );
              await ref.read(exportNotifierProvider.notifier).exportSchoolPackage(schoolId, schoolName, filter.toQueryParams());
            }
          },
          icon: const Icon(Icons.folder_zip_rounded, size: 14, color: AppColors.accent),
          label: const Text('Export Package (.ZIP)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
        ),
        const SizedBox(width: 8),
        OutlinedButton.icon(
          style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8)),
          onPressed: () async {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Generating Filtered Excel Export...')),
            );
            await ref.read(exportNotifierProvider.notifier).exportFiltered(filter.toQueryParams());
          },
          icon: const Icon(Icons.download_rounded, size: 14),
          label: const Text('Export .XLSX', style: TextStyle(fontSize: 12)),
        ),
      ],
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Filter Bar
            const StudentFilterBar(),
            const SizedBox(height: 12),

            // Bulk Actions Bar (when rows are selected)
            if (selectedIds.isNotEmpty) ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkSurfaceCard : Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.accent.withValues(alpha: 0.3)),
                  boxShadow: isDark ? null : AppColors.subtleShadow,
                ),
                child: Row(
                  children: [
                    Text(
                      '${selectedIds.length} selected',
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                    ),
                    const Spacer(),
                    if (!isSuperAdmin) ...[
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.accent,
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        ),
                        onPressed: () async {
                          final confirmed = await ConfirmationDialog.show(
                            context,
                            title: 'Forward Selected',
                            message: 'Forward ${selectedIds.length} student record(s) to Super Admin?',
                            confirmLabel: 'Forward to Super Admin',
                          );
                          if (confirmed && context.mounted) {
                            await ref.read(adminStudentsActionProvider.notifier).forwardToSuperAdmin(
                              ids: selectedIds.toList(),
                            );
                          }
                        },
                        icon: const Icon(Icons.send_rounded, size: 13),
                        label: const Text('Forward to Super Admin', style: TextStyle(fontSize: 11)),
                      ),
                    ] else ...[
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.success,
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        ),
                        onPressed: () async {
                          final confirmed = await ConfirmationDialog.show(
                            context,
                            title: 'Bulk Verify',
                            message: 'Verify ${selectedIds.length} student record(s)?',
                            confirmLabel: 'Verify All',
                            confirmColor: AppColors.success,
                          );
                          if (confirmed) {
                            await ref.read(adminStudentsActionProvider.notifier).bulkUpdateStatus(
                              ids: selectedIds.toList(),
                              status: 'verified',
                            );
                          }
                        },
                        child: const Text('Verify', style: TextStyle(fontSize: 11)),
                      ),
                      const SizedBox(width: 8),
                      OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.error,
                          side: const BorderSide(color: AppColors.error),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        ),
                        onPressed: () async {
                          final confirmed = await ConfirmationDialog.show(
                            context,
                            title: 'Bulk Reject',
                            message: 'Reject ${selectedIds.length} student record(s)?',
                            confirmLabel: 'Reject All',
                            confirmColor: AppColors.error,
                          );
                          if (confirmed) {
                            await ref.read(adminStudentsActionProvider.notifier).bulkUpdateStatus(
                              ids: selectedIds.toList(),
                              status: 'rejected',
                            );
                          }
                        },
                        child: const Text('Reject', style: TextStyle(fontSize: 11)),
                      ),
                    ],
                    const SizedBox(width: 6),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, size: 16),
                      onPressed: () => ref.read(selectedStudentIdsProvider.notifier).state = {},
                    ),
                  ],
                ),
              ),
            ],

            // Student Records Container
            studentsAsync.when(
              loading: () => const Center(
                child: Padding(
                  padding: EdgeInsets.all(40),
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ),
              error: (err, _) => ErrorStateView(
                message: err.toString(),
                onRetry: () => ref.refresh(adminStudentsListProvider),
              ),
              data: (result) {
                final students = result['students'] as List<StudentModel>;
                final pagination = result['pagination'] as Map<String, dynamic>;
                final total = pagination['total'] ?? 0;
                final totalPages = pagination['totalPages'] ?? 1;
                final currentPage = pagination['page'] ?? 1;

                if (students.isEmpty) {
                  return EmptyStateView(
                    title: 'No Students Found',
                    message: isSuperAdmin
                        ? 'No student records match the active filter criteria.'
                        : 'No students uploaded yet. Click "+ Add Student" to upload your first student!',
                    actionLabel: isSuperAdmin ? 'Reset Filters' : '+ Add Student',
                    onAction: () {
                      if (isSuperAdmin) {
                        ref.read(studentFilterProvider.notifier).resetFilters();
                      } else {
                        StudentFormDialog.show(context);
                      }
                    },
                  );
                }

                return LayoutBuilder(
                  builder: (context, constraints) {
                    final isDesktop = constraints.maxWidth >= 850;

                    return Container(
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.darkSurfaceCard : Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
                        boxShadow: isDark ? null : AppColors.subtleShadow,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          if (isDesktop)
                            _buildDataTable(students, selectedIds, isSuperAdmin, isDark, ref, context)
                          else
                            _buildMobileList(students, selectedIds, isSuperAdmin, isDark, ref, context),

                          // Clean Pagination Footer
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            decoration: BoxDecoration(
                              border: Border(
                                top: BorderSide(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
                              ),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Showing ${students.length} of $total records',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                                  ),
                                ),
                                Row(
                                  children: [
                                    IconButton(
                                      icon: const Icon(Icons.chevron_left_rounded, size: 20),
                                      onPressed: currentPage > 1
                                          ? () => ref.read(studentFilterProvider.notifier).setPage(currentPage - 1)
                                          : null,
                                    ),
                                    Text(
                                      '$currentPage / $totalPages',
                                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.chevron_right_rounded, size: 20),
                                      onPressed: currentPage < totalPages
                                          ? () => ref.read(studentFilterProvider.notifier).setPage(currentPage + 1)
                                          : null,
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDataTable(
    List<StudentModel> students,
    Set<String> selectedIds,
    bool isSuperAdmin,
    bool isDark,
    WidgetRef ref,
    BuildContext context,
  ) {
    final allSelected = students.isNotEmpty && students.every((s) => selectedIds.contains(s.id));

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(
        headingRowColor: WidgetStateProperty.all(
          isDark ? const Color(0xFF0F172A) : AppColors.lightBackground,
        ),
        columns: [
          DataColumn(
            label: Checkbox(
              value: allSelected,
              onChanged: (val) {
                if (val == true) {
                  ref.read(selectedStudentIdsProvider.notifier).state = students.map((s) => s.id).toSet();
                } else {
                  ref.read(selectedStudentIdsProvider.notifier).state = {};
                }
              },
            ),
          ),
          const DataColumn(label: Text('Student Full Name', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12))),
          const DataColumn(label: Text('Student ID / Adm No', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12))),
          const DataColumn(label: Text('Roll No', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12))),
          if (isSuperAdmin)
            const DataColumn(label: Text('School Tenant', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12))),
          const DataColumn(label: Text('Class & Sec', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12))),
          const DataColumn(label: Text('Academic Session', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12))),
          const DataColumn(label: Text('Blood Group', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12))),
          const DataColumn(label: Text('Status', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12))),
          const DataColumn(label: Text('Actions', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12))),
        ],
        rows: students.map((student) {
          final isRowSelected = selectedIds.contains(student.id);

          return DataRow(
            selected: isRowSelected,
            onSelectChanged: (val) {
              final cur = Set<String>.from(ref.read(selectedStudentIdsProvider));
              if (val == true) {
                cur.add(student.id);
              } else {
                cur.remove(student.id);
              }
              ref.read(selectedStudentIdsProvider.notifier).state = cur;
            },
            cells: [
              DataCell(
                Checkbox(
                  value: isRowSelected,
                  onChanged: (val) {
                    final cur = Set<String>.from(ref.read(selectedStudentIdsProvider));
                    if (val == true) {
                      cur.add(student.id);
                    } else {
                      cur.remove(student.id);
                    }
                    ref.read(selectedStudentIdsProvider.notifier).state = cur;
                  },
                ),
              ),
              // Student Name & Photo
              DataCell(
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircleAvatar(
                      radius: 14,
                      backgroundColor: isDark ? AppColors.accent.withValues(alpha: 0.2) : AppColors.accentSubtle,
                      backgroundImage: student.photoUrl != null ? NetworkImage(student.photoUrl!) : null,
                      child: student.photoUrl == null
                          ? Text(
                              Formatters.getInitials(student.name),
                              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.accent),
                            )
                          : null,
                    ),
                    const SizedBox(width: 10),
                    Text(student.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
                  ],
                ),
              ),
              DataCell(Text(student.admissionNumber, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500))),
              DataCell(Text(student.rollNumber, style: const TextStyle(fontSize: 12))),
              if (isSuperAdmin)
                DataCell(Text(student.schoolName, style: const TextStyle(fontSize: 12))),
              DataCell(Text('${student.studentClass}-${student.section}', style: const TextStyle(fontSize: 12))),
              DataCell(Text(student.academicSession, style: const TextStyle(fontSize: 12))),
              DataCell(Text(student.bloodGroup.isNotEmpty ? student.bloodGroup : 'N/A', style: const TextStyle(fontSize: 11))),
              DataCell(StatusBadge(status: student.status, fontSize: 10)),
              DataCell(
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.visibility_outlined, size: 16),
                      tooltip: 'View Full Details',
                      onPressed: () => StudentDetailModal.show(context, student: student),
                    ),
                    if (!isSuperAdmin) ...[
                      IconButton(
                        icon: const Icon(Icons.edit_outlined, size: 16),
                        tooltip: 'Edit Student',
                        onPressed: () => StudentFormDialog.show(context, studentToEdit: student),
                      ),
                      if (student.isDraft) ...[
                        IconButton(
                          icon: const Icon(Icons.send_rounded, color: AppColors.accent, size: 16),
                          tooltip: 'Forward to Super Admin',
                          onPressed: () async {
                            final confirmed = await ConfirmationDialog.show(
                              context,
                              title: 'Forward to Super Admin',
                              message: 'Send ${student.name} to Super Admin now?',
                              confirmLabel: 'Forward Now',
                            );
                            if (confirmed) {
                              await ref.read(adminStudentsActionProvider.notifier).forwardToSuperAdmin(
                                studentId: student.id,
                              );
                            }
                          },
                        ),
                      ],
                    ],
                    if (isSuperAdmin && student.status != 'verified') ...[
                      IconButton(
                        icon: const Icon(Icons.check_circle_outline_rounded, color: AppColors.success, size: 16),
                        tooltip: 'Approve & Verify',
                        onPressed: () async {
                          await ref.read(adminStudentsActionProvider.notifier).updateStatus(
                            studentId: student.id,
                            status: 'verified',
                          );
                        },
                      ),
                    ],
                  ],
                ),
              ),
            ],
          );
        }).toList(),
      ),
    );
  }

  Widget _buildMobileList(
    List<StudentModel> students,
    Set<String> selectedIds,
    bool isSuperAdmin,
    bool isDark,
    WidgetRef ref,
    BuildContext context,
  ) {
    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: students.length,
      separatorBuilder: (_, __) => Divider(
        color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
        height: 1,
      ),
      itemBuilder: (context, index) {
        final student = students[index];
        final isSelected = selectedIds.contains(student.id);

        return InkWell(
          onTap: () => StudentDetailModal.show(context, student: student),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            child: Row(
              children: [
                Checkbox(
                  value: isSelected,
                  onChanged: (val) {
                    final cur = Set<String>.from(ref.read(selectedStudentIdsProvider));
                    if (val == true) {
                      cur.add(student.id);
                    } else {
                      cur.remove(student.id);
                    }
                    ref.read(selectedStudentIdsProvider.notifier).state = cur;
                  },
                ),
                CircleAvatar(
                  radius: 18,
                  backgroundColor: isDark ? AppColors.accent.withValues(alpha: 0.2) : AppColors.accentSubtle,
                  backgroundImage: student.photoUrl != null ? NetworkImage(student.photoUrl!) : null,
                  child: student.photoUrl == null
                      ? Text(
                          Formatters.getInitials(student.name),
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.accent),
                        )
                      : null,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              student.name,
                              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          StatusBadge(status: student.status, fontSize: 9),
                        ],
                      ),
                      const SizedBox(height: 3),
                      Text(
                        '${student.schoolName} • ${student.studentClass}-${student.section} • Roll: ${student.rollNumber} • Adm: ${student.admissionNumber}',
                        style: TextStyle(
                          fontSize: 11,
                          color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 4),
                Icon(
                  Icons.chevron_right_rounded,
                  size: 18,
                  color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showSelectSchoolExportDialog(
    BuildContext context,
    WidgetRef ref,
    List<SchoolModel> schools,
    Map<String, dynamic> queryParams,
  ) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isDark ? AppColors.accent.withValues(alpha: 0.2) : AppColors.accentSubtle,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.folder_zip_rounded, color: AppColors.accent, size: 20),
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Text(
                'Select School for ZIP Export',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
              ),
            ),
          ],
        ),
        content: SizedBox(
          width: 460,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Select a particular school to download its complete data package (.ZIP with Excel + student photos):',
                style: TextStyle(fontSize: 12, color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted),
              ),
              const SizedBox(height: 14),
              if (schools.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Center(child: Text('No registered schools found.')),
                )
              else
                ConstrainedBox(
                  constraints: const BoxConstraints(maxHeight: 320),
                  child: ListView.separated(
                    shrinkWrap: true,
                    itemCount: schools.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (context, idx) {
                      final s = schools[idx];
                      return ListTile(
                        dense: true,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        leading: CircleAvatar(
                          radius: 16,
                          backgroundColor: isDark ? AppColors.accent.withValues(alpha: 0.2) : AppColors.accentSubtle,
                          child: Text(
                            s.code.isNotEmpty ? s.code.substring(0, s.code.length > 3 ? 3 : s.code.length) : 'SCH',
                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.accent),
                          ),
                        ),
                        title: Text(
                          s.name,
                          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                        ),
                        subtitle: Text(
                          '${s.stats?.totalStudents ?? 0} Students • Code: ${s.code}',
                          style: TextStyle(fontSize: 11, color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted),
                        ),
                        trailing: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.accent,
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          ),
                          onPressed: () {
                            Navigator.of(ctx).pop();
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Downloading Complete Package (.ZIP) for ${s.name}...')),
                            );
                            ref.read(exportNotifierProvider.notifier).exportSchoolPackage(s.id, s.name, queryParams);
                          },
                          icon: const Icon(Icons.download_rounded, size: 14),
                          label: const Text('Download .ZIP', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                        ),
                      );
                    },
                  ),
                ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
}

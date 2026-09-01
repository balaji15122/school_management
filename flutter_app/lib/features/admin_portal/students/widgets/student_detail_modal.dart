import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:school_management/core/theme/app_colors.dart';
import 'package:school_management/core/utils/formatters.dart';
import 'package:school_management/shared/models/student_model.dart';
import 'package:school_management/shared/widgets/confirmation_dialog.dart';
import 'package:school_management/shared/widgets/status_badge.dart';
import 'package:school_management/features/auth/providers/auth_provider.dart';
import 'package:school_management/features/admin_portal/providers/admin_students_provider.dart';
import 'package:school_management/features/admin_portal/students/widgets/student_form_dialog.dart';

class StudentDetailModal extends ConsumerWidget {
  final StudentModel student;

  const StudentDetailModal({super.key, required this.student});

  static Future<void> show(BuildContext context, {required StudentModel student}) {
    return showDialog(
      context: context,
      builder: (ctx) => StudentDetailModal(student: student),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isSuperAdmin = user?.isSuperAdmin ?? false;

    return Dialog(
      backgroundColor: isDark ? AppColors.darkSurfaceCard : Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 540, maxHeight: 680),
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Row(
                children: [
                  CircleAvatar(
                    radius: 26,
                    backgroundColor: isDark ? AppColors.accent.withValues(alpha: 0.2) : AppColors.accentSubtle,
                    backgroundImage: student.photoUrl != null ? NetworkImage(student.photoUrl!) : null,
                    child: student.photoUrl == null
                        ? Text(
                            Formatters.getInitials(student.name),
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.accent),
                          )
                        : null,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                student.name,
                                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            StatusBadge(status: student.status, fontSize: 10),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${student.schoolName} • Student ID: ${student.admissionNumber}',
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark ? AppColors.darkTextMuted : AppColors.lightTextSecondary,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Divider(color: isDark ? AppColors.darkBorder : AppColors.lightBorder, height: 1),
              const SizedBox(height: 12),

              // Scrollable Body
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _sectionHeader('Student Details (10 Uploaded Fields)'),
                      _infoItem('1. Full Name', student.name, isDark),
                      _infoItem('2. Photo File Name', '${student.admissionNumber}.jpg (in photos/ folder)', isDark),
                      _infoItem('   Photo URL / Source', student.photoUrl ?? 'Default Avatar', isDark),
                      _infoItem('3. Admission / ID', student.admissionNumber, isDark),
                      _infoItem('4. Class', student.studentClass, isDark),
                      _infoItem('5. Section', 'Section ${student.section}', isDark),
                      _infoItem('6. Roll Number', student.rollNumber, isDark),
                      _infoItem('7. Date of Birth', Formatters.formatDate(student.dob), isDark),
                      _infoItem('8. Gender', student.gender.toUpperCase(), isDark),
                      _infoItem('9. Blood Group', student.bloodGroup.isNotEmpty ? student.bloodGroup : 'Not Specified', isDark),
                      _infoItem('10. Academic Session', student.academicSession, isDark),

                      const SizedBox(height: 16),
                      _sectionHeader('Audit & Lifecycle Details'),
                      _infoItem('School Tenant', '${student.schoolName} (${student.schoolCode})', isDark),
                      _infoItem('Submitted / Uploaded By', student.submitterName, isDark),
                      _infoItem('Forwarded Date', Formatters.formatDateTime(student.forwardedAt ?? student.createdAt), isDark),
                      if (student.verifiedAt != null)
                        _infoItem('Super Admin Verified Date', Formatters.formatDateTime(student.verifiedAt), isDark),
                      if (student.rejectionReason != null && student.rejectionReason!.isNotEmpty)
                        _infoItem('Rejection Reason', student.rejectionReason!, isDark, isError: true),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 12),
              Divider(color: isDark ? AppColors.darkBorder : AppColors.lightBorder, height: 1),
              const SizedBox(height: 12),

              // Action Buttons (Wrap to prevent overflow)
              Wrap(
                alignment: WrapAlignment.end,
                crossAxisAlignment: WrapCrossAlignment.center,
                spacing: 8,
                runSpacing: 8,
                children: [
                  TextButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Close'),
                  ),

                  // School Admin actions
                  if (!isSuperAdmin) ...[
                    OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8)),
                      onPressed: () {
                        Navigator.of(context).pop();
                        StudentFormDialog.show(context, studentToEdit: student);
                      },
                      icon: const Icon(Icons.edit_outlined, size: 14),
                      label: const Text('Edit', style: TextStyle(fontSize: 12)),
                    ),
                    if (student.isDraft) ...[
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.accent,
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        ),
                        onPressed: () async {
                          final confirmed = await ConfirmationDialog.show(
                            context,
                            title: 'Forward to Super Admin',
                            message: 'Send student record ${student.name} to Super Admin now?',
                            confirmLabel: 'Forward Now',
                          );
                          if (confirmed && context.mounted) {
                            await ref.read(adminStudentsActionProvider.notifier).forwardToSuperAdmin(
                              studentId: student.id,
                            );
                            if (context.mounted) Navigator.of(context).pop();
                          }
                        },
                        icon: const Icon(Icons.send_rounded, size: 14),
                        label: const Text('Forward to Super Admin', style: TextStyle(fontSize: 12)),
                      ),
                    ],
                  ],

                  // Super Admin review actions
                  if (isSuperAdmin) ...[
                    if (student.status != 'rejected') ...[
                      OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.error,
                          side: const BorderSide(color: AppColors.error),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        ),
                        onPressed: () async {
                          final reason = await _promptRejectionReason(context);
                          if (reason != null && context.mounted) {
                            await ref.read(adminStudentsActionProvider.notifier).updateStatus(
                              studentId: student.id,
                              status: 'rejected',
                              rejectionReason: reason,
                            );
                            if (context.mounted) Navigator.of(context).pop();
                          }
                        },
                        child: const Text('Reject', style: TextStyle(fontSize: 12)),
                      ),
                    ],
                    if (student.status != 'verified') ...[
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.success,
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        ),
                        onPressed: () async {
                          final confirmed = await ConfirmationDialog.show(
                            context,
                            title: 'Verify Student',
                            message: 'Approve and verify ${student.name}?',
                            confirmLabel: 'Approve',
                            confirmColor: AppColors.success,
                          );
                          if (confirmed && context.mounted) {
                            await ref.read(adminStudentsActionProvider.notifier).updateStatus(
                              studentId: student.id,
                              status: 'verified',
                            );
                            if (context.mounted) Navigator.of(context).pop();
                          }
                        },
                        child: const Text('Approve', style: TextStyle(fontSize: 12)),
                      ),
                    ],
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _sectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Text(
        title.toUpperCase(),
        style: const TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.5,
          color: AppColors.accent,
        ),
      ),
    );
  }

  Widget _infoItem(String label, String value, bool isDark, {bool isError = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 140,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: isError ? AppColors.error : (isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<String?> _promptRejectionReason(BuildContext context) async {
    final ctrl = TextEditingController();
    return showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Rejection Reason', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
        content: TextField(
          controller: ctrl,
          decoration: const InputDecoration(hintText: 'e.g. Roll number / Admission conflict'),
          maxLines: 2,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(null), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            onPressed: () => Navigator.of(ctx).pop(ctrl.text.trim()),
            child: const Text('Reject'),
          ),
        ],
      ),
    );
  }
}

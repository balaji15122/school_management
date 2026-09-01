import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:school_management/core/constants/app_constants.dart';
import 'package:school_management/core/theme/app_colors.dart';
import 'package:school_management/features/auth/providers/auth_provider.dart';
import 'package:school_management/features/admin_portal/providers/schools_provider.dart';
import 'package:school_management/features/admin_portal/providers/admin_students_provider.dart';

class StudentFilterBar extends ConsumerStatefulWidget {
  const StudentFilterBar({super.key});

  @override
  ConsumerState<StudentFilterBar> createState() => _StudentFilterBarState();
}

class _StudentFilterBarState extends ConsumerState<StudentFilterBar> {
  late TextEditingController _searchCtrl;

  @override
  void initState() {
    super.initState();
    _searchCtrl = TextEditingController(text: ref.read(studentFilterProvider).search);
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final filter = ref.watch(studentFilterProvider);
    final notifier = ref.read(studentFilterProvider.notifier);
    final user = ref.watch(currentUserProvider);
    final schoolsAsync = ref.watch(schoolsListProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isSuperAdmin = user?.isSuperAdmin ?? false;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurfaceCard : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
        boxShadow: isDark ? null : AppColors.subtleShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Search & Filter Dropdowns (Responsive Wrap)
          Wrap(
            spacing: 10,
            runSpacing: 10,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              // Search Input
              ConstrainedBox(
                constraints: const BoxConstraints(minWidth: 200, maxWidth: 280),
                child: SizedBox(
                  height: 40,
                  child: TextField(
                    controller: _searchCtrl,
                    style: const TextStyle(fontSize: 13),
                    onChanged: (v) => notifier.setSearch(v.trim()),
                    decoration: InputDecoration(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      hintText: 'Search name, adm no, roll...',
                      prefixIcon: const Icon(Icons.search_rounded, size: 18),
                      suffixIcon: _searchCtrl.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear_rounded, size: 16),
                              onPressed: () {
                                _searchCtrl.clear();
                                notifier.setSearch('');
                              },
                            )
                          : null,
                    ),
                  ),
                ),
              ),

              // Super Admin School Selector
              if (isSuperAdmin) ...[
                schoolsAsync.maybeWhen(
                  data: (schools) => SizedBox(
                    width: 170,
                    height: 40,
                    child: DropdownButtonFormField<String>(
                      initialValue: filter.schoolId ?? 'all',
                      style: TextStyle(fontSize: 12, color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary),
                      decoration: const InputDecoration(
                        contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      ),
                      items: [
                        const DropdownMenuItem(value: 'all', child: Text('All Schools')),
                        ...schools.map((s) => DropdownMenuItem(value: s.id, child: Text(s.name, overflow: TextOverflow.ellipsis))),
                      ],
                      onChanged: (val) {
                        if (val == 'all') {
                          notifier.clearSchoolId();
                        } else {
                          notifier.setSchoolId(val);
                        }
                      },
                    ),
                  ),
                  orElse: () => const SizedBox.shrink(),
                ),
              ],

              // Academic Session Selector
              SizedBox(
                width: 130,
                height: 40,
                child: DropdownButtonFormField<String>(
                  initialValue: filter.academicSession ?? 'all',
                  style: TextStyle(fontSize: 12, color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary),
                  decoration: const InputDecoration(
                    contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  ),
                  items: [
                    const DropdownMenuItem(value: 'all', child: Text('All Sessions')),
                    ...AppConstants.academicSessions.map((ses) => DropdownMenuItem(value: ses, child: Text(ses))),
                  ],
                  onChanged: (val) => notifier.setAcademicSession(val == 'all' ? null : val),
                ),
              ),

              // Class Selector
              SizedBox(
                width: 125,
                height: 40,
                child: DropdownButtonFormField<String>(
                  initialValue: filter.studentClass ?? 'all',
                  style: TextStyle(fontSize: 12, color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary),
                  decoration: const InputDecoration(
                    contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  ),
                  items: [
                    const DropdownMenuItem(value: 'all', child: Text('All Classes')),
                    ...AppConstants.schoolClasses.map((c) => DropdownMenuItem(value: c, child: Text(c))),
                  ],
                  onChanged: (val) => notifier.setClass(val == 'all' ? null : val),
                ),
              ),

              // Section Selector
              SizedBox(
                width: 105,
                height: 40,
                child: DropdownButtonFormField<String>(
                  initialValue: filter.section ?? 'all',
                  style: TextStyle(fontSize: 12, color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary),
                  decoration: const InputDecoration(
                    contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  ),
                  items: [
                    const DropdownMenuItem(value: 'all', child: Text('All Sec')),
                    ...AppConstants.classSections.map((s) => DropdownMenuItem(value: s, child: Text('Sec $s'))),
                  ],
                  onChanged: (val) => notifier.setSection(val == 'all' ? null : val),
                ),
              ),

              // Reset Filters Button
              TextButton.icon(
                style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8)),
                onPressed: () {
                  _searchCtrl.clear();
                  notifier.resetFilters();
                },
                icon: const Icon(Icons.filter_alt_off_rounded, size: 14),
                label: const Text('Reset', style: TextStyle(fontSize: 12)),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Status Filter Tabs (Scrollable on small phones)
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildStatusChip('All', 'all', filter.status ?? 'all', notifier),
                const SizedBox(width: 6),
                _buildStatusChip('Forwarded to Super Admin', 'forwarded', filter.status ?? 'all', notifier),
                const SizedBox(width: 6),
                _buildStatusChip('Verified / Approved', 'verified', filter.status ?? 'all', notifier),
                const SizedBox(width: 6),
                _buildStatusChip('Draft Records', 'draft', filter.status ?? 'all', notifier),
                const SizedBox(width: 6),
                _buildStatusChip('Rejected', 'rejected', filter.status ?? 'all', notifier),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusChip(String label, String value, String activeStatus, StudentFilterNotifier notifier) {
    final isSelected = activeStatus == value;
    return ChoiceChip(
      selected: isSelected,
      label: Text(label, style: TextStyle(fontSize: 11, fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal)),
      onSelected: (_) => notifier.setStatus(value == 'all' ? null : value),
      selectedColor: AppColors.accent.withValues(alpha: 0.15),
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
    );
  }
}

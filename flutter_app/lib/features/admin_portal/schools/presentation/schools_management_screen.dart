import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:school_management/core/theme/app_colors.dart';
import 'package:school_management/shared/models/school_model.dart';
import 'package:school_management/shared/widgets/empty_state_view.dart';
import 'package:school_management/shared/widgets/error_state_view.dart';
import 'package:school_management/shared/widgets/responsive_scaffold.dart';
import 'package:school_management/features/admin_portal/export_center/providers/export_provider.dart';
import 'package:school_management/features/admin_portal/providers/admin_students_provider.dart';
import 'package:school_management/features/admin_portal/providers/schools_provider.dart';
import 'package:school_management/features/admin_portal/schools/widgets/school_form_dialog.dart';

class SchoolsManagementScreen extends ConsumerStatefulWidget {
  const SchoolsManagementScreen({super.key});

  @override
  ConsumerState<SchoolsManagementScreen> createState() => _SchoolsManagementScreenState();
}

class _SchoolsManagementScreenState extends ConsumerState<SchoolsManagementScreen> {
  String _search = '';
  final _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final schoolsAsync = ref.watch(schoolsListProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return ResponsiveScaffold(
      title: 'Registered Schools',
      currentRoute: '/admin/schools',
      actions: [
        ElevatedButton.icon(
          style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
          onPressed: () => SchoolFormDialog.show(context),
          icon: const Icon(Icons.add_rounded, size: 16),
          label: const Text('Add School', style: TextStyle(fontSize: 12)),
        ),
      ],
      body: schoolsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(strokeWidth: 2)),
        error: (err, _) => ErrorStateView(
          message: err.toString(),
          onRetry: () => ref.refresh(schoolsListProvider),
        ),
        data: (allSchools) {
          final filteredSchools = allSchools.where((s) {
            if (_search.isEmpty) return true;
            final q = _search.toLowerCase();
            return s.name.toLowerCase().contains(q) ||
                s.code.toLowerCase().contains(q) ||
                s.contactEmail.toLowerCase().contains(q);
          }).toList();

          return RefreshIndicator(
            onRefresh: () async => ref.refresh(schoolsListProvider),
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Search & Add Toolbar
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.darkSurfaceCard : Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
                      boxShadow: isDark ? null : AppColors.subtleShadow,
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: SizedBox(
                            height: 38,
                            child: TextField(
                              controller: _searchCtrl,
                              style: const TextStyle(fontSize: 13),
                              onChanged: (val) => setState(() => _search = val.trim()),
                              decoration: InputDecoration(
                                contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                hintText: 'Search by school name, code...',
                                prefixIcon: const Icon(Icons.search_rounded, size: 18),
                                suffixIcon: _search.isNotEmpty
                                    ? IconButton(
                                        icon: const Icon(Icons.clear_rounded, size: 16),
                                        onPressed: () {
                                          _searchCtrl.clear();
                                          setState(() => _search = '');
                                        },
                                      )
                                    : null,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),

                  if (filteredSchools.isEmpty) ...[
                    EmptyStateView(
                      title: 'No Schools Found',
                      message: _search.isNotEmpty
                          ? 'No school tenants match your search query.'
                          : 'No schools are currently registered.',
                      actionLabel: 'Add First School',
                      onAction: () => SchoolFormDialog.show(context),
                    ),
                  ] else ...[
                    LayoutBuilder(
                      builder: (context, constraints) {
                        final isWide = constraints.maxWidth > 700;
                        return GridView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: isWide ? 2 : 1,
                            crossAxisSpacing: 12,
                            mainAxisSpacing: 12,
                            childAspectRatio: isWide ? 1.9 : 1.7,
                          ),
                          itemCount: filteredSchools.length,
                          itemBuilder: (context, index) {
                            final school = filteredSchools[index];
                            return _buildSchoolCard(school, isDark);
                          },
                        );
                      },
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSchoolCard(SchoolModel school, bool isDark) {
    final stats = school.stats;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurfaceCard : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
        boxShadow: isDark ? null : AppColors.subtleShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: isDark ? AppColors.accent.withValues(alpha: 0.2) : AppColors.accentSubtle,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.domain_rounded, color: AppColors.accent, size: 20),
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
                            school.name,
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF0F172A) : AppColors.lightBackground,
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
                          ),
                          child: Text(
                            school.code,
                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.accent),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      school.contactEmail,
                      style: TextStyle(
                        fontSize: 11,
                        color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),

          // Student Stats Row
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF0F172A) : AppColors.lightBackground,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildStat('Total', '${stats?.totalStudents ?? 0}', isDark),
                _buildStat('Verified', '${stats?.verified ?? 0}', isDark, color: AppColors.success),
                _buildStat('Pending', '${stats?.pending ?? 0}', isDark, color: AppColors.warning),
              ],
            ),
          ),

          // Actions Row (Clean)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              TextButton.icon(
                style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4)),
                onPressed: () {
                  ref.read(studentFilterProvider.notifier).setSchoolId(school.id);
                  context.go('/admin/students');
                },
                icon: const Icon(Icons.group_outlined, size: 14),
                label: const Text('Students', style: TextStyle(fontSize: 12)),
              ),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                    ),
                    onPressed: () async {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Downloading Complete Package (.ZIP) for ${school.name}...')),
                      );
                      await ref.read(exportNotifierProvider.notifier).exportSchoolPackage(school.id, school.name);
                    },
                    icon: const Icon(Icons.folder_zip_rounded, size: 13, color: AppColors.accent),
                    label: const Text('Export .ZIP', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                  ),
                  const SizedBox(width: 6),
                  OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                    ),
                    onPressed: () async {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Downloading Excel for ${school.name}...')),
                      );
                      await ref.read(exportNotifierProvider.notifier).exportSingleSchool(school.id, school.name);
                    },
                    icon: const Icon(Icons.download_rounded, size: 13),
                    label: const Text('Export .XLSX', style: TextStyle(fontSize: 11)),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStat(String label, String val, bool isDark, {Color? color}) {
    return Column(
      children: [
        Text(
          val,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: color ?? (isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary),
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 10,
            color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
          ),
        ),
      ],
    );
  }
}

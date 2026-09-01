import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:school_management/core/constants/app_constants.dart';
import 'package:school_management/core/theme/app_colors.dart';
import 'package:school_management/core/utils/formatters.dart';
import 'package:school_management/shared/models/school_model.dart';
import 'package:school_management/shared/widgets/error_state_view.dart';
import 'package:school_management/shared/widgets/responsive_scaffold.dart';
import 'package:school_management/features/auth/providers/auth_provider.dart';
import 'package:school_management/features/admin_portal/providers/schools_provider.dart';
import 'package:school_management/features/admin_portal/export_center/providers/export_provider.dart';

class ExportCenterScreen extends ConsumerStatefulWidget {
  const ExportCenterScreen({super.key});

  @override
  ConsumerState<ExportCenterScreen> createState() => _ExportCenterScreenState();
}

class _ExportCenterScreenState extends ConsumerState<ExportCenterScreen> {
  String? _selectedSchoolId;
  String _selectedClass = 'all';
  String _selectedStatus = 'all';

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    final schoolsAsync = ref.watch(schoolsListProvider);
    final exportHistoryAsync = ref.watch(exportHistoryProvider);
    final exportState = ref.watch(exportNotifierProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isSuperAdmin = user?.isSuperAdmin ?? false;

    return ResponsiveScaffold(
      title: 'Excel Export Center',
      currentRoute: '/admin/export',
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Master Multi-Sheet Card (Super Admin)
            if (isSuperAdmin) ...[
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkSurfaceCard : Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
                  boxShadow: isDark ? null : AppColors.subtleShadow,
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.accent.withValues(alpha: 0.2) : AppColors.accentSubtle,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.table_chart_rounded, color: AppColors.accent, size: 22),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Expanded(
                                child: Text(
                                  'All Schools Master Workbook (.XLSX)',
                                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: isDark ? const Color(0xFF312E81) : const Color(0xFFEEF2FF),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: const Text(
                                  'MULTI-SHEET',
                                  style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: Color(0xFF4338CA)),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Generates a multi-sheet spreadsheet with an Overview Summary tab and dedicated sheets for every registered school.',
                            style: TextStyle(fontSize: 12, color: isDark ? AppColors.darkTextMuted : AppColors.lightTextSecondary),
                          ),
                          const SizedBox(height: 14),
                          Wrap(
                            spacing: 10,
                            runSpacing: 8,
                            children: [
                              ElevatedButton.icon(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.accent,
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                ),
                                onPressed: exportState.isLoading
                                    ? null
                                    : () async {
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          const SnackBar(content: Text('Generating All Schools Master Workbook...')),
                                        );
                                        await ref.read(exportNotifierProvider.notifier).exportAllSchools();
                                      },
                                icon: const Icon(Icons.download_rounded, size: 16),
                                label: const Text('Download Master Excel (.XLSX)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
            ],

            // Scoped Exports Grid
            LayoutBuilder(
              builder: (context, constraints) {
                final isWide = constraints.maxWidth > 700;

                final singleCard = schoolsAsync.maybeWhen(
                  data: (schools) => _buildSingleSchoolCard(schools, isDark, user),
                  orElse: () => const Center(child: CircularProgressIndicator(strokeWidth: 2)),
                );

                final filteredCard = _buildFilteredCard(isDark);

                if (isWide) {
                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(child: singleCard),
                      const SizedBox(width: 14),
                      Expanded(child: filteredCard),
                    ],
                  );
                } else {
                  return Column(
                    children: [
                      singleCard,
                      const SizedBox(height: 14),
                      filteredCard,
                    ],
                  );
                }
              },
            ),
            const SizedBox(height: 20),

            // Audit History Log
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkSurfaceCard : Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
                boxShadow: isDark ? null : AppColors.subtleShadow,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Export Audit History',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary),
                      ),
                      IconButton(
                        icon: const Icon(Icons.refresh_rounded, size: 16),
                        onPressed: () => ref.refresh(exportHistoryProvider),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  exportHistoryAsync.when(
                    loading: () => const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator(strokeWidth: 2))),
                    error: (err, _) => ErrorStateView(message: err.toString()),
                    data: (logs) {
                      if (logs.isEmpty) {
                        return Padding(
                          padding: const EdgeInsets.all(24),
                          child: Center(
                            child: Text(
                              'No export operations recorded yet.',
                              style: TextStyle(fontSize: 12, color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted),
                            ),
                          ),
                        );
                      }

                      return SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: DataTable(
                          columns: const [
                            DataColumn(label: Text('File Name', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12))),
                            DataColumn(label: Text('Type', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12))),
                            DataColumn(label: Text('Records', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12))),
                            DataColumn(label: Text('Size', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12))),
                            DataColumn(label: Text('Date', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12))),
                          ],
                          rows: logs.map((log) {
                            return DataRow(
                              cells: [
                                DataCell(
                                  Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.description_outlined, color: AppColors.accent, size: 14),
                                      const SizedBox(width: 6),
                                      Text(log.fileName, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 12)),
                                    ],
                                  ),
                                ),
                                DataCell(Text(log.exportType.toUpperCase(), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold))),
                                DataCell(Text('${log.recordCount}', style: const TextStyle(fontSize: 12))),
                                DataCell(Text(Formatters.formatBytes(log.fileSizeBytes), style: const TextStyle(fontSize: 11))),
                                DataCell(Text(Formatters.formatDateTime(log.createdAt), style: const TextStyle(fontSize: 11))),
                              ],
                            );
                          }).toList(),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSingleSchoolCard(List<SchoolModel> schools, bool isDark, dynamic user) {
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
        children: [
          Row(
            children: [
              const Expanded(
                child: Text('School Data & Photos Package', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF064E3B) : const Color(0xFFD1FAE5),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Text('EXCEL + PHOTOS', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.success)),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'Exports Excel sheet and photos folder containing student photos renamed by Admission Number for Master Admin correlation.',
            style: TextStyle(fontSize: 11, color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted),
          ),
          const SizedBox(height: 12),

          if (user?.isSuperAdmin == true) ...[
            DropdownButtonFormField<String>(
              initialValue: _selectedSchoolId ?? (schools.isNotEmpty ? schools.first.id : null),
              style: TextStyle(fontSize: 12, color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary),
              decoration: const InputDecoration(labelText: 'School Tenant', contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8)),
              items: schools.map((s) => DropdownMenuItem(value: s.id, child: Text(s.name, overflow: TextOverflow.ellipsis))).toList(),
              onChanged: (val) => setState(() => _selectedSchoolId = val),
            ),
          ] else ...[
            Text('School: ${user?.schoolName ?? 'Your School'}', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
          ],
          const SizedBox(height: 14),

          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.accent,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                ),
                onPressed: () async {
                  final targetId = _selectedSchoolId ?? user?.schoolId ?? (schools.isNotEmpty ? schools.first.id : '');
                  final targetName = schools.firstWhere((s) => s.id == targetId, orElse: () => schools.first).name;
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Downloading Complete Package for $targetName...')));
                  await ref.read(exportNotifierProvider.notifier).exportSchoolPackage(targetId, targetName);
                },
                icon: const Icon(Icons.folder_zip_rounded, size: 14),
                label: const Text('Export Complete Package (.ZIP)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
              ),
              OutlinedButton.icon(
                style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8)),
                onPressed: () async {
                  final targetId = _selectedSchoolId ?? user?.schoolId ?? (schools.isNotEmpty ? schools.first.id : '');
                  final targetName = schools.firstWhere((s) => s.id == targetId, orElse: () => schools.first).name;
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Downloading Excel for $targetName...')));
                  await ref.read(exportNotifierProvider.notifier).exportSingleSchool(targetId, targetName);
                },
                icon: const Icon(Icons.table_chart_outlined, size: 14),
                label: const Text('Excel Only (.XLSX)', style: TextStyle(fontSize: 11)),
              ),
              OutlinedButton.icon(
                style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8)),
                onPressed: () async {
                  final targetId = _selectedSchoolId ?? user?.schoolId ?? (schools.isNotEmpty ? schools.first.id : '');
                  final targetName = schools.firstWhere((s) => s.id == targetId, orElse: () => schools.first).name;
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Downloading Photos Archive for $targetName...')));
                  await ref.read(exportNotifierProvider.notifier).exportSchoolPhotos(targetId, targetName);
                },
                icon: const Icon(Icons.photo_library_outlined, size: 14),
                label: const Text('Photos Only (.ZIP)', style: TextStyle(fontSize: 11)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFilteredCard(bool isDark) {
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
        children: [
          const Text('Custom Filtered Export', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text('Filter by class or status before generating', style: TextStyle(fontSize: 11, color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted)),
          const SizedBox(height: 12),

          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: _selectedClass,
                  style: TextStyle(fontSize: 12, color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary),
                  decoration: const InputDecoration(labelText: 'Class', contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 8)),
                  items: [
                    const DropdownMenuItem(value: 'all', child: Text('All Classes')),
                    ...AppConstants.schoolClasses.map((c) => DropdownMenuItem(value: c, child: Text(c))),
                  ],
                  onChanged: (val) => setState(() => _selectedClass = val ?? 'all'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: _selectedStatus,
                  style: TextStyle(fontSize: 12, color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary),
                  decoration: const InputDecoration(labelText: 'Status', contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 8)),
                  items: const [
                    DropdownMenuItem(value: 'all', child: Text('All')),
                    DropdownMenuItem(value: 'verified', child: Text('Verified')),
                    DropdownMenuItem(value: 'pending', child: Text('Pending')),
                    DropdownMenuItem(value: 'rejected', child: Text('Rejected')),
                  ],
                  onChanged: (val) => setState(() => _selectedStatus = val ?? 'all'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
            onPressed: () async {
              final params = <String, dynamic>{};
              if (_selectedClass != 'all') params['class'] = _selectedClass;
              if (_selectedStatus != 'all') params['status'] = _selectedStatus;
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Generating Filtered Excel Export...')));
              await ref.read(exportNotifierProvider.notifier).exportFiltered(params);
            },
            icon: const Icon(Icons.download_rounded, size: 14),
            label: const Text('Export Filtered .XLSX', style: TextStyle(fontSize: 12)),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:school_management/core/theme/app_colors.dart';
import 'package:school_management/core/utils/formatters.dart';
import 'package:school_management/shared/widgets/error_state_view.dart';
import 'package:school_management/shared/widgets/responsive_scaffold.dart';
import 'package:school_management/shared/widgets/stats_card.dart';
import 'package:school_management/shared/widgets/status_badge.dart';
import 'package:school_management/features/auth/providers/auth_provider.dart';
import 'package:school_management/features/admin_portal/providers/admin_dashboard_provider.dart';
import 'package:school_management/features/admin_portal/dashboard/widgets/submissions_chart.dart';
import 'package:school_management/features/admin_portal/students/widgets/student_detail_modal.dart';

class AdminDashboardScreen extends ConsumerWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final statsAsync = ref.watch(adminDashboardStatsProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isSuperAdmin = user?.isSuperAdmin ?? false;

    return ResponsiveScaffold(
      title: isSuperAdmin ? 'Platform Overview' : 'School Dashboard',
      currentRoute: '/admin/dashboard',
      body: statsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(strokeWidth: 2)),
        error: (err, _) => ErrorStateView(
          message: err.toString(),
          onRetry: () => ref.refresh(adminDashboardStatsProvider),
        ),
        data: (stats) {
          final summary = stats.summary;

          return RefreshIndicator(
            onRefresh: () async => ref.refresh(adminDashboardStatsProvider),
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Clean Welcome Banner (Calm & Natural)
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.darkSurfaceCard : Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                        width: 1,
                      ),
                      boxShadow: isDark ? null : AppColors.subtleShadow,
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Welcome back, ${user?.name ?? 'Admin'}',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: -0.3,
                                  color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                isSuperAdmin
                                    ? 'Managing all registered school tenants & aggregate admissions'
                                    : '${user?.schoolName ?? 'School Portal'} • Student Admissions',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isDark ? AppColors.darkTextMuted : AppColors.lightTextSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          ),
                          onPressed: () => context.go('/admin/export'),
                          icon: const Icon(Icons.download_rounded, size: 16),
                          label: const Text('Export', style: TextStyle(fontSize: 12)),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Responsive KPI Stats Grid
                  LayoutBuilder(
                    builder: (context, constraints) {
                      final width = constraints.maxWidth;
                      int crossAxisCount = 1;
                      if (width > 900) {
                        crossAxisCount = isSuperAdmin ? 4 : 3;
                      } else if (width > 500) {
                        crossAxisCount = 2;
                      }

                      return GridView.count(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        crossAxisCount: crossAxisCount,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                        childAspectRatio: crossAxisCount == 1 ? 3.0 : (crossAxisCount == 2 ? 1.8 : 1.6),
                        children: [
                          if (isSuperAdmin)
                            StatsCard(
                              title: 'Registered Schools',
                              value: '${summary.totalSchools}',
                              icon: Icons.domain_rounded,
                              color: const Color(0xFF6366F1),
                              onTap: () => context.go('/admin/schools'),
                            ),
                          StatsCard(
                            title: 'Total Students',
                            value: '${summary.totalStudents}',
                            icon: Icons.people_outline_rounded,
                            color: AppColors.accent,
                            onTap: () => context.go('/admin/students'),
                          ),
                          StatsCard(
                            title: 'Verified Admissions',
                            value: '${summary.verified}',
                            icon: Icons.check_circle_outline_rounded,
                            color: AppColors.success,
                            onTap: () => context.go('/admin/students'),
                          ),
                          StatsCard(
                            title: 'Pending Review',
                            value: '${summary.pending}',
                            icon: Icons.schedule_rounded,
                            color: AppColors.warning,
                            onTap: () => context.go('/admin/students'),
                          ),
                        ],
                      );
                    },
                  ),
                  const SizedBox(height: 16),

                  // Charts Row (Clean, responsive layout)
                  LayoutBuilder(
                    builder: (context, constraints) {
                      final isWide = constraints.maxWidth > 780;

                      final chartCard = Container(
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
                                  '30-Day Submission Trends',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                                  ),
                                ),
                                Text(
                                  'Daily Count',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 14),
                            SubmissionsChart(dailySubmissions: stats.dailySubmissions),
                          ],
                        ),
                      );

                      final classCard = Container(
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
                            Text(
                              'Class Distribution',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                              ),
                            ),
                            const SizedBox(height: 14),
                            if (stats.classDistribution.isEmpty)
                              Padding(
                                padding: const EdgeInsets.all(20),
                                child: Center(
                                  child: Text('No class records', style: TextStyle(fontSize: 12, color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted)),
                                ),
                              )
                            else
                              ...stats.classDistribution.map((item) {
                                final maxVal = stats.classDistribution.fold(
                                  1,
                                  (max, cur) => cur.count > max ? cur.count : max,
                                );
                                final fraction = item.count / maxVal;

                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 10.0),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text('Class ${item.studentClass}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                                          Text('${item.count}', style: TextStyle(fontSize: 11, color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted)),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      ClipRRect(
                                        borderRadius: BorderRadius.circular(3),
                                        child: LinearProgressIndicator(
                                          value: fraction,
                                          minHeight: 6,
                                          backgroundColor: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                                          valueColor: const AlwaysStoppedAnimation<Color>(AppColors.accent),
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              }),
                          ],
                        ),
                      );

                      if (isWide) {
                        return Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(flex: 3, child: chartCard),
                            const SizedBox(width: 16),
                            Expanded(flex: 2, child: classCard),
                          ],
                        );
                      } else {
                        return Column(
                          children: [
                            chartCard,
                            const SizedBox(height: 16),
                            classCard,
                          ],
                        );
                      }
                    },
                  ),
                  const SizedBox(height: 16),

                  // Recent Submissions Section (Clean & Natural Table / List)
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
                              'Recent Submissions',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                              ),
                            ),
                            TextButton.icon(
                              onPressed: () => context.go('/admin/students'),
                              style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4)),
                              icon: const Icon(Icons.arrow_forward_rounded, size: 14),
                              label: const Text('View All', style: TextStyle(fontSize: 12)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        if (stats.recentSubmissions.isEmpty)
                          Padding(
                            padding: const EdgeInsets.all(24),
                            child: Center(
                              child: Text(
                                'No submissions yet',
                                style: TextStyle(fontSize: 12, color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted),
                              ),
                            ),
                          )
                        else
                          ListView.separated(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: stats.recentSubmissions.length,
                            separatorBuilder: (_, __) => Divider(
                              color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                              height: 1,
                            ),
                            itemBuilder: (context, index) {
                              final student = stats.recentSubmissions[index];
                              return ListTile(
                                contentPadding: const EdgeInsets.symmetric(vertical: 4),
                                leading: CircleAvatar(
                                  radius: 16,
                                  backgroundColor: isDark ? AppColors.accent.withValues(alpha: 0.2) : AppColors.accentSubtle,
                                  child: Text(
                                    Formatters.getInitials(student.name),
                                    style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.bold, fontSize: 11),
                                  ),
                                ),
                                title: Text(student.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                                subtitle: Text(
                                  '${student.schoolName} • Class ${student.studentClass}-${student.section} • Adm: ${student.admissionNumber}',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                                trailing: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    StatusBadge(status: student.status, fontSize: 10),
                                    const SizedBox(width: 4),
                                    IconButton(
                                      icon: const Icon(Icons.visibility_outlined, size: 16),
                                      onPressed: () => StudentDetailModal.show(context, student: student),
                                    ),
                                  ],
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
        },
      ),
    );
  }
}

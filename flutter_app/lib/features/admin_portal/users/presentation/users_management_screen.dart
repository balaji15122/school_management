import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:school_management/core/network/api_endpoints.dart';
import 'package:school_management/core/theme/app_colors.dart';
import 'package:school_management/core/utils/formatters.dart';
import 'package:school_management/shared/models/user_model.dart';
import 'package:school_management/shared/widgets/empty_state_view.dart';
import 'package:school_management/shared/widgets/error_state_view.dart';
import 'package:school_management/shared/widgets/responsive_scaffold.dart';
import 'package:school_management/shared/widgets/status_badge.dart';
import 'package:school_management/features/auth/providers/auth_provider.dart';

final usersListProvider = FutureProvider.autoDispose<List<UserModel>>((ref) async {
  final api = ref.read(apiClientProvider);
  final res = await api.get(ApiEndpoints.users);
  if (res['success'] == true && res['data'] != null) {
    return (res['data'] as List<dynamic>)
        .map((e) => UserModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }
  return [];
});

class UsersManagementScreen extends ConsumerStatefulWidget {
  const UsersManagementScreen({super.key});

  @override
  ConsumerState<UsersManagementScreen> createState() => _UsersManagementScreenState();
}

class _UsersManagementScreenState extends ConsumerState<UsersManagementScreen> {
  String _selectedRole = 'all';

  Future<void> _toggleStatus(UserModel user) async {
    try {
      final api = ref.read(apiClientProvider);
      final res = await api.patch(ApiEndpoints.toggleUserStatus(user.id));
      if (res['success'] == true) {
        ref.invalidate(usersListProvider);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(res['message'] ?? 'Status updated'),
              backgroundColor: AppColors.success,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: AppColors.error),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final usersAsync = ref.watch(usersListProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return ResponsiveScaffold(
      title: 'Users & Permissions',
      currentRoute: '/admin/users',
      body: usersAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(strokeWidth: 2)),
        error: (err, _) => ErrorStateView(message: err.toString(), onRetry: () => ref.refresh(usersListProvider)),
        data: (allUsers) {
          final filteredUsers = allUsers.where((u) {
            if (_selectedRole != 'all' && u.role != _selectedRole) return false;
            return true;
          }).toList();

          return RefreshIndicator(
            onRefresh: () async => ref.refresh(usersListProvider),
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Role Filter Bar
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.darkSurfaceCard : Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
                      boxShadow: isDark ? null : AppColors.subtleShadow,
                    ),
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _buildFilterChip('All (${allUsers.length})', 'all'),
                          const SizedBox(width: 6),
                          _buildFilterChip('Super Admins', 'super_admin'),
                          const SizedBox(width: 6),
                          _buildFilterChip('School Admins', 'school_admin'),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),

                  if (filteredUsers.isEmpty) ...[
                    const EmptyStateView(
                      title: 'No Users Found',
                      message: 'No user accounts match the selected role filter.',
                    ),
                  ] else ...[
                    Container(
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.darkSurfaceCard : Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
                        boxShadow: isDark ? null : AppColors.subtleShadow,
                      ),
                      child: SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: DataTable(
                          headingRowColor: WidgetStateProperty.all(
                            isDark ? const Color(0xFF0F172A) : AppColors.lightBackground,
                          ),
                          columns: const [
                            DataColumn(label: Text('User', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12))),
                            DataColumn(label: Text('Email', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12))),
                            DataColumn(label: Text('Role', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12))),
                            DataColumn(label: Text('School Tenant', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12))),
                            DataColumn(label: Text('Status', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12))),
                            DataColumn(label: Text('Action', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12))),
                          ],
                          rows: filteredUsers.map((u) {
                            return DataRow(
                              cells: [
                                DataCell(
                                  Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      CircleAvatar(
                                        radius: 12,
                                        backgroundColor: isDark ? AppColors.accent.withValues(alpha: 0.2) : AppColors.accentSubtle,
                                        child: Text(
                                          Formatters.getInitials(u.name),
                                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.accent),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Text(u.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
                                    ],
                                  ),
                                ),
                                DataCell(Text(u.email, style: const TextStyle(fontSize: 12))),
                                DataCell(StatusBadge(status: u.role, fontSize: 10)),
                                DataCell(Text(u.schoolName ?? 'All Schools', style: const TextStyle(fontSize: 12))),
                                DataCell(
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: u.isActive ? AppColors.successBg : AppColors.errorBg,
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      u.isActive ? 'Active' : 'Disabled',
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w600,
                                        color: u.isActive ? AppColors.successText : AppColors.errorText,
                                      ),
                                    ),
                                  ),
                                ),
                                DataCell(
                                  TextButton(
                                    style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2)),
                                    onPressed: () => _toggleStatus(u),
                                    child: Text(
                                      u.isActive ? 'Deactivate' : 'Activate',
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: u.isActive ? AppColors.error : AppColors.success,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            );
                          }).toList(),
                        ),
                      ),
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

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _selectedRole == value;
    return ChoiceChip(
      selected: isSelected,
      label: Text(label, style: TextStyle(fontSize: 11, fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal)),
      onSelected: (_) => setState(() => _selectedRole = value),
      selectedColor: AppColors.accent.withValues(alpha: 0.15),
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
    );
  }
}

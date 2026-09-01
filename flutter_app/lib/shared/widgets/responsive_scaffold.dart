import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_constants.dart';
import '../../core/theme/app_colors.dart';
import '../../features/auth/providers/auth_provider.dart';

class ResponsiveScaffold extends ConsumerStatefulWidget {
  final String title;
  final String currentRoute;
  final Widget body;
  final List<Widget>? actions;
  final Widget? floatingActionButton;

  const ResponsiveScaffold({
    super.key,
    required this.title,
    required this.currentRoute,
    required this.body,
    this.actions,
    this.floatingActionButton,
  });

  @override
  ConsumerState<ResponsiveScaffold> createState() => _ResponsiveScaffoldState();
}

class _ResponsiveScaffoldState extends ConsumerState<ResponsiveScaffold> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isSuperAdmin = user?.isSuperAdmin ?? false;

    final navItems = [
      _NavItem('Dashboard', Icons.analytics_outlined, Icons.analytics_rounded, '/admin/dashboard'),
      if (isSuperAdmin)
        _NavItem('Schools', Icons.domain_outlined, Icons.domain_rounded, '/admin/schools'),
      _NavItem(isSuperAdmin ? 'All Students' : 'Student Upload', Icons.group_outlined, Icons.group_rounded, '/admin/students'),
      _NavItem('Export Center', Icons.table_chart_outlined, Icons.table_chart_rounded, '/admin/export'),
      if (isSuperAdmin)
        _NavItem('Users', Icons.admin_panel_settings_outlined, Icons.admin_panel_settings_rounded, '/admin/users'),
    ];

    return LayoutBuilder(
      builder: (context, constraints) {
        final isDesktop = constraints.maxWidth >= 960;

        return Scaffold(
          key: _scaffoldKey,
          backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
          drawer: isDesktop ? null : _buildDrawer(navItems, user, isDark),
          appBar: AppBar(
            backgroundColor: isDark ? AppColors.darkSurface : Colors.white,
            elevation: 0,
            leading: isDesktop
                ? null
                : IconButton(
                    icon: const Icon(Icons.menu_rounded, size: 22),
                    onPressed: () => _scaffoldKey.currentState?.openDrawer(),
                  ),
            title: Text(
              widget.title,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
              ),
            ),
            actions: [
              if (widget.actions != null) ...widget.actions!,
              const SizedBox(width: 8),
              _buildUserAvatarMenu(user, isDark),
              const SizedBox(width: 16),
            ],
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(1),
              child: Container(
                color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                height: 1,
              ),
            ),
          ),
          body: Row(
            children: [
              if (isDesktop) _buildDesktopSidebar(navItems, user, isDark),
              Expanded(
                child: SafeArea(
                  top: false,
                  child: widget.body,
                ),
              ),
            ],
          ),
          bottomNavigationBar: isDesktop ? null : _buildBottomNavBar(navItems, isDark),
          floatingActionButton: widget.floatingActionButton,
        );
      },
    );
  }

  Widget _buildDesktopSidebar(List<_NavItem> navItems, dynamic user, bool isDark) {
    return Container(
      width: 220,
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : Colors.white,
        border: Border(
          right: BorderSide(
            color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
            width: 1,
          ),
        ),
      ),
      child: Column(
        children: [
          // Logo & Tenant Branding
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            child: Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: AppColors.accent,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.school_rounded, color: Colors.white, size: 18),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        AppConstants.appName,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                        ),
                      ),
                      Text(
                        user?.isSuperAdmin == true ? 'Super Admin' : (user?.schoolName ?? 'School Portal'),
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
          ),
          Divider(color: isDark ? AppColors.darkBorder : AppColors.lightBorder, height: 1),
          const SizedBox(height: 8),

          // Nav Links
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              children: navItems.map((item) {
                final isSelected = widget.currentRoute == item.route;
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2.0),
                  child: InkWell(
                    onTap: () => context.go(item.route),
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? (isDark ? AppColors.accent.withValues(alpha: 0.15) : AppColors.accentSubtle)
                            : Colors.transparent,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            isSelected ? item.activeIcon : item.icon,
                            size: 18,
                            color: isSelected
                                ? AppColors.accent
                                : (isDark ? AppColors.darkTextMuted : AppColors.lightTextSecondary),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              item.title,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                                color: isSelected
                                    ? (isDark ? Colors.white : AppColors.accent)
                                    : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),

          // Sign out footer
          Divider(color: isDark ? AppColors.darkBorder : AppColors.lightBorder, height: 1),
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: InkWell(
              onTap: () async {
                await ref.read(authNotifierProvider.notifier).logout();
                if (mounted) context.go('/login');
              },
              borderRadius: BorderRadius.circular(8),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                child: Row(
                  children: [
                    const Icon(Icons.logout_rounded, size: 16, color: AppColors.error),
                    const SizedBox(width: 10),
                    Text(
                      'Sign Out',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomNavBar(List<_NavItem> navItems, bool isDark) {
    int currentIndex = navItems.indexWhere((item) => item.route == widget.currentRoute);
    if (currentIndex == -1) currentIndex = 0;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : Colors.white,
        border: Border(
          top: BorderSide(
            color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
            width: 1,
          ),
        ),
      ),
      child: NavigationBar(
        height: 58,
        elevation: 0,
        backgroundColor: Colors.transparent,
        selectedIndex: currentIndex,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        indicatorColor: isDark ? AppColors.accent.withValues(alpha: 0.2) : AppColors.accentSubtle,
        onDestinationSelected: (index) {
          if (index < navItems.length) {
            context.go(navItems[index].route);
          }
        },
        destinations: navItems.map((item) {
          return NavigationDestination(
            icon: Icon(item.icon, size: 20),
            selectedIcon: Icon(item.activeIcon, size: 20, color: AppColors.accent),
            label: item.title,
          );
        }).toList(),
      ),
    );
  }

  Widget _buildDrawer(List<_NavItem> navItems, dynamic user, bool isDark) {
    return Drawer(
      backgroundColor: isDark ? AppColors.darkSurface : Colors.white,
      child: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: AppColors.accent,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.school_rounded, color: Colors.white, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          AppConstants.appName,
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                        ),
                        Text(
                          user?.name ?? 'User',
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 8),
                children: navItems.map((item) {
                  final isSelected = widget.currentRoute == item.route;
                  return ListTile(
                    dense: true,
                    leading: Icon(
                      isSelected ? item.activeIcon : item.icon,
                      color: isSelected ? AppColors.accent : null,
                      size: 20,
                    ),
                    title: Text(
                      item.title,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                        color: isSelected ? AppColors.accent : null,
                      ),
                    ),
                    onTap: () {
                      Navigator.pop(context);
                      context.go(item.route);
                    },
                  );
                }).toList(),
              ),
            ),
            const Divider(height: 1),
            ListTile(
              dense: true,
              leading: const Icon(Icons.logout_rounded, color: AppColors.error, size: 20),
              title: const Text('Sign Out', style: TextStyle(fontSize: 13)),
              onTap: () async {
                Navigator.pop(context);
                await ref.read(authNotifierProvider.notifier).logout();
                if (mounted) context.go('/login');
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUserAvatarMenu(dynamic user, bool isDark) {
    return PopupMenuButton<String>(
      tooltip: 'Account',
      offset: const Offset(0, 40),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: BorderSide(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
      ),
      color: isDark ? AppColors.darkSurfaceCard : Colors.white,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          CircleAvatar(
            radius: 14,
            backgroundColor: isDark ? AppColors.accent.withValues(alpha: 0.2) : AppColors.accentSubtle,
            child: Text(
              user != null && user.name.isNotEmpty ? user.name[0].toUpperCase() : 'U',
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.accent),
            ),
          ),
          const SizedBox(width: 4),
          Icon(Icons.keyboard_arrow_down_rounded, size: 16, color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted),
        ],
      ),
      itemBuilder: (context) => [
        PopupMenuItem(
          enabled: false,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(user?.name ?? 'User', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary)),
              Text(user?.email ?? '', style: TextStyle(fontSize: 11, color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted)),
            ],
          ),
        ),
        const PopupMenuDivider(),
        PopupMenuItem(
          value: 'logout',
          child: const Row(
            children: [
              Icon(Icons.logout_rounded, size: 16, color: AppColors.error),
              SizedBox(width: 8),
              Text('Sign Out', style: TextStyle(fontSize: 12, color: AppColors.error)),
            ],
          ),
        ),
      ],
      onSelected: (val) async {
        if (val == 'logout') {
          await ref.read(authNotifierProvider.notifier).logout();
          if (mounted) context.go('/login');
        }
      },
    );
  }
}

class _NavItem {
  final String title;
  final IconData icon;
  final IconData activeIcon;
  final String route;

  _NavItem(this.title, this.icon, this.activeIcon, this.route);
}

import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class StatusBadge extends StatelessWidget {
  final String status;
  final double fontSize;

  const StatusBadge({
    super.key,
    required this.status,
    this.fontSize = 11,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final normalized = status.toLowerCase().trim();

    Color bg;
    Color fg;
    Color border;
    String label;
    IconData icon;

    switch (normalized) {
      case 'verified':
      case 'active':
        bg = isDark ? AppColors.successDarkBg : AppColors.successBg;
        fg = isDark ? const Color(0xFF86EFAC) : AppColors.successText;
        border = isDark ? AppColors.success.withValues(alpha: 0.3) : const Color(0xFFBBF7D0);
        label = normalized == 'verified' ? 'Verified' : 'Active';
        icon = Icons.check_circle_outline_rounded;
        break;

      case 'pending':
        bg = isDark ? AppColors.warningDarkBg : AppColors.warningBg;
        fg = isDark ? const Color(0xFFFDE68A) : AppColors.warningText;
        border = isDark ? AppColors.warning.withValues(alpha: 0.3) : const Color(0xFFFDE68A);
        label = 'Pending';
        icon = Icons.schedule_rounded;
        break;

      case 'rejected':
      case 'disabled':
        bg = isDark ? AppColors.errorDarkBg : AppColors.errorBg;
        fg = isDark ? const Color(0xFFFCA5A5) : AppColors.errorText;
        border = isDark ? AppColors.error.withValues(alpha: 0.3) : const Color(0xFFFECACA);
        label = normalized == 'rejected' ? 'Rejected' : 'Disabled';
        icon = Icons.cancel_outlined;
        break;

      case 'super_admin':
        bg = isDark ? const Color(0xFF312E81) : const Color(0xFFEEF2FF);
        fg = isDark ? const Color(0xFFC7D2FE) : const Color(0xFF4338CA);
        border = isDark ? const Color(0xFF4338CA) : const Color(0xFFE0E7FF);
        label = 'Super Admin';
        icon = Icons.shield_outlined;
        break;

      case 'school_admin':
        bg = isDark ? const Color(0xFF1E3A8A) : AppColors.infoBg;
        fg = isDark ? const Color(0xFFBFDBFE) : AppColors.infoText;
        border = isDark ? const Color(0xFF1D4ED8) : const Color(0xFFDBEAFE);
        label = 'School Admin';
        icon = Icons.domain_rounded;
        break;

      case 'student':
      default:
        bg = isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9);
        fg = isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569);
        border = isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0);
        label = normalized.isEmpty ? 'Student' : normalized.replaceAll('_', ' ').toUpperCase();
        icon = Icons.person_outline_rounded;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: border, width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: fontSize + 1, color: fg),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: fontSize,
              fontWeight: FontWeight.w600,
              color: fg,
              letterSpacing: 0.1,
            ),
          ),
        ],
      ),
    );
  }
}

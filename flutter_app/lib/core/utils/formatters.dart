import 'package:intl/intl.dart';

class Formatters {
  static String formatDate(dynamic date) {
    if (date == null) return 'N/A';
    try {
      final d = date is DateTime ? date : DateTime.parse(date.toString());
      return DateFormat('MMM dd, yyyy').format(d);
    } catch (_) {
      return date.toString();
    }
  }

  static String formatDateTime(dynamic date) {
    if (date == null) return 'N/A';
    try {
      final d = date is DateTime ? date : DateTime.parse(date.toString());
      return DateFormat('MMM dd, yyyy hh:mm a').format(d);
    } catch (_) {
      return date.toString();
    }
  }

  static String getInitials(String? name) {
    if (name == null || name.trim().isEmpty) return '?';
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }

  static String formatBytes(int bytes) {
    if (bytes <= 0) return '0 B';
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(2)} MB';
  }
}

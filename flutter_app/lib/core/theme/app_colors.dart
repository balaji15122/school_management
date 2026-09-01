import 'package:flutter/material.dart';

/// Clean, Natural, and Refined Color System for EduCloud
/// Based on calm slate, crisp whites, and professional indigo/navy tones.
class AppColors {
  AppColors._();

  // Primary Brand - Refined Professional Slate & Deep Indigo
  static const Color primary = Color(0xFF1E293B);       // Slate 800
  static const Color primaryLight = Color(0xFF334155);  // Slate 700
  static const Color primaryDark = Color(0xFF0F172A);   // Slate 900
  
  // Brand Accent - Subtle Vibrant Blue
  static const Color accent = Color(0xFF2563EB);        // Blue 600
  static const Color accentLight = Color(0xFF3B82F6);   // Blue 500
  static const Color accentSubtle = Color(0xFFEFF6FF);  // Blue 50

  // Secondary - Calm Slate & Muted Cool Grey
  static const Color secondary = Color(0xFF475569);     // Slate 600
  static const Color secondaryLight = Color(0xFF64748B); // Slate 500

  // Light Mode Surfaces & Canvas (Clean, Natural Off-White)
  static const Color lightBackground = Color(0xFFF8FAFC); // Slate 50
  static const Color lightSurface = Color(0xFFFFFFFF);    // Pure White
  static const Color lightSurfaceCard = Color(0xFFFFFFFF);
  static const Color lightBorder = Color(0xFFE2E8F0);     // Slate 200
  static const Color lightBorderFocus = Color(0xFF3B82F6);
  static const Color lightTextPrimary = Color(0xFF0F172A); // Slate 900
  static const Color lightTextSecondary = Color(0xFF475569); // Slate 600
  static const Color lightTextMuted = Color(0xFF94A3B8);   // Slate 400

  // Dark Mode Surfaces (Subtle Rich Dark Slate, Not Pure Neon)
  static const Color darkBackground = Color(0xFF0F172A);  // Slate 900
  static const Color darkSurface = Color(0xFF1E293B);     // Slate 800
  static const Color darkSurfaceCard = Color(0xFF1E293B);
  static const Color darkBorder = Color(0xFF334155);      // Slate 700
  static const Color darkBorderFocus = Color(0xFF60A5FA);
  static const Color darkTextPrimary = Color(0xFFF8FAFC);
  static const Color darkTextSecondary = Color(0xFFCBD5E1);
  static const Color darkTextMuted = Color(0xFF64748B);

  // Semantic Status Colors (Soft, Natural, Muted Tones)
  static const Color success = Color(0xFF16A34A);        // Green 600
  static const Color successBg = Color(0xFFF0FDF4);      // Green 50
  static const Color successText = Color(0xFF15803D);    // Green 700
  static const Color successDarkBg = Color(0xFF14532D);

  static const Color warning = Color(0xFFD97706);        // Amber 600
  static const Color warningBg = Color(0xFFFFFBEB);      // Amber 50
  static const Color warningText = Color(0xFFB45309);    // Amber 700
  static const Color warningDarkBg = Color(0xFF78350F);

  static const Color error = Color(0xFFDC2626);          // Red 600
  static const Color errorBg = Color(0xFFFEF2F2);        // Red 50
  static const Color errorText = Color(0xFFB91C1C);      // Red 700
  static const Color errorDarkBg = Color(0xFF7F1D1D);

  static const Color info = Color(0xFF2563EB);           // Blue 600
  static const Color infoBg = Color(0xFFEFF6FF);         // Blue 50
  static const Color infoText = Color(0xFF1D4ED8);       // Blue 700

  // Subtle Natural Shadows
  static List<BoxShadow> get subtleShadow => [
        const BoxShadow(
          color: Color(0x08000000),
          blurRadius: 8,
          offset: Offset(0, 2),
        ),
        const BoxShadow(
          color: Color(0x05000000),
          blurRadius: 2,
          offset: Offset(0, 1),
        ),
      ];

  static List<BoxShadow> get cardShadow => [
        const BoxShadow(
          color: Color(0x0A000000),
          blurRadius: 12,
          offset: Offset(0, 4),
        ),
      ];

  // Subtle Linear Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
  );

  static const LinearGradient accentGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF2563EB), Color(0xFF1D4ED8)],
  );
}

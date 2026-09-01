import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/custom_text_field.dart';
import '../providers/auth_provider.dart';

class RegisterSchoolScreen extends ConsumerStatefulWidget {
  const RegisterSchoolScreen({super.key});

  @override
  ConsumerState<RegisterSchoolScreen> createState() => _RegisterSchoolScreenState();
}

class _RegisterSchoolScreenState extends ConsumerState<RegisterSchoolScreen> {
  final _formKey = GlobalKey<FormState>();

  final _schoolNameCtrl = TextEditingController();
  final _schoolCodeCtrl = TextEditingController();
  final _schoolEmailCtrl = TextEditingController();
  final _schoolPhoneCtrl = TextEditingController();
  final _schoolAddressCtrl = TextEditingController();

  final _adminNameCtrl = TextEditingController();
  final _adminEmailCtrl = TextEditingController();
  final _adminPhoneCtrl = TextEditingController();
  final _adminPasswordCtrl = TextEditingController();

  bool _obscurePassword = true;

  @override
  void dispose() {
    _schoolNameCtrl.dispose();
    _schoolCodeCtrl.dispose();
    _schoolEmailCtrl.dispose();
    _schoolPhoneCtrl.dispose();
    _schoolAddressCtrl.dispose();
    _adminNameCtrl.dispose();
    _adminEmailCtrl.dispose();
    _adminPhoneCtrl.dispose();
    _adminPasswordCtrl.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;

    final success = await ref.read(authNotifierProvider.notifier).registerSchool(
          schoolName: _schoolNameCtrl.text.trim(),
          schoolCode: _schoolCodeCtrl.text.trim().toUpperCase(),
          schoolContactEmail: _schoolEmailCtrl.text.trim(),
          schoolContactPhone: _schoolPhoneCtrl.text.trim(),
          schoolAddress: _schoolAddressCtrl.text.trim(),
          adminName: _adminNameCtrl.text.trim(),
          adminEmail: _adminEmailCtrl.text.trim(),
          adminPhone: _adminPhoneCtrl.text.trim(),
          adminPassword: _adminPasswordCtrl.text.trim(),
        );

    if (success && mounted) {
      context.go('/admin/dashboard');
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authNotifierProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      appBar: AppBar(
        title: const Text('Register School Tenant', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, size: 20),
          onPressed: () => context.go('/login'),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 540),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (authState.error != null) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: isDark ? AppColors.errorDarkBg : AppColors.errorBg,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.error.withValues(alpha: 0.3)),
                        ),
                        child: Text(authState.error!, style: const TextStyle(color: AppColors.errorText, fontSize: 12)),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // Section 1: Institution Details
                    _buildSectionCard(
                      title: '1. School Institution Profile',
                      isDark: isDark,
                      children: [
                        CustomTextField(
                          controller: _schoolNameCtrl,
                          label: 'School Name *',
                          hint: 'e.g. Cambridge International Academy',
                          prefixIcon: Icons.domain_rounded,
                          validator: (v) => v == null || v.trim().isEmpty ? 'School name is required' : null,
                        ),
                        const SizedBox(height: 12),
                        LayoutBuilder(
                          builder: (context, constraints) {
                            final isWide = constraints.maxWidth > 380;
                            final codeWidget = CustomTextField(
                              controller: _schoolCodeCtrl,
                              label: 'School Code (Unique) *',
                              hint: 'e.g. CIA2025',
                              prefixIcon: Icons.qr_code_rounded,
                              validator: (v) => v == null || v.trim().isEmpty ? 'Code required' : null,
                            );
                            final phoneWidget = CustomTextField(
                              controller: _schoolPhoneCtrl,
                              label: 'School Phone',
                              hint: '+1 555-0199',
                              prefixIcon: Icons.phone_outlined,
                            );

                            if (isWide) {
                              return Row(
                                children: [
                                  Expanded(child: codeWidget),
                                  const SizedBox(width: 12),
                                  Expanded(child: phoneWidget),
                                ],
                              );
                            } else {
                              return Column(
                                children: [
                                  codeWidget,
                                  const SizedBox(height: 12),
                                  phoneWidget,
                                ],
                              );
                            }
                          },
                        ),
                        const SizedBox(height: 12),
                        CustomTextField(
                          controller: _schoolEmailCtrl,
                          label: 'School Contact Email *',
                          hint: 'info@cambridge.edu',
                          prefixIcon: Icons.mail_outline_rounded,
                          validator: (v) => v == null || !v.contains('@') ? 'Valid email required' : null,
                        ),
                        const SizedBox(height: 12),
                        CustomTextField(
                          controller: _schoolAddressCtrl,
                          label: 'Campus Address',
                          hint: 'Street, city, postal code',
                          prefixIcon: Icons.location_on_outlined,
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Section 2: School Administrator Account
                    _buildSectionCard(
                      title: '2. Administrator Account',
                      isDark: isDark,
                      children: [
                        CustomTextField(
                          controller: _adminNameCtrl,
                          label: 'Admin Full Name *',
                          hint: 'e.g. Dr. Robert Hayes',
                          prefixIcon: Icons.person_outline_rounded,
                          validator: (v) => v == null || v.trim().isEmpty ? 'Admin name required' : null,
                        ),
                        const SizedBox(height: 12),
                        CustomTextField(
                          controller: _adminEmailCtrl,
                          label: 'Admin Login Email *',
                          hint: 'admin@cambridge.edu',
                          prefixIcon: Icons.email_outlined,
                          validator: (v) => v == null || !v.contains('@') ? 'Valid email required' : null,
                        ),
                        const SizedBox(height: 12),
                        CustomTextField(
                          controller: _adminPasswordCtrl,
                          label: 'Password *',
                          hint: 'Minimum 6 characters',
                          prefixIcon: Icons.lock_outline_rounded,
                          obscureText: _obscurePassword,
                          suffixIcon: IconButton(
                            icon: Icon(_obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined, size: 18),
                            onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                          ),
                          validator: (v) => v == null || v.length < 6 ? 'Min 6 characters' : null,
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Submit Button
                    SizedBox(
                      height: 44,
                      child: ElevatedButton(
                        onPressed: authState.isLoading ? null : _handleRegister,
                        child: authState.isLoading
                            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : const Text('Complete School Registration', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSectionCard({required String title, required List<Widget> children, required bool isDark}) {
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
          Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
          const SizedBox(height: 14),
          ...children,
        ],
      ),
    );
  }
}

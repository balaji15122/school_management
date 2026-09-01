import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:school_management/core/theme/app_colors.dart';
import 'package:school_management/shared/widgets/custom_text_field.dart';
import 'package:school_management/features/admin_portal/providers/schools_provider.dart';

class SchoolFormDialog extends ConsumerStatefulWidget {
  const SchoolFormDialog({super.key});

  static Future<void> show(BuildContext context) {
    return showDialog(
      context: context,
      builder: (ctx) => const SchoolFormDialog(),
    );
  }

  @override
  ConsumerState<SchoolFormDialog> createState() => _SchoolFormDialogState();
}

class _SchoolFormDialogState extends ConsumerState<SchoolFormDialog> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _codeCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  bool _isLoading = false;
  String? _error;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _codeCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _addressCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    final success = await ref.read(schoolsNotifierProvider.notifier).createSchool(
      name: _nameCtrl.text.trim(),
      code: _codeCtrl.text.trim().toUpperCase(),
      address: _addressCtrl.text.trim(),
      contactEmail: _emailCtrl.text.trim(),
      contactPhone: _phoneCtrl.text.trim(),
    );

    setState(() => _isLoading = false);

    if (success && mounted) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('School tenant created successfully!'),
          backgroundColor: AppColors.success,
        ),
      );
    } else if (mounted) {
      setState(() => _error = 'Failed to create school. Ensure code is unique.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Dialog(
      backgroundColor: isDark ? AppColors.darkSurfaceCard : Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 460),
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.accent.withValues(alpha: 0.2) : AppColors.accentSubtle,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.domain_add_rounded, color: AppColors.accent, size: 18),
                    ),
                    const SizedBox(width: 10),
                    const Text('Register School Tenant', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                  ],
                ),
                const SizedBox(height: 16),

                if (_error != null) ...[
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.errorDarkBg : AppColors.errorBg,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(_error!, style: const TextStyle(color: AppColors.errorText, fontSize: 11)),
                  ),
                  const SizedBox(height: 12),
                ],

                CustomTextField(
                  controller: _nameCtrl,
                  label: 'School Name *',
                  hint: 'e.g. Cambridge International',
                  validator: (v) => v == null || v.trim().isEmpty ? 'Name is required' : null,
                ),
                const SizedBox(height: 10),

                Row(
                  children: [
                    Expanded(
                      child: CustomTextField(
                        controller: _codeCtrl,
                        label: 'Code *',
                        hint: 'e.g. CIS2025',
                        validator: (v) => v == null || v.trim().isEmpty ? 'Code required' : null,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: CustomTextField(
                        controller: _phoneCtrl,
                        label: 'Phone',
                        hint: '+1 555-0199',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                CustomTextField(
                  controller: _emailCtrl,
                  label: 'Contact Email *',
                  hint: 'info@cambridge.edu',
                  validator: (v) => v == null || !v.contains('@') ? 'Valid email required' : null,
                ),
                const SizedBox(height: 10),

                CustomTextField(
                  controller: _addressCtrl,
                  label: 'Campus Address',
                  hint: 'City, location',
                ),
                const SizedBox(height: 18),

                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('Cancel'),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      onPressed: _isLoading ? null : _submit,
                      child: _isLoading
                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Text('Create School'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

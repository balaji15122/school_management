import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:school_management/core/constants/app_constants.dart';
import 'package:school_management/core/network/api_endpoints.dart';
import 'package:school_management/core/theme/app_colors.dart';
import 'package:school_management/core/utils/formatters.dart';
import 'package:school_management/shared/models/student_model.dart';
import 'package:school_management/features/auth/providers/auth_provider.dart';
import 'package:school_management/features/admin_portal/providers/admin_students_provider.dart';

class StudentFormDialog extends ConsumerStatefulWidget {
  final StudentModel? studentToEdit;

  const StudentFormDialog({super.key, this.studentToEdit});

  static Future<bool?> show(BuildContext context, {StudentModel? studentToEdit}) {
    return showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => StudentFormDialog(studentToEdit: studentToEdit),
    );
  }

  @override
  ConsumerState<StudentFormDialog> createState() => _StudentFormDialogState();
}

class _StudentFormDialogState extends ConsumerState<StudentFormDialog> {
  final _formKey = GlobalKey<FormState>();
  final ImagePicker _picker = ImagePicker();

  // 10 Requested Fields:
  late final TextEditingController _nameController;
  late final TextEditingController _photoUrlController;
  late final TextEditingController _admissionNumberController;
  late String _selectedClass;
  late String _selectedSection;
  late final TextEditingController _rollNumberController;
  late DateTime _selectedDob;
  late String _selectedGender;
  late String _selectedBloodGroup;
  late String _selectedAcademicSession;

  bool _isUploadingPhoto = false;
  bool _isSaving = false;
  String? _errorMessage;
  String? _uploadSuccessMsg;

  final List<String> _sampleAvatars = [
    'https://api.dicebear.com/7.x/avataaars/png?seed=Alex',
    'https://api.dicebear.com/7.x/avataaars/png?seed=Sarah',
    'https://api.dicebear.com/7.x/avataaars/png?seed=Lucas',
    'https://api.dicebear.com/7.x/avataaars/png?seed=Emma',
    'https://api.dicebear.com/7.x/avataaars/png?seed=Oliver',
    'https://api.dicebear.com/7.x/avataaars/png?seed=Sophia',
    'https://api.dicebear.com/7.x/avataaars/png?seed=Noah',
    'https://api.dicebear.com/7.x/avataaars/png?seed=Mia',
  ];

  @override
  void initState() {
    super.initState();
    final s = widget.studentToEdit;
    _nameController = TextEditingController(text: s?.name ?? '');
    _photoUrlController = TextEditingController(
      text: s?.photoUrl ?? 'https://api.dicebear.com/7.x/avataaars/png?seed=Student',
    );
    _admissionNumberController = TextEditingController(text: s?.admissionNumber ?? '');
    _selectedClass = s?.studentClass.isNotEmpty == true ? s!.studentClass : 'Grade 10';
    _selectedSection = s?.section.isNotEmpty == true ? s!.section : 'A';
    _rollNumberController = TextEditingController(text: s?.rollNumber ?? '');
    _selectedDob = s?.dob ?? DateTime(2010, 1, 1);
    _selectedGender = s?.gender.isNotEmpty == true ? s!.gender.toLowerCase() : 'male';
    _selectedBloodGroup = s?.bloodGroup ?? 'O+';
    _selectedAcademicSession = s?.academicSession.isNotEmpty == true ? s!.academicSession : '2026–27';
  }

  @override
  void dispose() {
    _nameController.dispose();
    _photoUrlController.dispose();
    _admissionNumberController.dispose();
    _rollNumberController.dispose();
    super.dispose();
  }

  String? _uploadedFileName;

  Future<void> _pickAndUploadPhoto({ImageSource source = ImageSource.gallery}) async {
    try {
      final XFile? image = await _picker.pickImage(
        source: source,
        maxWidth: 1200,
        maxHeight: 1200,
        imageQuality: 85,
      );

      if (image == null) return;

      final Uint8List bytes = await image.readAsBytes();
      if (bytes.isEmpty) {
        setState(() => _errorMessage = 'Selected photo is empty');
        return;
      }

      setState(() {
        _isUploadingPhoto = true;
        _errorMessage = null;
        _uploadSuccessMsg = null;
      });

      // Prepare base64 data URL
      final ext = image.name.split('.').last.toLowerCase();
      final mime = ext == 'png' ? 'image/png' : (ext == 'webp' ? 'image/webp' : 'image/jpeg');
      final base64String = 'data:$mime;base64,${base64Encode(bytes)}';
      final enteredAdm = _admissionNumberController.text.trim();

      // Upload to Backend
      final api = ref.read(apiClientProvider);
      final res = await api.post(
        ApiEndpoints.uploadPhoto,
        data: {
          'imageBase64': base64String,
          'fileName': image.name,
          'admissionNumber': enteredAdm.isNotEmpty ? enteredAdm : null,
        },
      );

      if (res['success'] == true && res['data'] != null) {
        final uploadedUrl = res['data']['photoUrl'] ?? base64String;
        final photoName = res['data']['fileName'] ?? image.name;
        setState(() {
          _photoUrlController.text = uploadedUrl;
          _uploadedFileName = photoName;
          _isUploadingPhoto = false;
          _uploadSuccessMsg = 'Photo uploaded & renamed to Admission No: $photoName';
        });
      } else {
        // Fallback to direct base64 data URI
        setState(() {
          _photoUrlController.text = base64String;
          _uploadedFileName = enteredAdm.isNotEmpty ? '$enteredAdm.$ext' : image.name;
          _isUploadingPhoto = false;
          _uploadSuccessMsg = 'Photo loaded: $_uploadedFileName';
        });
      }
    } catch (e) {
      setState(() {
        _isUploadingPhoto = false;
        _errorMessage = 'Photo upload failed: ${e.toString()}';
      });
    }
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDob,
      firstDate: DateTime(1995),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      setState(() => _selectedDob = picked);
    }
  }

  Future<void> _submitForm(String status) async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSaving = true;
      _errorMessage = null;
    });

    try {
      final data = {
        'name': _nameController.text.trim(),
        'photoUrl': _photoUrlController.text.trim().isNotEmpty ? _photoUrlController.text.trim() : null,
        'admissionNumber': _admissionNumberController.text.trim().toUpperCase(),
        'class': _selectedClass,
        'section': _selectedSection,
        'rollNumber': _rollNumberController.text.trim(),
        'dob': _selectedDob.toIso8601String().split('T')[0],
        'gender': _selectedGender,
        'bloodGroup': _selectedBloodGroup,
        'academicSession': _selectedAcademicSession,
        'status': status,
      };

      bool success = false;
      if (widget.studentToEdit != null) {
        success = await ref.read(adminStudentsActionProvider.notifier).updateStudent(
          studentId: widget.studentToEdit!.id,
          data: data,
        );
      } else {
        success = await ref.read(adminStudentsActionProvider.notifier).createStudent(data);
      }

      if (success && mounted) {
        Navigator.of(context).pop(true);
      } else if (mounted) {
        setState(() {
          _isSaving = false;
          _errorMessage = 'Failed to save student record. Please check details.';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isSaving = false;
          _errorMessage = e.toString();
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isEditing = widget.studentToEdit != null;

    return Dialog(
      backgroundColor: isDark ? AppColors.darkSurfaceCard : Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 580, maxHeight: 720),
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Modal Header
                Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.accent.withValues(alpha: 0.2) : AppColors.accentSubtle,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.school_rounded, color: AppColors.accent, size: 22),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            isEditing ? 'Edit Student Record' : 'Upload Student Data',
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                          ),
                          Text(
                            'Enter student details to upload and forward to Super Admin',
                            style: TextStyle(
                              fontSize: 11,
                              color: isDark ? AppColors.darkTextMuted : AppColors.lightTextSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, size: 20),
                      onPressed: () => Navigator.of(context).pop(false),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Divider(color: isDark ? AppColors.darkBorder : AppColors.lightBorder, height: 1),
                const SizedBox(height: 14),

                if (_errorMessage != null) ...[
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    margin: const EdgeInsets.only(bottom: 12),
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.errorDarkBg : AppColors.errorBg,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      _errorMessage!,
                      style: const TextStyle(fontSize: 12, color: AppColors.errorText),
                    ),
                  ),
                ],

                if (_uploadSuccessMsg != null) ...[
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    margin: const EdgeInsets.only(bottom: 12),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF064E3B) : const Color(0xFFD1FAE5),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 16),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _uploadSuccessMsg!,
                            style: const TextStyle(fontSize: 12, color: AppColors.success),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                // Form Scrollable Body
                Expanded(
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Photo Selection & Direct Upload
                        _buildSectionHeader('Student Photo & Upload'),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Stack(
                              alignment: Alignment.center,
                              children: [
                                CircleAvatar(
                                  radius: 32,
                                  backgroundColor: isDark
                                      ? AppColors.accent.withValues(alpha: 0.2)
                                      : AppColors.accentSubtle,
                                  backgroundImage: _photoUrlController.text.isNotEmpty
                                      ? NetworkImage(_photoUrlController.text)
                                      : null,
                                  child: _photoUrlController.text.isEmpty
                                      ? const Icon(Icons.person_rounded, size: 32, color: AppColors.accent)
                                      : null,
                                ),
                                if (_isUploadingPhoto)
                                  Container(
                                    width: 64,
                                    height: 64,
                                    decoration: BoxDecoration(
                                      color: Colors.black54,
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Center(
                                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                    ),
                                  ),
                              ],
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Wrap(
                                    spacing: 8,
                                    runSpacing: 6,
                                    crossAxisAlignment: WrapCrossAlignment.center,
                                    children: [
                                      ElevatedButton.icon(
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: AppColors.accent,
                                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                        ),
                                        onPressed: _isUploadingPhoto ? null : _pickAndUploadPhoto,
                                        icon: const Icon(Icons.upload_file_rounded, size: 16),
                                        label: const Text('Upload Photo from Device', style: TextStyle(fontSize: 12)),
                                      ),
                                      if (_photoUrlController.text.isNotEmpty)
                                        TextButton(
                                          style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 8)),
                                          onPressed: () => setState(() {
                                            _photoUrlController.text = '';
                                            _uploadSuccessMsg = null;
                                          }),
                                          child: const Text('Remove Photo', style: TextStyle(fontSize: 11, color: AppColors.error)),
                                        ),
                                    ],
                                  ),
                                  if (_uploadedFileName != null || _photoUrlController.text.isNotEmpty) ...[
                                    const SizedBox(height: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                                        borderRadius: BorderRadius.circular(6),
                                        border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          const Icon(Icons.link_rounded, size: 12, color: AppColors.accent),
                                          const SizedBox(width: 4),
                                          Text(
                                            'Photo File: ${_uploadedFileName ?? (_admissionNumberController.text.trim().isNotEmpty ? '${_admissionNumberController.text.trim().toUpperCase()}.jpg' : 'student_photo.jpg')}',
                                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.accent),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                  const SizedBox(height: 6),
                                  Text(
                                    'Or select from avatar presets:',
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  SingleChildScrollView(
                                    scrollDirection: Axis.horizontal,
                                    child: Row(
                                      children: _sampleAvatars.map((url) {
                                        final isSel = _photoUrlController.text == url;
                                        return GestureDetector(
                                          onTap: () => setState(() {
                                            _photoUrlController.text = url;
                                            _uploadSuccessMsg = null;
                                          }),
                                          child: Container(
                                            margin: const EdgeInsets.only(right: 6),
                                            padding: const EdgeInsets.all(2),
                                            decoration: BoxDecoration(
                                              shape: BoxShape.circle,
                                              border: Border.all(
                                                color: isSel ? AppColors.accent : Colors.transparent,
                                                width: 2,
                                              ),
                                            ),
                                            child: CircleAvatar(
                                              radius: 14,
                                              backgroundImage: NetworkImage(url),
                                            ),
                                          ),
                                        );
                                      }).toList(),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),

                        // 1. Student Full Name
                        _buildLabel('1. Student Full Name *'),
                        TextFormField(
                          controller: _nameController,
                          style: const TextStyle(fontSize: 13),
                          decoration: const InputDecoration(
                            hintText: 'e.g. Johnathan Miller',
                            prefixIcon: Icon(Icons.badge_outlined, size: 18),
                            contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                          ),
                          validator: (v) => v == null || v.trim().isEmpty ? 'Student Full Name is required' : null,
                        ),
                        const SizedBox(height: 14),

                        // 3. Admission Number / Student ID & 6. Roll Number
                        Row(
                          children: [
                            Expanded(
                              flex: 3,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _buildLabel('3. Admission No / Student ID *'),
                                  TextFormField(
                                    controller: _admissionNumberController,
                                    style: const TextStyle(fontSize: 13),
                                    onChanged: (val) {
                                      setState(() {}); // Re-render photo file badge preview
                                    },
                                    decoration: const InputDecoration(
                                      hintText: 'e.g. GWH-2026-001',
                                      prefixIcon: Icon(Icons.fingerprint_rounded, size: 18),
                                      contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                                    ),
                                    validator: (v) =>
                                        v == null || v.trim().isEmpty ? 'Admission ID is required' : null,
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              flex: 2,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _buildLabel('6. Roll Number *'),
                                  TextFormField(
                                    controller: _rollNumberController,
                                    style: const TextStyle(fontSize: 13),
                                    decoration: const InputDecoration(
                                      hintText: 'e.g. 14',
                                      prefixIcon: Icon(Icons.format_list_numbered_rounded, size: 18),
                                      contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                                    ),
                                    validator: (v) =>
                                        v == null || v.trim().isEmpty ? 'Roll No is required' : null,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),

                        // 4. Class, 5. Section & 10. Academic Session
                        Row(
                          children: [
                            Expanded(
                              flex: 2,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _buildLabel('4. Class *'),
                                  DropdownButtonFormField<String>(
                                    initialValue: _selectedClass,
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                                    ),
                                    decoration: const InputDecoration(
                                      contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                    ),
                                    items: AppConstants.schoolClasses
                                        .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                                        .toList(),
                                    onChanged: (val) => setState(() => _selectedClass = val ?? _selectedClass),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              flex: 1,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _buildLabel('5. Sec *'),
                                  DropdownButtonFormField<String>(
                                    initialValue: _selectedSection,
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                                    ),
                                    decoration: const InputDecoration(
                                      contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                    ),
                                    items: AppConstants.classSections
                                        .map((s) => DropdownMenuItem(value: s, child: Text('Sec $s')))
                                        .toList(),
                                    onChanged: (val) => setState(() => _selectedSection = val ?? _selectedSection),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              flex: 2,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _buildLabel('10. Academic Session *'),
                                  DropdownButtonFormField<String>(
                                    initialValue: _selectedAcademicSession,
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                                    ),
                                    decoration: const InputDecoration(
                                      contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                    ),
                                    items: AppConstants.academicSessions
                                        .map((ses) => DropdownMenuItem(value: ses, child: Text(ses)))
                                        .toList(),
                                    onChanged: (val) =>
                                        setState(() => _selectedAcademicSession = val ?? _selectedAcademicSession),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),

                        // 7. DOB, 8. Gender & 9. Blood Group (optional)
                        Row(
                          children: [
                            Expanded(
                              flex: 2,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _buildLabel('7. Date of Birth *'),
                                  InkWell(
                                    onTap: _pickDate,
                                    borderRadius: BorderRadius.circular(8),
                                    child: Container(
                                      height: 42,
                                      padding: const EdgeInsets.symmetric(horizontal: 10),
                                      decoration: BoxDecoration(
                                        color: isDark ? const Color(0xFF0F172A) : AppColors.lightBackground,
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(
                                          color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                                        ),
                                      ),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            Formatters.formatDate(_selectedDob),
                                            style: const TextStyle(fontSize: 12),
                                          ),
                                          const Icon(Icons.calendar_today_rounded, size: 16, color: AppColors.accent),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              flex: 2,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _buildLabel('8. Gender *'),
                                  DropdownButtonFormField<String>(
                                    initialValue: _selectedGender,
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                                    ),
                                    decoration: const InputDecoration(
                                      contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                    ),
                                    items: const [
                                      DropdownMenuItem(value: 'male', child: Text('Male')),
                                      DropdownMenuItem(value: 'female', child: Text('Female')),
                                      DropdownMenuItem(value: 'other', child: Text('Other')),
                                    ],
                                    onChanged: (val) => setState(() => _selectedGender = val ?? _selectedGender),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              flex: 2,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _buildLabel('9. Blood Group (opt)'),
                                  DropdownButtonFormField<String>(
                                    initialValue: _selectedBloodGroup,
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                                    ),
                                    decoration: const InputDecoration(
                                      contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                    ),
                                    items: [
                                      const DropdownMenuItem(value: '', child: Text('None')),
                                      ...AppConstants.bloodGroups
                                          .map((bg) => DropdownMenuItem(value: bg, child: Text(bg))),
                                    ],
                                    onChanged: (val) =>
                                        setState(() => _selectedBloodGroup = val ?? _selectedBloodGroup),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 12),
                Divider(color: isDark ? AppColors.darkBorder : AppColors.lightBorder, height: 1),
                const SizedBox(height: 12),

                // Dialog Actions (Clean & Natural)
                Wrap(
                  alignment: WrapAlignment.end,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  spacing: 10,
                  runSpacing: 8,
                  children: [
                    TextButton(
                      onPressed: _isSaving ? null : () => Navigator.of(context).pop(false),
                      child: const Text('Cancel'),
                    ),
                    if (!isEditing)
                      OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        ),
                        onPressed: _isSaving ? null : () => _submitForm('draft'),
                        icon: const Icon(Icons.save_as_outlined, size: 16),
                        label: const Text('Save as Draft', style: TextStyle(fontSize: 12)),
                      ),
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.accent,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      ),
                      onPressed: _isSaving ? null : () => _submitForm(isEditing ? (widget.studentToEdit!.status) : 'forwarded'),
                      icon: _isSaving
                          ? const SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Icon(Icons.send_rounded, size: 16),
                      label: Text(
                        isEditing
                            ? 'Save Changes'
                            : 'Send / Forward to Super Admin',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                      ),
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

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Text(
        title.toUpperCase(),
        style: const TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.5,
          color: AppColors.accent,
        ),
      ),
    );
  }

  Widget _buildLabel(String label) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.only(bottom: 4.0),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
        ),
      ),
    );
  }
}

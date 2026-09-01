import 'package:flutter/foundation.dart';
import 'package:universal_html/html.dart' as html;

class FileDownloader {
  static void saveFileFromBytes({
    required List<int> bytes,
    required String fileName,
    String mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }) {
    if (kIsWeb) {
      final blob = html.Blob([bytes], mimeType);
      final url = html.Url.createObjectUrlFromBlob(blob);
      html.AnchorElement(href: url)
        ..setAttribute('download', fileName)
        ..click();
      html.Url.revokeObjectUrl(url);
    } else {
      // For mobile/desktop native platforms
      try {
        debugPrint('[FileDownloader] Prepared binary file: $fileName (${bytes.length} bytes)');
      } catch (e) {
        debugPrint('[FileDownloader Error]: $e');
      }
    }
  }
}

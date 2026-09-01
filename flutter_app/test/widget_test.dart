import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:school_management/app.dart';

void main() {
  testWidgets('EduCloud app launches successfully', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: EduCloudApp(),
      ),
    );

    // Initial pump and settle
    await tester.pump();
    expect(find.byType(EduCloudApp), findsOneWidget);
  });
}

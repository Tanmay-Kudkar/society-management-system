import 'package:flutter_test/flutter_test.dart';
import 'package:SocietyConnect/main.dart';
import 'package:provider/provider.dart';
import 'package:SocietyConnect/features/auth/services/auth_service.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AuthService()),
        ],
        child: const SocietyApp(),
      ),
    );

    // Verify that login screen is shown (SocietyConnect title)
    expect(find.text('SocietyConnect'), findsOneWidget);
  });
}

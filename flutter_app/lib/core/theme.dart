import 'package:flutter/material.dart';

class AppTheme {
  static const Color primaryNavy = Color(0xFF1A237E);
  static const Color slateGray = Color(0xFF455A64);
  static const Color accentCoral = Color(0xFFFF7043);
  static const Color successGreen = Color(0xFF43A047);
  static const Color errorRed = Color(0xFFD32F2F);
  static const Color secondaryGold = Color(0xFFFFA000);

  static ThemeData get lightTheme {
    return ThemeData(
      primaryColor: primaryNavy,
      scaffoldBackgroundColor: Colors.white,
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: IconThemeData(color: primaryNavy),
        titleTextStyle: TextStyle(
          color: primaryNavy,
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
      ),
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryNavy,
        secondary: accentCoral,
      ),
      useMaterial3: true,
    );
  }
}

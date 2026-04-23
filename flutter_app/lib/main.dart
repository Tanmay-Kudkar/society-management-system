import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/theme.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/auth/services/auth_service.dart';
import 'features/dashboard/screens/dashboard_screen.dart';
import 'features/payments/screens/payments_screen.dart';
import 'features/complaints/screens/complaints_list_screen.dart';
import 'features/profile/screens/profile_screen.dart';

import 'features/complaints/providers/ticket_provider.dart';
import 'features/complaints/providers/complaint_provider.dart';
import 'features/dashboard/providers/dashboard_provider.dart';
import 'features/payments/providers/payment_provider.dart';
import 'features/profile/providers/profile_provider.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()..checkAuthStatus()),
        ChangeNotifierProxyProvider<AuthService, TicketProvider>(
          create: (context) => TicketProvider(Provider.of<AuthService>(context, listen: false)),
          update: (context, auth, previous) => TicketProvider(auth),
        ),
        ChangeNotifierProxyProvider<AuthService, ComplaintProvider>(
          create: (context) => ComplaintProvider(Provider.of<AuthService>(context, listen: false)),
          update: (context, auth, previous) => ComplaintProvider(auth),
        ),
        ChangeNotifierProxyProvider<AuthService, DashboardProvider>(
          create: (context) => DashboardProvider(Provider.of<AuthService>(context, listen: false)),
          update: (context, auth, previous) => DashboardProvider(auth),
        ),
        ChangeNotifierProxyProvider<AuthService, PaymentProvider>(
          create: (context) => PaymentProvider(Provider.of<AuthService>(context, listen: false)),
          update: (context, auth, previous) => PaymentProvider(auth),
        ),
        ChangeNotifierProxyProvider<AuthService, ProfileProvider>(
          create: (context) => ProfileProvider(Provider.of<AuthService>(context, listen: false)),
          update: (context, auth, previous) => previous!..updateWithAuth(auth),
        ),
      ],
      child: const SocietyApp(),
    ),
  );
}

class SocietyApp extends StatelessWidget {
  const SocietyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SocietyConnect',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: Consumer<AuthService>(
        builder: (context, auth, _) {
          return auth.isAuthenticated ? const MainNavigation() : const LoginScreen();
        },
      ),
    );
  }
}

class MainNavigation extends StatefulWidget {
  const MainNavigation({super.key});

  @override
  State<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  int _selectedIndex = 0;

  final List<Widget> _screens = [
    const DashboardScreen(),
    const PaymentsScreen(),
    const ComplaintsListScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) => setState(() => _selectedIndex = index),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: AppTheme.primaryNavy,
        unselectedItemColor: AppTheme.slateGray,
        showUnselectedLabels: true,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.payment_outlined), label: 'Payments'),
          BottomNavigationBarItem(icon: Icon(Icons.report_problem_outlined), label: 'Complaints'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'Profile'),
        ],
      ),
    );
  }
}

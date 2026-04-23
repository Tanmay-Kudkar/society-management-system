import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:local_auth/local_auth.dart';
import '../../../core/theme.dart';
import '../../auth/services/auth_service.dart';
import '../providers/profile_provider.dart';
import '../models/user_model.dart';
import 'details_screen.dart';
import 'help_center_screen.dart';
import 'privacy_policy_screen.dart';
import 'about_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final LocalAuthentication auth = LocalAuthentication();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProfileProvider>().refreshProfile();
    });
  }

  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context, listen: false);
    final profileProvider = context.watch<ProfileProvider>();
    final user = profileProvider.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => profileProvider.refreshProfile(),
          ),
        ],
      ),
      body: profileProvider.isLoading && user == null
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () => profileProvider.refreshProfile(),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    const CircleAvatar(
                      radius: 50,
                      backgroundColor: AppTheme.primaryNavy,
                      child: Icon(Icons.person, size: 60, color: Colors.white),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      user?.name ?? 'Loading...',
                      style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppTheme.primaryNavy),
                    ),
                    Text(
                      user?.flatNumber != null && user?.societyName != null
                          ? '${user!.flatNumber}, ${user.societyName}'
                          : user?.email ?? '',
                      style: const TextStyle(fontSize: 14, color: AppTheme.slateGray),
                    ),
                    const SizedBox(height: 32),
                    _buildProfileSection(
                      context,
                      user: user,
                      title: 'Account Settings',
                      items: [
                        {
                          'icon': Icons.person_outline, 
                          'label': 'Personal Details',
                          'subtitle': user?.phone ?? user?.email
                        },
                        {
                          'icon': Icons.home_outlined, 
                          'label': 'Flat Info',
                          'subtitle': user?.flatNumber ?? 'No flat assigned'
                        },
                        {'icon': Icons.family_restroom_outlined, 'label': 'Family Members'},
                      ],
                    ),
                    const SizedBox(height: 24),
                    _buildProfileSection(
                      context,
                      user: user,
                      title: 'Security',
                      items: [
                        {'icon': Icons.lock_outline, 'label': 'Change Password'},
                        {'icon': Icons.fingerprint, 'label': 'Biometric Authentication'},
                      ],
                    ),
                    const SizedBox(height: 24),
                    _buildProfileSection(
                      context,
                      user: user,
                      title: 'Support',
                      items: [
                        {'icon': Icons.help_outline, 'label': 'Help Center'},
                        {'icon': Icons.policy_outlined, 'label': 'Privacy Policy'},
                        {'icon': Icons.info_outline, 'label': 'About SocietyConnect'},
                      ],
                    ),
                    const SizedBox(height: 40),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () => authService.logout(),
                        icon: const Icon(Icons.logout, color: AppTheme.errorRed),
                        label: const Text('LOGOUT', style: TextStyle(color: AppTheme.errorRed, fontWeight: FontWeight.bold)),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: AppTheme.errorRed),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'Version 1.0.0+1',
                      style: TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildProfileSection(BuildContext context, {required ProfileUser? user, required String title, required List<Map<String, dynamic>> items}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.primaryNavy),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[200]!),
          ),
          child: Column(
            children: items.map((item) {
              final index = items.indexOf(item);
              return Column(
                children: [
                  ListTile(
                    leading: Icon(item['icon'] as IconData, color: AppTheme.slateGray, size: 22),
                    title: Text(item['label'] as String, style: const TextStyle(fontSize: 14)),
                    subtitle: item['subtitle'] != null 
                        ? Text(item['subtitle'] as String, style: const TextStyle(fontSize: 12, color: Colors.grey))
                        : null,
                    trailing: const Icon(Icons.chevron_right, size: 20, color: Colors.grey),
                    onTap: () {
                      if (item['label'] == 'Biometric Authentication') {
                        _authenticate(context);
                      } else if (item['label'] == 'Personal Details') {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => DetailsScreen(
                              title: 'Personal Details',
                              details: {
                                'Full Name': user?.name ?? 'N/A',
                                'Email Address': user?.email ?? 'N/A',
                                'Phone Number': user?.phone ?? 'N/A',
                                'Role': user?.role ?? 'N/A',
                                'Account Type': user?.accountType ?? 'N/A',
                                'Account Status': (user?.isActive ?? false) ? 'Active' : 'Inactive',
                              },
                            ),
                          ),
                        );
                      } else if (item['label'] == 'Flat Info') {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => DetailsScreen(
                              title: 'Flat Info',
                              details: {
                                'Flat Number': user?.flatNumber ?? 'N/A',
                                'Society Name': user?.societyName ?? 'N/A',
                                'Society ID': user?.societyId?.toString() ?? 'N/A',
                                'Flat ID': user?.flatId?.toString() ?? 'N/A',
                              },
                            ),
                          ),
                        );
                      } else if (item['label'] == 'Family Members') {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Family Members feature is coming soon!')),
                        );
                      } else if (item['label'] == 'Help Center') {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => const HelpCenterScreen()),
                        );
                      } else if (item['label'] == 'Privacy Policy') {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => const PrivacyPolicyScreen()),
                        );
                      } else if (item['label'] == 'About SocietyConnect') {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => const AboutScreen()),
                        );
                      } else {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => DetailsScreen(
                              title: item['label'] as String,
                              details: {
                                'Status': 'Coming Soon',
                                'Message': 'This feature will be available in a future update.',
                              },
                            ),
                          ),
                        );
                      }
                    },
                  ),
                  if (index < items.length - 1) const Divider(height: 0, indent: 56),
                ],
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Future<void> _authenticate(BuildContext context) async {
    try {
      final bool canAuthenticateWithBiometrics = await auth.canCheckBiometrics;
      final bool canAuthenticate = canAuthenticateWithBiometrics || await auth.isDeviceSupported();

      if (!canAuthenticate) {
        if (!context.mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Biometric authentication is not available on this device.')),
        );
        return;
      }

      final bool didAuthenticate = await auth.authenticate(
        localizedReason: 'Please authenticate to access secure features',
        biometricOnly: true,
        persistAcrossBackgrounding: true,
      );

      if (!context.mounted) return;
      if (didAuthenticate) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Authentication Successful!'),
            backgroundColor: AppTheme.successGreen,
          ),
        );
      }
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: AppTheme.errorRed),
      );
    }
  }
}

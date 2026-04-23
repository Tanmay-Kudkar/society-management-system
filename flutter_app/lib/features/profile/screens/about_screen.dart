import 'package:flutter/material.dart';
import '../../../core/theme.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('About SocietyConnect', style: TextStyle(color: AppTheme.primaryNavy)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppTheme.primaryNavy),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const SizedBox(height: 20),
            const CircleAvatar(
              radius: 60,
              backgroundColor: AppTheme.primaryNavy,
              child: Icon(Icons.home_work_outlined, size: 70, color: Colors.white),
            ),
            const SizedBox(height: 24),
            const Text(
              'SocietyConnect',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: AppTheme.primaryNavy,
              ),
            ),
            const Text(
              'Version 1.0.0',
              style: TextStyle(
                fontSize: 14,
                color: AppTheme.slateGray,
              ),
            ),
            const SizedBox(height: 40),
            const Text(
              'SocietyConnect is a comprehensive management solution designed to streamline communication and operations within residential societies. From automated maintenance billing to transparent complaint management and real-time notices, we aim to make community living smarter and more efficient.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 16,
                color: AppTheme.slateGray,
                height: 1.6,
              ),
            ),
            const SizedBox(height: 40),
            _buildFeatureRow(Icons.security, 'Secure Payments'),
            _buildFeatureRow(Icons.campaign, 'Smart Notices'),
            _buildFeatureRow(Icons.support_agent, 'Complaint Gating'),
            _buildFeatureRow(Icons.people_alt, 'Community Driven'),
            const SizedBox(height: 60),
            const Text(
              '© 2024 SocietyConnect Inc.',
              style: TextStyle(color: Colors.grey, fontSize: 12),
            ),
            const Text(
              'All rights reserved.',
              style: TextStyle(color: Colors.grey, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeatureRow(IconData icon, String label) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: AppTheme.primaryNavy, size: 20),
          const SizedBox(width: 12),
          Text(
            label,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AppTheme.primaryNavy,
            ),
          ),
        ],
      ),
    );
  }
}

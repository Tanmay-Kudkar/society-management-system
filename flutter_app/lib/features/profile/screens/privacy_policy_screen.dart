import 'package:flutter/material.dart';
import '../../../core/theme.dart';

class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Privacy Policy', style: TextStyle(color: AppTheme.primaryNavy)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppTheme.primaryNavy),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Privacy Policy',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: AppTheme.primaryNavy,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Last Updated: April 2026',
              style: TextStyle(color: Colors.grey[500], fontSize: 14),
            ),
            const SizedBox(height: 24),
            _buildSection(
              '1. Information We Collect',
              'We collect personal information that you provide to us, such as your name, contact information, flat details, and payment information when you use the SocietyConnect app.',
            ),
            _buildSection(
              '2. How We Use Your Information',
              'We use your information to provide and maintain our services, including processing payments, managing complaints, and facilitating communication within your society.',
            ),
            _buildSection(
              '3. Data Security',
              'We implement a variety of security measures to maintain the safety of your personal information. Your payment transactions are processed through a secure gateway provider and are not stored or processed on our servers.',
            ),
            _buildSection(
              '4. Disclosure to Third Parties',
              'We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. This does not include trusted third parties who assist us in operating our app and conducting our business, so long as those parties agree to keep this information confidential.',
            ),
            _buildSection(
              '5. Your Consent',
              'By using our app, you consent to our privacy policy.',
            ),
            const SizedBox(height: 20),
            const Text(
              'If you have any questions regarding this privacy policy, you may contact us using the information in the Help Center.',
              style: TextStyle(color: AppTheme.slateGray, fontSize: 14, height: 1.5),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(String title, String content) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppTheme.primaryNavy,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            content,
            style: const TextStyle(
              fontSize: 15,
              color: AppTheme.slateGray,
              height: 1.6,
            ),
          ),
        ],
      ),
    );
  }
}

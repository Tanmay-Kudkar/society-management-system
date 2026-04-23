import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme.dart';
import '../providers/dashboard_provider.dart';
import '../models/dashboard_models.dart';

class EmergencyContactsScreen extends StatelessWidget {
  const EmergencyContactsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Emergency Contacts'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Consumer<DashboardProvider>(
        builder: (context, dashboard, child) {
          if (dashboard.isLoading && dashboard.emergencyContacts.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          final contacts = dashboard.emergencyContacts;

          return RefreshIndicator(
            onRefresh: dashboard.loadDashboardData,
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                _buildQuickCallSection(),
                const SizedBox(height: 24),
                const Text(
                  'Society Contacts',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primaryNavy,
                  ),
                ),
                const SizedBox(height: 12),
                if (contacts.isEmpty)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: 20),
                      child: Text('No society contacts listed'),
                    ),
                  )
                else
                  ...contacts.map((contact) => _buildContactTile(context, contact)),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildQuickCallSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Quick Help',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppTheme.primaryNavy,
          ),
        ),
        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _buildQuickCallItem(Icons.local_police, 'Police', '100', Colors.blue),
            _buildQuickCallItem(Icons.medical_services, 'Ambulance', '102', Colors.red),
            _buildQuickCallItem(Icons.local_fire_department, 'Fire', '101', Colors.orange),
          ],
        ),
      ],
    );
  }

  Widget _buildQuickCallItem(IconData icon, String label, String number, Color color) {
    return InkWell(
      onTap: () => _launchCaller(number),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 30),
          ),
          const SizedBox(height: 8),
          Text(label, style: const TextStyle(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _buildContactTile(BuildContext context, EmergencyContact contact) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: AppTheme.primaryNavy.withOpacity(0.1),
          child: Icon(_getIconForType(contact.type), color: AppTheme.primaryNavy, size: 20),
        ),
        title: Text(
          contact.name,
          style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primaryNavy),
        ),
        subtitle: Text(contact.type),
        trailing: IconButton(
          icon: const Icon(Icons.call, color: AppTheme.successGreen),
          onPressed: () => _launchCaller(contact.phone),
        ),
      ),
    );
  }

  IconData _getIconForType(String type) {
    switch (type.toUpperCase()) {
      case 'POLICE': return Icons.security;
      case 'AMBULANCE': return Icons.medical_services;
      case 'FIRE': return Icons.local_fire_department;
      case 'MAINTENANCE': return Icons.build;
      case 'DOCTOR': return Icons.person;
      default: return Icons.phone;
    }
  }

  Future<void> _launchCaller(String number) async {
    final Uri url = Uri.parse('tel:$number');
    if (await canLaunchUrl(url)) {
      await launchUrl(url);
    }
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../../core/theme.dart';
import '../providers/dashboard_provider.dart';
import '../models/dashboard_models.dart';

class VisitorListScreen extends StatelessWidget {
  const VisitorListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Visitor Logs'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Consumer<DashboardProvider>(
        builder: (context, dashboard, child) {
          if (dashboard.isLoading && dashboard.visitors.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          if (dashboard.visitors.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.people_outline, size: 64, color: Colors.grey[300]),
                  const SizedBox(height: 16),
                  Text(
                    'No visitor logs found',
                    style: TextStyle(color: Colors.grey[600], fontSize: 16),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: dashboard.loadDashboardData,
            child: ListView.builder(
              padding: const EdgeInsets.all(20),
              itemCount: dashboard.visitors.length,
              itemBuilder: (context, index) {
                final visitor = dashboard.visitors[index];
                return _buildVisitorCard(context, visitor);
              },
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {},
        backgroundColor: AppTheme.primaryNavy,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('Pre-approve', style: TextStyle(color: Colors.white)),
      ),
    );
  }

  Widget _buildVisitorCard(BuildContext context, Visitor visitor) {
    Color statusColor;
    switch (visitor.status) {
      case 'CHECKED_IN':
        statusColor = AppTheme.successGreen;
        break;
      case 'PENDING':
        statusColor = AppTheme.secondaryGold;
        break;
      case 'REJECTED':
        statusColor = AppTheme.errorRed;
        break;
      default:
        statusColor = Colors.grey;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                visitor.name,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primaryNavy,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  visitor.status.replaceAll('_', ' '),
                  style: TextStyle(
                    color: statusColor,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Purpose: ${visitor.purpose}',
            style: TextStyle(color: Colors.grey[700], fontSize: 14),
          ),
          const Divider(height: 24),
          Row(
            children: [
              Icon(Icons.phone_outlined, size: 16, color: Colors.grey[400]),
              const SizedBox(width: 8),
              Text(visitor.phone, style: TextStyle(color: Colors.grey[700])),
              const Spacer(),
              if (visitor.checkInTime != null)
                Text(
                  'In: ${DateFormat('HH:mm, dd MMM').format(visitor.checkInTime!)}',
                  style: TextStyle(color: Colors.grey[500], fontSize: 12),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

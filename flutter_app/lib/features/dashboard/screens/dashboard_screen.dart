import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../../core/theme.dart';
import '../../auth/services/auth_service.dart';
import '../../complaints/screens/complaints_list_screen.dart';
import '../../payments/screens/payments_screen.dart';
import '../providers/dashboard_provider.dart';
import '../models/dashboard_models.dart';
import 'notice_board_screen.dart';
import 'notification_screen.dart';
import 'tenant_list_screen.dart';
import 'visitor_list_screen.dart';
import 'emergency_contacts_screen.dart';
import '../../complaints/screens/tickets_list_screen.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Consumer2<AuthService, DashboardProvider>(
          builder: (context, auth, dashboard, child) {
            return RefreshIndicator(
              onRefresh: dashboard.loadDashboardData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildHeader(context, auth.userName ?? 'User'),
                      const SizedBox(height: 24),
                      if (dashboard.isLoading && dashboard.bills.isEmpty)
                        const Center(child: CircularProgressIndicator())
                      else
                        _buildMaintenanceSection(context, dashboard),
                      const SizedBox(height: 24),
                      _buildSectionHeader(context, 'Quick Actions', showSeeAll: false),
                      const SizedBox(height: 12),
                      const QuickActionsGrid(),
                      const SizedBox(height: 24),
                      _buildSectionHeader(
                        context,
                        'Recent Notices',
                        onSeeAll: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => const NoticeBoardScreen()),
                          );
                        },
                      ),
                      const SizedBox(height: 12),
                      RecentActivityList(notices: dashboard.notices),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildMaintenanceSection(BuildContext context, DashboardProvider dashboard) {
    final latestBill = dashboard.latestPendingBill;
    
    if (latestBill == null) {
      return MaintenanceCard(
        amount: '₹ 0.00',
        dueDate: 'No Pending Dues',
        isOverdue: false,
        payNowPressed: () {},
      );
    }

    return MaintenanceCard(
      amount: '₹ ${NumberFormat('#,##,###').format(latestBill.pendingAmount)}',
      dueDate: DateFormat('dd MMM yyyy').format(latestBill.dueDate),
      isOverdue: latestBill.isOverdue,
      payNowPressed: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const PaymentsScreen()),
        );
      },
    );
  }

  Widget _buildHeader(BuildContext context, String name) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Welcome,',
              style: TextStyle(color: Colors.grey[600], fontSize: 16),
            ),
            Text(
              name,
              style: const TextStyle(
                color: AppTheme.primaryNavy,
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        Stack(
          children: [
            IconButton(
              icon: const Icon(Icons.notifications_none_outlined,
                  color: AppTheme.primaryNavy, size: 28),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const NotificationScreen()),
                );
              },
            ),
            Positioned(
              right: 12,
              top: 12,
              child: Container(
                padding: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  color: AppTheme.accentCoral,
                  borderRadius: BorderRadius.circular(6),
                ),
                constraints: const BoxConstraints(minWidth: 12, minHeight: 12),
              ),
            )
          ],
        )
      ],
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title, {VoidCallback? onSeeAll, bool showSeeAll = true}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppTheme.primaryNavy,
          ),
        ),
        if (showSeeAll)
          TextButton(
            onPressed: onSeeAll,
            child: const Text(
              'See All',
              style: TextStyle(
                color: AppTheme.accentCoral,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
      ],
    );
  }
}

class MaintenanceCard extends StatelessWidget {
  final String amount;
  final String dueDate;
  final bool isOverdue;
  final VoidCallback payNowPressed;

  const MaintenanceCard({
    super.key,
    required this.amount,
    required this.dueDate,
    required this.isOverdue,
    required this.payNowPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isOverdue ? const Color(0xFFFFF1F0) : const Color(0xFFF6FFED),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isOverdue ? AppTheme.errorRed : AppTheme.successGreen,
          width: 1,
        ),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Maintenance Dues',
                    style: TextStyle(
                      color: isOverdue ? AppTheme.errorRed : AppTheme.successGreen,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    amount,
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primaryNavy,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: isOverdue ? AppTheme.errorRed : AppTheme.successGreen,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  isOverdue ? 'OVERDUE' : 'PAID',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Due Date: $dueDate',
                style: TextStyle(color: Colors.grey[700]),
              ),
              if (amount != '₹ 0.00')
                ElevatedButton(
                  onPressed: payNowPressed,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryNavy,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text('Pay Now'),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class QuickActionsGrid extends StatelessWidget {
  const QuickActionsGrid({super.key});

  @override
  Widget build(BuildContext context) {
    final actions = [
      {'icon': Icons.receipt_long, 'label': 'Pay Bills'},
      {'icon': Icons.report_problem_outlined, 'label': 'Complaints'},
      {'icon': Icons.assignment_outlined, 'label': 'Tickets'},
      {'icon': Icons.campaign_outlined, 'label': 'Notice Board'},
      {'icon': Icons.people_outline, 'label': 'Tenant'},
      {'icon': Icons.people_outline, 'label': 'Visitors'},
      {'icon': Icons.emergency_share_outlined, 'label': 'Emergency'},
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: 1,
      ),
      itemCount: actions.length,
      itemBuilder: (context, index) {
        return InkWell(
          onTap: () {
            if (actions[index]['label'] == 'Complaints') {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const ComplaintsListScreen()),
              );
            } else if (actions[index]['label'] == 'Tickets') {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const TicketsListScreen()),
              );
            } else if (actions[index]['label'] == 'Pay Bills') {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const PaymentsScreen()),
              );
            } else if (actions[index]['label'] == 'Notice Board') {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const NoticeBoardScreen()),
              );
            } else if (actions[index]['label'] == 'Tenant') {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const TenantListScreen()),
              );
            } else if (actions[index]['label'] == 'Visitors') {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const VisitorListScreen()),
              );
            } else if (actions[index]['label'] == 'Emergency') {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const EmergencyContactsScreen()),
              );
            }
          },
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(actions[index]['icon'] as IconData,
                    color: AppTheme.primaryNavy, size: 30),
                const SizedBox(height: 8),
                Text(
                  actions[index]['label'] as String,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.slateGray,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class RecentActivityList extends StatelessWidget {
  final List<Notice> notices;
  
  const RecentActivityList({super.key, required this.notices});

  @override
  Widget build(BuildContext context) {
    if (notices.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(20.0),
          child: Text('No recent notices', style: TextStyle(color: Colors.grey)),
        ),
      );
    }

    return Column(
      children: notices.take(3).map((notice) {
        return InkWell(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const NoticeBoardScreen()),
            );
          },
          child: _buildActivityItem(
            icon: Icons.campaign_outlined,
            title: notice.title,
            subtitle: notice.content,
            time: notice.timeAgo,
            color: notice.priority == 'HIGH' ? AppTheme.errorRed : AppTheme.primaryNavy,
          ),
        );
      }).toList(),
    );
  }

  Widget _buildActivityItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required String time,
    required Color color,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primaryNavy,
                  ),
                ),
                Text(
                  subtitle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(color: Colors.grey[600], fontSize: 13),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text(
            time,
            style: TextStyle(color: Colors.grey[400], fontSize: 11),
          ),
        ],
      ),
    );
  }
}

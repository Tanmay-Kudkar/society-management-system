import 'package:flutter/foundation.dart';
import '../../auth/services/auth_service.dart';
import '../models/dashboard_models.dart';
import '../models/notification_model.dart';
import '../services/dashboard_service.dart';

class DashboardProvider with ChangeNotifier {
  final AuthService _auth;
  late DashboardService _service;

  List<MaintenanceBill> _bills = [];
  List<Notice> _notices = [];
  List<Tenant> _tenants = [];
  List<Visitor> _visitors = [];
  List<EmergencyContact> _emergencyContacts = [];
  List<NotificationModel> _notifications = [];
  bool _isLoading = false;

  DashboardProvider(this._auth) {
    _service = DashboardService(token: _auth.token);
    if (_auth.isAuthenticated) {
      loadDashboardData();
    }
  }

  List<MaintenanceBill> get bills => _bills;
  List<Notice> get notices => _notices;
  List<Tenant> get tenants => _tenants;
  List<Visitor> get visitors => _visitors;
  List<EmergencyContact> get emergencyContacts => _emergencyContacts;
  List<NotificationModel> get notifications => _notifications;
  bool get isLoading => _isLoading;

  MaintenanceBill? get latestPendingBill {
    final pending = _bills.where((b) => b.status != 'PAID').toList();
    if (pending.isEmpty) return null;
    pending.sort((a, b) => b.dueDate.compareTo(a.dueDate));
    return pending.first;
  }

  Future<void> loadDashboardData() async {
    if (_auth.flatId == null || _auth.societyId == null) return;
    
    _isLoading = true;
    notifyListeners();

    try {
      final results = await Future.wait([
        _service.getMaintenanceBills(_auth.flatId!),
        _service.getNotices(_auth.societyId!),
        _service.getTenants(_auth.flatId!),
        _service.getVisitors(_auth.flatId!),
        _service.getEmergencyContacts(_auth.societyId!),
      ]);
      
      _bills = results[0] as List<MaintenanceBill>;
      _notices = results[1] as List<Notice>;
      _tenants = results[2] as List<Tenant>;
      _visitors = results[3] as List<Visitor>;
      _emergencyContacts = results[4] as List<EmergencyContact>;

      _generateNotifications();
    } catch (e) {
      debugPrint('Error loading dashboard data: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void _generateNotifications() {
    _notifications = [];

    // Add notices as notifications
    for (var notice in _notices) {
      _notifications.add(NotificationModel(
        id: 'notice_${notice.id}',
        title: notice.title,
        message: notice.content,
        timestamp: notice.createdAt,
        type: NotificationType.NOTICE,
        isRead: false,
      ));
    }

    // Add pending bills as notifications
    for (var bill in _bills) {
      if (bill.status != 'PAID') {
        _notifications.add(NotificationModel(
          id: 'bill_${bill.id}',
          title: 'Pending Bill',
          message: 'Maintenance bill for ${bill.billMonth} is pending.',
          timestamp: bill.dueDate,
          type: NotificationType.BILL,
          isRead: false,
        ));
      }
    }

    // Add recent visitors
    for (var visitor in _visitors) {
      _notifications.add(NotificationModel(
        id: 'visitor_${visitor.id}',
        title: 'Visitor: ${visitor.name}',
        message: 'Reason: ${visitor.purpose}. Status: ${visitor.status}',
        timestamp: visitor.checkInTime ?? DateTime.now(),
        type: NotificationType.VISITOR,
        isRead: false,
      ));
    }

    // Sort by timestamp descending
    _notifications.sort((a, b) => b.timestamp.compareTo(a.timestamp));
  }
}

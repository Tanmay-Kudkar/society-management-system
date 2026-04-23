import 'package:flutter/foundation.dart';
import '../../auth/services/auth_service.dart';
import '../models/maintenance_bill_model.dart';
import '../models/payment_model.dart';
import '../services/payment_service.dart';

class PaymentProvider with ChangeNotifier {
  final AuthService _auth;
  late PaymentService _service;
  
  List<MaintenanceBill> _bills = [];
  List<PaymentRecord> _history = [];
  bool _isLoading = false;

  PaymentProvider(this._auth) {
    _service = PaymentService(
      token: _auth.token, 
      userId: _auth.userId,
      flatId: _auth.flatId,
    );
    if (_auth.isAuthenticated) {
      refreshData();
    }
  }

  List<MaintenanceBill> get bills => _bills;
  List<PaymentRecord> get history => _history;
  bool get isLoading => _isLoading;

  double get totalOutstanding {
    return _bills
        .where((b) => b.status != 'PAID')
        .fold(0.0, (sum, b) => sum + b.pendingAmount);
  }

  Future<void> refreshData() async {
    _isLoading = true;
    notifyListeners();
    try {
      await Future.wait([
        _fetchBills(),
        _fetchHistory(),
      ]);
    } catch (e) {
      debugPrint('Error refreshing payment data: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> _fetchBills() async {
    try {
      _bills = await _service.getMaintenanceBills();
    } catch (e) {
      debugPrint('Error fetching bills: $e');
    }
  }

  Future<void> _fetchHistory() async {
    try {
      _history = await _service.getPaymentHistory();
    } catch (e) {
      debugPrint('Error fetching history: $e');
    }
  }

  Future<Map<String, dynamic>> initiatePayment(MaintenanceBill bill) async {
    try {
      return await _service.createRazorpayOrder(bill.pendingAmount, bill.id);
    } catch (e) {
      debugPrint('Error initiating payment: $e');
      rethrow;
    }
  }

  Future<void> completePayment(Map<String, dynamic> verificationData) async {
    try {
      await _service.verifyPayment(verificationData);
      await refreshData();
    } catch (e) {
      debugPrint('Error completing payment: $e');
      rethrow;
    }
  }
}

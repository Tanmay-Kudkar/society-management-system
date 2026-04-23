import 'package:flutter/material.dart';
import '../../auth/services/auth_service.dart';
import '../models/complaint_model.dart';
import '../services/complaint_service.dart';

class ComplaintProvider with ChangeNotifier {
  final AuthService _auth;
  late ComplaintService _service;

  List<Complaint> _complaints = [];
  bool _isLoading = false;
  String? _error;

  ComplaintProvider(this._auth) {
    _service = ComplaintService(
      token: _auth.token,
      userId: _auth.userId,
    );
    if (_auth.isAuthenticated) {
      loadComplaints();
    }
  }

  List<Complaint> get complaints => _complaints;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadComplaints() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _complaints = await _service.getUserComplaints();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createComplaint({
    required String subject,
    required String description,
    required String category,
    required String priority,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final complaintData = {
        'subject': subject,
        'description': description,
        'category': category,
        'priority': priority,
        'societyId': _auth.societyId,
      };
      await _service.createComplaint(complaintData);
      await loadComplaints();
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}

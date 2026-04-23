import 'package:flutter/foundation.dart';
import '../../auth/services/auth_service.dart';
import '../models/user_model.dart';
import '../services/profile_service.dart';

class ProfileProvider with ChangeNotifier {
  final AuthService _auth;
  late ProfileService _service;
  
  ProfileUser? _user;
  bool _isLoading = false;
  bool _hasInitialFetched = false;

  ProfileProvider(this._auth) {
    _service = ProfileService(token: _auth.token, userId: _auth.userId);
    if (_auth.isAuthenticated) {
      refreshProfile();
      _hasInitialFetched = true;
    }
  }

  void updateWithAuth(AuthService auth) {
    _service = ProfileService(token: auth.token, userId: auth.userId);
    if (auth.isAuthenticated && !_hasInitialFetched) {
      refreshProfile();
      _hasInitialFetched = true;
    } else if (!auth.isAuthenticated) {
      _user = null;
      _hasInitialFetched = false;
    }
  }

  ProfileUser? get user => _user;
  bool get isLoading => _isLoading;

  Future<void> refreshProfile() async {
    _isLoading = true;
    notifyListeners();
    try {
      _user = await _service.getUserProfile();
    } catch (e) {
      debugPrint('Error fetching profile: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> updateProfile(Map<String, dynamic> updateData) async {
    try {
      final updatedUser = await _service.updateProfile(updateData);
      _user = updatedUser;
      notifyListeners();
    } catch (e) {
      debugPrint('Error updating profile: $e');
      rethrow;
    }
  }
}

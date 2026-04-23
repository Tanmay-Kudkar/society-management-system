import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/config.dart';

class AuthService extends ChangeNotifier {
  bool _isAuthenticated = false;
  bool get isAuthenticated => _isAuthenticated;

  String? _token;
  String? get token => _token;

  String? _userId;
  String? get userId => _userId;

  String? _societyId;
  String? get societyId => _societyId;

  String? _flatId;
  String? get flatId => _flatId;

  String? _userName;
  String? get userName => _userName;

  String? _role;
  String? get role => _role;

  bool get isMember => _role == 'MEMBER' || _role == 'TENANT';

  Future<bool> login(String email, String password) async {
    try {
      final url = Uri.parse('${Config.baseUrl}/auth/login');
      
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
          'portalType': 'resident',
          'rememberMe': true,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _token = data['token'];
        _userId = data['id'].toString();
        _userName = data['name'];
        _role = data['role'];
        _societyId = data['societyId']?.toString();
        _flatId = data['flatId']?.toString();
        _isAuthenticated = true;

        final prefs = await SharedPreferences.getInstance();
        await prefs.setBool('is_logged_in', true);
        await prefs.setString('jwt_token', _token!);
        await prefs.setString('user_id', _userId!);
        await prefs.setString('user_name', _userName ?? '');
        if (_role != null) await prefs.setString('user_role', _role!);
        if (_societyId != null) await prefs.setString('society_id', _societyId!);
        if (_flatId != null) await prefs.setString('flat_id', _flatId!);

        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('Login error: $e');
      return false;
    }
  }

  Future<void> logout() async {
    _isAuthenticated = false;
    _token = null;
    _userId = null;
    _userName = null;
    _role = null;
    _societyId = null;
    _flatId = null;
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    notifyListeners();
  }

  Future<void> checkAuthStatus() async {
    final prefs = await SharedPreferences.getInstance();
    _isAuthenticated = prefs.getBool('is_logged_in') ?? false;
    if (_isAuthenticated) {
      _token = prefs.getString('jwt_token');
      _userId = prefs.getString('user_id');
      _userName = prefs.getString('user_name');
      _role = prefs.getString('user_role');
      _societyId = prefs.getString('society_id');
      _flatId = prefs.getString('flat_id');
    }
    notifyListeners();
  }
}

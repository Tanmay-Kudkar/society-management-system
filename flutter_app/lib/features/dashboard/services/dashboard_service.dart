import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../../core/config.dart';
import '../models/dashboard_models.dart';

class DashboardService {
  final String? token;

  DashboardService({this.token});

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

  Future<List<MaintenanceBill>> getMaintenanceBills(String flatId) async {
    final response = await http.get(
      Uri.parse('${Config.baseUrl}/maintenance-bills/flat/$flatId'),
      headers: _headers,
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((b) => MaintenanceBill.fromJson(b)).toList();
    } else {
      throw Exception('Failed to load maintenance bills');
    }
  }

  Future<List<Notice>> getNotices(String societyId) async {
    final response = await http.get(
      Uri.parse('${Config.baseUrl}/notices/society/$societyId'),
      headers: _headers,
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((n) => Notice.fromJson(n)).toList();
    } else {
      throw Exception('Failed to load notices');
    }
  }

  Future<List<Tenant>> getTenants(String flatId) async {
    final response = await http.get(
      Uri.parse('${Config.baseUrl}/tenants/flat/$flatId'),
      headers: _headers,
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((t) => Tenant.fromJson(t)).toList();
    } else {
      // Return empty list instead of throwing if endpoint doesn't exist yet
      return [];
    }
  }

  Future<List<Visitor>> getVisitors(String flatId) async {
    final response = await http.get(
      Uri.parse('${Config.baseUrl}/visitors/flat/$flatId'),
      headers: _headers,
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((v) => Visitor.fromJson(v)).toList();
    } else {
      return [];
    }
  }

  Future<List<EmergencyContact>> getEmergencyContacts(String societyId) async {
    final response = await http.get(
      Uri.parse('${Config.baseUrl}/emergency-contacts/society/$societyId'),
      headers: _headers,
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((e) => EmergencyContact.fromJson(e)).toList();
    } else {
      return [];
    }
  }
}

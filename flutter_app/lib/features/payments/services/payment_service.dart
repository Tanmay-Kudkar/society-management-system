import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../../core/config.dart';
import '../models/maintenance_bill_model.dart';
import '../models/payment_model.dart';

class PaymentService {
  final String? token;
  final String? userId;
  final String? flatId;

  PaymentService({this.token, this.userId, this.flatId});

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

  Future<List<MaintenanceBill>> getMaintenanceBills() async {
    if (flatId == null) return [];

    final url = Uri.parse('${Config.baseUrl}/maintenance-bills/flat/$flatId');
    debugPrint('Fetching maintenance bills from: $url');

    final response = await http.get(
      url,
      headers: _headers,
    );

    debugPrint('Get Maintenance Bills Response Code: ${response.statusCode}');
    debugPrint('Get Maintenance Bills Response Body: ${response.body}');

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((b) => MaintenanceBill.fromJson(b)).toList();
    } else {
      throw Exception('Failed to load maintenance bills');
    }
  }

  Future<List<PaymentRecord>> getPaymentHistory() async {
    if (userId == null) return [];

    final url = Uri.parse('${Config.baseUrl}/api/payments/user/$userId');
    debugPrint('Fetching payment history from: $url');

    final response = await http.get(
      url,
      headers: _headers,
    );

    debugPrint('Get Payment History Response Code: ${response.statusCode}');

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((p) => PaymentRecord.fromJson(p)).toList();
    } else {
      throw Exception('Failed to load payment history');
    }
  }

  Future<Map<String, dynamic>> createRazorpayOrder(double amount, int billId) async {
    final url = Uri.parse('${Config.baseUrl}/api/payments/create-order');
    
    final response = await http.post(
      url,
      headers: _headers,
      body: jsonEncode({
        'amount': amount,
        'userId': int.parse(userId!),
        'maintenanceBillId': billId,
        'paymentType': 'MAINTENANCE',
      }),
    );

    if (response.statusCode == 201 || response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to create Razorpay order');
    }
  }

  Future<void> verifyPayment(Map<String, dynamic> verificationData) async {
    final url = Uri.parse('${Config.baseUrl}/api/payments/verify');
    debugPrint('Verifying payment at: $url');
    debugPrint('Verification Data: $verificationData');
    
    final response = await http.post(
      url,
      headers: _headers,
      body: jsonEncode(verificationData),
    );

    debugPrint('Verify Payment Response Code: ${response.statusCode}');
    debugPrint('Verify Payment Response Body: ${response.body}');

    if (response.statusCode != 200) {
      throw Exception('Payment verification failed: ${response.body}');
    }
  }
}

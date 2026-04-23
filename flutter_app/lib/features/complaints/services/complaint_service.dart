import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../../core/config.dart';
import '../models/complaint_model.dart';

class ComplaintService {
  final String? token;
  final String? userId;

  ComplaintService({this.token, this.userId});

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

  Future<List<Complaint>> getUserComplaints() async {
    if (userId == null) return [];

    final url = Uri.parse('${Config.baseUrl}/complaints/user/$userId?userId=$userId');
    debugPrint('Fetching complaints from: $url');

    final response = await http.get(
      url,
      headers: _headers,
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((c) => Complaint.fromJson(c)).toList();
    } else {
      throw Exception('Failed to load complaints: ${response.body}');
    }
  }

  Future<Complaint> createComplaint(Map<String, dynamic> complaintData) async {
    final url = Uri.parse('${Config.baseUrl}/complaints?userId=$userId');
    debugPrint('Creating complaint at: $url');

    final response = await http.post(
      url,
      headers: _headers,
      body: jsonEncode(complaintData),
    );

    if (response.statusCode == 201 || response.statusCode == 200) {
      return Complaint.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to create complaint: ${response.body}');
    }
  }

  Future<Complaint> getComplaintById(String id) async {
    final url = Uri.parse('${Config.baseUrl}/complaints/$id');
    final response = await http.get(url, headers: _headers);

    if (response.statusCode == 200) {
      return Complaint.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to load complaint');
    }
  }
}

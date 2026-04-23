import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../../core/config.dart';
import '../models/user_model.dart';

class ProfileService {
  final String? token;
  final String? userId;

  ProfileService({this.token, this.userId});

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

  Future<ProfileUser> getUserProfile() async {
    if (userId == null) throw Exception('User ID not found');

    final url = Uri.parse('${Config.baseUrl}/users/$userId');
    debugPrint('Fetching profile from: $url');

    final response = await http.get(
      url,
      headers: _headers,
    );

    debugPrint('Get Profile Response Code: ${response.statusCode}');

    if (response.statusCode == 200) {
      return ProfileUser.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to load profile');
    }
  }

  Future<ProfileUser> updateProfile(Map<String, dynamic> updateData) async {
    if (userId == null) throw Exception('User ID not found');

    final url = Uri.parse('${Config.baseUrl}/users/$userId');
    debugPrint('Updating profile at: $url');

    final response = await http.put(
      url,
      headers: _headers,
      body: jsonEncode(updateData),
    );

    debugPrint('Update Profile Response Code: ${response.statusCode}');

    if (response.statusCode == 200) {
      return ProfileUser.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to update profile');
    }
  }
}

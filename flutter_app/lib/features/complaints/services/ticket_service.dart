import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../../core/config.dart';
import '../models/ticket_model.dart';

class TicketService {
  final String? token;
  final String? userId;

  TicketService({this.token, this.userId});

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

  Future<List<Ticket>> getUserTickets() async {
    if (userId == null) return [];

    final url = Uri.parse('${Config.baseUrl}/tickets/raised-by/$userId');
    debugPrint('Fetching tickets from: $url');

    final response = await http.get(
      url,
      headers: _headers,
    );

    debugPrint('Get Tickets Response Code: ${response.statusCode}');
    debugPrint('Get Tickets Response Body: ${response.body}');

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((t) => Ticket.fromJson(t)).toList();
    } else {
      throw Exception('Failed to load tickets');
    }
  }

  Future<List<Comment>> getTicketReplies(String ticketId) async {
    final url = Uri.parse('${Config.baseUrl}/tickets/$ticketId/replies');
    debugPrint('Fetching replies from: $url');

    final response = await http.get(
      url,
      headers: _headers,
    );

    debugPrint('Get Replies Response Code: ${response.statusCode}');
    debugPrint('Get Replies Response Body: ${response.body}');

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((c) => Comment.fromJson(c)).toList();
    } else {
      throw Exception('Failed to load replies');
    }
  }

  Future<Ticket> createTicket(Map<String, dynamic> ticketData) async {
    final url = Uri.parse('${Config.baseUrl}/tickets?userId=$userId');
    debugPrint('Creating ticket at: $url');
    debugPrint('Ticket Data: $ticketData');

    final response = await http.post(
      url,
      headers: _headers,
      body: jsonEncode(ticketData),
    );

    debugPrint('Create Ticket Response Code: ${response.statusCode}');
    debugPrint('Create Ticket Response Body: ${response.body}');

    if (response.statusCode == 201 || response.statusCode == 200) {
      return Ticket.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to create ticket: ${response.body}');
    }
  }

  Future<Ticket> addReply(String ticketId, String message) async {
    final url = Uri.parse('${Config.baseUrl}/tickets/$ticketId/reply?message=$message&userId=$userId');
    debugPrint('Adding reply at: $url');

    final response = await http.patch(
      url,
      headers: _headers,
    );

    debugPrint('Add Reply Response Code: ${response.statusCode}');
    debugPrint('Add Reply Response Body: ${response.body}');

    if (response.statusCode == 200) {
      return Ticket.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to add reply');
    }
  }
  Future<Ticket> reOpenTicket(String ticketId) async {
    final response = await http.patch(
      Uri.parse('${Config.baseUrl}/tickets/$ticketId/status?status=PENDING&userId=$userId'),
      headers: _headers,
    );

    if (response.statusCode == 200) {
      return Ticket.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to re-open ticket');
    }
  }
}

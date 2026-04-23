import 'package:flutter/material.dart';

enum TicketStatus {
  open,
  inProgress,
  resolved,
  closed;

  String get label {
    switch (this) {
      case TicketStatus.open:
        return 'Open';
      case TicketStatus.inProgress:
        return 'In Progress';
      case TicketStatus.resolved:
        return 'Resolved';
      case TicketStatus.closed:
        return 'Closed';
    }
  }

  Color get color {
    switch (this) {
      case TicketStatus.open:
        return Colors.blue;
      case TicketStatus.inProgress:
        return Colors.orange;
      case TicketStatus.resolved:
        return Colors.green;
      case TicketStatus.closed:
        return Colors.grey;
    }
  }

  static TicketStatus fromString(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING':
      case 'OPEN':
        return TicketStatus.open;
      case 'IN_PROGRESS':
        return TicketStatus.inProgress;
      case 'RESOLVED':
      case 'COMPLETED':
        return TicketStatus.resolved;
      case 'CLOSED':
      case 'REJECTED':
        return TicketStatus.closed;
      default:
        return TicketStatus.open;
    }
  }

  String toBackendString() {
    switch (this) {
      case TicketStatus.open:
        return 'PENDING';
      case TicketStatus.inProgress:
        return 'IN_PROGRESS';
      case TicketStatus.resolved:
        return 'RESOLVED';
      case TicketStatus.closed:
        return 'CLOSED';
    }
  }
}

enum TicketPriority {
  low,
  medium,
  high,
  urgent;

  String get label {
    switch (this) {
      case TicketPriority.low:
        return 'Low';
      case TicketPriority.medium:
        return 'Medium';
      case TicketPriority.high:
        return 'High';
      case TicketPriority.urgent:
        return 'Urgent';
    }
  }

  Color get color {
    switch (this) {
      case TicketPriority.low:
        return Colors.green;
      case TicketPriority.medium:
        return Colors.orange;
      case TicketPriority.high:
        return Colors.red;
      case TicketPriority.urgent:
        return Colors.purple;
    }
  }

  static TicketPriority fromString(String priority) {
    switch (priority.toUpperCase()) {
      case 'LOW':
        return TicketPriority.low;
      case 'MEDIUM':
        return TicketPriority.medium;
      case 'HIGH':
        return TicketPriority.high;
      case 'URGENT':
        return TicketPriority.urgent;
      default:
        return TicketPriority.medium;
    }
  }
}

class Comment {
  final String author;
  final String message;
  final DateTime timestamp;
  final bool isAdmin;

  Comment({
    required this.author,
    required this.message,
    required this.timestamp,
    this.isAdmin = false,
  });

  factory Comment.fromJson(Map<String, dynamic> json) {
    return Comment(
      author: json['repliedByName'] ?? 'User',
      message: json['message'] ?? '',
      timestamp: DateTime.parse(json['createdAt']),
      isAdmin: json['repliedByRole'] != 'MEMBER' && json['repliedByRole'] != 'TENANT',
    );
  }
}

class Ticket {
  final String id;
  final String ticketNumber;
  final String category;
  final String title;
  final String description;
  final TicketPriority priority;
  final TicketStatus status;
  final DateTime createdAt;
  final List<Comment> comments;
  final String? photoUrl;

  Ticket({
    required this.id,
    required this.ticketNumber,
    required this.category,
    required this.title,
    required this.description,
    required this.priority,
    required this.status,
    required this.createdAt,
    required this.comments,
    this.photoUrl,
  });

  factory Ticket.fromJson(Map<String, dynamic> json) {
    return Ticket(
      id: json['id'].toString(),
      ticketNumber: json['ticketNumber'] ?? 'TKT-0000',
      category: json['type'] ?? 'General',
      title: json['title'] ?? 'No Title',
      description: json['description'] ?? '',
      priority: TicketPriority.fromString(json['priority'] ?? 'MEDIUM'),
      status: TicketStatus.fromString(json['status'] ?? 'PENDING'),
      createdAt: DateTime.parse(json['createdAt']),
      comments: (json['replies'] as List? ?? [])
          .map((c) => Comment.fromJson(c))
          .toList(),
      photoUrl: null, // Photo handling to be implemented
    );
  }

  Ticket copyWith({
    TicketStatus? status,
    List<Comment>? comments,
  }) {
    return Ticket(
      id: id,
      ticketNumber: ticketNumber,
      category: category,
      title: title,
      description: description,
      priority: priority,
      status: status ?? this.status,
      createdAt: createdAt,
      comments: comments ?? this.comments,
      photoUrl: photoUrl,
    );
  }
}

import 'package:flutter/material.dart';

enum ComplaintStatus {
  pending,
  inProgress,
  resolved,
  closed,
  rejected;

  String get label {
    switch (this) {
      case ComplaintStatus.pending:
        return 'Pending';
      case ComplaintStatus.inProgress:
        return 'In Progress';
      case ComplaintStatus.resolved:
        return 'Resolved';
      case ComplaintStatus.closed:
        return 'Closed';
      case ComplaintStatus.rejected:
        return 'Rejected';
    }
  }

  Color get color {
    switch (this) {
      case ComplaintStatus.pending:
        return Colors.blue;
      case ComplaintStatus.inProgress:
        return Colors.orange;
      case ComplaintStatus.resolved:
        return Colors.green;
      case ComplaintStatus.closed:
        return Colors.grey;
      case ComplaintStatus.rejected:
        return Colors.red;
    }
  }

  static ComplaintStatus fromString(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING':
      case 'OPEN':
        return ComplaintStatus.pending;
      case 'IN_PROGRESS':
        return ComplaintStatus.inProgress;
      case 'RESOLVED':
      case 'COMPLETED':
        return ComplaintStatus.resolved;
      case 'CLOSED':
        return ComplaintStatus.closed;
      case 'REJECTED':
        return ComplaintStatus.rejected;
      default:
        return ComplaintStatus.pending;
    }
  }

  String toBackendString() {
    switch (this) {
      case ComplaintStatus.pending:
        return 'PENDING';
      case ComplaintStatus.inProgress:
        return 'IN_PROGRESS';
      case ComplaintStatus.resolved:
        return 'RESOLVED';
      case ComplaintStatus.closed:
        return 'CLOSED';
      case ComplaintStatus.rejected:
        return 'REJECTED';
    }
  }
}

enum ComplaintPriority {
  low,
  medium,
  high,
  urgent;

  String get label {
    switch (this) {
      case ComplaintPriority.low:
        return 'Low';
      case ComplaintPriority.medium:
        return 'Medium';
      case ComplaintPriority.high:
        return 'High';
      case ComplaintPriority.urgent:
        return 'Urgent';
    }
  }

  Color get color {
    switch (this) {
      case ComplaintPriority.low:
        return Colors.green;
      case ComplaintPriority.medium:
        return Colors.orange;
      case ComplaintPriority.high:
        return Colors.red;
      case ComplaintPriority.urgent:
        return Colors.purple;
    }
  }

  static ComplaintPriority fromString(String priority) {
    switch (priority.toUpperCase()) {
      case 'LOW':
        return ComplaintPriority.low;
      case 'MEDIUM':
        return ComplaintPriority.medium;
      case 'HIGH':
        return ComplaintPriority.high;
      case 'URGENT':
        return ComplaintPriority.urgent;
      default:
        return ComplaintPriority.medium;
    }
  }
}

class Complaint {
  final String id;
  final String complaintNumber;
  final String subject;
  final String description;
  final String category;
  final ComplaintPriority priority;
  final ComplaintStatus status;
  final DateTime createdAt;
  final String? assignedToName;
  final String? resolution;
  final List<String> attachmentUrls;

  Complaint({
    required this.id,
    required this.complaintNumber,
    required this.subject,
    required this.description,
    required this.category,
    required this.priority,
    required this.status,
    required this.createdAt,
    this.assignedToName,
    this.resolution,
    this.attachmentUrls = const [],
  });

  factory Complaint.fromJson(Map<String, dynamic> json) {
    return Complaint(
      id: json['id'].toString(),
      complaintNumber: json['complaintNumber'] ?? '',
      subject: json['subject'] ?? 'No Subject',
      description: json['description'] ?? '',
      category: json['category'] ?? 'General',
      priority: ComplaintPriority.fromString(json['priority'] ?? 'MEDIUM'),
      status: ComplaintStatus.fromString(json['status'] ?? 'PENDING'),
      createdAt: DateTime.parse(json['createdAt']),
      assignedToName: json['assignedToName'],
      resolution: json['resolution'],
      attachmentUrls: List<String>.from(json['attachmentUrls'] ?? []),
    );
  }
}

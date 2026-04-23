import 'package:intl/intl.dart';

class MaintenanceBill {
  final String id;
  final double totalAmount;
  final double paidAmount;
  final double pendingAmount;
  final DateTime dueDate;
  final String status;
  final String billMonth;

  MaintenanceBill({
    required this.id,
    required this.totalAmount,
    required this.paidAmount,
    required this.pendingAmount,
    required this.dueDate,
    required this.status,
    required this.billMonth,
  });

  bool get isOverdue => status != 'PAID' && dueDate.isBefore(DateTime.now());
  bool get isPaid => status == 'PAID';

  factory MaintenanceBill.fromJson(Map<String, dynamic> json) {
    return MaintenanceBill(
      id: json['id'].toString(),
      totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 0.0,
      paidAmount: (json['paidAmount'] as num?)?.toDouble() ?? 0.0,
      pendingAmount: (json['pendingAmount'] as num?)?.toDouble() ?? 0.0,
      dueDate: json['dueDate'] != null ? DateTime.parse(json['dueDate']) : DateTime.now(),
      status: json['status'] ?? 'PENDING',
      billMonth: json['billMonth'] ?? '',
    );
  }
}

class Notice {
  final String id;
  final String title;
  final String content;
  final String priority;
  final DateTime createdAt;

  Notice({
    required this.id,
    required this.title,
    required this.content,
    required this.priority,
    required this.createdAt,
  });

  factory Notice.fromJson(Map<String, dynamic> json) {
    return Notice(
      id: json['id'].toString(),
      title: json['title'] ?? '',
      content: json['content'] ?? '',
      priority: json['priority'] ?? 'NORMAL',
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
    );
  }

  String get timeAgo {
    final diff = DateTime.now().difference(createdAt);
    if (diff.inDays > 0) return '${diff.inDays}d ago';
    if (diff.inHours > 0) return '${diff.inHours}h ago';
    if (diff.inMinutes > 0) return '${diff.inMinutes}m ago';
    return 'Just now';
  }
}

class Tenant {
  final String id;
  final String name;
  final String email;
  final String phone;
  final String status;
  final DateTime? leaseStartDate;
  final DateTime? leaseEndDate;
  final String? flatNumber;

  Tenant({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.status,
    this.leaseStartDate,
    this.leaseEndDate,
    this.flatNumber,
  });

  factory Tenant.fromJson(Map<String, dynamic> json) {
    return Tenant(
      id: json['id'].toString(),
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'] ?? '',
      status: json['status'] ?? 'ACTIVE',
      leaseStartDate: json['leaseStartDate'] != null ? DateTime.parse(json['leaseStartDate']) : null,
      leaseEndDate: json['leaseEndDate'] != null ? DateTime.parse(json['leaseEndDate']) : null,
      flatNumber: json['flatNumber'],
    );
  }
}

class Visitor {
  final String id;
  final String name;
  final String phone;
  final String purpose;
  final String status; // PENDING, APPROVED, REJECTED, CHECKED_IN, CHECKED_OUT
  final DateTime? checkInTime;
  final DateTime? checkOutTime;
  final String? flatNumber;

  Visitor({
    required this.id,
    required this.name,
    required this.phone,
    required this.purpose,
    required this.status,
    this.checkInTime,
    this.checkOutTime,
    this.flatNumber,
  });

  factory Visitor.fromJson(Map<String, dynamic> json) {
    return Visitor(
      id: json['id'].toString(),
      name: json['name'] ?? '',
      phone: json['phone'] ?? '',
      purpose: json['purpose'] ?? '',
      status: json['status'] ?? 'PENDING',
      checkInTime: json['checkInTime'] != null ? DateTime.parse(json['checkInTime']) : null,
      checkOutTime: json['checkOutTime'] != null ? DateTime.parse(json['checkOutTime']) : null,
      flatNumber: json['flatNumber'],
    );
  }
}

class EmergencyContact {
  final String id;
  final String name;
  final String phone;
  final String type; // POLICE, AMBULANCE, FIRE, MAINTENANCE, DOCTOR
  final String? description;

  EmergencyContact({
    required this.id,
    required this.name,
    required this.phone,
    required this.type,
    this.description,
  });

  factory EmergencyContact.fromJson(Map<String, dynamic> json) {
    return EmergencyContact(
      id: json['id'].toString(),
      name: json['name'] ?? '',
      phone: json['phone'] ?? '',
      type: json['contactType'] ?? json['type'] ?? 'OTHER',
      description: json['description'],
    );
  }
}

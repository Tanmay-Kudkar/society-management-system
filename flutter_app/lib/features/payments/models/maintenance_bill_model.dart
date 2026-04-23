class MaintenanceBill {
  final int id;
  final int flatId;
  final String flatNumber;
  final String ownerName;
  final int societyId;
  final String societyName;
  final String billMonth;
  final String? billNumber;
  final double amount;
  final double subtotal;
  final double taxAmount;
  final double interestAmount;
  final double penaltyAmount;
  final double totalAmount;
  final double previousBalance;
  final double advanceBalance;
  final double paidAmount;
  final double pendingAmount;
  final DateTime? dueDate;
  final DateTime? paymentDate;
  final String status;
  final String? paymentMode;
  final String? receiptNumber;
  final String? referenceNumber;
  final DateTime createdAt;
  final DateTime? paidAt;

  MaintenanceBill({
    required this.id,
    required this.flatId,
    required this.flatNumber,
    required this.ownerName,
    required this.societyId,
    required this.societyName,
    required this.billMonth,
    required this.billNumber,
    required this.amount,
    required this.subtotal,
    required this.taxAmount,
    required this.interestAmount,
    required this.penaltyAmount,
    required this.totalAmount,
    required this.previousBalance,
    required this.advanceBalance,
    required this.paidAmount,
    required this.pendingAmount,
    this.dueDate,
    this.paymentDate,
    required this.status,
    this.paymentMode,
    this.receiptNumber,
    this.referenceNumber,
    required this.createdAt,
    this.paidAt,
  });

  factory MaintenanceBill.fromJson(Map<String, dynamic> json) {
    return MaintenanceBill(
      id: json['id'],
      flatId: json['flatId'],
      flatNumber: json['flatNumber'],
      ownerName: json['ownerName'],
      societyId: json['societyId'],
      societyName: json['societyName'],
      billMonth: json['billMonth'],
      billNumber: json['billNumber'],
      amount: (json['amount'] as num).toDouble(),
      subtotal: (json['subtotal'] as num).toDouble(),
      taxAmount: (json['taxAmount'] as num).toDouble(),
      interestAmount: (json['interestAmount'] as num).toDouble(),
      penaltyAmount: (json['penaltyAmount'] as num).toDouble(),
      totalAmount: (json['totalAmount'] as num).toDouble(),
      previousBalance: (json['previousBalance'] as num).toDouble(),
      advanceBalance: (json['advanceBalance'] as num).toDouble(),
      paidAmount: (json['paidAmount'] as num).toDouble(),
      pendingAmount: (json['pendingAmount'] as num).toDouble(),
      dueDate: json['dueDate'] != null ? DateTime.parse(json['dueDate']) : null,
      paymentDate: json['paymentDate'] != null ? DateTime.parse(json['paymentDate']) : null,
      status: json['status'],
      paymentMode: json['paymentMode'],
      receiptNumber: json['receiptNumber'],
      referenceNumber: json['referenceNumber'],
      createdAt: DateTime.parse(json['createdAt']),
      paidAt: json['paidAt'] != null ? DateTime.parse(json['paidAt']) : null,
    );
  }
}

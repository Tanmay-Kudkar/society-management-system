class PaymentRecord {
  final int id;
  final String? razorpayOrderId;
  final String? razorpayPaymentId;
  final double amount;
  final String? currency;
  final String status;
  final String? paymentType;
  final String? paymentMethod;
  final String? description;
  final String? receiptNumber;
  final int? maintenanceBillId;
  final int userId;
  final String? userName;
  final int societyId;
  final String? societyName;
  final DateTime createdAt;
  final DateTime? paidAt;

  PaymentRecord({
    required this.id,
    this.razorpayOrderId,
    this.razorpayPaymentId,
    required this.amount,
    this.currency,
    required this.status,
    this.paymentType,
    this.paymentMethod,
    this.description,
    this.receiptNumber,
    this.maintenanceBillId,
    required this.userId,
    this.userName,
    required this.societyId,
    this.societyName,
    required this.createdAt,
    this.paidAt,
  });

  factory PaymentRecord.fromJson(Map<String, dynamic> json) {
    return PaymentRecord(
      id: json['id'],
      razorpayOrderId: json['razorpayOrderId'],
      razorpayPaymentId: json['razorpayPaymentId'],
      amount: (json['amount'] as num).toDouble(),
      currency: json['currency'],
      status: json['status'],
      paymentType: json['paymentType'],
      paymentMethod: json['paymentMethod'],
      description: json['description'],
      receiptNumber: json['receiptNumber'],
      maintenanceBillId: json['maintenanceBillId'],
      userId: json['userId'],
      userName: json['userName'],
      societyId: json['societyId'],
      societyName: json['societyName'],
      createdAt: DateTime.parse(json['createdAt']),
      paidAt: json['paidAt'] != null ? DateTime.parse(json['paidAt']) : null,
    );
  }
}

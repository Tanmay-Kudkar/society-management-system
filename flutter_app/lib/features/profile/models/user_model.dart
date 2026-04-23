class ProfileUser {
  final int id;
  final String name;
  final String email;
  final String role;
  final String? accountType;
  final String? phone;
  final bool isActive;
  final int? societyId;
  final String? societyName;
  final int? flatId;
  final String? flatNumber;
  final DateTime? currentLoginAt;
  final DateTime? previousLoginAt;

  ProfileUser({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.accountType,
    this.phone,
    required this.isActive,
    this.societyId,
    this.societyName,
    this.flatId,
    this.flatNumber,
    this.currentLoginAt,
    this.previousLoginAt,
  });

  factory ProfileUser.fromJson(Map<String, dynamic> json) {
    return ProfileUser(
      id: json['id'],
      name: json['name'],
      email: json['email'],
      role: json['role'],
      accountType: json['accountType'],
      phone: json['phone'],
      isActive: json['isActive'] ?? true,
      societyId: json['societyId'],
      societyName: json['societyName'],
      flatId: json['flatId'],
      flatNumber: json['flatNumber'],
      currentLoginAt: json['currentLoginAt'] != null ? DateTime.parse(json['currentLoginAt']) : null,
      previousLoginAt: json['previousLoginAt'] != null ? DateTime.parse(json['previousLoginAt']) : null,
    );
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../../../core/theme.dart';
import '../../../core/config.dart';
import '../../auth/services/auth_service.dart';
import '../providers/payment_provider.dart';
import '../models/maintenance_bill_model.dart';
import '../models/payment_model.dart';

class PaymentsScreen extends StatefulWidget {
  const PaymentsScreen({super.key});

  @override
  State<PaymentsScreen> createState() => _PaymentsScreenState();
}

class _PaymentsScreenState extends State<PaymentsScreen> {
  late Razorpay _razorpay;
  int? _currentInternalPaymentId;

  @override
  void initState() {
    super.initState();
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
    
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PaymentProvider>().refreshData();
    });
  }

  @override
  void dispose() {
    _razorpay.clear();
    super.dispose();
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) {
    debugPrint("Payment Success: ${response.paymentId}");
    debugPrint("Order ID: ${response.orderId}");
    debugPrint("Signature: ${response.signature}");
    
    final provider = context.read<PaymentProvider>();
    
    // Show loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    final verificationData = {
      'razorpayOrderId': response.orderId,
      'razorpayPaymentId': response.paymentId,
      'razorpaySignature': response.signature,
      'paymentId': _currentInternalPaymentId,
    };
    
    debugPrint("Sending Verification Data: $verificationData");

    provider.completePayment(verificationData).then((_) {
      debugPrint("Verification Successful");
      if (!mounted) return;
      Navigator.pop(context); // Close loading
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Payment successful!'), backgroundColor: Colors.green),
      );
    }).catchError((error) {
      debugPrint("Verification Error: $error");
      if (!mounted) return;
      Navigator.pop(context); // Close loading
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Verification failed: $error'), backgroundColor: Colors.red),
      );
    });
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    debugPrint("Payment Error Event: ${response.code} - ${response.message}");
    // Only show snackbar if it's not a user-cancel
    if (response.code != 2) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Payment failed: ${response.message}'), backgroundColor: Colors.red),
      );
    }
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    debugPrint("External Wallet Event: ${response.walletName}");
  }

  Future<void> _startPayment(MaintenanceBill bill) async {
    final provider = context.read<PaymentProvider>();
    final auth = context.read<AuthService>();

    // Show loading while creating order
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final orderData = await provider.initiatePayment(bill);
      debugPrint("Order Created: $orderData");
      if (!mounted) return;
      Navigator.pop(context); // Close loading

      _currentInternalPaymentId = orderData['paymentId'];

      final options = {
        'key': Config.razorpayKeyId,
        'amount': (bill.pendingAmount * 100).toInt(), // Razorpay expects paise
        'name': 'SocietyConnect',
        'order_id': orderData['orderId'],
        'description': 'Maintenance Bill for ${bill.billMonth}',
        'retry': {'enabled': true, 'max_count': 1},
        'send_sms_hash': true,
        'prefill': {
          'name': auth.userName ?? 'Resident',
        },
        'notes': {
          'bill_id': bill.id.toString(),
          'flat_id': bill.flatId.toString(),
          'payment_id': _currentInternalPaymentId.toString(),
        }
      };

      if (orderData['customerEmail'] != null && orderData['customerEmail'].toString().isNotEmpty) {
        (options['prefill'] as Map)['email'] = orderData['customerEmail'];
      }
      if (orderData['customerPhone'] != null && orderData['customerPhone'].toString().isNotEmpty) {
        (options['prefill'] as Map)['contact'] = orderData['customerPhone'];
      }

      debugPrint("Opening Razorpay with options: $options");
      _razorpay.open(options);
    } catch (e) {
      debugPrint("Error in _startPayment: $e");
      if (!mounted) return;
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error initiating payment: $e'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PaymentProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Payments & Bills'),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => provider.refreshData(),
          ),
        ],
      ),
      body: provider.isLoading && provider.bills.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () => provider.refreshData(),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildBalanceCard(provider),
                    const SizedBox(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Recent Transactions',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primaryNavy),
                        ),
                        TextButton(onPressed: () {}, child: const Text('View All')),
                      ],
                    ),
                    const SizedBox(height: 12),
                    _buildTransactionList(provider.history),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildBalanceCard(PaymentProvider provider) {
    final currencyFormat = NumberFormat.currency(symbol: '₹ ', decimalDigits: 2);
    final outstanding = provider.totalOutstanding;
    
    MaintenanceBill? nextDueBill;
    try {
      nextDueBill = provider.bills.firstWhere((b) => b.status != 'PAID');
    } catch (_) {}

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppTheme.primaryNavy, Color(0xFF3949AB)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primaryNavy.withOpacity(0.3),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Total Outstanding',
            style: TextStyle(color: Colors.white70, fontSize: 16),
          ),
          const SizedBox(height: 8),
          Text(
            currencyFormat.format(outstanding),
            style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              const Icon(Icons.info_outline, color: Colors.white70, size: 16),
              const SizedBox(width: 8),
              Text(
                nextDueBill != null 
                  ? 'Due by ${DateFormat('dd MMM yyyy').format(nextDueBill.dueDate ?? DateTime.now())}'
                  : 'No pending dues',
                style: const TextStyle(color: Colors.white70, fontSize: 14),
              ),
              const Spacer(),
              if (outstanding > 0)
                ElevatedButton(
                  onPressed: () => _startPayment(nextDueBill!),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: AppTheme.primaryNavy,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: const Text('Pay Dues', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTransactionList(List<PaymentRecord> transactions) {
    if (transactions.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: 20),
          child: Text('No recent transactions found'),
        ),
      );
    }

    final currencyFormat = NumberFormat.currency(symbol: '₹ ', decimalDigits: 0);

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: transactions.length,
      itemBuilder: (context, index) {
        final tx = transactions[index];
        final isSuccess = tx.status == 'SUCCESS' || tx.status == 'CAPTURED' || tx.status == 'COMPLETED';
        
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[200]!),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: (isSuccess ? Colors.green : Colors.orange).withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isSuccess ? Icons.arrow_upward : Icons.pending_outlined, 
                  color: isSuccess ? Colors.green : Colors.orange, 
                  size: 20
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      tx.description ?? 'Maintenance Payment',
                      style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primaryNavy),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      DateFormat('dd MMM yyyy').format(tx.createdAt),
                      style: TextStyle(color: Colors.grey[600], fontSize: 12),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    currencyFormat.format(tx.amount),
                    style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primaryNavy),
                  ),
                  Text(
                    tx.status.toUpperCase(),
                    style: TextStyle(
                      color: isSuccess ? Colors.green : Colors.orange, 
                      fontSize: 10, 
                      fontWeight: FontWeight.bold
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}

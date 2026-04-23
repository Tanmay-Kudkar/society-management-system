import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../../core/theme.dart';
import '../../auth/services/auth_service.dart';
import '../models/ticket_model.dart';
import '../providers/ticket_provider.dart';

class TicketDetailScreen extends StatefulWidget {
  final Ticket ticket;

  const TicketDetailScreen({super.key, required this.ticket});

  @override
  State<TicketDetailScreen> createState() => _TicketDetailScreenState();
}

class _TicketDetailScreenState extends State<TicketDetailScreen> {
  final TextEditingController _commentController = TextEditingController();

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      Provider.of<TicketProvider>(context, listen: false).loadTicketReplies(widget.ticket.id);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<TicketProvider>(
      builder: (context, provider, child) {
        final ticket = provider.tickets.firstWhere((t) => t.id == widget.ticket.id);
        
        return Scaffold(
          appBar: AppBar(
            title: Text('Ticket Details - ${ticket.ticketNumber}'),
            actions: [
              IconButton(
                icon: const Icon(Icons.refresh),
                onPressed: () => provider.loadTicketReplies(ticket.id),
              ),
              if (ticket.status == TicketStatus.closed)
                TextButton(
                  onPressed: () {
                    provider.updateTicketStatus(ticket.id, TicketStatus.open);
                  },
                  child: const Text('RE-OPEN'),
                ),
            ],
          ),
          body: RefreshIndicator(
            onRefresh: () => provider.loadTicketReplies(ticket.id),
            child: Column(
              children: [
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      _buildTicketInfo(ticket),
                      const Divider(height: 32),
                      const Text(
                        'Responses',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primaryNavy),
                      ),
                      const SizedBox(height: 16),
                      if (ticket.comments.isEmpty)
                        const Center(
                          child: Padding(
                            padding: EdgeInsets.all(20.0),
                            child: Text('No responses yet', style: TextStyle(color: Colors.grey)),
                          ),
                        )
                      else
                        ...ticket.comments.map((comment) => _buildCommentBubble(comment)),
                    ],
                  ),
                ),
                if (ticket.status != TicketStatus.closed && !Provider.of<AuthService>(context, listen: false).isMember)
                  _buildCommentInput(provider, ticket),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildTicketInfo(Ticket ticket) {
    return Card(
      elevation: 0,
      color: Colors.grey[50],
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildBadge(ticket.category, AppTheme.primaryNavy),
                _buildBadge(ticket.status.label, ticket.status.color),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              ticket.description,
              style: const TextStyle(fontSize: 16, height: 1.5),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                const Icon(Icons.priority_high, size: 16, color: AppTheme.slateGray),
                const SizedBox(width: 4),
                Text('Priority: ${ticket.priority.label}', style: const TextStyle(color: AppTheme.slateGray)),
                const Spacer(),
                Text(
                  DateFormat('dd MMM yyyy, hh:mm a').format(ticket.createdAt),
                  style: const TextStyle(color: AppTheme.slateGray, fontSize: 12),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBadge(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget _buildCommentBubble(Comment comment) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            backgroundColor: comment.isAdmin ? AppTheme.primaryNavy : AppTheme.secondaryGold,
            child: Icon(
              comment.isAdmin ? Icons.admin_panel_settings : Icons.person,
              color: Colors.white,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      comment.author,
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    Text(
                      DateFormat('hh:mm a').format(comment.timestamp),
                      style: const TextStyle(fontSize: 10, color: AppTheme.slateGray),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: comment.isAdmin ? AppTheme.primaryNavy.withOpacity(0.05) : Colors.grey[100],
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(comment.message),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCommentInput(TicketProvider provider, Ticket ticket) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _commentController,
              decoration: InputDecoration(
                hintText: 'Type your message...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(25),
                  borderSide: BorderSide.none,
                ),
                filled: true,
                fillColor: Colors.grey[100],
                contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              ),
            ),
          ),
          const SizedBox(width: 8),
          CircleAvatar(
            backgroundColor: AppTheme.primaryNavy,
            child: IconButton(
              icon: const Icon(Icons.send, color: Colors.white),
              onPressed: () {
                if (_commentController.text.isNotEmpty) {
                  provider.addComment(
                    ticket.id,
                    _commentController.text,
                  );
                  _commentController.clear();
                }
              },
            ),
          ),
        ],
      ),
    );
  }
}

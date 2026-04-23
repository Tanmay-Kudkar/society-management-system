import 'package:flutter/foundation.dart';
import '../../auth/services/auth_service.dart';
import '../models/ticket_model.dart';
import '../services/ticket_service.dart';

class TicketProvider with ChangeNotifier {
  final AuthService _auth;
  late TicketService _service;
  
  List<Ticket> _tickets = [];
  bool _isLoading = false;

  TicketProvider(this._auth) {
    _service = TicketService(token: _auth.token, userId: _auth.userId);
    if (_auth.isAuthenticated) {
      refreshTickets();
    }
  }

  List<Ticket> get tickets => _tickets;
  bool get isLoading => _isLoading;

  Future<void> refreshTickets() async {
    _isLoading = true;
    notifyListeners();
    try {
      _tickets = await _service.getUserTickets();
    } catch (e) {
      debugPrint('Error fetching tickets: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadTicketReplies(String ticketId) async {
    try {
      final replies = await _service.getTicketReplies(ticketId);
      final index = _tickets.indexWhere((t) => t.id == ticketId);
      if (index != -1) {
        _tickets[index] = _tickets[index].copyWith(comments: replies);
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error loading ticket replies: $e');
    }
  }

  Future<void> addTicket(Map<String, dynamic> ticketData) async {
    try {
      final ticketDataWithSociety = {
        ...ticketData,
        'societyId': int.tryParse(_auth.societyId ?? '1') ?? 1,
      };
      final newTicket = await _service.createTicket(ticketDataWithSociety);
      _tickets.insert(0, newTicket);
      notifyListeners();
    } catch (e) {
      debugPrint('Error adding ticket: $e');
      rethrow;
    }
  }

  Future<void> updateTicketStatus(String ticketId, TicketStatus newStatus) async {
    try {
      if (newStatus == TicketStatus.open) {
        final updatedTicket = await _service.reOpenTicket(ticketId);
        _updateLocalTicket(updatedTicket);
      }
      // Note: Admin status updates would be handled elsewhere or if allowed for member
    } catch (e) {
      debugPrint('Error updating ticket status: $e');
      rethrow;
    }
  }

  Future<void> addComment(String ticketId, String message) async {
    try {
      final updatedTicket = await _service.addReply(ticketId, message);
      _updateLocalTicket(updatedTicket);
    } catch (e) {
      debugPrint('Error adding comment: $e');
      rethrow;
    }
  }

  void _updateLocalTicket(Ticket updatedTicket) {
    final index = _tickets.indexWhere((t) => t.id == updatedTicket.id);
    if (index != -1) {
      _tickets[index] = updatedTicket;
      notifyListeners();
    }
  }
}

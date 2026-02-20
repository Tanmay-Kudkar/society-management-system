package com.society.android.utils

import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object Formatters {
    private val currencyFormat = NumberFormat.getCurrencyInstance(Locale("en", "IN"))
    private val dateFormat = SimpleDateFormat("dd MMM yyyy", Locale.getDefault())
    private val dateTimeFormat = SimpleDateFormat("dd MMM yyyy, hh:mm a", Locale.getDefault())
    private val apiDateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())

    fun formatCurrency(amount: Double?): String =
        amount?.let { currencyFormat.format(it) } ?: "₹0.00"

    fun formatDate(dateStr: String?): String {
        if (dateStr.isNullOrBlank()) return "N/A"
        return try {
            val date = apiDateFormat.parse(dateStr)
            date?.let { dateFormat.format(it) } ?: dateStr
        } catch (e: Exception) {
            dateStr
        }
    }

    fun formatDateTime(dateStr: String?): String {
        if (dateStr.isNullOrBlank()) return "N/A"
        return try {
            val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
            val date = isoFormat.parse(dateStr)
            date?.let { dateTimeFormat.format(it) } ?: dateStr
        } catch (e: Exception) {
            dateStr
        }
    }

    fun formatStatus(status: String?): String =
        status?.replace("_", " ")?.lowercase()
            ?.replaceFirstChar { it.uppercase() } ?: "Unknown"

    fun toApiDate(date: Date): String = apiDateFormat.format(date)
}

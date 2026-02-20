package com.society.android.services

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.society.android.MainActivity
import com.society.android.R
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class SocietyFCMService : FirebaseMessagingService() {

    companion object {
        private const val CHANNEL_NOTICES = "notices"
        private const val CHANNEL_BILLS = "bills"
        private const val CHANNEL_COMPLAINTS = "complaints"
        private const val CHANNEL_GENERAL = "general"
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        // TODO: Send token to backend for push notification targeting
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)

        val title = message.notification?.title ?: message.data["title"] ?: "Society Manager"
        val body = message.notification?.body ?: message.data["body"] ?: ""
        val type = message.data["type"] ?: "general"

        val channelId = when (type) {
            "notice" -> CHANNEL_NOTICES
            "bill", "payment" -> CHANNEL_BILLS
            "complaint", "ticket" -> CHANNEL_COMPLAINTS
            else -> CHANNEL_GENERAL
        }

        createNotificationChannel(channelId, getChannelName(channelId))
        showNotification(title, body, channelId)
    }

    private fun showNotification(title: String, body: String, channelId: String) {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val notification = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .build()

        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(System.currentTimeMillis().toInt(), notification)
    }

    private fun createNotificationChannel(channelId: String, channelName: String) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                channelName,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifications for $channelName"
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun getChannelName(channelId: String): String = when (channelId) {
        CHANNEL_NOTICES -> "Notices"
        CHANNEL_BILLS -> "Bills & Payments"
        CHANNEL_COMPLAINTS -> "Complaints & Tickets"
        else -> "General"
    }
}

# Society Management System - Mobile App

A cross-platform mobile application built with React Native (Expo) for managing residential societies. The app supports Android and iOS platforms and integrates with the existing backend REST APIs.

## 📱 Features

### User Roles
- **Admin** - Full access to manage society, members, and all features
- **Member** - Access to personal dashboard, complaints, payments, and notices
- **Staff (Security/Maintenance)** - Access to visitor management and assigned tasks

### Core Screens
1. **Splash Screen** - Animated app launch screen
2. **Login & OTP Verification** - Secure authentication with email/phone
3. **Role-Based Dashboards**
   - Admin Dashboard - Society overview and management
   - Member Dashboard - Personal information and quick actions
   - Staff Dashboard - Task and visitor management
4. **Profile Management** - View and edit personal information
5. **Notices & Announcements** - View society notices with filters
6. **Complaints/Tickets System** - Create and track complaints
7. **Visitor Entry Management** - Pre-approve and track visitors
8. **Payment History & Dues** - View and pay maintenance bills
9. **Notifications** - Push-ready notification system
10. **Settings** - Theme, notifications, and account settings

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or later)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your phone (for testing)

### Installation

1. Navigate to the mobile-app directory:
```bash
cd mobile-app
```

2. Install dependencies:
```bash
npm install
```

3. Configure the API endpoint:
Edit `src/constants/index.js` and update the `API_CONFIG.BASE_URL` to point to your backend server:
```javascript
export const API_CONFIG = {
  BASE_URL: 'http://your-backend-url:8080/api',
  // ...
};
```

4. Start the development server:
```bash
npm start
# or
expo start
```

5. Scan the QR code with Expo Go app on your phone

### Running on Simulators

**iOS Simulator (macOS only):**
```bash
npm run ios
```

**Android Emulator:**
```bash
npm run android
```

## 📁 Project Structure

```
mobile-app/
├── App.js                      # App entry point
├── app.json                    # Expo configuration
├── babel.config.js             # Babel configuration
├── package.json                # Dependencies
└── src/
    ├── components/
    │   └── common/             # Reusable UI components
    │       ├── Avatar.js
    │       ├── Badge.js
    │       ├── Button.js
    │       ├── Card.js
    │       ├── EmptyState.js
    │       ├── ErrorState.js
    │       ├── Header.js
    │       ├── Input.js
    │       ├── ListItem.js
    │       ├── Loading.js
    │       └── index.js
    ├── constants/
    │   ├── Colors.js           # Color palette & themes
    │   ├── Layout.js           # Layout constants & scaling
    │   └── index.js            # App constants & configs
    ├── context/
    │   ├── AuthContext.js      # Authentication state
    │   ├── NotificationContext.js  # Push notifications
    │   └── ThemeContext.js     # Theme management
    ├── navigation/
    │   └── AppNavigator.js     # Navigation configuration
    ├── screens/
    │   ├── auth/
    │   │   ├── LoginScreen.js
    │   │   └── OTPVerificationScreen.js
    │   ├── complaints/
    │   │   └── ComplaintsScreen.js
    │   ├── dashboard/
    │   │   ├── AdminDashboard.js
    │   │   ├── MemberDashboard.js
    │   │   └── StaffDashboard.js
    │   ├── notices/
    │   │   └── NoticesScreen.js
    │   ├── notifications/
    │   │   └── NotificationsScreen.js
    │   ├── payments/
    │   │   └── PaymentHistoryScreen.js
    │   ├── profile/
    │   │   └── ProfileScreen.js
    │   ├── settings/
    │   │   └── SettingsScreen.js
    │   ├── visitors/
    │   │   └── VisitorsScreen.js
    │   ├── SplashScreen.js
    │   └── index.js
    └── services/
        └── api.js              # API service layer
```

## 🎨 UI/UX Features

- **Light & Dark Mode** - Automatic system theme detection with manual override
- **Responsive Design** - Adapts to different screen sizes
- **Modern UI** - Clean, consistent design language
- **Reusable Components** - Modular component architecture
- **Smooth Animations** - Native animations for better UX

## 🔌 Backend Integration

The app integrates with the backend REST APIs through a centralized API service layer (`src/services/api.js`). Features include:

- **Authentication** - JWT token-based auth with secure storage
- **Token Refresh** - Automatic token refresh on expiry
- **Error Handling** - Centralized error handling with interceptors
- **Loading States** - Proper loading indicators for all async operations
- **Empty States** - Friendly messages when no data is available

### API Endpoints Used

| Module | Endpoints |
|--------|-----------|
| Auth | `/auth/login`, `/auth/send-otp`, `/auth/verify-otp`, `/auth/refresh` |
| Users | `/users/profile`, `/users` |
| Notices | `/notices` |
| Complaints | `/complaints` |
| Visitors | `/visitors`, `/visitors/:id/check-in`, `/visitors/:id/check-out` |
| Payments | `/payments`, `/payments/dues`, `/payments/history` |
| Dashboard | `/dashboard/admin`, `/dashboard/member`, `/dashboard/staff` |

## 🔐 Security

- Secure token storage using Expo SecureStore
- Automatic logout on token expiry
- Protected routes based on authentication status
- Role-based access control

## 📦 Key Dependencies

- **React Navigation** - Navigation library
- **Expo** - Development framework
- **Axios** - HTTP client
- **Expo SecureStore** - Secure storage
- **Expo Notifications** - Push notifications
- **Expo Linear Gradient** - Gradient backgrounds

## 🛠 Development

### Adding a New Screen

1. Create a new screen file in the appropriate folder under `src/screens/`
2. Export it from `src/screens/index.js`
3. Add the screen to the navigation in `src/navigation/AppNavigator.js`

### Customizing Theme

Edit the color palette in `src/constants/Colors.js` to customize the app's appearance.

### Adding New API Endpoints

Add new API functions in `src/services/api.js` following the existing pattern.

## 📝 Notes

- The app uses Expo's managed workflow for easier development
- Push notifications require additional setup for production
- Update the app.json for production builds with proper bundle identifiers

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is part of the Society Management System.

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { View, Text, StyleSheet } from 'react-native';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen';

// Dashboard Screens
import AdminDashboard from '../screens/dashboard/AdminDashboard';
import MemberDashboard from '../screens/dashboard/MemberDashboard';
import StaffDashboard from '../screens/dashboard/StaffDashboard';

// Feature Screens
import NoticesScreen from '../screens/notices/NoticesScreen';
import ComplaintsScreen from '../screens/complaints/ComplaintsScreen';
import CreateComplaintScreen from '../screens/complaints/CreateComplaintScreen';
import VisitorsScreen from '../screens/visitors/VisitorsScreen';
import AddVisitorScreen from '../screens/visitors/AddVisitorScreen';
import PaymentHistoryScreen from '../screens/payments/PaymentHistoryScreen';
import MaintenanceScreen from '../screens/maintenance/MaintenanceScreen';
import VehiclesScreen from '../screens/vehicles/VehiclesScreen';
import DocumentsScreen from '../screens/documents/DocumentsScreen';
import EmergencyContactsScreen from '../screens/emergency/EmergencyContactsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack Navigator
const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
    </Stack.Navigator>
  );
};

// Tab Bar Badge Component
const TabBarBadge = ({ count, theme }) => {
  if (!count || count === 0) return null;
  
  return (
    <View style={[styles.badge, { backgroundColor: theme.error }]}>
      <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
};

// Admin Tab Navigator
const AdminTabNavigator = () => {
  const { theme } = useTheme();
  const { unreadCount } = useNotifications();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.divider,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          switch (route.name) {
            case 'DashboardTab':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'NoticesTab':
              iconName = focused ? 'megaphone' : 'megaphone-outline';
              break;
            case 'ComplaintsTab':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'VisitorsTab':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'ProfileTab':
              iconName = focused ? 'person' : 'person-outline';
              break;
          }
          
          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="DashboardTab" 
        component={AdminDashboard}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="NoticesTab" 
        component={NoticesScreen}
        options={{ tabBarLabel: 'Notices' }}
      />
      <Tab.Screen 
        name="ComplaintsTab" 
        component={ComplaintsScreen}
        options={{ tabBarLabel: 'Complaints' }}
      />
      <Tab.Screen 
        name="VisitorsTab" 
        component={VisitorsScreen}
        options={{ tabBarLabel: 'Visitors' }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// Member Tab Navigator
const MemberTabNavigator = () => {
  const { theme } = useTheme();
  const { unreadCount } = useNotifications();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.divider,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          switch (route.name) {
            case 'DashboardTab':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'NoticesTab':
              iconName = focused ? 'megaphone' : 'megaphone-outline';
              break;
            case 'ComplaintsTab':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'PaymentsTab':
              iconName = focused ? 'card' : 'card-outline';
              break;
            case 'ProfileTab':
              iconName = focused ? 'person' : 'person-outline';
              break;
          }
          
          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="DashboardTab" 
        component={MemberDashboard}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="NoticesTab" 
        component={NoticesScreen}
        options={{ tabBarLabel: 'Notices' }}
      />
      <Tab.Screen 
        name="ComplaintsTab" 
        component={ComplaintsScreen}
        options={{ tabBarLabel: 'Complaints' }}
      />
      <Tab.Screen 
        name="PaymentsTab" 
        component={PaymentHistoryScreen}
        options={{ tabBarLabel: 'Payments' }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// Staff Tab Navigator
const StaffTabNavigator = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.divider,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          switch (route.name) {
            case 'DashboardTab':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'VisitorsTab':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'ComplaintsTab':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'ProfileTab':
              iconName = focused ? 'person' : 'person-outline';
              break;
          }
          
          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="DashboardTab" 
        component={StaffDashboard}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="VisitorsTab" 
        component={VisitorsScreen}
        options={{ tabBarLabel: 'Visitors' }}
      />
      <Tab.Screen 
        name="ComplaintsTab" 
        component={ComplaintsScreen}
        options={{ tabBarLabel: 'Complaints' }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// Main Tab Navigator (selects based on role)
const MainTabNavigator = () => {
  const { isAdmin, isCommitteeLevel, isMember, isStaff, isTenant, isVisitor, isManager } = useAuth();

  // Admin roles (Platform Owner, Org Owner, Society Admin) and Committee level get admin tabs
  if (isAdmin || isCommitteeLevel) {
    return <AdminTabNavigator />;
  }
  
  // Staff (Employee, Manager) get staff tabs
  if (isStaff || isManager) {
    return <StaffTabNavigator />;
  }
  
  // Everyone else (Member, Tenant, Visitor) gets member tabs
  return <MemberTabNavigator />;
};

// Main App Navigator
const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme } = useTheme();

  if (isLoading) {
    return null;
  }

  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          <Stack.Screen name="Notices" component={NoticesScreen} />
          <Stack.Screen name="Complaints" component={ComplaintsScreen} />
          <Stack.Screen name="CreateComplaint" component={CreateComplaintScreen} />
          <Stack.Screen name="Visitors" component={VisitorsScreen} />
          <Stack.Screen name="AddVisitor" component={AddVisitorScreen} />
          <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} />
          <Stack.Screen name="Maintenance" component={MaintenanceScreen} />
          <Stack.Screen name="Vehicles" component={VehiclesScreen} />
          <Stack.Screen name="Documents" component={DocumentsScreen} />
          <Stack.Screen name="EmergencyContacts" component={EmergencyContactsScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default AppNavigator;

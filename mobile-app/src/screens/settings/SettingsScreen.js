import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, THEME_MODES } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Header, Card, ListItem } from '../../components/common';
import { Layout } from '../../constants';

const SettingsScreen = ({ navigation }) => {
  const { theme, themeMode, setThemeMode, isDark, toggleTheme } = useTheme();
  const { logout } = useAuth();

  const themeOptions = [
    { key: THEME_MODES.LIGHT, label: 'Light', icon: 'sunny-outline' },
    { key: THEME_MODES.DARK, label: 'Dark', icon: 'moon-outline' },
    { key: THEME_MODES.SYSTEM, label: 'System', icon: 'phone-portrait-outline' },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      paddingHorizontal: Layout.spacing.lg,
      paddingVertical: Layout.spacing.md,
    },
    section: {
      marginBottom: Layout.spacing.lg,
    },
    sectionTitle: {
      fontSize: Layout.fontSize.sm,
      fontWeight: '600',
      color: theme.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: Layout.spacing.sm,
      marginLeft: Layout.spacing.sm,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: Layout.borderRadius.lg,
      overflow: 'hidden',
    },
    themeOptions: {
      flexDirection: 'row',
      padding: Layout.spacing.sm,
    },
    themeOption: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: Layout.spacing.md,
      borderRadius: Layout.borderRadius.md,
      marginHorizontal: 4,
    },
    themeOptionActive: {
      backgroundColor: theme.primary + '20',
    },
    themeIcon: {
      marginBottom: Layout.spacing.xs,
    },
    themeLabel: {
      fontSize: Layout.fontSize.sm,
      color: theme.textSecondary,
    },
    themeLabelActive: {
      color: theme.primary,
      fontWeight: '600',
    },
    version: {
      textAlign: 'center',
      fontSize: Layout.fontSize.sm,
      color: theme.textTertiary,
      marginTop: Layout.spacing.xl,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="Settings" showBack />
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.card}>
            <View style={styles.themeOptions}>
              {themeOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.themeOption,
                    themeMode === option.key && styles.themeOptionActive,
                  ]}
                  onPress={() => setThemeMode(option.key)}
                >
                  <Ionicons 
                    name={option.icon} 
                    size={24} 
                    color={themeMode === option.key ? theme.primary : theme.textSecondary}
                    style={styles.themeIcon}
                  />
                  <Text style={[
                    styles.themeLabel,
                    themeMode === option.key && styles.themeLabelActive,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            <ListItem
              title="Push Notifications"
              subtitle="Receive push notifications"
              leftIcon="notifications-outline"
              rightElement={<Switch value={true} onValueChange={() => {}} />}
              rightIcon={null}
            />
            <ListItem
              title="Email Notifications"
              subtitle="Receive email updates"
              leftIcon="mail-outline"
              rightElement={<Switch value={true} onValueChange={() => {}} />}
              rightIcon={null}
            />
            <ListItem
              title="SMS Notifications"
              subtitle="Receive SMS alerts"
              leftIcon="chatbox-outline"
              rightElement={<Switch value={false} onValueChange={() => {}} />}
              rightIcon={null}
              showDivider={false}
            />
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <ListItem
              title="Edit Profile"
              leftIcon="person-outline"
              onPress={() => navigation.navigate('Profile')}
            />
            <ListItem
              title="Change Password"
              leftIcon="lock-closed-outline"
              onPress={() => navigation.navigate('ChangePassword')}
            />
            <ListItem
              title="Privacy & Security"
              leftIcon="shield-outline"
              onPress={() => {}}
              showDivider={false}
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.card}>
            <ListItem
              title="Help Center"
              leftIcon="help-circle-outline"
              onPress={() => {}}
            />
            <ListItem
              title="Contact Us"
              leftIcon="mail-outline"
              onPress={() => {}}
            />
            <ListItem
              title="Report a Problem"
              leftIcon="bug-outline"
              onPress={() => {}}
            />
            <ListItem
              title="Terms of Service"
              leftIcon="document-text-outline"
              onPress={() => {}}
            />
            <ListItem
              title="Privacy Policy"
              leftIcon="eye-outline"
              onPress={() => {}}
              showDivider={false}
            />
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <View style={styles.card}>
            <ListItem
              title="Logout"
              leftIcon="log-out-outline"
              onPress={logout}
              danger
              showDivider={false}
            />
          </View>
        </View>

        <Text style={styles.version}>
          Society Management v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;

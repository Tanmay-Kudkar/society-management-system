import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  RefreshControl,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useTheme } from '../../context/ThemeContext';
import { Header, Card, Loading, EmptyState, ErrorState, Badge } from '../../components/common';
import { Layout } from '../../constants';
import { documentAPI } from '../../services/api';

const DocumentsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All', icon: 'documents-outline' },
    { id: 'rules', label: 'Rules', icon: 'book-outline' },
    { id: 'meetings', label: 'Meetings', icon: 'people-outline' },
    { id: 'finance', label: 'Finance', icon: 'wallet-outline' },
    { id: 'forms', label: 'Forms', icon: 'document-text-outline' },
  ];

  const fetchDocuments = async () => {
    try {
      setError(null);
      const response = await documentAPI.getAll();
      setDocuments(response.data);
    } catch (err) {
      setError('Failed to load documents');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDocuments();
  }, []);

  const getFileIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'pdf':
        return { icon: 'document', color: '#EF4444' };
      case 'doc':
      case 'docx':
        return { icon: 'document-text', color: '#3B82F6' };
      case 'xls':
      case 'xlsx':
        return { icon: 'grid', color: '#10B981' };
      case 'ppt':
      case 'pptx':
        return { icon: 'easel', color: '#F59E0B' };
      case 'jpg':
      case 'jpeg':
      case 'png':
        return { icon: 'image', color: '#8B5CF6' };
      default:
        return { icon: 'document-outline', color: theme.textSecondary };
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDownload = async (doc) => {
    try {
      // In a real app, you would use expo-file-system to download
      Alert.alert('Download', `Downloading ${doc.title}...`);
      // const url = await documentAPI.getDownloadUrl(doc.id);
      // await Linking.openURL(url.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to download document');
    }
  };

  const handleShare = async (doc) => {
    try {
      await Share.share({
        message: `Check out this document: ${doc.title}`,
        // url: doc.url, // In real app
      });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredDocuments = selectedCategory === 'all'
    ? documents
    : documents.filter(doc => doc.category === selectedCategory);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      padding: Layout.spacing.lg,
    },
    categoryScroll: {
      paddingHorizontal: Layout.spacing.lg,
      paddingVertical: Layout.spacing.md,
    },
    categoryList: {
      gap: Layout.spacing.sm,
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Layout.spacing.md,
      paddingVertical: Layout.spacing.sm,
      borderRadius: Layout.borderRadius.full,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      marginRight: Layout.spacing.sm,
    },
    categoryChipActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    categoryChipText: {
      fontSize: Layout.fontSize.sm,
      color: theme.textSecondary,
      marginLeft: 6,
    },
    categoryChipTextActive: {
      color: '#FFFFFF',
    },
    documentCard: {
      backgroundColor: theme.card,
      borderRadius: Layout.borderRadius.lg,
      padding: Layout.spacing.md,
      marginBottom: Layout.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
    },
    documentIcon: {
      width: 48,
      height: 48,
      borderRadius: Layout.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Layout.spacing.md,
    },
    documentInfo: {
      flex: 1,
    },
    documentTitle: {
      fontSize: Layout.fontSize.md,
      fontWeight: '600',
      color: theme.text,
    },
    documentMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    documentDate: {
      fontSize: Layout.fontSize.sm,
      color: theme.textSecondary,
    },
    documentSize: {
      fontSize: Layout.fontSize.sm,
      color: theme.textSecondary,
      marginLeft: Layout.spacing.sm,
    },
    documentActions: {
      flexDirection: 'row',
      gap: Layout.spacing.sm,
    },
    actionButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badge: {
      position: 'absolute',
      top: 0,
      right: 0,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Header title="Documents" showBack />
        <Loading fullScreen text="Loading documents..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="Documents" showBack />
      
      {/* Category Filter */}
      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === item.id && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory(item.id)}
          >
            <Ionicons 
              name={item.icon} 
              size={16} 
              color={selectedCategory === item.id ? '#FFFFFF' : theme.textSecondary} 
            />
            <Text style={[
              styles.categoryChipText,
              selectedCategory === item.id && styles.categoryChipTextActive
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />
      
      {/* Documents List */}
      <FlatList
        data={filteredDocuments}
        keyExtractor={(item) => item.id?.toString()}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
        renderItem={({ item }) => {
          const fileInfo = getFileIcon(item.type);
          return (
            <TouchableOpacity 
              style={styles.documentCard}
              onPress={() => handleDownload(item)}
            >
              <View style={[styles.documentIcon, { backgroundColor: fileInfo.color + '15' }]}>
                <Ionicons name={fileInfo.icon} size={24} color={fileInfo.color} />
                {item.isNew && (
                  <View style={styles.badge}>
                    <Badge text="NEW" variant="success" size="small" />
                  </View>
                )}
              </View>
              <View style={styles.documentInfo}>
                <Text style={styles.documentTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <View style={styles.documentMeta}>
                  <Text style={styles.documentDate}>
                    {new Date(item.uploadDate).toLocaleDateString()}
                  </Text>
                  {item.size && (
                    <>
                      <Text style={styles.documentSize}>•</Text>
                      <Text style={styles.documentSize}>
                        {formatFileSize(item.size)}
                      </Text>
                    </>
                  )}
                </View>
              </View>
              <View style={styles.documentActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleShare(item)}
                >
                  <Ionicons name="share-outline" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleDownload(item)}
                >
                  <Ionicons name="download-outline" size={20} color={theme.primary} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="document-outline"
            title="No Documents"
            message="Documents will appear here when available."
          />
        }
      />
    </SafeAreaView>
  );
};

export default DocumentsScreen;

// app/notifications.tsx
// Activity Hub — Forest Green & Sage Theme Overhaul

import React, { useState, useEffect } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, 
  ActivityIndicator, RefreshControl, Dimensions, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, FONTS } from '../constants/theme';
import { api } from '../utils/api';

const { width } = Dimensions.get('window');

export default function ActivityHubScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data?.notifications || []);
    } catch (err) {
      console.log('Error loading notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      loadNotifications();
    } catch (err) {
      Alert.alert('Error', 'Failed to update notifications.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* Custom Header */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 24, 
        paddingVertical: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: 0.5 }}>ACTIVITY HUB</Text>
        <TouchableOpacity onPress={markAllRead}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.primary }}>MARK ALL READ</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        <LinearGradient colors={[`${COLORS.primary}10`, 'transparent']} style={{ padding: 24, paddingTop: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="notifications" size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: '800', letterSpacing: 2 }}>JOURNAL UPDATES</Text>
          </View>
          <Text style={{ color: COLORS.textPrimary, fontSize: 32, fontWeight: '900' }}>Recent Flow</Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginTop: 8, fontWeight: '500' }}>
            Keep track of your latest mastery breakthroughs.
          </Text>
        </LinearGradient>

        <View style={{ paddingHorizontal: 24 }}>
          {loading && !refreshing ? (
            <View style={{ marginTop: 60, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : notifications.length === 0 ? (
            <View style={{ marginTop: 60, alignItems: 'center', padding: 40, backgroundColor: 'white', borderRadius: 32, borderWidth: 1, borderColor: '#eee' }}>
              <View style={{ backgroundColor: COLORS.bg, width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                <Ionicons name="notifications-off-outline" size={40} color={COLORS.textMuted} />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.textPrimary }}>Silence is Golden</Text>
              <Text style={{ fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 12, lineHeight: 22 }}>
                No active updates to report. Keep pursuing your daily flow to trigger new breakthroughs.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12, marginBottom: 40 }}>
              {notifications.map((notif) => (
                <TouchableOpacity 
                  key={notif.id}
                  activeOpacity={0.8}
                  style={{ 
                    backgroundColor: 'white', 
                    borderRadius: 24, 
                    padding: 20, 
                    borderWidth: 1, 
                    borderColor: notif.isRead ? '#f5f5f5' : COLORS.primary,
                    shadowColor: COLORS.primary,
                    shadowOpacity: notif.isRead ? 0 : 0.05,
                    shadowRadius: 10,
                    elevation: notif.isRead ? 0 : 4,
                    flexDirection: 'row',
                    alignItems: 'flex-start'
                  }}
                >
                  <View style={{ 
                    width: 44, height: 44, borderRadius: 16, 
                    backgroundColor: notif.isRead ? COLORS.bg : `${COLORS.primary}15`, 
                    alignItems: 'center', justifyContent: 'center', marginRight: 16 
                  }}>
                    <Ionicons 
                      name={notif.type === 'ACHIEVEMENT' ? 'trophy' : 'sparkles'} 
                      size={20} 
                      color={notif.isRead ? COLORS.textMuted : COLORS.primary} 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={{ fontSize: 15, fontWeight: '900', color: notif.isRead ? COLORS.textSecondary : COLORS.textPrimary }}>{notif.title}</Text>
                      {!notif.isRead && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.action }} />}
                    </View>
                    <Text style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 }}>{notif.body}</Text>
                    <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 8, fontWeight: '700' }}>
                      {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

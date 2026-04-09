// app/(tabs)/gym.tsx
// Gym Owner Management Hub — with P&L Dashboard link, Add Gym/Trainer/Trainee shortcuts

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { api } from '../../utils/api';

export default function GymOwnerDashboard() {
  const { colors } = useTheme();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await api.get('/gym/stats');
      setStats(res.data.data);
    } catch (error) {
      console.error('Failed to fetch gym stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchStats(); };

  const StatCard = ({ title, value, icon, color }: any) => (
    <View style={{ flex: 1, backgroundColor: colors.bgSurface, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: colors.border }}>
      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: `${color}20`, alignItems: 'center', justifyContent: 'center', marginBottom: 15 }}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={{ fontSize: 28, fontWeight: '900', color: colors.textPrimary }}>{value}</Text>
      <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>{title}</Text>
    </View>
  );

  const ActionRow = ({ icon, color, title, subtitle, onPress }: any) => (
    <TouchableOpacity
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgSurface, padding: 18, borderRadius: 20, borderWidth: 1, borderColor: colors.border }}
    >
      <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: `${color}10`, alignItems: 'center', justifyContent: 'center', marginRight: 15 }}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>{title}</Text>
        <Text style={{ fontSize: 12, color: colors.textSecondary }}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 13, fontWeight: '900', color: colors.primary, letterSpacing: 2, marginBottom: 6 }}>GYM MANAGEMENT</Text>
          <Text style={{ fontSize: 28, fontWeight: '900', color: colors.textPrimary }}>
            {stats?.gymName || 'Your Gym'}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 80 }} />
        ) : (
          <>
            {/* P&L Dashboard Hero */}
            <TouchableOpacity onPress={() => router.push('/owner/owner-dashboard' as any)} style={{ marginBottom: 20 }}>
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={{ borderRadius: 28, padding: 22 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 12, marginRight: 12 }}>
                    <Ionicons name="trending-up" size={22} color="white" />
                  </View>
                  <View>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700', letterSpacing: 2 }}>BUSINESS ANALYTICS</Text>
                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '900' }}>Revenue & P&L Dashboard</Text>
                  </View>
                </View>
                <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 18 }}>
                  View profit/loss, expenses, trends, and get AI suggestions to grow your gym.
                </Text>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, alignSelf: 'flex-start', marginTop: 14 }}>
                  <Text style={{ color: 'white', fontWeight: '800' }}>OPEN DASHBOARD →</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Stats Row */}
            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
              <StatCard title="Trainers" value={stats?.trainerCount || 0} icon="fitness" color="#4CAF50" />
              <StatCard title="Members" value={stats?.memberCount || 0} icon="people" color="#2196F3" />
            </View>
            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 28 }}>
              <StatCard title="Active Plans" value={stats?.activePlans || 0} icon="flash" color="#FFC107" />
              <StatCard title="Monthly Est." value="₹0" icon="card" color="#E91E63" />
            </View>

            {/* Add Actions */}
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: 14 }}>Quick Actions</Text>
            <View style={{ gap: 12, marginBottom: 28 }}>
              <ActionRow
                icon="business"
                color={colors.primary}
                title="Add / Update Gym"
                subtitle="Configure gym profile and settings"
                onPress={() => router.push('/owner/gym-setup' as any)}
              />
              <ActionRow
                icon="person-add"
                color="#4CAF50"
                title="Add Trainer"
                subtitle="Invite a trainer to your gym by email"
                onPress={() => router.push('/owner/manage-trainers' as any)}
              />
              <ActionRow
                icon="people"
                color="#2196F3"
                title="Add Member"
                subtitle="Register a new gym member"
                onPress={() => router.push('/owner/add-trainee' as any)}
              />
              <ActionRow
                icon="link"
                color="#9B59B6"
                title="Assign Members to Trainers"
                subtitle="Link gym members to their trainer"
                onPress={() => router.push('/owner/assign-clients' as any)}
              />
            </View>

            {/* Management Actions */}
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: 14 }}>Management</Text>
            <View style={{ gap: 12 }}>
              <ActionRow
                icon="fitness-outline"
                color={colors.primary}
                title="Manage Trainers"
                subtitle="View, remove, or reassign trainers"
                onPress={() => router.push('/owner/manage-trainers' as any)}
              />
              <ActionRow
                icon="swap-horizontal"
                color="#F1C40F"
                title="Client Assignments"
                subtitle="Review and adjust trainer-client links"
                onPress={() => router.push('/owner/assign-clients' as any)}
              />
              <ActionRow
                icon="settings"
                color={colors.textMuted}
                title="Gym Settings"
                subtitle="Update gym info, address, and billing"
                onPress={() => router.push('/owner/gym-setup' as any)}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

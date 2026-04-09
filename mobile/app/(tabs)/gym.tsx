// app/(tabs)/gym.tsx
// Gym Owner Hub — Multi-Gym Support with Selector

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal, FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { api } from '../../utils/api';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setSelectedGymId, setActiveGymDetails } from '../../store/slices/gymSlice';

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ title, value, icon, color }: any) {
  const { colors } = useTheme();
  return (
    <View style={{
      flex: 1, backgroundColor: colors.bgSurface, padding: 18,
      borderRadius: 22, borderWidth: 1, borderColor: colors.border,
    }}>
      <View style={{
        width: 42, height: 42, borderRadius: 13,
        backgroundColor: `${color}20`,
        alignItems: 'center', justifyContent: 'center', marginBottom: 12,
      }}>
        <Ionicons name={icon} size={21} color={color} />
      </View>
      <Text style={{ fontSize: 26, fontWeight: '900', color: colors.textPrimary }}>{value}</Text>
      <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 3 }}>{title}</Text>
    </View>
  );
}

// ─── Action Row ───────────────────────────────────────────────────────────────
function ActionRow({ icon, color, title, subtitle, onPress }: any) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.bgSurface,
        padding: 16, borderRadius: 18,
        borderWidth: 1, borderColor: colors.border,
      }}
    >
      <View style={{
        width: 42, height: 42, borderRadius: 12,
        backgroundColor: `${color}15`,
        alignItems: 'center', justifyContent: 'center', marginRight: 14,
      }}>
        <Ionicons name={icon} size={21} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>{title}</Text>
        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

// ─── Gym Profile Card ─────────────────────────────────────────────────────────
function GymProfileCard({ gym, colors }: { gym: any; colors: any }) {
  const infoRows = [
    gym.address && { icon: 'location-outline',  label: 'Address',     value: [gym.address, gym.city].filter(Boolean).join(', ') },
    gym.phone   && { icon: 'call-outline',       label: 'Phone',       value: gym.phone },
    gym.description && { icon: 'information-circle-outline', label: 'About', value: gym.description },
  ].filter(Boolean) as { icon: any; label: string; value: string }[];

  return (
    <View style={{
      backgroundColor: colors.bgSurface, borderRadius: 24,
      borderWidth: 1, borderColor: colors.border,
      marginBottom: 20, overflow: 'hidden',
    }}>
      <LinearGradient
        colors={[`${colors.primary}22`, `${colors.primary}06`]}
        style={{ padding: 20, paddingBottom: 16 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={{
              width: 52, height: 52, borderRadius: 18,
              backgroundColor: colors.primary,
              alignItems: 'center', justifyContent: 'center',
              marginRight: 14,
            }}>
              <Ionicons name="business" size={26} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: colors.textPrimary }}>{gym.name}</Text>
              {gym.city && (
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                  {gym.city}
                </Text>
              )}
            </View>
          </View>
          <View style={{
            backgroundColor: gym.isActive ? '#22c55e20' : '#ef444420',
            borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
          }}>
            <Text style={{
              fontSize: 11, fontWeight: '700',
              color: gym.isActive ? '#22c55e' : '#ef4444',
            }}>
              {gym.isActive ? 'ACTIVE' : 'INACTIVE'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {infoRows.length > 0 && (
        <View style={{ padding: 16, gap: 12 }}>
          {infoRows.map((row) => (
            <View key={row.label} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Ionicons name={row.icon} size={16} color={colors.primary} style={{ marginRight: 10, marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5 }}>
                  {row.label.toUpperCase()}
                </Text>
                <Text style={{ fontSize: 13, color: colors.textPrimary, marginTop: 1, lineHeight: 18 }}>
                  {row.value}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        onPress={() => router.push({ pathname: '/owner/gym-setup', params: { gymId: gym.id } } as any)}
        style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          borderTopWidth: 1, borderTopColor: colors.border,
          paddingVertical: 14, gap: 8,
        }}
      >
        <Ionicons name="create-outline" size={16} color={colors.primary} />
        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>Edit Gym Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Gym Selection Modal ──────────────────────────────────────────────────────
function GymSelectorModal({ visible, gyms, onSelect, onClose }: any) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '80%' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: colors.textPrimary }}>Switch Gym</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={28} color={colors.textPrimary} /></TouchableOpacity>
          </View>
          
          <FlatList 
            data={gyms}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => onSelect(item)}
                style={{ padding: 18, backgroundColor: colors.bgSurface, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center' }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 15 }}>
                  <Ionicons name="business" size={22} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>{item.name}</Text>
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>{item.city || 'No City'}</Text>
                </View>
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity
            onPress={() => { onClose(); router.push('/owner/gym-setup' as any); }}
            style={{ padding: 18, borderRadius: 20, borderWidth: 1, borderColor: colors.primary, borderStyle: 'dashed', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}
          >
            <Ionicons name="add" size={24} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.primary }}>CREATE NEW GYM</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function GymOwnerDashboard() {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const { selectedGymId, activeGymDetails } = useSelector((state: RootState) => state.gym);

  const [gyms, setGyms]               = useState<any[]>([]);
  const [stats, setStats]           = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectorVisible, setSelectorVisible] = useState(false);

  const fetchGyms = useCallback(async () => {
    try {
      const res = await api.get('/gym');
      const fetchedGyms = res.data.data;
      setGyms(fetchedGyms);

      if (fetchedGyms.length > 0) {
        // If no gym is selected, or current selection is invalid, pick the first one
        const current = fetchedGyms.find((g: any) => g.id === selectedGymId) || fetchedGyms[0];
        dispatch(setActiveGymDetails(current));
        fetchStats(current.id);
      } else {
        setLoading(false);
      }
    } catch (err) {
       console.error('Fetch gyms error:', err);
       setLoading(false);
    }
  }, [selectedGymId, dispatch]);

  const fetchStats = async (gymId: string) => {
    try {
      const res = await api.get(`/gym/${gymId}/stats`);
      setStats(res.data.data);
    } catch (err) {
      console.error('Fetch stats error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchGyms(); }, [selectedGymId]);
  
  const onRefresh = () => { setRefreshing(true); fetchGyms(); };

  const handleSelectGym = (gym: any) => {
    dispatch(setActiveGymDetails(gym));
    setSelectorVisible(false);
    setLoading(true);
    fetchStats(gym.id);
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (gyms.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Ionicons name="business" size={80} color={colors.textMuted} />
          <Text style={{ fontSize: 24, fontWeight: '900', color: colors.textPrimary, marginTop: 24, textAlign: 'center' }}>No Gyms Found</Text>
          <Text style={{ fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginTop: 12, marginBottom: 32 }}>Create your first gym to start managing trainers and members.</Text>
          <TouchableOpacity
            onPress={() => router.push('/owner/gym-setup' as any)}
            style={{ backgroundColor: colors.primary, paddingVertical: 18, paddingHorizontal: 40, borderRadius: 24 }}
          >
            <Text style={{ color: 'white', fontWeight: '900' }}>CREATE GYM PROFILE</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Switcher */}
        <View style={{ marginBottom: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '900', color: colors.primary, letterSpacing: 2, marginBottom: 4 }}>
              GYM MANAGEMENT
            </Text>
            <Text style={{ fontSize: 26, fontWeight: '900', color: colors.textPrimary }}>
              {activeGymDetails?.name}
            </Text>
          </View>
          {gyms.length > 1 && (
            <TouchableOpacity 
              onPress={() => setSelectorVisible(true)}
              style={{ backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 12 }}>SWITCH</Text>
              <Ionicons name="swap-horizontal" size={14} color="white" />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Gym Profile Card ── */}
        {activeGymDetails && <GymProfileCard gym={activeGymDetails} colors={colors} />}

        {/* ── Stats ── */}
        <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textMuted, letterSpacing: 1, marginBottom: 12 }}>
          OVERVIEW
        </Text>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <StatCard title="Trainers"     value={stats?.trainerCount ?? 0} icon="fitness"     color="#4CAF50" />
          <StatCard title="Members"      value={stats?.memberCount  ?? 0} icon="people"      color="#2196F3" />
        </View>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <StatCard title="Active Plans" value={stats?.activePlans  ?? 0} icon="flash"       color="#FFC107" />
          <StatCard title="Revenue Est." value="₹ –"                     icon="card"        color="#E91E63" />
        </View>

        {/* ── P&L Hero ── */}
        <TouchableOpacity 
          onPress={() => router.push({ pathname: '/owner/owner-dashboard', params: { gymId: activeGymDetails?.id } } as any)} 
          style={{ marginBottom: 24 }}
        >
          <LinearGradient
            colors={[colors.primary, (colors as any).primaryDark || colors.primary]}
            style={{ borderRadius: 24, padding: 20 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 11, marginRight: 12 }}>
                <Ionicons name="trending-up" size={20} color="white" />
              </View>
              <View>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '700', letterSpacing: 2 }}>
                  BUSINESS ANALYTICS
                </Text>
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '900' }}>Revenue & P&L Dashboard</Text>
              </View>
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 17 }}>
              View profit/loss, expenses, trends, and get AI suggestions for {activeGymDetails?.name}.
            </Text>
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 10,
              paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start', marginTop: 12,
            }}>
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 12 }}>OPEN DASHBOARD →</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Quick Actions ── */}
        <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textMuted, letterSpacing: 1, marginBottom: 12 }}>
          QUICK ACTIONS
        </Text>
        <View style={{ gap: 10, marginBottom: 24 }}>
          <ActionRow icon="person-add"  color="#4CAF50" title="Add Trainer" onPress={() => router.push({ pathname: '/owner/manage-trainers', params: { gymId: activeGymDetails?.id } } as any)} />
          <ActionRow icon="people"      color="#2196F3" title="Add Member"  onPress={() => router.push({ pathname: '/owner/add-trainee', params: { gymId: activeGymDetails?.id } } as any)} />
          <ActionRow icon="link"        color="#9B59B6" title="Assign Clients" onPress={() => router.push({ pathname: '/owner/assign-clients', params: { gymId: activeGymDetails?.id } } as any)} />
        </View>

        {/* ── Management Selector ── */}
        <TouchableOpacity 
          onPress={() => setSelectorVisible(true)}
          style={{ 
            backgroundColor: colors.bgSurface, padding: 20, borderRadius: 24, 
            borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed',
            alignItems: 'center', justifyContent: 'center', marginBottom: 30
          }}
        >
          <Ionicons name="business" size={24} color={colors.primary} style={{ marginBottom: 4 }} />
          <Text style={{ color: colors.primary, fontWeight: '800' }}>
            {gyms.length > 1 ? 'SWITCH TO ANOTHER GYM' : 'ADD ANOTHER GYM LOCATION'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <GymSelectorModal 
        visible={selectorVisible} 
        gyms={gyms} 
        onSelect={handleSelectGym} 
        onClose={() => setSelectorVisible(false)} 
      />
    </SafeAreaView>
  );
}

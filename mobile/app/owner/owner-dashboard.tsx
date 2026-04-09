// app/owner/owner-dashboard.tsx
// Gym Owner P&L Dashboard — Updated for multi-gym support

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  RefreshControl, Dimensions, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { api } from '../../utils/api';

const { width } = Dimensions.get('window');

export default function OwnerDashboardScreen() {
  const { colors } = useTheme();
  const { gymId } = useLocalSearchParams(); // Path parameter from dashboard

  const [data, setData] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { 
    if (gymId) {
      fetchData(); 
    } else {
      Alert.alert('Error', 'No gym selected');
      router.back();
    }
  }, [gymId]);

  const fetchData = async () => {
    try {
      const res = await api.get(`/gym/${gymId}/revenue`);
      setData(res.data.data);
    } catch (error) {
      console.error('Failed to fetch revenue:', error);
      Alert.alert('Error', 'Failed to load revenue data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSuggestions = async () => {
    setSuggestLoading(true);
    try {
      const res = await api.get(`/gym/${gymId}/ai-suggestions`);
      setSuggestions(res.data.data?.suggestions || '');
    } catch {
      setSuggestions('Unable to generate suggestions right now. Check your gym data and try again.');
    } finally {
      setSuggestLoading(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const StatCard = ({ title, value, icon, color, subtitle }: any) => (
    <View style={{
      flex: 1, backgroundColor: colors.bgSurface, padding: 18, borderRadius: 20,
      borderWidth: 1, borderColor: colors.border,
    }}>
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${color}15`, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={{ fontSize: 22, fontWeight: '900', color: colors.textPrimary }}>{value}</Text>
      <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{title}</Text>
      {subtitle && <Text style={{ fontSize: 10, color: color, fontWeight: '700', marginTop: 4 }}>{subtitle}</Text>}
    </View>
  );

  const BarChart = ({ data: chartData }: { data: { month: string; members: number }[] }) => {
    const maxVal = Math.max(...chartData.map(d => d.members), 1);
    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 80, marginBottom: 8 }}>
        {chartData.map((item, i) => (
          <View key={i} style={{ alignItems: 'center', flex: 1 }}>
            <View style={{
              width: '50%', backgroundColor: `${colors.primary}${i === chartData.length - 1 ? 'FF' : '50'}`,
              borderRadius: 6, height: Math.max((item.members / maxVal) * 70, 4),
            }} />
            <Text style={{ fontSize: 9, color: colors.textMuted, marginTop: 4, fontWeight: '700' }}>{item.month.toUpperCase()}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const profitColor = data?.isProfit ? '#2ECC71' : '#E74C3C';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 15 }}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 13, fontWeight: '900', color: colors.primary, letterSpacing: 2 }}>BUSINESS DASHBOARD</Text>
            <Text style={{ fontSize: 24, fontWeight: '900', color: colors.textPrimary }}>{data?.gymName || 'Your Gym'}</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          {/* P&L Hero Card */}
          <LinearGradient
            colors={data?.isProfit ? [colors.primary, colors.primaryDark] : ['#C0392B', '#922B21']}
            style={{ borderRadius: 28, padding: 24, marginBottom: 20 }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '800', letterSpacing: 2, marginBottom: 4 }}>
              {data?.isProfit ? '📈 PROFIT' : '📉 LOSS'} — MONTHLY ESTIMATE
            </Text>
            <Text style={{ color: 'white', fontSize: 38, fontWeight: '900' }}>
              ₹{Math.abs(data?.profit || 0).toLocaleString()}
            </Text>
            <View style={{ flexDirection: 'row', marginTop: 16, gap: 20 }}>
              <View>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700' }}>REVENUE</Text>
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '800' }}>₹{(data?.estimatedRevenue || 0).toLocaleString()}</Text>
              </View>
              <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />
              <View>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700' }}>EXPENSES</Text>
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '800' }}>₹{(data?.estimatedExpenditure || 0).toLocaleString()}</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Stat Grid */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            <StatCard title="Total Members" value={data?.totalMembers || 0} icon="people" color="#3498DB" />
            <StatCard title="Trainers" value={data?.totalTrainers || 0} icon="fitness" color="#2ECC71" />
          </View>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
            <StatCard title="Active Plans" value={data?.totalActivePlans || 0} icon="flash" color="#F1C40F" />
            <StatCard
              title="Avg Revenue/Member"
              value={`₹2,000`}
              icon="card"
              color="#9B59B6"
              subtitle="per month estimate"
            />
          </View>

          {/* Monthly Trend */}
          {data?.monthlyTrends && data.monthlyTrends.length > 0 && (
            <View style={{ backgroundColor: colors.bgSurface, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: colors.border, marginBottom: 24 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: 16 }}>New Members — 6 Month Trend</Text>
              <BarChart data={data.monthlyTrends} />
            </View>
          )}

          {/* AI Suggestions */}
          <View style={{ backgroundColor: colors.bgSurface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${colors.primary}15`, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name="sparkles" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '900', color: colors.textPrimary }}>AI Business Advisor</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>Personalized insights for your gym</Text>
              </View>
            </View>

            {suggestions ? (
              <Text style={{ color: colors.textSecondary, lineHeight: 22 }}>{suggestions}</Text>
            ) : (
              <TouchableOpacity
                onPress={fetchSuggestions}
                disabled={suggestLoading}
                style={{ backgroundColor: `${colors.primary}10`, padding: 14, borderRadius: 16, alignItems: 'center' }}
              >
                {suggestLoading
                  ? <ActivityIndicator color={colors.primary} />
                  : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="sparkles" size={16} color={colors.primary} />
                      <Text style={{ color: colors.primary, fontWeight: '800' }}>GENERATE AI INSIGHTS</Text>
                    </View>
                  )}
              </TouchableOpacity>
            )}

            {suggestions && (
              <TouchableOpacity
                onPress={fetchSuggestions}
                style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <Ionicons name="refresh" size={14} color={colors.textMuted} />
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>Refresh suggestions</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

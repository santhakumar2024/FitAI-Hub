// app/trainer/personal-dashboard.tsx
// Freelance Trainer Business Dashboard — Revenue, P&L, AI Suggestions

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

export default function TrainerPersonalDashboard() {
  const { colors } = useTheme();
  const [data, setData] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/trainer/revenue');
      setData(res.data.data);
    } catch (error) {
      console.error('Failed to fetch trainer revenue:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSuggestions = async () => {
    setSuggestLoading(true);
    try {
      const res = await api.get('/trainer/ai-suggestions');
      setSuggestions(res.data.data?.suggestions || '');
    } catch {
      setSuggestions('Unable to generate suggestions. Try again later.');
    } finally {
      setSuggestLoading(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const BarChart = ({ data: chartData }: { data: { month: string; clients: number }[] }) => {
    const maxVal = Math.max(...chartData.map(d => d.clients), 1);
    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 80, marginBottom: 8 }}>
        {chartData.map((item, i) => (
          <View key={i} style={{ alignItems: 'center', flex: 1 }}>
            <View style={{
              width: '50%', backgroundColor: `${colors.primary}${i === chartData.length - 1 ? 'FF' : '50'}`,
              borderRadius: 6, height: Math.max((item.clients / maxVal) * 70, 4),
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
            <Text style={{ fontSize: 13, fontWeight: '900', color: colors.primary, letterSpacing: 2 }}>
              {data?.isFreelance ? 'FREELANCE TRAINER' : 'TRAINER'}
            </Text>
            <Text style={{ fontSize: 24, fontWeight: '900', color: colors.textPrimary }}>My Business</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          {/* P&L Hero */}
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

          {/* Stats Row */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
            <View style={{ flex: 1, backgroundColor: colors.bgSurface, padding: 18, borderRadius: 20, borderWidth: 1, borderColor: colors.border }}>
              <Ionicons name="people" size={22} color="#3498DB" style={{ marginBottom: 8 }} />
              <Text style={{ fontSize: 26, fontWeight: '900', color: colors.textPrimary }}>{data?.activeClients || 0}</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>Active Clients</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.bgSurface, padding: 18, borderRadius: 20, borderWidth: 1, borderColor: colors.border }}>
              <Ionicons name="person-add" size={22} color="#2ECC71" style={{ marginBottom: 8 }} />
              <Text style={{ fontSize: 26, fontWeight: '900', color: colors.textPrimary }}>{data?.totalClients || 0}</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>Total Clients</Text>
            </View>
          </View>

          {/* Monthly Trend Chart */}
          {data?.monthlyTrends && (
            <View style={{ backgroundColor: colors.bgSurface, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: colors.border, marginBottom: 24 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: 16 }}>New Clients — 6 Month Trend</Text>
              <BarChart data={data.monthlyTrends} />
            </View>
          )}

          {/* AI Suggestions */}
          <View style={{ backgroundColor: colors.bgSurface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 30 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${colors.primary}15`, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name="sparkles" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '900', color: colors.textPrimary }}>AI Business Advisor</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>Grow your personal training business</Text>
              </View>
            </View>

            {suggestions ? (
              <>
                <Text style={{ color: colors.textSecondary, lineHeight: 22 }}>{suggestions}</Text>
                <TouchableOpacity
                  onPress={fetchSuggestions}
                  style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <Ionicons name="refresh" size={14} color={colors.textMuted} />
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>Refresh suggestions</Text>
                </TouchableOpacity>
              </>
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
                      <Text style={{ color: colors.primary, fontWeight: '800' }}>GET AI INSIGHTS</Text>
                    </View>
                  )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

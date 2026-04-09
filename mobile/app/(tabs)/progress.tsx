// app/(tabs)/progress.tsx
// Performance Hub — Forest Green & Sage Theme Overhaul

import React, { useState, useEffect } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, 
  ActivityIndicator, RefreshControl, Dimensions, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { useTheme } from '../../hooks/useTheme';
import { api } from '../../utils/api';

import { BarChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

// Simple Bar Chart Component for Small Lists
const SimpleBar = ({ label, value, max, color, colors }: any) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '700' }}>{label}</Text>
        <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '900' }}>{Math.round(value)}</Text>
      </View>
      <View style={{ height: 8, backgroundColor: colors.bg, borderRadius: 4, overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${Math.min(100, percentage)}%`, backgroundColor: color, borderRadius: 4 }} />
      </View>
    </View>
  );
};

export default function PerformanceHubScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const { colors, isDark } = useTheme();

  useEffect(() => {
    loadData();
  }, [timeframe]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/progress/summary?timeframe=${timeframe}`);
      setData(res.data.data);
    } catch (err) {
      console.log('Error loading progress', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.textSecondary, fontWeight: '600' }}>Analyzing your growth data...</Text>
      </SafeAreaView>
    );
  }

  const getTimeframeLabel = () => {
    switch(timeframe) {
      case 'daily': return 'TODAY';
      case 'weekly': return 'LAST 7 DAYS';
      case 'monthly': return 'THIS MONTH';
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Custom Header */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 24, 
        paddingVertical: 16,
        backgroundColor: colors.bgSurface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: '900', color: colors.textPrimary, letterSpacing: 0.5 }}>PERFORMANCE HUB</Text>
        <TouchableOpacity onPress={() => router.push('/notifications' as any)}>
          <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <LinearGradient colors={[`${colors.primary}10`, 'transparent']} style={{ padding: 24, paddingTop: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="stats-chart" size={16} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 2 }}>MASTERY ANALYTICS</Text>
          </View>
          <Text style={{ color: colors.textPrimary, fontSize: 32, fontWeight: '900' }}>Your Evolution</Text>
          
          {/* Timeframe Switcher */}
          <View style={{ flexDirection: 'row', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)', borderRadius: 16, padding: 4, marginTop: 24, borderWidth: 1, borderColor: colors.border }}>
            {(['daily', 'weekly', 'monthly'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setTimeframe(t)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: timeframe === t ? colors.primary : 'transparent',
                }}
              >
                <Text style={{ 
                  fontSize: 12, 
                  fontWeight: '800', 
                  color: timeframe === t ? 'white' : colors.textSecondary,
                  textTransform: 'uppercase'
                }}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: 24 }}>
          
          {/* THE MASTER CHART — Evolution Visualization */}
          <View style={{ backgroundColor: colors.bgSurface, borderRadius: 28, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}>
            <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '900', marginBottom: 20, alignSelf: 'flex-start' }}>
              Mastery Evolution ({timeframe === 'monthly' ? 'Yearly' : timeframe.charAt(0).toUpperCase() + timeframe.slice(1)})
            </Text>
            
            {data?.chartData && (
              <BarChart
                data={{
                  labels: data.chartData.labels,
                  datasets: data.chartData.datasets
                }}
                width={width - 80}
                height={220}
                yAxisLabel=""
                yAxisSuffix="%"
                fromZero
                chartConfig={{
                  backgroundColor: colors.bgSurface,
                  backgroundGradientFrom: colors.bgSurface,
                  backgroundGradientTo: colors.bgSurface,
                  decimalPlaces: 0,
                  color: (opacity = 1) => isDark ? `rgba(143, 192, 169, ${opacity})` : `rgba(45, 90, 70, ${opacity})`,
                  labelColor: (opacity = 1) => isDark ? `rgba(232, 240, 234, ${opacity})` : `rgba(100, 100, 100, ${opacity})`,
                  style: { borderRadius: 16 },
                  propsForDots: { r: "6", strokeWidth: "2", stroke: colors.primary },
                  barPercentage: timeframe === 'monthly' ? 0.4 : 0.6,
                }}
                verticalLabelRotation={timeframe === 'monthly' ? 45 : 0}
                style={{ marginVertical: 8, borderRadius: 16, paddingRight: 40 }}
              />
            )}
          </View>

          {/* Main Key Metrics */}
          <View style={{ flexDirection: 'row', gap: 14, marginBottom: 24 }}>
            <View style={{ flex: 1, backgroundColor: colors.bgSurface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}>
              <View style={{ backgroundColor: `${colors.primary}10`, padding: 10, borderRadius: 16, marginBottom: 12 }}>
                <Ionicons name="barbell-outline" size={24} color={colors.primary} />
              </View>
              <Text style={{ fontSize: 24, fontWeight: '900', color: colors.textPrimary }}>{data?.totalWorkouts || 0}</Text>
              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textSecondary, marginTop: 4 }}>30-DAY VOLUME</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.bgSurface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}>
              <View style={{ backgroundColor: `${colors.action}10`, padding: 10, borderRadius: 16, marginBottom: 12 }}>
                <Ionicons name="flame-outline" size={24} color={colors.action} />
              </View>
              <Text style={{ fontSize: 24, fontWeight: '900', color: colors.textPrimary }}>{data?.avgCalories || 0}</Text>
              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textSecondary, marginTop: 4 }}>AVG DAILY KCAL</Text>
            </View>
          </View>

          {/* Calorie Mastery Card */}
          <View style={{ backgroundColor: colors.bgSurface, borderRadius: 28, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: colors.textPrimary, marginBottom: 20 }}>Nourishment Trends</Text>
            <SimpleBar 
              label={`Energy Flow (${getTimeframeLabel()})`} 
              value={timeframe === 'daily' ? data?.today?.intake : data?.avgCalories} 
              max={timeframe === 'daily' ? data?.today?.target : 2500} 
              color={colors.primary} 
              colors={colors}
            />
            <SimpleBar label="Protein Strategy Adherence" value={data?.streak || 0} max={30} color="#3498DB" colors={colors} />
            
            <View style={{ backgroundColor: colors.bg, borderRadius: 16, padding: 16, marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="bulb-outline" size={20} color={colors.primary} style={{ marginRight: 12 }} />
              <Text style={{ flex: 1, color: colors.textSecondary, fontSize: 13, fontWeight: '500', lineHeight: 20 }}>
                {timeframe === 'daily' 
                  ? "Focus on hitting your protein target today. Your muscles will thank you for the flow!"
                  : "Consistency is your greatest strength. Small daily actions lead to massive monthly evolution."}
              </Text>
            </View>
          </View>

          {/* Activity Strength */}
          <View style={{ backgroundColor: colors.bgSurface, borderRadius: 28, padding: 24, marginBottom: 32, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: colors.textPrimary, marginBottom: 20 }}>Achievement Milestones</Text>
            
            <View style={{ gap: 20 }}>
              {[
                { title: 'The Architect', desc: 'Generate your first AI Plan', done: true, color: colors.primary },
                { title: 'Flow Master', desc: '10 day log streak', done: (data?.streak ?? 0) >= 10, color: colors.action },
                { title: 'Zen Warrior', desc: 'Complete 5 yoga sessions', done: false, color: '#9B59B6' },
              ].map((item, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: 24, 
                    backgroundColor: item.done ? item.color : (isDark ? colors.bg : '#f0f0f0'), 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    marginRight: 16 
                  }}>
                    <Ionicons name={item.done ? "trophy" : "lock-closed-outline"} size={20} color={item.done ? "white" : colors.textMuted} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: item.done ? colors.textPrimary : colors.textMuted }}>{item.title}</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{item.desc}</Text>
                  </View>
                  {item.done && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity 
            onPress={() => Alert.alert('Exporting...', 'Generating your performance PDF flow.')}
            style={{ 
              backgroundColor: colors.bgSurface, 
              padding: 20, 
              borderRadius: 20, 
              alignItems: 'center', 
              borderWidth: 1, 
              borderColor: colors.primary,
              marginBottom: 40
            }}
          >
            <Text style={{ color: colors.primary, fontWeight: '900', letterSpacing: 1 }}>EXPORT MASTERY REPORT 🖨️</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

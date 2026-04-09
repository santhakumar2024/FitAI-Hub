// app/yoga-session.tsx
// Active Yoga Flow Tracker — Serene Zen Theme

import React, { useState } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, 
  StyleSheet, Alert, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { createDailyLogThunk } from '../store/slices/logSlice';
import { useTheme } from '../hooks/useTheme';

export default function YogaSessionScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const params = useLocalSearchParams();
  const { currentPlan } = useSelector((s: RootState) => s.plan);
  const { isLoading } = useSelector((s: RootState) => s.log);
  const { colors, isDark } = useTheme();

  const day = (params.day as string) || 'day1';
  const planData = currentPlan?.plan as any;
  const yogaPoses = planData?.dailyPlan?.[day]?.yoga || [];

  const [completedPoses, setCompletedPoses] = useState<Record<number, boolean>>({});

  const togglePose = (idx: number) => {
    setCompletedPoses(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleFinish = async () => {
    const completedCount = Object.values(completedPoses).filter(Boolean).length;
    
    if (completedCount === 0) {
      Alert.alert('Stay Mindful', 'You haven\'t completed any poses yet. Yoga is a journey of consistency.');
      return;
    }

    const yogaLog = yogaPoses
      .filter((_: any, idx: number) => completedPoses[idx])
      .map((p: any) => ({
        pose: p.pose,
        duration: parseInt(p.duration) || 5, // Default 5 mins if not numeric
        isCompleted: true
      }));

    const result = await dispatch(createDailyLogThunk({
      date: new Date().toISOString().split('T')[0],
      yoga: yogaLog,
      notes: `Mindful Yoga Flow completed (${completedCount} poses) from AI Plan (${day}).`
    }));

    if (createDailyLogThunk.fulfilled.match(result)) {
      Alert.alert('Flow Complete', 'Your mindfulness has been architected into your daily progress.', [
        { text: 'Done', onPress: () => router.back() }
      ]);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
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
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 13, fontWeight: '900', color: colors.textPrimary, letterSpacing: 2 }}>ZEN FLOW</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <LinearGradient colors={[`${colors.accent}15`, 'transparent']} style={{ padding: 32, paddingTop: 20 }}>
          <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 8 }}>BALANCE & FLEXIBILITY</Text>
          <Text style={{ fontSize: 28, fontWeight: '900', color: colors.textPrimary }}>Mindful Movement</Text>
        </LinearGradient>

        <View style={{ paddingHorizontal: 24, gap: 16 }}>
          {yogaPoses.map((p: any, idx: number) => (
            <TouchableOpacity 
              key={idx} 
              activeOpacity={0.8}
              onPress={() => togglePose(idx)}
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                backgroundColor: colors.bgSurface, 
                padding: 24, 
                borderRadius: 32, 
                borderWidth: 1, 
                borderColor: completedPoses[idx] ? colors.accent : colors.border,
                opacity: completedPoses[idx] ? 0.7 : 1
              }}
            >
              <View style={{ 
                width: 28, 
                height: 28, 
                borderRadius: 14, 
                borderWidth: 2, 
                borderColor: completedPoses[idx] ? colors.accent : (isDark ? colors.textMuted : '#ddd'), 
                marginRight: 16, 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: completedPoses[idx] ? colors.accent : 'transparent'
              }}>
                {completedPoses[idx] && <Ionicons name="checkmark" size={16} color="white" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ 
                  fontSize: 18, 
                  fontWeight: '800', 
                  color: completedPoses[idx] ? colors.textMuted : colors.textPrimary, 
                  marginBottom: 4,
                  opacity: completedPoses[idx] ? 0.6 : 1
                }}>{p.pose}</Text>
                <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '700' }}>⏲️ {p.duration}</Text>
                {p.benefits && <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 8, lineHeight: 20 }}>{p.benefits}</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {yogaPoses.length === 0 && (
          <View style={{ alignItems: 'center', padding: 100 }}>
            <Ionicons name="leaf-outline" size={48} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted, marginTop: 16, fontWeight: '600' }}>No yoga poses found for this flow.</Text>
          </View>
        )}
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, backgroundColor: colors.bgSurface }}>
        <TouchableOpacity style={{ height: 60, borderRadius: 30, overflow: 'hidden' }} onPress={handleFinish} disabled={isLoading}>
          <LinearGradient colors={[colors.accent, colors.primary]} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            {isLoading ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontSize: 15, fontWeight: '900', letterSpacing: 1 }}>COMPLETE FLOW</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

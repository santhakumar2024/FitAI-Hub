// app/(tabs)/plan.tsx
// AI Plan Screen — Actionable with Logging & Sessions

import React, { useState, useEffect } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, RefreshControl, Dimensions, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchTodayPlan, generatePlanThunk } from '../../store/slices/planSlice';
import { createDailyLogThunk } from '../../store/slices/logSlice';
import { useTheme } from '../../hooks/useTheme';

const { width } = Dimensions.get('window');
type Tab = 'diet' | 'workout' | 'yoga';

export default function AIPlanScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { profile } = useSelector((s: RootState) => s.user);
  const { currentPlan, isGenerating } = useSelector((s: RootState) => s.plan);
  const { isLoading: isLogging } = useSelector((s: RootState) => s.log);
  const { colors, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<Tab>('diet');
  const [showForm, setShowForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState('day1');
  const [refreshing, setRefreshing] = useState(false);

  const [formData, setFormData] = useState({
    age: String(profile?.age ?? ''),
    gender: profile?.gender ?? 'male',
    height: String(profile?.height ?? ''),
    weight: String(profile?.weight ?? ''),
    activityLevel: profile?.activityLevel ?? 'moderately_active',
    medicalConditions: (profile?.medicalConditions as string[]) ?? [],
    goals: (profile?.goals as string[]) ?? [],
    preferences: (profile?.preferences as string[]) ?? [],
    durationDays: 7,
  });

  useEffect(() => {
    dispatch(fetchTodayPlan());
  }, []);

  useEffect(() => {
    if (!currentPlan && !isGenerating) setShowForm(true);
    else {
      setShowForm(false);
      // Auto-calculate the current day of the plan
      if (currentPlan?.generatedAt) {
        const start = new Date(currentPlan.generatedAt);
        start.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const diffTime = today.getTime() - start.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        // Cycle if duration is exceeded
        const dayNumber = (diffDays % (currentPlan.durationDays || 7)) + 1;
        if (dayNumber >= 1) {
          setSelectedDay(`day${dayNumber}`);
        }
      }
    }
  }, [currentPlan, isGenerating]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchTodayPlan());
    setRefreshing(false);
  }, [dispatch]);

  const handleLogMeal = async (label: string, mealData: any) => {
    if (!mealData) return;
    
    const result = await dispatch(createDailyLogThunk({
      date: new Date().toISOString().split('T')[0],
      diet: {
        [label.toLowerCase()]: mealData.name,
        totalCalories: mealData.cal,
        totalProtein: mealData.prot
      },
      notes: `Logged AI Recommended ${label}.`
    }));

    if (createDailyLogThunk.fulfilled.match(result)) {
      Alert.alert('Meal Logged', `${label} has been architected into your daily progress.`);
    }
  };

  const navigateToSession = (type: 'workout' | 'yoga') => {
    router.push({
      pathname: type === 'workout' ? '/workout-session' : '/yoga-session',
      params: { day: selectedDay }
    } as any);
  };

  const plan = currentPlan?.plan as any;
  const dayPlan = plan?.dailyPlan?.[selectedDay];
  const durationDays = plan?.dailyPlan ? Object.keys(plan.dailyPlan).length : 7;

  const getDayLabel = (dayKey: string) => {
    const dayIndex = parseInt(dayKey.replace('day', ''), 10) - 1;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex % 7] || 'Mastery Day';
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: colors.bgSurface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={colors.textPrimary} /></TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: '900', color: colors.textPrimary }}>AI ARCHITECT</Text>
        <TouchableOpacity onPress={() => router.push('/notifications' as any)}><Ionicons name="notifications-outline" size={24} color={colors.textPrimary} /></TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        <LinearGradient colors={[`${colors.primary}10`, 'transparent']} style={{ padding: 24 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 32, fontWeight: '900' }}>{showForm ? 'Goal Setting' : 'Strategic Daily Flow'}</Text>
          {!showForm && <Text style={{ color: colors.textSecondary, marginTop: 8 }}>{durationDays}-Day Strategic Progression Active.</Text>}
        </LinearGradient>

        <View style={{ paddingHorizontal: 24 }}>
          {currentPlan && (
            <TouchableOpacity onPress={() => setShowForm(!showForm)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgSurface, padding: 14, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: colors.border }}>
              <Ionicons name={showForm ? "eye-outline" : "refresh-outline"} size={18} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: '800', marginLeft: 10 }}>{showForm ? 'VIEW ACTIVE PLAN' : 'REGENERATE FLOW'}</Text>
            </TouchableOpacity>
          )}

          {!showForm && currentPlan && (
            <View>
              {/* Day Selector */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
                {Array.from({ length: durationDays }, (_, i) => `day${i + 1}`).map((day) => (
                  <TouchableOpacity 
                    key={day} 
                    onPress={() => setSelectedDay(day)} 
                    style={{ 
                      marginRight: 10, 
                      paddingHorizontal: 20, 
                      paddingVertical: 12, 
                      borderRadius: 30, 
                      backgroundColor: selectedDay === day ? colors.primary : colors.bgSurface, 
                      borderWidth: 1, 
                      borderColor: selectedDay === day ? colors.primary : colors.border 
                    }}
                  >
                    <Text style={{ 
                      color: selectedDay === day ? 'white' : colors.textPrimary, 
                      fontWeight: '800',
                      fontSize: 13
                    }}>
                      {getDayLabel(day)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Tabs */}
              <View style={{ flexDirection: 'row', backgroundColor: isDark ? colors.bgSurface : '#f0f0f0', borderRadius: 24, padding: 4, marginBottom: 24 }}>
                {(['diet', 'workout', 'yoga'] as Tab[]).map((tab) => (
                  <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={{ flex: 1, paddingVertical: 14, borderRadius: 20, alignItems: 'center', backgroundColor: activeTab === tab ? (isDark ? colors.bg : 'white') : 'transparent' }}><Text style={{ color: activeTab === tab ? colors.primary : colors.textMuted, fontWeight: '900', fontSize: 12, textTransform: 'uppercase' }}>{tab}</Text></TouchableOpacity>
                ))}
              </View>

              {/* Action Views */}
              {activeTab === 'diet' && (
                <View style={{ gap: 16 }}>
                  {[
                    { label: 'Breakfast', key: 'm1_bk' },
                    { label: 'Lunch', key: 'm2_ln' },
                    { label: 'Dinner', key: 'm3_dn' },
                    { label: 'Snack', key: 'snack' }
                  ].map((meal) => {
                    const m = dayPlan?.diet?.[meal.key];
                    return (
                      <View key={meal.key} style={{ backgroundColor: colors.bgSurface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.border }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                          <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 13 }}>{meal.label.toUpperCase()}</Text>
                          <Text style={{ color: colors.textSecondary, fontWeight: '800', fontSize: 11 }}>{m?.cal || 0} kcal</Text>
                        </View>
                        <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 16 }}>{m?.name || '—'}</Text>
                        <TouchableOpacity 
                          onPress={() => handleLogMeal(meal.label, m)}
                          style={{ backgroundColor: `${colors.primary}10`, padding: 12, borderRadius: 14, alignItems: 'center' }}
                        >
                          <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 13 }}>LOG THIS MEAL</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}

              {(activeTab === 'workout' || activeTab === 'yoga') && (
                <View>
                  <TouchableOpacity 
                    onPress={() => navigateToSession(activeTab as any)}
                    style={{ marginBottom: 24 }}
                  >
                    <LinearGradient colors={[colors.primary, colors.primaryDark]} style={{ padding: 24, borderRadius: 24, alignItems: 'center' }}>
                      <Text style={{ color: 'white', fontWeight: '900', fontSize: 16, letterSpacing: 1 }}>START {activeTab.toUpperCase()} SESSION</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 }}>Check off exercises as you master them.</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={{ gap: 12 }}>
                    {activeTab === 'workout' ? (
                      dayPlan?.workout?.map((ex: any, idx: number) => (
                        <View key={idx} style={{ backgroundColor: colors.bgSurface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{ backgroundColor: isDark ? colors.bg : '#f9f9f9', width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}><Ionicons name="fitness-outline" size={20} color={colors.primary} /></View>
                          <View style={{ flex: 1 }}><Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 15 }}>{ex.name}</Text><Text style={{ color: colors.textSecondary, fontSize: 12 }}>{ex.sets} × {ex.reps} • {ex.tip}</Text></View>
                        </View>
                      ))
                    ) : (
                      dayPlan?.yoga?.map((pose: any, idx: number) => (
                        <View key={idx} style={{ backgroundColor: colors.bgSurface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.border }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}><Text style={{ color: colors.primary, fontWeight: '900' }}>{pose.pose}</Text><Text style={{ color: colors.textSecondary, fontSize: 12 }}>{pose.duration}</Text></View>
                          <Text style={{ color: colors.textSecondary, fontSize: 13 }} numberOfLines={2}>{pose.benefits}</Text>
                        </View>
                      ))
                    )}
                  </View>
                </View>
              )}
            </View>
          )}

          {showForm && (
             <View>
             <View style={{ backgroundColor: colors.bgSurface, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: colors.border, marginBottom: 24 }}>
               <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '900', marginBottom: 20 }}>Physical Foundation</Text>
               <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                 {['age', 'height', 'weight'].map((field) => (
                   <View key={field} style={{ flex: 1 }}>
                     <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '800', marginBottom: 8 }}>{field.toUpperCase()}</Text>
                     <TextInput 
                        value={(formData as any)[field]} 
                        onChangeText={(v) => setFormData({ ...formData, [field]: v })} 
                        keyboardType="decimal-pad" 
                        placeholderTextColor={colors.textMuted}
                        style={{ backgroundColor: colors.bg, borderRadius: 12, padding: 14, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' }} 
                     />
                   </View>
                 ))}
               </View>
               <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '800', marginBottom: 12 }}>TIMELINE FOCUS</Text>
               <View style={{ flexDirection: 'row', gap: 10 }}>
                 {[7, 14, 30].map((d) => (
                   <TouchableOpacity key={d} onPress={() => setFormData({ ...formData, durationDays: d })} style={{ flex: 1, padding: 12, borderRadius: 14, alignItems: 'center', backgroundColor: formData.durationDays === d ? colors.primary : colors.bgSurface, borderWidth: 1, borderColor: formData.durationDays === d ? colors.primary : colors.border }}>
                     <Text style={{ color: formData.durationDays === d ? 'white' : colors.textPrimary, fontWeight: '800' }}>{d} Days</Text>
                   </TouchableOpacity>
                 ))}
               </View>
             </View>
             <TouchableOpacity 
               onPress={() => dispatch(generatePlanThunk({
                 ...formData,
                 age: parseInt(formData.age, 10),
                 height: parseFloat(formData.height),
                 weight: parseFloat(formData.weight),
               }))} 
               disabled={isGenerating}
             >
               <LinearGradient colors={[colors.primary, colors.primaryDark]} style={{ borderRadius: 20, padding: 20, alignItems: 'center' }}>
                 {isGenerating ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: '900' }}>ARCHITECT MY FLOW</Text>}
               </LinearGradient>
             </TouchableOpacity>
           </View>
          )}
          <View style={{ height: 60 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

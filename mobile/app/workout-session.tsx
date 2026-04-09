// app/workout-session.tsx
// Active Workout Session Tracker — Premium Zen Theme

import React, { useState } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, 
  StyleSheet, Dimensions, Alert, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { createDailyLogThunk } from '../store/slices/logSlice';
import { useTheme } from '../hooks/useTheme';

const { width } = Dimensions.get('window');

export default function WorkoutSessionScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const params = useLocalSearchParams();
  const { currentPlan } = useSelector((s: RootState) => s.plan);
  const { isLoading } = useSelector((s: RootState) => s.log);
  const { colors, isDark } = useTheme();

  // Extract today's workout from the plan
  const day = (params.day as string) || 'day1';
  const planData = currentPlan?.plan as any;
  const exercises = planData?.dailyPlan?.[day]?.workout || [];
  const calBurn = planData?.dailyPlan?.[day]?.calBurn || 0;

  const [completedExercises, setCompletedExercises] = useState<Record<number, boolean>>({});

  const toggleExercise = (idx: number) => {
    setCompletedExercises(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleFinish = async () => {
    const completedCount = Object.values(completedExercises).filter(Boolean).length;
    
    if (completedCount === 0) {
      Alert.alert('No Progress?', 'You haven\'t marked any exercises as complete yet. Keep pushing!');
      return;
    }

    // Prepare log data
    const workoutLog = exercises
      .filter((_: any, idx: number) => completedExercises[idx])
      .map((ex: any) => ({
        exercise: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        caloriesBurned: Math.round(calBurn / exercises.length), // Distribute calories
        isCompleted: true
      }));

    const result = await dispatch(createDailyLogThunk({
      date: new Date().toISOString().split('T')[0],
      workout: workoutLog,
      notes: `Completed ${completedCount} exercises from AI Plan (${day}).`
    }));

    if (createDailyLogThunk.fulfilled.match(result)) {
      Alert.alert('Session Complete!', 'Great work! Your progress has been architected into your daily log.', [
        { text: 'View Progress', onPress: () => router.replace('/progress') },
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
        <Text style={{ fontSize: 15, fontWeight: '900', color: colors.textPrimary, letterSpacing: 1 }}>ACTIVE SESSION</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <LinearGradient colors={[`${colors.primary}15`, 'transparent']} style={{ padding: 32, paddingTop: 20 }}>
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 2, marginBottom: 8 }}>FOCUS: {day.toUpperCase()}</Text>
          <Text style={{ fontSize: 28, fontWeight: '900', color: colors.textPrimary }}>Master Your Form</Text>
          <View style={{ height: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#eee', borderRadius: 2, marginTop: 24, overflow: 'hidden' }}>
            <View style={{ height: '100%', backgroundColor: colors.primary, width: `${(Object.values(completedExercises).filter(Boolean).length / Math.max(1, exercises.length)) * 100}%` }} />
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: 24, gap: 16 }}>
          {exercises.map((ex: any, idx: number) => (
            <TouchableOpacity 
              key={idx} 
              activeOpacity={0.8}
              onPress={() => toggleExercise(idx)}
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                backgroundColor: colors.bgSurface, 
                padding: 20, 
                borderRadius: 24, 
                borderWidth: 1, 
                borderColor: completedExercises[idx] ? colors.primary : colors.border,
                shadowColor: '#000',
                shadowOpacity: 0.02,
                shadowRadius: 10,
                elevation: 2,
                opacity: completedExercises[idx] ? 0.8 : 1
              }}
            >
              <View style={{ 
                width: 28, 
                height: 28, 
                borderRadius: 14, 
                borderWidth: 2, 
                borderColor: completedExercises[idx] ? colors.primary : (isDark ? colors.textMuted : '#ddd'), 
                marginRight: 16, 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: completedExercises[idx] ? colors.primary : 'transparent'
              }}>
                {completedExercises[idx] && <Ionicons name="checkmark" size={16} color="white" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ 
                  fontSize: 17, 
                  fontWeight: '800', 
                  color: completedExercises[idx] ? colors.textMuted : colors.textPrimary, 
                  marginBottom: 4,
                  textDecorationLine: completedExercises[idx] ? 'line-through' : 'none'
                }}>{ex.name}</Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '600' }}>{ex.sets} Sets × {ex.reps} Reps</Text>
                {ex.tip && <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 8, fontStyle: 'italic' }}>💡 {ex.tip}</Text>}
              </View>
              <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {exercises.length === 0 && (
          <View style={{ alignItems: 'center', padding: 100 }}>
            <Ionicons name="fitness-outline" size={48} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted, marginTop: 16, fontWeight: '600' }}>No exercises found for this session.</Text>
          </View>
        )}
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, backgroundColor: colors.bgSurface, borderTopWidth: 1, borderTopColor: colors.border }}>
        <TouchableOpacity 
          style={{ height: 64, borderRadius: 24, overflow: 'hidden' }} 
          onPress={handleFinish} 
          disabled={isLoading}
        >
          <LinearGradient 
            colors={[colors.primary, colors.primary + 'CC']} 
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 1 }}>FINISH & LOG SESSION</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

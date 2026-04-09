// app/trainer/assign-workout.tsx
// Trainer: Assign/generate AI workout plan for a client

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { api } from '../../utils/api';

type GoalOption = { label: string; value: string };

const GOALS: GoalOption[] = [
  { label: 'Weight Loss', value: 'weight_loss' },
  { label: 'Muscle Gain', value: 'muscle_gain' },
  { label: 'Endurance', value: 'endurance' },
  { label: 'Flexibility', value: 'flexibility' },
  { label: 'Maintenance', value: 'maintenance' },
];

const LEVELS: GoalOption[] = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];

export default function AssignWorkoutScreen() {
  const { clientId, clientName } = useLocalSearchParams<{ clientId: string; clientName: string }>();
  const { colors, isDark } = useTheme();

  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [form, setForm] = useState({
    goals: [] as string[],
    level: 'beginner',
    daysPerWeek: 3,
    duration: 4,
    notes: '',
  });

  const toggleGoal = (val: string) => {
    setForm(f => ({
      ...f,
      goals: f.goals.includes(val) ? f.goals.filter(g => g !== val) : [...f.goals, val],
    }));
  };

  const handleGenerate = async () => {
    if (form.goals.length === 0) { Alert.alert('Required', 'Please select at least one training goal'); return; }
    setGenerating(true);
    try {
      const res = await api.post('/ai/generate-plan', {
        goals: form.goals,
        activityLevel: form.level === 'beginner' ? 'lightly_active' : form.level === 'intermediate' ? 'moderately_active' : 'very_active',
        durationDays: form.daysPerWeek * form.duration,
        age: 25, weight: 70, height: 170, gender: 'male', // defaults, override from client profile ideally
        medicalConditions: [],
        preferences: form.notes ? [form.notes] : [],
      });
      setPlan(res.data.data);
      Alert.alert('Plan Generated! 🎉', 'Review the AI workout plan below. You can assign it to the client.');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to generate plan');
    } finally {
      setGenerating(false);
    }
  };

  const handleAssign = async () => {
    if (!plan) return;
    // Override the client's active plan using the existing override endpoint
    try {
      // We first need the client's current plan id to override it
      const plansRes = await api.get(`/clients/${clientId}/plans`);
      const activePlan = plansRes.data.data?.[0];

      if (activePlan) {
        await api.patch(`/plan/${activePlan.id}/override`, {
          editedPlan: plan.plan,
          reason: `Trainer-generated workout plan: Goals - ${form.goals.join(', ')}`,
        });
        Alert.alert('Assigned! ✅', `Workout plan assigned to ${clientName}.`, [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Info', 'Client needs to generate their base AI plan first. Once they do, you can override it here.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to assign plan');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 15 }}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 12, fontWeight: '900', color: colors.primary, letterSpacing: 2 }}>ASSIGN WORKOUT</Text>
            <Text style={{ fontSize: 22, fontWeight: '900', color: colors.textPrimary }}>{clientName || 'Client'}</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          {/* Goals */}
          <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textSecondary, marginBottom: 12 }}>TRAINING GOALS</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
            {GOALS.map(g => {
              const sel = form.goals.includes(g.value);
              return (
                <TouchableOpacity
                  key={g.value}
                  onPress={() => toggleGoal(g.value)}
                  style={{
                    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
                    backgroundColor: sel ? colors.primary : colors.bgSurface,
                    borderWidth: 1, borderColor: sel ? colors.primary : colors.border,
                  }}
                >
                  <Text style={{ color: sel ? 'white' : colors.textPrimary, fontWeight: '700' }}>{g.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Level */}
          <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textSecondary, marginBottom: 12 }}>FITNESS LEVEL</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
            {LEVELS.map(l => (
              <TouchableOpacity
                key={l.value}
                onPress={() => setForm(f => ({ ...f, level: l.value }))}
                style={{
                  flex: 1, paddingVertical: 12, borderRadius: 16, alignItems: 'center',
                  backgroundColor: form.level === l.value ? colors.primary : colors.bgSurface,
                  borderWidth: 1, borderColor: form.level === l.value ? colors.primary : colors.border,
                }}
              >
                <Text style={{ color: form.level === l.value ? 'white' : colors.textPrimary, fontWeight: '800' }}>{l.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Days/Week + Duration */}
          <View style={{ flexDirection: 'row', gap: 15, marginBottom: 24 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textSecondary, marginBottom: 10 }}>DAYS/WEEK</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[3, 4, 5, 6].map(d => (
                  <TouchableOpacity
                    key={d}
                    onPress={() => setForm(f => ({ ...f, daysPerWeek: d }))}
                    style={{
                      width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: form.daysPerWeek === d ? colors.primary : colors.bgSurface,
                      borderWidth: 1, borderColor: form.daysPerWeek === d ? colors.primary : colors.border,
                    }}
                  >
                    <Text style={{ color: form.daysPerWeek === d ? 'white' : colors.textPrimary, fontWeight: '800' }}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textSecondary, marginBottom: 10 }}>DURATION (WEEKS)</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[1, 2, 4, 8].map(d => (
                  <TouchableOpacity
                    key={d}
                    onPress={() => setForm(f => ({ ...f, duration: d }))}
                    style={{
                      width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: form.duration === d ? colors.primary : colors.bgSurface,
                      borderWidth: 1, borderColor: form.duration === d ? colors.primary : colors.border,
                    }}
                  >
                    <Text style={{ color: form.duration === d ? 'white' : colors.textPrimary, fontWeight: '800' }}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Special notes */}
          <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textSecondary, marginBottom: 8 }}>SPECIAL NOTES (OPTIONAL)</Text>
          <TextInput
            value={form.notes}
            onChangeText={v => setForm(f => ({ ...f, notes: v }))}
            placeholder="e.g. knee injury, prefer home workouts..."
            placeholderTextColor={colors.textMuted}
            multiline
            style={{
              backgroundColor: colors.bgSurface, padding: 16, borderRadius: 16, color: colors.textPrimary,
              borderWidth: 1, borderColor: colors.border, minHeight: 80, textAlignVertical: 'top', marginBottom: 24,
            }}
          />

          {/* Generate Button */}
          <TouchableOpacity onPress={handleGenerate} disabled={generating} style={{ marginBottom: plan ? 16 : 30 }}>
            <LinearGradient colors={[colors.primary, colors.primaryDark]} style={{ padding: 18, borderRadius: 18, alignItems: 'center' }}>
              {generating
                ? <ActivityIndicator color="white" />
                : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="sparkles" size={18} color="white" />
                    <Text style={{ color: 'white', fontWeight: '900', fontSize: 16 }}>GENERATE AI PLAN</Text>
                  </View>
                )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Plan Preview + Assign */}
          {plan && (
            <View style={{ backgroundColor: colors.bgSurface, borderRadius: 20, padding: 20, marginBottom: 30, borderWidth: 1, borderColor: colors.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Ionicons name="checkmark-circle" size={24} color="#2ECC71" style={{ marginRight: 10 }} />
                <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>Plan Generated!</Text>
              </View>
              <Text style={{ color: colors.textSecondary, marginBottom: 16, lineHeight: 20 }}>
                AI has created a {form.daysPerWeek * form.duration}-day workout plan for {clientName}. Tap below to assign it.
              </Text>
              <TouchableOpacity
                onPress={handleAssign}
                style={{ backgroundColor: '#2ECC71', padding: 16, borderRadius: 14, alignItems: 'center' }}
              >
                <Text style={{ color: 'white', fontWeight: '900' }}>ASSIGN PLAN TO {(clientName || 'CLIENT').toUpperCase()}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

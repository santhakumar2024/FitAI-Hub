// app/trainer/assign-diet.tsx
// Trainer: Assign/generate AI diet plan for a client

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

const DIET_GOALS = [
  { label: 'Fat Loss', value: 'weight_loss' },
  { label: 'Muscle Gain', value: 'muscle_gain' },
  { label: 'Lean Bulk', value: 'lean_bulk' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Detox', value: 'detox' },
];

const PREFERENCES = [
  { label: '🥗 Vegetarian', value: 'vegetarian' },
  { label: '🌱 Vegan', value: 'vegan' },
  { label: '🍗 Non-Veg', value: 'non_vegetarian' },
  { label: '🥛 Keto', value: 'keto' },
  { label: '🇮🇳 Indian', value: 'indian_food' },
];

export default function AssignDietScreen() {
  const { clientId, clientName } = useLocalSearchParams<{ clientId: string; clientName: string }>();
  const { colors } = useTheme();

  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [form, setForm] = useState({
    goals: [] as string[],
    preferences: [] as string[],
    calories: '',
    durationDays: 7,
    notes: '',
  });

  const toggleItem = (key: 'goals' | 'preferences', val: string) => {
    setForm(f => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter(g => g !== val) : [...f[key], val],
    }));
  };

  const handleGenerate = async () => {
    if (form.goals.length === 0) { Alert.alert('Required', 'Please select at least one diet goal'); return; }
    setGenerating(true);
    try {
      const res = await api.post('/ai/generate-plan', {
        goals: form.goals,
        activityLevel: 'moderately_active',
        preferences: form.preferences,
        durationDays: form.durationDays,
        age: 25, weight: 70, height: 170, gender: 'male',
        medicalConditions: [],
      });
      setPlan(res.data.data);
      Alert.alert('Diet Plan Generated! 🥗', 'Review and assign the AI diet plan to this client.');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to generate plan');
    } finally {
      setGenerating(false);
    }
  };

  const handleAssign = async () => {
    if (!plan) return;
    try {
      const plansRes = await api.get(`/clients/${clientId}/plans`);
      const activePlan = plansRes.data.data?.[0];

      if (activePlan) {
        await api.patch(`/plan/${activePlan.id}/override`, {
          editedPlan: plan.plan,
          reason: `Trainer-assigned diet plan: Goals - ${form.goals.join(', ')}, Preferences - ${form.preferences.join(', ')}`,
        });
        Alert.alert('Assigned! ✅', `Diet plan assigned to ${clientName}.`, [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Info', 'Client needs to generate their base AI plan first before a trainer can assign diet plans.');
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
            <Text style={{ fontSize: 12, fontWeight: '900', color: colors.primary, letterSpacing: 2 }}>ASSIGN DIET</Text>
            <Text style={{ fontSize: 22, fontWeight: '900', color: colors.textPrimary }}>{clientName || 'Client'}</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          {/* Diet Goals */}
          <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textSecondary, marginBottom: 12 }}>DIET GOALS</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
            {DIET_GOALS.map(g => {
              const sel = form.goals.includes(g.value);
              return (
                <TouchableOpacity
                  key={g.value}
                  onPress={() => toggleItem('goals', g.value)}
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

          {/* Food Preferences */}
          <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textSecondary, marginBottom: 12 }}>FOOD PREFERENCES</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
            {PREFERENCES.map(p => {
              const sel = form.preferences.includes(p.value);
              return (
                <TouchableOpacity
                  key={p.value}
                  onPress={() => toggleItem('preferences', p.value)}
                  style={{
                    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
                    backgroundColor: sel ? colors.action : colors.bgSurface,
                    borderWidth: 1, borderColor: sel ? colors.action : colors.border,
                  }}
                >
                  <Text style={{ color: sel ? 'white' : colors.textPrimary, fontWeight: '700' }}>{p.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Plan Duration */}
          <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textSecondary, marginBottom: 12 }}>PLAN DURATION</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
            {[7, 14, 21, 30].map(d => (
              <TouchableOpacity
                key={d}
                onPress={() => setForm(f => ({ ...f, durationDays: d }))}
                style={{
                  flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center',
                  backgroundColor: form.durationDays === d ? colors.primary : colors.bgSurface,
                  borderWidth: 1, borderColor: form.durationDays === d ? colors.primary : colors.border,
                }}
              >
                <Text style={{ color: form.durationDays === d ? 'white' : colors.textPrimary, fontWeight: '800', fontSize: 12 }}>{d}d</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Calorie Target (optional) */}
          <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textSecondary, marginBottom: 8 }}>TARGET CALORIES (OPTIONAL)</Text>
          <TextInput
            value={form.calories}
            onChangeText={v => setForm(f => ({ ...f, calories: v }))}
            placeholder="e.g. 1800"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            style={{
              backgroundColor: colors.bgSurface, padding: 16, borderRadius: 16, color: colors.textPrimary,
              borderWidth: 1, borderColor: colors.border, marginBottom: 20,
            }}
          />

          {/* Notes */}
          <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textSecondary, marginBottom: 8 }}>SPECIAL NOTES (OPTIONAL)</Text>
          <TextInput
            value={form.notes}
            onChangeText={v => setForm(f => ({ ...f, notes: v }))}
            placeholder="e.g. diabetic, lactose intolerant, no gluten..."
            placeholderTextColor={colors.textMuted}
            multiline
            style={{
              backgroundColor: colors.bgSurface, padding: 16, borderRadius: 16, color: colors.textPrimary,
              borderWidth: 1, borderColor: colors.border, minHeight: 80, textAlignVertical: 'top', marginBottom: 24,
            }}
          />

          {/* Generate Button */}
          <TouchableOpacity onPress={handleGenerate} disabled={generating} style={{ marginBottom: plan ? 16 : 30 }}>
            <LinearGradient colors={[colors.action, '#E67E22']} style={{ padding: 18, borderRadius: 18, alignItems: 'center' }}>
              {generating
                ? <ActivityIndicator color="white" />
                : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="restaurant" size={18} color="white" />
                    <Text style={{ color: 'white', fontWeight: '900', fontSize: 16 }}>GENERATE DIET PLAN</Text>
                  </View>
                )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Plan Preview + Assign */}
          {plan && (
            <View style={{ backgroundColor: colors.bgSurface, borderRadius: 20, padding: 20, marginBottom: 30, borderWidth: 1, borderColor: colors.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Ionicons name="checkmark-circle" size={24} color="#2ECC71" style={{ marginRight: 10 }} />
                <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>Diet Plan Ready!</Text>
              </View>
              <Text style={{ color: colors.textSecondary, marginBottom: 16, lineHeight: 20 }}>
                A {form.durationDays}-day nutrition plan has been generated for {clientName}. Tap to assign.
              </Text>
              <TouchableOpacity
                onPress={handleAssign}
                style={{ backgroundColor: colors.action, padding: 16, borderRadius: 14, alignItems: 'center' }}
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

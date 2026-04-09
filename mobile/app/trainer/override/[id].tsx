// app/trainer/override/[id].tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { api } from '../../../utils/api';

export default function PlanOverrideScreen() {
  const { id, userId } = useLocalSearchParams();
  const { colors } = useTheme();
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchPlan();
  }, [id]);

  const fetchPlan = async () => {
    try {
      const res = await api.get(`/ai/plan/${id}`);
      setPlan(res.data.data.plan);
    } catch (error) {
      console.error('Failed to fetch plan:', error);
      Alert.alert('Error', 'Could not load plan for editing');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!reason.trim()) {
      Alert.alert('Required', 'Please provide a reason for the manual override.');
      return;
    }

    setSaving(true);
    try {
      await api.patch(`/plan/${id}/override`, {
        editedPlan: plan,
        reason
      });
      Alert.alert('Success', 'Plan has been manually updated.');
      router.back();
    } catch (error) {
       console.error('Failed to save plan:', error);
       Alert.alert('Error', 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '900', color: colors.textPrimary }}>Override AI Plan</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={{ color: colors.primary, fontWeight: '900' }}>SAVE</Text>}
          </TouchableOpacity>
        </View>

        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textSecondary, marginBottom: 8 }}>REASON FOR CHANGE</Text>
          <TextInput 
            value={reason}
            onChangeText={setReason}
            placeholder="e.g., Increasing protein intake for muscle mass..."
            placeholderTextColor={colors.textMuted}
            multiline
            style={{ backgroundColor: colors.bgSurface, borderRadius: 16, padding: 16, minHeight: 80, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, textAlignVertical: 'top' }}
          />
        </View>

        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: colors.textPrimary, marginBottom: 20 }}>Daily Diet Plan</Text>
          
          {['breakfast', 'lunch', 'dinner'].map((meal) => (
            <View key={meal} style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 12, fontWeight: '900', color: colors.primary, textTransform: 'uppercase', marginBottom: 10 }}>{meal}</Text>
              <TextInput 
                value={plan?.dailyPlan?.day1?.diet?.[meal]?.meal || ''}
                onChangeText={(text) => {
                  const newPlan = { ...plan };
                  newPlan.dailyPlan.day1.diet[meal].meal = text;
                  setPlan(newPlan);
                }}
                style={{ backgroundColor: colors.bgSurface, borderRadius: 12, padding: 15, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border }}
              />
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, color: colors.textMuted, marginBottom: 4 }}>CALORIES</Text>
                  <TextInput 
                    value={String(plan?.dailyPlan?.day1?.diet?.[meal]?.calories || '')}
                    onChangeText={(text) => {
                      const newPlan = { ...plan };
                      newPlan.dailyPlan.day1.diet[meal].calories = parseInt(text) || 0;
                      setPlan(newPlan);
                    }}
                    keyboardType="numeric"
                    style={{ backgroundColor: colors.bgSurface, borderRadius: 12, padding: 10, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                   <Text style={{ fontSize: 10, color: colors.textMuted, marginBottom: 4 }}>PROTEIN (G)</Text>
                   <TextInput 
                    value={String(plan?.dailyPlan?.day1?.diet?.[meal]?.protein || '')}
                    onChangeText={(text) => {
                      const newPlan = { ...plan };
                      newPlan.dailyPlan.day1.diet[meal].protein = parseInt(text) || 0;
                      setPlan(newPlan);
                    }}
                    keyboardType="numeric"
                    style={{ backgroundColor: colors.bgSurface, borderRadius: 12, padding: 10, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border }}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={{ padding: 20, marginBottom: 40 }}>
           <Text style={{ fontSize: 20, fontWeight: '900', color: colors.textPrimary, marginBottom: 20 }}>Workout Routine (Day 1)</Text>
           {plan?.dailyPlan?.day1?.workout?.map((ex: any, idx: number) => (
             <View key={idx} style={{ backgroundColor: colors.bgSurface, padding: 15, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border }}>
                <TextInput 
                  value={ex.exercise}
                  onChangeText={(text) => {
                    const newPlan = { ...plan };
                    newPlan.dailyPlan.day1.workout[idx].exercise = text;
                    setPlan(newPlan);
                  }}
                  style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 }}
                />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TextInput 
                    placeholder="Duration/Reps"
                    value={ex.duration}
                    onChangeText={(text) => {
                      const newPlan = { ...plan };
                      newPlan.dailyPlan.day1.workout[idx].duration = text;
                      setPlan(newPlan);
                    }}
                    placeholderTextColor={colors.textMuted}
                    style={{ flex: 1, backgroundColor: colors.bg, padding: 8, borderRadius: 8, color: colors.textSecondary, fontSize: 12 }}
                  />
                </View>
             </View>
           ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

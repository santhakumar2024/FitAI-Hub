// app/trainer/client/[id].tsx
// Client Detail — with Calendar tab, Assign Workout & Diet Plan buttons

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../hooks/useTheme';
import { api } from '../../../utils/api';
import { format } from 'date-fns';

type Tab = 'overview' | 'plans';

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const [client, setClient] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    try {
      const [clientRes, progressRes] = await Promise.all([
        api.get(`/clients/${id}`),
        api.get(`/clients/${id}/progress`),
      ]);
      setClient(clientRes.data.data);
      setProgress(progressRes.data.data);
    } catch (error) {
      Alert.alert('Error', 'Could not load client details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const bmiColor = (bmi: number) => {
    if (bmi < 18.5) return '#3498DB';
    if (bmi < 25) return '#2ECC71';
    if (bmi < 30) return '#F1C40F';
    return '#E74C3C';
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 15 }}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: '900', color: colors.textPrimary, flex: 1 }}>Client Profile</Text>
          <TouchableOpacity
            onPress={() => router.push(`/trainer/client/${id}/calendar?clientName=${encodeURIComponent(client?.name || '')}` as any)}
            style={{ backgroundColor: `${colors.primary}15`, padding: 10, borderRadius: 14 }}
          >
            <Ionicons name="calendar" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={{ alignItems: 'center', paddingBottom: 20 }}>
          <View style={{
            width: 100, height: 100, borderRadius: 50, backgroundColor: colors.bgSurface,
            marginBottom: 12, alignItems: 'center', justifyContent: 'center',
            borderWidth: 3, borderColor: colors.primary,
          }}>
            {client.photoUrl
              ? <Image source={{ uri: client.photoUrl }} style={{ width: 100, height: 100, borderRadius: 50 }} />
              : <Ionicons name="person" size={48} color={colors.textMuted} />}
          </View>
          <Text style={{ fontSize: 24, fontWeight: '900', color: colors.textPrimary }}>{client.name}</Text>
          <Text style={{ color: colors.textSecondary, marginTop: 4 }}>
            {client.gender?.toUpperCase()} • {client.age} yrs
          </Text>
          {client.goals?.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 10 }}>
              {client.goals.slice(0, 3).map((g: string, i: number) => (
                <View key={i} style={{ backgroundColor: `${colors.primary}15`, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 }}>
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>{g}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 20 }}>
          {[
            { label: 'WEIGHT', value: `${client.weight}kg` },
            { label: 'HEIGHT', value: `${client.height}cm` },
            { label: 'BMI', value: client.bmi?.toFixed(1) || '—', color: bmiColor(client.bmi) },
          ].map((s) => (
            <View key={s.label} style={{ flex: 1, backgroundColor: colors.bgSurface, padding: 14, borderRadius: 18, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1 }}>{s.label}</Text>
              <Text style={{ fontSize: 18, fontWeight: '900', color: (s as any).color || colors.textPrimary, marginTop: 4 }}>{s.value}</Text>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={{ paddingHorizontal: 20, gap: 12, marginBottom: 24 }}>
          {/* Calendar */}
          <TouchableOpacity
            onPress={() => router.push(`/trainer/client/${id}/calendar?clientName=${encodeURIComponent(client?.name || '')}` as any)}
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgSurface, padding: 18, borderRadius: 20, borderWidth: 1, borderColor: colors.border }}
          >
            <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: `${colors.primary}15`, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <Ionicons name="calendar" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', color: colors.textPrimary }}>View Progress Calendar</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>Browse daily workout & diet logs</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Assign Workout */}
          <TouchableOpacity
            onPress={() => router.push(`/trainer/assign-workout?clientId=${id}&clientName=${encodeURIComponent(client?.name || '')}` as any)}
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgSurface, padding: 18, borderRadius: 20, borderWidth: 1, borderColor: colors.border }}
          >
            <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: `${colors.primary}15`, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <Ionicons name="barbell" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', color: colors.textPrimary }}>Assign Workout Plan</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>AI-generated, customized for client</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Assign Diet */}
          <TouchableOpacity
            onPress={() => router.push(`/trainer/assign-diet?clientId=${id}&clientName=${encodeURIComponent(client?.name || '')}` as any)}
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgSurface, padding: 18, borderRadius: 20, borderWidth: 1, borderColor: colors.border }}
          >
            <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: `${colors.action}15`, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <Ionicons name="restaurant" size={22} color={colors.action} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', color: colors.textPrimary }}>Assign Diet Plan</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>AI-powered nutrition planning</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Override Plan */}
          <TouchableOpacity
            onPress={() => router.push(`/trainer/override/${client.aiPlans?.[0]?.id}?userId=${client.id}` as any)}
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgSurface, padding: 18, borderRadius: 20, borderWidth: 1, borderColor: colors.border }}
          >
            <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: '#F1C40F15', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <Ionicons name="create" size={22} color="#F1C40F" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', color: colors.textPrimary }}>Manual Plan Override</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                {client.aiPlans?.[0]?.isManuallyEdited ? '⚡ Manually edited' : '🤖 AI generated'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Recent Sessions */}
        <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 14 }}>Recent Sessions</Text>
        </View>

        <View style={{ paddingHorizontal: 20, gap: 12, marginBottom: 40 }}>
          {progress?.logs?.length > 0 ? (
            progress.logs.slice(0, 5).map((log: any, idx: number) => (
              <View key={idx} style={{
                backgroundColor: colors.bgSurface, padding: 16, borderRadius: 20,
                borderLeftWidth: 4, borderLeftColor: colors.primary, borderWidth: 1, borderColor: colors.border,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontWeight: '800', color: colors.textPrimary }}>
                    {format(new Date(log.date), 'MMM dd, yyyy')}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '800' }}>
                    {log.workoutLogs?.length || 0} exercises
                  </Text>
                </View>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  Calorie Intake: {log.dietLog?.totalCalories || 0} kcal
                </Text>
                {log.notes && (
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4, fontStyle: 'italic' }}>
                    "{log.notes}"
                  </Text>
                )}
              </View>
            ))
          ) : (
            <View style={{ backgroundColor: colors.bgSurface, padding: 30, borderRadius: 20, alignItems: 'center' }}>
              <Ionicons name="document-text-outline" size={40} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, marginTop: 10 }}>No logs recorded yet.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

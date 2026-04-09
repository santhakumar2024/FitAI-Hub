// app/trainer/client/[id]/calendar.tsx
// Trainer view of a specific client's daily workout + diet calendar

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../hooks/useTheme';
import { api } from '../../../../utils/api';
import { format } from 'date-fns';

export default function ClientCalendarScreen() {
  const { id: clientId, clientName } = useLocalSearchParams<{ id: string; clientName: string }>();
  const { colors } = useTheme();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dayData, setDayData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [markedDates, setMarkedDates] = useState<any>({});

  useEffect(() => {
    fetchHistory();
    fetchDayData(selectedDate);
  }, [clientId]);

  const fetchHistory = async () => {
    try {
      const res = await api.get(`/clients/${clientId}/logs`);
      const logs = res.data.data || [];
      const marked: any = {};
      logs.forEach((log: any) => {
        const date = log.date.split('T')[0];
        marked[date] = { marked: true, dotColor: colors.primary, selected: date === selectedDate, selectedColor: colors.primary };
      });
      setMarkedDates(marked);
    } catch (error) {
      console.error('Failed to fetch client history:', error);
    }
  };

  const fetchDayData = async (date: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/clients/${clientId}/logs/daily?date=${date}`);
      setDayData(res.data.data);
    } catch {
      setDayData(null);
    } finally {
      setLoading(false);
    }
  };

  const onDayPress = (day: any) => {
    const dateStr = day.dateString;
    setSelectedDate(dateStr);
    const newMarked = { ...markedDates };
    Object.keys(newMarked).forEach(k => {
      newMarked[k] = { ...newMarked[k], selected: k === dateStr, selectedColor: colors.primary };
    });
    if (!newMarked[dateStr]) newMarked[dateStr] = { selected: true, selectedColor: colors.primary };
    setMarkedDates(newMarked);
    fetchDayData(dateStr);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 15 }}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 12, fontWeight: '900', color: colors.primary, letterSpacing: 2 }}>CLIENT CALENDAR</Text>
            <Text style={{ fontSize: 22, fontWeight: '900', color: colors.textPrimary }}>{clientName || 'Client'}</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          {/* Calendar */}
          <View style={{ borderRadius: 20, overflow: 'hidden', backgroundColor: colors.bgSurface, padding: 10, marginBottom: 24 }}>
            <Calendar
              theme={{
                backgroundColor: colors.bgSurface,
                calendarBackground: colors.bgSurface,
                textSectionTitleColor: colors.textSecondary,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: '#ffffff',
                todayTextColor: colors.primary,
                dayTextColor: colors.textPrimary,
                textDisabledColor: colors.textMuted,
                dotColor: colors.primary,
                selectedDotColor: '#ffffff',
                arrowColor: colors.primary,
                monthTextColor: colors.textPrimary,
                indicatorColor: colors.primary,
                textDayFontWeight: '600',
                textMonthFontWeight: '900',
                textDayHeaderFontWeight: '700',
              }}
              onDayPress={onDayPress}
              markedDates={markedDates}
            />
          </View>

          {/* Day Data */}
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 16 }}>
            Progress — {format(new Date(selectedDate + 'T12:00:00'), 'MMMM do, yyyy')}
          </Text>

          {loading ? (
            <ActivityIndicator color={colors.primary} size="large" />
          ) : dayData ? (
            <View style={{ gap: 15, marginBottom: 30 }}>
              {/* Diet */}
              <View style={{ backgroundColor: colors.bgSurface, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: colors.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: `${colors.action}15`, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Ionicons name="restaurant" size={18} color={colors.action} />
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>Diet</Text>
                </View>
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: colors.textSecondary }}>Calories</Text>
                    <Text style={{ fontWeight: '800', color: colors.textPrimary }}>{dayData.dietLog?.totalCalories || 0} kcal</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: colors.textSecondary }}>Protein</Text>
                    <Text style={{ fontWeight: '800', color: colors.textPrimary }}>{dayData.dietLog?.totalProtein || 0}g</Text>
                  </View>
                </View>
              </View>

              {/* Workouts */}
              <View style={{ backgroundColor: colors.bgSurface, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: colors.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: `${colors.primary}15`, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Ionicons name="barbell" size={18} color={colors.primary} />
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>Workouts</Text>
                  <View style={{ marginLeft: 'auto', backgroundColor: `${colors.primary}15`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                    <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800' }}>{dayData.workoutLogs?.length || 0}</Text>
                  </View>
                </View>
                {dayData.workoutLogs?.length > 0 ? (
                  dayData.workoutLogs.map((w: any, idx: number) => (
                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: colors.border }}>
                      <Ionicons name="checkmark-circle" size={16} color="#2ECC71" style={{ marginRight: 10 }} />
                      <Text style={{ color: colors.textPrimary, fontWeight: '600', flex: 1 }}>{w.exercise}</Text>
                      <Text style={{ color: colors.textMuted }}>{w.sets}×{w.reps}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={{ color: colors.textMuted }}>No workouts logged.</Text>
                )}
              </View>

              {/* Metrics */}
              {dayData.weight && (
                <View style={{ backgroundColor: colors.bgSurface, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: colors.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#9B59B615', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Ionicons name="speedometer" size={18} color="#9B59B6" />
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>Metrics</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1, backgroundColor: colors.bg, padding: 12, borderRadius: 12, alignItems: 'center' }}>
                      <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700' }}>WEIGHT</Text>
                      <Text style={{ fontSize: 18, fontWeight: '900', color: colors.textPrimary }}>{dayData.weight}kg</Text>
                    </View>
                    {dayData.bmi && (
                      <View style={{ flex: 1, backgroundColor: colors.bg, padding: 12, borderRadius: 12, alignItems: 'center' }}>
                        <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700' }}>BMI</Text>
                        <Text style={{ fontSize: 18, fontWeight: '900', color: colors.textPrimary }}>{dayData.bmi}</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {dayData.notes && (
                <View style={{ backgroundColor: `${colors.primary}08`, padding: 16, borderRadius: 16, borderLeftWidth: 3, borderLeftColor: colors.primary }}>
                  <Text style={{ color: colors.textMuted, fontSize: 11, marginBottom: 4, fontWeight: '700' }}>CLIENT'S NOTE</Text>
                  <Text style={{ color: colors.textSecondary, fontStyle: 'italic' }}>"{dayData.notes}"</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={{ backgroundColor: colors.bgSurface, padding: 40, borderRadius: 20, alignItems: 'center', marginBottom: 30 }}>
              <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
              <Text style={{ color: colors.textSecondary, marginTop: 10, textAlign: 'center' }}>No activity logged by {clientName || 'client'} on this date.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

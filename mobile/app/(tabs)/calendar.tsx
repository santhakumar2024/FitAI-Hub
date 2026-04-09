// app/(tabs)/calendar.tsx
// Role-Aware Calendar: NORMAL_USER = personal logs | TRAINER = client selector + client logs

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useTheme } from '../../hooks/useTheme';
import { api } from '../../utils/api';
import { format } from 'date-fns';

export default function CalendarScreen() {
  const { colors } = useTheme();
  const { user } = useSelector((state: RootState) => state.auth);
  const role = user?.role || 'NORMAL_USER';

  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dayData, setDayData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [markedDates, setMarkedDates] = useState<any>({});

  // Trainer-specific state
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showClientPicker, setShowClientPicker] = useState(false);

  const isTrainer = role === 'TRAINER';

  useEffect(() => {
    if (isTrainer) {
      fetchTrainerClients();
    } else {
      fetchHistory();
      fetchDayData(selectedDate);
    }
  }, []);

  useEffect(() => {
    if (isTrainer && selectedClient) {
      fetchClientHistory(selectedClient.id);
      fetchClientDayData(selectedClient.id, selectedDate);
    }
  }, [selectedClient]);

  // ─── Normal User ───────────────────────────────────────────
  const fetchHistory = async () => {
    try {
      const res = await api.get('/logs/history', { params: { limit: 100 } });
      const logs = res.data.data;
      const marked: any = {};
      logs.forEach((log: any) => {
        const date = log.date.split('T')[0];
        marked[date] = { marked: true, dotColor: colors.primary, selected: date === selectedDate, selectedColor: colors.primary };
      });
      setMarkedDates(marked);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const fetchDayData = async (date: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/logs/daily?date=${date}`);
      setDayData(res.data.data);
    } catch {
      setDayData(null);
    } finally {
      setLoading(false);
    }
  };

  // ─── Trainer ───────────────────────────────────────────────
  const fetchTrainerClients = async () => {
    try {
      const res = await api.get('/clients');
      setClients(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  };

  const fetchClientHistory = async (clientId: string) => {
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

  const fetchClientDayData = async (clientId: string, date: string) => {
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

    if (isTrainer && selectedClient) {
      fetchClientDayData(selectedClient.id, dateStr);
    } else if (!isTrainer) {
      fetchDayData(dateStr);
    }
  };

  const calendarTheme = {
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
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ padding: 20 }}>

          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: colors.textPrimary }}>
              {isTrainer ? 'Client Calendar' : 'Mastery Calendar'}
            </Text>
          </View>

          {/* Trainer: Client Selector */}
          {isTrainer && (
            <TouchableOpacity
              onPress={() => setShowClientPicker(true)}
              style={{
                flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgSurface,
                padding: 16, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: colors.border,
              }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: `${colors.primary}15`, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name="person" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '700', marginBottom: 2 }}>VIEWING CALENDAR FOR</Text>
                <Text style={{ fontSize: 16, fontWeight: '800', color: selectedClient ? colors.textPrimary : colors.textMuted }}>
                  {selectedClient ? selectedClient.name : 'Select a client...'}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}

          {/* Calendar */}
          <View style={{ borderRadius: 20, overflow: 'hidden', backgroundColor: colors.bgSurface, padding: 10, marginBottom: 24 }}>
            <Calendar
              theme={calendarTheme}
              onDayPress={onDayPress}
              markedDates={markedDates}
            />
          </View>

          {/* Day Data */}
          {isTrainer && !selectedClient ? (
            <View style={{ backgroundColor: colors.bgSurface, padding: 40, borderRadius: 20, alignItems: 'center' }}>
              <Ionicons name="people-outline" size={48} color={colors.textMuted} />
              <Text style={{ color: colors.textSecondary, marginTop: 10, textAlign: 'center' }}>
                Select a client above to view their workout and diet progress
              </Text>
            </View>
          ) : (
            <View>
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 15 }}>
                {isTrainer && selectedClient
                  ? `${selectedClient.name}'s Progress`
                  : 'Your Progress'} — {format(new Date(selectedDate + 'T12:00:00'), 'MMMM do')}
              </Text>

              {loading ? (
                <ActivityIndicator color={colors.primary} size="large" />
              ) : dayData ? (
                <View style={{ gap: 15 }}>
                  {/* Diet Card */}
                  <View style={{ backgroundColor: colors.bgSurface, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: colors.border }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: `${colors.action}15`, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <Ionicons name="restaurant" size={18} color={colors.action} />
                      </View>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>Diet Adherence</Text>
                    </View>
                    <View style={{ gap: 6 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: colors.textSecondary }}>Total Calories</Text>
                        <Text style={{ fontWeight: '800', color: colors.textPrimary }}>{dayData.dietLog?.totalCalories || 0} kcal</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: colors.textSecondary }}>Protein</Text>
                        <Text style={{ fontWeight: '800', color: colors.textPrimary }}>{dayData.dietLog?.totalProtein || 0}g</Text>
                      </View>
                    </View>
                  </View>

                  {/* Workout Card */}
                  <View style={{ backgroundColor: colors.bgSurface, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: colors.border }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: `${colors.primary}15`, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <Ionicons name="barbell" size={18} color={colors.primary} />
                      </View>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>Workouts</Text>
                      <View style={{ marginLeft: 'auto', backgroundColor: `${colors.primary}15`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                        <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800' }}>{dayData.workoutLogs?.length || 0} exercises</Text>
                      </View>
                    </View>
                    {dayData.workoutLogs?.length > 0 ? (
                      dayData.workoutLogs.map((w: any, idx: number) => (
                        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderTopWidth: idx === 0 ? 0 : 1, borderTopColor: colors.border }}>
                          <Ionicons name="checkmark-circle" size={16} color="#2ECC71" style={{ marginRight: 10 }} />
                          <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{w.exercise}</Text>
                          <Text style={{ color: colors.textMuted, marginLeft: 'auto' }}>{w.sets}×{w.reps}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={{ color: colors.textMuted }}>No workouts logged this day.</Text>
                    )}
                  </View>

                  {/* Metrics Card */}
                  {dayData.weight && (
                    <View style={{ backgroundColor: colors.bgSurface, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: colors.border }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#9B59B615', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                          <Ionicons name="speedometer" size={18} color="#9B59B6" />
                        </View>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>Body Metrics</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 12 }}>
                        <View style={{ flex: 1, backgroundColor: colors.bg, padding: 12, borderRadius: 12, alignItems: 'center' }}>
                          <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700' }}>WEIGHT</Text>
                          <Text style={{ fontSize: 18, fontWeight: '900', color: colors.textPrimary }}>{dayData.weight} kg</Text>
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

                  {/* Notes */}
                  {dayData.notes && (
                    <View style={{ backgroundColor: `${colors.primary}08`, padding: 16, borderRadius: 16, borderLeftWidth: 3, borderLeftColor: colors.primary }}>
                      <Text style={{ color: colors.textSecondary, fontStyle: 'italic' }}>"{dayData.notes}"</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={{ backgroundColor: colors.bgSurface, padding: 40, borderRadius: 20, alignItems: 'center' }}>
                  <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
                  <Text style={{ color: colors.textSecondary, marginTop: 10 }}>No activity logged on this date.</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Client Picker Modal */}
      <Modal visible={showClientPicker} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.bgSurface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '70%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: colors.textPrimary }}>Select Client</Text>
              <TouchableOpacity onPress={() => setShowClientPicker(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={clients}
              keyExtractor={(item: any) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedClient(item);
                    setShowClientPicker(false);
                    setMarkedDates({});
                    setDayData(null);
                  }}
                  style={{
                    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 10,
                    backgroundColor: selectedClient?.id === item.id ? `${colors.primary}10` : colors.bg,
                    borderWidth: 1, borderColor: selectedClient?.id === item.id ? colors.primary : colors.border,
                  }}
                >
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: `${colors.primary}15`, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                    <Ionicons name="person" size={22} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>{item.name}</Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>Goal: {item.goals?.[0] || 'Not set'}</Text>
                  </View>
                  {selectedClient?.id === item.id && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', padding: 40 }}>
                  <Ionicons name="people-outline" size={48} color={colors.textMuted} />
                  <Text style={{ color: colors.textMuted, marginTop: 10 }}>No clients found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

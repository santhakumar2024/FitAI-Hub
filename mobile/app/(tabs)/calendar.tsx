import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { useTheme } from '../../hooks/useTheme';
import { api } from '../../utils/api';
import { format } from 'date-fns';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { createDailyLogThunk } from '../../store/slices/logSlice';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function CalendarScreen() {
  const { colors, isDark } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const role = user?.role || 'NORMAL_USER';

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [dayData, setDayData] = useState<any>(null);
  const [aiRecommendation, setAiRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markedDates, setMarkedDates] = useState<any>({});

  // Trainer-specific state
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showClientPicker, setShowClientPicker] = useState(false);

  const isTrainer = role === 'TRAINER';
  const isToday = selectedDate === todayStr;

  useEffect(() => {
    if (isTrainer) {
      fetchTrainerClients();
    } else {
      fetchHistory();
      fetchDayData(selectedDate);
    }
  }, []);

  // ... (keeping fetchHistory, fetchDayData, fetchTrainerClients, fetchClientHistory, fetchClientDayData)

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
    try {
      setLoading(true);
      setError(null);
      setAiRecommendation(null);

      const [logRes, aiRes] = await Promise.allSettled([
        api.get(`/logs/daily?date=${date}`),
        api.get(`/plan/date?date=${date}`)
      ]);
      
      if (logRes.status === 'fulfilled') {
        setDayData(logRes.value.data.data);
      } else {
        const err = logRes.reason;
        if (err.response?.status === 404) {
          setDayData(null);
        } else {
          throw err;
        }
      }

      if (aiRes.status === 'fulfilled') {
        setAiRecommendation(aiRes.value.data.data.recommendation);
      } else {
        setAiRecommendation(null);
      }
    } catch (err: any) {
      console.error('Error fetching calendar day data:', err);
      setError(err.userMessage || 'Could not fetch progress data.');
    } finally {
      setLoading(false);
    }
  };

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
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/clients/${clientId}/logs/daily?date=${date}`);
      setDayData(res.data.data);
    } catch (err: any) {
      console.error('Failed to fetch client day data:', err);
      if (err.response?.status === 404) {
        setDayData(null);
      } else {
        setError(err.userMessage || 'Could not fetch client progress data.');
      }
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

  const handleQuickLog = async (label: string, mealData: any) => {
    if (!mealData) return;
    
    const result = await dispatch(createDailyLogThunk({
      date: selectedDate,
      diet: {
        [label.toLowerCase()]: mealData.name,
        totalCalories: mealData.cal,
        totalProtein: mealData.prot
      },
      notes: `Logged AI Recommendation from Calendar.`
    }));

    if (createDailyLogThunk.fulfilled.match(result)) {
      Alert.alert('Success', `${label} has been logged to your daily progress!`);
      fetchDayData(selectedDate);
    }
  };

  const navigateToSession = (type: 'workout' | 'yoga') => {
    // Only allow starting sessions for today (consistent with user request)
    if (!isToday) {
      Alert.alert('View Only', `You can only start sessions for the current date.`);
      return;
    }
    router.push({
      pathname: type === 'workout' ? '/workout-session' : '/yoga-session',
      params: { date: selectedDate }
    } as any);
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
            {isToday && <View style={{ backgroundColor: `${colors.primary}15`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}><Text style={{ color: colors.primary, fontSize: 10, fontWeight: '900' }}>TODAY ACTIVE</Text></View>}
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

          {/* Day Data Container */}
          {isTrainer && !selectedClient ? (
            <View style={{ backgroundColor: colors.bgSurface, padding: 40, borderRadius: 20, alignItems: 'center' }}>
              <Ionicons name="people-outline" size={48} color={colors.textMuted} />
              <Text style={{ color: colors.textSecondary, marginTop: 10, textAlign: 'center' }}>
                Select a client above to view their workout and diet progress
              </Text>
            </View>
          ) : (
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
                <Text style={{ fontSize: 13, fontWeight: '900', color: colors.textMuted, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  {isTrainer ? `${selectedClient.name}'s History` : isToday ? 'TODAY\'S FLOW' : 'PAST PROGRESS'}
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary }}>
                  {format(new Date(selectedDate + 'T12:00:00'), 'MMMM do')}
                </Text>
              </View>

               {loading ? (
                <View style={{ padding: 40 }}>
                  <ActivityIndicator color={colors.primary} size="large" />
                </View>
              ) : error ? (
                <ErrorState 
                  message={error} 
                  onRetry={() => fetchDayData(selectedDate)} 
                />
              ) : (
                <View style={{ gap: 24 }}>
                  
                  {/* --- Actual Logged Data (If exists) --- */}
                  {dayData && (
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={{ marginRight: 6 }} />
                        <Text style={{ fontSize: 14, fontWeight: '900', color: colors.primary }}>LOGGED ACTIVITY</Text>
                      </View>
                      <View style={{ backgroundColor: `${colors.primary}05`, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.primary, borderStyle: 'dashed' }}>
                         {dayData.diet && (
                           <View style={{ marginBottom: 12 }}>
                             <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '800', marginBottom: 4 }}>ACTUAL NUTRITION</Text>
                             <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{Object.values(dayData.diet).filter(v => typeof v === 'string').join(', ')}</Text>
                           </View>
                         )}
                         {dayData.workout && <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>✅ Workout Completed</Text>}
                         {!dayData.diet && !dayData.workout && <Text style={{ color: colors.textMuted }}>Details not found for this log.</Text>}
                      </View>
                    </View>
                  )}

                  {/* --- AI Recommendations Section --- */}
                  {aiRecommendation ? (
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <Ionicons name="sparkles" size={16} color={colors.primary} style={{ marginRight: 6 }} />
                        <Text style={{ fontSize: 14, fontWeight: '900', color: colors.textPrimary }}>AI SUGGESTED STRATEGY</Text>
                      </View>

                      {/* Diet Recs */}
                      <View style={{ gap: 12, marginBottom: 20 }}>
                        {[
                          { label: 'Breakfast', key: 'm1_bk' },
                          { label: 'Lunch', key: 'm2_ln' },
                          { label: 'Dinner', key: 'm3_dn' }
                        ].map((meal) => {
                          const m = aiRecommendation.diet?.[meal.key];
                          if (!m) return null;
                          return (
                            <View key={meal.key} style={{ backgroundColor: colors.bgSurface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <View style={{ flex: 1 }}>
                                <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '900', marginBottom: 2 }}>{meal.label.toUpperCase()}</Text>
                                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }} numberOfLines={1}>{m.name}</Text>
                                <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{m.cal} kcal • {m.prot}g Protein</Text>
                              </View>
                              {isToday && (
                                <TouchableOpacity 
                                  onPress={() => handleQuickLog(meal.label, m)}
                                  style={{ backgroundColor: `${colors.primary}15`, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}
                                >
                                  <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '900' }}>LOG IT</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          );
                        })}
                      </View>

                      {/* Workout/Yoga Recs */}
                      <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity 
                          onPress={() => navigateToSession('workout')}
                          style={{ flex: 1, backgroundColor: colors.bgSurface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}
                        >
                          <Ionicons name="fitness-outline" size={24} color={colors.primary} style={{ marginBottom: 8 }} />
                          <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 12 }}>WORKOUT</Text>
                          {isToday && <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '900', marginTop: 4 }}>START SESSION</Text>}
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          onPress={() => navigateToSession('yoga')}
                          style={{ flex: 1, backgroundColor: colors.bgSurface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}
                        >
                          <Ionicons name="body-outline" size={24} color={colors.primary} style={{ marginBottom: 8 }} />
                          <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 12 }}>YOGA</Text>
                          {isToday && <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '900', marginTop: 4 }}>START SESSION</Text>}
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : !dayData && (
                    <EmptyState 
                      title="No strategy found"
                      message="There are no AI plans found for this date. Visit the AI Architect to generate a plan!"
                      icon="calendar-outline"
                    />
                  )}
                </View>
              )}
            </View>
          )}
        </View>
        <View style={{ height: 40 }} />
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

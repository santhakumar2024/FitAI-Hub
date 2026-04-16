// app/(tabs)/logs.tsx
// Daily Log Screen — Forest Green & Sage Theme Overhaul

import React, { useState, useEffect } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, RefreshControl, Dimensions, Alert, Platform, KeyboardAvoidingView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { createDailyLogThunk, fetchDailyLogs } from '../../store/slices/logSlice';
import { useTheme } from '../../hooks/useTheme';
import { api } from '../../utils/api';

const { width } = Dimensions.get('window');

const MOODS = [
  { icon: 'happy-outline', label: 'Great', value: 10 },
  { icon: 'sunny-outline', label: 'Good', value: 8 },
  { icon: 'partly-sunny-outline', label: 'Okay', value: 5 },
  { icon: 'cloudy-outline', label: 'Low', value: 3 },
  { icon: 'rainy-outline', label: 'Bad', value: 1 },
];

export default function DailyLogScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { todayLog, isLoading: isFetching } = useSelector((s: RootState) => s.log);
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [mood, setMood] = useState('sunny-outline');
  const [energyLevel, setEnergyLevel] = useState(7);
  const [diet, setDiet] = useState({
    breakfast: [] as any[],
    lunch: [] as any[],
    dinner: [] as any[],
    snacks: [] as any[],
    totalCalories: 0,
    totalProtein: 0,
  });
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    dispatch(fetchDailyLogs());
  }, []);

  // Sync state with todayLog if it exists
  useEffect(() => {
    if (todayLog) {
      setMood(todayLog.mood || 'sunny-outline');
      setEnergyLevel(todayLog.energyLevel || 7);
      
      const d = todayLog.dietLog || todayLog.diet;
      setDiet({
        breakfast: Array.isArray(d?.breakfast) ? d.breakfast : [],
        lunch: Array.isArray(d?.lunch) ? d.lunch : [],
        dinner: Array.isArray(d?.dinner) ? d.dinner : [],
        snacks: Array.isArray(d?.snacks) ? d.snacks : [],
        totalCalories: d?.totalCalories || 0,
        totalProtein: d?.totalProtein || 0,
      });
      setWeight(todayLog.weight ? String(todayLog.weight) : '');
      setNotes(todayLog.notes || '');
    }
  }, [todayLog]);

  const addFoodItem = (mealKey: string) => {
    const newDiet = { ...diet };
    (newDiet as any)[mealKey] = [...(newDiet as any)[mealKey], { name: '', grams: '', cal: 0, pro: 0 }];
    setDiet(newDiet);
  };

  const updateFoodItem = (mealKey: string, index: number, field: string, value: any) => {
    const newDiet = { ...diet };
    const items = [...(newDiet as any)[mealKey]];
    const oldItem = items[index];
    items[index] = { ...items[index], [field]: value };
    (newDiet as any)[mealKey] = items;
    
    // Auto-calculate totals
    let totalCal = 0;
    let totalPro = 0;
    ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(m => {
      (newDiet as any)[m].forEach((item: any) => {
        totalCal += parseInt(String(item.cal), 10) || 0;
        totalPro += parseInt(String(item.pro), 10) || 0;
      });
    });
    newDiet.totalCalories = totalCal;
    newDiet.totalProtein = totalPro;
    
    setDiet(newDiet);

    // AI AUTO-SCAN: If both name and grams are now present, and we just changed one of them, trigger scan
    const newItem = items[index];
    if (newItem.name && newItem.grams && !newItem.cal && !newItem.isScanning) {
       // We only trigger if it's the first time or if the values are meaningful
       fetchAINutrition(mealKey, index);
    }
  };

  const removeFoodItem = (mealKey: string, index: number) => {
    const newDiet = { ...diet };
    const items = [...(newDiet as any)[mealKey]];
    items.splice(index, 1);
    (newDiet as any)[mealKey] = items;
    setDiet(newDiet);
  };

  const fetchAINutrition = async (mealKey: string, index: number) => {
    const item = (diet as any)[mealKey][index];
    if (!item.name || !item.grams) {
      Alert.alert('Incomplete Data', 'Please enter a food name and quantity (grams) first.');
      return;
    }

    try {
      // Set loading state for this item (using immutable updates)
      const mealItems = [...(diet as any)[mealKey]];
      mealItems[index] = { ...mealItems[index], isScanning: true };
      setDiet({ ...diet, [mealKey]: mealItems });

      const res = await api.post('/ai/estimate-food', { name: item.name, grams: item.grams });
      const data = res.data.data;

      // Update item with AI data (using immutable updates)
      const updatedItems = [...(diet as any)[mealKey]];
      updatedItems[index] = {
        ...updatedItems[index],
        cal: data.calories,
        pro: data.protein,
        vitamins: data.vitamins,
        minerals: data.minerals,
        isScanning: false,
      };

      const finalDiet = { ...diet, [mealKey]: updatedItems };

      // Recalculate totals
      let totalCal = 0;
      let totalPro = 0;
      ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(m => {
        const mealKey = m as keyof typeof diet;
        const currentMealItems = (finalDiet as any)[mealKey] || [];
        currentMealItems.forEach((f: any) => {
          totalCal += parseInt(String(f.cal), 10) || 0;
          totalPro += parseInt(String(f.pro), 10) || 0;
        });
      });
      finalDiet.totalCalories = totalCal;
      finalDiet.totalProtein = totalPro;

      setDiet({ ...finalDiet });
    } catch (err) {
      Alert.alert('AI Error', 'Failed to fetch nutritional insights. Please check your connection.');
      const mealItems = [...(diet as any)[mealKey]];
      if (mealItems[index]) {
        mealItems[index] = { ...mealItems[index], isScanning: false };
        setDiet({ ...diet, [mealKey]: mealItems });
      }
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Transform diet data to match backend schema (calories, protein, and number types)
      const transformMeal = (items: any[]) => 
        items.map(item => ({
          name: item.name,
          grams: parseFloat(item.grams) || undefined,
          calories: parseInt(String(item.cal), 10) || 0,
          protein: parseInt(String(item.pro), 10) || 0,
        }));

      const payload = {
        date: logDate,
        mood,
        energyLevel: parseInt(String(energyLevel), 10),
        weight: parseFloat(weight) || undefined,
        notes,
        diet: {
          breakfast: transformMeal(diet.breakfast),
          lunch: transformMeal(diet.lunch),
          dinner: transformMeal(diet.dinner),
          snacks: transformMeal(diet.snacks),
          totalCalories: diet.totalCalories,
          totalProtein: diet.totalProtein,
        },
        workout: [],
      };

      const result = await dispatch(createDailyLogThunk(payload));
      if (createDailyLogThunk.fulfilled.match(result)) {
        Alert.alert('Success', 'Your daily flow has been logged. Mastery points earned!');
        router.push('/(tabs)' as any);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to log your daily progress. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Custom Header */}
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
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={{ fontSize: 17, fontWeight: '900', color: colors.textPrimary, letterSpacing: 0.5 }}>DAILY JOURNAL</Text>
          <TouchableOpacity onPress={() => router.push('/notifications' as any)}>
            <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <LinearGradient colors={[`${colors.primary}10`, 'transparent']} style={{ padding: 24, paddingTop: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="calendar" size={16} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 2 }}>REFLECTIVE PRACTICE</Text>
            </View>
            <Text style={{ color: colors.textPrimary, fontSize: 32, fontWeight: '900' }}>Self-Mastery Log</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 8, fontWeight: '500' }}>
              How did your mind and body flow today?
            </Text>
          </LinearGradient>

          <View style={{ paddingHorizontal: 24 }}>
            {/* Mood & Energy Section */}
            <View style={{ backgroundColor: colors.bgSurface, borderRadius: 24, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '800', marginBottom: 20 }}>Mindset & Vitality</Text>
              
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '800', marginBottom: 12, letterSpacing: 1 }}>CURRENT VIBE</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
                {MOODS.map((m) => (
                  <TouchableOpacity 
                    key={m.label} 
                    onPress={() => setMood(m.icon)}
                    style={{ 
                      alignItems: 'center', 
                      backgroundColor: mood === m.icon ? `${colors.primary}10` : 'transparent',
                      padding: 10,
                      borderRadius: 16,
                      borderWidth: mood === m.icon ? 1 : 0,
                      borderColor: colors.primary
                    }}
                  >
                    <Ionicons name={m.icon as any} size={28} color={mood === m.icon ? colors.primary : colors.textMuted} />
                    <Text style={{ fontSize: 10, marginTop: 4, fontWeight: '700', color: mood === m.icon ? colors.primary : colors.textMuted }}>{m.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '800', marginBottom: 12, letterSpacing: 1 }}>ENERGY LEVEL ({energyLevel}/10)</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                  <TouchableOpacity 
                    key={v} 
                    onPress={() => setEnergyLevel(v)}
                    style={{ 
                      flex: 1, 
                      height: 40, 
                      borderRadius: 8, 
                      backgroundColor: energyLevel >= v ? colors.primary : (isDark ? colors.bg : '#f0f0f0'),
                      opacity: energyLevel >= v ? 1 - (10 - v) * 0.05 : 1
                    }} 
                  />
                ))}
              </View>
            </View>

            {/* Diet Section */}
            <View style={{ backgroundColor: colors.bgSurface, borderRadius: 24, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '800', marginBottom: 20 }}>Nourishment Tracker</Text>
              
              <View style={{ gap: 24 }}>
                {['breakfast', 'lunch', 'dinner', 'snacks'].map((mealKey) => (
                  <View key={mealKey}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '900', letterSpacing: 1 }}>{mealKey.toUpperCase()}</Text>
                      <TouchableOpacity 
                        onPress={() => addFoodItem(mealKey)}
                        style={{ backgroundColor: `${colors.primary}10`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}
                      >
                        <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>+ ADD FOOD</Text>
                      </TouchableOpacity>
                    </View>

                    {(diet[mealKey as keyof typeof diet] as any[])?.map((item: any, idx: number) => (
                      <View key={idx} style={{ backgroundColor: colors.bg, borderRadius: 16, padding: 12, marginBottom: 8, gap: 10 }}>
                        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                          <TextInput 
                            value={item.name}
                            onChangeText={(v) => updateFoodItem(mealKey, idx, 'name', v)}
                            placeholder="Food name"
                            placeholderTextColor={colors.textMuted}
                            style={{ flex: 1, paddingVertical: 8, fontWeight: '700', color: colors.textPrimary }}
                          />
                          <TouchableOpacity 
                            onPress={() => fetchAINutrition(mealKey, idx)}
                            disabled={item.isScanning}
                            style={{ backgroundColor: `${colors.action}20`, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center' }}
                          >
                            {item.isScanning ? (
                              <ActivityIndicator size="small" color={colors.action} />
                            ) : (
                              <>
                                <Ionicons name="sparkles" size={14} color={colors.action} style={{ marginRight: 4 }} />
                                <Text style={{ color: colors.action, fontSize: 10, fontWeight: '900' }}>AI SCAN</Text>
                              </>
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => removeFoodItem(mealKey, idx)}>
                            <Ionicons name="trash-outline" size={18} color="#ff4444" />
                          </TouchableOpacity>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <View style={{ flex: 1, backgroundColor: colors.bgSurface, borderRadius: 8, paddingHorizontal: 8 }}>
                             <TextInput value={item.grams} onChangeText={(v) => updateFoodItem(mealKey, idx, 'grams', v)} placeholder="Grams" placeholderTextColor={colors.textMuted} keyboardType="numeric" style={{ fontSize: 11, paddingVertical: 6, fontWeight: '700', color: colors.textPrimary }} />
                          </View>
                          <View style={{ flex: 1, backgroundColor: colors.bgSurface, borderRadius: 8, paddingHorizontal: 8 }}>
                             <TextInput value={String(item.cal || '')} onChangeText={(v) => updateFoodItem(mealKey, idx, 'cal', v)} placeholder="Kcal" placeholderTextColor={colors.textMuted} keyboardType="numeric" style={{ fontSize: 11, paddingVertical: 6, fontWeight: '700', color: colors.textPrimary }} />
                          </View>
                          <View style={{ flex: 1, backgroundColor: colors.bgSurface, borderRadius: 8, paddingHorizontal: 8 }}>
                             <TextInput value={String(item.pro || '')} onChangeText={(v) => updateFoodItem(mealKey, idx, 'pro', v)} placeholder="Protein" placeholderTextColor={colors.textMuted} keyboardType="numeric" style={{ fontSize: 11, paddingVertical: 6, fontWeight: '700', color: colors.textPrimary }} />
                          </View>
                        </View>

                        {/* Vitamins & Minerals Capsules */}
                        {(item.vitamins || item.minerals) && (
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                            {item.vitamins?.map((v: string) => (
                              <View key={v} style={{ backgroundColor: `${colors.primary}10`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                                <Text style={{ fontSize: 9, fontWeight: '800', color: colors.primary }}>{v.toUpperCase()}</Text>
                              </View>
                            ))}
                            {item.minerals?.map((m: string) => (
                              <View key={m} style={{ backgroundColor: isDark ? '#1E2A22' : '#edf2ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                                <Text style={{ fontSize: 9, fontWeight: '800', color: isDark ? colors.action : '#4c6ef5' }}>{m.toUpperCase()}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    ))}
                    {(!(diet[mealKey as keyof typeof diet] as any[]) || (diet[mealKey as keyof typeof diet] as any[]).length === 0) && (
                      <Text style={{ fontSize: 12, color: colors.textMuted, fontStyle: 'italic', marginLeft: 4 }}>No items added yet.</Text>
                    )}
                  </View>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 32, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.border }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '800', marginBottom: 4 }}>TOTAL KCAL</Text>
                  <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '900' }}>{diet.totalCalories}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '800', marginBottom: 4 }}>PROTEIN (G)</Text>
                  <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '900' }}>{diet.totalProtein}g</Text>
                </View>
              </View>
            </View>

            {/* Weight & Notes */}
            <View style={{ backgroundColor: colors.bgSurface, borderRadius: 24, padding: 24, marginBottom: 32, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '800', marginBottom: 20 }}>Other Metrics</Text>
              
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '800', marginBottom: 8, letterSpacing: 1 }}>MORNING WEIGHT (KG)</Text>
              <TextInput 
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                placeholder="75.5"
                placeholderTextColor={colors.textMuted}
                style={{ backgroundColor: colors.bg, borderRadius: 12, padding: 14, color: colors.textPrimary, fontWeight: '800', marginBottom: 20 }}
              />

              <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '800', marginBottom: 8, letterSpacing: 1 }}>JOURNAL NOTES</Text>
              <TextInput 
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                placeholder="Any special insights from your flow today?"
                placeholderTextColor={colors.textMuted}
                style={{ backgroundColor: colors.bg, borderRadius: 12, padding: 16, color: colors.textPrimary, fontWeight: '600', height: 100, textAlignVertical: 'top' }}
              />
            </View>

            <TouchableOpacity onPress={handleSubmit} disabled={loading} activeOpacity={0.9}>
              <LinearGradient 
                colors={[colors.action, colors.action + 'BB']}
                style={{ borderRadius: 20, padding: 20, alignItems: 'center', shadowColor: colors.action, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 }}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 1 }}>SAVE DAILY DISCOVERY</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

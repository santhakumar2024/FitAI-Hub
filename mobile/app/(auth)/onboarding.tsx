// app/(auth)/onboarding.tsx
// Mastery Onboarding — 5-Step Premium Flow

import React, { useState } from 'react';
import { 
  View, Text, TouchableOpacity, TextInput, 
  ActivityIndicator, Alert, ScrollView, Dimensions, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '../../store/slices/userSlice';
import { AppDispatch, RootState } from '../../store';
import { useTheme } from '../../hooks/useTheme';

const { width } = Dimensions.get('window');

const GOAL_OPTIONS = [
  { id: 'weight_loss', title: 'Weight Loss', icon: 'trending-down-outline' },
  { id: 'muscle_gain', title: 'Muscle Gain', icon: 'barbell-outline' },
  { id: 'endurance', title: 'Endurance', icon: 'infinite-outline' },
  { id: 'flexibility', title: 'Flexibility', icon: 'body-outline' },
];

const EXPERIENCE_LEVELS = [
  { id: 'beginner', title: 'Beginner', desc: 'Starting out', icon: 'egg-outline' },
  { id: 'intermediate', title: 'Intermediate', desc: 'Regular training', icon: 'flame-outline' },
  { id: 'advanced', title: 'Advanced', desc: 'High capability', icon: 'trophy-outline' },
];

export default function OnboardingScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading } = useSelector((state: RootState) => state.user);
  const { colors, isDark } = useTheme();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Bio
    age: '',
    gender: 'male',
    height: '',
    weight: '',
    work: '',
    jobNature: 'sedentary',
    
    // Step 2: Medical (PAR-Q)
    medicalScreening: {
      heartCondition: false,
      chestPain: false,
      dizziness: false,
      jointProblem: false,
      pregnancy: false,
      medications: false,
    },
    customMedicalCondition: '',
    
    // Step 3: Goals
    goals: [] as string[],
    targetWeight: '',
    timeline: '3 months',
    motivationLevel: 8,
    
    // Step 4: Baseline
    experienceLevel: 'beginner',
    recentActivity: 0,
    pushupTest: '',
    squatTest: '',
    injuries: [] as string[],
    
    // Step 5: Constraints
    workoutLocation: 'gym',
    equipmentAccess: [] as string[],
    daysPerWeek: 3,
    timePerSession: 45,
    trainingStyle: 'lifting',
    themePreference: 'light' as 'light' | 'midnight',
  });

  const nextStep = () => {
    if (step < 6) setStep(step + 1);
    else handleComplete();
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = async () => {
    const medConditions = [];
    if (formData.customMedicalCondition) medConditions.push(formData.customMedicalCondition);

    const payload = {
      ...formData,
      medicalConditions: medConditions,
      age: parseInt(formData.age, 10) || undefined,
      height: parseFloat(formData.height) || undefined,
      weight: parseFloat(formData.weight) || undefined,
      targetWeight: parseFloat(formData.targetWeight) || undefined,
      pushupTest: parseInt(formData.pushupTest, 10) || undefined,
      squatTest: parseInt(formData.squatTest, 10) || undefined,
    };

    const result = await dispatch(updateProfile(payload));
    if (updateProfile.fulfilled.match(result)) {
      Alert.alert('Mastery Initiated', 'Welcome to the path of peak performance. Your AI plan is being architected.');
      router.replace('/(tabs)');
    }
  };

  const renderProgressBar = () => (
    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 40 }}>
      {[1, 2, 3, 4, 5, 6].map((s) => (
        <View key={s} style={{ 
          flex: 1, height: 6, borderRadius: 3, 
          backgroundColor: step >= s ? colors.primary : colors.bg,
          opacity: step >= s ? 1 : 0.3
        }} />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[`${colors.primary}15`, 'transparent']} style={{ flex: 1, padding: 24 }}>
          
          <View style={{ marginTop: 20 }}>
            {renderProgressBar()}
            <Text style={{ fontSize: 13, fontWeight: '900', color: colors.primary, letterSpacing: 2, marginBottom: 8 }}>
              PHASE 0{step}
            </Text>
          </View>

          {/* STEP 1: BIO */}
          {step === 1 && (
            <View>
              <Text style={{ fontSize: 28, fontWeight: '900', color: colors.textPrimary, marginBottom: 8 }}>Physical Foundation</Text>
              <Text style={{ color: colors.textSecondary, marginBottom: 32 }}>Let's calibrate your starting metrics.</Text>

              <View style={{ gap: 20 }}>
                <View>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textSecondary, marginBottom: 8 }}>AGE</Text>
                  <TextInput 
                    value={formData.age}
                    onChangeText={(v) => setFormData({ ...formData, age: v })}
                    placeholder="25"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    style={{ backgroundColor: colors.bgSurface, borderRadius: 16, padding: 16, fontWeight: '700', color: colors.textPrimary, borderWidth: 1, borderColor: colors.border }}
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textSecondary, marginBottom: 8 }}>HEIGHT (CM)</Text>
                    <TextInput 
                      value={formData.height}
                      onChangeText={(v) => setFormData({ ...formData, height: v })}
                      placeholder="175"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      style={{ backgroundColor: colors.bgSurface, borderRadius: 16, padding: 16, fontWeight: '700', color: colors.textPrimary, borderWidth: 1, borderColor: colors.border }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textSecondary, marginBottom: 8 }}>WEIGHT (KG)</Text>
                    <TextInput 
                      value={formData.weight}
                      onChangeText={(v) => setFormData({ ...formData, weight: v })}
                      placeholder="70"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      style={{ backgroundColor: colors.bgSurface, borderRadius: 16, padding: 16, fontWeight: '700', color: colors.textPrimary, borderWidth: 1, borderColor: colors.border }}
                    />
                  </View>
                </View>
                <View>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textSecondary, marginBottom: 12 }}>JOB NATURE</Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    {['sedentary', 'active'].map((opt) => (
                      <TouchableOpacity 
                        key={opt}
                        onPress={() => setFormData({ ...formData, jobNature: opt })}
                        style={{ flex: 1, padding: 16, borderRadius: 16, alignItems: 'center', backgroundColor: formData.jobNature === opt ? colors.primary : colors.bgSurface, borderWidth: 1, borderColor: formData.jobNature === opt ? colors.primary : colors.border }}
                      >
                        <Text style={{ color: formData.jobNature === opt ? 'white' : colors.textPrimary, fontWeight: '800', textTransform: 'capitalize' }}>{opt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* STEP 2: MEDICAL */}
          {step === 2 && (
            <View>
              <Text style={{ fontSize: 28, fontWeight: '900', color: colors.textPrimary, marginBottom: 8 }}>Safety Assessment</Text>
              <Text style={{ color: colors.textSecondary, marginBottom: 32 }}>Check any that apply to you. (PAR-Q+)</Text>

              <View style={{ gap: 12 }}>
                {[
                  { id: 'heartCondition', label: 'Doctor said I have a heart condition' },
                  { id: 'chestPain', label: 'Chest pain during physical activity' },
                  { id: 'dizziness', label: 'Loss of balance due to dizziness' },
                  { id: 'jointProblem', label: 'Bone or joint problem' },
                  { id: 'pregnancy', label: 'Currently pregnant or past 6 months' },
                  { id: 'medications', label: 'Taking chronic medications' },
                ].map((item) => (
                  <TouchableOpacity 
                    key={item.id}
                    onPress={() => setFormData({ 
                      ...formData, 
                      medicalScreening: { ...formData.medicalScreening, [item.id]: !formData.medicalScreening[item.id as keyof typeof formData.medicalScreening] } 
                    })}
                    style={{ 
                      flexDirection: 'row', alignItems: 'center', backgroundColor: formData.medicalScreening[item.id as keyof typeof formData.medicalScreening] ? 'rgba(255, 107, 107, 0.1)' : colors.bgSurface, 
                      padding: 16, borderRadius: 16, borderWidth: 1, borderColor: formData.medicalScreening[item.id as keyof typeof formData.medicalScreening] ? '#FF6B6B' : colors.border 
                    }}
                  >
                    <Ionicons 
                      name={formData.medicalScreening[item.id as keyof typeof formData.medicalScreening] ? "alert-circle" : "ellipse-outline"} 
                      size={24} color={formData.medicalScreening[item.id as keyof typeof formData.medicalScreening] ? '#FF6B6B' : colors.textMuted} 
                      style={{ marginRight: 16 }} 
                    />
                    <Text style={{ flex: 1, fontWeight: '700', color: colors.textPrimary }}>{item.label}</Text>
                  </TouchableOpacity>
                ))}

                <View style={{ marginTop: 12 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textSecondary, marginBottom: 8, marginLeft: 4 }}>OTHER CONDITIONS</Text>
                  <TextInput 
                    value={formData.customMedicalCondition}
                    onChangeText={(v) => setFormData({ ...formData, customMedicalCondition: v })}
                    placeholder="Type any other health concerns..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    style={{ backgroundColor: colors.bgSurface, borderRadius: 16, padding: 16, minHeight: 80, fontWeight: '600', color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, textAlignVertical: 'top' }}
                  />
                </View>
              </View>
            </View>
          )}

          {/* STEP 3: GOALS */}
          {step === 3 && (
            <View>
              <Text style={{ fontSize: 28, fontWeight: '900', color: colors.textPrimary, marginBottom: 8 }}>Primary Objectives</Text>
              <Text style={{ color: colors.textSecondary, marginBottom: 32 }}>What are your main points of focus? (Select all that apply)</Text>

              <View style={{ gap: 12 }}>
                {GOAL_OPTIONS.map((opt) => {
                  const isSelected = formData.goals.includes(opt.id);
                  return (
                    <TouchableOpacity 
                      key={opt.id}
                      onPress={() => {
                        const newGoals = isSelected 
                          ? formData.goals.filter(g => g !== opt.id)
                          : [...formData.goals, opt.id];
                        setFormData({ ...formData, goals: newGoals });
                      }}
                      style={{ 
                        flexDirection: 'row', alignItems: 'center', backgroundColor: isSelected ? `${colors.primary}10` : colors.bgSurface, 
                        padding: 20, borderRadius: 20, borderWidth: 1, borderColor: isSelected ? colors.primary : colors.border 
                      }}
                    >
                      <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: isSelected ? colors.primary : colors.bg, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                        <Ionicons name={opt.icon as any} size={24} color={isSelected ? 'white' : colors.textPrimary} />
                      </View>
                      <Text style={{ flex: 1, fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>{opt.title}</Text>
                      {isSelected && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* STEP 4: BASELINE */}
          {step === 4 && (
            <View>
              <Text style={{ fontSize: 28, fontWeight: '900', color: colors.textPrimary, marginBottom: 8 }}>Capability Check</Text>
              <Text style={{ color: colors.textSecondary, marginBottom: 32 }}>Your current experience level.</Text>

              <View style={{ gap: 12 }}>
                {EXPERIENCE_LEVELS.map((opt) => (
                  <TouchableOpacity 
                    key={opt.id}
                    onPress={() => setFormData({ ...formData, experienceLevel: opt.id })}
                    style={{ 
                      flexDirection: 'row', alignItems: 'center', backgroundColor: formData.experienceLevel === opt.id ? `${colors.primary}10` : colors.bgSurface, 
                      padding: 20, borderRadius: 20, borderWidth: 1, borderColor: formData.experienceLevel === opt.id ? colors.primary : colors.border 
                    }}
                  >
                    <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: formData.experienceLevel === opt.id ? colors.primary : colors.bg, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                      <Ionicons name={opt.icon as any} size={24} color={formData.experienceLevel === opt.id ? 'white' : colors.textPrimary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>{opt.title}</Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary }}>{opt.desc}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* STEP 5: CONSTRAINTS */}
          {step === 5 && (
            <View>
              <Text style={{ fontSize: 28, fontWeight: '900', color: colors.textPrimary, marginBottom: 8 }}>Environment</Text>
              <Text style={{ color: colors.textSecondary, marginBottom: 32 }}>Where and how will you train?</Text>

              <View style={{ gap: 20 }}>
                <View>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textSecondary, marginBottom: 12 }}>LOCATION</Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    {['home', 'gym', 'outdoors'].map((opt) => (
                      <TouchableOpacity 
                        key={opt}
                        onPress={() => setFormData({ ...formData, workoutLocation: opt })}
                        style={{ flex: 1, padding: 16, borderRadius: 16, alignItems: 'center', backgroundColor: formData.workoutLocation === opt ? colors.primary : colors.bgSurface, borderWidth: 1, borderColor: formData.workoutLocation === opt ? colors.primary : colors.border }}
                      >
                        <Text style={{ color: formData.workoutLocation === opt ? 'white' : colors.textPrimary, fontWeight: '800', fontSize: 11, textTransform: 'uppercase' }}>{opt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textSecondary, marginBottom: 12 }}>SCHEDULE (DAYS / WEEK)</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                      <TouchableOpacity 
                        key={d}
                        onPress={() => setFormData({ ...formData, daysPerWeek: d })}
                        style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: formData.daysPerWeek === d ? colors.primary : colors.bgSurface, borderWidth: 1, borderColor: formData.daysPerWeek === d ? colors.primary : colors.border }}
                      >
                        <Text style={{ color: formData.daysPerWeek === d ? 'white' : colors.textPrimary, fontWeight: '900' }}>{d}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* STEP 6: AESTHETIC */}
          {step === 6 && (
            <View>
              <Text style={{ fontSize: 28, fontWeight: '900', color: colors.textPrimary, marginBottom: 8 }}>Final Vibe</Text>
              <Text style={{ color: colors.textSecondary, marginBottom: 32 }}>Choose your training environment aesthetic.</Text>

              <View style={{ gap: 16 }}>
                <TouchableOpacity 
                  onPress={() => setFormData({ ...formData, themePreference: 'light' })}
                  style={{ 
                    padding: 24, borderRadius: 24, backgroundColor: 'white', 
                    borderWidth: 2, borderColor: formData.themePreference === 'light' ? colors.primary : '#eee' 
                  }}
                >
                  <Ionicons name="sunny-outline" size={32} color={colors.primary} style={{ marginBottom: 12 }} />
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#1A1C19' }}>Light Forest</Text>
                  <Text style={{ color: '#444', fontSize: 13 }}>Clean, bright, and energizing for day training.</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => setFormData({ ...formData, themePreference: 'midnight' })}
                  style={{ 
                    padding: 24, borderRadius: 24, backgroundColor: '#121B14', 
                    borderWidth: 2, borderColor: formData.themePreference === 'midnight' ? '#8FC0A9' : '#1e2a22' 
                  }}
                >
                  <Ionicons name="moon-outline" size={32} color="#8FC0A9" style={{ marginBottom: 12 }} />
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#E8F0EA' }}>Midnight Forest</Text>
                  <Text style={{ color: '#A0AFA3', fontSize: 13 }}>Calming, premium, and focused dark aesthetic.</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Navigation Buttons */}
          <View style={{ marginTop: 40, paddingBottom: 40, flexDirection: 'row', gap: 12 }}>
            {step > 1 && (
              <TouchableOpacity 
                onPress={prevStep}
                style={{ flex: 1, padding: 18, borderRadius: 20, alignItems: 'center', backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }}
              >
                <Text style={{ color: colors.textPrimary, fontWeight: '800' }}>BACK</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              onPress={nextStep}
              disabled={isLoading}
              style={{ flex: 2, padding: 18, borderRadius: 20, alignItems: 'center', backgroundColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 }}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 1 }}>
                  {step === 6 ? 'COMPLETE ASSESSMENT' : 'CONTINUE MASTERY'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
}

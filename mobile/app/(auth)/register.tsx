// app/(auth)/register.tsx
// Register — Forest Green & Sage Theme Overhaul

import React, { useState } from 'react';
import { 
  View, Text, TouchableOpacity, TextInput, 
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { registerThunk } from '../../store/slices/authSlice';
import { AppDispatch, RootState } from '../../store';
import { useTheme } from '../../hooks/useTheme';

const { width } = Dimensions.get('window');

const ROLES = [
  { id: 'NORMAL_USER', title: 'Mastery Seeker', desc: 'Personalized AI coaching', icon: 'sparkles-outline' },
  { id: 'COACH', title: 'Flow Architect', desc: 'Manage your athletes', icon: 'fitness-outline' },
];

export default function RegisterScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading } = useSelector((state: RootState) => state.auth);
  const { colors, isDark } = useTheme();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'NORMAL_USER'
  });

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      Alert.alert('Incomplete Profile', 'Please complete all required fields to begin your journey.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Security Mismatch', 'Your passwords do not match. Please re-enter them carefully.');
      return;
    }

    const result = await dispatch(registerThunk(formData));
    if (registerThunk.fulfilled.match(result)) {
      router.replace('/(auth)/onboarding' as any);
    } else {
      Alert.alert('Enrollment Error', 'We encountered an error during account creation. Please try again.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <LinearGradient colors={[`${colors.primary}15`, 'transparent']} style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
            
            {/* Multi-step Header */}
            <View style={{ alignItems: 'center', marginBottom: 40 }}>
              <View style={{ backgroundColor: colors.primary, width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOpacity: 0.2, shadowRadius: 15, elevation: 8, marginBottom: 20 }}>
                <Ionicons name="sparkles" size={32} color="white" />
              </View>
              <Text style={{ fontSize: 28, fontWeight: '900', color: colors.textPrimary }}>Join FitAI Hub</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                {[1, 2].map((s) => (
                  <View key={s} style={{ 
                    width: 24, height: 4, borderRadius: 2, 
                    backgroundColor: step >= s ? colors.primary : colors.textMuted,
                    marginHorizontal: 4,
                    opacity: step === s ? 1 : 0.3
                  }} />
                ))}
              </View>
            </View>

            {/* Step 1: Personal Details */}
            {step === 1 && (
              <View style={{ backgroundColor: colors.bgSurface, borderRadius: 32, padding: 24, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 }}>
                <Text style={{ fontSize: 13, fontWeight: '900', color: colors.textMuted, letterSpacing: 2, marginBottom: 24 }}>IDENTITY PROFILE</Text>

                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textSecondary, marginBottom: 8, letterSpacing: 1 }}>FULL NAME</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: 16, paddingHorizontal: 16 }}>
                    <Ionicons name="person-outline" size={20} color={colors.primary} style={{ marginRight: 12 }} />
                    <TextInput 
                      value={formData.name}
                      onChangeText={(v) => setFormData({ ...formData, name: v })}
                      placeholder="Santhakumar J.S"
                      placeholderTextColor={colors.textMuted}
                      style={{ flex: 1, paddingVertical: 14, fontWeight: '600', color: colors.textPrimary }}
                    />
                  </View>
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textSecondary, marginBottom: 8, letterSpacing: 1 }}>EMAIL ADDRESS</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: 16, paddingHorizontal: 16 }}>
                    <Ionicons name="mail-outline" size={20} color={colors.primary} style={{ marginRight: 12 }} />
                    <TextInput 
                      value={formData.email}
                      onChangeText={(v) => setFormData({ ...formData, email: v })}
                      placeholder="santhakumar@fitai.com"
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="none"
                      style={{ flex: 1, paddingVertical: 14, fontWeight: '600', color: colors.textPrimary }}
                    />
                  </View>
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textSecondary, marginBottom: 8, letterSpacing: 1 }}>SECURITY KEY</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: 16, paddingHorizontal: 16 }}>
                    <Ionicons name="lock-closed-outline" size={20} color={colors.primary} style={{ marginRight: 12 }} />
                    <TextInput 
                      value={formData.password}
                      onChangeText={(v) => setFormData({ ...formData, password: v })}
                      placeholder="********"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry
                      style={{ flex: 1, paddingVertical: 14, fontWeight: '600', color: colors.textPrimary }}
                    />
                  </View>
                </View>

                <View style={{ marginBottom: 32 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textSecondary, marginBottom: 8, letterSpacing: 1 }}>CONFIRM SECURITY KEY</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: 16, paddingHorizontal: 16 }}>
                    <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} style={{ marginRight: 12 }} />
                    <TextInput 
                      value={formData.confirmPassword}
                      onChangeText={(v) => setFormData({ ...formData, confirmPassword: v })}
                      placeholder="********"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry
                      style={{ flex: 1, paddingVertical: 14, fontWeight: '600', color: colors.textPrimary }}
                    />
                  </View>
                </View>

                <TouchableOpacity 
                  onPress={() => setStep(2)} 
                  activeOpacity={0.9}
                  style={{ backgroundColor: colors.primary, borderRadius: 20, padding: 18, alignItems: 'center', shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 }}
                >
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 1 }}>CONTINUE MASTERY</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 2: Role Selection */}
            {step === 2 && (
              <View style={{ backgroundColor: colors.bgSurface, borderRadius: 32, padding: 24, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 }}>
                <Text style={{ fontSize: 13, fontWeight: '900', color: colors.textMuted, letterSpacing: 2, marginBottom: 24 }}>SELECT YOUR PURPOSE</Text>

                {ROLES.map((role) => (
                  <TouchableOpacity 
                    key={role.id}
                    onPress={() => setFormData({ ...formData, role: role.id })}
                    style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      backgroundColor: formData.role === role.id ? `${colors.primary}10` : colors.bgSurface, 
                      padding: 20, 
                      borderRadius: 24, 
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: formData.role === role.id ? colors.primary : colors.border
                    }}
                  >
                    <View style={{ backgroundColor: formData.role === role.id ? colors.primary : colors.bg, width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                      <Ionicons name={role.icon as any} size={22} color={formData.role === role.id ? 'white' : colors.textPrimary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '900', color: colors.textPrimary }}>{role.title}</Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{role.desc}</Text>
                    </View>
                    {formData.role === role.id && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                ))}

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
                  <TouchableOpacity 
                    onPress={() => setStep(1)} 
                    style={{ flex: 1, backgroundColor: colors.bg, borderRadius: 20, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}
                  >
                    <Text style={{ color: colors.textPrimary, fontWeight: '800' }}>BACK</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={handleRegister} 
                    disabled={isLoading}
                    style={{ flex: 2, backgroundColor: colors.primary, borderRadius: 20, padding: 18, alignItems: 'center', shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 }}
                  >
                    {isLoading ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 1 }}>JOIN NOW</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Footer Navigation */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 40, marginBottom: 40 }}>
              <Text style={{ color: colors.textSecondary, fontWeight: '500' }}>Already on this path?</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={{ color: colors.primary, fontWeight: '800', marginLeft: 8 }}>RESUME JOURNEY</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

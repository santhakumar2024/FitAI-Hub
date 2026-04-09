// app/(auth)/register.tsx
// Register — with real-time password validation & role selection

import React, { useState, useMemo } from 'react';
import { 
  View, Text, TouchableOpacity, TextInput, 
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { registerThunk } from '../../store/slices/authSlice';
import { AppDispatch, RootState } from '../../store';
import { useTheme } from '../../hooks/useTheme';

// ─── Password Rules ───────────────────────────────────────────────────────────
const PASSWORD_RULES = [
  { id: 'length',    label: '12–16 characters',          test: (p: string) => p.length >= 12 && p.length <= 16 },
  { id: 'upper',     label: 'At least 1 uppercase (A-Z)', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lower',     label: 'At least 1 lowercase (a-z)', test: (p: string) => /[a-z]/.test(p) },
  { id: 'number',    label: 'At least 1 number (0-9)',    test: (p: string) => /[0-9]/.test(p) },
  { id: 'symbol',    label: 'At least 1 symbol (@#$%&*!)',test: (p: string) => /[@#$%&*!]/.test(p) },
];

// ─── Roles ────────────────────────────────────────────────────────────────────
const ROLES = [
  { id: 'NORMAL_USER', title: 'Fitness Member',    desc: 'Personalized AI coaching & workout plans', icon: 'sparkles-outline' },
  { id: 'TRAINER',     title: 'Personal Trainer',  desc: 'Manage clients & assign AI-powered plans', icon: 'fitness-outline' },
  { id: 'GYM_OWNER',  title: 'Gym Owner',          desc: 'Full gym management with P&L dashboard',   icon: 'business-outline' },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function RegisterScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading } = useSelector((state: RootState) => state.auth);
  const { colors } = useTheme();

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [passwordTouched, setPasswordTouched]       = useState(false);
  const [confirmTouched,  setConfirmTouched]         = useState(false);

  const [formData, setFormData] = useState({
    name:            '',
    email:           '',
    password:        '',
    confirmPassword: '',
    phone:           '',
    role:            'NORMAL_USER',
    isFreelance:     false,
  });

  // ── Derived validation ──
  const ruleResults = useMemo(
    () => PASSWORD_RULES.map((r) => ({ ...r, passed: r.test(formData.password) })),
    [formData.password]
  );
  const allRulesPassed   = ruleResults.every((r) => r.passed);
  const passwordsMatch   = formData.password === formData.confirmPassword;
  const confirmMismatch  = confirmTouched && formData.confirmPassword.length > 0 && !passwordsMatch;

  // ── Strength bar ──
  const strengthScore = ruleResults.filter((r) => r.passed).length; // 0-5
  const strengthColor =
    strengthScore <= 1 ? '#ef4444' :
    strengthScore <= 2 ? '#f97316' :
    strengthScore <= 3 ? '#eab308' :
    strengthScore <= 4 ? '#84cc16' : '#22c55e';
  const strengthLabel =
    strengthScore <= 1 ? 'Very Weak' :
    strengthScore <= 2 ? 'Weak' :
    strengthScore <= 3 ? 'Fair' :
    strengthScore <= 4 ? 'Strong' : 'Very Strong';

  // ── Step 1 → Step 2 guard ──
  const handleContinue = () => {
    setPasswordTouched(true);
    setConfirmTouched(true);

    if (!formData.name.trim()) {
      Alert.alert('Missing Name', 'Please enter your full name.');
      return;
    }
    if (!formData.email.trim()) {
      Alert.alert('Missing Email', 'Please enter your email address.');
      return;
    }
    if (!allRulesPassed) {
      Alert.alert('Weak Password', 'Your password does not meet all the requirements listed below.');
      return;
    }
    if (!passwordsMatch) {
      Alert.alert('Password Mismatch', 'Passwords do not match. Please re-enter them carefully.');
      return;
    }
    setStep(2);
  };

  // ── Final registration ──
  const handleRegister = async () => {
    const result = await dispatch(registerThunk(formData));
    if (registerThunk.fulfilled.match(result)) {
      router.replace('/(auth)/onboarding' as any);
    } else {
      const msg = (result.payload as string) ?? 'Account creation failed. Please try again.';
      Alert.alert('Enrollment Error', msg);
    }
  };

  // ── Shared input style ──
  const inputRow = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.bg,
    borderRadius: 16,
    paddingHorizontal: 16,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <LinearGradient colors={[`${colors.primary}15`, 'transparent']} style={{ flex: 1, padding: 24, justifyContent: 'center' }}>

            {/* ── Header ── */}
            <View style={{ alignItems: 'center', marginBottom: 36 }}>
              <View style={{
                backgroundColor: colors.primary, width: 64, height: 64, borderRadius: 20,
                alignItems: 'center', justifyContent: 'center',
                shadowColor: colors.primary, shadowOpacity: 0.25, shadowRadius: 14, elevation: 8, marginBottom: 18,
              }}>
                <Ionicons name="sparkles" size={32} color="white" />
              </View>
              <Text style={{ fontSize: 26, fontWeight: '900', color: colors.textPrimary }}>Join FitAI Hub</Text>

              {/* Step dots */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 6 }}>
                {[1, 2].map((s) => (
                  <View key={s} style={{
                    width: step >= s ? 28 : 8, height: 6, borderRadius: 3,
                    backgroundColor: step >= s ? colors.primary : colors.textMuted,
                    opacity: step === s ? 1 : 0.35,
                  }} />
                ))}
              </View>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 6 }}>Step {step} of 2</Text>
            </View>

            {/* ══════════════════════════════════════════════════ */}
            {/* STEP 1 — Credentials                              */}
            {/* ══════════════════════════════════════════════════ */}
            {step === 1 && (
              <View style={{
                backgroundColor: colors.bgSurface, borderRadius: 28, padding: 22,
                borderWidth: 1, borderColor: colors.border,
                shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
              }}>
                <Text style={{ fontSize: 12, fontWeight: '900', color: colors.textMuted, letterSpacing: 2, marginBottom: 20 }}>
                  IDENTITY PROFILE
                </Text>

                {/* Name */}
                <View style={{ marginBottom: 14 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textSecondary, marginBottom: 7, letterSpacing: 1 }}>FULL NAME</Text>
                  <View style={inputRow}>
                    <Ionicons name="person-outline" size={20} color={colors.primary} style={{ marginRight: 12 }} />
                    <TextInput
                      value={formData.name}
                      onChangeText={(v) => setFormData({ ...formData, name: v })}
                      placeholder="Your full name"
                      placeholderTextColor={colors.textMuted}
                      style={{ flex: 1, paddingVertical: 14, fontWeight: '600', color: colors.textPrimary }}
                    />
                  </View>
                </View>

                {/* Email */}
                <View style={{ marginBottom: 14 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textSecondary, marginBottom: 7, letterSpacing: 1 }}>EMAIL ADDRESS</Text>
                  <View style={inputRow}>
                    <Ionicons name="mail-outline" size={20} color={colors.primary} style={{ marginRight: 12 }} />
                    <TextInput
                      value={formData.email}
                      onChangeText={(v) => setFormData({ ...formData, email: v })}
                      placeholder="you@example.com"
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      style={{ flex: 1, paddingVertical: 14, fontWeight: '600', color: colors.textPrimary }}
                    />
                  </View>
                </View>

                {/* Password */}
                <View style={{ marginBottom: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textSecondary, marginBottom: 7, letterSpacing: 1 }}>PASSWORD</Text>
                  <View style={inputRow}>
                    <Ionicons name="lock-closed-outline" size={20} color={colors.primary} style={{ marginRight: 12 }} />
                    <TextInput
                      value={formData.password}
                      onChangeText={(v) => { setFormData({ ...formData, password: v }); setPasswordTouched(true); }}
                      placeholder="Create a strong password"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry={!showPassword}
                      style={{ flex: 1, paddingVertical: 14, fontWeight: '600', color: colors.textPrimary }}
                    />
                    <TouchableOpacity onPress={() => setShowPassword((p) => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Strength bar */}
                {formData.password.length > 0 && (
                  <View style={{ marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', gap: 4, marginBottom: 4 }}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <View key={i} style={{
                          flex: 1, height: 4, borderRadius: 2,
                          backgroundColor: i <= strengthScore ? strengthColor : colors.border,
                        }} />
                      ))}
                    </View>
                    <Text style={{ fontSize: 11, color: strengthColor, fontWeight: '700' }}>{strengthLabel}</Text>
                  </View>
                )}

                {/* Password rules checklist */}
                {(passwordTouched || formData.password.length > 0) && (
                  <View style={{
                    backgroundColor: colors.bg, borderRadius: 14, padding: 14, marginBottom: 14,
                    borderWidth: 1, borderColor: colors.border,
                  }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 1, marginBottom: 10 }}>
                      PASSWORD REQUIREMENTS
                    </Text>
                    {ruleResults.map((rule) => (
                      <View key={rule.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <Ionicons
                          name={rule.passed ? 'checkmark-circle' : 'ellipse-outline'}
                          size={16}
                          color={rule.passed ? '#22c55e' : colors.textMuted}
                          style={{ marginRight: 8 }}
                        />
                        <Text style={{
                          fontSize: 12, fontWeight: '600',
                          color: rule.passed ? colors.textPrimary : colors.textMuted,
                        }}>
                          {rule.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Confirm Password */}
                <View style={{ marginBottom: 28 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textSecondary, marginBottom: 7, letterSpacing: 1 }}>CONFIRM PASSWORD</Text>
                  <View style={[inputRow, confirmMismatch && { borderWidth: 1.5, borderColor: '#ef4444' }]}>
                    <Ionicons name="shield-checkmark-outline" size={20} color={confirmMismatch ? '#ef4444' : colors.primary} style={{ marginRight: 12 }} />
                    <TextInput
                      value={formData.confirmPassword}
                      onChangeText={(v) => { setFormData({ ...formData, confirmPassword: v }); setConfirmTouched(true); }}
                      placeholder="Re-enter your password"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry={!showConfirm}
                      style={{ flex: 1, paddingVertical: 14, fontWeight: '600', color: colors.textPrimary }}
                    />
                    <TouchableOpacity onPress={() => setShowConfirm((p) => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                  {confirmMismatch && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                      <Ionicons name="alert-circle-outline" size={14} color="#ef4444" style={{ marginRight: 5 }} />
                      <Text style={{ fontSize: 12, color: '#ef4444', fontWeight: '600' }}>Passwords do not match</Text>
                    </View>
                  )}
                  {confirmTouched && formData.confirmPassword.length > 0 && passwordsMatch && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                      <Ionicons name="checkmark-circle-outline" size={14} color="#22c55e" style={{ marginRight: 5 }} />
                      <Text style={{ fontSize: 12, color: '#22c55e', fontWeight: '600' }}>Passwords match</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  onPress={handleContinue}
                  activeOpacity={0.88}
                  style={{
                    backgroundColor: allRulesPassed && passwordsMatch && formData.name && formData.email
                      ? colors.primary : colors.textMuted,
                    borderRadius: 20, padding: 18, alignItems: 'center',
                    shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 1 }}>CONTINUE</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ══════════════════════════════════════════════════ */}
            {/* STEP 2 — Role Selection                           */}
            {/* ══════════════════════════════════════════════════ */}
            {step === 2 && (
              <View style={{
                backgroundColor: colors.bgSurface, borderRadius: 28, padding: 22,
                borderWidth: 1, borderColor: colors.border,
                shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
              }}>
                <Text style={{ fontSize: 12, fontWeight: '900', color: colors.textMuted, letterSpacing: 2, marginBottom: 6 }}>SELECT YOUR ROLE</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 22 }}>Choose the role that best describes you</Text>

                {ROLES.map((role) => (
                  <TouchableOpacity
                    key={role.id}
                    onPress={() => setFormData({ ...formData, role: role.id, isFreelance: false })}
                    style={{
                      flexDirection: 'row', alignItems: 'center',
                      backgroundColor: formData.role === role.id ? `${colors.primary}15` : colors.bgSurface,
                      padding: 20, borderRadius: 22, marginBottom: 12,
                      borderWidth: 1.5,
                      borderColor: formData.role === role.id ? colors.primary : colors.border,
                    }}
                  >
                    <View style={{
                      backgroundColor: formData.role === role.id ? colors.primary : colors.bg,
                      width: 48, height: 48, borderRadius: 16,
                      alignItems: 'center', justifyContent: 'center', marginRight: 16,
                    }}>
                      <Ionicons name={role.icon as any} size={24} color={formData.role === role.id ? 'white' : colors.textPrimary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '900', color: colors.textPrimary }}>{role.title}</Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 3, lineHeight: 17 }}>{role.desc}</Text>
                    </View>
                    {formData.role === role.id && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                  </TouchableOpacity>
                ))}

                {/* Freelance toggle — only for TRAINER */}
                {formData.role === 'TRAINER' && (
                  <TouchableOpacity
                    onPress={() => setFormData({ ...formData, isFreelance: !formData.isFreelance })}
                    style={{
                      flexDirection: 'row', alignItems: 'center',
                      backgroundColor: formData.isFreelance ? `${colors.primary}10` : colors.bg,
                      borderRadius: 18, padding: 16, marginTop: 2, marginBottom: 4,
                      borderWidth: 1,
                      borderColor: formData.isFreelance ? colors.primary : colors.border,
                    }}
                  >
                    <Ionicons
                      name={formData.isFreelance ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={formData.isFreelance ? colors.primary : colors.textMuted}
                      style={{ marginRight: 12 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: colors.textPrimary }}>I'm a Freelance Trainer</Text>
                      <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Not affiliated with a gym — independent trainer</Text>
                    </View>
                  </TouchableOpacity>
                )}

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
                    {isLoading
                      ? <ActivityIndicator color="white" />
                      : <Text style={{ color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 1 }}>JOIN NOW</Text>
                    }
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Footer */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 36, marginBottom: 36 }}>
              <Text style={{ color: colors.textSecondary, fontWeight: '500' }}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={{ color: colors.primary, fontWeight: '800', marginLeft: 8 }}>SIGN IN</Text>
              </TouchableOpacity>
            </View>

          </LinearGradient>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

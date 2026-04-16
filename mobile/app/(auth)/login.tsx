// app/(auth)/login.tsx
// Login — Forest Green & Sage Theme Overhaul

import React, { useState } from 'react';
import { 
  View, Text, TouchableOpacity, TextInput, 
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { loginThunk } from '../../store/slices/authSlice';
import { AppDispatch, RootState } from '../../store';
import { useTheme } from '../../hooks/useTheme';

export default function LoginScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading } = useSelector((state: RootState) => state.auth);
  const { colors, isDark } = useTheme();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Incomplete Credentials', 'Please enter your email and password to continue your journey.');
      return;
    }

    const result = await dispatch(loginThunk({ email, password }));
    if (loginThunk.fulfilled.match(result)) {
      router.replace('/(tabs)');
    } else {
      const msg = (result.payload as string) || 'Entry Denied. Please check your connection and try again.';
      Alert.alert('Entry Denied', msg);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <LinearGradient colors={[`${colors.primary}15`, 'transparent']} style={{ flex: 1, padding: 32, justifyContent: 'center' }}>
            
            {/* Header Branding */}
            <View style={{ alignItems: 'center', marginBottom: 48 }}>
              <View style={{ backgroundColor: colors.primary, width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 15, elevation: 12, marginBottom: 24 }}>
                <Ionicons name="sparkles" size={40} color="white" />
              </View>
              <Text style={{ fontSize: 32, fontWeight: '900', color: colors.textPrimary }}>FitAI Hub</Text>
              <Text style={{ fontSize: 16, color: colors.textSecondary, marginTop: 8, fontWeight: '500' }}>Re-establish your daily mastery</Text>
            </View>

            {/* Form Section */}
            <View style={{ backgroundColor: colors.bgSurface, borderRadius: 32, padding: 32, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 }}>
              <Text style={{ fontSize: 13, fontWeight: '900', color: colors.textMuted, letterSpacing: 2, marginBottom: 24 }}>AUTHENTICATION</Text>

              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textSecondary, marginBottom: 8, letterSpacing: 1 }}>EMAIL ADDRESS</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: 16, paddingHorizontal: 16 }}>
                  <Ionicons name="mail-outline" size={20} color={colors.primary} style={{ marginRight: 12 }} />
                  <TextInput 
                    value={email}
                    onChangeText={setEmail}
                    placeholder="santhakumar@fitai.com"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={{ flex: 1, paddingVertical: 16, fontWeight: '600', color: colors.textPrimary }}
                  />
                </View>
              </View>

              <View style={{ marginBottom: 32 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textSecondary, marginBottom: 8, letterSpacing: 1 }}>SECURITY KEY</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: 16, paddingHorizontal: 16 }}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.primary} style={{ marginRight: 12 }} />
                  <TextInput 
                    value={password}
                    onChangeText={setPassword}
                    placeholder="********"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showPassword}
                    style={{ flex: 1, paddingVertical: 16, fontWeight: '600', color: colors.textPrimary }}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity onPress={handleLogin} disabled={isLoading} activeOpacity={0.9}>
                <LinearGradient 
                  colors={[colors.action, colors.action + 'BB']}
                  style={{ borderRadius: 20, padding: 20, alignItems: 'center', shadowColor: colors.action, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={{ color: 'white', fontSize: 17, fontWeight: '900', letterSpacing: 1 }}>RESUME JOURNEY</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Footer Links */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 40 }}>
              <Text style={{ color: colors.textSecondary, fontWeight: '500' }}>New to mastery?</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={{ color: colors.primary, fontWeight: '800', marginLeft: 8 }}>JOIN THE HUB</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// app/(tabs)/profile.tsx
// Account & Profile — Dynamic Theme Integration

import React, { useState } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, 
  ActivityIndicator, RefreshControl, Dimensions, Alert, Image, Switch
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { logoutThunk } from '../../store/slices/authSlice';
import { updateProfile } from '../../store/slices/userSlice';
import { FONTS } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

const { width } = Dimensions.get('window');

export default function AccountScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { colors, isDark } = useTheme();
  const { user } = useSelector((s: RootState) => s.auth);
  const { profile, isLoading: isUpdating } = useSelector((s: RootState) => s.user);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const toggleTheme = async (val: boolean) => {
    const theme = val ? 'midnight' : 'light';
    await dispatch(updateProfile({ themePreference: theme }));
  };

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to exit your mastery journey?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => {
        dispatch(logoutThunk());
        router.replace('/(auth)/login' as any);
      }}
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Custom Header */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 24, 
        paddingVertical: 16,
        backgroundColor: colors.bgCard,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? '#1e2a22' : '#f0f0f0'
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: '900', color: colors.textPrimary }}>ACCOUNT SETTINGS</Text>
        <TouchableOpacity onPress={() => router.push('/edit_profile' as any)}>
          <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 13, letterSpacing: 1 }}>EDIT</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile Card */}
        <LinearGradient colors={[`${colors.primary}10`, 'transparent']} style={{ padding: 24, paddingTop: 20, alignItems: 'center' }}>
          <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: colors.bgCard, padding: 4, shadowColor: colors.primary, shadowOpacity: 0.1, shadowRadius: 20, elevation: 12, marginBottom: 16 }}>
            <View style={{ flex: 1, borderRadius: 56, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <Ionicons name="person" size={64} color={colors.primary} />
            </View>
          </View>
          <Text style={{ fontSize: 24, fontWeight: '900', color: colors.textPrimary }}>{profile?.name || 'Santhakumar J.S'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 8, borderWidth: 1, borderColor: isDark ? '#2C3A32' : '#eee' }}>
            <Ionicons name="checkmark-circle" size={14} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={{ color: colors.textSecondary, fontWeight: '800', fontSize: 11 }}>{user?.role === 'NORMAL_USER' ? 'MASTERY MEMBER' : user?.role}</Text>
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: 24 }}>
          {/* Subscription Section */}
          <TouchableOpacity 
            activeOpacity={0.9}
            style={{ 
              backgroundColor: colors.bgCard, 
              borderRadius: 24, 
              padding: 24, 
              marginBottom: 32, 
              borderWidth: 1, 
              borderColor: isDark ? '#2C3A32' : colors.primary,
              shadowColor: colors.primary,
              shadowOpacity: 0.05,
              shadowRadius: 10,
              elevation: 4,
              flexDirection: 'row',
              alignItems: 'center'
            }}
          >
            <View style={{ backgroundColor: `${colors.primary}10`, padding: 12, borderRadius: 16, marginRight: 16 }}>
              <Ionicons name="diamond-outline" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 16 }}>Your Mastery Plan</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{profile?.subscription?.status === 'active' ? 'Full Access Active' : 'Free Trial Active'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textPrimary} />
          </TouchableOpacity>

          {/* Preferences Section */}
          <Text style={{ fontSize: 13, fontWeight: '900', color: colors.textMuted, letterSpacing: 2, marginBottom: 16 }}>PREFERENCES</Text>
          <View style={{ backgroundColor: colors.bgCard, borderRadius: 24, padding: 8, marginBottom: 32, borderWidth: 1, borderColor: isDark ? '#2C3A32' : '#eee' }}>
            {[
              { icon: 'notifications-outline', label: 'In-App Alerts', value: notificationsEnabled, setter: setNotificationsEnabled },
              { icon: 'moon-outline', label: 'Dark Aesthetic', value: isDark, setter: toggleTheme },
            ].map((pref, idx) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: idx === 1 ? 0 : 1, borderBottomColor: isDark ? '#2C3A32' : '#f5f5f5' }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                  <Ionicons name={pref.icon as any} size={20} color={colors.primary} />
                </View>
                <Text style={{ flex: 1, color: colors.textPrimary, fontWeight: '700' }}>{pref.label}</Text>
                <Switch value={pref.value} onValueChange={pref.setter} trackColor={{ true: colors.primary }} />
              </View>
            ))}
          </View>

          {/* Mastery Assessment Section */}
          <Text style={{ fontSize: 13, fontWeight: '900', color: colors.textMuted, letterSpacing: 2, marginBottom: 16 }}>MASTERY ASSESSMENT</Text>
          <View style={{ backgroundColor: colors.bgCard, borderRadius: 24, padding: 8, marginBottom: 32, borderWidth: 1, borderColor: isDark ? '#2C3A32' : '#eee' }}>
            {[
              { icon: 'body-outline', label: 'Physical Base', value: `${profile?.age || '—'}y / ${profile?.height || '—'}cm / ${profile?.weight || '—'}kg` },
              { icon: 'medical-outline', label: 'PAR-Q+ Safety', value: profile?.medicalScreening ? 'Verified' : 'Pending', detail: true },
              { icon: 'star-outline', label: 'Core Goal', value: profile?.goalType?.replace(/_/g, ' ')?.toUpperCase() || '—' },
              { icon: 'timer-outline', label: 'Timeline', value: profile?.timeline?.replace(/_/g, ' ')?.toUpperCase() || '—' },
              { icon: 'barbell-outline', label: 'Equipment', value: Array.isArray(profile?.equipmentAccess) ? profile.equipmentAccess.join(', ') : 'No Equipment' },
              { icon: 'location-outline', label: 'Training At', value: profile?.workoutLocation?.toUpperCase() || '—' },
            ].map((item, idx) => (
              <TouchableOpacity key={idx} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: idx === 5 ? 0 : 1, borderBottomColor: isDark ? '#2C3A32' : '#f5f5f5' }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                  <Ionicons name={item.icon as any} size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '800', marginBottom: 2 }}>{item.label.toUpperCase()}</Text>
                  <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{item.value}</Text>
                </View>
                {item.detail && <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
              </TouchableOpacity>
            ))}
          </View>

          {/* Account Detail Section */}
          <Text style={{ fontSize: 13, fontWeight: '900', color: colors.textMuted, letterSpacing: 2, marginBottom: 16 }}>IDENTITY & SECURITY</Text>
          <View style={{ backgroundColor: colors.bgCard, borderRadius: 24, padding: 8, marginBottom: 40, borderWidth: 1, borderColor: isDark ? '#2C3A32' : '#eee' }}>
            {[
              { icon: 'mail-outline', label: 'Email Address', value: profile?.email || '—' },
              { icon: 'phone-portrait-outline', label: 'Mobile Number', value: profile?.phone || '—' },
              { icon: 'briefcase-outline', label: 'Job Nature', value: profile?.jobNature?.replace(/_/g, ' ')?.toUpperCase() || '—' },
              { icon: 'lock-closed-outline', label: 'Change Key', value: '********', action: true },
            ].map((item, idx) => (
              <TouchableOpacity key={idx} disabled={!item.action} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: idx === 3 ? 0 : 1, borderBottomColor: isDark ? '#2C3A32' : '#f5f5f5' }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                  <Ionicons name={item.icon as any} size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '800', marginBottom: 2 }}>{item.label.toUpperCase()}</Text>
                  <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{item.value}</Text>
                </View>
                {item.action && <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity 
            onPress={handleLogout}
            activeOpacity={0.9}
            style={{ 
              backgroundColor: isDark ? '#2c1e1e' : '#fee2e2', 
              padding: 20, 
              borderRadius: 24, 
              alignItems: 'center', 
              borderWidth: 1, 
              borderColor: isDark ? '#4b2a2a' : '#fecaca',
              marginBottom: 40
            }}
          >
            <Text style={{ color: '#ef4444', fontWeight: '900', letterSpacing: 1 }}>SIGN OUT OF JOURNEY</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

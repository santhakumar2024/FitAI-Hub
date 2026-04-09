// app/owner/add-gym.tsx
// Create a new gym (for owners who manage multiple gyms in future)

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { api } from '../../utils/api';

export default function AddGymScreen() {
  const { colors } = useTheme();
  const [saving, setSaving] = useState(false);
  const [gym, setGym] = useState({
    name: '',
    address: '',
    city: '',
    phone: '',
    description: '',
  });

  const Field = ({ label, field, placeholder, multiline = false, keyboard = 'default' }: any) => (
    <View>
      <Text style={{ fontSize: 12, fontWeight: '800', color: colors.textSecondary, marginBottom: 8 }}>{label}</Text>
      <TextInput
        value={(gym as any)[field]}
        onChangeText={(v) => setGym({ ...gym, [field]: v })}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        keyboardType={keyboard}
        style={{
          backgroundColor: colors.bgSurface, padding: 16, borderRadius: 16,
          color: colors.textPrimary, borderWidth: 1, borderColor: colors.border,
          minHeight: multiline ? 90 : undefined, textAlignVertical: multiline ? 'top' : 'auto',
          fontSize: 15,
        }}
      />
    </View>
  );

  const handleCreate = async () => {
    if (!gym.name.trim()) { Alert.alert('Required', 'Gym name is required'); return; }
    setSaving(true);
    try {
      await api.post('/gym', gym);
      Alert.alert('Success! 🎉', 'Your gym has been created successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to create gym';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 15 }}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <View>
              <Text style={{ fontSize: 13, fontWeight: '900', color: colors.primary, letterSpacing: 2 }}>GYM OWNER</Text>
              <Text style={{ fontSize: 24, fontWeight: '900', color: colors.textPrimary }}>Add New Gym</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleCreate}
            disabled={saving}
            style={{ backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14 }}
          >
            {saving
              ? <ActivityIndicator color="white" size="small" />
              : <Text style={{ color: 'white', fontWeight: '800' }}>CREATE</Text>}
          </TouchableOpacity>
        </View>

        <View style={{ padding: 20, gap: 20 }}>
          <Field label="GYM NAME *" field="name" placeholder="e.g. FitZone Elite" />
          <Field label="ADDRESS" field="address" placeholder="123 Street, Area" multiline />
          <View style={{ flexDirection: 'row', gap: 15 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: colors.textSecondary, marginBottom: 8 }}>CITY</Text>
              <TextInput
                value={gym.city}
                onChangeText={(v) => setGym({ ...gym, city: v })}
                placeholder="City"
                placeholderTextColor={colors.textMuted}
                style={{ backgroundColor: colors.bgSurface, padding: 16, borderRadius: 16, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: colors.textSecondary, marginBottom: 8 }}>PHONE</Text>
              <TextInput
                value={gym.phone}
                onChangeText={(v) => setGym({ ...gym, phone: v })}
                placeholder="Phone"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                style={{ backgroundColor: colors.bgSurface, padding: 16, borderRadius: 16, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border }}
              />
            </View>
          </View>
          <Field label="DESCRIPTION" field="description" placeholder="Describe your gym's specialties..." multiline />

          {/* Info */}
          <View style={{ backgroundColor: `${colors.primary}10`, padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            <Ionicons name="information-circle" size={20} color={colors.primary} style={{ marginTop: 1 }} />
            <Text style={{ color: colors.textSecondary, flex: 1, lineHeight: 20 }}>
              After creating the gym you can add trainers and members from the Gym Management screen.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

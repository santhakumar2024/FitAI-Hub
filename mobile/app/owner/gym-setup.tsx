// app/owner/gym-setup.tsx
// Gym Profile Setup & Edit — Updated for multi-gym support

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { api } from '../../utils/api';
import { useDispatch } from 'react-redux';
import { setSelectedGymId } from '../../store/slices/gymSlice';

export default function GymSetupScreen() {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const { gymId } = useLocalSearchParams(); // If editing

  const [gym, setGym] = useState({
    name: '',
    address: '',
    city: '',
    phone: '',
    description: ''
  });
  const [loading, setLoading] = useState(!!gymId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (gymId) {
      fetchGym();
    }
  }, [gymId]);

  const fetchGym = async () => {
    try {
      const res = await api.get(`/gym/${gymId}`);
      setGym(res.data.data);
    } catch (error) {
       console.error('Fetch gym details error:', error);
       Alert.alert('Error', 'Failed to load gym details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!gym.name) {
      Alert.alert('Required', 'Gym name is required');
      return;
    }
    setSaving(true);
    try {
      if (gymId) {
        // Update
        await api.patch(`/gym/${gymId}`, gym);
        Alert.alert('Success', 'Gym profile updated!');
      } else {
        // Create
        const res = await api.post('/gym', gym);
        const newGym = res.data.data;
        dispatch(setSelectedGymId(newGym.id));
        Alert.alert('Success', 'Gym created successfully!');
      }
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save gym details');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 15 }}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={{ fontSize: 24, fontWeight: '900', color: colors.textPrimary }}>
              {gymId ? 'Edit Gym' : 'Add New Gym'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={{ color: colors.primary, fontWeight: '900' }}>{gymId ? 'UPDATE' : 'CREATE'}</Text>}
          </TouchableOpacity>
        </View>

        <View style={{ padding: 20, gap: 20 }}>
          <View>
            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textSecondary, marginBottom: 8 }}>GYM NAME</Text>
            <TextInput 
              value={gym.name}
              onChangeText={(v) => setGym({...gym, name: v})}
              placeholder="e.g. FitZone Elite"
              placeholderTextColor={colors.textMuted}
              style={{ backgroundColor: colors.bgSurface, padding: 16, borderRadius: 16, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border }}
            />
          </View>

          <View>
            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textSecondary, marginBottom: 8 }}>ADDRESS</Text>
            <TextInput 
              value={gym.address}
              onChangeText={(v) => setGym({...gym, address: v})}
              placeholder="123 Street, Area"
              placeholderTextColor={colors.textMuted}
              multiline
              style={{ backgroundColor: colors.bgSurface, padding: 16, borderRadius: 16, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, minHeight: 80, textAlignVertical: 'top' }}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 15 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textSecondary, marginBottom: 8 }}>CITY</Text>
              <TextInput 
                value={gym.city}
                onChangeText={(v) => setGym({...gym, city: v})}
                placeholder="City"
                placeholderTextColor={colors.textMuted}
                style={{ backgroundColor: colors.bgSurface, padding: 16, borderRadius: 16, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textSecondary, marginBottom: 8 }}>PHONE</Text>
              <TextInput 
                value={gym.phone}
                onChangeText={(v) => setGym({...gym, phone: v})}
                placeholder="Phone"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                style={{ backgroundColor: colors.bgSurface, padding: 16, borderRadius: 16, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border }}
              />
            </View>
          </View>

          <View>
            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textSecondary, marginBottom: 8 }}>DESCRIPTION</Text>
            <TextInput 
              value={gym.description}
              onChangeText={(v) => setGym({...gym, description: v})}
              placeholder="Tell members about your gym..."
              placeholderTextColor={colors.textMuted}
              multiline
              style={{ backgroundColor: colors.bgSurface, padding: 16, borderRadius: 16, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, minHeight: 120, textAlignVertical: 'top' }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// app/trainer/add-client.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { api } from '../../utils/api';

export default function AddClientScreen() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientEmail: '',
    notes: ''
  });

  const handleAdd = async () => {
    if (!formData.clientEmail) {
      Alert.alert('Required', 'Please enter client email');
      return;
    }

    setLoading(true);
    try {
      await api.post('/freelancer/clients', formData);
      Alert.alert('Success', 'Client added successfully to your roster!');
      router.back();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to add client';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 15 }}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={{ fontSize: 24, fontWeight: '900', color: colors.textPrimary }}>Add New Client</Text>
        </View>

        <View style={{ padding: 20, gap: 24 }}>
          <View style={{ backgroundColor: `${colors.primary}10`, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: `${colors.primary}30` }}>
            <Ionicons name="information-circle" size={24} color={colors.primary} style={{ marginBottom: 10 }} />
            <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 16 }}>Freelancer Mode</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
              Enter your client's email to add them to your roster. Your client must already have a FitAI account.
            </Text>
          </View>

          <View>
            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textSecondary, marginBottom: 10 }}>CLIENT EMAIL</Text>
            <TextInput 
              value={formData.clientEmail}
              onChangeText={(v) => setFormData({...formData, clientEmail: v})}
              placeholder="client@example.com"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              style={{ backgroundColor: colors.bgSurface, padding: 18, borderRadius: 18, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border }}
            />
          </View>

          <View>
            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textSecondary, marginBottom: 10 }}>INITIAL NOTES (OPTIONAL)</Text>
            <TextInput 
              value={formData.notes}
              onChangeText={(v) => setFormData({...formData, notes: v})}
              placeholder="e.g. Weight loss focus, knee injury history..."
              placeholderTextColor={colors.textMuted}
              multiline
              style={{ backgroundColor: colors.bgSurface, padding: 18, borderRadius: 18, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, minHeight: 120, textAlignVertical: 'top' }}
            />
          </View>

          <TouchableOpacity 
            onPress={handleAdd}
            disabled={loading}
            style={{ 
              backgroundColor: colors.primary, 
              padding: 20, 
              borderRadius: 20, 
              alignItems: 'center',
              marginTop: 10,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 15,
              elevation: 8
            }}
          >
            {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: '900', fontSize: 16 }}>ADD TO MY ROSTER</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

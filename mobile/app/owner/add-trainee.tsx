// app/owner/add-trainee.tsx
// Add a new trainee/member to the gym — Updated for multi-gym support

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { api } from '../../utils/api';

export default function AddTraineeScreen() {
  const { colors } = useTheme();
  const { gymId } = useLocalSearchParams(); // Path parameter from dashboard

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [adding, setAdding] = useState(false);
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  React.useEffect(() => {
    if (gymId) fetchPlans();
  }, [gymId]);

  const fetchPlans = async () => {
    try {
      const res = await api.get(`/gym/${gymId}/plans`);
      const fetched = res.data.data || [];
      setPlans(fetched);
      if (fetched.length > 0) setSelectedPlanId(fetched[0].id);
    } catch (err) {
      console.error('Fetch plans error:', err);
    }
  };

  const handleAdd = async () => {
    if (!gymId) {
      Alert.alert('Error', 'No gym selected');
      return;
    }
    const identifier = method === 'email' ? email.trim() : phone.trim();
    if (!identifier) {
      Alert.alert('Required', `Please enter the member's ${method}`);
      return;
    }
    setAdding(true);
    try {
      const payload = {
        ...(method === 'email' ? { memberEmail: identifier } : { memberPhone: identifier }),
        membershipPlanId: selectedPlanId,
      };
      const res = await api.post(`/gym/${gymId}/members`, payload);
      const name = res.data.data?.memberName || 'Member';
      Alert.alert('Added! 🎉', `${name} has been added to your gym.`, [
        { text: 'Add Another', onPress: () => { setEmail(''); setPhone(''); } },
        { text: 'Done', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to add member';
      Alert.alert('Error', msg);
    } finally {
      setAdding(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 15 }}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 13, fontWeight: '900', color: colors.primary, letterSpacing: 2 }}>GYM OWNER</Text>
            <Text style={{ fontSize: 24, fontWeight: '900', color: colors.textPrimary }}>Add Member</Text>
          </View>
        </View>

        <View style={{ padding: 20 }}>
          {/* Info Banner */}
          <View style={{ backgroundColor: `${colors.primary}10`, padding: 16, borderRadius: 16, marginBottom: 24, flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            <Ionicons name="information-circle" size={20} color={colors.primary} style={{ marginTop: 1 }} />
            <Text style={{ color: colors.textSecondary, flex: 1, lineHeight: 20 }}>
              The trainee must already have a FitAI Hub account with the NORMAL_USER role. Search by their registered email or phone number.
            </Text>
          </View>

          {/* Method Toggle */}
          <Text style={{ fontSize: 12, fontWeight: '800', color: colors.textSecondary, marginBottom: 12 }}>FIND MEMBER BY</Text>
          <View style={{ flexDirection: 'row', backgroundColor: colors.bgSurface, borderRadius: 16, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: colors.border }}>
            {(['email', 'phone'] as const).map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => setMethod(m)}
                style={{
                  flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
                  backgroundColor: method === m ? colors.primary : 'transparent',
                }}
              >
                <Text style={{ color: method === m ? 'white' : colors.textMuted, fontWeight: '800', textTransform: 'capitalize' }}>
                  {m === 'email' ? '📧 Email' : '📱 Phone'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Input */}
          {method === 'email' ? (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: colors.textSecondary, marginBottom: 8 }}>EMAIL ADDRESS</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="member@example.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                style={{
                  backgroundColor: colors.bgSurface, padding: 16, borderRadius: 16,
                  color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, fontSize: 15,
                }}
              />
            </View>
          ) : (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: colors.textSecondary, marginBottom: 8 }}>PHONE NUMBER</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+91 98765 43210"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                style={{
                  backgroundColor: colors.bgSurface, padding: 16, borderRadius: 16,
                  color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, fontSize: 15,
                }}
              />
            </View>
          )}

          {/* Membership Plan Selection */}
          {plans.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: colors.textSecondary, marginBottom: 12 }}>SELECT MEMBERSHIP PLAN</Text>
              <View style={{ gap: 10 }}>
                {plans.map((plan) => (
                  <TouchableOpacity
                    key={plan.id}
                    onPress={() => setSelectedPlanId(plan.id)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgSurface, padding: 16, borderRadius: 16,
                      borderWidth: 2, borderColor: selectedPlanId === plan.id ? colors.primary : colors.border,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>{plan.name}</Text>
                      <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{plan.durationMonths} Months Access</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                       <Text style={{ fontSize: 18, fontWeight: '900', color: colors.primary }}>₹{plan.price}</Text>
                       {selectedPlanId === plan.id && (
                         <Ionicons name="checkmark-circle" size={20} color={colors.primary} style={{ marginTop: 4 }} />
                       )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Add Button */}
          <TouchableOpacity
            onPress={handleAdd}
            disabled={adding}
            style={{ backgroundColor: colors.primary, padding: 18, borderRadius: 18, alignItems: 'center' }}
          >
            {adding
              ? <ActivityIndicator color="white" />
              : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="person-add" size={20} color="white" />
                  <Text style={{ color: 'white', fontWeight: '900', fontSize: 16 }}>ADD TO GYM</Text>
                </View>
              )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

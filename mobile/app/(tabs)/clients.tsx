// app/(tabs)/clients.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { api } from '../../utils/api';

export default function TrainerClientsScreen() {
  const { colors } = useTheme();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchClients();
  }, [search]);

  const fetchClients = async () => {
    try {
      const res = await api.get('/trainer/clients', { params: { search } });
      setClients(res.data.data);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderClient = ({ item }: any) => (
    <TouchableOpacity 
      onPress={() => router.push(`/trainer/client/${item.id}`)}
      style={{ 
        flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgSurface, 
        padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: colors.border 
      }}
    >
      <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', marginRight: 15 }}>
        {item.photoUrl ? (
          <Image source={{ uri: item.photoUrl }} style={{ width: 50, height: 50, borderRadius: 25 }} />
        ) : (
          <Ionicons name="person" size={24} color={colors.textMuted} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>{item.name}</Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary }}>Goal: {item.goals?.[0] || 'Not set'}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: '900', color: colors.textPrimary }}>My Clients</Text>
          <TouchableOpacity 
            onPress={() => router.push('/trainer/add-client')}
            style={{ width: 44, height: 44, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgSurface, borderRadius: 15, paddingHorizontal: 15, marginBottom: 20, borderWidth: 1, borderColor: colors.border }}>
          <Ionicons name="search" size={20} color={colors.textMuted} style={{ marginRight: 10 }} />
          <TextInput 
            placeholder="Search clients..." 
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            style={{ flex: 1, height: 50, color: colors.textPrimary, fontWeight: '600' }}
          />
        </View>

        <FlatList
          data={clients}
          renderItem={renderClient}
          keyExtractor={(item: any) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 50 }}>
              <Ionicons name="people-outline" size={64} color={colors.textMuted} />
              <Text style={{ color: colors.textSecondary, marginTop: 10, fontSize: 16 }}>No clients found.</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

// app/(tabs)/index.tsx
// Home Dashboard — Role-Based UI
 
import React, { useState, useEffect } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, 
  ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchProfile } from '../../store/slices/userSlice';
import { fetchTodayPlan } from '../../store/slices/planSlice';
import { useTheme } from '../../hooks/useTheme';
import { api } from '../../utils/api';
import { setSelectedGymId } from '../../store/slices/gymSlice';
 
const { width } = Dimensions.get('window');
 
// Premium Component: Stat Pill
const StatPill = ({ icon, label, value, color, colors }: any) => (
  <View style={{ 
    backgroundColor: colors.bgSurface, 
    borderRadius: 24, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4
  }}>
    <View style={{ backgroundColor: `${color}15`, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <View>
      <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: '700', letterSpacing: 0.5 }}>{label.toUpperCase()}</Text>
      <Text style={{ fontSize: 15, fontWeight: '900', color: colors.textPrimary }}>{value}</Text>
    </View>
  </View>
);

export default function HomeScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { profile } = useSelector((state: RootState) => state.user);
  const { currentPlan } = useSelector((state: RootState) => state.plan);
  const { selectedGymId } = useSelector((state: RootState) => state.gym);
  const { colors } = useTheme();
  
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [ownerGyms, setOwnerGyms] = useState<any[]>([]);
  const [ownerStats, setOwnerStats] = useState<any>(null);
  const [trainerClients, setTrainerClients] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
 
  const role = user?.role || 'NORMAL_USER';
 
  useEffect(() => {
    loadData();
  }, [role, selectedGymId]);
 
  const loadData = async () => {
    try {
      await dispatch(fetchProfile());
 
      if (role === 'NORMAL_USER') {
        await dispatch(fetchTodayPlan());
        const [notifRes, summaryRes] = await Promise.all([
          api.get('/notifications?limit=3'),
          api.get('/progress/summary'),
        ]);
        setNotifications(notifRes.data.data?.notifications || []);
        setStats(summaryRes.data.data);
      } else if (role === 'GYM_OWNER') {
        const gymsRes = await api.get('/gym');
        const gyms = gymsRes.data.data;
        setOwnerGyms(gyms || []);
        
        if (gyms && gyms.length > 0) {
          const gymId = selectedGymId && gyms.find((g: any) => g.id === selectedGymId) 
            ? selectedGymId 
            : gyms[0].id;
          
          if (!selectedGymId) dispatch(setSelectedGymId(gymId));

          const statsRes = await api.get(`/gym/${gymId}/stats`);
          setOwnerStats(statsRes.data.data);
        }
      } else if (role === 'TRAINER') {
        const res = await api.get('/clients');
        setTrainerClients(res.data.data || []);
      }
    } catch (err) {
      console.log('Error loading dashboard', err);
    }
  };
 
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [role]);
 
  const timeOfDay = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const StatCard = ({ title, value, icon, color }: any) => (
    <View style={{ flex: 1, backgroundColor: colors.bgSurface, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: colors.border }}>
      <Ionicons name={icon} size={24} color={color} style={{ marginBottom: 8 }} />
      <Text style={{ fontSize: 24, fontWeight: '900', color: colors.textPrimary }}>{value}</Text>
      <Text style={{ fontSize: 12, color: colors.textSecondary }}>{title}</Text>
    </View>
  );
 
  const renderNormalUserDashboard = () => (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 32, paddingHorizontal: 24 }}>
        <StatPill icon="flame" label="Intake" value={`${stats?.avgCalories || 0} kcal`} color={colors.action} colors={colors} />
        <StatPill icon="barbell" label="Workouts" value={`${stats?.totalWorkouts || 0}`} color={colors.primary} colors={colors} />
        <StatPill icon="flash" label="Streak" value={`${stats?.streak || 0} days`} color="#3498DB" colors={colors} />
        <StatPill icon="body" label="BMI" value={`${profile?.bmi?.toFixed(1) || '—'}`} color="#9B59B6" colors={colors} />
      </ScrollView>
 
      <View style={{ paddingHorizontal: 24, marginTop: 20 }}>
        <TouchableOpacity onPress={() => router.push('/plan')} activeOpacity={0.9}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={{ borderRadius: 32, padding: 24 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 12 }}>
                <Ionicons name="sparkles" size={20} color="white" />
              </View>
              <Text style={{ color: 'white', fontWeight: '800', marginLeft: 12, fontSize: 16 }}>AI COACH SUGGESTION</Text>
            </View>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '600', lineHeight: 28 }}>
              {currentPlan ? "Your daily flow is ready. Focus on protein intake and consistency." : "Generate your personalized AI plan to start your journey."}
            </Text>
            <View style={{ backgroundColor: 'white', alignSelf: 'flex-start', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, marginTop: 20 }}>
              <Text style={{ color: colors.primary, fontWeight: '900' }}>{currentPlan ? 'VIEW PLAN' : 'GENERATE NOW'}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
 
        <View style={{ marginTop: 40, marginBottom: 40 }}>
          <Text style={{ fontSize: 22, fontWeight: '900', color: colors.textPrimary, marginBottom: 20 }}>Daily Explorer</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
            {[
              { title: 'AI Plan', icon: 'navigate-circle', color: colors.primary, route: '/plan' },
              { title: 'Log Daily', icon: 'add-circle', color: colors.action, route: '/logs' },
              { title: 'History', icon: 'calendar', color: colors.primary, route: '/calendar' },
              { title: 'Stats', icon: 'stats-chart', color: colors.accent, route: '/progress' }
            ].map((item) => (
              <TouchableOpacity 
                key={item.title}
                onPress={() => router.push(item.route as any)}
                style={{ backgroundColor: colors.bgSurface, width: (width - 60) / 2, padding: 20, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}
              >
                <View style={{ backgroundColor: `${item.color}15`, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Ionicons name={item.icon as any} size={28} color={item.color} />
                </View>
                <Text style={{ fontWeight: '800', color: colors.textPrimary }}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </>
  );
 
  const renderTrainerDashboard = () => (
    <View style={{ paddingHorizontal: 24, marginTop: 32 }}>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
        <StatCard title="Total Clients" value={trainerClients.filter((c: any) => c.isActive).length} icon="people" color={colors.primary} />
        <StatCard title="Active Plans" value={trainerClients.length} icon="flash" color="#F1C40F" />
      </View>

      <Text style={{ fontSize: 20, fontWeight: '900', color: colors.textPrimary, marginBottom: 20 }}>Management Toolkit</Text>
      
      <View style={{ gap: 12, marginBottom: 40 }}>
        <TouchableOpacity 
          onPress={() => router.push('/clients' as any)}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgSurface, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: colors.border }}
        >
          <Ionicons name="people" size={24} color={colors.primary} style={{ marginRight: 15 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '800', color: colors.textPrimary }}>Client Roster</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>View progress and override plans</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.push('/calendar' as any)}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgSurface, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: colors.border }}
        >
          <Ionicons name="calendar" size={24} color="#3498DB" style={{ marginRight: 15 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '800', color: colors.textPrimary }}>Client Calendar</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>Browse any client's daily logs</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.push('/trainer/personal-dashboard' as any)}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgSurface, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: colors.border }}
        >
          <Ionicons name="trending-up" size={24} color="#2ECC71" style={{ marginRight: 15 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '800', color: colors.textPrimary }}>My Business Dashboard</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>Revenue, P&L, AI suggestions</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.push('/trainer/add-client' as any)}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgSurface, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: colors.border }}
        >
          <Ionicons name="person-add" size={24} color={colors.action} style={{ marginRight: 15 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '800', color: colors.textPrimary }}>Add New Client</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>Register a freelancer client</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
 
  const renderOwnerDashboard = () => (
    <View style={{ paddingHorizontal: 24, marginTop: 32 }}>
      {/* Gym Selector Horizontal List */}
      {ownerGyms.length > 0 && (
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textMuted, letterSpacing: 1.5, marginBottom: 12 }}>MY GYM LOCATIONS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -24, paddingHorizontal: 24 }}>
            {ownerGyms.map((gym: any) => {
              const isActive = gym.id === selectedGymId;
              return (
                <TouchableOpacity
                  key={gym.id}
                  onPress={() => dispatch(setSelectedGymId(gym.id))}
                  style={{
                    backgroundColor: isActive ? colors.primary : colors.bgSurface,
                    paddingHorizontal: 20, paddingVertical: 14, borderRadius: 20,
                    marginRight: 12, borderWidth: 1, borderColor: isActive ? colors.primary : colors.border,
                    flexDirection: 'row', alignItems: 'center', gap: 10
                  }}
                >
                  <Ionicons name="business" size={18} color={isActive ? 'white' : colors.primary} />
                  <Text style={{ color: isActive ? 'white' : colors.textPrimary, fontWeight: '800' }}>{gym.name}</Text>
                  {isActive && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'white' }} />}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              onPress={() => router.push('/owner/gym-setup')}
              style={{ paddingHorizontal: 20, paddingVertical: 14, borderRadius: 20, borderWidth: 1, borderColor: colors.primary, borderStyle: 'dashed', flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <Ionicons name="add" size={20} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: '800' }}>ADD NEW</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
        <StatCard title="Members" value={ownerStats?.memberCount || 0} icon="people" color="#2ECC71" />
        <StatCard title="Trainers" value={ownerStats?.trainerCount || 0} icon="fitness" color="#3498DB" />
      </View>

      {/* P&L Dashboard */}
      <TouchableOpacity 
        onPress={() => router.push({ pathname: '/owner/owner-dashboard', params: { gymId: selectedGymId || ownerGyms[0]?.id } } as any)}
        style={{ 
          backgroundColor: colors.primary, 
          padding: 22, 
          borderRadius: 24, 
          flexDirection: 'row', 
          alignItems: 'center',
          marginBottom: 14
        }}
      >
        <Ionicons name="trending-up" size={32} color="white" style={{ marginRight: 15 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: 'white', fontWeight: '900', fontSize: 18 }}>Revenue & P&L Dashboard</Text>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>View profit, expenses & AI suggestions</Text>
        </View>
        <Ionicons name="arrow-forward" size={24} color="white" />
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => router.push('/gym')}
        style={{ 
          backgroundColor: colors.bgSurface,
          padding: 22, 
          borderRadius: 24, 
          flexDirection: 'row', 
          alignItems: 'center',
          marginBottom: 30,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Ionicons name="business" size={32} color={colors.primary} style={{ marginRight: 15 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textPrimary, fontWeight: '900', fontSize: 18 }}>Gym Operations</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Manage trainers, members, and settings</Text>
        </View>
        <Ionicons name="arrow-forward" size={24} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
 
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '800', letterSpacing: 3 }}>
                {role === 'NORMAL_USER' ? timeOfDay().toUpperCase() : role.replace('_', ' ')}
              </Text>
              <Text style={{ fontSize: 32, fontWeight: '900', color: colors.textPrimary, marginTop: 4 }}>
                {profile?.name?.split(' ')[0] ?? 'User'} 👋
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => router.push('/notifications')}
              style={{ backgroundColor: colors.bgSurface, padding: 12, borderRadius: 20, borderWidth: 1, borderColor: colors.border }}
            >
              <Ionicons name="notifications-outline" size={26} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
 
        {role === 'NORMAL_USER' && renderNormalUserDashboard()}
        {role === 'TRAINER' && renderTrainerDashboard()}
        {role === 'GYM_OWNER' && renderOwnerDashboard()}

      </ScrollView>
    </SafeAreaView>
  );
}

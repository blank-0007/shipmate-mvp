import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('your-project')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Local fallback storage keys
const LOCAL_ROOMS_KEY = 'shipmate_rooms';
const LOCAL_MEMBERS_KEY = 'shipmate_members';

const getLocalRooms = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_ROOMS_KEY) || '[]');
  } catch (e) {
    return [];
  }
};

const saveLocalRooms = (rooms) => {
  localStorage.setItem(LOCAL_ROOMS_KEY, JSON.stringify(rooms));
};

const getLocalMembers = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_MEMBERS_KEY) || '[]');
  } catch (e) {
    return [];
  }
};

const saveLocalMembers = (members) => {
  localStorage.setItem(LOCAL_MEMBERS_KEY, JSON.stringify(members));
};

/**
 * Creates a sprint room and its 4 members
 */
export async function createSprintRoom({
  hackathonName,
  deadline,
  githubRepoUrl,
  figmaUrl,
  inactivityThresholdHours = 6,
  teammates = []
}) {
  const roomId = crypto.randomUUID();
  const roomData = {
    id: roomId,
    hackathon_name: hackathonName,
    deadline: new Date(deadline).toISOString(),
    github_repo_url: githubRepoUrl.trim(),
    figma_url: figmaUrl ? figmaUrl.trim() : null,
    inactivity_threshold_hours: Number(inactivityThresholdHours) || 6,
    created_at: new Date().toISOString(),
  };

  const membersData = teammates.filter(t => Boolean(t.handle?.trim())).map((t) => ({
    id: crypto.randomUUID(),
    room_id: roomId,
    github_handle: t.handle.trim().replace(/^@/, ''),
    role_label: t.role ? t.role.trim() : '',
    triage_status: 'none',
    snoozed_until: null,
    triage_note: null,
    created_at: new Date().toISOString(),
  }));

  if (isSupabaseConfigured && supabase) {
    const { data: room, error: roomError } = await supabase
      .from('sprint_rooms')
      .insert([roomData])
      .select()
      .single();

    if (roomError) throw roomError;

    if (membersData.length > 0) {
      const { data: members, error: membersError } = await supabase
        .from('members')
        .insert(membersData)
        .select();

      if (membersError) throw membersError;
      return { room, members };
    }

    return { room, members: [] };
  }

  // Local storage fallback
  const rooms = getLocalRooms();
  rooms.push(roomData);
  saveLocalRooms(rooms);

  const allMembers = getLocalMembers();
  allMembers.push(...membersData);
  saveLocalMembers(allMembers);

  return { room: roomData, members: membersData };
}

/**
 * Fetch a sprint room and all its members
 */
export async function getRoomWithMembers(roomId) {
  if (isSupabaseConfigured && supabase) {
    const { data: room, error: roomError } = await supabase
      .from('sprint_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (roomError) throw roomError;

    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (membersError) throw membersError;

    return { room, members: members || [] };
  }

  // Local storage fallback
  const rooms = getLocalRooms();
  const room = rooms.find(r => r.id === roomId);
  if (!room) {
    throw new Error(`Room not found: ${roomId}`);
  }

  const allMembers = getLocalMembers();
  const members = allMembers.filter(m => m.room_id === roomId);

  return { room, members };
}

/**
 * Update member triage status (M3: Switch to fallback, cut scope, or snooze)
 */
export async function updateMemberTriage(memberId, { triage_status, triage_note, snoozed_until }) {
  const updates = {
    triage_status,
    triage_note: triage_note !== undefined ? triage_note : null,
    snoozed_until: snoozed_until !== undefined ? snoozed_until : null,
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('members')
      .update(updates)
      .eq('id', memberId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Local storage fallback
  const allMembers = getLocalMembers();
  const index = allMembers.findIndex(m => m.id === memberId);
  if (index === -1) {
    throw new Error(`Member not found: ${memberId}`);
  }

  allMembers[index] = {
    ...allMembers[index],
    ...updates,
  };
  saveLocalMembers(allMembers);
  return allMembers[index];
}

import { create } from 'zustand';
import { Activity, Member, Roadbook, Checkpoint, SuggestedStop, MemberSignRecord, SignStatus } from '@/types';
import { mockActivity, mockMembers, mockRoadbook } from '@/data/mockData';
import { generateNodes } from '@/utils/timeCalculator';

const STORAGE_KEY = 'roadbook_app_state_v1';

interface StoredState {
  activity: Activity;
  members: Member[];
  roadbook: Roadbook;
  signRecords: MemberSignRecord[];
}

function loadFromStorage(): StoredState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.activity && parsed.members && parsed.roadbook) {
      return parsed as StoredState;
    }
    return null;
  } catch {
    return null;
  }
}

function genId(prefix = 'm') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function getInitialState(): StoredState {
  const stored = loadFromStorage();
  if (stored) {
    return {
      ...stored,
      signRecords: stored.signRecords || [],
    };
  }
  return {
    activity: {
      ...mockActivity,
      nodes: generateNodes(mockActivity),
    },
    members: mockMembers,
    roadbook: mockRoadbook,
    signRecords: [],
  };
}

const initial = getInitialState();
if (!initial.activity.nodes || initial.activity.nodes.length === 0) {
  initial.activity.nodes = generateNodes(initial.activity);
}

interface AppState {
  activity: Activity;
  members: Member[];
  roadbook: Roadbook;
  signRecords: MemberSignRecord[];

  setActivity: (activity: Activity) => void;
  updateActivity: (updates: Partial<Activity>) => void;
  addCheckpoint: (checkpoint: Checkpoint) => void;
  updateCheckpoint: (id: string, updates: Partial<Checkpoint>) => void;
  removeCheckpoint: (id: string) => void;
  regenerateNodes: () => void;

  addMember: (member: Member) => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  removeMember: (id: string) => void;
  batchAddMembers: (membersData: Omit<Member, 'id'>[]) => void;
  fillMissingAssignments: () => { assignedNumbers: string[]; assignedChannels: string[] };

  updateRoadbook: (updates: Partial<Roadbook>) => void;
  publishRoadbook: () => void;
  assignCarNumbers: () => void;
  adoptSuggestedStop: (stop: SuggestedStop) => void;

  setSignStatus: (memberId: string, status: SignStatus, remark?: string) => void;
  resetSignRecords: () => void;

  resetToMock: () => void;
  _persist: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  activity: initial.activity,
  members: initial.members,
  roadbook: initial.roadbook,
  signRecords: initial.signRecords,

  _persist: () => {
    try {
      const state = get();
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          activity: state.activity,
          members: state.members,
          roadbook: state.roadbook,
          signRecords: state.signRecords,
        })
      );
    } catch (err) {
      console.warn('Failed to persist state to localStorage', err);
    }
  },

  setActivity: (activity) => {
    set({ activity });
    get()._persist();
  },

  updateActivity: (updates) => {
    set((state) => {
      const newActivity = { ...state.activity, ...updates };
      newActivity.nodes = generateNodes(newActivity);
      return { activity: newActivity };
    });
    get()._persist();
  },

  addCheckpoint: (checkpoint) => {
    set((state) => {
      const newCheckpoints = [...state.activity.checkpoints, checkpoint];
      newCheckpoints.sort((a, b) => a.distance - b.distance);
      newCheckpoints.forEach((cp, i) => (cp.order = i + 1));
      const newActivity = { ...state.activity, checkpoints: newCheckpoints };
      newActivity.nodes = generateNodes(newActivity);
      return { activity: newActivity };
    });
    get()._persist();
  },

  updateCheckpoint: (id, updates) => {
    set((state) => {
      const newCheckpoints = state.activity.checkpoints.map((cp) =>
        cp.id === id ? { ...cp, ...updates } : cp
      );
      newCheckpoints.sort((a, b) => a.distance - b.distance);
      newCheckpoints.forEach((cp, i) => (cp.order = i + 1));
      const newActivity = { ...state.activity, checkpoints: newCheckpoints };
      newActivity.nodes = generateNodes(newActivity);
      return { activity: newActivity };
    });
    get()._persist();
  },

  removeCheckpoint: (id) => {
    set((state) => {
      const newCheckpoints = state.activity.checkpoints.filter((cp) => cp.id !== id);
      newCheckpoints.forEach((cp, i) => (cp.order = i + 1));
      const newActivity = { ...state.activity, checkpoints: newCheckpoints };
      newActivity.nodes = generateNodes(newActivity);
      return { activity: newActivity };
    });
    get()._persist();
  },

  adoptSuggestedStop: (stop) => {
    set((state) => {
      const checkpoint: Checkpoint = {
        id: `cp-adopted-${Date.now()}`,
        name: stop.name,
        distance: stop.distance,
        type: stop.type === 'scenic' ? 'scenic' : stop.type === 'supply' ? 'supply' : 'other',
        stayDuration: stop.duration,
        notes: stop.reason,
        order: state.activity.checkpoints.length + 1,
      };
      const newCheckpoints = [...state.activity.checkpoints, checkpoint];
      newCheckpoints.sort((a, b) => a.distance - b.distance);
      newCheckpoints.forEach((cp, i) => (cp.order = i + 1));
      const newActivity = { ...state.activity, checkpoints: newCheckpoints };
      newActivity.nodes = generateNodes(newActivity);
      return { activity: newActivity };
    });
    get()._persist();
  },

  regenerateNodes: () => {
    set((state) => ({
      activity: {
        ...state.activity,
        nodes: generateNodes(state.activity),
      },
    }));
    get()._persist();
  },

  addMember: (member) => {
    set((state) => ({ members: [...state.members, member] }));
    get()._persist();
  },

  updateMember: (id, updates) => {
    set((state) => ({
      members: state.members.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }));
    get()._persist();
  },

  removeMember: (id) => {
    set((state) => ({
      members: state.members.filter((m) => m.id !== id),
    }));
    get()._persist();
  },

  batchAddMembers: (membersData) => {
    set((state) => {
      const newMembers: Member[] = membersData.map((data, i) => ({
        ...data,
        id: genId(`m-batch-${Date.now()}-${i}`),
      }));
      return { members: [...state.members, ...newMembers] };
    });
    get()._persist();
  },

  fillMissingAssignments: () => {
    const assignedNumbers: string[] = [];
    const assignedChannels: string[] = [];
    set((state) => {
      const confirmedMembers = state.members
        .filter((m) => m.status === 'confirmed')
        .sort((a, b) => {
          if (a.drivingExperience === 'expert' && b.drivingExperience !== 'expert') return -1;
          if (a.drivingExperience !== 'expert' && b.drivingExperience === 'expert') return 1;
          if (a.willingTail && !b.willingTail) return 1;
          if (!a.willingTail && b.willingTail) return -1;
          return 0;
        });

      let maxCarNum = 0;
      state.members.forEach((m) => {
        if (typeof m.carNumber === 'number' && m.carNumber > maxCarNum) maxCarNum = m.carNumber;
      });

      const updatedMembers = state.members.map((m) => {
        if (m.status !== 'confirmed') return m;
        const idx = confirmedMembers.findIndex((cm) => cm.id === m.id);
        const newCarNumber =
          typeof m.carNumber === 'number' ? m.carNumber : (maxCarNum = maxCarNum + 1);
        const newChannel =
          m.radioChannel && m.radioChannel.trim()
            ? m.radioChannel
            : `CH${Math.floor(idx / 3) + 1}`;
        if (typeof m.carNumber !== 'number') assignedNumbers.push(`${m.name} → ${newCarNumber}号车`);
        if (!m.radioChannel) assignedChannels.push(`${m.name} → ${newChannel}`);
        return {
          ...m,
          carNumber: newCarNumber,
          radioChannel: newChannel,
        };
      });

      const convoyOrder = confirmedMembers.map((m) => m.id);

      return {
        members: updatedMembers,
        roadbook: {
          ...state.roadbook,
          convoyOrder,
        },
      };
    });
    get()._persist();
    return { assignedNumbers, assignedChannels };
  },

  updateRoadbook: (updates) => {
    set((state) => ({
      roadbook: { ...state.roadbook, ...updates },
    }));
    get()._persist();
  },

  publishRoadbook: () => {
    set((state) => ({
      roadbook: {
        ...state.roadbook,
        published: true,
        publishedAt: new Date().toISOString(),
        shareCode:
          state.roadbook.shareCode ||
          Math.random().toString(36).substring(2, 8).toUpperCase(),
      },
    }));
    get()._persist();
  },

  assignCarNumbers: () => {
    set((state) => {
      const confirmedMembers = state.members
        .filter((m) => m.status === 'confirmed')
        .sort((a, b) => {
          if (a.drivingExperience === 'expert' && b.drivingExperience !== 'expert') return -1;
          if (a.drivingExperience !== 'expert' && b.drivingExperience === 'expert') return 1;
          if (a.willingTail && !b.willingTail) return 1;
          if (!a.willingTail && b.willingTail) return -1;
          return 0;
        });

      const updatedMembers = state.members.map((m) => {
        const index = confirmedMembers.findIndex((cm) => cm.id === m.id);
        if (index >= 0) {
          return {
            ...m,
            carNumber: index + 1,
            radioChannel: `CH${Math.floor(index / 3) + 1}`,
          };
        }
        return m;
      });

      const convoyOrder = confirmedMembers.map((m) => m.id);

      return {
        members: updatedMembers,
        roadbook: {
          ...state.roadbook,
          convoyOrder,
        },
      };
    });
    get()._persist();
  },

  setSignStatus: (memberId, status, remark) => {
    set((state) => {
      const existing = state.signRecords.find((r) => r.memberId === memberId);
      const newRecord: MemberSignRecord = {
        memberId,
        status,
        signedAt: status === 'not_arrived' ? undefined : new Date().toISOString(),
        remark,
      };
      const rest = state.signRecords.filter((r) => r.memberId !== memberId);
      const signRecords = status === 'not_arrived' && !existing ? state.signRecords : [...rest, newRecord];
      return { signRecords };
    });
    get()._persist();
  },

  resetSignRecords: () => {
    set({ signRecords: [] });
    get()._persist();
  },

  resetToMock: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({
      activity: {
        ...mockActivity,
        nodes: generateNodes(mockActivity),
      },
      members: mockMembers,
      roadbook: mockRoadbook,
      signRecords: [],
    });
  },
}));

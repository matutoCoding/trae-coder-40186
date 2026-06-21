export interface Activity {
  id: string;
  name: string;
  date: string;
  meetingPoint: string;
  meetingTime: string;
  vehicleCount: number;
  averageSpeed: number;
  accommodationBudget: number;
  checkpoints: Checkpoint[];
  nodes: RouteNode[];
  createdAt: string;
}

export interface Checkpoint {
  id: string;
  name: string;
  distance: number;
  type: 'scenic' | 'supply' | 'lunch' | 'other';
  stayDuration: number;
  notes?: string;
  order: number;
}

export type NodeType = 'meeting' | 'driving' | 'lunch' | 'supply' | 'scenic' | 'accommodation' | 'rest';

export interface RouteNode {
  id: string;
  type: NodeType;
  name: string;
  arrivalTime?: string;
  departureTime?: string;
  duration: number;
  distance?: number;
  notes?: string;
}

export type DrivingExperience = 'novice' | 'intermediate' | 'expert';

export type MemberStatus = 'confirmed' | 'pending' | 'cancelled';

export interface Member {
  id: string;
  name: string;
  phone: string;
  carModel: string;
  carColor: string;
  range: number;
  drivingExperience: DrivingExperience;
  hasElderly: boolean;
  hasChildren: boolean;
  willingTail: boolean;
  carNumber?: number;
  radioChannel?: string;
  status: MemberStatus;
  notes?: string;
}

export interface Roadbook {
  id: string;
  activityId: string;
  published: boolean;
  publishedAt?: string;
  shareCode?: string;
  carRules: string[];
  latePolicy: string;
  radioMainChannel: string;
  radioEmergencyChannel: string;
  convoyOrder: string[];
}

export interface AnalysisResult {
  minRange: number;
  minRangeMember: Member | null;
  hasNoviceDriver: boolean;
  noviceDrivers: Member[];
  hasElderlyOrChildren: boolean;
  restSuggestions: string[];
  riskLevel: 'low' | 'medium' | 'high';
  totalDistance: number;
  estimatedDriveTime: number;
}

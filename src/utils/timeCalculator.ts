import { Activity, RouteNode, Checkpoint } from '@/types';

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = Math.floor(minutes % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function addMinutes(timeStr: string, minutesToAdd: number): string {
  const totalMinutes = parseTime(timeStr) + minutesToAdd;
  return formatTime(totalMinutes);
}

function calculateDriveTime(distance: number, speed: number): number {
  return Math.round((distance / speed) * 60);
}

export function generateNodes(activity: Activity): RouteNode[] {
  const nodes: RouteNode[] = [];
  let currentTime = activity.meetingTime;
  let currentDistance = 0;

  nodes.push({
    id: `node-${Date.now()}-1`,
    type: 'meeting',
    name: `集合点：${activity.meetingPoint}`,
    departureTime: currentTime,
    duration: 30,
    distance: 0,
    notes: '请提前15分钟到达，进行车辆检查和对讲设备调试',
  });

  currentTime = addMinutes(currentTime, 30);

  const sortedCheckpoints = [...activity.checkpoints].sort((a, b) => a.order - b.order);

  let lastDistance = 0;

  sortedCheckpoints.forEach((checkpoint, index) => {
    const segmentDistance = checkpoint.distance - lastDistance;
    const driveTime = calculateDriveTime(segmentDistance, activity.averageSpeed);

    if (driveTime >= 120 && checkpoint.type !== 'lunch') {
      const midDistance = lastDistance + segmentDistance / 2;
      const midDriveTime = Math.round(driveTime / 2);
      const midArrivalTime = addMinutes(currentTime, midDriveTime);

      nodes.push({
        id: `node-drive-${Date.now()}-${index}-rest`,
        type: 'rest',
        name: `临时休息点${index + 1}`,
        arrivalTime: midArrivalTime,
        departureTime: addMinutes(midArrivalTime, 15),
        duration: 15,
        distance: Math.round(midDistance),
        notes: '建议休息15分钟，活动身体、检查车况',
      });

      const remainingDriveTime = driveTime - midDriveTime;
      const remainingStartTime = addMinutes(midArrivalTime, 15);
      nodes.push({
        id: `node-drive-${Date.now()}-${index}-2`,
        type: 'driving',
        name: `行驶段 ${index + 1}B`,
        departureTime: remainingStartTime,
        arrivalTime: addMinutes(remainingStartTime, remainingDriveTime),
        duration: remainingDriveTime,
        distance: Math.round(segmentDistance / 2),
      });
    } else {
      nodes.push({
        id: `node-drive-${Date.now()}-${index}`,
        type: 'driving',
        name: `行驶段 ${index + 1}`,
        departureTime: currentTime,
        arrivalTime: addMinutes(currentTime, driveTime),
        duration: driveTime,
        distance: segmentDistance,
      });
    }

    currentTime = addMinutes(currentTime, driveTime);
    if (driveTime >= 120 && checkpoint.type !== 'lunch') {
      currentTime = addMinutes(currentTime, 15);
    }

    const nodeTypeMap: Record<string, RouteNode['type']> = {
      scenic: 'scenic',
      supply: 'supply',
      lunch: 'lunch',
      other: 'supply',
    };

    nodes.push({
      id: `node-checkpoint-${checkpoint.id}`,
      type: nodeTypeMap[checkpoint.type] || 'supply',
      name: checkpoint.name,
      arrivalTime: currentTime,
      departureTime: addMinutes(currentTime, checkpoint.stayDuration),
      duration: checkpoint.stayDuration,
      distance: checkpoint.distance,
      notes: checkpoint.notes,
    });

    currentTime = addMinutes(currentTime, checkpoint.stayDuration);
    lastDistance = checkpoint.distance;
  });

  const totalDistance = sortedCheckpoints.length > 0
    ? sortedCheckpoints[sortedCheckpoints.length - 1].distance
    : 0;

  nodes.push({
    id: `node-accommodation-${Date.now()}`,
    type: 'accommodation',
    name: `住宿酒店（预算 ¥${activity.accommodationBudget}/间）`,
    arrivalTime: currentTime,
    duration: 0,
    distance: totalDistance,
    notes: '抵达后办理入住，晚餐自由安排',
  });

  currentDistance = totalDistance;

  return nodes;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) {
    return `${hours}小时${mins}分钟`;
  } else if (hours > 0) {
    return `${hours}小时`;
  } else {
    return `${mins}分钟`;
  }
}

export function generateRadioChannel(index: number): string {
  const channels = ['CH1', 'CH2', 'CH3', 'CH4', 'CH5', 'CH6', 'CH7', 'CH8'];
  return channels[index % channels.length];
}

export { parseTime, formatTime, addMinutes, calculateDriveTime };

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

const MAX_DRIVE_SEGMENT_MINUTES = 90;
const REST_DURATION = 15;
const ARRIVAL_VARIANCE_MINUTES = 15;

interface DrivingSegment {
  distance: number;
  duration: number;
}

function splitLongDrive(totalDistance: number, speed: number): DrivingSegment[] {
  const totalTime = calculateDriveTime(totalDistance, speed);
  if (totalTime <= MAX_DRIVE_SEGMENT_MINUTES) {
    return [{ distance: totalDistance, duration: totalTime }];
  }

  const segments: DrivingSegment[] = [];
  const segmentCount = Math.ceil(totalTime / MAX_DRIVE_SEGMENT_MINUTES);
  const distancePerSegment = totalDistance / segmentCount;

  for (let i = 0; i < segmentCount; i++) {
    const isLast = i === segmentCount - 1;
    const segDistance = isLast
      ? totalDistance - distancePerSegment * (segmentCount - 1)
      : distancePerSegment;
    segments.push({
      distance: Math.round(segDistance * 10) / 10,
      duration: calculateDriveTime(segDistance, speed),
    });
  }

  return segments;
}

export function generateNodes(activity: Activity): RouteNode[] {
  const nodes: RouteNode[] = [];
  const meetingEndTime = addMinutes(activity.meetingTime, 30);
  let currentTime = meetingEndTime;
  let currentDistance = 0;

  nodes.push({
    id: `node-meeting-${Date.now()}`,
    type: 'meeting',
    name: `集合点：${activity.meetingPoint}`,
    departureTime: activity.meetingTime,
    arrivalTime: activity.meetingTime,
    arrivalTimeEarly: addMinutes(activity.meetingTime, -15),
    arrivalTimeLate: activity.meetingTime,
    duration: 30,
    distance: 0,
    notes: '请提前15分钟到达，进行车辆检查和对讲设备调试',
  });

  const sortedCheckpoints = [...activity.checkpoints].sort((a, b) => a.order - b.order);
  let lastDistance = 0;
  let driveSegmentCounter = 0;
  let restCounter = 0;

  sortedCheckpoints.forEach((checkpoint, cpIndex) => {
    const segmentTotalDistance = checkpoint.distance - lastDistance;
    const drivingSegments = splitLongDrive(segmentTotalDistance, activity.averageSpeed);

    drivingSegments.forEach((seg, segIndex) => {
      driveSegmentCounter++;
      const segArrival = addMinutes(currentTime, seg.duration);
      const segArrivalEarly = addMinutes(segArrival, -ARRIVAL_VARIANCE_MINUTES);
      const segArrivalLate = addMinutes(segArrival, ARRIVAL_VARIANCE_MINUTES);

      nodes.push({
        id: `node-drive-${Date.now()}-${driveSegmentCounter}`,
        type: 'driving',
        name: `行驶段 ${cpIndex + 1}-${segIndex + 1}${drivingSegments.length > 1 ? `（共${drivingSegments.length}段）` : ''}`,
        departureTime: currentTime,
        arrivalTime: segArrival,
        arrivalTimeEarly: segArrivalEarly,
        arrivalTimeLate: segArrivalLate,
        duration: seg.duration,
        distance: Math.round(seg.distance),
        segmentIndex: segIndex + 1,
        segmentTotal: drivingSegments.length,
      });

      currentTime = segArrival;
      currentDistance += seg.distance;

      const isLastSegmentOfThisCP = segIndex === drivingSegments.length - 1;
      if (!isLastSegmentOfThisCP) {
        restCounter++;
        const restDeparture = addMinutes(currentTime, REST_DURATION);
        nodes.push({
          id: `node-rest-${Date.now()}-${restCounter}`,
          type: 'rest',
          name: `临时休息点 ${restCounter}`,
          arrivalTime: currentTime,
          arrivalTimeEarly: addMinutes(currentTime, -5),
          arrivalTimeLate: addMinutes(currentTime, 10),
          departureTime: restDeparture,
          duration: REST_DURATION,
          distance: Math.round(currentDistance),
          notes: '建议休息15分钟，活动身体、检查车况、人员轮换驾驶',
        });
        currentTime = restDeparture;
      }
    });

    const nodeTypeMap: Record<string, RouteNode['type']> = {
      scenic: 'scenic',
      supply: 'supply',
      lunch: 'lunch',
      other: 'supply',
    };
    const cpDeparture = addMinutes(currentTime, checkpoint.stayDuration);
    const cpArrivalEarly = addMinutes(currentTime, -ARRIVAL_VARIANCE_MINUTES);
    const cpArrivalLate = addMinutes(currentTime, ARRIVAL_VARIANCE_MINUTES);

    nodes.push({
      id: `node-checkpoint-${checkpoint.id}`,
      type: nodeTypeMap[checkpoint.type] || 'supply',
      name: checkpoint.name,
      arrivalTime: currentTime,
      arrivalTimeEarly: cpArrivalEarly,
      arrivalTimeLate: cpArrivalLate,
      departureTime: cpDeparture,
      duration: checkpoint.stayDuration,
      distance: checkpoint.distance,
      notes: checkpoint.notes,
    });

    currentTime = cpDeparture;
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
    arrivalTimeEarly: addMinutes(currentTime, -ARRIVAL_VARIANCE_MINUTES),
    arrivalTimeLate: addMinutes(currentTime, ARRIVAL_VARIANCE_MINUTES * 2),
    duration: 0,
    distance: totalDistance,
    notes: '抵达后办理入住，晚餐自由安排',
  });

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

export { parseTime, formatTime, addMinutes, calculateDriveTime, MAX_DRIVE_SEGMENT_MINUTES };

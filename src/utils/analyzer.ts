import { Member, Activity, AnalysisResult } from '@/types';

export function analyzeMembers(members: Member[], activity: Activity): AnalysisResult {
  const confirmedMembers = members.filter(m => m.status === 'confirmed');

  if (confirmedMembers.length === 0) {
    return {
      minRange: 0,
      minRangeMember: null,
      hasNoviceDriver: false,
      noviceDrivers: [],
      hasElderlyOrChildren: false,
      restSuggestions: ['暂无成员信息，请先添加报名成员'],
      riskLevel: 'low',
      totalDistance: activity.checkpoints.length > 0
        ? Math.max(...activity.checkpoints.map(c => c.distance))
        : 0,
      estimatedDriveTime: 0,
    };
  }

  const minRange = Math.min(...confirmedMembers.map(m => m.range));
  const minRangeMember = confirmedMembers.reduce((min, m) =>
    m.range < min.range ? m : min
  , confirmedMembers[0]);

  const noviceDrivers = confirmedMembers.filter(m => m.drivingExperience === 'novice');
  const hasNoviceDriver = noviceDrivers.length > 0;

  const hasElderlyOrChildren = confirmedMembers.some(m => m.hasElderly || m.hasChildren);

  const totalDistance = activity.checkpoints.length > 0
    ? Math.max(...activity.checkpoints.map(c => c.distance))
    : 0;

  const estimatedDriveTime = activity.checkpoints.length > 0
    ? Math.round((totalDistance / activity.averageSpeed) * 60)
    : 0;

  const restSuggestions: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'low';

  if (totalDistance > minRange * 0.8) {
    restSuggestions.push(`⚠️ 最弱续航车辆为 ${minRangeMember.carModel}（${minRangeMember.name}），续航 ${minRange}km，全程 ${totalDistance}km，建议安排充电或补给点`);
    riskLevel = 'high';
  } else if (totalDistance > minRange * 0.6) {
    restSuggestions.push(`ℹ️ 最弱续航车辆为 ${minRangeMember.carModel}（${minRangeMember.name}），续航 ${minRange}km，请注意续航管理`);
    if (riskLevel === 'low') riskLevel = 'medium';
  }

  if (hasNoviceDriver) {
    restSuggestions.push(`⚠️ 车队中有 ${noviceDrivers.length} 位新手驾驶员（${noviceDrivers.map(m => m.name).join('、')}），建议增加休息频次，每1小时休息一次`);
    if (riskLevel === 'low') riskLevel = 'medium';
  }

  if (hasElderlyOrChildren) {
    restSuggestions.push('ℹ️ 车队中有老人或儿童同行，建议增加休息点，备齐常用药品');
    if (riskLevel === 'low') riskLevel = 'medium';
  }

  const willingTailCount = confirmedMembers.filter(m => m.willingTail).length;
  if (willingTailCount === 0) {
    restSuggestions.push('⚠️ 暂无志愿者担任尾车，请指定经验丰富的驾驶员担任');
    if (riskLevel === 'low') riskLevel = 'medium';
  } else if (willingTailCount === 1) {
    restSuggestions.push(`ℹ️ ${willingTailCount}位成员愿意担任尾车，请确认安排`);
  } else {
    restSuggestions.push(`✅ ${willingTailCount}位成员愿意担任尾车，建议选择经验最丰富的`);
  }

  if (estimatedDriveTime > 360) {
    restSuggestions.push('⚠️ 预计驾驶时间超过6小时，建议安排充足的休息和午餐时间');
    if (riskLevel !== 'high') riskLevel = 'medium';
  }

  if (restSuggestions.length === 0) {
    restSuggestions.push('✅ 车队状态良好，按计划行驶即可');
  }

  return {
    minRange,
    minRangeMember,
    hasNoviceDriver,
    noviceDrivers,
    hasElderlyOrChildren,
    restSuggestions,
    riskLevel,
    totalDistance,
    estimatedDriveTime,
  };
}

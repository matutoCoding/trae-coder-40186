import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Activity, Member, Roadbook, MemberSignRecord } from '@/types';
import {
  Car,
  Radio,
  Clock,
  MapPin,
  AlertCircle,
  Route,
  Users,
  Shield,
  ChevronDown,
  ChevronUp,
  FileText,
  User,
  Check,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/utils/timeCalculator';
import { decodeShareData } from '@/utils/shareCodec';

const nodeTypeIcons: Record<string, any> = {
  meeting: MapPin,
  driving: Route,
  lunch: FileText,
  supply: FileText,
  scenic: FileText,
  accommodation: FileText,
  rest: Clock,
};

const nodeTypeConfig = {
  meeting: { color: 'bg-teal-500', textColor: 'text-teal-600', bgColor: 'bg-teal-50', label: '集合' },
  driving: { color: 'bg-slate-400', textColor: 'text-slate-600', bgColor: 'bg-slate-50', label: '行驶' },
  lunch: { color: 'bg-orange-500', textColor: 'text-orange-600', bgColor: 'bg-orange-50', label: '午餐' },
  supply: { color: 'bg-blue-500', textColor: 'text-blue-600', bgColor: 'bg-blue-50', label: '补给' },
  scenic: { color: 'bg-emerald-500', textColor: 'text-emerald-600', bgColor: 'bg-emerald-50', label: '景区' },
  accommodation: { color: 'bg-indigo-500', textColor: 'text-indigo-600', bgColor: 'bg-indigo-50', label: '住宿' },
  rest: { color: 'bg-amber-500', textColor: 'text-amber-600', bgColor: 'bg-amber-50', label: '休息' },
};

export default function PublicRoadbookView() {
  const { activity, members, roadbook, signRecords } = useAppStore();
  const [searchParams] = useSearchParams();
  const urlCode = searchParams.get('code');
  const urlToken = searchParams.get('token');

  const [externalData, setExternalData] = useState<{
    activity: Activity;
    members: Member[];
    roadbook: Roadbook;
    signRecords?: MemberSignRecord[];
  } | null>(null);
  const [externalDecodeError, setExternalDecodeError] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState(urlCode || '');
  const [verified, setVerified] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(true);
  const [showSchedule, setShowSchedule] = useState(true);
  const [codeError, setCodeError] = useState('');
  const [hasNoLocalData, setHasNoLocalData] = useState(false);

  useEffect(() => {
    if (urlToken) {
      const decoded = decodeShareData(urlToken);
      if (decoded) {
        setExternalData({
          activity: decoded.activity,
          members: decoded.members,
          roadbook: decoded.roadbook,
          signRecords: decoded.signRecords,
        });
        setExternalDecodeError(null);
        setVerified(true);
        setHasNoLocalData(false);
      } else {
        setExternalDecodeError('链接无效或已损坏，请尝试使用分享码方式进入');
      }
    }
  }, [urlToken]);

  useEffect(() => {
    if (!externalData && urlCode && !verified) {
      if (roadbook.published && roadbook.shareCode && urlCode.toUpperCase() === roadbook.shareCode.toUpperCase()) {
        setVerified(true);
        setHasNoLocalData(false);
      } else if (!roadbook.published || !roadbook.shareCode) {
        setHasNoLocalData(true);
      }
    }
  }, [urlCode, roadbook.shareCode, roadbook.published, verified, externalData]);

  const effectiveActivity = externalData?.activity ?? activity;
  const effectiveMembers = externalData?.members ?? members;
  const effectiveRoadbook = externalData?.roadbook ?? roadbook;
  const effectiveSignRecords = externalData?.signRecords ?? signRecords;

  const confirmedMembers = effectiveMembers.filter((m) => m.status === 'confirmed');

  const handleVerify = () => {
    if (!effectiveRoadbook.published || !effectiveRoadbook.shareCode) {
      setHasNoLocalData(true);
      setCodeError('');
      return;
    }
    if (codeInput.toUpperCase() === effectiveRoadbook.shareCode.toUpperCase()) {
      setVerified(true);
      setCodeError('');
      setHasNoLocalData(false);
    } else {
      setCodeError('分享码不正确，请确认后重试');
      setHasNoLocalData(false);
    }
  };

  const selectedMember: Member | null = selectedMemberId
    ? confirmedMembers.find((m) => m.id === selectedMemberId) || null
    : null;

  if (!effectiveRoadbook.published) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto flex items-center justify-center mb-4">
            <Route className="w-8 h-8 text-slate-400" />
          </div>
          <h1 className="text-xl font-semibold text-slate-800 mb-2">路书尚未发布</h1>
          <p className="text-sm text-slate-500">
            领队尚未发布本次活动的路书，请稍后再访问或联系领队。
          </p>
        </div>
      </div>
    );
  }

  if (!verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10 max-w-md w-full bg-white/95 backdrop-blur rounded-2xl shadow-2xl border border-white/20 p-8">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl mx-auto flex items-center justify-center mb-5 shadow-lg shadow-teal-500/30">
            <Car className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 text-center mb-2">
            车队路书
          </h1>
          <p className="text-sm text-slate-500 text-center mb-6">
            请输入领队分享的 6 位分享码，或使用领队发送的完整跨设备链接直接进入
          </p>

          {externalDecodeError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-xs text-red-700 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {externalDecodeError}
              </p>
            </div>
          )}

          {hasNoLocalData && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm font-medium text-amber-800 flex items-start gap-2 mb-1.5">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                当前设备没有这份路书
              </p>
              <p className="text-xs text-amber-700 leading-relaxed">
                6 位分享码只能在<strong>领队发布时那台电脑</strong>上使用。如需在手机或其它设备查看，请让领队点击<strong>「复制跨设备分享链接」</strong>后发送给您，完整链接内包含了全部路书数据。
              </p>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">分享码</label>
              <input
                type="text"
                value={codeInput}
                onChange={(e) => {
                  setCodeInput(e.target.value.toUpperCase());
                  setHasNoLocalData(false);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                maxLength={6}
                placeholder="例如：ABC123"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent uppercase"
              />
              {codeError && (
                <p className="text-xs text-red-600 mt-2 flex items-center gap-1 justify-center">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {codeError}
                </p>
              )}
            </div>
            <button
              onClick={handleVerify}
              className="w-full py-3 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition-colors shadow-md shadow-teal-600/20"
            >
              验证并查看
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-400 space-y-1">
            <p className="text-slate-500 font-medium">💡 小贴士</p>
            <p>跨设备查看请使用领队发送的完整链接（URL 含 token 参数）</p>
            <p>链接内包含所有活动和成员数据，无需联网即可打开</p>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedMember) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-10">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center">
                  <Car className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold">{effectiveActivity.name}</h1>
                  <p className="text-sm text-slate-400 mt-0.5">{effectiveActivity.date} · 车队专属路书</p>
                </div>
              </div>
              {externalData && (
                <div className="mb-4 px-3 py-2 bg-emerald-500/20 border border-emerald-400/30 rounded-lg text-xs text-emerald-300 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  已通过链接验证
                </div>
              )}
              <div className="flex items-center gap-4 text-sm flex-wrap">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <MapPin className="w-4 h-4 text-teal-400" />
                  {effectiveActivity.meetingPoint}
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Clock className="w-4 h-4 text-orange-400" />
                  {effectiveActivity.meetingTime} 集合
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Users className="w-4 h-4 text-emerald-400" />
                  {confirmedMembers.length} 辆车
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <User className="w-5 h-5 text-teal-600" />
              请选择您的姓名
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              选择后将显示您的专属车号、对讲频道和行程安排
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {confirmedMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => setSelectedMemberId(member.id)}
                  className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:border-teal-300 hover:bg-teal-50 transition-all text-left group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:shadow-lg transition-shadow">
                    {member.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">{member.name}</span>
                      {member.carNumber && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 font-medium">
                          {member.carNumber}号车
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 truncate mt-0.5">
                      {member.carModel}
                      {member.carColor ? ` · ${member.carColor}` : ''}
                    </p>
                  </div>
                  <ChevronDown className="w-5 h-5 text-slate-300 group-hover:text-teal-500 group-hover:translate-y-0.5 transition-all" />
                </button>
              ))}
            </div>

            {confirmedMembers.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>暂无已确认成员</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const totalDistance = effectiveActivity.checkpoints.length > 0
    ? Math.max(...effectiveActivity.checkpoints.map((c) => c.distance))
    : 0;

  const currentSignRecord = selectedMember
    ? effectiveSignRecords?.find((r) => r.memberId === selectedMember.id)
    : undefined;

  const formatSignTime = (isoString?: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-10">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSelectedMemberId(null)}
            className="text-sm text-slate-600 hover:text-teal-600 flex items-center gap-1"
          >
            ← 返回选择
          </button>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            {externalData ? '链接已验证' : '分享码已验证'}
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/15 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs text-slate-400">您的车号</p>
                <div className="text-5xl font-extrabold text-teal-400 mt-1 leading-none">
                  {selectedMember.carNumber || '-'}
                  <span className="text-xl text-slate-400 ml-1 font-bold">号车</span>
                </div>
              </div>
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                <Car className="w-8 h-8 text-teal-400" />
              </div>
            </div>

            <h2 className="text-lg font-bold mb-1">{effectiveActivity.name}</h2>
            <p className="text-sm text-slate-400 mb-5">{effectiveActivity.date}</p>

            <div className="grid grid-cols-2 gap-3 pt-5 border-t border-white/10">
              <div>
                <p className="text-xs text-slate-400">对讲频道</p>
                <p className="text-base font-mono font-semibold text-orange-400 mt-1">
                  {selectedMember.radioChannel || effectiveRoadbook.radioMainChannel}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">应急频道</p>
                <p className="text-base font-mono font-semibold text-red-400 mt-1">
                  {effectiveRoadbook.radioEmergencyChannel}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">集合时间</p>
                <p className="text-base font-semibold mt-1">{effectiveActivity.meetingTime}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">您的车型</p>
                <p className="text-base font-semibold mt-1 truncate">
                  {selectedMember.carModel}
                  {selectedMember.carColor ? ` · ${selectedMember.carColor}` : ''}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={cn(
          'rounded-2xl shadow-sm border p-5',
          currentSignRecord?.status === 'arrived' && 'bg-emerald-50 border-emerald-200',
          currentSignRecord?.status === 'late' && 'bg-amber-50 border-amber-200',
          currentSignRecord?.status === 'quit' && 'bg-red-50 border-red-200',
          (!currentSignRecord || currentSignRecord.status === 'not_arrived') && 'bg-slate-50 border-slate-200'
        )}>
          <div className="flex items-start gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
              currentSignRecord?.status === 'arrived' && 'bg-emerald-100',
              currentSignRecord?.status === 'late' && 'bg-amber-100',
              currentSignRecord?.status === 'quit' && 'bg-red-100',
              (!currentSignRecord || currentSignRecord.status === 'not_arrived') && 'bg-slate-200'
            )}>
              {currentSignRecord?.status === 'arrived' && <Check className="w-5 h-5 text-emerald-600" />}
              {currentSignRecord?.status === 'late' && <Clock className="w-5 h-5 text-amber-600" />}
              {currentSignRecord?.status === 'quit' && <AlertCircle className="w-5 h-5 text-red-600" />}
              {(!currentSignRecord || currentSignRecord.status === 'not_arrived') && <MapPin className="w-5 h-5 text-slate-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                'text-sm font-semibold',
                currentSignRecord?.status === 'arrived' && 'text-emerald-700',
                currentSignRecord?.status === 'late' && 'text-amber-700',
                currentSignRecord?.status === 'quit' && 'text-red-700',
                (!currentSignRecord || currentSignRecord.status === 'not_arrived') && 'text-slate-700'
              )}>
                {currentSignRecord?.status === 'arrived' && '已签到'}
                {currentSignRecord?.status === 'late' && '迟到'}
                {currentSignRecord?.status === 'quit' && '临时退出'}
                {(!currentSignRecord || currentSignRecord.status === 'not_arrived') && '未到达'}
              </p>
              <div className={cn(
                'text-xs mt-0.5 space-y-1',
                currentSignRecord?.status === 'arrived' && 'text-emerald-600',
                currentSignRecord?.status === 'late' && 'text-amber-700',
                currentSignRecord?.status === 'quit' && 'text-red-600',
                (!currentSignRecord || currentSignRecord.status === 'not_arrived') && 'text-slate-500'
              )}>
                {!currentSignRecord || currentSignRecord.status === 'not_arrived' ? (
                  <p>请前往集合点按车号签到</p>
                ) : (
                  <>
                    {(currentSignRecord.status === 'arrived' || currentSignRecord.status === 'late') && currentSignRecord.signedAt && (
                      <p>⏰ 签到时间：{formatSignTime(currentSignRecord.signedAt)}</p>
                    )}
                    {currentSignRecord.remark && (
                      <p className={cn(
                        'font-medium pt-1',
                        currentSignRecord.status === 'late' && 'text-amber-800',
                        currentSignRecord.status === 'quit' && 'text-red-800',
                        currentSignRecord.status === 'arrived' && 'text-emerald-800'
                      )}>
                        📝 {currentSignRecord.remark}
                      </p>
                    )}
                    {currentSignRecord.status === 'quit' && !currentSignRecord.remark && (
                      <p>已退出本次活动</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <button
            onClick={() => setShowRules(!showRules)}
            className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-slate-800">跟车规则与迟到处理</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {effectiveRoadbook.carRules.length} 条规则 · 请务必遵守
                </p>
              </div>
            </div>
            {showRules ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {showRules && (
            <div className="px-5 pb-5 space-y-4 border-t border-slate-100 pt-4">
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500">跟车规则</p>
                {effectiveRoadbook.carRules.map((rule, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl">
                    <span className="flex-shrink-0 w-5 h-5 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-slate-700 leading-relaxed">{rule}</p>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs font-medium text-amber-700 mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  迟到处理办法
                </p>
                <p className="text-sm text-amber-800 leading-relaxed">{effectiveRoadbook.latePolicy}</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <button
            onClick={() => setShowSchedule(!showSchedule)}
            className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                <Route className="w-5 h-5 text-teal-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-slate-800">当天行程概览</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  全程约 {totalDistance}km · {effectiveActivity.nodes.length} 个节点
                </p>
              </div>
            </div>
            {showSchedule ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {showSchedule && (
            <div className="px-5 pb-5 border-t border-slate-100">
              <div className="relative mt-4">
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200"></div>
                <div className="space-y-4">
                  {effectiveActivity.nodes.map((node, i) => {
                    const config = nodeTypeConfig[node.type] || nodeTypeConfig.driving;
                    const NodeIcon = nodeTypeIcons[node.type] || Clock;
                    return (
                      <div key={node.id} className="relative flex gap-4 pl-10">
                        <div className={cn(
                          'absolute left-3.5 w-4 h-4 rounded-full border-4 border-white shadow -translate-x-1/2',
                          config.color
                        )}></div>
                        <div className={cn(
                          'flex-1 rounded-xl border p-3.5',
                          'border-slate-200 bg-white'
                        )}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={cn(
                                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                                config.bgColor
                              )}>
                                <NodeIcon className={cn('w-4 h-4', config.textColor)} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-800">{node.name}</p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {node.type === 'driving' ? '行驶' : node.type === 'rest' ? '休息' : '停留'} · {formatDuration(node.duration)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              {node.departureTime && node.type !== 'accommodation' && (
                                <div className="text-xs">
                                  <span className="text-slate-400">出发 </span>
                                  <span className="font-mono font-semibold text-teal-600">{node.departureTime}</span>
                                </div>
                              )}
                              {node.arrivalTime && (
                                <div className="text-xs mt-0.5">
                                  <span className="text-slate-400">到达 </span>
                                  {node.arrivalTimeEarly && node.arrivalTimeLate
                                    ? (
                                      <span className="font-mono font-semibold text-slate-700">
                                        <span className="text-teal-600">{node.arrivalTimeEarly}</span>
                                        <span className="text-slate-400 mx-1">~</span>
                                        <span className="text-orange-600">{node.arrivalTimeLate}</span>
                                      </span>
                                    )
                                    : <span className="font-mono font-semibold text-slate-700">{node.arrivalTime}</span>}
                                </div>
                              )}
                            </div>
                          </div>
                          {node.notes && (
                            <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 leading-relaxed">
                              💡 {node.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="text-xs text-slate-400 text-center mt-5">
                * 时间为计划时间，实际可能因路况有所浮动，请注意保持车距
              </p>
            </div>
          )}
        </div>

        <div className="text-center text-xs text-slate-400 pt-2">
          若有任何疑问，请联系领队 · 祝您旅途愉快 🚗
        </div>
      </div>
    </div>
  );
}

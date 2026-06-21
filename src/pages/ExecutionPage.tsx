import { useMemo, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import {
  ClipboardList,
  Check,
  X,
  Clock,
  MapPin,
  Car,
  Users,
  RefreshCw,
  AlertTriangle,
  LogOut,
  User,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SignStatus, MemberSignRecord } from '@/types';

const STATUS_OPTIONS: { value: SignStatus; label: string; icon: typeof Check; color: string; bg: string }[] = [
  { value: 'not_arrived', label: '未到达', icon: Clock, color: 'text-slate-500', bg: 'bg-slate-100 hover:bg-slate-200 ring-slate-300' },
  { value: 'arrived', label: '已到达', icon: Check, color: 'text-emerald-600', bg: 'bg-emerald-50 hover:bg-emerald-100 ring-emerald-300' },
  { value: 'late', label: '迟到', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50 hover:bg-amber-100 ring-amber-300' },
  { value: 'quit', label: '临时退出', icon: X, color: 'text-red-600', bg: 'bg-red-50 hover:bg-red-100 ring-red-300' },
];

function formatHHMM(iso?: string): string {
  if (!iso) return '--:--';
  try {
    const d = new Date(iso);
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    return `${hh}:${mm}`;
  } catch {
    return '--:--';
  }
}

export default function ExecutionPage() {
  const { activity, members, roadbook, signRecords, setSignStatus, resetSignRecords } = useAppStore();
  const [remarkInput, setRemarkInput] = useState<{ memberId: string; value: string } | null>(null);

  const confirmedMembers = useMemo(() => {
    const ordered = roadbook.convoyOrder
      .map((id) => members.find((m) => m.id === id))
      .filter((m): m is NonNullable<typeof m> => !!m && m.status === 'confirmed');

    const unordered = members.filter(
      (m) => m.status === 'confirmed' && !roadbook.convoyOrder.includes(m.id)
    );
    return [...ordered, ...unordered];
  }, [members, roadbook.convoyOrder]);

  const stats = useMemo(() => {
    const total = confirmedMembers.length;
    const getStatus = (id: string) => signRecords.find((r) => r.memberId === id)?.status || 'not_arrived';
    const arrived = confirmedMembers.filter((m) => getStatus(m.id) === 'arrived').length;
    const late = confirmedMembers.filter((m) => getStatus(m.id) === 'late').length;
    const quit = confirmedMembers.filter((m) => getStatus(m.id) === 'quit').length;
    const missing = total - arrived - late - quit;
    return { total, arrived, late, quit, missing };
  }, [confirmedMembers, signRecords]);

  const signMap = useMemo(() => {
    const m = new Map<string, MemberSignRecord>();
    signRecords.forEach((r) => m.set(r.memberId, r));
    return m;
  }, [signRecords]);

  if (!roadbook.published) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">路书尚未发布</h2>
          <p className="text-slate-500 mb-6">
            请先在「车队路书」页面完成编组、发布路书后，再进入执行签到视图
          </p>
          <button
            onClick={() => (window.location.hash = '#/roadbook')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            前往发布路书
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-orange-500/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-11 h-11 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold">{activity.name}</h1>
                  <p className="text-slate-400 text-xs md:text-sm mt-0.5">出发日签到执行视图</p>
                </div>
              </div>

              <div className="flex items-center gap-4 md:gap-6 mt-5 flex-wrap text-sm">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-teal-400" />
                  <span className="text-slate-300">
                    {activity.date} · 集合 {activity.meetingTime}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-orange-400" />
                  <span className="text-slate-300 truncate max-w-[280px]">{activity.meetingPoint}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (confirm('确认重置所有签到状态？此操作不可撤销。')) {
                  resetSignRecords();
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-slate-200 rounded-lg text-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              重置签到
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400">应到车辆</span>
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </div>
            <div className="bg-emerald-500/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-emerald-300/80">已到达</span>
                <Check className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400">{stats.arrived}</div>
            </div>
            <div className="bg-amber-500/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-amber-300/80">迟到</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-400">{stats.late}</div>
            </div>
            <div className="bg-rose-500/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-rose-300/80">临时退出 / 未到</span>
                <LogOut className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-bold text-rose-400">
                {stats.quit + stats.missing}
                <span className="text-sm text-rose-300/60 ml-1 font-normal">
                  ({stats.quit}退出 / {stats.missing}未到)
                </span>
              </div>
            </div>
          </div>

          {stats.arrived + stats.late === stats.total && stats.total > 0 && (
            <div className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-emerald-500/15 text-emerald-300 rounded-lg text-sm">
              <Check className="w-4 h-4" />
              全员已签到，可按预定时间准时出发
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Car className="w-5 h-5 text-teal-600" />
            编组签到表（按车号顺序）
          </h2>
          <div className="text-xs text-slate-500">
            点击按钮切换签到状态
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {confirmedMembers.length === 0 ? (
            <div className="p-10 text-center text-slate-500">暂无已确认成员</div>
          ) : (
            confirmedMembers.map((member, idx) => {
              const record = signMap.get(member.id);
              const status = record?.status || 'not_arrived';
              const isLast = idx === confirmedMembers.length - 1;
              const isFirst = idx === 0;

              return (
                <div key={member.id} className="p-4 md:p-5 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-start gap-4 flex-col md:flex-row md:items-center">
                    <div className={cn(
                      'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-sm',
                      isFirst
                        ? 'bg-gradient-to-br from-orange-400 to-orange-600'
                        : isLast
                          ? 'bg-gradient-to-br from-emerald-400 to-emerald-600'
                          : 'bg-gradient-to-br from-slate-500 to-slate-600'
                    )}>
                      {member.carNumber ?? '?'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800">{member.name}</span>
                        {isFirst && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">头车</span>
                        )}
                        {isLast && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">尾车</span>
                        )}
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {member.carModel}{member.carColor ? ` · ${member.carColor}` : ''}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <span>频道 <span className="font-mono text-teal-700 font-medium">{member.radioChannel || '-'}</span></span>
                        <span>续航 {member.range}km</span>
                        {record?.signedAt && (
                          <span>签到于 {formatHHMM(record.signedAt)}</span>
                        )}
                      </div>
                      {record?.remark && (
                        <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded px-2.5 py-1 inline-block">
                          📝 {record.remark}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
                      {STATUS_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        const active = status === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() =>
                              setSignStatus(
                                member.id,
                                active ? 'not_arrived' : opt.value,
                                remarkInput?.memberId === member.id ? remarkInput.value : undefined
                              )
                            }
                            className={cn(
                              'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium ring-1 transition-all',
                              active
                                ? `${opt.bg} ${opt.color} ring-2 scale-105 shadow-sm`
                                : `${opt.bg} ${opt.color} opacity-60 hover:opacity-100`
                            )}
                            title={opt.label}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-3 pl-0 md:pl-16">
                    {remarkInput?.memberId === member.id ? (
                      <div className="flex items-center gap-2 max-w-sm">
                        <input
                          type="text"
                          value={remarkInput.value}
                          onChange={(e) => setRemarkInput({ memberId: member.id, value: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setRemarkInput(null);
                            }
                          }}
                          placeholder="添加备注（迟到原因、电话联系等）"
                          className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                          autoFocus
                        />
                        <button
                          onClick={() => setRemarkInput(null)}
                          className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          完成
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          setRemarkInput({ memberId: member.id, value: record?.remark || '' })
                        }
                        className="text-xs text-slate-400 hover:text-teal-600 transition-colors inline-flex items-center gap-1"
                      >
                        {record?.remark ? '编辑备注' : '+ 添加备注'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { analyzeMembers } from '@/utils/analyzer';
import { Member, DrivingExperience, MemberStatus } from '@/types';
import {
  Users,
  Plus,
  Car,
  Battery,
  Award,
  UserPlus,
  Trash2,
  X,
  Check,
  AlertTriangle,
  Shield,
  Baby,
  Radio,
  Phone,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const experienceLabels: Record<DrivingExperience, { label: string; color: string }> = {
  novice: { label: '新手', color: 'text-red-600 bg-red-50' },
  intermediate: { label: '熟练', color: 'text-amber-600 bg-amber-50' },
  expert: { label: '老司机', color: 'text-emerald-600 bg-emerald-50' },
};

const statusLabels: Record<MemberStatus, { label: string; color: string }> = {
  confirmed: { label: '已确认', color: 'text-emerald-600 bg-emerald-50' },
  pending: { label: '待确认', color: 'text-amber-600 bg-amber-50' },
  cancelled: { label: '已取消', color: 'text-slate-400 bg-slate-100' },
};

interface MemberFormData {
  name: string;
  phone: string;
  carModel: string;
  carColor: string;
  range: string;
  drivingExperience: DrivingExperience;
  hasElderly: boolean;
  hasChildren: boolean;
  willingTail: boolean;
}

export default function MembersPage() {
  const { activity, members, addMember, removeMember, updateMember, assignCarNumbers } = useAppStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | MemberStatus>('all');
  const [newMember, setNewMember] = useState<MemberFormData>({
    name: '',
    phone: '',
    carModel: '',
    carColor: '',
    range: '500',
    drivingExperience: 'intermediate',
    hasElderly: false,
    hasChildren: false,
    willingTail: false,
  });

  const analysis = analyzeMembers(members, activity);

  const filteredMembers = filterStatus === 'all'
    ? members
    : members.filter((m) => m.status === filterStatus);

  const confirmedCount = members.filter((m) => m.status === 'confirmed').length;

  const handleAddMember = () => {
    if (!newMember.name || !newMember.carModel) return;

    const member: Member = {
      id: `m-${Date.now()}`,
      name: newMember.name,
      phone: newMember.phone,
      carModel: newMember.carModel,
      carColor: newMember.carColor,
      range: Number(newMember.range),
      drivingExperience: newMember.drivingExperience,
      hasElderly: newMember.hasElderly,
      hasChildren: newMember.hasChildren,
      willingTail: newMember.willingTail,
      status: 'confirmed',
    };

    addMember(member);
    setNewMember({
      name: '',
      phone: '',
      carModel: '',
      carColor: '',
      range: '500',
      drivingExperience: 'intermediate',
      hasElderly: false,
      hasChildren: false,
      willingTail: false,
    });
    setShowAddForm(false);
  };

  const riskLevelConfig = {
    low: { color: 'bg-emerald-500', label: '低风险', textColor: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    medium: { color: 'bg-amber-500', label: '中风险', textColor: 'text-amber-600', bgColor: 'bg-amber-50' },
    high: { color: 'bg-red-500', label: '高风险', textColor: 'text-red-600', bgColor: 'bg-red-50' },
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-600" />
                  报名成员列表
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  共 {members.length} 人报名，已确认 {confirmedCount} 人
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-sm">
                  {(['all', 'confirmed', 'pending', 'cancelled'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={cn(
                        'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                        filterStatus === status
                          ? 'bg-teal-600 text-white'
                          : 'text-slate-500 hover:bg-slate-100'
                      )}
                    >
                      {status === 'all' ? '全部' : statusLabels[status].label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  添加成员
                </button>
              </div>
            </div>

            {showAddForm && (
              <div className="mb-6 p-5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-slate-800 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-teal-600" />
                    添加新成员
                  </h4>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-600">姓名 *</label>
                    <input
                      type="text"
                      value={newMember.name}
                      onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="请输入姓名"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-600">联系电话</label>
                    <input
                      type="tel"
                      value={newMember.phone}
                      onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="请输入手机号"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-600">车型 *</label>
                    <input
                      type="text"
                      value={newMember.carModel}
                      onChange={(e) => setNewMember({ ...newMember, carModel: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="如：丰田普拉多"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-600">车身颜色</label>
                    <input
                      type="text"
                      value={newMember.carColor}
                      onChange={(e) => setNewMember({ ...newMember, carColor: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="如：白色"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-600">续航里程 (km)</label>
                    <input
                      type="number"
                      value={newMember.range}
                      onChange={(e) => setNewMember({ ...newMember, range: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-600">驾驶经验</label>
                    <select
                      value={newMember.drivingExperience}
                      onChange={(e) => setNewMember({ ...newMember, drivingExperience: e.target.value as DrivingExperience })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="novice">新手</option>
                      <option value="intermediate">熟练</option>
                      <option value="expert">老司机</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newMember.hasElderly}
                      onChange={(e) => setNewMember({ ...newMember, hasElderly: e.target.checked })}
                      className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    />
                    <span className="text-sm text-slate-600 flex items-center gap-1">
                      <Shield className="w-4 h-4" />
                      携带老人
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newMember.hasChildren}
                      onChange={(e) => setNewMember({ ...newMember, hasChildren: e.target.checked })}
                      className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    />
                    <span className="text-sm text-slate-600 flex items-center gap-1">
                      <Baby className="w-4 h-4" />
                      携带儿童
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newMember.willingTail}
                      onChange={(e) => setNewMember({ ...newMember, willingTail: e.target.checked })}
                      className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    />
                    <span className="text-sm text-slate-600 flex items-center gap-1">
                      <Radio className="w-4 h-4" />
                      愿意担任尾车
                    </span>
                  </label>
                </div>

                <div className="flex gap-2 mt-5">
                  <button
                    onClick={handleAddMember}
                    className="px-4 py-2 bg-teal-600 text-white text-sm rounded-md hover:bg-teal-700 transition-colors"
                  >
                    确认添加
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 bg-white text-slate-600 text-sm rounded-md border border-slate-300 hover:bg-slate-50 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {filteredMembers.map((member, index) => {
                const expConfig = experienceLabels[member.drivingExperience];
                const statusConfig = statusLabels[member.status];

                return (
                  <div
                    key={member.id}
                    className="p-4 border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                          {member.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-semibold text-slate-800">{member.name}</h4>
                            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', expConfig.color)}>
                              {expConfig.label}
                            </span>
                            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', statusConfig.color)}>
                              {statusConfig.label}
                            </span>
                            {member.carNumber && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 font-medium">
                                {member.carNumber}号车
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Car className="w-4 h-4" />
                              {member.carModel}
                              {member.carColor && ` · ${member.carColor}`}
                            </span>
                            <span className="flex items-center gap-1">
                              <Battery className="w-4 h-4" />
                              {member.range}km 续航
                            </span>
                            {member.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                {member.phone}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            {member.hasElderly && (
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Shield className="w-3.5 h-3.5" />
                                有老人
                              </span>
                            )}
                            {member.hasChildren && (
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Baby className="w-3.5 h-3.5" />
                                有儿童
                              </span>
                            )}
                            {member.willingTail && (
                              <span className="text-xs text-teal-600 flex items-center gap-1 font-medium">
                                <Award className="w-3.5 h-3.5" />
                                志愿尾车
                              </span>
                            )}
                            {member.radioChannel && (
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Radio className="w-3.5 h-3.5" />
                                {member.radioChannel}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeMember(member.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredMembers.length === 0 && (
                <div className="text-center py-16 text-slate-400">
                  <Users className="w-14 h-14 mx-auto mb-3 opacity-50" />
                  <p>暂无成员</p>
                  <p className="text-sm mt-1">点击上方按钮添加报名成员</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-teal-600" />
              智能分析
            </h3>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">整体风险评估</span>
                <span className={cn('text-sm font-semibold', riskLevelConfig[analysis.riskLevel].textColor)}>
                  {riskLevelConfig[analysis.riskLevel].label}
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', riskLevelConfig[analysis.riskLevel].color)}
                  style={{
                    width: analysis.riskLevel === 'low' ? '33%' : analysis.riskLevel === 'medium' ? '66%' : '100%',
                  }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">最弱续航</p>
                <p className="text-lg font-bold text-slate-800 mt-1">
                  {analysis.minRange ? `${analysis.minRange}km` : '-'}
                </p>
                {analysis.minRangeMember && (
                  <p className="text-xs text-slate-400 mt-0.5">{analysis.minRangeMember.name}</p>
                )}
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">总里程</p>
                <p className="text-lg font-bold text-slate-800 mt-1">{analysis.totalDistance}km</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  <Clock className="w-3 h-3 inline mr-1" />
                  约{Math.round(analysis.estimatedDriveTime / 60)}小时
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700 mb-3">建议提醒</p>
              {analysis.restSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={cn(
                    'p-3 rounded-lg text-sm border-l-4',
                    suggestion.includes('⚠️')
                      ? 'bg-red-50 border-red-400 text-red-700'
                      : suggestion.includes('ℹ️')
                        ? 'bg-amber-50 border-amber-400 text-amber-700'
                        : 'bg-emerald-50 border-emerald-400 text-emerald-700'
                  )}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Car className="w-5 h-5 text-teal-600" />
              快速操作
            </h3>
            <div className="space-y-3">
              <button
                onClick={assignCarNumbers}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Award className="w-4 h-4" />
                自动分配车号
              </button>
              <p className="text-xs text-slate-400 text-center">
                系统将根据驾驶经验自动排序，经验丰富者在前
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

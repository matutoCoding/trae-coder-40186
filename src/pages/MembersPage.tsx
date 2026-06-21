import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { analyzeMembers } from '@/utils/analyzer';
import { Member, DrivingExperience, MemberStatus, SuggestedStop } from '@/types';
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
  Upload,
  FileText,
  Fuel,
  Coffee,
  Camera,
  ChevronRight,
  CheckCircle2,
  Download,
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

const suggestedStopIcon = {
  rest: Coffee,
  supply: Fuel,
  scenic: Camera,
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
  const { activity, members, addMember, removeMember, updateMember, assignCarNumbers, batchAddMembers, adoptSuggestedStop } = useAppStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | MemberStatus>('all');
  const [batchText, setBatchText] = useState('');
  const [batchError, setBatchError] = useState('');
  const [adoptedIds, setAdoptedIds] = useState<Set<string>>(new Set());
  const [importPreview, setImportPreview] = useState<{ members: Omit<Member, 'id'>[]; errors: string[] } | null>(null);
  const [confirmImport, setConfirmImport] = useState(false);
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

  const parseBoolean = (val: string): boolean => {
    const v = val.trim().toLowerCase();
    if (!v) return false;
    const trueValues = ['是', '有', '带', '携', '1', '真', 'y', 'yes', 'true'];
    const falseValues = ['否', '无', '没', '不', '0', '假', 'n', 'no', 'false'];
    if (trueValues.includes(v)) return true;
    if (falseValues.includes(v)) return false;
    return false;
  };

  const NEGATIVE_PREFIX = /^(无|没|不|否|非)/;
  const POSITIVE_PREFIX = /^(有|带|携|是)/;

  const parseBooleanField = (token: string, keywords: RegExp): boolean => {
    const t = token.trim();
    if (!t) return false;
    const lowerT = t.toLowerCase();

    const kwMatch = t.match(keywords) || lowerT.match(keywords);
    if (!kwMatch) return false;

    const withoutKw = t.replace(keywords, '').replace(lowerT.match(keywords) ? new RegExp(keywords.source, keywords.flags) : '', '').trim();

    if (!withoutKw) {
      if (NEGATIVE_PREFIX.test(t)) return false;
      if (POSITIVE_PREFIX.test(t)) return true;
      return true;
    }

    const negMatch = t.match(NEGATIVE_PREFIX);
    if (negMatch && !withoutKw) return false;
    if (POSITIVE_PREFIX.test(t) && !withoutKw) return true;

    return parseBoolean(withoutKw);
  };

  const parseBatchText = (text: string): { members: Omit<Member, 'id'>[]; errors: string[] } => {
    const lines = text.trim().split('\n').filter((l) => l.trim());
    const members: Omit<Member, 'id'>[] = [];
    const errors: string[] = [];
    let lineIdx = 0;

    const isKeywordOnly = (token: string, keywords: RegExp): boolean => {
      const t = token.trim();
      if (!t) return false;
      const stripped = t.replace(NEGATIVE_PREFIX, '').replace(POSITIVE_PREFIX, '').trim();
      if (!stripped) return keywords.test(t.toLowerCase());
      return keywords.test(t.toLowerCase()) && parseBoolean(stripped);
    };

    for (const line of lines) {
      lineIdx++;
      const parts = line.split(/[,，\t|]/).map((s) => s.trim()).filter(Boolean);
      if (parts.length < 3) {
        throw new Error(`第 ${lineIdx} 行格式错误，至少需要：姓名,车型,续航`);
      }
      const [name, carModel, rangeStr, ...rest] = parts;
      const range = parseInt(rangeStr, 10);
      if (!name || !carModel || isNaN(range)) {
        throw new Error(`第 ${lineIdx} 行数据不完整：姓名、车型、续航(数字)必填`);
      }

      let experience: DrivingExperience | null = null;
      let phone = '';
      let carColor = '';
      let hasElderly = false;
      let hasChildren = false;
      let willingTail = false;

      for (let i = 0; i < rest.length; i++) {
        const token = rest[i];
        const t = token.toLowerCase();
        if (t === '新手' || t === 'novice') experience = 'novice';
        else if (t === '熟练' || t === 'intermediate') experience = 'intermediate';
        else if (t === '老司机' || t === 'expert') experience = 'expert';
        else if (isKeywordOnly(token, /老|老人|elderly/i)) hasElderly = !NEGATIVE_PREFIX.test(token);
        else if (isKeywordOnly(token, /孩|孩子|儿童|children/i)) hasChildren = !NEGATIVE_PREFIX.test(token);
        else if (isKeywordOnly(token, /尾|尾车|tail/i)) willingTail = !NEGATIVE_PREFIX.test(token);
        else if (/^\d{3,}$/.test(token)) phone = token;
        else if (token.length <= 4 && !/^\d+$/.test(token)) {
          if (carColor) {
            errors.push(`第 ${lineIdx} 行：重复识别颜色「${token}」，保留首次识别的「${carColor}」`);
          } else {
            carColor = token;
          }
        } else if (parseBoolean(token) || NEGATIVE_PREFIX.test(token) || POSITIVE_PREFIX.test(token) || t === 'n' || t === 'no' || t === 'false' || t === '0') {
          if (i >= 6 || rest.length <= 9) {
            if (i === 6 || (i === rest.length - 3 && rest.length <= 9)) hasElderly = parseBoolean(token) || (isKeywordOnly(token, /老|老人|elderly/i) && !NEGATIVE_PREFIX.test(token));
            else if (i === 7 || (i === rest.length - 2 && rest.length <= 9)) hasChildren = parseBoolean(token) || (isKeywordOnly(token, /孩|孩子|children/i) && !NEGATIVE_PREFIX.test(token));
            else if (i === 8 || (i === rest.length - 1 && rest.length <= 9)) willingTail = parseBoolean(token) || (isKeywordOnly(token, /尾|尾车|tail/i) && !NEGATIVE_PREFIX.test(token));
          }
        }
      }

      if (!experience) {
        errors.push(`第 ${lineIdx} 行「${name}」：经验字段为空，使用默认值「熟练」`);
        experience = 'intermediate';
      }
      if (!carColor) {
        errors.push(`第 ${lineIdx} 行「${name}」：未识别颜色`);
      }

      members.push({
        name,
        carModel,
        carColor,
        phone,
        range,
        drivingExperience: experience,
        hasElderly,
        hasChildren,
        willingTail,
        status: 'confirmed',
      });
    }

    return { members, errors };
  };

  const handlePreviewImport = () => {
    try {
      setBatchError('');
      setImportPreview(null);
      setConfirmImport(false);
      const parsed = parseBatchText(batchText);
      if (parsed.members.length === 0) {
        setBatchError('未解析出有效数据');
        return;
      }
      setImportPreview(parsed);
      setConfirmImport(true);
    } catch (err: any) {
      setBatchError(err.message || '解析失败，请检查格式');
    }
  };

  const handleConfirmImport = () => {
    if (!importPreview) return;
    batchAddMembers(importPreview.members);
    setImportPreview(null);
    setConfirmImport(false);
    setBatchText('');
    setShowBatchForm(false);
  };

  const handleCancelPreview = () => {
    setImportPreview(null);
    setConfirmImport(false);
  };

  const handleAdoptStop = (stop: SuggestedStop) => {
    adoptSuggestedStop(stop);
    setAdoptedIds((prev) => new Set(prev).add(stop.id));
  };

  const riskLevelConfig = {
    low: { color: 'bg-emerald-500', label: '低风险', textColor: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    medium: { color: 'bg-amber-500', label: '中风险', textColor: 'text-amber-600', bgColor: 'bg-amber-50' },
    high: { color: 'bg-red-500', label: '高风险', textColor: 'text-red-600', bgColor: 'bg-red-50' },
  };

  const priorityConfig = {
    high: { color: 'text-red-600', bgColor: 'bg-red-50 border-red-200', label: '强烈建议' },
    medium: { color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-200', label: '建议' },
    low: { color: 'text-slate-600', bgColor: 'bg-slate-50 border-slate-200', label: '可选' },
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
                  onClick={() => setShowBatchForm(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  批量导入
                </button>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  添加成员
                </button>
              </div>
            </div>

            {showBatchForm && (
              <div className="mb-6 p-5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-slate-800 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-teal-600" />
                    批量导入成员
                  </h4>
                  <button onClick={() => { setShowBatchForm(false); setBatchError(''); setBatchText(''); setImportPreview(null); setConfirmImport(false); }} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-white rounded-md p-3 border border-slate-200 text-xs text-slate-600 mb-3 space-y-1">
                  <p className="font-medium text-slate-700">格式说明（每行一个成员，逗号或 Tab 分隔）：</p>
                  <p>
                    <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">姓名,车型,续航(km),驾驶经验,手机,颜色,老人,孩子,尾车</code>
                  </p>
                  <p className="text-slate-500">
                    示例：<code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">张伟,丰田普拉多,800,老司机,138****1234,白色,,孩子,</code>
                  </p>
                  <p className="text-slate-500">
                    驾驶经验可选值：新手 / 熟练 / 老司机；布尔字段（老人/孩子/尾车）支持：是/有/带/携/1/真/Y/YES/true 视为是，否/无/0/N/no/false 或空视为否
                  </p>
                  <button
                    type="button"
                    onClick={() => setBatchText(`张伟,丰田普拉多,800,老司机,13800138000,白色,有老人,无孩子,否\n王强,特斯拉Model Y,450,新手,13900139000,银色,否,有,尾车\n刘芳,大众途观L,700,熟练,13700137000,棕色,Y,Y,1`)}
                    className="text-teal-600 hover:text-teal-700 text-xs font-medium mt-1 inline-flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    载入示例
                  </button>
                </div>

                <textarea
                  value={batchText}
                  onChange={(e) => setBatchText(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="按格式粘贴成员信息，每行一位..."
                />

                {batchError && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {batchError}
                  </p>
                )}

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handlePreviewImport}
                    className="px-4 py-2 bg-teal-600 text-white text-sm rounded-md hover:bg-teal-700 transition-colors"
                  >
                    预览解析结果
                  </button>
                  <button
                    onClick={() => { setShowBatchForm(false); setBatchError(''); setBatchText(''); setImportPreview(null); setConfirmImport(false); }}
                    className="px-4 py-2 bg-white text-slate-600 text-sm rounded-md border border-slate-300 hover:bg-slate-50 transition-colors"
                  >
                    取消
                  </button>
                </div>

                {importPreview && (
                  <div className="mt-4 bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
                          <CheckCircle2 className="w-4 h-4" />
                          共解析到 {importPreview.members.length} 位成员
                        </span>
                        {importPreview.errors.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-600">
                            <AlertTriangle className="w-4 h-4" />
                            {importPreview.errors.length} 条提示
                          </span>
                        )}
                      </div>
                    </div>

                    {importPreview.errors.length > 0 && (
                      <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 max-h-32 overflow-y-auto">
                        {importPreview.errors.map((err, idx) => (
                          <p key={idx} className="text-xs text-amber-700 leading-relaxed">• {err}</p>
                        ))}
                      </div>
                    )}

                    <div className="max-h-[300px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs">姓名</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs">车型</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs">续航</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs">经验</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs">颜色</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs">手机</th>
                            <th className="px-3 py-2 text-center font-medium text-slate-600 text-xs">老人</th>
                            <th className="px-3 py-2 text-center font-medium text-slate-600 text-xs">孩子</th>
                            <th className="px-3 py-2 text-center font-medium text-slate-600 text-xs">尾车</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {importPreview.members.map((m, idx) => {
                            const expCfg = experienceLabels[m.drivingExperience];
                            return (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="px-3 py-2 font-medium text-slate-800">{m.name}</td>
                                <td className="px-3 py-2 text-slate-600">{m.carModel}</td>
                                <td className="px-3 py-2 text-slate-600">{m.range}km</td>
                                <td className="px-3 py-2">
                                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', expCfg.color)}>
                                    {expCfg.label}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-slate-600">{m.carColor || '-'}</td>
                                <td className="px-3 py-2 text-slate-600 font-mono text-xs">{m.phone || '-'}</td>
                                <td className="px-3 py-2 text-center">
                                  {m.hasElderly ? (
                                    <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                                  ) : (
                                    <span className="text-slate-300">-</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  {m.hasChildren ? (
                                    <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                                  ) : (
                                    <span className="text-slate-300">-</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  {m.willingTail ? (
                                    <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                                  ) : (
                                    <span className="text-slate-300">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex items-center justify-end gap-2 px-4 py-3 bg-slate-50 border-t border-slate-200">
                      <button
                        onClick={handleCancelPreview}
                        className="px-3 py-1.5 text-xs bg-slate-200 text-slate-600 rounded-md hover:bg-slate-300 transition-colors"
                      >
                        取消预览
                      </button>
                      <button
                        onClick={handleConfirmImport}
                        className="px-4 py-2 bg-teal-700 text-white text-sm font-medium rounded-md hover:bg-teal-800 transition-colors"
                      >
                        确认导入这 {importPreview.members.length} 人
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {showAddForm && (
              <div className="mb-6 p-5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-slate-800 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-teal-600" />
                    添加新成员
                  </h4>
                  <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600">
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
              {filteredMembers.map((member) => {
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
                          <div className="flex items-center gap-3 flex-wrap">
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
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 flex-wrap">
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
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
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

            <div className="space-y-2 mb-5">
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

            {analysis.suggestedStops.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-slate-700">建议停靠点</p>
                  <span className="text-xs text-slate-400">点击采纳加入路书</span>
                </div>
                <div className="space-y-2">
                  {analysis.suggestedStops.map((stop) => {
                    const StopIcon = suggestedStopIcon[stop.type];
                    const priorityCfg = priorityConfig[stop.priority];
                    const isAdopted = adoptedIds.has(stop.id);

                    return (
                      <div
                        key={stop.id}
                        className={cn(
                          'p-3 rounded-lg border transition-all',
                          isAdopted
                            ? 'bg-emerald-50 border-emerald-200'
                            : priorityCfg.bgColor
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 min-w-0">
                            <div className={cn(
                              'w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0',
                              stop.type === 'rest' ? 'bg-amber-100 text-amber-600'
                                : stop.type === 'supply' ? 'bg-blue-100 text-blue-600'
                                  : 'bg-emerald-100 text-emerald-600'
                            )}>
                              <StopIcon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={cn('text-sm font-medium', priorityCfg.color)}>
                                  {stop.name}
                                </span>
                                <span className={cn(
                                  'text-xs px-1.5 py-0.5 rounded-full',
                                  stop.type === 'rest' ? 'bg-amber-100 text-amber-600'
                                    : stop.type === 'supply' ? 'bg-blue-100 text-blue-600'
                                      : 'bg-emerald-100 text-emerald-600'
                                )}>
                                  {stop.type === 'rest' ? '休息' : stop.type === 'supply' ? '补给' : '景区'}
                                </span>
                                <span className="text-xs text-slate-400">
                                  {priorityCfg.label}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                里程 {stop.distance}km · 停留 {stop.duration} 分钟
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">{stop.reason}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleAdoptStop(stop)}
                            disabled={isAdopted}
                            className={cn(
                              'flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
                              isAdopted
                                ? 'bg-emerald-100 text-emerald-600 cursor-default'
                                : 'bg-teal-600 text-white hover:bg-teal-700'
                            )}
                          >
                            {isAdopted ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                已采纳
                              </>
                            ) : (
                              <>
                                <ChevronRight className="w-3.5 h-3.5" />
                                采纳
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
              <button
                onClick={() => {
                  const link = `${window.location.origin}${window.location.pathname.replace(/\/[^/]*$/, '')}/view?code=${useAppStore.getState().roadbook.shareCode || ''}`;
                  navigator.clipboard?.writeText(link).catch(() => {});
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                复制成员查看链接
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

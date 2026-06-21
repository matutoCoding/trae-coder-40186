import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import {
  Route,
  Car,
  Radio,
  Users,
  Share2,
  Copy,
  Check,
  Clock,
  MapPin,
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  Download,
  X,
  Printer,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/utils/timeCalculator';
import { buildShareLink } from '@/utils/shareCodec';
import { openOfflinePrintableRoadbook } from '@/utils/exportRoadbook';

export default function RoadbookPage() {
  const { activity, members, roadbook, updateRoadbook, publishRoadbook, previewMissingAssignments, applyMissingAssignments, signRecords } = useAppStore();
  const navigate = useNavigate();
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [showRules, setShowRules] = useState(true);
  const [editingRule, setEditingRule] = useState<number | null>(null);
  const [newRule, setNewRule] = useState('');
  const [showPublishPreview, setShowPublishPreview] = useState(false);
  const [publishPrep, setPublishPrep] = useState<ReturnType<typeof previewMissingAssignments> | null>(null);

  const confirmedMembers = members.filter((m) => m.status === 'confirmed');

  const convoyMembers = roadbook.convoyOrder
    .map((id) => members.find((m) => m.id === id))
    .filter(Boolean);

  const handleCopyShareCode = () => {
    if (roadbook.shareCode) {
      navigator.clipboard.writeText(roadbook.shareCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyShareLink = () => {
    const link = `${window.location.origin}${window.location.pathname.replace(/\/[^/]*$/, '')}/view?code=${roadbook.shareCode || ''}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyShareFullLink = () => {
    const link = buildShareLink(window.location.origin, window.location.pathname.replace(/\/[^/]*$/, ''), activity, members, roadbook, signRecords);
    navigator.clipboard.writeText(link);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2000);
  };

  const handlePreparePublish = () => {
    const preview = previewMissingAssignments();
    setPublishPrep(preview);
    setShowPublishPreview(true);
  };

  const handleConfirmPublish = () => {
    applyMissingAssignments();
    publishRoadbook();
    setShowPublishPreview(false);
  };

  const handleCancelPublish = () => {
    setShowPublishPreview(false);
  };

  const handleAddRule = () => {
    if (!newRule.trim()) return;
    updateRoadbook({ carRules: [...roadbook.carRules, newRule.trim()] });
    setNewRule('');
  };

  const handleRemoveRule = (index: number) => {
    const newRules = roadbook.carRules.filter((_, i) => i !== index);
    updateRoadbook({ carRules: newRules });
  };

  const selectedMemberData = selectedMember
    ? members.find((m) => m.id === selectedMember)
    : null;

  const totalDistance = activity.checkpoints.length > 0
    ? Math.max(...activity.checkpoints.map((c) => c.distance))
    : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30">
                  <Route className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{activity.name}</h1>
                  <p className="text-slate-400 text-sm mt-0.5">车队统一路书</p>
                </div>
              </div>

              <div className="flex items-center gap-6 mt-6">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-400" />
                  <span className="text-sm text-slate-300">
                    {activity.date} · {activity.meetingTime} 集合
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-slate-300">{activity.meetingPoint}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-slate-300">{confirmedMembers.length} 辆车</span>
                </div>
                <div className="flex items-center gap-2">
                  <Route className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-slate-300">全程约 {totalDistance}km</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              {roadbook.published ? (
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium">
                    <Check className="w-4 h-4" />
                    已发布
                  </div>
                  {roadbook.shareCode && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-sm text-slate-400">分享码：</span>
                        <code className="px-3 py-1.5 bg-slate-700 rounded-lg text-sm font-mono text-teal-400">
                          {roadbook.shareCode}
                        </code>
                        <button
                          onClick={handleCopyShareCode}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                          title="复制分享码"
                        >
                          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-sm text-slate-400">成员链接：</span>
                        <button
                          onClick={handleCopyShareLink}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium transition-colors"
                        >
                          {copiedLink ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              已复制
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              复制分享码
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleCopyShareFullLink}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium transition-colors"
                        >
                          {copiedShareLink ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              已复制
                            </>
                          ) : (
                            <>
                              <Share2 className="w-3.5 h-3.5" />
                              复制跨设备分享链接
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 justify-end pt-2">
                    <button
                      onClick={() => navigate('/execution')}
                      className="flex items-center gap-1.5 px-3 py-2 bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 hover:text-teal-300 rounded-lg text-sm font-medium transition-colors"
                    >
                      <ClipboardList className="w-4 h-4" />
                      执行签到视图
                    </button>
                    <button
                      onClick={() => openOfflinePrintableRoadbook({ activity, members, roadbook })}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                      导出路书 PDF
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-medium">
                    <AlertCircle className="w-4 h-4" />
                    未发布
                  </div>
                  <p className="text-xs text-slate-400">确认无误后发布路书</p>
                </div>
              )}

              {!roadbook.published && (
                <button
                  onClick={handlePreparePublish}
                  className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 transition-colors shadow-lg shadow-teal-500/30"
                >
                  <Share2 className="w-4 h-4" />
                  发布路书
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" />
                车队编组
              </h3>
              <span className="text-sm text-slate-500">共 {convoyMembers.length} 辆车</span>
            </div>

            <div className="space-y-2">
              {convoyMembers.map((member, index) => {
                if (!member) return null;
                const isSelected = selectedMember === member.id;

                return (
                  <div
                    key={member.id}
                    onClick={() => setSelectedMember(isSelected ? null : member.id)}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all',
                      isSelected
                        ? 'border-teal-300 bg-teal-50 ring-2 ring-teal-200'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white',
                      index === 0
                        ? 'bg-gradient-to-br from-orange-400 to-orange-600'
                        : index === convoyMembers.length - 1
                          ? 'bg-gradient-to-br from-emerald-400 to-emerald-600'
                          : 'bg-gradient-to-br from-slate-500 to-slate-600'
                    )}>
                      {member.carNumber || index + 1}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-slate-800">{member.name}</span>
                        {index === 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 font-medium">
                            头车
                          </span>
                        )}
                        {index === convoyMembers.length - 1 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 font-medium">
                            尾车
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {member.carModel} · {member.carColor || '未标注颜色'}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <Radio className="w-4 h-4 text-teal-500" />
                        <span className="font-mono font-medium">{member.radioChannel || '未分配'}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        续航 {member.range}km
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <button
              onClick={() => setShowRules(!showRules)}
              className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
            >
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                跟车规则与迟到处理
              </h3>
              {showRules ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>

            {showRules && (
              <div className="px-6 pb-6 border-t border-slate-100 pt-5">
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-slate-700 mb-3">跟车规则</h4>
                  <div className="space-y-2">
                    {roadbook.carRules.map((rule, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg group"
                      >
                        <span className="flex-shrink-0 w-6 h-6 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        {editingRule === index ? (
                          <input
                            type="text"
                            defaultValue={rule}
                            className="flex-1 px-2 py-1 border border-teal-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                            autoFocus
                            onBlur={(e) => {
                              const newRules = [...roadbook.carRules];
                              newRules[index] = e.target.value;
                              updateRoadbook({ carRules: newRules });
                              setEditingRule(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const newRules = [...roadbook.carRules];
                                newRules[index] = (e.target as HTMLInputElement).value;
                                updateRoadbook({ carRules: newRules });
                                setEditingRule(null);
                              }
                            }}
                          />
                        ) : (
                          <p className="text-sm text-slate-600 flex-1">{rule}</p>
                        )}
                        <button
                          onClick={() => handleRemoveRule(index)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                        >
                          <span className="text-xs">删除</span>
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={newRule}
                      onChange={(e) => setNewRule(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
                      placeholder="添加新规则..."
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <button
                      onClick={handleAddRule}
                      className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors"
                    >
                      添加
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-3">迟到处理办法</h4>
                  <textarea
                    value={roadbook.latePolicy}
                    onChange={(e) => updateRoadbook({ latePolicy: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                    rows={3}
                    placeholder="请输入迟到处理办法..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">主对讲频道</label>
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-teal-500" />
                      <input
                        type="text"
                        value={roadbook.radioMainChannel}
                        onChange={(e) => updateRoadbook({ radioMainChannel: e.target.value })}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">应急频道</label>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <input
                        type="text"
                        value={roadbook.radioEmergencyChannel}
                        onChange={(e) => updateRoadbook({ radioEmergencyChannel: e.target.value })}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              个人路书卡片
            </h3>
            <p className="text-sm text-slate-500 mb-4">选择成员查看其专属路书</p>

            <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
              {confirmedMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => setSelectedMember(member.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all',
                    selectedMember === member.id
                      ? 'bg-teal-50 border border-teal-200'
                      : 'hover:bg-slate-50 border border-transparent'
                  )}
                >
                  <span className="w-7 h-7 bg-slate-200 rounded text-sm font-bold flex items-center justify-center text-slate-600">
                    {member.carNumber || '?'}
                  </span>
                  <span className="text-sm text-slate-700">{member.name}</span>
                </button>
              ))}
            </div>

            {selectedMemberData && (
              <div className="border-t border-slate-200 pt-5">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/20 rounded-full -translate-y-1/2 translate-x-1/2"></div>

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs text-slate-400">您的车号</p>
                        <div className="text-4xl font-bold text-teal-400 mt-1">
                          {selectedMemberData.carNumber || '-'}
                          <span className="text-lg text-slate-400 ml-1">号车</span>
                        </div>
                      </div>
                      <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center">
                        <Car className="w-8 h-8 text-teal-400" />
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">对讲频道</span>
                        <span className="text-sm font-mono font-semibold text-orange-400">
                          {selectedMemberData.radioChannel || roadbook.radioMainChannel}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">应急频道</span>
                        <span className="text-sm font-mono text-red-400">
                          {roadbook.radioEmergencyChannel}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">集合时间</span>
                        <span className="text-sm font-medium">{activity.meetingTime}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-700 leading-relaxed">
                      {roadbook.latePolicy}
                    </p>
                  </div>
                </div>

                <button className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors">
                  <Download className="w-4 h-4" />
                  下载个人路书
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" />
              行程概览
            </h3>

            <div className="space-y-3">
              {activity.nodes.slice(0, 5).map((node) => (
                <div key={node.id} className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">{node.name}</p>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {node.departureTime || node.arrivalTime}
                  </span>
                </div>
              ))}
              {activity.nodes.length > 5 && (
                <p className="text-xs text-slate-400 text-center pt-2">
                  ...还有 {activity.nodes.length - 5} 个节点
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPublishPreview && publishPrep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">发布预览 - 检查编组信息</h2>
              <button
                onClick={handleCancelPublish}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-5">
              {publishPrep.missingBefore.noNumber.length > 0 && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-sm font-medium text-amber-800 mb-1">
                    以下成员缺少车号，将自动分配：
                  </p>
                  <p className="text-sm text-amber-700">
                    {publishPrep.missingBefore.noNumber.join('，')}
                  </p>
                </div>
              )}

              {publishPrep.missingBefore.noChannel.length > 0 && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-sm font-medium text-amber-800 mb-1">
                    以下成员缺少对讲频道，将自动分配：
                  </p>
                  <p className="text-sm text-amber-700">
                    {publishPrep.missingBefore.noChannel.join('，')}
                  </p>
                </div>
              )}

              {(publishPrep.assignedNumbers.length > 0 || publishPrep.assignedChannels.length > 0) && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-700">自动分配结果</h3>
                  {publishPrep.assignedNumbers.length > 0 && (
                    <div className="p-3 bg-teal-50 rounded-lg">
                      <p className="text-xs font-medium text-teal-700 mb-2">车号分配：</p>
                      <ul className="space-y-1 text-sm text-teal-800">
                        {publishPrep.assignedNumbers.slice(0, 8).map((item, i) => (
                          <li key={i}>{item.name} → {item.carNumber}号车</li>
                        ))}
                        {publishPrep.assignedNumbers.length > 8 && (
                          <li className="text-teal-600">...还有 {publishPrep.assignedNumbers.length - 8} 条</li>
                        )}
                      </ul>
                    </div>
                  )}
                  {publishPrep.assignedChannels.length > 0 && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs font-medium text-blue-700 mb-2">频道分配：</p>
                      <ul className="space-y-1 text-sm text-blue-800">
                        {publishPrep.assignedChannels.slice(0, 8).map((item, i) => (
                          <li key={i}>{item.name} → {item.radioChannel}</li>
                        ))}
                        {publishPrep.assignedChannels.length > 8 && (
                          <li className="text-blue-600">...还有 {publishPrep.assignedChannels.length - 8} 条</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  最终编组概览（{publishPrep.updatedConvoyOrder.length} 位已确认成员）
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-medium text-slate-600 w-20">车号</th>
                        <th className="px-4 py-2.5 text-left font-medium text-slate-600">姓名</th>
                        <th className="px-4 py-2.5 text-left font-medium text-slate-600">车型</th>
                        <th className="px-4 py-2.5 text-left font-medium text-slate-600 w-24">频道</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {publishPrep.updatedConvoyOrder.map((mid) => {
                        const member = publishPrep.updatedMembers.find((m) => m.id === mid);
                        if (!member) return null;
                        return (
                          <tr key={member.id} className="hover:bg-slate-50">
                            <td className="px-4 py-2.5 font-mono font-bold text-teal-600">
                              {member.carNumber}
                            </td>
                            <td className="px-4 py-2.5 text-slate-800">{member.name}</td>
                            <td className="px-4 py-2.5 text-slate-600">
                              {member.carModel} · {member.carColor || '未标注'}
                            </td>
                            <td className="px-4 py-2.5 font-mono text-slate-700">
                              {member.radioChannel}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={handleCancelPublish}
                className="px-5 py-2.5 text-slate-600 bg-white border border-slate-300 rounded-lg font-medium hover:bg-slate-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmPublish}
                className="px-5 py-2.5 text-white bg-teal-700 rounded-lg font-medium hover:bg-teal-800 transition-colors shadow-sm"
              >
                确认发布
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

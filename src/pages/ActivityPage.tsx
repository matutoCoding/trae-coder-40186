import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Checkpoint } from '@/types';
import {
  MapPin,
  Clock,
  Car,
  Gauge,
  Wallet,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Calendar,
  UtensilsCrossed,
  Fuel,
  Camera,
  Hotel,
  Coffee,
  Navigation,
} from 'lucide-react';
import { formatDuration } from '@/utils/timeCalculator';
import { cn } from '@/lib/utils';

const nodeTypeConfig = {
  meeting: { icon: MapPin, label: '集合', color: 'bg-teal-500', textColor: 'text-teal-600', bgColor: 'bg-teal-50' },
  driving: { icon: Navigation, label: '行驶', color: 'bg-slate-400', textColor: 'text-slate-600', bgColor: 'bg-slate-50' },
  lunch: { icon: UtensilsCrossed, label: '午餐', color: 'bg-orange-500', textColor: 'text-orange-600', bgColor: 'bg-orange-50' },
  supply: { icon: Fuel, label: '补给', color: 'bg-blue-500', textColor: 'text-blue-600', bgColor: 'bg-blue-50' },
  scenic: { icon: Camera, label: '景区', color: 'bg-emerald-500', textColor: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  accommodation: { icon: Hotel, label: '住宿', color: 'bg-indigo-500', textColor: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  rest: { icon: Coffee, label: '休息', color: 'bg-amber-500', textColor: 'text-amber-600', bgColor: 'bg-amber-50' },
};

const checkpointTypeOptions = [
  { value: 'scenic', label: '景区', icon: Camera },
  { value: 'supply', label: '补给', icon: Fuel },
  { value: 'lunch', label: '午餐', icon: UtensilsCrossed },
  { value: 'other', label: '其他', icon: MapPin },
];

export default function ActivityPage() {
  const { activity, updateActivity, addCheckpoint, removeCheckpoint, updateCheckpoint } = useAppStore();
  const [showAddCheckpoint, setShowAddCheckpoint] = useState(false);
  const [editingCheckpoint, setEditingCheckpoint] = useState<string | null>(null);
  const [newCheckpoint, setNewCheckpoint] = useState<{
    name: string;
    distance: string;
    type: Checkpoint['type'];
    stayDuration: string;
    notes: string;
  }>({
    name: '',
    distance: '',
    type: 'scenic',
    stayDuration: '30',
    notes: '',
  });

  const handleAddCheckpoint = () => {
    if (!newCheckpoint.name || !newCheckpoint.distance) return;

    const checkpoint: Checkpoint = {
      id: `cp-${Date.now()}`,
      name: newCheckpoint.name,
      distance: Number(newCheckpoint.distance),
      type: newCheckpoint.type,
      stayDuration: Number(newCheckpoint.stayDuration),
      notes: newCheckpoint.notes,
      order: activity.checkpoints.length + 1,
    };

    addCheckpoint(checkpoint);
    setNewCheckpoint({ name: '', distance: '', type: 'scenic', stayDuration: '30', notes: '' });
    setShowAddCheckpoint(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-teal-600" />
          活动基本信息
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              活动名称
            </label>
            <input
              type="text"
              value={activity.name}
              onChange={(e) => updateActivity({ name: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              placeholder="请输入活动名称"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              活动日期
            </label>
            <input
              type="date"
              value={activity.date}
              onChange={(e) => updateActivity({ date: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              集合点
            </label>
            <input
              type="text"
              value={activity.meetingPoint}
              onChange={(e) => updateActivity({ meetingPoint: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              placeholder="请输入集合地点"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              集合时间
            </label>
            <input
              type="time"
              value={activity.meetingTime}
              onChange={(e) => updateActivity({ meetingTime: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Car className="w-4 h-4 text-slate-400" />
              预计车辆数
            </label>
            <input
              type="number"
              value={activity.vehicleCount}
              onChange={(e) => updateActivity({ vehicleCount: Number(e.target.value) })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              min="1"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-slate-400" />
              预计平均车速 (km/h)
            </label>
            <input
              type="number"
              value={activity.averageSpeed}
              onChange={(e) => updateActivity({ averageSpeed: Number(e.target.value) })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              min="20"
              max="120"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-slate-400" />
              住宿预算 (元/间)
            </label>
            <input
              type="number"
              value={activity.accommodationBudget}
              onChange={(e) => updateActivity({ accommodationBudget: Number(e.target.value) })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              min="0"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-teal-600" />
            必须到达的打卡点
          </h3>
          <button
            onClick={() => setShowAddCheckpoint(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加打卡点
          </button>
        </div>

        {showAddCheckpoint && (
          <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600">打卡点名称</label>
                <input
                  type="text"
                  value={newCheckpoint.name}
                  onChange={(e) => setNewCheckpoint({ ...newCheckpoint, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="请输入名称"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600">距起点 (km)</label>
                <input
                  type="number"
                  value={newCheckpoint.distance}
                  onChange={(e) => setNewCheckpoint({ ...newCheckpoint, distance: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600">类型</label>
                <select
                  value={newCheckpoint.type}
                  onChange={(e) => setNewCheckpoint({ ...newCheckpoint, type: e.target.value as 'scenic' | 'supply' | 'lunch' | 'other' })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {checkpointTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600">停留时间 (分钟)</label>
                <input
                  type="number"
                  value={newCheckpoint.stayDuration}
                  onChange={(e) => setNewCheckpoint({ ...newCheckpoint, stayDuration: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="30"
                />
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <label className="text-xs font-medium text-slate-600">备注</label>
              <input
                type="text"
                value={newCheckpoint.notes}
                onChange={(e) => setNewCheckpoint({ ...newCheckpoint, notes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="可选：补充说明"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddCheckpoint}
                className="px-4 py-2 bg-teal-600 text-white text-sm rounded-md hover:bg-teal-700 transition-colors"
              >
                确认添加
              </button>
              <button
                onClick={() => setShowAddCheckpoint(false)}
                className="px-4 py-2 bg-white text-slate-600 text-sm rounded-md border border-slate-300 hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {activity.checkpoints
            .sort((a, b) => a.order - b.order)
            .map((checkpoint, index) => {
              const typeConfig = nodeTypeConfig[checkpoint.type as keyof typeof nodeTypeConfig] || nodeTypeConfig.supply;
              const isEditing = editingCheckpoint === checkpoint.id;

              return (
                <div
                  key={checkpoint.id}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-lg border transition-all',
                    isEditing ? 'border-teal-300 bg-teal-50' : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', typeConfig.bgColor)}>
                    <typeConfig.icon className={cn('w-5 h-5', typeConfig.textColor)} />
                  </div>

                  {isEditing ? (
                    <div className="flex-1 grid grid-cols-4 gap-3">
                      <input
                        type="text"
                        defaultValue={checkpoint.name}
                        className="px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        onBlur={(e) => updateCheckpoint(checkpoint.id, { name: e.target.value })}
                      />
                      <input
                        type="number"
                        defaultValue={checkpoint.distance}
                        className="px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        onBlur={(e) => updateCheckpoint(checkpoint.id, { distance: Number(e.target.value) })}
                      />
                      <input
                        type="number"
                        defaultValue={checkpoint.stayDuration}
                        className="px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        onBlur={(e) => updateCheckpoint(checkpoint.id, { stayDuration: Number(e.target.value) })}
                      />
                      <select
                        defaultValue={checkpoint.type}
                        className="px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        onChange={(e) => updateCheckpoint(checkpoint.id, { type: e.target.value as 'scenic' | 'supply' | 'lunch' | 'other' })}
                      >
                        {checkpointTypeOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-slate-800">{index + 1}. {checkpoint.name}</span>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full', typeConfig.bgColor, typeConfig.textColor)}>
                          {typeConfig.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                        <span>距离起点 {checkpoint.distance}km</span>
                        <span>停留 {checkpoint.stayDuration} 分钟</span>
                        {checkpoint.notes && <span className="text-slate-400">备注：{checkpoint.notes}</span>}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingCheckpoint(isEditing ? null : checkpoint.id)}
                      className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                    >
                      {isEditing ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => removeCheckpoint(checkpoint.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

          {activity.checkpoints.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无打卡点，请点击上方按钮添加</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-teal-600" />
          自动生成节点时间轴
        </h3>

        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200"></div>

          <div className="space-y-4">
            {activity.nodes.map((node, index) => {
              const config = nodeTypeConfig[node.type];

              return (
                <div key={node.id} className="relative flex gap-4 pl-12">
                  <div className={cn(
                    'absolute left-4 w-5 h-5 rounded-full border-4 border-white shadow-md -translate-x-1/2',
                    config.color
                  )}></div>

                  <div className={cn(
                    'flex-1 rounded-xl border p-4 transition-all hover:shadow-md',
                    config.bgColor,
                    'border-slate-200 bg-white'
                  )}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', config.bgColor)}>
                          <config.icon className={cn('w-5 h-5', config.textColor)} />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-800">{node.name}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {node.type !== 'driving' && node.type !== 'rest' ? '停留' : '行驶'} {formatDuration(node.duration)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        {node.departureTime && node.type !== 'accommodation' && (
                          <div className="text-sm">
                            <span className="text-slate-400">出发 </span>
                            <span className="font-mono font-semibold text-teal-600">{node.departureTime}</span>
                          </div>
                        )}
                        {node.arrivalTime && (
                          <div className="text-sm mt-1">
                            <span className="text-slate-400">到达 </span>
                            {node.arrivalTimeEarly && node.arrivalTimeLate
                              ? (
                                <span className="font-mono font-semibold text-slate-700">
                                  <span className="text-slate-500 font-normal">±</span>
                                  <span className="text-teal-600">{node.arrivalTimeEarly}</span>
                                  <span className="text-slate-400"> ~ </span>
                                  <span className="text-orange-600">{node.arrivalTimeLate}</span>
                                </span>
                              )
                              : (
                                <span className="font-mono font-semibold text-slate-700">{node.arrivalTime}</span>
                              )}
                          </div>
                        )}
                        {(node.distance && (node.type === 'driving' || node.type === 'rest' || node.type === 'supply' || node.type === 'scenic' || node.type === 'lunch')) && (
                          <div className="text-xs text-slate-400 mt-1">
                            里程 {node.distance} km
                          </div>
                        )}
                      </div>
                    </div>

                    {node.notes && (
                      <p className="text-sm text-slate-500 mt-3 pt-3 border-t border-slate-100">
                        💡 {node.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <span className="text-slate-500">
                总里程：<span className="font-semibold text-slate-800">
                  {activity.checkpoints.length > 0 ? Math.max(...activity.checkpoints.map(c => c.distance)) : 0} km
                </span>
              </span>
              <span className="text-slate-500">
                节点数：<span className="font-semibold text-slate-800">{activity.nodes.length} 个</span>
              </span>
            </div>
            <div className="text-slate-400 text-xs">
              * 时间为自动计算，实际可能因路况有所调整
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

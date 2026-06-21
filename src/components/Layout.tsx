import { NavLink, Outlet } from 'react-router-dom';
import { MapPin, Users, Route, Car, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: '活动设置', icon: MapPin },
  { path: '/members', label: '成员确认', icon: Users },
  { path: '/roadbook', label: '车队路书', icon: Route },
  { path: '/execution', label: '执行签到', icon: ClipboardList },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg">路书编排台</h1>
              <p className="text-xs text-slate-400">自驾俱乐部管理系统</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-teal-600 text-white shadow-lg'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-2">当前活动</p>
            <p className="text-sm font-medium truncate">周末草原天路自驾之旅</p>
            <p className="text-xs text-teal-400 mt-1">2026年7月5日</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            {navItems.find((item) => item.path === location.pathname)?.label}
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">领队：张伟</span>
            <div className="w-9 h-9 bg-teal-100 rounded-full flex items-center justify-center">
              <span className="text-teal-700 font-medium text-sm">张</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

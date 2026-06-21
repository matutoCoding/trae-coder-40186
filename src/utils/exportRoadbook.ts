import { Activity, Member, Roadbook, RouteNode } from '@/types';

interface ExportOptions {
  activity: Activity;
  members: Member[];
  roadbook: Roadbook;
}

function formatNodeTimeWindow(node: RouteNode): string {
  if (node.arrivalTimeEarly && node.arrivalTimeLate) {
    return `${node.arrivalTimeEarly} ~ ${node.arrivalTimeLate}`;
  }
  return node.departureTime || node.arrivalTime || '—';
}

function getNodeLabel(type: RouteNode['type']): string {
  const map: Record<RouteNode['type'], string> = {
    meeting: '集合点',
    driving: '行驶',
    rest: '休息',
    supply: '补给',
    lunch: '午餐',
    scenic: '打卡',
    accommodation: '住宿',
  };
  return map[type] || type;
}

function getNodeEmoji(type: RouteNode['type']): string {
  const map: Record<RouteNode['type'], string> = {
    meeting: '📍',
    driving: '🚗',
    rest: '☕',
    supply: '⛽',
    lunch: '🍽️',
    scenic: '📸',
    accommodation: '🏨',
  };
  return map[type] || '•';
}

export function openOfflinePrintableRoadbook(options: ExportOptions) {
  const { activity, members, roadbook } = options;

  const confirmedMembers = roadbook.convoyOrder
    .map((id) => members.find((m) => m.id === id))
    .filter((m): m is Member => !!m && m.status === 'confirmed');

  const restMembers = members.filter(
    (m) => m.status === 'confirmed' && !roadbook.convoyOrder.includes(m.id)
  );
  const ordered = [...confirmedMembers, ...restMembers];

  const totalDistance = activity.checkpoints.length
    ? Math.max(...activity.checkpoints.map((c) => c.distance))
    : 0;
  const totalDriveMin = activity.nodes.reduce((s, n) => (n.type === 'driving' ? s + n.duration : s), 0);
  const totalH = Math.floor(totalDriveMin / 60);
  const totalM = totalDriveMin % 60;

  const formatCarNum = (n?: number) => (typeof n === 'number' ? `#${String(n).padStart(2, '0')}` : '待定');

  const convoyRows = ordered
    .map((m, i) => {
      const role =
        i === 0 ? '头车' : i === ordered.length - 1 ? '尾车' : m.willingTail ? '自愿尾车' : '';
      const familyFlags = [
        m.hasElderly ? '有老人' : '',
        m.hasChildren ? '有孩子' : '',
        m.drivingExperience === 'novice' ? '新手' : '',
      ]
        .filter(Boolean)
        .join('、');
      return `
      <tr>
        <td class="cn">${formatCarNum(m.carNumber)}</td>
        <td class="nm">${m.name}</td>
        <td>${m.carModel}${m.carColor ? ` · ${m.carColor}` : ''}</td>
        <td class="ch">${m.radioChannel || '-'}</td>
        <td>${m.phone || '-'}</td>
        <td>${m.range}km</td>
        <td>${role || '-'}</td>
        <td>${familyFlags || '-'}</td>
      </tr>`;
    })
    .join('');

  const nodesRows = activity.nodes
    .map((n, i) => {
      const segmentTag =
        n.type === 'driving' && n.segmentTotal && n.segmentTotal > 1
          ? ` <span class="seg">(${n.segmentIndex}/${n.segmentTotal})</span>`
          : '';
      const dist = typeof n.distance === 'number' ? `${n.distance}km` : '';
      const durationText =
        n.duration > 0 ? `约 ${Math.floor(n.duration / 60) ? `${Math.floor(n.duration / 60)}小时` : ''}${n.duration % 60 ? `${n.duration % 60}分` : ''}` : '';
      const notes = n.notes ? `<div class="nt">📝 ${n.notes}</div>` : '';
      return `
      <tr class="${n.type}">
        <td class="idx">${i + 1}</td>
        <td class="tp"><span class="emj">${getNodeEmoji(n.type)}</span> ${getNodeLabel(n.type)}${segmentTag}</td>
        <td class="nm">${n.name}${notes}</td>
        <td class="tm">${formatNodeTimeWindow(n)}</td>
        <td class="dst">${dist}</td>
        <td>${durationText}</td>
      </tr>`;
    })
    .join('');

  const rulesItems = roadbook.carRules
    .map((r, i) => `<li><b>${i + 1}.</b> ${r}</li>`)
    .join('');

  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const hh = String(today.getHours()).padStart(2, '0');
  const mm = String(today.getMinutes()).padStart(2, '0');

  const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${activity.name} - 车队路书</title>
  <style>
    :root {
      --primary: #0f4c5c;
      --secondary: #e36414;
      --text: #1e293b;
      --muted: #64748b;
      --border: #e2e8f0;
      --head-bg: #f8fafc;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", "Noto Sans SC", sans-serif;
      color: var(--text);
      background: #fff;
      font-size: 13px;
      line-height: 1.55;
    }
    .wrap { max-width: 960px; margin: 0 auto; padding: 32px 36px; }
    .hdr {
      border-left: 6px solid var(--secondary);
      background: linear-gradient(90deg, #f1f5f9 0%, #ffffff 100%);
      padding: 20px 24px;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    .hdr .title { font-size: 22px; font-weight: 700; color: var(--primary); margin-bottom: 8px; }
    .hdr .meta { display: flex; flex-wrap: wrap; gap: 18px; color: var(--muted); font-size: 12.5px; }
    .hdr .meta span b { color: var(--text); font-weight: 600; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 22px; }
    .stat {
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 12px 14px;
      background: #fff;
    }
    .stat .lb { font-size: 11px; color: var(--muted); margin-bottom: 4px; letter-spacing: 0.4px; }
    .stat .vl { font-size: 18px; font-weight: 700; color: var(--primary); }
    .stat .vl.small { font-size: 14px; }
    .sec { margin-bottom: 24px; }
    .sec h2 {
      font-size: 15px;
      font-weight: 700;
      color: var(--primary);
      margin: 0 0 10px 0;
      padding-bottom: 6px;
      border-bottom: 2px solid var(--primary);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12.5px;
      background: #fff;
    }
    th, td {
      border: 1px solid var(--border);
      padding: 7px 9px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: var(--head-bg);
      font-weight: 600;
      color: var(--text);
      font-size: 12px;
      white-space: nowrap;
    }
    td.cn { font-weight: 700; color: var(--secondary); width: 56px; text-align: center; }
    td.ch { font-family: ui-monospace, Consolas, monospace; color: var(--primary); font-weight: 600; }
    td.idx { width: 36px; text-align: center; color: var(--muted); }
    td.tp { width: 120px; font-weight: 600; }
    td.tm { font-family: ui-monospace, Consolas, monospace; color: var(--primary); font-weight: 600; width: 130px; }
    td.dst { width: 70px; color: var(--muted); }
    td.nm { font-weight: 500; }
    tr.driving td { background: #f8fafc; }
    tr.rest td { background: #fff7ed; }
    tr.lunch td { background: #fef3c7; }
    tr.accommodation td { background: #e0f2fe; }
    tr.supply td { background: #ecfdf5; }
    tr.scenic td { background: #faf5ff; }
    .seg { color: var(--muted); font-weight: 400; font-size: 11.5px; margin-left: 2px; }
    .emj { margin-right: 2px; }
    .nt { margin-top: 3px; font-size: 11.5px; color: var(--muted); }
    ul.rules { padding-left: 20px; margin: 0; }
    ul.rules li { margin-bottom: 5px; }
    .policy {
      background: #fff7ed;
      border: 1px dashed var(--secondary);
      border-left: 4px solid var(--secondary);
      padding: 10px 14px;
      border-radius: 4px;
      color: #7c2d12;
      white-space: pre-wrap;
      font-size: 12.5px;
    }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
    .footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px dashed var(--border);
      font-size: 11px;
      color: var(--muted);
      display: flex; justify-content: space-between;
    }
    .no-print {
      position: sticky;
      top: 12px;
      z-index: 10;
      max-width: 960px;
      margin: 0 auto;
      padding: 0 36px;
    }
    .print-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 18px;
      background: var(--primary);
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(15,76,92,.25);
    }
    .print-btn:hover { background: #0b3e4c; }
    @media print {
      .no-print { display: none !important; }
      body { font-size: 12px; }
      .wrap { padding: 0; }
      .page-break { page-break-before: always; }
      table { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="print-btn" onclick="window.print()">🖨️ 打印 / 保存为 PDF</button>
  </div>

  <div class="wrap">
    <div class="hdr">
      <div class="title">🚗 ${activity.name} · 车队统一路书</div>
      <div class="meta">
        <span>📅 <b>${activity.date}</b></span>
        <span>⏰ 集合时间 <b>${activity.meetingTime}</b></span>
        <span>📍 集合点 <b>${activity.meetingPoint}</b></span>
        <span>👥 <b>${ordered.length}</b> 辆车</span>
        <span>📏 全程 <b>${totalDistance}km</b></span>
        <span>🛣️ 行驶合计 <b>${totalH}h ${totalM}m</b></span>
      </div>
    </div>

    <div class="grid">
      <div class="stat">
        <div class="lb">主对讲频道</div>
        <div class="vl" style="font-family:monospace;">${roadbook.radioMainChannel}</div>
      </div>
      <div class="stat">
        <div class="lb">应急频道</div>
        <div class="vl" style="font-family:monospace;color:#b91c1c;">${roadbook.radioEmergencyChannel}</div>
      </div>
      <div class="stat">
        <div class="lb">平均车速 / 住宿预算</div>
        <div class="vl small">${activity.averageSpeed}km/h · ¥${activity.accommodationBudget}/晚</div>
      </div>
    </div>

    <div class="sec">
      <h2>📋 车队编组表（按行车顺序）</h2>
      <table>
        <thead>
          <tr>
            <th>车号</th><th>姓名</th><th>车辆</th><th>频道</th>
            <th>联系电话</th><th>续航</th><th>角色</th><th>备注</th>
          </tr>
        </thead>
        <tbody>
          ${convoyRows || `<tr><td colspan="8" style="text-align:center;color:#94a3b8;padding:14px;">暂无已确认成员</td></tr>`}
        </tbody>
      </table>
    </div>

    <div class="sec page-break">
      <h2>🛣️ 完整行程时间轴</h2>
      <table>
        <thead>
          <tr>
            <th>#</th><th>类型</th><th>节点名称</th>
            <th>预计到达区间</th><th>里程</th><th>时长</th>
          </tr>
        </thead>
        <tbody>
          ${nodesRows}
        </tbody>
      </table>
    </div>

    <div class="two-col">
      <div class="sec">
        <h2>📐 跟车规则</h2>
        <ul class="rules">
          ${rulesItems || `<li style="color:#94a3b8;">暂无规则，请领队在路书编辑页添加</li>`}
        </ul>
      </div>
      <div class="sec">
        <h2>⚠️ 迟到处理办法</h2>
        <div class="policy">${roadbook.latePolicy || '暂无，请领队补充'}</div>
      </div>
    </div>

    <div class="footer">
      <span>生成时间：${y}-${m}-${d} ${hh}:${mm}</span>
      <span>分享码：${roadbook.shareCode || '—'} · 领队自驾协同路书</span>
    </div>
  </div>

  <script>
    // 自动调起打印（如果是正常浏览器环境）
    window.addEventListener('load', function () {
      setTimeout(function () {
        // 先不自动打印，让用户点击顶部按钮
      }, 500);
    });
  </script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=960,height=800,scrollbars=yes');
  if (!win) {
    alert('弹出窗口被浏览器拦截了，请允许弹窗后重试。');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

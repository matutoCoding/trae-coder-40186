import { ShareableRoadbookData, Activity, Member, Roadbook, MemberSignRecord } from '@/types';

const CURRENT_SHARE_VERSION = 1;

function utf8ToB64(str: string): string {
  try {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch (e) {
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}

function b64ToUtf8(str: string): string {
  try {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  } catch (e) {
    return decodeURIComponent(escape(atob(str.replace(/-/g, '+').replace(/_/g, '/'))));
  }
}

export function encodeShareData(
  activity: Activity,
  members: Member[],
  roadbook: Roadbook,
  signRecords?: MemberSignRecord[]
): string {
  const data: ShareableRoadbookData = {
    v: CURRENT_SHARE_VERSION,
    activity,
    members,
    roadbook,
    signRecords,
    exportedAt: new Date().toISOString(),
  };
  const json = JSON.stringify(data);
  return utf8ToB64(json);
}

export function decodeShareData(token: string): ShareableRoadbookData | null {
  try {
    if (!token) return null;
    const json = b64ToUtf8(token);
    const parsed = JSON.parse(json) as ShareableRoadbookData;
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.activity || !parsed.members || !parsed.roadbook) return null;
    return parsed;
  } catch (err) {
    console.warn('Failed to decode share data:', err);
    return null;
  }
}

export function buildShareLink(
  origin: string,
  basePath: string,
  activity: Activity,
  members: Member[],
  roadbook: Roadbook,
  signRecords?: MemberSignRecord[]
): string {
  const token = encodeShareData(activity, members, roadbook, signRecords);
  const separator = basePath.endsWith('/') ? '' : '/';
  return `${origin}${basePath}${separator}view?token=${token}&code=${roadbook.shareCode || ''}`;
}

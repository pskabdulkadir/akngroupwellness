export type MemberNameFields = {
  nickname?: unknown;
  fullName?: unknown;
  full_name?: unknown;
  resellerName?: unknown;
};

export function normalizeNickname(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const nickname = value.normalize('NFKC').trim();
  if (nickname.length < 3 || nickname.length > 24) return null;
  if (!/^[\p{L}\p{N}](?:[\p{L}\p{N}_-]{1,22}[\p{L}\p{N}])$/u.test(nickname)) return null;
  return nickname;
}

export function nicknameKey(nickname: string): string {
  return nickname.normalize('NFKC').toLocaleLowerCase('tr-TR');
}

export function getMemberDisplayName(member?: MemberNameFields | null): string {
  for (const value of [member?.nickname, member?.resellerName, member?.fullName, member?.full_name]) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return 'Bayi';
}

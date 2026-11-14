export function socketUrl(role: string, room?: string): string {
  const url = new URL(location.href);
  url.protocol = location.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/";
  url.search = "";
  url.searchParams.set("role", role);
  if (room) url.searchParams.set("room", room);
  return url.toString();
}

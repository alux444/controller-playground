export function socketUrl(role: string, room?: string): string {
  const url = new URL(location.href);
  url.protocol = location.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/";
  url.search = "";
  url.searchParams.set("role", role);
  if (room) url.searchParams.set("room", room);
  return url.toString();
}

export function element<T extends HTMLElement>(
  selector: string,
  parent: ParentNode = document,
): T {
  const found = parent.querySelector<T>(selector);
  if (!found) throw new Error(`Missing ${selector}`);
  return found;
}

import { createRoot } from "react-dom/client";
import { ControllerView } from "./controller-view.tsx";
import { HostView } from "./host-view.tsx";
import "./ui-kit/styles/theme.css";
import "./ui-kit/styles/kit.css";
import "./style.css";

const app = document.querySelector<HTMLElement>("#app");
if (!app) throw new Error("App root is missing");
const session = new URLSearchParams(location.search).get("join");
createRoot(app).render(session ? <ControllerView room={session} /> : <HostView />);

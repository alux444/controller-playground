import { showController } from "./controller.ts";
import { showHost } from "./host.ts";
import "./style.css";

const app = document.querySelector<HTMLElement>("#app");
if (!app) throw new Error("App root is missing");
const session = new URLSearchParams(location.search).get("join");
if (session) showController(app, session);
else showHost(app);

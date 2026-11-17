# Controller Playground

A shared-screen experiment for using phones as browser game controllers. Open the host on a Mac, scan its QR code on one or two phones, and try the controls.

## Run

Requires Node.js 24 or later and npm.

```sh
npm install
npm run build
npm start
```

Open the local URL printed in the terminal. The QR code uses your Mac's local network address; the phone needs to be on the same network. Touch controls work over HTTP. Motion sensors require a trusted HTTPS connection on the phone.

For HTTPS, provide a reachable HTTPS address with `PUBLIC_URL` when using a secure tunnel. Alternatively, set `TLS_KEY` and `TLS_CERT` to files containing a certificate trusted by your phone; set `PUBLIC_URL` to the matching HTTPS URL. Restart the server after changing these values. A tunnel can make the playground reachable over the internet. Anyone with the session link can join until the host closes it.

```sh
PUBLIC_URL=https://your-trusted-address.example npm start
```

Choose **Player 1** or **Player 2** and a controller in Settings, then tap **Done**. Each slot can be used by one phone at a time. Turn the phone sideways for the wheel, gamepad, and twin sticks; hold it upright for the pointer. If the screen doesn't rotate, turn off the phone's orientation lock. Reopen Settings to change the player, controller, or sensitivity; controls are released while Settings is open.

In wheel mode, tap **Enable motion** and allow access. Hold the phone like a wheel and tap **Recenter** in a comfortable position. Adjust **Steering sensitivity** to change how far you need to turn. Touch steering is available without motion. The gamepad offers a touch joystick and A/B buttons.

Choose **Twin sticks** to move and aim independently. For **Pointer**, hold the phone like a remote with its top edge pointing at the screen. Enable motion, point at the centre, and tap **Set centre**. The pointer also offers touch sliders. Both modes show each player's crosshair in the shared aiming preview; in Pointer mode, Fire highlights it.

Run `npm test` for protocol checks. This is a proof of concept; real-device motion and latency depend on the browser and network.

## Development

The host and controller are React and TypeScript. The server relays controller input over WebSockets. The source-owned Forme UI kit lives in `src/ui-kit`; edit its tokens and run `npm run build:tokens` to regenerate the theme CSS.

## Deploy to Cloudflare

Connect this repository to **Workers Builds** in Cloudflare. Use the repository root, `npm run build` as the build command, and `npx wrangler deploy` as the deploy command. The `wrangler.jsonc` file configures the phone site, Worker, and SQLite-backed Durable Object used for live sessions. Choose a unique Worker name when creating it.

After deployment, open the `workers.dev` URL to confirm the playground loads. Run `npm run test:cloudflare` locally to exercise the Worker relay. Cloudflare bills Durable Object usage according to its plan and limits; active controllers send frequent messages. The service is a prototype, so configure appropriate rate limiting and monitor usage before sharing it widely. Anyone with a session link can join it while it is open.

## Experimental WMMTD extension

The Chrome extension maps the phone's Wheel mode to WMMTD's controller input tester: steering is axis 0, A is accelerator (button 7), and B is brake (button 6). It is a prototype; compatibility with WMMTD has not yet been verified.

The extension requires the hosted HTTPS Worker above. End users do not need a local server. Once deployed, build an unpacked extension using the Worker's origin:

```sh
PHONE_WHEEL_SERVICE_URL=https://your-worker.workers.dev npm run build:extension
```

In `chrome://extensions`, enable Developer mode and load the `build/wmmtd-extension` folder as an unpacked extension. Refresh `https://wmmtd.xyz/`, open **Phone Wheel** from Chrome's extensions menu, and select **Connect**. Scan its QR code, choose **Player 1 → Wheel**, enable motion and recenter. Test axis 0 and the pedals in the game's **Controls → Controller** panel before driving.

The extension runs only on WMMTD and connects to the configured controller service. Closing or refreshing the game tab ends the session; if input stops arriving, the virtual controller disconnects. A real-game compatibility test and a distribution method are still needed before release.

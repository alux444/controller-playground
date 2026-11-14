# Controller Playground

A shared-screen experiment for using phones as browser game controllers. Open the host on a Mac, scan its QR code on one or two phones, and try the wheel or gamepad.

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

In wheel mode, tap **Enable motion** and allow access. Hold the phone like a wheel and tap **Recenter** in a comfortable position. Adjust **Steering sensitivity** to change how far you need to turn. Touch steering is available without motion. The gamepad offers a touch joystick and directional buttons.

Run `npm test` for protocol checks. This is a proof of concept; real-device motion and latency depend on the browser and network.

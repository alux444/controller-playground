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

Choose **Player 1** or **Player 2**. Each slot can be used by one phone at a time. Turn the phone sideways for the wheel, gamepad, and twin sticks; hold it upright for the pointer. If the screen doesn't rotate, turn off the phone's orientation lock.

In wheel mode, tap **Enable motion** and allow access. Hold the phone like a wheel and tap **Recenter** in a comfortable position. Adjust **Steering sensitivity** to change how far you need to turn. Touch steering is available without motion. The gamepad offers a touch joystick and A/B buttons.

Choose **Twin sticks** to move and aim independently. For **Pointer**, hold the phone like a remote with its top edge pointing at the screen. Enable motion, point at the centre, and tap **Set centre**. The pointer also offers touch sliders. Both modes show each player's crosshair in the shared aiming preview; the Fire button highlights it.

Run `npm test` for protocol checks. This is a proof of concept; real-device motion and latency depend on the browser and network.

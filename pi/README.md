# Pi deployment

Pieces get tested on the Pi 5; the ones that make the cut live on in
hardware as well as the web. The lite preset (`?device=pi`) is the
contract: bokeh off, murk off, DPR capped at 1. Pieces heavier than
that (like Sakuramochi) stay web-only — that's fine.

## First-time setup on the Pi

```bash
# 1. copy the service unit
scp pi/tone-viewer.service daniel@mmrybx.local:/tmp/
ssh daniel@mmrybx.local 'sudo mv /tmp/tone-viewer.service /etc/systemd/system/ && sudo systemctl daemon-reload && sudo systemctl enable tone-viewer'

# 2. Chromium kiosk autostart (display manager dependent — adjust to your
#    session; on lab PCs with autostart .desktop files):
#    chromium --kiosk --app=http://localhost:3100?device=pi
```

## Every deploy

```bash
./pi/deploy.sh                # or: ./pi/deploy.sh daniel@<other-pi>.local
```

The script builds locally, rsyncs, installs prod deps, and restarts the
service. The kiosk loads `http://localhost:3100?device=pi`.

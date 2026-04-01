# Artemis II heartbeat

# Purpose
Run every 5 minutes: check NASA's Artemis II live updates page and post a concise one-line update to the Discord #general channel only when the published content changed since the last check.

# Polling interval
every 5 minutes

# Primary sources
- https://www.nasa.gov/blogs/missions/2026/04/01/live-artemis-ii-launch-day-updates/
- fallback: https://www.space.com/news/live/artemis-2-nasa-moon-mission-launch-updates-april-1-2026

# Behavior
- Fetch primary page and extract the most recent live-update text / top entries.
- Compute a text diff against the last posted snapshot (store snapshot in workspace memory file or local state).
- If any substantive change, post one concise line to channel <@598240337101586432>:
  "<@598240337101586432> Artemis II update (HH:MM CDT): <short summary> — source: <short-url>"
  Include a one-line 1–2 sentence context snippet when available.
- Do not post if no change detected.

# Special cases
- Liftoff/launch: if content contains keywords (case-insensitive) "liftoff", "launch", or "cleared the tower", post an immediate alert:
  "<@598240337101586432> Artemis II liftoff — <timestamp> CDT (watch: https://www.nasa.gov)" and include milestone list if available (T‑0, MECO, TLI).
- Scrub/hold/delay: if content contains "hold", "scrub", or "delay", post an immediate alert with reported reason if present.
- Coalescing: if multiple small edits occur within 2 minutes, wait 2 minutes and post a single aggregated update summarizing recent changes.

# Delivery target
Post to Discord channel id: 1488650844260794450 (do not use silent notifications).

# Ownership & Stop
The agent running this heartbeat should continue until explicitly stopped. Parent session (this chat) may stop it by asking the assistant to stop; the agent should post a final message: "Artemis II monitoring stopped." mentioning <@598240337101586432>.

# Notes for operator
- This file is the heartbeat instruction used by the agent when a heartbeat poll runs. To actually schedule automatic runs, add a gateway cron job that triggers the gateway heartbeat delivery every 5 minutes (or enable the gateway heartbeat scheduler). If you want, I can create the cron job for you.

# Implementation hints for the agent
- Use the NASA live page as primary; fall back to Space.com when NASA is unreachable.
- Store last snapshot in workspace file: memory/artemis-ii-last.txt
- Use America/Chicago timezone for timestamps (CDT/CST as appropriate).
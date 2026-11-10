# GroundBook

The planner of the Deccan sports complex: four grounds, their opening hours (shorter on Sundays) and six event types,
each with the setup and teardown it needs. Clubs request slots, the office confirms, cancels and moves them, and no
two bookings ever hold a ground at the same time once setup and teardown are counted.

## Running it

All you need is Docker. From this folder:

    docker compose build
    docker compose up -d

The planner then answers on port 8080, from this machine and from Sabu's tablet at the gate: for example
`http://<office PC's IP>:8080/venues/deccan/grounds/A/day?date=2026-10-03`. `http://localhost:8080/healthz` says
`{"status":"ok"}` once the database is reachable, and the API docs are at `http://localhost:8080/docs`.

- **The data** lives on the `mongo-data` volume, so `docker compose down` and `docker compose up -d` keep every
  booking. (`docker compose down -v` would delete it.)
- **After a power cut or a reboot** both containers start again by themselves (`restart: unless-stopped`), as long as
  Docker itself starts with the machine: in Docker Desktop, turn on "Start Docker Desktop when you sign in".
- **Logs** go to stdout, one line per request and per event, never a club's name: `docker compose logs app`.

## Settings

Every setting is in `.env.example`. To change one, copy the file to `.env` (it stays out of git and out of the
image), change the line, and run `docker compose up -d` again. (`docker compose restart` would keep the old values.)

| Setting | Default | Meaning |
|---|---|---|
| `HOLD_HOURS` | 24 | How long a requested booking holds its slot before it lapses |
| `MONGODB_URI` | the `mongo` service | Where the data lives |
| `SEED_DIR` | `/app/seed` | The folder with `grounds.csv` and `event_types.csv` |
| `HOST`, `PORT` | `0.0.0.0`, `8080` | Where the app listens inside its container |

For example, a two-day hold: put `HOLD_HOURS=48` in `.env`, run `docker compose up -d`, and
`curl http://localhost:8080/settings` shows `"holdHours":48`. No image is rebuilt.

## One booking, from the phone call to the gate

Rafi rings for Saturday, two till five, a league match; Deepa requests it (the dates are an example: use a coming
Saturday, since nobody books the past):

    curl -X POST http://localhost:8080/bookings -H "content-type: application/json" -d '{"ground":"A","event":"league","from":"2026-10-03T14:00:00Z","to":"2026-10-03T17:00:00Z","club":"Ambedkar Nagar CC"}'

    {"bookingId":"BK0001","ground":"A","event":"league","from":"2026-10-03T14:00:00Z","to":"2026-10-03T17:00:00Z","groundHeldFrom":"2026-10-03T13:20:00Z","groundHeldTo":"2026-10-03T17:30:00Z","state":"requested","holdUntil":"2026-10-02T08:00:00Z"}

The office confirms it:

    curl -X POST http://localhost:8080/bookings/BK0001/confirm

    {"bookingId":"BK0001","state":"confirmed","confirmedAt":"2026-10-01T09:00:00Z"}

Saturday on ground A shows the block and the setup and teardown around it:

    curl "http://localhost:8080/venues/deccan/grounds/A/day?date=2026-10-03"

At the gate, Sabu checks the booking before he unlocks: who it is for, when, and its whole history:

    curl http://localhost:8080/bookings/BK0001

<!-- learntube:start -->
---

[![tests](https://github.com/akanshalakhina/groundbook-mern/actions/workflows/tests.yml/badge.svg)](https://github.com/akanshalakhina/groundbook-mern/actions/workflows/tests.yml)

### Progress

- [x] Ticket 1 · The complex, as a day you can look at
- [x] Ticket 2 · A club asks for a slot
- [x] Ticket 3 · Confirm, cancel, and the hour that has already gone
- [x] Ticket 4 · The refusals, once the shadows are counted
- [x] Ticket 5 · Moving a booking without breaking the day
- [x] Ticket 6 · A planner nobody can erase
- [x] Ticket 7 · One file becomes an app
- [x] Ticket 8 · The rule table, and then the rule changes
- [x] Ticket 9 · It runs on the office machine
- [x] Ticket 10 · It survives being switched off

Built by Akansha on [LearnTube Guided Projects](https://guidedprojects.learntube.ai).
<!-- learntube:end -->

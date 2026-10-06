---
description: "Starter main.py of a Python module, with the Python SDK (flint_module)"
---

# File: Modules/(Source Local) <Name>/main.py

/* Replace each [placeholder] in a string or a comment, and remove each part that the design of the module does not use. The code runs as it is, so test it after each change with flint module status <name>. */

# Naming and Placement

| | |
|---|---|
| Path | `Modules/(Source Local) <Name>/main.py`, beside `module.yaml` ([[dev-tmp-knap-module_yaml-v0.1]]) |
| Manifest | `runtime: python`, `entry: main.py`, no `build` |
| Runs as | `python3 main.py plan`, `apply`, `command <name> [args...]`, or `live`, in the Flint root (Python 3.9 or later) |
| SDK | `flint_module.py`: the CLI of Flint ships it and puts its folder first on `PYTHONPATH`. No install, no build |

A Python module is the easiest start: one file, the standard library, and no build step. Keep only the parts that the module needs: a module with no own state needs no action, and a `sync` module needs no `live` handler. The contract is in [[dev-knw-knap-module]].

```python
"""[One line: what this module does for the machine.]

Flint runs this file as `python3 main.py <verb>`: plan, apply, command <name> [args...], or live (kind: live only).
flint_module comes from PYTHONPATH: Flint puts the folder of its Python SDK first."""
import json
import os
import sys

from flint_module import Module

module = Module()

STATE_FILE = "state.json"  # [The file of the module in its data folder, .flint/modules/<name>/]


def read_json(path):
    try:
        with open(path) as handle:
            return json.load(handle)
    except (OSError, ValueError):
        return None


def wanted(m):
    """[The state that the settings and the env files ask for.]"""
    return {"value": m.settings.get("[setting-key]", "[default value]")}


@module.plan
def plan(m):
    # A plan changes nothing, and it gives the same answer when nothing changed.

    # [A secret named in secrets: of module.yaml. A missing secret is the issue module-secret-missing. Remove when unused.]
    # m.secret("[SECRET_NAME]")

    # [A desired cron schedule. Safe default: it exists only when the settings give a schedule, and it fires only on the
    #  owner machine of the settings (never the machine that runs the plan). Remove when unused.]
    schedule = m.settings.get("schedule")
    if isinstance(schedule, str) and schedule:
        m.desired.cron(key="[schedule-key]", expr=schedule, prompt="[The prompt of the agent session at each fire.]",
                       timezone=m.settings.get("timezone"), machine=m.settings.get("owner") or None)

    # [A desired station: an item posted to it starts an agent session on its target. Remove when unused.]
    # m.desired.station(key="[station-key]", description="[What the station serves.]")

    # An own action, only when the data folder does not hold the wanted state.
    want = wanted(m)
    have = read_json(os.path.join(m.data_dir, STATE_FILE))
    if have != want:
        m.action(id="write-state", kind="update" if have is not None else "create",
                 label="write %s" % STATE_FILE, detail=json.dumps(want), payload=want)

    # [An issue only when a person must act: an issue makes the row Modules of flint doctor fail.]
    # m.issue("[module-code]", "[What is wrong.]", "[The next step.]")


@module.apply
def apply(action, m):
    if action["id"] != "write-state":
        return {"ok": False, "detail": "no action %s" % action["id"]}
    with open(os.path.join(m.data_dir, STATE_FILE), "w") as handle:
        handle.write(json.dumps(action["payload"], indent=2) + "\n")
    return "wrote %s" % STATE_FILE


@module.command("[command-name]")
def show(args, m):
    """[What the command does.] The terminal of the person; the return value is the exit code."""
    print(json.dumps(read_json(os.path.join(m.data_dir, STATE_FILE))))
    return 0


# [Only for kind: live in module.yaml. Remove this handler for a sync module.]
@module.live
def live(m):
    def on_ping(body, tools):
        return {"pong": str(body.get("text", "")), "pid": os.getpid()}

    # flint module control <name> ping --data '{"text":"hi"}'
    m.controller({"ping": on_ping})
    # stderr goes to .flint/run/modules/<name>.log.
    m.on_stop(lambda: print("[name]: stopped", file=sys.stderr, flush=True))
    m.status("ready")


if __name__ == "__main__":
    module.run()
```

## Design Guidelines

- **Run the plan by hand first.** `flint module status <name>` runs the plan and writes nothing. Fix each issue before `flint sync`.
- **One own action for each change.** `apply` runs once for each action, with the `payload` of the plan.
- **Settings through Flint.** A command that changes a setting calls `m.flint("module", "settings", m.ctx["module"]["name"], "set", key, json.dumps(value))`, then tells the person to run `flint sync`.
- **The Flint CLI.** `m.flint(*args)` runs any Flint command in the Flint root and returns `.code`, `.stdout`, `.stderr`, and `.json()`. A `flint sync` or `flint module status` inside the module runs no module process.
- **Logs on stderr.** In `plan` and `apply` the SDK moves `print` to stderr; stdout holds only the JSON of Flint.
- **The `live` handler returns.** After it returns, the SDK keeps the process alive with the heartbeat and the controller until SIGTERM.

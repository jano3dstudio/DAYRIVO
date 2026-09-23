# Optional workspace integration · 2026-09-22

Delivered DAYRIVO.exe SHA256: `f93cfcb02119bef8a0eba05d358bc39382fd2abe95022ee4071af29c92bee16e`.
The adjacent `.workspace.json` matches this exact executable.
Git base `9abe40c3d9b2e02a3723fd865b2349ac14a3685a`; local changes are not committed.
Pinned native window remains `0.2.0-chrome.2` (kit/chrome-version.json).

Executed from the final delivery path with isolated profiles:
- Full packaged standalone regression PASS, including atomic planner writes,
  backups, rejected invalid plans, reload, DE/EN and fake Clockodo service lifecycle.
- Embedded in Second Brain 0.9.0: native save, tab switching, close/reopen.
- Standalone reopened the very same synthetic planner written in the embedded view.
- Actual SendInput caption clicks: three maximize/restore cycles, minimize and
  exact restored geometry. No personal profile was used or replaced.

Evidence: `tool/tests/artifacts/workspace-20260922`; integration evidence in
the sibling Second Brain `review/workspace-20260922`. Personal visual acceptance
remains open. No live Clockodo call, public upload or automated updater.
Browser planner files were not changed by this integration.

Distribution/usage: [WORKSPACE.md](WORKSPACE.md). `package.py` creates a standalone
EXE + optional sidecar + source package, excluding private Clockodo local settings.

## Earlier verification

# Desktop verification

Verified 2026-09-21 on Windows x64 with WebView2 Runtime 153.0.4234.48.

Delivered executable: DAYRIVO.exe in the repository root.
SHA-256: 7BB861E4C409DFBCFAC9F8F45F00B5919997E268246118BD49BF67A29CDEBEA8

The executable was launched and tested from its final delivery path using isolated test data:
- Actual packaged WebView2 UI, preset onboarding and browser-backup import.
- Native plan persistence, backup of the previous state, reload and DE/EN switching.
- Rejected invalid plans and path traversal; failed writes to locked files preserve the plan.
- Recovery from damaged prior JSON retains the damaged original as a snapshot.
- Rejected non-allowlisted native service routes.
- Bundled Node service on a free port; fake Clockodo customers, projects and services imported into master data.
- Native masked credentials dialog, disconnect and reconnect.
- Window maximize/restore and no document-level horizontal overflow at the test window size.
- Service child process verified stopped after closing the app (PID 12556 in this run).

50 shared app source files matched the existing browser source by SHA-256 before delivery. The browser entry point was not changed.

Visual evidence is local under tool/tests/artifacts/desktop (ignored by Git).
Credentials were simulated. No real API calls or time writes were made by these tests. The final normal launch uses a separate user data directory; no QA records are copied into it.

Known delivery limits: unsigned EXE, no automatic updater, no automatic browser/desktop sync. WebView2 Runtime must be installed on the target PC. Existing billing drafts remain the separate pilot; this change adds neither invoice PDFs nor Clockodo time writes.
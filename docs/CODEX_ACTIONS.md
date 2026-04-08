# Codex Actions

Use Codex Desktop Actions as thin launchers. Keep the real audit logic in repo scripts so it stays versioned.

## Recommended Actions

### Inventory Audit
```bash
bash scripts/inventory-audit.sh
```

### Flow Audit
```bash
bash scripts/flow-audit.sh
```

### Schema Audit
```bash
bash scripts/schema-audit.sh
```

### Diff Snapshot
```bash
bash scripts/diff-snapshot.sh
```

## Rule
If an action grows beyond a tiny launcher, move the logic into a repo script and keep the action short.

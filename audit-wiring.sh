#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# TBM Wiring Audit — finds broken google.script.run calls
# Compares HTML client calls against server .js function defs
# ═══════════════════════════════════════════════════════════════

echo "═══ TBM WIRING AUDIT ═══"
echo ""
echo "Scanning $(ls *.html 2>/dev/null | wc -l) HTML files and $(ls *.js 2>/dev/null | wc -l) JS files..."
echo ""

# Use Python for reliable parsing (balanced paren tracking for
# withSuccessHandler/withFailureHandler callback chains)
python3 -c "
import re, glob, sys, os

chain_methods = {'withSuccessHandler', 'withFailureHandler', 'withUserObject'}

def find_matching_paren(s, start):
    depth = 0
    i = start
    while i < len(s):
        if s[i] == '(': depth += 1
        elif s[i] == ')':
            depth -= 1
            if depth == 0: return i
        i += 1
    return -1

all_results = {}

for htmlfile in sorted(glob.glob('*.html')):
    content = open(htmlfile, 'r', encoding='utf-8').read()
    flat = content.replace('\n', ' ')
    idx = 0
    while True:
        pos = flat.find('google.script.run', idx)
        if pos == -1: break
        cursor = pos + len('google.script.run')
        while cursor < len(flat) and flat[cursor] in ' \t': cursor += 1

        server_fn = None
        while cursor < len(flat) and flat[cursor] == '.':
            cursor += 1
            while cursor < len(flat) and flat[cursor] in ' \t': cursor += 1
            m = re.match(r'(\w+)', flat[cursor:])
            if not m: break
            method_name = m.group(1)
            cursor += len(method_name)
            while cursor < len(flat) and flat[cursor] in ' \t': cursor += 1
            if cursor < len(flat) and flat[cursor] == '(':
                if method_name in chain_methods:
                    end = find_matching_paren(flat, cursor)
                    if end == -1: break
                    cursor = end + 1
                    while cursor < len(flat) and flat[cursor] in ' \t': cursor += 1
                else:
                    server_fn = method_name
                    break
            else:
                server_fn = method_name
                break

        if server_fn and server_fn != 'run':
            if server_fn not in all_results:
                all_results[server_fn] = set()
            all_results[server_fn].add(htmlfile)
        idx = pos + 1

# Collect server-side function names
server_fns = set()
for jsfile in sorted(glob.glob('*.js')):
    content = open(jsfile, 'r', encoding='utf-8').read()
    for m in re.finditer(r'^function\s+(\w+)\s*\(', content, re.MULTILINE):
        server_fns.add(m.group(1))

client_fns = sorted(all_results.keys())

# --- BROKEN WIRING ---
print('--- BROKEN WIRING (client calls with no server function) ---')
broken = 0
for fn in client_fns:
    if fn not in server_fns:
        files = ', '.join(sorted(all_results[fn]))
        print(f'  X {fn}  <-  called from: {files}')
        broken += 1
if broken == 0:
    print('  OK All client calls have matching server functions')

# --- SAFE WRAPPER VIOLATIONS ---
print()
print('--- SAFE WRAPPER VIOLATIONS (client calls to non-*Safe functions) ---')
violations = 0
for fn in client_fns:
    if fn in server_fns and not fn.endswith('Safe'):
        files = ', '.join(sorted(all_results[fn]))
        print(f'  !! {fn}  <-  called from: {files} (not a Safe wrapper)')
        violations += 1
if violations == 0:
    print('  OK All client calls target Safe wrappers')

# --- FULL CLIENT CALL INVENTORY ---
print()
print('--- FULL CLIENT CALL INVENTORY ---')
for fn in client_fns:
    files = ', '.join(sorted(all_results[fn]))
    status = ''
    if fn not in server_fns:
        status = ' [BROKEN]'
    elif not fn.endswith('Safe'):
        status = ' [NOT SAFE]'
    print(f'  {fn} <- {files}{status}')

# --- SUMMARY ---
print()
print('=== SUMMARY ===')
print(f'Client-side calls found: {len(client_fns)} unique functions')
print(f'Server functions found:  {len(server_fns)} total')
print(f'Broken wiring:           {broken}')
print(f'Wrapper violations:      {violations}')
print()
if broken > 0:
    print('FAIL -- broken wiring detected. Do NOT deploy.')
    sys.exit(1)
elif violations > 0:
    print('WARN -- wrapper violations detected. Fix before next deploy.')
    sys.exit(0)
else:
    print('PASS -- all wiring intact, all calls use Safe wrappers.')
    sys.exit(0)
"

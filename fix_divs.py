import re

with open('src/components/CheckoutModal.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if i + 1 in [371, 734]:  # 1-indexed line numbers
        continue
    
    match = re.match(r'^([ \t]+)\);\s*$', line)
    if match:
        spaces = match.group(1)
        # Add 2 spaces and replace with </div>
        lines[i] = spaces + "  </div>\n"

with open('src/components/CheckoutModal.tsx', 'w') as f:
    f.writelines(lines)

import re

with open('src/components/CheckoutModal.tsx', 'r') as f:
    content = f.read()

start_str = "/* EDITING STATE / INPUT FORM */"
start_idx = content.find(start_str)
end_str = "          )}\n        </div>"
end_idx = content.find(end_str)

block = content[start_idx:end_idx]

# A better tag regex: matches <tag ...> or </tag>
# But ignores things inside {} and strings... it's hard.
# Let's just print all divs and forms
divs = len(re.findall(r'<div\b[^>]*>', block))
close_divs = len(re.findall(r'</div>', block))
print(f"divs: {divs}, close_divs: {close_divs}")

forms = len(re.findall(r'<form\b[^>]*>', block))
close_forms = len(re.findall(r'</form>', block))
print(f"forms: {forms}, close_forms: {close_forms}")

spans = len(re.findall(r'<span\b[^>]*>', block))
close_spans = len(re.findall(r'</span>', block))
print(f"spans: {spans}, close_spans: {close_spans}")


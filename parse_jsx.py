from html.parser import HTMLParser
import sys

class JSXParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.line_stack = []

    def handle_starttag(self, tag, attrs):
        # Ignore self-closing logic handled by HTMLParser for now, 
        # but JSX self-closing tags aren't perfectly parsed if they don't end in />
        pass
        
    def handle_startendtag(self, tag, attrs):
        pass

# This is too hard with standard HTMLParser because of JSX brackets.
# Let's just use a simple regex stack, ignoring lines with { or } at the start if needed.
# Better: Just find the missing divs inside EDITING STATE block again.

import re
with open('src/components/CheckoutModal.tsx', 'r') as f:
    text = f.read()

start_str = "/* EDITING STATE / INPUT FORM */"
start_idx = text.find(start_str)
end_str = "          )}\n        </div>"
end_idx = text.find(end_str)
block = text[start_idx:end_idx]

divs_open = len(re.findall(r'<div\b[^>]*?(?<!/)>', block))
divs_close = len(re.findall(r'</div>', block))
print(f"Open: {divs_open}, Close: {divs_close}")


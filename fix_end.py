with open('src/components/CheckoutModal.tsx', 'r') as f:
    lines = f.readlines()

new_lines = lines[:-5] + [
    '        </div>\n',
    '      </div>\n',
    '    </div>\n',
    '    </div>\n',
    '    </div>\n',
    '  );\n',
    '}\n'
]

with open('src/components/CheckoutModal.tsx', 'w') as f:
    f.writelines(new_lines)

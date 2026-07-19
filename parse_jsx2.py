import re
with open('src/components/CheckoutModal.tsx', 'r') as f:
    text = f.read()

def check_balance(name, block):
    divs_open = len(re.findall(r'<div\b[^>]*?(?<!/)>', block))
    divs_close = len(re.findall(r'</div>', block))
    print(f"{name} -> Open: {divs_open}, Close: {divs_close}, Diff: {divs_open - divs_close}")

block = text[text.find("/* EDITING STATE / INPUT FORM */"):text.find("/* Item cost preview header */")]
check_balance("Part 1", block)

block = text[text.find("/* Item cost preview header */"):text.find("/* PayPal Layout */")]
check_balance("Part 2", block)

block = text[text.find("/* PayPal Layout */"):text.find("/* Cancel footer */")]
check_balance("Part 3", block)


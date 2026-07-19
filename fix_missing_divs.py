import re

with open('src/components/CheckoutModal.tsx', 'r') as f:
    content = f.read()

content = content.replace("          )}\n        </div>\n      </div>", "                </div>\n              </div>\n            </div>\n          </div>\n          )}\n        </div>\n      </div>")

with open('src/components/CheckoutModal.tsx', 'w') as f:
    f.write(content)

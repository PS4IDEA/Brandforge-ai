import re

with open('src/components/CheckoutModal.tsx', 'r') as f:
    content = f.read()

injection = """                  </div>
                </div>
              )}

              {/* Item cost preview header */}
              <div className="bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/30 rounded-2xl p-4 flex items-center justify-between text-xs">
                <div>
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-indigo-500">{isAr ? 'العنصر المختار' : 'Selected Item'}</span>
                  <span className="font-bold text-slate-750 dark:text-white">{itemName}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-indigo-500">{isAr ? 'الإجمالي' : 'Total Price'}</span>
                  <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">${price}.00</span>
                </div>
              </div>
"""

target = "                      </div>\n                    )}\n                             {/* PayPal Layout */}"
replacement = "                      </div>\n                    )}\n" + injection + "              {/* PayPal Layout */}"

content = content.replace(target, replacement)

with open('src/components/CheckoutModal.tsx', 'w') as f:
    f.write(content)

import re

with open('src/components/CheckoutModal.tsx', 'r') as f:
    content = f.read()

# Let's clean up the end of the file first
end_marker = "{isAr ? 'إلغاء والعودة' : 'Cancel and Go Back'}\n                  </button>\n                </div>\n"
idx = content.find(end_marker)
if idx != -1:
    idx += len(end_marker)
    # the rest of the file should be exactly:
    clean_end = """              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
"""
    content = content[:idx] + clean_end
    with open('src/components/CheckoutModal.tsx', 'w') as f:
        f.write(content)

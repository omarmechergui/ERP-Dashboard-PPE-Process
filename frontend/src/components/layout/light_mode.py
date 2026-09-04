import os
import re

components_dir = r"c:\Users\AZUZ\Desktop\Task\frontend\src\components\layout"

replacements = [
    # Backgrounds
    ("bg-slate-950/70", "bg-slate-50/70"),
    ("bg-slate-900/50", "bg-slate-50"),
    ("bg-slate-900", "bg-white"),
    ("bg-slate-800/50", "bg-slate-100/50"),
    ("bg-slate-800/40", "bg-slate-100/40"),
    ("bg-slate-800/30", "bg-slate-100/30"),
    ("bg-slate-800", "bg-slate-100"),
    ("bg-slate-700", "bg-slate-200"),
    
    # Borders
    ("border-slate-800/50", "border-slate-200/50"),
    ("border-slate-800/20", "border-slate-200/50"),
    ("border-slate-800", "border-slate-200"),
    ("border-slate-700/50", "border-slate-200"),
    ("border-slate-700", "border-slate-200"),
    ("border-slate-600", "border-slate-300"),
    
    # Text
    ("text-slate-100", "text-slate-900"),
    ("text-slate-200", "text-slate-800"),
    ("text-slate-300", "text-slate-700"),
    ("text-slate-400", "text-slate-600"),
    # Keep text-slate-500
    
    # Hover text/bg
    ("hover:text-white", "hover:text-slate-900"),
    ("hover:bg-slate-800", "hover:bg-slate-100"),
    ("hover:bg-slate-700", "hover:bg-slate-200"),
    ("hover:border-slate-600", "hover:border-slate-300"),
    ("hover:border-slate-500", "hover:border-slate-400"),
    
    # Specific accent colors for light mode
    ("bg-blue-900/50", "bg-blue-100"),
    ("bg-blue-900/20", "bg-blue-50"),
    ("text-blue-300", "text-blue-700"),
    ("text-blue-400", "text-blue-600"),
    
    ("bg-rose-950/20", "bg-rose-50"),
    ("border-rose-800/50", "border-rose-200"),
    
    # Others
    ("[color-scheme:dark]", "[color-scheme:light]")
]

for filename in os.listdir(components_dir):
    if filename.endswith(".jsx") or filename.endswith(".js"):
        filepath = os.path.join(components_dir, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
            
        new_content = content
        for old, new in replacements:
            # We want to replace only exact matches so we don't double replace
            # but standard replace works if ordered correctly (since we map from high dark numbers to low light numbers)
            new_content = new_content.replace(old, new)
            
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)

print("Done")

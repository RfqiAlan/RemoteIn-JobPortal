import glob
import re

for filename in glob.glob('Frontend/src/components/*.tsx'):
    with open(filename, 'r') as f:
        content = f.read()
    
    open_count = len(re.findall(r'<div\b', content))
    self_closing_count = len(re.findall(r'<div[^>]*/>', content))
    true_open = open_count - self_closing_count
    close_count = len(re.findall(r'</div>', content))
    
    diff = true_open - close_count
    
    if diff > 0:
        print(f'{filename} needs {diff} closing tags')
        content = content.replace('</>', ('</div>\n' * diff) + '</>')
        
        with open(filename, 'w') as f:
            f.write(content)

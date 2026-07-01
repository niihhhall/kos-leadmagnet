import re
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

filepath = r"c:\Users\nihal\Desktop\KineticOS\kos-leadmagnet\docs\FINAL DEPLOY SET — KineticOS Diagnostic 7740fe8d0c5e82078c718145a396ccd7.md"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

sections_raw = re.split(r'^# Section ', content, flags=re.MULTILINE)

parsed_sections = []

for s_raw in sections_raw[1:]:
    lines = s_raw.split('\n')
    sec_title_line = lines[0].strip()
    num_part, title_part = sec_title_line.split(' — ', 1)
    sec_num = int(num_part)
    sec_title = title_part.strip()
    
    q_blocks = re.split(r'^\*\*(Q[0-9a-zA-Z.]+)\*\*\s*$', s_raw, flags=re.MULTILINE)
    
    questions = []
    for i in range(1, len(q_blocks), 2):
        q_id = q_blocks[i]
        q_text_content = q_blocks[i+1]
        
        q_lines = q_text_content.strip().split('\n')
        q_text_lines = []
        options = []
        is_checklist = False
        is_scale = False
        
        for line in q_lines:
            line_strip = line.strip()
            if not line_strip:
                continue
            if line_strip.startswith("- **A**") or line_strip.startswith("- **B**") or line_strip.startswith("- **C**"):
                m = re.match(r'- \*\*([A-C])\*\* ——? (.*)', line_strip)
                if not m:
                    m = re.match(r'- \*\*([A-C])\*\* ——? (.*)', line_strip.replace("—", "-"))
                if not m:
                    m = re.match(r'- \*\*([A-C])\*\* (?:-|—)+ (.*)', line_strip)
                if m:
                    label = m.group(1)
                    val = 0 if label == 'A' else (1 if label == 'B' else 2)
                    options.append({"value": val, "text": m.group(2).strip(), "label": label})
                else:
                    options.append({"value": 0, "text": line_strip, "label": "A"})
            elif line_strip.startswith("- [ ]"):
                is_checklist = True
                text_opt = line_strip[5:].strip()
                options.append({"text": text_opt})
            elif line_strip.startswith("*(1 ="):
                is_scale = True
                options.append({"type": "scale", "text": line_strip})
            else:
                if not line_strip.startswith(">") and not line_strip.startswith("---") and not line_strip.startswith("*If you selected") and not line_strip.startswith("*(Open text") and not line_strip.startswith("*(This question"):
                    q_text_lines.append(line_strip)
                    
        q_text = "\n".join(q_text_lines)
        
        q_type = "checklist" if is_checklist else ("scale" if is_scale else "choice")
        
        q_id_clean = q_id.lower().replace('.', '_')
        if q_id_clean.startswith('q'):
            q_id_clean = q_id_clean[1:]
            
        q_data = {
            "id": f"s{sec_num}q{q_id_clean}",
            "text": q_text,
            "type": q_type,
            "options": options
        }
        
        if q_data["id"] == "s5q6_5":
            q_data["has_open_text"] = True
            q_data["open_text_label"] = "If you selected A or B — in a few words, what do you think made it stop working?"
            
        questions.append(q_data)
        
    sec_id = ""
    if sec_num == 1: sec_id = "foundation"
    elif sec_num == 2: sec_id = "productivity"
    elif sec_num == 3: sec_id = "content"
    elif sec_num == 4: sec_id = "marketing"
    elif sec_num == 5: sec_id = "client"
    elif sec_num == 6: sec_id = "finance"
    
    parsed_sections.append({
        "id": sec_id,
        "name": sec_title,
        "questions": questions
    })

# Write to questions_new.json
with open("src/questions_new.json", "w", encoding="utf-8") as out:
    json.dump(parsed_sections, out, indent=2, ensure_ascii=False)

print("Parsed sections count:", len(parsed_sections))
for s in parsed_sections:
    print(f"Section {s['id']}: {len(s['questions'])} questions")

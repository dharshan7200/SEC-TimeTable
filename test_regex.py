import re

# Test the new pattern
SLOT_FACULTY_PATTERN = re.compile(r"^UG\s*-\s*\d+,\s*([A-Z0-9\-]+),\s*[A-Z]+\s*-\s*(.+)")

# Sample lines from the PDF
test_lines = [
    "UG - 08, T1-B13, MECH - MUTHUKUMAR V",
    "UG - 25, T1-G9, ENGLISH - Saranya V",
    "UG - 04, T1-W17, AI - Kisothkumar E",
    "UG - 04, T1-Z8, AI - MANOJ V",
    "UG - 04, T1-BLENDED, AI - LAVANYA G SCOFT"
]

print("Testing new SLOT_FACULTY_PATTERN regex:\n")
for line in test_lines:
    match = SLOT_FACULTY_PATTERN.match(line)
    if match:
        slot = match.group(1)
        faculty = match.group(2)
        print(f"✓ Matched: {line}")
        print(f"  Slot: {slot}")
        print(f"  Faculty: {faculty}\n")
    else:
        print(f"✗ No match: {line}\n")

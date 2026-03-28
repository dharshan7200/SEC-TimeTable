import re

# Define both patterns
SLOT_FACULTY_PATTERN_NEW = re.compile(r"^UG\s*-\s*\d+,\s*([A-Z0-9\-]+),\s*[A-Z]+\s*-\s*(.+)")
SLOT_FACULTY_PATTERN_OLD = re.compile(r"^([A-Z0-9\-]+),\s*(.+)")

# Test lines - both old and new formats
test_lines = [
    # New format
    "UG - 08, T1-B13, MECH - MUTHUKUMAR V",
    "UG - 25, T1-G9, ENGLISH - Saranya V",
    "UG - 04, T1-BLENDED, AI - LAVANYA G SCOFT",
    # Old format
    "T1-A5, John Smith",
    "T2-C10, Jane Doe",
    "SLOT-X1, Faculty Name"
]

print("Testing both OLD and NEW format patterns:\n")
for line in test_lines:
    # Try new format first
    match = SLOT_FACULTY_PATTERN_NEW.match(line)
    if match:
        print(f"✓ NEW FORMAT: {line}")
        print(f"  Slot: {match.group(1)}, Faculty: {match.group(2)}\n")
        continue
    
    # Fall back to old format
    match = SLOT_FACULTY_PATTERN_OLD.match(line)
    if match:
        print(f"✓ OLD FORMAT: {line}")
        print(f"  Slot: {match.group(1)}, Faculty: {match.group(2)}\n")
        continue
    
    print(f"✗ NO MATCH: {line}\n")

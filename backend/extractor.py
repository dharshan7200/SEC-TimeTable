import pdfplumber
import re
from datetime import time
from collections import defaultdict
import io

# ---------------- REGEX ----------------

COURSE_HEADER = re.compile(r"^(\d{2}[A-Z]{2}\d{3})\s*\[(\d+)\s*Credits\]")
DOMAIN_PATTERN = re.compile(
    r"(PROFESSIONAL CORE|PROFESSIONAL ELECTIVE|OPEN ELECTIVE|ENGINEERING SCIENCES|HUMANITIES AND SCIENCES)"
)
# New format: UG - 04, T1-B13, MECH - MUTHUKUMAR V
SLOT_FACULTY_PATTERN_NEW = re.compile(r"^UG\s*-\s*\d+,\s*([A-Z0-9\-]+),\s*[A-Z]+\s*-\s*(.+)")
# Old format: T1-B13, MUTHUKUMAR V
SLOT_FACULTY_PATTERN_OLD = re.compile(r"^([A-Z0-9\-]+),\s*(.+)")
DAY_PATTERN = re.compile(r"^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday):")
TIME_PAIR_PATTERN = re.compile(r"(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})")


VALID_START = time(8, 0)
VALID_END = time(17, 0)

# ---------------- HELPERS ----------------

def is_valid_time(start, end):
    try:
        s = time.fromisoformat(start)
        e = time.fromisoformat(end)
        return VALID_START <= s < e <= VALID_END
    except ValueError:
        return False

def to_minutes(t):
    h, m = map(int, t.split(":"))
    return h * 60 + m

def from_minutes(m):
    return f"{m//60:02d}:{m%60:02d}"

# ---------------- PDF PARSING ----------------

def extract_text_from_bytes(file_bytes):
    text = ""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
    return text

def parse_pdf_text(text):
    rows = []

    current_course = {}
    current_slot = None
    current_faculty = None
    skip_phase = False

    lines = [l.strip() for l in text.split("\n") if l.strip()]
    i = 0

    while i < len(lines):
        line = lines[i]

        # ---- COURSE HEADER ----
        header = COURSE_HEADER.match(line)
        if header:
            current_course = {
                "Course Code": header.group(1),
                "Credits": header.group(2),
                "Course Name": ""
            }
            current_slot = None
            current_faculty = None
            skip_phase = False
            i += 1
            continue

        # ---- IGNORE DOMAIN (NOT STORED) ----
        if DOMAIN_PATTERN.search(line):
            i += 1
            continue

        # ---- COURSE NAME ----
        if line == "Course overview":
            if i + 1 < len(lines):
                current_course["Course Name"] = lines[i + 1]
                i += 2
            else:
                i += 1
            continue

        # ---- IGNORE PHASE ----
        if line.startswith("PHASE"):
            skip_phase = True
            current_slot = None
            current_faculty = None
            i += 1
            continue

        # ---- SLOT + FACULTY ----
        # Try new format first (UG - XX, SLOT, DEPT - FACULTY)
        slot_match = SLOT_FACULTY_PATTERN_NEW.match(line)
        if slot_match:
            current_slot = slot_match.group(1)
            current_faculty = slot_match.group(2)
            skip_phase = False
            i += 1
            continue
        
        # Fall back to old format (SLOT, FACULTY)
        slot_match = SLOT_FACULTY_PATTERN_OLD.match(line)
        if slot_match:
            current_slot = slot_match.group(1)
            current_faculty = slot_match.group(2)
            skip_phase = False
            i += 1
            continue

        # ---- DAY + MULTI TIME ----
        day_match = DAY_PATTERN.match(line)
        if day_match and current_course.get("Course Code") and current_slot and not skip_phase:
            day = day_match.group(1)
            times = TIME_PAIR_PATTERN.findall(line)

            for start, end in times:
                if is_valid_time(start, end):
                    rows.append({
                        "Course Name": current_course.get("Course Name", "Unknown"),
                        "Course Code": current_course["Course Code"],
                        "Credits": current_course["Credits"],
                        "Faculty Name": current_faculty,
                        "Slot Name": current_slot,
                        "Day": day,
                        "Start": start,
                        "End": end
                    })

        i += 1
    
    print(f"[INFO] PDF extraction complete: {len(rows)} course slots found")
    return rows

def merge_slots(rows):
    """
    Converts raw rows to the tuple format expected by format_output,
    without merging contiguous time slots. This ensures the frontend
    receives granular 1-hour slots for its grid.
    """
    final = []
    for r in rows:
        key = (
            r["Course Name"],
            r["Course Code"],
            r["Credits"],
            r["Faculty Name"],
            r["Slot Name"],
            r["Day"]
        )
        start = to_minutes(r["Start"])
        end = to_minutes(r["End"])
        final.append((*key, start, end))

    return final

def format_output(merged_rows):
    """
    Formats the merged rows into a structured list of dictionaries
    ready for the API response.
    """
    courses = []
    
    # We want to group by Course Code to present a cleaner structure if needed,
    # but for now, let's just return the flat list of available slots/options.
    # The CSP solver will need to group them.
    
    for (name, code, credits, faculty, slot, day, start, end) in merged_rows:
        courses.append({
            "course_name": name,
            "course_code": code,
            "credits": credits,
            "faculty": faculty,
            "slot": slot,
            "day": day,
            "start_time": from_minutes(start),
            "end_time": from_minutes(end)
        })
    return courses

def extract_courses(file_bytes):
    """
    Main entry point for API (File Upload).
    """
    text = extract_text_from_bytes(file_bytes)
    return extract_courses_from_text(text)

def extract_courses_from_text(text):
    """
    Main entry point for API (Text Paste).
    """
    raw_rows = parse_pdf_text(text)
    merged = merge_slots(raw_rows)
    return format_output(merged)

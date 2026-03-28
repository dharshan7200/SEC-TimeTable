from backend.extractor import extract_courses_from_text

# Read the sample text
with open('sample_enrollment.txt', 'r') as f:
    text = f.read()

print("Sample text to extract:")
print("=" * 50)
print(text[:500])
print("=" * 50)
print()

# Try extraction
try:
    result = extract_courses_from_text(text)
    print(f"\n✅ Extraction successful! Found {len(result)} course entries:")
    print()
    for i, course in enumerate(result[:5], 1):  # Show first 5
        print(f"{i}. {course['course_name']} - {course['faculty']}")
        print(f"   Slot: {course['slot']}, Day: {course['day']}, Time: {course['start_time']}-{course['end_time']}")
        print()
    
    if len(result) > 5:
        print(f"... and {len(result) - 5} more entries")
except Exception as e:
    print(f"\n❌ Extraction failed: {e}")
    import traceback
    traceback.print_exc()

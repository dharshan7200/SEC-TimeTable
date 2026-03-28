from typing import List, Dict, Optional, Any
from collections import defaultdict

class TimetableCSP:
    def __init__(self, selected_subjects: List[str], courses_data: List[Dict], leave_day: str, preferred_faculties: Dict[str, str]):
        self.selected_subjects = selected_subjects
        self.courses_data = courses_data
        self.leave_day = leave_day
        self.preferred_faculties = preferred_faculties
        
        # Organize domains: Subject -> List of valid slots
        self.domains = self._build_domains()
        self.assignment = {}  # Subject -> Slot
        self.conflicts = []

    def _build_domains(self):
        # 1. Group raw data by (Course, Slot, Faculty) to form atomic "Options"
        # Each option is a LIST of segments (e.g. [Mon 8-9, Wed 10-11])
        grouped_options = defaultdict(list)
        
        for course in self.courses_data:
            if course['course_name'] not in self.selected_subjects:
                continue
                
            # Key = (Course, SlotName, Faculty)
            # We must group by Faculty too because sometimes different faculties teach the same slot name? 
            # Or usually SlotName is unique. Let's group by Slot+Faculty to be safe and distinct.
            key = (course['course_name'], course['slot'], course['faculty'])
            grouped_options[key].append(course)

        # 2. Convert groups to domains
        domains = defaultdict(list)
        
        for (subject, slot, faculty), segments in grouped_options.items():
            # Check Hard Constraint: Leave Day
            # If ANY segment falls on the leave day, this ENTIRE option is invalid
            if any(seg['day'] == self.leave_day for seg in segments):
                continue
            
            # This 'value' is now a list of dicts
            domains[subject].append(segments)

        # 3. Sort domains based on preferences
        for subject in domains:
            preferred = self.preferred_faculties.get(subject)
            if preferred:
                # We check the faculty of the first segment (they are all same faculty)
                domains[subject].sort(key=lambda segs: 0 if segs[0]['faculty'] == preferred else 1)
                
        return domains

    def solve(self):
        # 1. Validation checks
        for subject in self.selected_subjects:
            if subject not in self.domains or not self.domains[subject]:
                if self.leave_day:
                    return {
                        "status": "conflict",
                        "reason": f"Subject '{subject}' is only available on your requested Leave Day ({self.leave_day}).",
                        "suggestion": "Please choose a different leave day or remove this subject."
                    }
                else:
                    return {
                        "status": "error",
                        "reason": f"No slots found for '{subject}'.",
                        "suggestion": "Check input data."
                    }

        # Prepare generic debug data (useful for visualization)
        # Flatten domains for frontend consumption: Subject -> List of {Day, Time, Slot}
        debug_domains = {}
        for subj, options in self.domains.items():
            # options is a List of Lists of Segments
            # We want to show ALL unique slots available for this subject
            # So we flatten the list of lists
            flat_slots = []
            seen = set()
            for segments in options:
                for seg in segments:
                    # Create a unique key to avoid duplicates in visualization
                    unique_key = (seg['day'], seg['start_time'], seg['end_time'])
                    if unique_key not in seen:
                        flat_slots.append({
                            "Day": seg['day'],
                            "Time": f"{seg['start_time']} - {seg['end_time']}",
                            "Slot": seg['slot'],
                            "Faculty": seg['faculty']
                        })
                        seen.add(unique_key)
            debug_domains[subj] = flat_slots

        # 2. Strict Solve (Respected Leave Day, but might have swapped Faculty)
        if self._backtrack():
            # Check if we adhered to faculty preferences
            changes = []
            for subj, segments in self.assignment.items():
                assigned_faculty = segments[0]['faculty'] # All segments have same faculty
                preferred = self.preferred_faculties.get(subj)
                if preferred and preferred != assigned_faculty:
                    changes.append(f"{subj} ({assigned_faculty})")
            
            result = {
                "timetable": self._format_assignment(),
                "all_possible_slots": debug_domains
            }
            
            if changes:
                result["status"] = "success_with_adjustment"
                result["message"] = f"Auto-adjusted faculty to fit schedule: {', '.join(changes)}."
            else:
                result["status"] = "success"
                
            return result

        # 3. Auto-Fit (Relax Leave Day AND potentially Faculty)
        potential = self._solve_ignoring_leave_day()
        if potential:
             # Check changes here too? 
             # For now, just generic message, or we can look into 'potential' structure if we change return type
             # simpler to leave generic for the big relaxation
             return {
                "status": "success_with_adjustment",
                "timetable": potential,
                "message": f"Couldn't fit all classes on your Leave Day ({self.leave_day}). Adjusted schedule options.",
                "all_possible_slots": debug_domains
            }
            
        # 4. Conflict Msg
        conflict_info = self._diagnose_conflict_detailed()
        return {
            "status": "conflict",
            "reason": "Scheduling conflict detected.",
            "conflict_details": conflict_info,
            "suggestion": self._generate_suggestions(),
            "all_possible_slots": debug_domains
        }

    def _diagnose_conflict_detailed(self):
        """
        Returns structured data about specific overlaps.
        """
        conflicts = []
        
        # Check every pair of subjects
        subjects = self.selected_subjects
        for i in range(len(subjects)):
            for j in range(i + 1, len(subjects)):
                s1 = subjects[i]
                s2 = subjects[j]
                
                # Check if they have ANY non-overlapping combination
                # If ALL combinations overlap, report the overlap zones
                
                s1_options = self.domains[s1]
                s2_options = self.domains[s2]
                
                if not s1_options or not s2_options: continue
                
                # Check for total incompatibility
                total_clash = True
                example_clash = None
                
                for opt1 in s1_options:
                    for opt2 in s2_options:
                        # Check strictly if opt1 and opt2 can coexist
                        # opt1/2 are LISTS of segments
                        current_pair_clash = False
                        for seg1 in opt1:
                            for seg2 in opt2:
                                if seg1['day'] == seg2['day']:
                                    if self._check_overlap(seg1['start_time'], seg1['end_time'],
                                                           seg2['start_time'], seg2['end_time']):
                                        current_pair_clash = True
                                        example_clash = {
                                            "Subject1": s1,
                                            "Subject2": s2,
                                            "Day": seg1['day'],
                                            "Time": f"{seg1['start_time']} - {seg1['end_time']}"
                                            # Note: This is just one segment of the clash
                                        }
                                        break
                            if current_pair_clash: break
                        
                        if not current_pair_clash:
                            total_clash = False
                            break
                    if not total_clash: break
                
                if total_clash:
                    conflicts.append({
                        "type": "hard_overlap",
                        "subjects": [s1, s2],
                        "message": f"Conflict: '{s1}' and '{s2}' always overlap.",
                        "example_clash": example_clash
                    })
        
        if not conflicts:
            return [{"type": "general", "message": "Complex constraint failure (no direct pair overlap found)."}]
            
        return conflicts

    def _solve_ignoring_leave_day(self):
        original_domains = self.domains
        original_assignment = self.assignment.copy()
        
        # Rebuild domains without filtering leave day
        grouped_options = defaultdict(list)
        for course in self.courses_data:
            if course['course_name'] in self.selected_subjects:
                key = (course['course_name'], course['slot'], course['faculty'])
                grouped_options[key].append(course)
        
        new_domains = defaultdict(list)
        for (subject, _, faculty), segments in grouped_options.items():
            new_domains[subject].append(segments)
            
        # Sort
        for subject in new_domains:
            preferred = self.preferred_faculties.get(subject)
            if preferred:
                new_domains[subject].sort(key=lambda segs: 0 if segs[0]['faculty'] == preferred else 1)

        self.domains = new_domains
        self.assignment = {}
        
        if self._backtrack():
            res = self._format_assignment()
            self.domains = original_domains
            self.assignment = original_assignment
            return res
            
        self.domains = original_domains
        self.assignment = original_assignment
        return None

    def _backtrack(self):
        if len(self.assignment) == len(self.selected_subjects):
            return True

        unassigned = [s for s in self.selected_subjects if s not in self.assignment]
        # MCV: Pick variable with fewest options
        var = min(unassigned, key=lambda s: len(self.domains[s]))

        # 'value' is a LIST of segments
        for value in self.domains[var]:
            if self._is_consistent(var, value):
                self.assignment[var] = value
                if self._backtrack():
                    return True
                del self.assignment[var]
        
        return False

    def _is_consistent(self, var, value_segments):
        # value_segments is List of Dicts (the full schedule for this slot)
        
        for assigned_var, assigned_segments in self.assignment.items():
            # assigned_segments is also a List of Dicts
            
            # Check EVERY segment against EVERY assigned segment
            for new_seg in value_segments:
                for existing_seg in assigned_segments:
                    
                    # 1. Day Overlap Check
                    if new_seg['day'] == existing_seg['day']:
                        if self._check_overlap(new_seg['start_time'], new_seg['end_time'],
                                               existing_seg['start_time'], existing_seg['end_time']):
                            return False
                    
                    # 2. Faculty Overlap
                    # If same faculty, they cannot overlap in time (handled above)
                    # BUT strictly speaking, if it's the SAME faculty but DIFFERENT classes, 
                    # and they overlap, that's impossible for the faculty.
                    # (Though if data is valid, a faculty won't be doubled booked. 
                    # But we must ensure WE don't book same faculty twice at same time).
                    if new_seg['faculty'] == existing_seg['faculty']:
                         if new_seg['day'] == existing_seg['day']:
                            if self._check_overlap(new_seg['start_time'], new_seg['end_time'],
                                                   existing_seg['start_time'], existing_seg['end_time']):
                                return False
        return True

    def _check_overlap(self, start1, end1, start2, end2):
        return (start1 < end2) and (start2 < end1)

    def _format_assignment(self):
        output = []
        for subject, segments in self.assignment.items():
            # Flatten the list of segments into the output
            for seg in segments:
                output.append({
                    "course_name": seg.get('course_name', subject),
                    "course_code": seg.get('course_code', ''),
                    "faculty": seg['faculty'],
                    "day": seg['day'],
                    "time": f"{seg['start_time']} - {seg['end_time']}",
                    "venue": seg['slot'] # Mapping slot to venue for display
                })
        return output
        
    def _diagnose_conflict(self):
        # Update diagnostic to handle list structures
        # Simplification: Just say "Conflict" for now to reduce complexity risk 
        # or implement basic pair check
        return "Unresolvable clash detected between selected subjects."

    def _generate_suggestions(self):
        # Strategy 1: Relax Faculty Preferences
        # We rebuild domains ignoring the user's preferred faculties (include all slots)
        # Note: In _build_domains we already included all slots, just sorted them. 
        # IF the solver failed, it means even the non-preferred ones didn't work 
        # OR our backtracking didn't explore deep enough? 
        # Actually, standard backtracking DOES explore everything. 
        # So if _backtrack() failed, STRICTLY speaking, no solution exists for these variables + leave day.
        
        # Strategy 2: Relax Leave Day
        # Try to solve assuming NO leave day.
        
        # Re-initialize a temporary solver without leave day constraint
        temp_domains = defaultdict(list)
        for course in self.courses_data:
            if course['course_name'] in self.selected_subjects:
                # No leave day check here
                temp_domains[course['course_name']].append(course)
        
        # Quick check if solvable without leave day
        if self._try_solve_custom_domains(temp_domains):
            return f"We found a valid timetable if you are willing to attend classes on {self.leave_day} (your preferred leave)."

        # Strategy 3: Identify the 'Dealbreaker' Subject
        # Try removing one subject at a time to see if the rest fit.
        for subject_to_remove in self.selected_subjects:
            remaining = [s for s in self.selected_subjects if s != subject_to_remove]
            
            # Build domains for remaining
            rem_domains = {k: v for k, v in self.domains.items() if k in remaining}
            
            # We need a new 'assignment' state for this check
            if self._try_solve_custom_domains(rem_domains, remaining):
                return f"Conflict resolved if you remove '{subject_to_remove}'."

        return "The combination of subjects selected is heavily conflicted. Try selecting fewer subjects."

    def _try_solve_custom_domains(self, custom_domains, custom_subjects=None):
        """
        Helper to run a solver on a different set of domains/subjects purely for checking feasibility.
        """
        if custom_subjects is None:
            custom_subjects = self.selected_subjects
            
        # Recursive internal backtracking for this check
        assignment = {}
        
        def backtrack_internal():
            if len(assignment) == len(custom_subjects):
                return True
            
            # Simple ordering
            var = next(s for s in custom_subjects if s not in assignment)
            
            # Use custom domains
            if var not in custom_domains: return False
            
            for value in custom_domains[var]:
                # Consistency check logic (duplicated for isolation)
                is_safe = True
                for assigned_val in assignment.values():
                    if assigned_val['day'] == value['day']:
                        if self._check_overlap(assigned_val['start_time'], assigned_val['end_time'],
                                               value['start_time'], value['end_time']):
                            is_safe = False
                            break
                    if assigned_val['faculty'] == value['faculty']:
                         if assigned_val['day'] == value['day']:
                            if self._check_overlap(assigned_val['start_time'], assigned_val['end_time'],
                                                   value['start_time'], value['end_time']):
                                is_safe = False
                                break
                
                if is_safe:
                    assignment[var] = value
                    if backtrack_internal():
                        return True
                    del assignment[var]
            return False

        return backtrack_internal()


    def get_suggestions(self):
        # Legacy stub compatibility
        return self._generate_suggestions()

    def is_solvable(self) -> bool:
        """
        Quickly checks if a valid assignment exists for the current selection.
        Returns True if solvable, False otherwise.
        """
        # 1. Validation: Ensure all selected subjects have at least one valid slot
        for subject in self.selected_subjects:
            if subject not in self.domains or not self.domains[subject]:
                return False
                
        # 2. Attempt strict solve (respecting Leave Day and Preferences if possible)
        # We use standard backtrack. If it returns True, we have a solution.
        if self._backtrack():
            return True
            
        return False

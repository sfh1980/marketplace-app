# Documentation Guide

This guide explains the documentation structure and how to keep all files synchronized.

---

## Documentation Files

### 1. README.md
**Purpose:** Project overview and quick start guide  
**Location:** Root directory  
**Key Sections:**
- Project Status (progress counter, current phase, completed tasks)
- Key Features
- Getting Started
- Technology Stack
- Available Scripts
- Documentation links

**Update When:**
- Task is completed
- Phase is completed
- Major milestone reached

**What to Update:**
- Progress counter: "X of 80 tasks complete (Y%)"
- Current Phase
- Completed Tasks list
- Next Steps

---

### 2. PROGRESS.md
**Purpose:** Detailed development log with learning notes  
**Location:** Root directory  
**Key Sections:**
- Project Overview
- Technology Stack
- Phase 1: MVP Development (with status and progress)
- Completed Tasks (detailed list)
- Current Task
- Next Steps
- Learning Log (sessions with what was learned)
- Notes & Decisions

**Update When:**
- Task is completed
- New session starts
- Major learning milestone

**What to Update:**
- Status header: "Status: [Phase Name] ✓"
- Progress counter: "Progress: X of 80 tasks complete (Y%)"
- Completed Tasks section (add new completed tasks)
- Current Task section (update to next task)
- Learning Log (add new session when appropriate)

---

### 3. CURRENT-STATUS.md
**Purpose:** Quick reference for current project state  
**Location:** Root directory  
**Key Sections:**
- Current Task
- Current Phase
- Progress counter
- Completed Work (by phase)
- Current Task details
- Upcoming Tasks
- Progress Summary
- What's Working

**Update When:**
- Every task completion
- Phase transition

**What to Update:**
- Current Task
- Current Phase
- Progress counter
- Completed Work section (add completed tasks)
- Upcoming Tasks (update list)

---

### 4. tasks.md
**Purpose:** Complete implementation task list  
**Location:** `.kiro/specs/marketplace-platform/tasks.md`  
**Key Sections:**
- Phase 1: Project Foundation
- Phase 2: Authentication & User Management
- Phase 3: User Profile Management
- Phase 4-13: Additional phases

**Update When:**
- Task is completed (mark with [x])
- Task is started (can mark with [x] when done)

**What to Update:**
- Checkbox status: `- [ ]` → `- [x]`
- This is the SOURCE OF TRUTH for task completion

---

### 5. PROJECT-STATUS.md (Optional)
**Purpose:** High-level project status overview  
**Location:** Root directory (if exists)  
**Similar to:** CURRENT-STATUS.md but more comprehensive

---

## Documentation Sync Process

### Automatic Sync (via Hook)
When `tasks.md` is saved, the "Sync Documentation After Task Completion" hook automatically:
1. Counts completed tasks
2. Identifies current task and phase
3. Calculates progress percentage
4. Updates all documentation files
5. Ensures consistency

### Manual Sync
You can manually trigger documentation sync:
1. Open Command Palette
2. Search for "Kiro: Run Agent Hook"
3. Select "Manual Documentation Sync"
4. Agent will review and update all files

---

## Consistency Rules

All documentation files must agree on:

1. **Task Count**
   - Count all `[x]` checkboxes in tasks.md
   - This number should appear in all files

2. **Current Task**
   - First `[ ]` (incomplete) task in tasks.md
   - Should be identified in all status files

3. **Current Phase**
   - Phase containing the current task
   - Should be stated consistently

4. **Progress Percentage**
   - Formula: (completed tasks / 80) × 100
   - Round to nearest 0.5%

5. **Completed Tasks List**
   - Should match all `[x]` tasks in tasks.md
   - Can be summarized or detailed depending on file

---

## Update Checklist

When completing a task, ensure these are updated:

- [ ] Mark task as complete in `tasks.md` with `[x]`
- [ ] Update progress counter in `README.md`
- [ ] Update progress counter in `PROGRESS.md`
- [ ] Update progress counter in `CURRENT-STATUS.md`
- [ ] Add completed task to "Completed Tasks" sections
- [ ] Update "Current Task" to next incomplete task
- [ ] Update "Current Phase" if phase changed
- [ ] Update "Next Steps" sections
- [ ] Add session log to `PROGRESS.md` if major milestone

---

## Common Issues

### Issue: Task counts don't match
**Solution:** 
1. Count `[x]` in tasks.md manually
2. Update all files with correct count
3. Use Manual Documentation Sync hook

### Issue: Current task is wrong
**Solution:**
1. Find first `[ ]` in tasks.md
2. Update all files to reflect this task
3. Verify phase is correct

### Issue: Progress percentage is wrong
**Solution:**
1. Calculate: (completed / 80) × 100
2. Update all files with correct percentage

### Issue: Files are inconsistent
**Solution:**
1. Use Manual Documentation Sync hook
2. Review all files for discrepancies
3. Update to match tasks.md (source of truth)

---

## Source of Truth

**tasks.md is the single source of truth for:**
- Which tasks are complete
- Which task is current
- Which phase we're in

All other documentation should reflect the state in tasks.md.

---

## Agent Hooks

### 1. Sync Documentation After Task Completion
**Trigger:** When tasks.md is saved  
**Action:** Automatically reviews and updates all documentation  
**Location:** `.kiro/hooks/sync-documentation.json`

### 2. Manual Documentation Sync
**Trigger:** Manual (user-initiated)  
**Action:** Comprehensive documentation review and update  
**Location:** `.kiro/hooks/manual-doc-sync.json`

### 3. Update Progress Log
**Trigger:** When code files are saved  
**Action:** Reminds to update PROGRESS.md  
**Location:** `.kiro/hooks/update-progress-log.json`

---

## Best Practices

1. **Mark tasks complete immediately** when finished
2. **Save tasks.md** to trigger automatic sync
3. **Run manual sync** if you notice inconsistencies
4. **Review all files** after major milestones
5. **Keep PROGRESS.md detailed** with learning notes
6. **Keep README.md concise** for quick reference
7. **Use CURRENT-STATUS.md** for quick status checks

---

## File Relationships

```
tasks.md (SOURCE OF TRUTH)
    ↓
    ├─→ README.md (Quick overview)
    ├─→ PROGRESS.md (Detailed log)
    ├─→ CURRENT-STATUS.md (Quick status)
    └─→ PROJECT-STATUS.md (Comprehensive status)
```

All files should reflect the state in tasks.md.

---

## Quick Reference

**To check current status:**
→ Read `CURRENT-STATUS.md`

**To see detailed progress:**
→ Read `PROGRESS.md`

**To get project overview:**
→ Read `README.md`

**To see all tasks:**
→ Read `.kiro/specs/marketplace-platform/tasks.md`

**To sync documentation:**
→ Run "Manual Documentation Sync" hook

**To mark task complete:**
→ Change `- [ ]` to `- [x]` in tasks.md and save

---

## Maintenance

### Weekly
- [ ] Verify all documentation is consistent
- [ ] Run Manual Documentation Sync
- [ ] Review PROGRESS.md for completeness

### After Each Task
- [ ] Mark task complete in tasks.md
- [ ] Let automatic sync update files
- [ ] Verify updates are correct

### After Each Phase
- [ ] Update phase status in all files
- [ ] Add comprehensive session log to PROGRESS.md
- [ ] Update README.md with phase completion
- [ ] Commit and push to GitHub

---

This guide ensures all documentation stays synchronized and accurate throughout the project lifecycle.

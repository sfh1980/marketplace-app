---
inclusion: always
---

# Educational Development Guidelines

## Purpose
This project is being built with education as a primary goal. Every implementation should be a learning opportunity.

## Core Principles

### 1. Explain Before Implementing
Before writing any code, briefly explain:
- What we're building
- Why we need it
- What technologies/patterns we'll use
- How it fits into the larger system

### 2. Code with Commentary
When implementing:
- Add inline comments explaining complex logic
- Call out best practices being followed
- Explain why one approach was chosen over alternatives
- Highlight common pitfalls and how we're avoiding them
- **Always provide exact file paths** for files being created or modified
- **Always provide exact terminal commands** with the working directory specified

### 3. Incremental Development
- Break work into small, functional chunks
- Each chunk should be testable independently
- Don't move forward until current chunk works
- Build foundation before adding complexity

### 4. Test at Checkpoints
- After each functional milestone, write and run tests
- Explain what each test validates
- Show test results before proceeding
- Use test failures as learning opportunities

### 5. Document Progress
Maintain a `PROGRESS.md` file tracking:
- What has been implemented
- What tests have been written and passed
- Current status of the project
- Next steps

### 6. Concept Introductions
When introducing new concepts, explain:
- **What it is**: Brief definition
- **Why we use it**: Benefits and use cases
- **How it works**: High-level overview
- **Alternatives**: What else could be used and why we chose this

## File Paths and Commands (CRITICAL)

### Always Provide Exact Paths
When creating or modifying files:
- ✅ **Good**: "Create the file at `backend/src/controllers/authController.ts`"
- ❌ **Bad**: "Create an auth controller file"

When running commands:
- ✅ **Good**: "Run `npm install bcrypt` in the `backend/` directory"
- ❌ **Bad**: "Install bcrypt"

### Command Format
Always specify commands with their working directory:

```bash
# Working directory: backend/
npm install package-name

# OR with cd command
cd backend
npm install package-name
```

### File Path Format
Always use relative paths from project root:
- `backend/src/controllers/authController.ts`
- `frontend/src/components/Button.tsx`
- `.kiro/specs/marketplace-platform/requirements.md`
- `PROGRESS.md`

### Examples

**Creating a File:**
```
Create a new file at `backend/src/services/authService.ts` with the following content:
[code here]
```

**Modifying a File:**
```
Update the file at `backend/src/index.ts` to add the following import:
[code here]
```

**Running a Command:**
```
Run the following command in the `backend/` directory:
npm install jsonwebtoken @types/jsonwebtoken
```

**Running Multiple Commands:**
```
Execute these commands:

# Working directory: backend/
npx prisma migrate dev --name add_user_table
npx prisma generate
```

## Educational Explanations to Include

### For Each New Technology/Library
- Purpose and what problem it solves
- Basic usage patterns
- Configuration and setup
- Common gotchas

### For Each Code Pattern
- What pattern is being used (e.g., Repository Pattern, MVC)
- Why this pattern is appropriate
- How it improves code quality
- Real-world examples

### For Each Best Practice
- What the best practice is
- Why it matters
- What happens if we don't follow it
- How to apply it consistently

### For Each Test
- What functionality is being tested
- What the test validates
- How to read the test results
- What to do if it fails

## Progress Documentation Format

```markdown
# Development Progress Log

## [Date] - [Feature/Component Name]

### What We Built
- Brief description of functionality implemented

### Technologies Used
- List of new libraries/tools introduced
- Why each was chosen

### Code Highlights
- Key functions/components created
- Important patterns or techniques used

### Tests Written
- What tests were added
- Test results (pass/fail)

### What We Learned
- Key concepts covered
- Best practices applied
- Common mistakes avoided

### Next Steps
- What's coming next
- Prerequisites needed
```

## Testing Checkpoints

Natural testing checkpoints include:
- After database schema is defined
- After each API endpoint is implemented
- After each React component is created
- After authentication is working
- After search functionality is implemented
- Before integrating new major features

## Pacing

- Take time to explain concepts thoroughly
- Don't rush through implementations
- Pause for questions or clarification
- Celebrate when tests pass
- Learn from failures without frustration

## Remember

The goal is not just to build a marketplace, but to understand:
- How modern web applications are structured
- Why certain technologies are chosen
- How to write maintainable, testable code
- How to debug and solve problems
- How to follow industry best practices

Every line of code is an opportunity to learn something new.

## Critical Rules for Instructions

1. **Always provide exact file paths** - Never say "create a file" without specifying the complete path
2. **Always specify working directory** - Never run a command without stating where to run it
3. **Use relative paths from project root** - Consistent path format throughout
4. **Be explicit about file operations** - State clearly if creating new file vs modifying existing
5. **Group related commands** - Show all commands needed for a task together
6. **Explain what each command does** - Don't just list commands, explain their purpose

### Template for Instructions

When giving instructions, follow this format:

**What We're Building:**
[Brief explanation of the feature/component]

**Why We Need It:**
[Explanation of purpose and benefits]

**File to Create/Modify:**
`path/to/file.ts`

**Code:**
```typescript
[code here with comments]
```

**Commands to Run:**
```bash
# Working directory: backend/
npm install package-name

# Explanation of what this command does
```

**What This Does:**
[Explanation of how the code works]

**Testing:**
[How to verify it works]

This format ensures the user always knows:
- WHERE to create/edit files
- WHAT commands to run
- WHERE to run commands
- WHY we're doing it
- HOW to verify it works

#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Build a job application tracker with:
  - User authentication (email/password with email verification)
  - Job dashboard showing applied jobs, status, organization, salary, closing/applied dates
  - URL scraping with Gemini AI to extract job details
  - Document generation (Resume, Cover Letter, Supporting Statement) with AI refinement
  - PDF/TXT export
  - Rejection feedback feature

backend:
  - task: "User Registration with Email Verification"
    implemented: true
    working: "needs_testing"
    file: "/app/lib/auth.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "needs_testing"
        agent: "main"
        comment: "Implemented registration API with verification code logged to console"

  - task: "User Login"
    implemented: true
    working: "needs_testing"
    file: "/app/lib/auth.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "needs_testing"
        agent: "main"
        comment: "Implemented JWT-based login after email verification"

  - task: "Password Reset"
    implemented: true
    working: "needs_testing"
    file: "/app/lib/auth.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "needs_testing"
        agent: "main"
        comment: "Implemented forgot password and reset with code"

  - task: "Profile Update"
    implemented: true
    working: "needs_testing"
    file: "/app/lib/auth.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "needs_testing"
        agent: "main"
        comment: "Implemented profile name/phone update"

  - task: "Job CRUD Operations"
    implemented: true
    working: "needs_testing"
    file: "/app/app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "needs_testing"
        agent: "main"
        comment: "Implemented GET/POST/PUT/DELETE for jobs with user ownership"

  - task: "Job URL Scraping with Gemini AI"
    implemented: true
    working: "needs_testing"
    file: "/app/lib/gemini.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "needs_testing"
        agent: "main"
        comment: "Implemented web scraping and Gemini AI extraction for job details"

  - task: "Document Refinement with Gemini AI"
    implemented: true
    working: "needs_testing"
    file: "/app/lib/gemini.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "needs_testing"
        agent: "main"
        comment: "Implemented AI document refinement for resume, cover letter, supporting statement"

frontend:
  - task: "Authentication UI"
    implemented: true
    working: "needs_testing"
    file: "/app/app/page.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "needs_testing"
        agent: "main"
        comment: "Login, Register, Verify, Forgot/Reset password UI implemented"

  - task: "Dashboard with Job List"
    implemented: true
    working: "needs_testing"
    file: "/app/app/page.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "needs_testing"
        agent: "main"
        comment: "Dashboard with stats cards and job list implemented"

  - task: "Add/Edit Job Form"
    implemented: true
    working: "needs_testing"
    file: "/app/app/page.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "needs_testing"
        agent: "main"
        comment: "Job form with URL extraction feature implemented"

  - task: "Document Editor with AI Refinement"
    implemented: true
    working: "needs_testing"
    file: "/app/app/page.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "needs_testing"
        agent: "main"
        comment: "Document editor for resume, cover letter, supporting statement with AI refine and export"

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: false

test_plan:
  current_focus:
    - "User Registration with Email Verification"
    - "User Login"
    - "Job CRUD Operations"
    - "Document Refinement with Gemini AI"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      Implemented full Job Application Tracker MVP with:
      1. Auth: Register with email verification (code in console), login, password reset, profile update
      2. Jobs: CRUD operations with status tracking, URL scraping with Gemini AI
      3. Documents: Resume, Cover Letter, Supporting Statement with AI refinement and PDF/TXT export
      
      Test credentials: demo@jobtracker.com / demo123 (already verified in DB)
      
      Key APIs to test:
      - POST /api/auth/register (creates user, logs verification code)
      - POST /api/auth/verify (email + code)
      - POST /api/auth/login (returns JWT)
      - GET /api/jobs (requires Bearer token)
      - POST /api/jobs (create job)
      - POST /api/jobs/scrape (extract job from URL)
      - POST /api/documents/refine (AI refinement)
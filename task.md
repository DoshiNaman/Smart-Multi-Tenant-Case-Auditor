Smart Multi-Tenant Case Auditor

Background
A legal technology platform wants to enhance its system by introducing an AI-powered case auditing module for multiple law firms.
The system should allow different law firms to upload and manage legal case summaries while ensuring complete data isolation between firms. The platform should also use AI services to automatically classify and analyze submitted legal content.
The objective of this assignment is not only to develop features, but also to evaluate
how the developer:
• Designs architecture
• Handles multi-tenant security
• Integrates AI services
• Manages asynchronous workflows
• Thinks about scalability, auditing, and resilience
• Uses AI tools effectively during development

Business Requirement
Develop a web-based prototype where law firms can:
• Submit legal case summaries
• Automatically classify cases using AI
• Review and manually correct AI-generated outputs
• Maintain audit history for legal compliance
• Ensure strict tenant-level data separation

Mandatory Tech Stack
To align with the candidate's core expertise and the current needs of our enterprise infrastructure, the following stack is mandatory for this practical:
• Frontend: Next.js with TypeScript.
• Styling: Tailwind CSS or Shadcn UI.
• State Management: Redux Toolkit or React Context API.
• Backend: Nest.js (Server Actions/API Routes).
• Database: MongoDB or PostgreSQL.
• AI Integration: OpenAI API or Claude API (via LangChain or direct SDK).
• Authentication Simulation: Clerk or custom JWT-based middleware.

Core Requirements

1. Tenant-Aware Case Management
The platform will support multiple law firms (tenants).
Each uploaded case must:
• Belong to a specific Tenant
• Remain completely isolated from other tenants
• Be accessible only by authorized users of that tenant
Expected Capabilities:
• Case submission form
• Case metadata storage
• Tenant-aware APIs
• Secure data filtering

2. AI-Based Legal Case Analysis
When a case summary is submitted, the system should process the content using an
LLM service (OpenAI, Claude, etc.).
The AI should attempt to identify:
• Risk Level
    o High
    o Medium
    o Low
• Jurisdiction / Region
• AI reasoning or explanation behind the result

Important Notes
• AI responses may be slow
• AI may fail or return malformed data
• The application should remain stable in failure scenarios

3. Audit & Review Workflow

Legal users should be able to review AI-generated classifications.
User Roles
    Associate
        • Upload cases
        • View cases
    Partner
        • All Associate permissions
        • Override AI-generated classifications

4. Change Tracking & Legal Audit Trail
Whenever AI-generated values are changed manually:
• Original values should remain traceable
• Updated values should be logged
• System should store:
    o Who changed the data
    o What changed
    o When it changed

The system should maintain a complete audit trail.

5. Security Expectations
The system must prevent cross-tenant data exposure.
Examples:
• A user from Firm A must never access Firm B data
• APIs should reject unauthorized tenant access attempts
• Authentication and authorization must be enforced
JWT-based authentication is expected.
Deliverables

Required Submission
1. Source Code
Complete working project repository.
2. README Documentation
3. PROMPTS.md
The candidate must submit a chronological list of prompts used with AI tools during development.
# PortMate agent rules

## Source of truth
Priority: `/contracts`, `SPEC.md`, `AGENTS.md`, existing implementation.
If these conflict, stop and report the conflict. Bootstrap placeholders are not approved specifications.

## Ownership
- Gemini: mobile frontend/UI/UX on `client`.
- GPT: mobile application/data layer on `client`, including application logic, state, API integration and persistence.
- ÓE GenAI: server backend on `server`.
- `main`: stable integration. No separate frontend/backend branches.

## Requires explicit human approval
Changing contracts or fundamental architecture; adding paid infrastructure; disabling security checks; deleting user data; force-pushing; rewriting history; merging to main. Never commit secrets.

## Quality
Inspect existing code first. Implement, test, repair failures, keep coherent commits and leave a buildable repository whenever practical. Build/test/lint must pass before a handoff. Never invent missing product requirements or protocols.

## Bootstrap boundary
Do not begin product development until the human approves final SPEC and contracts and explicitly says to start. Automation maintenance commits use `chore:` and never worker markers. Only the wrapper may push. Workers must not edit automation, prompts, workflows, SPEC, contracts or these rules during implementation.

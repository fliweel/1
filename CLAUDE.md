# Claude Code Configuration

## Project Overview
Next.js 16 + TypeScript + React 19 AI chat application with:
- Anthropic Claude AI integration
- Supabase backend
- Document ingestion & RAG capabilities
- TailwindCSS styling

## Development Workflow

### Branching Strategy
- Develop all changes on assigned `claude/*` feature branches
- Branch format: `claude/<feature-name>-<sessionId>`
- All pushes must go to the designated branch specified at session start
- Never push to main/master without explicit permission

### Git Operations
- Always use `git push -u origin <branch-name>` for pushing
- Prefer fetching specific branches: `git fetch origin <branch-name>`
- Keep commits focused and well-described
- Use conventional commits when possible (feat:, fix:, refactor:, etc.)

## Code Standards

### TypeScript/React
- Use TypeScript for all new code (tsconfig.json is configured)
- Follow ESLint configuration (eslint.config.mjs)
- Use React 19 patterns and hooks
- Keep components in `/components` and pages in `/app`
- Store utilities in `/lib` with clear organization

### API Routes
- API routes in `/app/api/` follow Next.js conventions
- Document route parameters and response types
- Handle errors gracefully with appropriate HTTP status codes

### Styling
- Use TailwindCSS v4 with PostCSS
- Leverage `clsx` for conditional classes
- Keep component styles within Tailwind utilities
- Use `components.json` for UI component configuration

## Testing & Quality

### Before Committing
- Run linter: `npm run lint` (eslint configured)
- Check code compiles: `npm run build`
- Fix any linting errors before committing

### During Development
- Use `npm run dev` for hot-reload development
- Test in browser before committing
- Verify API routes work as expected

## Dependencies
- **AI**: @anthropic-ai/sdk, openai, ai package
- **Backend**: @supabase/supabase-js, @supabase/ssr
- **UI**: lucide-react, react-markdown, TailwindCSS
- **Utilities**: clsx, class-variance-authority, xlsx

Do not add new dependencies without clear justification - check if functionality already exists.

## Authorization & Safety

### Auto-Approved Actions
- Commits to `claude/*` feature branches
- Editing code files and configuration
- Running tests and linters
- Creating commits with clear messages

### Requires Confirmation
- Pushing to main/master or other permanent branches
- Deleting files or branches
- Force-pushing or rewriting history
- Major dependency upgrades
- Changes to CI/CD or deployment configuration

### Never Do Without Permission
- Skip pre-commit hooks or linting
- Add secrets or sensitive data to version control
- Delete the `.git` directory or repository structure
- Make changes to unrelated files in the same commit as feature work

## Environment & Secrets
- All environment variables should be in `.env.local` (not committed)
- Supabase credentials are handled via environment
- Never log sensitive data or API keys
- Check `.gitignore` before committing new files

## Documentation
- Keep README.md up-to-date with project changes
- Document new API routes with examples
- Add comments for non-obvious logic
- Update this file if workflows or standards change

---

**Last Updated**: 2026-03-01

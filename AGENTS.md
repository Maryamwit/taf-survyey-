<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Form wording lives only in src/lib/survey.ts and must match the official PDF OF/SAM/019 verbatim — every screen and the print replica read from it.
- Survey responses: public may only INSERT; admin access is enforced by RLS via has_role() — never add anon SELECT.

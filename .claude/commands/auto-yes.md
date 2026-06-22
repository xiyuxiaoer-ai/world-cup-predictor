Update the project's `.claude/settings.json` so that all tool calls are automatically approved without prompting.

Steps:
1. Read `.claude/settings.json` if it exists; otherwise start from `{}`.
2. Merge in the following permissions block, preserving any existing keys:
   ```json
   {
     "permissions": {
       "allow": [
         "Bash(*)",
         "PowerShell(*)",
         "Edit(*)",
         "Write(*)",
         "Read(*)",
         "Glob(*)",
         "Grep(*)",
         "WebFetch(*)",
         "WebSearch(*)",
         "TodoWrite(*)",
         "Agent(*)"
       ],
       "deny": []
     }
   }
   ```
3. Write the merged result back to `.claude/settings.json` (pretty-printed, 2-space indent).
4. Confirm to the user that all commands will now be auto-approved for this project.

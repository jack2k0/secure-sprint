# Shared AI toolkit

Agent skills and engineering rules for this project come from the versioned package
[`@jack2k0/ai-toolkit`](https://github.com/jack2k0/ai-toolkit), not from files copied between
repositories. A convention change is released once and reaches every consumer through `npm update`.

## Registry access

`.npmrc` at the repository root maps the `@jack2k0` scope to GitHub Packages and **contains no
token**. Authentication is separate:

```bash
# local developer
npm login --scope=@jack2k0 --registry=https://npm.pkg.github.com

# CI — a PAT with read:packages, stored as the GH_PKG_TOKEN secret
echo "//npm.pkg.github.com/:_authToken=${GH_PKG_TOKEN}" >> .npmrc
```

The token needs only the `read:packages` scope. Never commit it.

## Installing

```bash
npm install --save-dev @jack2k0/ai-toolkit
```

The package's `postinstall` hook then:

1. copies each skill into `.claude/skills/<skill-name>/`;
2. merges the shared rules into this repository's `AGENTS.md` between sentinel markers;
3. writes `.claude/.ai-toolkit-manifest.json` recording the version and every managed file.

## The managed block

```markdown
<!-- BEGIN @jack2k0/ai-toolkit -->
...managed content, replaced on every install...
<!-- END @jack2k0/ai-toolkit -->
```

Everything outside the markers is this project's own and is never touched. Do not edit inside them —
release a new toolkit version instead.

## Removing

```bash
npx ai-toolkit uninstall
npm uninstall @jack2k0/ai-toolkit
```

`uninstall` removes exactly what the manifest recorded and restores `AGENTS.md` to its unmanaged
content.

## CI note

Adding the dependency means this repository's CI needs `GH_PKG_TOKEN` before `npm ci` can resolve
the private package. Configure the secret first, then add the dependency — otherwise the workflow
fails on a package it cannot read.

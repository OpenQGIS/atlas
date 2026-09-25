---
description: "Git Branching and GitHub Pages Deployment Workflow for Atlas"
globs: ["*"]
alwaysApply: true
---

# Git 双分支推送与 GitHub Pages 部署铁律

## 1. 核心约束 (CRITICAL)
- 本仓库（OpenQGIS/atlas）的 GitHub Pages 部署源**直接挂载于 `website` 分支**。
- `main` 分支是源码主干，日常改动均在 `main` 分支进行。
- **严禁仅执行 `git push origin main`！** 遗漏推送到 `website` 分支会导致生产网站（https://openqgis.github.io/atlas/）无法触发构建，用户无法看到任何更新。

## 2. 授权推送时的强制命令标准
当用户明确授权推送时，AI 助手**必须且只能执行以下双分支同步命令**：

```powershell
# 1. 推送主干
git push origin main

# 2. 一键同步推送到生产分支 (利用 main:website 免去本地切分支的风险)
git push origin main:website
```

或者直接运行项目内置的发布工具：
```powershell
.\deploy.ps1 -Message "更新说明"
```

## 3. 推送后的验证动作
双分支推送完成后，AI 助手应使用 `gh run list --repo OpenQGIS/atlas --limit 2` 检查 GitHub Pages 的构建流水线状态，确认 `pages build and deployment` 进入运行或已构建成功（conclusion: success），并明确向用户汇报。

# 项目分支与发布部署规范 (Deployment & Branching Workflow)

本项目（**地图录 · AtlasLog**）采用**源码主干 + Pages 生产发布**的双分支协同架构。为防止代码改动无法同步到在线网页，所有开发者及 AI 协作助手必须严格遵守本规范。

---

## 1. 分支角色定义

| 分支名称 | 职责定位 | 说明 |
| :--- | :--- | :--- |
| **`main`** | **源码主干分支 (Source of Truth)** | 所有的代码开发、日常改动、功能迭代均在 `main` 分支进行。 |
| **`website`** | **生产发布分支 (GitHub Pages Source)** | 本仓库的 GitHub Pages 部署源直接挂载于此分支。**只有推送到 `website` 分支才会触发线上网站更新**。 |

> [!WARNING]
> **绝对禁止仅执行 `git push origin main`！**  
> 如果仅推送到 `main` 分支，GitHub Pages 不会触发任何构建动作，在线网站（https://openqgis.github.io/atlas/）将**完全保持旧版本**，造成“本地修改已生效但线上毫无变化”的假象。

---

## 2. 自动化一键部署（推荐）

本项目已配备自动化双分支同步工具，杜绝手工失误：

### 方式 A：Windows 双击运行
直接双击运行根目录下的：
```cmd
deploy.bat
```

### 方式 B：终端命令行调用
在 PowerShell 或终端中直接执行：
```powershell
.\deploy.ps1 -Message "feat: 你的更新说明"
```

---

## 3. 手工推送规范指令

若需手工执行 Git 命令，请务必执行以下标准两步法（**无需在本地来回切换分支**）：

```bash
# 1. 提交本地改动 (如果在 main 分支)
git add .
git commit -m "feat/fix: 详细更新说明"

# 2. 推送至源码主干
git push origin main

# 3. 将本地 main 的最新 commit 同步推送到远程 website 分支 (核心步骤)
git push origin main:website
```

---

## 4. GitHub Pages 构建状态验证

推送完成后，可通过 GitHub CLI 或网页端确认构建状态：
```bash
gh run list --repo OpenQGIS/atlas --limit 3
```
当显示 `pages build and deployment` 结果为 `success` 即代表线上已成功生效。
生产访问地址：**[https://openqgis.github.io/atlas/](https://openqgis.github.io/atlas/)**

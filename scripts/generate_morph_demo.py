# -*- coding: utf-8 -*-
import os, json, shutil

# 1. 扩充与完善 morph-icons-def.js，确保所有 12 对图标节点定义完备
icons_def_path = 'd:/GitHub/atlas/assets/morph-icons-def.js'
os.makedirs(os.path.dirname(icons_def_path), exist_ok=True)

icons_code = """// Lucide & Heroicons Nodes Dictionary for Morphicons
export const ICONS = {
  sun: [ ["circle", { cx: "12", cy: "12", r: "4" }], ["path", { d: "M12 2v2" }], ["path", { d: "M12 20v2" }], ["path", { d: "m4.93 4.93 1.41 1.41" }], ["path", { d: "m17.66 17.66 1.41 1.41" }], ["path", { d: "M2 12h2" }], ["path", { d: "M20 12h2" }], ["path", { d: "m6.34 17.66-1.41 1.41" }], ["path", { d: "m19.07 4.93-1.41 1.41" }] ],
  moon: [ [ "path", { d: "M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" } ] ],
  maximize: [ ["path", { d: "M8 3H5a2 2 0 0 0-2 2v3" }], ["path", { d: "M21 8V5a2 2 0 0 0-2-2h-3" }], ["path", { d: "M3 16v3a2 2 0 0 0 2 2h3" }], ["path", { d: "M16 21h3a2 2 0 0 0 2-2v-3" }] ],
  minimize: [ ["path", { d: "M8 3v3a2 2 0 0 1-2 2H3" }], ["path", { d: "M21 8h-3a2 2 0 0 1-2-2V3" }], ["path", { d: "M3 16h3a2 2 0 0 1 2 2v3" }], ["path", { d: "M16 21v-3a2 2 0 0 1 2-2h3" }] ],
  link: [ ["path", { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }], ["path", { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" }] ],
  check: [["path", { d: "M20 6 9 17l-5-5" }]],
  menu: [ ["path", { d: "M4 5h16" }], ["path", { d: "M4 12h16" }], ["path", { d: "M4 19h16" }] ],
  x: [ ["path", { d: "M18 6 6 18" }], ["path", { d: "m6 6 12 12" }] ],
  chevronDown: [["path", { d: "m6 9 6 6 6-6" }]],
  chevronUp: [["path", { d: "m18 15-6-6-6 6" }]],
  // A. 整图展卷全貌: scan ⇄ focus
  scan: [ ["path", { d: "M3 7V5a2 2 0 0 1 2-2h2" }], ["path", { d: "M17 3h2a2 2 0 0 1 2 2v2" }], ["path", { d: "M21 17v2a2 2 0 0 1-2 2h-2" }], ["path", { d: "M7 21H5a2 2 0 0 1-2-2v-2" }], ["rect", { x: "7", y: "7", width: "10", height: "10", rx: "1" }] ],
  focus: [ ["circle", { cx: "12", cy: "12", r: "3" }], ["path", { d: "M5 7V5a1 1 0 0 1 1-1h2" }], ["path", { d: "M16 4h2a1 1 0 0 1 1 1v2" }], ["path", { d: "M19 16v2a1 1 0 0 1-1 1h-2" }], ["path", { d: "M8 19H6a1 1 0 0 1-1-1v-2" }] ],
  // B. 旋转: rotateCw ⇄ refreshCw
  rotateCw: [ ["path", { d: "M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" }], ["path", { d: "M21 3v5h-5" }] ],
  refreshCw: [ ["path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }], ["path", { d: "M21 3v5h-5" }], ["path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }], ["path", { d: "M8 16H3v5" }] ],
  // C. 瀑布流卡片: folder ⇄ image
  folder: [ [ "path", { d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" } ] ],
  image: [ ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2" }], ["circle", { cx: "9", cy: "9", r: "2" }], ["path", { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" }] ],
  // D. 帮助/档案说明: circleHelp ⇄ circleAlert
  circleHelp: [ ["circle", { cx: "12", cy: "12", r: "10" }], ["path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" }], ["path", { d: "M12 17h.01" }] ],
  circleAlert: [ ["circle", { cx: "12", cy: "12", r: "10" }], ["line", { x1: "12", x2: "12", y1: "8", y2: "12" }], ["line", { x1: "12", x2: "12.01", y1: "16", y2: "16" }] ],
  // E. 语言切换: globe ⇄ heroGlobe
  globe: [ ["circle", { cx: "12", cy: "12", r: "10" }], ["path", { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" }], ["path", { d: "M2 12h20" }] ],
  heroGlobe: [ ["circle", { cx: "12", cy: "12", r: "9" }], ["path", { d: "M3.6 9h16.8" }], ["path", { d: "M3.6 15h16.8" }], ["path", { d: "M12 3a15 15 0 0 1 4 9 15 15 0 0 1-4 9 15 15 0 0 1-4-9 15 15 0 0 1 4-9z" }] ],
  // F. 返回主页: house ⇄ send
  house: [ ["path", { d: "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" }], [ "path", { d: "M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" } ] ],
  send: [ [ "path", { d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" } ], ["path", { d: "m21.854 2.147-10.94 10.939" }] ],
  // G. 跨站外跳: paperclip / link ⇄ externalLink
  paperclip: [ [ "path", { d: "m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551" } ] ],
  externalLink: [ ["path", { d: "M15 3h6v6" }], ["path", { d: "M10 14 21 3" }], ["path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" }] ]
};
"""

with open(icons_def_path, 'w', encoding='utf-8') as f:
    f.write(icons_code)

print("Updated morph-icons-def.js")

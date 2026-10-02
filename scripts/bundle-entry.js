// Entry point for bundling Morphicons and required Lucide icons for standalone offline use
import { createMorph, canonicalD } from '../vendor/morphicons/dom.js';
import {
  Sun, Moon,
  Maximize, Minimize,
  Link, Check,
  Menu, X,
  ChevronDown, ChevronUp,
  Folder, Image,
  CircleHelp, CircleAlert,
  RotateCw, RefreshCw,
  Globe, Languages,
  Home, Send,
  Paperclip, ExternalLink,
  Info, Scan, Compass, Minimize2
} from '../vendor/lucide/esm/lucide.mjs';

// Custom icons for Requirement A: 整图展卷全貌 (ResetFit 全屏朝外空心 ⇄ ResetZoomed 缩放旋转朝内+实心缩小)
const ResetFit = [
  ['rect', { x: '8', y: '8', width: '8', height: '8', rx: '1.5' }],
  ['path', { d: 'M3 7V5a2 2 0 0 1 2-2h2' }],
  ['path', { d: 'M17 3h2a2 2 0 0 1 2 2v2' }],
  ['path', { d: 'M21 17v2a2 2 0 0 1-2 2h-2' }],
  ['path', { d: 'M7 21H5a2 2 0 0 1-2-2v-2' }]
];

const ResetZoomed = [
  ['path', { d: 'M10 10.5h4v1.5h-4v1.5h4' }],
  ['path', { d: 'M3 7h2a2 2 0 0 0 2-2V3' }],
  ['path', { d: 'M17 3v2a2 2 0 0 0 2 2h2' }],
  ['path', { d: 'M21 17h-2a2 2 0 0 0-2 2v2' }],
  ['path', { d: 'M7 21v-2a2 2 0 0 0-2-2H3' }]
];

const LucideIcons = {
  Sun, Moon,
  Maximize, Minimize,
  Link, Check,
  Menu, X,
  ChevronDown, ChevronUp,
  Folder, Image,
  CircleHelp, CircleAlert,
  RotateCw, RefreshCw,
  Globe, Languages,
  Home, Send,
  Paperclip, ExternalLink,
  Info, Scan, Compass, Minimize2,
  ResetFit, ResetZoomed
};

// Expose on window for direct script tag usage
if (typeof window !== 'undefined') {
  window.Morphicons = { createMorph, canonicalD };
  window.LucideIcons = LucideIcons;
}

export { createMorph, canonicalD, LucideIcons };

// The entire "no hardcoded templates" mechanism: a template is this JSON
// shape stored in SocialTemplate.definition, not a React component. Adding
// a template means writing new JSON and inserting a row — the renderer
// (render.ts) never changes. Position/size are all proportional (0–1 or a
// named scale) rather than fixed pixels specifically so one definition
// renders correctly across every aspect ratio in output-targets.ts (a
// square post and a 1920×1080 hero use the same layer list).

export type ColorToken = 'ink' | 'paper' | 'stone' | 'accentDark' | 'accentLight';
export type FontToken = 'primary' | 'secondary';
export type WeightToken = 'light' | 'regular' | 'medium';
export type TextSizeToken = 'eyebrow' | 'body' | 'heading' | 'display';
export type AnchorX = 'left' | 'center' | 'right';
export type AnchorY = 'top' | 'center' | 'bottom';
export type LogoSlot = 'light' | 'dark' | 'icon';

export interface Point {
  xPct: number; // 0–1, fraction of canvas width
  yPct: number; // 0–1, fraction of canvas height
}

export interface ImageLayer {
  type: 'image';
  source: 'sourceAsset';
  fit: 'cover' | 'contain';
}

export interface GradientOverlayLayer {
  type: 'gradient-overlay';
  direction: 'to-top' | 'to-bottom' | 'to-right' | 'to-left';
  colorToken: ColorToken;
  maxOpacity: number; // 0–1
}

export interface SolidOverlayLayer {
  type: 'solid-overlay';
  colorToken: ColorToken;
  opacity: number;
}

export interface TextLayer {
  type: 'text';
  // Reads from the `variables` map at generation time; `fallback` is
  // shown if that variable wasn't supplied (so a template never renders
  // literally blank text).
  variable: string;
  fallback?: string;
  position: Point;
  anchorX: AnchorX;
  anchorY: AnchorY;
  fontToken: FontToken;
  weightToken: WeightToken;
  sizeToken: TextSizeToken;
  colorToken: ColorToken;
  maxWidthPct: number; // 0–1, wraps text within this fraction of canvas width
  uppercase?: boolean;
  letterSpacing?: number; // px
}

export interface BadgeLayer {
  type: 'badge';
  variable: string;
  fallback?: string;
  position: Point;
  anchorX: AnchorX;
  anchorY: AnchorY;
  backgroundToken: ColorToken;
  colorToken: ColorToken;
}

export interface LogoLayer {
  type: 'logo';
  slot: LogoSlot;
  position: Point;
  anchorX: AnchorX;
  anchorY: AnchorY;
  widthPct: number; // 0–1, fraction of canvas width
}

export interface WatermarkLayer {
  type: 'watermark';
}

export type TemplateLayer =
  | ImageLayer
  | GradientOverlayLayer
  | SolidOverlayLayer
  | TextLayer
  | BadgeLayer
  | LogoLayer
  | WatermarkLayer;

export interface TemplateDefinition {
  // Declares which variables this template expects — the admin UI uses
  // this to render the right input fields for "Generate" without the
  // renderer needing to know about any specific template.
  variables: readonly string[];
  layers: readonly TemplateLayer[];
}

export type TemplateVariables = Readonly<Record<string, string>>;

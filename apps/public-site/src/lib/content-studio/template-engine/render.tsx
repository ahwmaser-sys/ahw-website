import { ImageResponse } from 'next/og';
import type {
  TemplateDefinition,
  TemplateLayer,
  TemplateVariables,
  ColorToken,
  FontToken,
  WeightToken,
  TextSizeToken,
  Point,
  AnchorX,
  AnchorY,
} from './types';
import { loadBrandFonts } from './fonts';
import type { BrandColors, BrandTypography, BrandLogos, BrandWatermark } from '../../portal/brand-kit';

export interface RenderContext {
  colors: BrandColors;
  typography: BrandTypography;
  logos: BrandLogos;
  watermark: BrandWatermark | null;
  websiteUrl: string;
  variables: TemplateVariables;
  // Data URIs, resolved by the caller (server action) before rendering —
  // the engine itself never touches storage or the database directly, it
  // only knows how to turn already-resolved images into layout.
  sourceImageDataUri: string;
  logoDataUris: Partial<Record<'light' | 'dark' | 'icon', string>>;
  watermarkDataUri: string | null;
}

function resolveColor(token: ColorToken, colors: BrandColors): string {
  return colors[token];
}

function resolveFontFamily(token: FontToken, typography: BrandTypography): string {
  return token === 'primary' ? typography.primaryFont : typography.secondaryFont;
}

function resolveWeight(token: WeightToken, typography: BrandTypography): number {
  if (token === 'light') return typography.weightLight;
  if (token === 'medium') return typography.weightMedium;
  return typography.weightRegular;
}

// Proportional to canvas height so one template definition reads
// correctly whether it's rendering a 1080×1080 square or a 1920×1080
// hero — a fixed px size would look tiny on a hero and oversized on a
// thumbnail. Roughly matches the site's own "oversized display type"
// scale (packages/design-tokens' --font-size-2xl/3xl are unusually large
// for their role, by design).
function resolveFontSize(token: TextSizeToken, canvasHeight: number): number {
  const scale: Record<TextSizeToken, number> = {
    eyebrow: 0.024,
    body: 0.032,
    heading: 0.06,
    display: 0.11,
  };
  return Math.round(canvasHeight * scale[token]);
}

function anchorToTransform(anchorX: AnchorX, anchorY: AnchorY): string {
  const x = anchorX === 'left' ? '0%' : anchorX === 'right' ? '-100%' : '-50%';
  const y = anchorY === 'top' ? '0%' : anchorY === 'bottom' ? '-100%' : '-50%';
  return `translate(${x}, ${y})`;
}

function positionStyle(position: Point, anchorX: AnchorX, anchorY: AnchorY, canvasWidth: number, canvasHeight: number) {
  return {
    position: 'absolute' as const,
    left: Math.round(position.xPct * canvasWidth),
    top: Math.round(position.yPct * canvasHeight),
    transform: anchorToTransform(anchorX, anchorY),
    display: 'flex',
  };
}

function renderLayer(
  layer: TemplateLayer,
  ctx: RenderContext,
  canvasWidth: number,
  canvasHeight: number,
  index: number
): React.ReactNode {
  switch (layer.type) {
    case 'image':
      return (
        // eslint-disable-next-line @next/next/no-img-element -- Satori JSX, not real DOM/browser rendering
        <img
          key={index}
          src={ctx.sourceImageDataUri}
          width={canvasWidth}
          height={canvasHeight}
          style={{ position: 'absolute', top: 0, left: 0, objectFit: layer.fit }}
        />
      );

    case 'gradient-overlay': {
      const color = resolveColor(layer.colorToken, ctx.colors);
      const directionMap: Record<typeof layer.direction, string> = {
        'to-top': 'to top',
        'to-bottom': 'to bottom',
        'to-left': 'to left',
        'to-right': 'to right',
      };
      return (
        <div
          key={index}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            background: `linear-gradient(${directionMap[layer.direction]}, ${color}${Math.round(layer.maxOpacity * 255).toString(16).padStart(2, '0')}, transparent)`,
          }}
        />
      );
    }

    case 'solid-overlay': {
      const color = resolveColor(layer.colorToken, ctx.colors);
      return (
        <div
          key={index}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            backgroundColor: color,
            opacity: layer.opacity,
          }}
        />
      );
    }

    case 'text': {
      const text = ctx.variables[layer.variable] ?? layer.fallback ?? '';
      if (!text) return null;
      return (
        <div
          key={index}
          style={{
            ...positionStyle(layer.position, layer.anchorX, layer.anchorY, canvasWidth, canvasHeight),
            maxWidth: Math.round(layer.maxWidthPct * canvasWidth),
            fontFamily: resolveFontFamily(layer.fontToken, ctx.typography),
            fontWeight: resolveWeight(layer.weightToken, ctx.typography),
            fontSize: resolveFontSize(layer.sizeToken, canvasHeight),
            color: resolveColor(layer.colorToken, ctx.colors),
            textTransform: layer.uppercase ? 'uppercase' : 'none',
            letterSpacing: layer.letterSpacing ?? 0,
            lineHeight: 1.15,
            whiteSpace: 'pre-wrap',
          }}
        >
          {text}
        </div>
      );
    }

    case 'badge': {
      const text = ctx.variables[layer.variable] ?? layer.fallback ?? '';
      if (!text) return null;
      return (
        <div
          key={index}
          style={{
            ...positionStyle(layer.position, layer.anchorX, layer.anchorY, canvasWidth, canvasHeight),
            padding: `${Math.round(canvasHeight * 0.012)}px ${Math.round(canvasHeight * 0.02)}px`,
            backgroundColor: resolveColor(layer.backgroundToken, ctx.colors),
            color: resolveColor(layer.colorToken, ctx.colors),
            fontFamily: resolveFontFamily('primary', ctx.typography),
            fontSize: resolveFontSize('eyebrow', canvasHeight),
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          {text}
        </div>
      );
    }

    case 'logo': {
      const src = ctx.logoDataUris[layer.slot];
      if (!src) return null;
      const width = Math.round(layer.widthPct * canvasWidth);
      return (
        <div key={index} style={positionStyle(layer.position, layer.anchorX, layer.anchorY, canvasWidth, canvasHeight)}>
          {/* eslint-disable-next-line @next/next/no-img-element -- Satori JSX, not real DOM/browser rendering */}
          <img src={src} width={width} style={{ display: 'flex' }} />
        </div>
      );
    }

    case 'watermark': {
      if (!ctx.watermarkDataUri || !ctx.watermark) return null;
      const width = Math.round(canvasWidth * 0.12);
      const positionMap: Record<string, Point> = {
        'top-left': { xPct: 0.04, yPct: 0.04 },
        'top-right': { xPct: 0.96, yPct: 0.04 },
        'bottom-left': { xPct: 0.04, yPct: 0.96 },
        'bottom-right': { xPct: 0.96, yPct: 0.96 },
        center: { xPct: 0.5, yPct: 0.5 },
      };
      const anchorXMap: Record<string, AnchorX> = { 'top-left': 'left', 'bottom-left': 'left', 'top-right': 'right', 'bottom-right': 'right', center: 'center' };
      const anchorYMap: Record<string, AnchorY> = { 'top-left': 'top', 'top-right': 'top', 'bottom-left': 'bottom', 'bottom-right': 'bottom', center: 'center' };
      const pos = positionMap[ctx.watermark.position] ?? positionMap['bottom-right'];
      return (
        <div
          key={index}
          style={{
            ...positionStyle(pos as Point, anchorXMap[ctx.watermark.position] ?? 'right', anchorYMap[ctx.watermark.position] ?? 'bottom', canvasWidth, canvasHeight),
            opacity: ctx.watermark.opacity,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- Satori JSX, not real DOM/browser rendering */}
          <img src={ctx.watermarkDataUri} width={width} style={{ display: 'flex' }} />
        </div>
      );
    }

    default:
      return null;
  }
}

export async function renderTemplateToPng(
  definition: TemplateDefinition,
  ctx: RenderContext,
  width: number,
  height: number
): Promise<Buffer> {
  const weightsNeeded = [ctx.typography.weightLight, ctx.typography.weightRegular, ctx.typography.weightMedium];
  const fonts = await loadBrandFonts(ctx.typography.primaryFont, ctx.typography.secondaryFont, weightsNeeded);

  const layerNodes = definition.layers.map((layer, index) => renderLayer(layer, ctx, width, height, index));

  const image = new ImageResponse(
    (
      <div style={{ width, height, display: 'flex', position: 'relative', backgroundColor: ctx.colors.ink }}>
        {layerNodes}
      </div>
    ),
    { width, height, fonts }
  );

  const arrayBuffer = await image.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

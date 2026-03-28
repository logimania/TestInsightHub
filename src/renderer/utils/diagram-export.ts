import * as htmlToImage from "html-to-image";

/**
 * React Flow の DOM 要素を SVG/PNG に変換するユーティリティ。
 * html-to-image ライブラリを使用。
 */

export async function toSvg(element: HTMLElement): Promise<string> {
  const viewport = getViewportElement(element);
  return htmlToImage.toSvg(viewport, {
    filter: exportFilter,
  });
}

export async function toPng(element: HTMLElement): Promise<string> {
  const viewport = getViewportElement(element);
  return htmlToImage.toPng(viewport, {
    pixelRatio: 2,
    filter: exportFilter,
  });
}

function getViewportElement(element: HTMLElement): HTMLElement {
  // Use the whole react-flow container for capture
  return element;
}

/**
 * エクスポート時にコントロールやミニマップを除外するフィルタ
 */
function exportFilter(node: HTMLElement): boolean {
  const className = node.className?.toString?.() ?? "";
  if (className.includes("react-flow__controls")) return false;
  if (className.includes("react-flow__minimap")) return false;
  return true;
}

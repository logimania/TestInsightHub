import { describe, it, expect, vi, beforeEach } from "vitest";
import { toSvg, toPng } from "../../../../src/renderer/utils/diagram-export";
import * as htmlToImage from "html-to-image";

vi.mock("html-to-image", () => ({
  toSvg: vi.fn(),
  toPng: vi.fn(),
}));

const mockedHtmlToImage = vi.mocked(htmlToImage);

function makeMockElement(className = ""): HTMLElement {
  return {
    className,
    tagName: "DIV",
  } as unknown as HTMLElement;
}

describe("diagram-export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("toSvg", () => {
    it("calls html-to-image toSvg with the element", async () => {
      const el = makeMockElement();
      mockedHtmlToImage.toSvg.mockResolvedValue("<svg></svg>");

      const result = await toSvg(el);

      expect(result).toBe("<svg></svg>");
      expect(mockedHtmlToImage.toSvg).toHaveBeenCalledWith(el, {
        filter: expect.any(Function),
      });
    });

    it("passes a filter that excludes controls", async () => {
      const el = makeMockElement();
      mockedHtmlToImage.toSvg.mockResolvedValue("<svg></svg>");

      await toSvg(el);

      const filterFn = mockedHtmlToImage.toSvg.mock.calls[0][1]!.filter!;
      expect(filterFn(makeMockElement("react-flow__controls"))).toBe(false);
      expect(filterFn(makeMockElement("react-flow__minimap"))).toBe(false);
      expect(filterFn(makeMockElement("react-flow__node"))).toBe(true);
      expect(filterFn(makeMockElement(""))).toBe(true);
    });
  });

  describe("toPng", () => {
    it("calls html-to-image toPng with pixelRatio 2", async () => {
      const el = makeMockElement();
      mockedHtmlToImage.toPng.mockResolvedValue("data:image/png;base64,abc");

      const result = await toPng(el);

      expect(result).toBe("data:image/png;base64,abc");
      expect(mockedHtmlToImage.toPng).toHaveBeenCalledWith(el, {
        pixelRatio: 2,
        filter: expect.any(Function),
      });
    });

    it("passes the same filter as toSvg", async () => {
      const el = makeMockElement();
      mockedHtmlToImage.toPng.mockResolvedValue("data:image/png;base64,abc");

      await toPng(el);

      const filterFn = mockedHtmlToImage.toPng.mock.calls[0][1]!.filter!;
      expect(filterFn(makeMockElement("react-flow__controls"))).toBe(false);
      expect(filterFn(makeMockElement("react-flow__minimap"))).toBe(false);
      expect(filterFn(makeMockElement("some-normal-class"))).toBe(true);
    });
  });
});

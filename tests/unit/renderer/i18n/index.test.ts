import { describe, it, expect } from "vitest";
import i18n from "../../../../src/renderer/i18n/index";

describe("i18n", () => {
  it("initializes with Japanese as default language", () => {
    expect(i18n.language).toBe("ja");
  });

  it("has English as fallback language", () => {
    expect(i18n.options.fallbackLng).toContain("en");
  });

  it("has ja and en resources loaded", () => {
    expect(i18n.hasResourceBundle("ja", "translation")).toBe(true);
    expect(i18n.hasResourceBundle("en", "translation")).toBe(true);
  });

  it("translates a known key in Japanese", () => {
    const translated = i18n.t("home.title");
    expect(translated).toBeDefined();
    expect(translated).not.toBe("home.title"); // Should not return the key itself
  });

  it("can switch to English", async () => {
    await i18n.changeLanguage("en");
    const translated = i18n.t("home.title");
    expect(translated).toBeDefined();
    expect(translated).not.toBe("home.title");
    // Switch back
    await i18n.changeLanguage("ja");
  });
});

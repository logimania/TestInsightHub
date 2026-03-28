import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "../../src/renderer/i18n/index";

/**
 * React Router + i18n を含むテスト用レンダーヘルパー
 */
export function renderWithProviders(
  ui: React.ReactElement,
  { route = "/" }: { route?: string } = {},
) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </I18nextProvider>,
  );
}

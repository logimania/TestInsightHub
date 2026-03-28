interface AboutDialogProps {
  readonly onClose: () => void;
}

export function AboutDialog({ onClose }: AboutDialogProps): JSX.Element {
  return (
    <div className="about-overlay" onClick={onClose}>
      <div className="about-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="about-icon">
          <svg width="48" height="48" viewBox="0 0 24 24">
            <defs>
              <linearGradient
                id="aboutGrad"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
            </defs>
            <rect
              x="2"
              y="2"
              width="20"
              height="20"
              rx="4"
              fill="url(#aboutGrad)"
            />
            <text
              x="12"
              y="16"
              textAnchor="middle"
              fill="#fff"
              fontSize="11"
              fontWeight="700"
              fontFamily="sans-serif"
            >
              TIH
            </text>
          </svg>
        </div>
        <h2 className="about-title">Test Insight Hub</h2>
        <p className="about-version">Version 0.1.0</p>
        <div className="about-details">
          <p>AI駆動開発のための独立テスト監査ツール</p>
          <p className="about-tech">Electron 34 + React 19 + TypeScript</p>
        </div>
        <div className="about-section">
          <h4>機能</h4>
          <ul>
            <li>システム構造のブロック図可視化</li>
            <li>テスト自動実行 & カバレッジ取得</li>
            <li>テスト品質分析</li>
            <li>優先度付きフィードバック生成</li>
          </ul>
        </div>
        <button className="btn btn-primary about-close" onClick={onClose}>
          閉じる
        </button>
      </div>
    </div>
  );
}

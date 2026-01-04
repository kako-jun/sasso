# TODO

## Phase 1: Validation (現在)

- [ ] Sassoで使用テスト
  - 現在のSasso実装を新パッケージで置き換え
  - 動作確認（ルーム作成、参加、状態同期、切断検出、リマッチ）
  - API の使い勝手を検証
  - 不足機能の洗い出し

## Phase 2: Stabilization

- [ ] ユニットテスト追加
  - MockBattleRoom を使ったテスト
  - NostrClient のモック
  - 状態遷移のテスト
- [ ] エラーハンドリング強化
  - リレー接続失敗時のリトライ
  - タイムアウト処理

## Phase 3: Release

- [ ] 別リポジトリに切り出し
  - `github.com/kako-jun/nostr-battle-room`
  - CI/CD設定（GitHub Actions）
  - npm publish 用の設定
- [ ] npm publish
  - パッケージ名の確認（npmで利用可能か）
  - バージョン 0.1.0 としてリリース
- [ ] ドキュメント整備
  - 使用例の追加
  - API リファレンス完備

## Phase 4: Enhancement (将来)

- [ ] 3人以上対応
- [ ] 観戦モード
- [ ] リレー選択UI
- [ ] 暗号化オプション（プライベートゲーム用）

---

## 完了済み

- [x] パッケージ構造作成
- [x] NostrClient 実装
- [x] BattleRoom 実装
- [x] useBattleRoom (React hook) 実装
- [x] MockBattleRoom 実装
- [x] README.md 作成
- [x] CLAUDE.md 作成
- [x] docs/architecture.md 作成
- [x] docs/protocol.md 作成

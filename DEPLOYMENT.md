# GitHub Pages 배포

소스 저장소: https://github.com/Gaebal2/BDKoin

- 지갑: https://gaebal2.github.io/BDKoin_Wallet/
- 게임: https://gaebal2.github.io/BDKoin_Game/ (개발 준비 중)

위 루트 경로를 사용하기 위해 `Gaebal2/gaebal2.github.io`의 main 브랜치에 정적 배포 파일을 게시합니다. 기존 `.nojekyll`, `app-ads.txt`는 유지합니다. 소스 변경만 푸시하면 사이트가 자동 갱신되지는 않습니다. 검증 후 `tools/stage-pages.cjs <Pages 저장소 로컬 경로>`를 실행하고 Pages 저장소 변경도 커밋/푸시해야 합니다.

지갑 소스는 `BDKoin_Wallet/pwa`, 게임 소스는 `BDKoin_Game`에 있습니다. 배포 스크립트는 지갑의 HTML/CSS/브라우저 JS, manifest, 이미지와 vendor만 복사합니다. 서버 코드, 개인키, 배포 기록, node_modules는 공개 사이트에 포함하지 않습니다. 지갑 manifest와 서비스 워커는 `/BDKoin_Wallet/` 아래에 한정됩니다.

검증: `npm test --prefix BDKoin_Wallet`

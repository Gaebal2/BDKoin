# GitHub Pages 배포

소스 저장소: https://github.com/Gaebal2/BDKoin

- 지갑: https://gaebal2.github.io/BDKoin/BDKoin_Wallet/
- 게임: https://gaebal2.github.io/BDKoin/BDKoin_Game/ (개발 준비 중)

소스와 배포 설정은 이 저장소에서 관리합니다. main 푸시 또는 Actions의 Deploy BDKoin Pages 수동 실행으로 자동 배포합니다. Settings → Pages → Source는 GitHub Actions입니다. 테스트 후 `node tools/stage-pages.cjs`가 `.deploy/site`에 정적 파일을 만들고 Pages artifact로 배포합니다. 생성 파일은 커밋하지 않으며 다른 저장소나 별도 인증 토큰이 필요하지 않습니다. 로컬 빌드는 비어 있는 `.deploy/site` 경로에서 실행합니다.

지갑 소스는 `BDKoin_Wallet/pwa`, 게임 소스는 `BDKoin_Game`에 있습니다. 배포 스크립트는 지갑의 HTML/CSS/브라우저 JS, manifest, 이미지와 vendor만 복사합니다. 서버 코드, 개인키, 배포 기록, node_modules는 공개 사이트에 포함하지 않습니다. 지갑 manifest와 서비스 워커는 `/BDKoin/BDKoin_Wallet/` 아래에 한정됩니다.

이전 주소에서 설치한 PWA는 새 주소에서 다시 설치합니다. 같은 HTTPS origin이므로 브라우저 지갑 저장소는 공유되지만 다른 브라우저/프로필에는 적용되지 않습니다. 기존 암호화 백업을 보관하세요. 서비스 워커 캐시는 이전 경로와 구분합니다.

검증: `npm test --prefix BDKoin_Wallet`

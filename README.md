# Handpan Transformer

MIDI 파일을 분석하여 최적의 핸드팬 스케일을 추천하는 Next.js 웹 애플리케이션입니다.

## 주요 기능

- 🎵 **MIDI 파일 분석**: 업로드한 MIDI 파일을 파싱하고 트랙을 자동으로 분류 (Melody, Rhythm, Harmony)
- 🎯 **스케일 매칭**: 알고리즘을 통해 가장 적합한 핸드팬 스케일을 추천
- 🎨 **3D 시각화**: React Three Fiber를 사용한 인터랙티브 3D 핸드팬 모델
- 🔊 **오디오 재생**: Howler.js와 Tone.js를 활용한 실시간 사운드 재생
- 📊 **데이터 분석**: 매칭 결과, 정확도, 조옮김 정보 등을 시각적으로 표시

## 기술 스택

- **Framework**: Next.js 16.0.10
- **3D 렌더링**: React Three Fiber, Three.js, @react-three/drei
- **오디오**: Tone.js, Howler.js
- **상태 관리**: Zustand
- **스타일링**: Tailwind CSS
- **언어**: TypeScript

## 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 빌드

```bash
npm run build
npm start
```

## 프로젝트 구조

```
handpan-transformer/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── dev/         # 개발 대시보드
│   │   └── page.tsx     # 메인 페이지
│   ├── components/       # React 컴포넌트
│   │   └── Digipan3D/   # 3D 핸드팬 컴포넌트
│   ├── hooks/           # Custom React Hooks
│   ├── lib/             # 유틸리티 함수
│   ├── store/           # Zustand 상태 관리
│   ├── constants/       # 상수 및 설정
│   └── data/            # 데이터 파일
└── public/              # 정적 파일
    ├── sounds/          # 핸드팬 사운드 파일
    └── images/         # 이미지 리소스
```

## 배포

이 프로젝트는 Vercel에 배포할 수 있습니다.

### Vercel CLI를 사용한 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel
```

### GitHub 연동 배포

1. GitHub에 리포지토리 생성
2. Vercel 대시보드에서 프로젝트 import
3. 자동 배포 설정 완료

## 라이선스

MIT

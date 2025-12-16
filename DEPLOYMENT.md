# 배포 가이드

## 1. GitHub 리포지토리 생성

### 방법 1: GitHub 웹사이트에서 생성

1. [GitHub](https://github.com)에 로그인
2. 우측 상단의 `+` 버튼 클릭 → "New repository" 선택
3. 리포지토리 이름 입력 (예: `handpan-transformer`)
4. Public 또는 Private 선택
5. "Create repository" 클릭

### 방법 2: GitHub CLI 사용 (선택사항)

```bash
# GitHub CLI 설치 (미설치 시)
brew install gh

# GitHub 로그인
gh auth login

# 리포지토리 생성
gh repo create handpan-transformer --public --source=. --remote=origin --push
```

## 2. 로컬 Git 리포지토리를 GitHub에 연결

```bash
cd /Users/equus/Documents/Mindforge/20_Projects/handpan-transformer

# GitHub에서 생성한 리포지토리 URL로 변경하세요
git remote add origin https://github.com/YOUR_USERNAME/handpan-transformer.git

# 기본 브랜치를 main으로 변경 (선택사항)
git branch -M main

# 코드 푸시
git push -u origin main
```

## 3. Vercel 배포

### 방법 1: Vercel CLI를 사용한 배포

```bash
# Vercel 로그인 (처음 한 번만)
vercel login

# 프로젝트 배포
vercel

# 프로덕션 배포
vercel --prod
```

### 방법 2: Vercel 웹 대시보드 사용 (권장)

1. [Vercel](https://vercel.com)에 로그인
2. "Add New..." → "Project" 클릭
3. GitHub 리포지토리 선택 또는 import
4. 프로젝트 설정 확인:
   - Framework Preset: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. "Deploy" 클릭

## 4. 환경 변수 설정 (필요한 경우)

Vercel 대시보드에서:
1. 프로젝트 → Settings → Environment Variables
2. 필요한 환경 변수 추가

## 5. 자동 배포 설정

GitHub과 Vercel을 연결하면:
- `main` 브랜치에 푸시할 때마다 자동 배포
- Pull Request 생성 시 Preview 배포

## 배포 확인

배포가 완료되면 Vercel에서 제공하는 URL로 접속할 수 있습니다:
- 예: `https://handpan-transformer.vercel.app`

## 문제 해결

### 빌드 오류 발생 시

```bash
# 로컬에서 빌드 테스트
npm run build

# 오류 확인 및 수정 후 재배포
```

### 환경 변수 오류

Vercel 대시보드에서 환경 변수가 올바르게 설정되었는지 확인하세요.


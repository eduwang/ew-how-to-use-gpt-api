# ChatGPT API 활용 가이드

ChatGPT API를 활용한 다양한 기능을 제공하는 웹 애플리케이션입니다.

## 📋 프로젝트 개요

이 프로젝트는 OpenAI의 ChatGPT API를 활용하여 교육 및 업무에 유용한 다양한 기능을 제공합니다:
- **챗봇**: 기본적인 대화형 AI 챗봇
- **루브릭 기반 글 피드백**: 논리적 흐름을 평가하는 글 피드백 시스템
- **PDF 파일 요약기**: PDF 문서를 업로드하여 자동 요약
- **퀴즈 생성**: 텍스트 또는 PDF 파일로부터 학습용 퀴즈 생성
- **표 데이터 설명**: 표 데이터를 입력하여 AI가 분석 및 해석 제공

## 🚀 시작하기

### 필수 요구사항

- Node.js (v16 이상)
- npm 또는 yarn
- OpenAI API Key

### 설치

```bash
# 저장소 클론
git clone <repository-url>
cd ew-how-to-use-gpt-api

# 의존성 설치
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

개발 서버가 실행되면 브라우저에서 `http://localhost:5173`으로 접속할 수 있습니다.

### 빌드

```bash
npm run build
```

빌드된 파일은 `dist` 폴더에 생성됩니다.

### 미리보기

```bash
npm run preview
```

## 📁 프로젝트 구조

```
ew-how-to-use-gpt-api/
├── public/                 # 정적 파일
│   ├── pdf.worker.min.mjs  # PDF.js 워커 파일
│   ├── sample-data-table-feedback.csv  # 예시 데이터
│   └── vite.svg           # 파비콘
├── src/                    # 소스 코드
│   ├── main.js            # 메인 애플리케이션 로직
│   └── style.css          # 스타일시트
├── index.html             # HTML 진입점
├── vite.config.js         # Vite 설정
├── netlify.toml           # Netlify 배포 설정
└── package.json           # 프로젝트 의존성
```

## 🛠️ 주요 기능

### 1. 챗봇
- 실시간 대화형 AI 챗봇
- API 설정 (모델, 프롬프트, temperature, max_tokens, top_p)
- 대화 기록 유지

### 2. 루브릭 기반 글 피드백
- 논리적 흐름 평가 루브릭
- 5가지 평가 항목 (주제 명확성, 구조 체계성, 논리적 전개, 문장 일관성, 전체적 완성도)
- 예시 글 불러오기 기능

### 3. PDF 파일 요약기
- PDF 파일 업로드 (드래그 앤 드롭 지원)
- PDF 텍스트 자동 추출
- AI 기반 문서 요약

### 4. 퀴즈 생성
- 텍스트 직접 입력 또는 PDF 파일 업로드
- 객관식/주관식 퀴즈 자동 생성
- 문제, 정답, 상세 해설 포함
- 예시 글 불러오기 기능

### 5. 표 데이터 설명
- Handsontable을 활용한 표 편집
- CSV 파일 불러오기
- 표 데이터 분석 및 해석 생성
- 예시 데이터 불러오기 기능

## ⚙️ API 설정

각 기능마다 개별 API 설정이 가능합니다:

- **Model**: GPT-3.5-turbo, GPT-4.1, GPT-5 mini, GPT-5.1
- **System Prompt**: AI의 역할과 행동 방식 정의
- **Temperature**: 응답의 창의성 조절 (0.0 ~ 2.0)
- **Max Tokens**: 응답의 최대 길이 제한
- **Top P**: Nucleus 샘플링 파라미터 (0.0 ~ 1.0)

설정은 로컬 스토리지에 자동 저장되어 다음 방문 시에도 유지됩니다.

## 🎨 디자인

- 모노톤 세련된 디자인
- 다크/라이트 모드 자동 대응
- 반응형 디자인 (모바일 지원)
- 부드러운 애니메이션 및 전환 효과

## 📦 사용된 기술

- **Vite**: 빌드 도구
- **Handsontable**: 표 편집 라이브러리
- **PDF.js**: PDF 텍스트 추출
- **SweetAlert2**: 알림 및 모달
- **OpenAI API**: ChatGPT API

## 🌐 배포

### Netlify 배포

이 프로젝트는 Netlify 배포를 위해 설정되어 있습니다.

1. GitHub에 코드 푸시
2. Netlify에서 새 사이트 추가
3. GitHub 저장소 연결
4. 빌드 설정은 `netlify.toml`에서 자동으로 읽힘

## ⚠️ 주의사항

**아래의 내용은 예시를 제시하기 위해 제작된 내용이고, 검증된 내용은 아니라는 점을 명시합니다.**

- API Key는 브라우저의 로컬 스토리지에 저장되며, 서버로 전송되지 않습니다.
- OpenAI API 사용 시 비용이 발생할 수 있습니다.
- GPT-5 모델은 실제 OpenAI API에서 제공되지 않을 수 있습니다.

## 📝 라이선스

이 프로젝트는 개인 사용 및 학습 목적으로 제작되었습니다.

## 👤 제작자

Made by Hyowon Wang


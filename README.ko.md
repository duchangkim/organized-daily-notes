# [지원 중단] Organized Daily Notes

> **알림:** 이 플러그인은 현재 지원이 중단되었습니다. Obsidian의 기본 데일리 노트 플러그인은 이미 형식 문자열을 통한 폴더 구성을 지원하고 있습니다. 대신 기본 플러그인을 사용해 주세요.

_다른 언어로 읽기: [English](README.md)_

## 지원 중단 이유

추가 조사 결과, Obsidian의 기본 데일리 노트 플러그인은 이미 형식 문자열을 통해 폴더 구성을 지원하고 있음을 발견했습니다. 다음과 같은 형식 문자열을 사용하여 동일한 기능을 구현할 수 있습니다:

- `YYYY/MM/DD` - 연도/월 구조
- `YYYY/MM/W/DD` - 연도/월/주 구조

이는 이 플러그인의 핵심 기능이 Obsidian에서 이미 제공하는 기능과 중복된다는 것을 의미합니다.

## 마이그레이션 가이드

1. 이 플러그인을 비활성화하고 제거하세요
2. Obsidian 설정 → 핵심 플러그인 → 데일리 노트로 이동하세요
3. "날짜 형식" 필드에 다음과 같은 패턴을 사용하세요:
   - `YYYY/MM/DD` - 자동으로 연도/월 폴더 생성
   - `YYYY/MM/W/DD` - 자동으로 연도/월/주 폴더 생성
4. 이제 데일리 노트가 Obsidian의 내장 기능을 사용하여 구성됩니다

## 보관 알림

이 저장소는 참조를 위해 계속 사용할 수 있지만 더 이상 적극적으로 유지 관리되지 않습니다.

이 플러그인을 사용하고 지원해 주신 모든 분들께 감사드립니다!

---

## 원본 설명

데일리 노트를 자동으로 구조화된 폴더에 정리하여 더 나은 구성과 쉬운 탐색을 제공합니다.

## 기능

- **자동 구성**: 생성 날짜를 기준으로 데일리 노트를 적절한 폴더로 자동 이동
- **유연한 구조**: 연도, 연도/월, 연도/월/주 중 원하는 폴더 구조 선택 가능
- **사용자 정의 형식**: Moment.js 패턴을 사용하여 연도, 월, 주 폴더 이름 형식 지정 가능
- **코어 통합**: Obsidian의 기본 데일리 노트 플러그인과 완벽하게 연동

## 사용법

1. Obsidian의 커뮤니티 플러그인에서 플러그인 설치
2. 설정 → 커뮤니티 플러그인에서 플러그인 활성화
3. 플러그인 설정에서 원하는 폴더 구조 선택:
   - 연도만 (YYYY)
   - 연도/월 (YYYY/MM)
   - 연도/월/주 (YYYY/MM/Week-N)

## 설정

플러그인은 폴더 구조를 사용자 정의할 수 있는 여러 설정을 제공합니다:

- **폴더 구조**: 데일리 노트 구성 방식 선택
- **연도 형식**: 연도 폴더 형식 지정 (예: YYYY, YY)
- **월 형식**: 월 폴더 형식 지정 (예: MM, MMMM)
- **주 형식**: 주 폴더 형식 지정 (예: W, WW)

## 설치

1. Obsidian 설정 열기
2. 커뮤니티 플러그인으로 이동하여 안전 모드 비활성화
3. 찾아보기를 클릭하고 "Organized Daily Notes" 검색
4. 플러그인 설치 및 활성화

## 지원

문제가 발생하거나 제안사항이 있으시다면 GitHub에서 [이슈를 생성](https://github.com/duchangkim/organized-daily-notes/issues)해 주세요.

## 라이센스

이 프로젝트는 MIT 라이센스를 따릅니다 - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

import { PageFrame, PageFrameProps } from "./types"
import HeaderConstructor from "../Header"

const Header = HeaderConstructor()

/**
 * The default page frame — three-column layout with left sidebar, center
 * content (header + body + afterBody), and right sidebar, followed by a footer.
 *
 * This is the original Quartz layout, extracted from renderPage.tsx.
 */
export const DefaultFrame: PageFrame = {
  name: "default",
  render({
    componentData,
    header,
    beforeBody,
    pageBody: Content,
    afterBody,
    left,
    right,
    footer: Footer,
  }: PageFrameProps) {
    // 왼쪽 사이드바 제거(2026-07-05) — left 컴포넌트(검색·다크모드 등)는 renderPage.tsx가 상단바에 렌더한다
    void left
    return (
      <>
        <div class="center">
          <div class="page-header">
            <Header {...componentData}>
              {header.map((HeaderComponent) => (
                <HeaderComponent {...componentData} />
              ))}
            </Header>
            <div class="popover-hint">
              {beforeBody.map((BodyComponent) => (
                <BodyComponent {...componentData} />
              ))}
            </div>
          </div>
          <Content {...componentData} />
          <hr />
          <div class="page-footer">
            {afterBody.map((BodyComponent) => (
              <BodyComponent {...componentData} />
            ))}
          </div>
        </div>
        <div class="right sidebar">
          {/* 프로필 카드 (2026-07-05) — 데스크톱 우측 상단 고정 노출, 모바일은 CSS로 숨김 */}
          <div class="profile-card">
            <div class="profile-avatar" aria-hidden="true">솔</div>
            <div class="profile-meta">
              <div class="profile-name">김민솔</div>
              <div class="profile-links">
                <a href="https://github.com/asle149">GitHub</a>
              </div>
            </div>
          </div>
          {right.map((BodyComponent) => (
            <BodyComponent {...componentData} />
          ))}
        </div>
        <Footer {...componentData} />
      </>
    )
  },
}

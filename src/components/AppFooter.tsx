// ─── App Footer ───────────────────────────────────────────────────────────
// 시뮬레이터와 학습서 두 화면이 함께 쓰는 맨 아래 한 줄: 만든 사람 · GitHub 주소.

import { IconBrandGithub } from '@tabler/icons-react'

const AUTHOR = 'Woongbee Park'
const GITHUB_URL = 'https://github.com/woongbeee'

export function AppFooter() {
  return (
    <footer className="z-20 flex h-7 shrink-0 items-center gap-2 border-t border-line bg-paper px-4 font-mono text-[10px] text-ink-3">
      <span>
        © {__BUILD_DATE__.slice(0, 4)} <span className="font-medium text-ink-2">{AUTHOR}</span>
      </span>
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="ml-auto flex items-center gap-1 text-ink-2 transition-colors hover:text-ink hover:underline"
      >
        <IconBrandGithub size={12} stroke={1.5} />
        {GITHUB_URL.replace('https://', '')}
      </a>
    </footer>
  )
}

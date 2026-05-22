import { useEffect } from 'react'
import { BookLayout } from '@/book/BookLayout'
import { InternalsSimulatorSection } from '@/book/chapters/internals/shared/SimulatorSection'

export function App() {
  const isSimulatorWindow = window.location.hash === '#simulator'

  useEffect(() => {
    if (isSimulatorWindow) {
      document.title = 'Internals Simulator — Oracle DB'
    }
  }, [isSimulatorWindow])

  if (isSimulatorWindow) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-background text-foreground">
        <InternalsSimulatorSection />
      </div>
    )
  }

  return <BookLayout />
}

export default App

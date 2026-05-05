const queue: string[][] = []
let isPlaying = false

function playSequential(urls: string[], onDone: () => void): void {
  if (urls.length === 0) { onDone(); return }
  const [first, ...rest] = urls
  const audio = new Audio(first)
  audio.onended = () => playSequential(rest, onDone)
  audio.onerror = () => playSequential(rest, onDone)
  audio.play().catch(() => playSequential(rest, onDone))
}

function processQueue(): void {
  if (isPlaying || queue.length === 0) return
  isPlaying = true
  const urls = queue.shift()!
  playSequential(urls, () => {
    isPlaying = false
    processQueue()
  })
}

export function playAnnouncement(ticketNumber: number, partySize: number): void {
  const urls: string[] = []

  const wasEmpty = !isPlaying && queue.length === 0
  if (wasEmpty) {
    urls.push('/issue.mp3')
  }

  if (ticketNumber >= 1 && ticketNumber <= 999) {
    urls.push(`/audio/x番でお待ちの/${ticketNumber}番でお待ちの.wav`)
  }

  if (partySize >= 1 && partySize <= 10) {
    urls.push(`/audio/y名様/${partySize}名様.wav`)
  }

  if (partySize >= 11) {
    urls.push(`/audio/y名様/お客様.wav`)
  }

  urls.push('/audio/受付までお越しください.wav')

  queue.push(urls)
  processQueue()
}

type AudioItem = { url: string; volume: number }

const queue: AudioItem[][] = []
let isPlaying = false

function playSequential(items: AudioItem[], onDone: () => void): void {
  if (items.length === 0) { onDone(); return }
  const [first, ...rest] = items
  const audio = new Audio(first.url)
  audio.volume = first.volume
  audio.onended = () => playSequential(rest, onDone)
  audio.onerror = () => playSequential(rest, onDone)
  audio.play().catch(() => playSequential(rest, onDone))
}

function processQueue(): void {
  if (isPlaying || queue.length === 0) return
  isPlaying = true
  const items = queue.shift()!
  playSequential(items, () => {
    isPlaying = false
    processQueue()
  })
}

const SE_VOLUME = 0.3
const ANNOUNCE_VOLUME = 1.0

export function playAnnouncement(ticketNumber: number, partySize: number, announcementEnabled = true): void {
  const items: AudioItem[] = []

  const wasEmpty = !isPlaying && queue.length === 0
  if (wasEmpty) {
    items.push({ url: '/issue.mp3', volume: SE_VOLUME })
  }

  if (announcementEnabled) {
    if (ticketNumber >= 1 && ticketNumber <= 999) {
      items.push({ url: `/audio/x番でお待ちの/${ticketNumber}番でお待ちの.wav`, volume: ANNOUNCE_VOLUME })
    }

    if (partySize >= 1 && partySize <= 10) {
      items.push({ url: `/audio/y名様/${partySize}名様.wav`, volume: ANNOUNCE_VOLUME })
    }

    if (partySize >= 11) {
      items.push({ url: `/audio/y名様/お客様.wav`, volume: ANNOUNCE_VOLUME })
    }

    items.push({ url: '/audio/受付までお越しください.wav', volume: ANNOUNCE_VOLUME })
  }

  queue.push(items)
  processQueue()
}

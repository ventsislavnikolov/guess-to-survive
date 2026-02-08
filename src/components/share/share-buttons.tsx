import { Copy, Facebook, MessageCircle, Share2, Twitter } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

type ShareButtonsProps = {
  text?: string
  title: string
  url: string
}

function openPopup(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

export function ShareButtons({ text, title, url }: ShareButtonsProps) {
  const shareText = text ?? title

  const handleNativeShare = async () => {
    const nav = navigator as Navigator & { share?: (data: { title?: string; text?: string; url?: string }) => Promise<void> }
    if (!nav.share) {
      return false
    }

    try {
      await nav.share({ text: shareText, title, url })
      return true
    } catch {
      return true
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied.')
    } catch {
      toast.error('Unable to copy link.')
    }
  }

  const handleShare = async () => {
    const usedNative = await handleNativeShare()
    if (usedNative) {
      return
    }

    await handleCopy()
  }

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(
    url,
  )}`
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${url}`)}`

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={() => void handleShare()} size="sm" variant="secondary">
        <Share2 className="mr-2 h-4 w-4" />
        Share
      </Button>
      <Button onClick={() => openPopup(twitterUrl)} size="sm" variant="outline">
        <Twitter className="mr-2 h-4 w-4" />
        Twitter
      </Button>
      <Button onClick={() => openPopup(facebookUrl)} size="sm" variant="outline">
        <Facebook className="mr-2 h-4 w-4" />
        Facebook
      </Button>
      <Button onClick={() => openPopup(whatsappUrl)} size="sm" variant="outline">
        <MessageCircle className="mr-2 h-4 w-4" />
        WhatsApp
      </Button>
      <Button onClick={() => void handleCopy()} size="sm" variant="outline">
        <Copy className="mr-2 h-4 w-4" />
        Copy link
      </Button>
    </div>
  )
}


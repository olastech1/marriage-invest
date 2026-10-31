'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { CreditCard, ImagePlus, Lock, MessageCircle, MessageSquare, MoreHorizontal, Pin, PinOff, Share2, SmilePlus, Trash2, Wallet, X } from 'lucide-react'
import VerifiedTick from '@/components/VerifiedTick'
import { uploadChatMedia } from '@/components/investor/ChatMedia'

type Post = {
  id: string
  caption: string
  mediaKind: 'image' | 'video' | null
  width: number | null
  height: number | null
  mediaUrl: string | null
  preview: string | null
  price: number | null
  locked: boolean
  unlocked: boolean
  pinned: boolean
  createdAt: string
  stats?: { unlocks: number; earned: number }
  reactions: Record<string, number>
  myReaction: string | null
  comments: number
}

type Author = { id: string; name: string }
type Comment = {
  id: string
  text: string
  createdAt: string
  author: { id: string; name: string; avatarUrl: string | null; verified: boolean; profile: string | null }
  canDelete: boolean
  replies?: Comment[]
}

const REACTIONS = ['❤️', '👍', '😂', '😮', '🔥']

const usd = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
const when = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: new Date(d).getFullYear() === new Date().getFullYear() ? undefined : 'numeric' })

/** Posts on a member's profile: the owner posts and pins; locked posts open once paid for */
export default function ProfilePosts({
  userId,
  slug,
  ownerView,
  onCount,
}: {
  userId: string
  slug: string
  ownerView: boolean
  /** How many posts there are (the profile header shows it) */
  onCount?: (n: number) => void
}) {
  const [posts, setPosts] = useState<Post[] | null>(null)
  const [mine, setMine] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const [author, setAuthor] = useState<Author>({ id: userId, name: '' })
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null)

  const load = useCallback(
    () =>
      fetch(`/api/posts?userId=${encodeURIComponent(userId)}`)
        .then((r) => r.json())
        .catch(() => null)
        .then((data) => {
          if (!data?.success) return setPosts((p) => p || [])
          setPosts(data.posts)
          onCount?.(data.posts.length)
          setMine(data.mine)
          setSignedIn(data.signedIn)
          setAuthor(data.author)
        }),
    [userId, onCount],
  )

  useEffect(() => {
    fetch(`/api/posts?userId=${encodeURIComponent(userId)}`)
      .then((r) => r.json())
      .catch(() => null)
      .then((data) => {
        if (!data?.success) {
          onCount?.(0)
          return setPosts([])
        }
        setPosts(data.posts)
        onCount?.(data.posts.length)
        setMine(data.mine)
        setSignedIn(data.signedIn)
        setAuthor(data.author)
      })
  }, [userId, onCount])

  // Back from paying: go to that post
  const scrolled = useRef(false)
  useEffect(() => {
    if (!posts || scrolled.current || !window.location.hash.startsWith('#post-')) return
    scrolled.current = true
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [posts])

  const owner = mine && ownerView
  if (!posts) return <div className="h-24 rounded-3xl bg-white/5 border border-white/10 animate-pulse" />
  if (!posts.length && !owner) return null

  return (
    <div className="space-y-3">
      {owner && <Composer onPosted={load} />}
      {note && <p className={`text-xs ${note.ok ? 'text-emerald-300' : 'text-rose-300'}`}>{note.text}</p>}
      {posts.length === 0 && <p className="text-xs text-gray-400">No posts yet. Share a photo, a video or an update.</p>}
      {posts.map((p) => (
        <PostCard key={p.id} post={p} owner={owner} mine={mine} author={author} signedIn={signedIn} slug={slug} onChange={load} onNote={setNote} />
      ))}
    </div>
  )
}

function Composer({ onPosted }: { onPosted: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileUrl, setFileUrl] = useState('')
  const [lock, setLock] = useState(false)
  const [price, setPrice] = useState('5')
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState('')

  const pick = (f: File | null) => {
    if (fileUrl) URL.revokeObjectURL(fileUrl)
    setFile(f)
    setFileUrl(f ? URL.createObjectURL(f) : '')
    if (!f) setLock(false)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setProgress(0)
    try {
      const media = file ? await uploadChatMedia(file, { forPost: true }, setProgress) : null
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption, mediaId: media?.mediaId, price: lock ? parseFloat(price) : null, preview: media?.preview }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Could not post. Try again.')
      setCaption('')
      pick(null)
      onPosted()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setProgress(null)
    }
  }

  const busy = progress !== null
  return (
    <form onSubmit={submit} className="rounded-3xl bg-white/5 border border-white/10 p-4 space-y-3">
      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        maxLength={2000}
        rows={2}
        placeholder="Share an update…"
        className="w-full bg-transparent text-base sm:text-sm text-white placeholder:text-gray-500 resize-none focus:outline-none"
      />
      {file && (
        <div className="relative rounded-2xl overflow-hidden bg-black/40 max-h-64 flex justify-center">
          {file.type.startsWith('video/') ? (
            <video src={fileUrl} muted playsInline className="max-h-64" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fileUrl} alt="Selected" className="max-h-64 object-contain" />
          )}
          <button type="button" onClick={() => pick(null)} disabled={busy} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white" aria-label="Remove">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {file && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={lock} onChange={(e) => setLock(e.target.checked)} className="accent-[#C9A84C]" />
            <Lock className="w-3.5 h-3.5 text-[#C9A84C]" /> Pay to unlock
          </label>
          {lock && (
            <label className="flex items-center gap-1.5">
              Price $
              <input
                type="number"
                min="1"
                max="500"
                step="0.01"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-20 px-2 py-1 rounded-lg bg-white/10 border border-white/20 text-white text-base sm:text-xs"
              />
            </label>
          )}
          {lock && <span className="basis-full text-[11px] text-gray-400">Everyone sees your caption. The photo or video opens once someone pays. The money goes to your wallet.</span>}
        </div>
      )}
      {error && <p className="text-xs text-rose-300">{error}</p>}
      <div className="flex items-center justify-between gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => {
            pick(e.target.files?.[0] || null)
            e.target.value = ''
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <ImagePlus className="w-4 h-4" /> Photo / video
        </button>
        <button
          type="submit"
          disabled={busy || (!caption.trim() && !file) || (lock && !(parseFloat(price) >= 1))}
          className="px-4 py-2 rounded-xl bg-[#C9A84C] hover:bg-[#d4b460] text-[#0F1C3F] text-xs font-bold cursor-pointer disabled:opacity-50"
        >
          {busy ? `Posting… ${Math.round((progress || 0) * 100)}%` : 'Post'}
        </button>
      </div>
    </form>
  )
}

function PostCard({
  post,
  owner,
  mine,
  author,
  signedIn,
  slug,
  onChange,
  onNote,
}: {
  post: Post
  owner: boolean
  /** I wrote it (even when previewing as a visitor) */
  mine: boolean
  author: Author
  signedIn: boolean
  slug: string
  onChange: () => void
  onNote: (n: { ok: boolean; text: string } | null) => void
}) {
  const [menu, setMenu] = useState(false)
  const [zoom, setZoom] = useState(false)
  const [paying, setPaying] = useState(false)
  const [cash, setCash] = useState<number | null>(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const ratio = post.width && post.height ? `${post.width} / ${post.height}` : post.mediaKind === 'video' ? '16 / 9' : '4 / 3'

  const act = async (action: 'pin' | 'unpin' | 'delete') => {
    if (action === 'delete' && !window.confirm(post.price ? 'Delete this post? People who paid for it will no longer see it.' : 'Delete this post?')) return
    setMenu(false)
    onNote(null)
    const res = await fetch(`/api/posts/${post.id}`, {
      method: action === 'delete' ? 'DELETE' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: action === 'delete' ? undefined : JSON.stringify({ action }),
    })
    const data = await res.json().catch(() => ({}))
    if (!data.success) onNote({ ok: false, text: data.error || 'Something went wrong.' })
    onChange()
  }

  const openPay = async () => {
    setError('')
    setPaying(true)
    const data = await fetch('/api/wallet')
      .then((r) => r.json())
      .catch(() => null)
    setCash(data?.success ? data.cash : 0)
  }

  const unlock = async (source: 'card' | 'wallet') => {
    setBusy(source)
    setError('')
    try {
      const res = await fetch(`/api/posts/${post.id}/unlock`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source }) })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Could not unlock. Try again.')
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return
      }
      setPaying(false)
      onChange()
    } catch (err) {
      setError((err as Error).message)
    }
    setBusy('')
  }

  return (
    <article id={`post-${post.id}`} className="rounded-3xl bg-white/5 border border-white/10 overflow-hidden scroll-mt-20">
      <div className="px-4 pt-3 flex items-center justify-between gap-2 text-[11px] text-gray-400">
        <span className="flex items-center gap-2">
          {post.pinned && (
            <span className="flex items-center gap-1 text-[#C9A84C] font-bold">
              <Pin className="w-3 h-3" /> Pinned
            </span>
          )}
          {when(post.createdAt)}
          {post.price && (owner || post.unlocked) && (
            <span className="flex items-center gap-1">
              · <Lock className="w-3 h-3" /> {usd(post.price)}
            </span>
          )}
        </span>
        {owner && (
          <div className="relative">
            <button type="button" onClick={() => setMenu(!menu)} className="p-1 rounded-lg hover:bg-white/10 text-gray-300 cursor-pointer" aria-label="Post options">
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {menu && (
              <div className="absolute right-0 mt-1 z-20 w-40 rounded-xl bg-white text-[#0F1C3F] shadow-xl overflow-hidden text-xs font-semibold">
                <button type="button" onClick={() => act(post.pinned ? 'unpin' : 'pin')} className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-gray-50 cursor-pointer">
                  {post.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />} {post.pinned ? 'Unpin' : 'Pin to top'}
                </button>
                <button type="button" onClick={() => act('delete')} className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-rose-50 text-rose-700 cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {post.caption && <p className="px-4 pt-2 text-sm text-gray-100 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{post.caption}</p>}

      {post.mediaKind && (
        <div className="mt-3 relative bg-black/40 max-h-[520px] overflow-hidden" style={{ aspectRatio: ratio }}>
          {post.locked ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
              {post.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.preview} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-80" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#1a2f64] to-[#0F1C3F]" />
              )}
              <div className="relative w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <p className="relative text-xs font-semibold text-white drop-shadow">{post.mediaKind === 'video' ? 'Locked video' : 'Locked photo'}</p>
              {!paying ? (
                signedIn ? (
                  <button type="button" onClick={openPay} className="relative px-4 py-2 rounded-xl bg-[#C9A84C] hover:bg-[#d4b460] text-[#0F1C3F] text-xs font-bold cursor-pointer">
                    Unlock for {usd(post.price || 0)}
                  </button>
                ) : (
                  <Link
                    href={`/login?callbackUrl=${encodeURIComponent(`/u/${slug}#post-${post.id}`)}`}
                    className="relative px-4 py-2 rounded-xl bg-[#C9A84C] text-[#0F1C3F] text-xs font-bold"
                  >
                    Sign in to unlock for {usd(post.price || 0)}
                  </Link>
                )
              ) : (
                <div className="relative w-full max-w-[260px] rounded-2xl bg-white text-[#0F1C3F] p-3 space-y-2 text-left shadow-xl">
                  <p className="text-xs font-bold">Unlock for {usd(post.price || 0)}</p>
                  <button
                    type="button"
                    onClick={() => unlock('card')}
                    disabled={!!busy}
                    className="w-full py-2 rounded-xl bg-[#0F1C3F] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CreditCard className="w-3.5 h-3.5" /> {busy === 'card' ? 'Opening…' : 'Pay by card'}
                  </button>
                  {cash !== null && cash >= (post.price || 0) && (
                    <button
                      type="button"
                      onClick={() => unlock('wallet')}
                      disabled={!!busy}
                      className="w-full py-2 rounded-xl border border-[#0F1C3F] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Wallet className="w-3.5 h-3.5" /> {busy === 'wallet' ? 'Unlocking…' : `Wallet cash (${usd(cash)})`}
                    </button>
                  )}
                  {error && <p className="text-[11px] text-rose-700">{error}</p>}
                  <button type="button" onClick={() => setPaying(false)} className="w-full text-[11px] text-gray-500 cursor-pointer">
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ) : post.mediaKind === 'video' ? (
            <video src={`${post.mediaUrl}#t=0.1`} controls controlsList="nodownload noremoteplayback" disablePictureInPicture playsInline preload="metadata" className="w-full h-full object-contain bg-black" />
          ) : (
            <button type="button" onClick={() => setZoom(true)} className="w-full h-full cursor-zoom-in" aria-label="Open photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.mediaUrl || ''} alt={post.caption || 'Photo'} loading="lazy" decoding="async" className="w-full h-full object-cover" />
            </button>
          )}
        </div>
      )}

      {owner && post.price ? (
        <p className="px-4 py-2 text-[11px] text-gray-400 border-t border-white/10">
          Unlocked by {post.stats?.unlocks || 0} {post.stats?.unlocks === 1 ? 'person' : 'people'} · {usd(post.stats?.earned || 0)} earned
        </p>
      ) : null}

      <PostActions post={post} mine={mine} author={author} signedIn={signedIn} slug={slug} onChange={onChange} />

      {zoom && post.mediaUrl && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4" onClick={() => setZoom(false)} role="dialog" aria-label="Photo">
          <button type="button" onClick={() => setZoom(false)} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.mediaUrl} alt={post.caption || 'Photo'} className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </article>
  )
}

/** Reactions, comments with replies, message the author, share */
function PostActions({ post, mine, author, signedIn, slug, onChange }: { post: Post; mine: boolean; author: Author; signedIn: boolean; slug: string; onChange: () => void }) {
  const [picker, setPicker] = useState(false)
  const [open, setOpen] = useState(false)
  const [comments, setComments] = useState<Comment[] | null>(null)
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState<Comment | null>(null)
  const [sending, setSending] = useState(false)
  const [note, setNote] = useState('')
  const here = `/u/${slug}#post-${post.id}`
  const login = `/login?callbackUrl=${encodeURIComponent(here)}`
  const chat = `/chat?recipientId=${encodeURIComponent(author.id)}&name=${encodeURIComponent(author.name)}`
  const total = Object.values(post.reactions).reduce((a, b) => a + b, 0)

  const loadComments = () =>
    fetch(`/api/posts/${post.id}/comments`)
      .then((r) => r.json())
      .then((d) => d.success && setComments(d.comments))
      .catch(() => {})

  const react = async (emoji: string) => {
    setPicker(false)
    await fetch(`/api/posts/${post.id}/react`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ emoji }) }).catch(() => {})
    onChange()
  }

  const toggleComments = () => {
    if (!open && !comments) loadComments()
    setOpen(!open)
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    setSending(true)
    setNote('')
    const res = await fetch(`/api/posts/${post.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, parentId: replyTo?.id }),
    })
    const d = await res.json().catch(() => ({}))
    setSending(false)
    if (!d.success) return setNote(d.error || 'Could not post your comment.')
    setText('')
    setReplyTo(null)
    await loadComments()
    onChange()
  }

  const remove = async (c: Comment) => {
    if (!window.confirm(c.replies?.length ? 'Delete this comment and its replies?' : 'Delete this comment?')) return
    await fetch(`/api/posts/${post.id}/comments?commentId=${c.id}`, { method: 'DELETE' }).catch(() => {})
    await loadComments()
    onChange()
  }

  const share = async () => {
    const url = `${window.location.origin}${here}`
    const title = `${author.name} on Union Verify`
    if (navigator.share) {
      await navigator.share({ title, text: post.caption.slice(0, 120) || title, url }).catch(() => {})
      return
    }
    await navigator.clipboard.writeText(url).catch(() => {})
    setNote('Link copied.')
    setTimeout(() => setNote(''), 2500)
  }

  const btn = 'flex-1 py-2 rounded-xl text-xs font-semibold text-gray-200 hover:bg-white/10 flex items-center justify-center gap-1.5 cursor-pointer'
  const when = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const CommentRow = ({ c, reply }: { c: Comment; reply?: boolean }) => (
    <div className={`flex gap-2 ${reply ? 'ml-8' : ''}`}>
      <div className="w-7 h-7 rounded-full bg-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-[#C9A84C]">
        {c.author.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.author.avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          c.author.name.slice(0, 1).toUpperCase()
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-white/10 px-3 py-2">
          <p translate="no" className="text-[11px] font-bold text-white flex items-center gap-1">
            {c.author.profile ? <Link href={`/u/${c.author.profile}`}>{c.author.name}</Link> : c.author.name}
            {c.author.verified && <VerifiedTick className="w-3 h-3" />}
          </p>
          <p className="text-xs text-gray-100 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{c.text}</p>
        </div>
        <div className="flex gap-3 px-2 pt-0.5 text-[10px] text-gray-400">
          <span>{when(c.createdAt)}</span>
          {signedIn && (
            <button type="button" onClick={() => setReplyTo(c)} className="font-semibold hover:text-white cursor-pointer">
              Reply
            </button>
          )}
          {c.canDelete && (
            <button type="button" onClick={() => remove(c)} className="font-semibold hover:text-rose-300 cursor-pointer">
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="px-3 pb-3 pt-2">
      {(total > 0 || post.comments > 0) && (
        <div className="px-1 pb-2 flex items-center justify-between text-[11px] text-gray-400">
          <span>{total > 0 && `${Object.keys(post.reactions).join('')} ${total}`}</span>
          {post.comments > 0 && (
            <button type="button" onClick={toggleComments} className="hover:text-white cursor-pointer">
              {post.comments} {post.comments === 1 ? 'comment' : 'comments'}
            </button>
          )}
        </div>
      )}
      <div className="relative flex border-t border-white/10 pt-1">
        {picker && (
          <div className="absolute bottom-full left-0 mb-1 z-20 flex gap-1 px-2 py-1.5 rounded-full bg-white shadow-xl">
            {REACTIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => react(r)}
                className={`text-xl leading-none p-1 rounded-full hover:scale-125 transition-transform cursor-pointer ${post.myReaction === r ? 'bg-amber-100' : ''}`}
                aria-label={`React ${r}`}
              >
                {r}
              </button>
            ))}
          </div>
        )}
        {signedIn ? (
          <button type="button" onClick={() => setPicker(!picker)} className={btn}>
            {post.myReaction ? <span className="text-sm leading-none">{post.myReaction}</span> : <SmilePlus className="w-4 h-4" />} React
          </button>
        ) : (
          <Link href={login} className={btn}>
            <SmilePlus className="w-4 h-4" /> React
          </Link>
        )}
        <button type="button" onClick={toggleComments} className={btn}>
          <MessageCircle className="w-4 h-4" /> Comment
        </button>
        {!mine && (
          <Link href={signedIn ? chat : `/login?callbackUrl=${encodeURIComponent(chat)}`} className={btn}>
            <MessageSquare className="w-4 h-4" /> Message
          </Link>
        )}
        <button type="button" onClick={share} className={btn}>
          <Share2 className="w-4 h-4" /> Share
        </button>
      </div>
      {note && <p className="px-1 pt-1 text-[11px] text-emerald-300">{note}</p>}

      {open && (
        <div className="pt-3 space-y-3">
          {!comments ? (
            <p className="text-[11px] text-gray-400 px-1">Loading…</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="space-y-2">
                <CommentRow c={c} />
                {c.replies?.map((r) => <CommentRow key={r.id} c={r} reply />)}
              </div>
            ))
          )}
          {signedIn ? (
            <form onSubmit={send} className="space-y-1">
              {replyTo && (
                <p className="text-[11px] text-gray-400 px-1 flex items-center gap-2">
                  Replying to {replyTo.author.name}
                  <button type="button" onClick={() => setReplyTo(null)} className="text-gray-300 hover:text-white cursor-pointer" aria-label="Cancel reply">
                    <X className="w-3 h-3" />
                  </button>
                </p>
              )}
              <div className="flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={1000}
                  placeholder={replyTo ? 'Write a reply…' : 'Write a comment…'}
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-base sm:text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#C9A84C]"
                />
                <button type="submit" disabled={sending || !text.trim()} className="px-3 rounded-xl bg-[#C9A84C] text-[#0F1C3F] text-xs font-bold disabled:opacity-50 cursor-pointer">
                  {sending ? '…' : 'Send'}
                </button>
              </div>
            </form>
          ) : (
            <Link href={login} className="block text-center text-xs font-semibold text-[#C9A84C] py-1">
              Sign in to comment
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

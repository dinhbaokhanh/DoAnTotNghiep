'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { discussionsApi } from '@/lib/api/discussions'
import { commentsApi } from '@/lib/api/comments'
import { useAuth } from '@/lib/auth/context'
import { VotePill } from '@/components/academic/VotePill'
import { TopicChip } from '@/components/academic/TopicChip'
import { StatusBadge } from '@/components/academic/StatusBadge'
import { AcceptedAnswerBadge } from '@/components/academic/AcceptedAnswerBadge'
import { FacultyBadge } from '@/components/academic/FacultyBadge'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import type { Discussion, Comment } from '@/types'
import { ApiRequestError } from '@/lib/api/client'
import styles from './post-detail.module.css'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, isAuthenticated } = useAuth()
  const [discussion, setDiscussion] = useState<Discussion | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [post, commentRes] = await Promise.all([
        discussionsApi.get(id),
        commentsApi.list(id),
      ])
      setDiscussion(post)
      setComments(commentRes.data)
    } catch {
      setError('Failed to load this post.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    const loadPost = async () => {
      await fetchAll()
    }
    void loadPost()
  }, [fetchAll])

  async function handleSubmitAnswer(e: React.FormEvent) {
    e.preventDefault()
    if (!answerText.trim()) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const newComment = await commentsApi.create(id, {
        content: answerText.trim(),
      })
      setComments((prev) => [...prev, newComment])
      setAnswerText('')
      // Update count
      setDiscussion((d) => (d ? { ...d, commentCount: d.commentCount + 1 } : d))
    } catch (err) {
      setSubmitError(
        err instanceof ApiRequestError ? err.message : 'Failed to post answer.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAcceptAnswer(commentId: string) {
    if (!discussion) return
    try {
      const updated = await discussionsApi.acceptAnswer(
        discussion.id,
        commentId
      )
      setDiscussion(updated)
    } catch {
      /* silent */
    }
  }

  if (loading) return <LoadingState label="Loading post…" />
  if (error || !discussion)
    return (
      <ErrorState message={error ?? 'Post not found.'} onRetry={fetchAll} />
    )

  const isAuthor = user?.id === discussion.authorId
  const netScore = discussion.upvoteCount - discussion.downvoteCount

  return (
    <article className={styles.wrap}>
      {/* Post header */}
      <header className={styles.header}>
        <div className={styles.headerMeta}>
          <span
            className={[
              styles.typeBadge,
              discussion.postType === 'question' ? styles.typeQ : styles.typeD,
            ].join(' ')}
          >
            {discussion.postType === 'question' ? 'Question' : 'Discussion'}
          </span>
          <StatusBadge status={discussion.status} />
          {discussion.acceptedCommentId && <AcceptedAnswerBadge />}
        </div>
        <h1 className={styles.title}>{discussion.title}</h1>
        <div className={styles.tags}>
          {discussion.tags.map((t) => (
            <TopicChip key={t.id} tag={t} />
          ))}
        </div>
      </header>

      {/* Post body */}
      <div className={styles.postBody}>
        {/* Vote column */}
        <div className={styles.voteCol}>
          <VotePill
            targetType="discussion"
            targetId={discussion.id}
            upvoteCount={discussion.upvoteCount}
            downvoteCount={discussion.downvoteCount}
            myVote={discussion.myVote}
            orientation="vertical"
            disabled={!isAuthenticated}
          />
          <span className={styles.netScore}>
            {netScore >= 0 ? '+' : ''}
            {netScore}
          </span>
        </div>

        {/* Content */}
        <div className={styles.bodyContent}>
          <div className={`${styles.postText} ${styles.markdownBody}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {discussion.content}
            </ReactMarkdown>
          </div>

          {/* Author meta */}
          <div className={styles.postMeta}>
            <span className={styles.metaTime}>
              Asked {formatDate(discussion.createdAt)}
            </span>
            <span>·</span>
            <span>{discussion.viewCount.toLocaleString()} views</span>
            {!discussion.isAnonymous && discussion.author && (
              <div className={styles.authorChip}>
                <Avatar
                  src={discussion.author.avatarUrl}
                  alt={discussion.author.fullName}
                  size="xs"
                />
                <span className={styles.authorName}>
                  {discussion.author.fullName}
                </span>
                <FacultyBadge role={discussion.author.role} size="sm" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Answers section */}
      <section className={styles.answersSection} aria-label="Answers">
        <h2 className={styles.answersTitle}>
          {comments.length} {comments.length === 1 ? 'Answer' : 'Answers'}
        </h2>

        <div className={styles.answersList}>
          {comments.map((comment) => (
            <div
              key={comment.id}
              id={`answer-${comment.id}`}
              className={[
                styles.answer,
                comment.id === discussion.acceptedCommentId
                  ? styles.answerAccepted
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {/* Vote */}
              <div className={styles.answerVote}>
                <VotePill
                  targetType="comment"
                  targetId={comment.id}
                  upvoteCount={comment.upvoteCount}
                  downvoteCount={comment.downvoteCount}
                  myVote={comment.myVote}
                  orientation="vertical"
                  disabled={!isAuthenticated}
                />
                {comment.id === discussion.acceptedCommentId && (
                  <AcceptedAnswerBadge compact />
                )}
              </div>

              {/* Answer body */}
              <div className={styles.answerBody}>
                <div className={`${styles.answerText} ${styles.markdownBody}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {comment.content}
                  </ReactMarkdown>
                </div>

                <div className={styles.answerMeta}>
                  <span className={styles.metaTime}>
                    {formatDate(comment.createdAt)}
                  </span>
                  {!comment.isAnonymous && comment.author && (
                    <div className={styles.authorChip}>
                      <Avatar
                        src={comment.author.avatarUrl}
                        alt={comment.author.fullName}
                        size="xs"
                      />
                      <span className={styles.authorName}>
                        {comment.author.fullName}
                      </span>
                      <FacultyBadge role={comment.author.role} size="sm" />
                    </div>
                  )}
                  {/* Accept answer button for question author */}
                  {isAuthor && discussion.postType === 'question' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAcceptAnswer(comment.id)}
                      className={
                        comment.id === discussion.acceptedCommentId
                          ? styles.acceptedBtn
                          : ''
                      }
                    >
                      {comment.id === discussion.acceptedCommentId
                        ? '✓ Accepted'
                        : 'Accept'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Post answer form */}
      {isAuthenticated ? (
        <section className={styles.answerForm} aria-label="Post your answer">
          <h2 className={styles.answersTitle}>Your Answer</h2>
          <form onSubmit={handleSubmitAnswer}>
            <Textarea
              id="answer-text"
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Share your knowledge. Be specific and cite sources where relevant."
              rows={6}
            />
            {submitError && (
              <p className={styles.submitError} role="alert">
                {submitError}
              </p>
            )}
            <div className={styles.formActions}>
              <Button
                type="submit"
                loading={submitting}
                disabled={!answerText.trim()}
              >
                Post Answer
              </Button>
            </div>
          </form>
        </section>
      ) : (
        <div className={styles.signInPrompt}>
          <p>
            <a href="/login">Sign in</a> or{' '}
            <a href="/register">create an account</a> to post an answer.
          </p>
        </div>
      )}
    </article>
  )
}

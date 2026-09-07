'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { tagsApi } from '@/lib/api/tags'
import { Input } from '@/components/ui/Input'
import { LoadingState } from '@/components/shared/LoadingState'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import type { Tag } from '@/types'
import styles from './tags.module.css'

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const fetchTags = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await tagsApi.list(1, 100)
      setTags(res.data)
    } catch {
      setError('Failed to load tags. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadTags = async () => {
      await fetchTags()
    }
    void loadTags()
  }, [])

  const filteredTags = tags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(search.toLowerCase()) ||
      tag.slug.toLowerCase().includes(search.toLowerCase()) ||
      (tag.description &&
        tag.description.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Academic Tags</h1>
        <p className={styles.subtitle}>
          A tag is a keyword or label that categorizes your question or
          discussion with other similar topics. Using the right tags makes it
          easier for others to find and answer your question.
        </p>
      </header>

      <div className={styles.searchBar}>
        <Input
          id="tag-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by tag name or keyword..."
        />
      </div>

      {loading && <LoadingState label="Loading tags..." />}
      {error && <ErrorState message={error} onRetry={fetchTags} />}

      {!loading && !error && filteredTags.length === 0 && (
        <EmptyState
          title="No tags found"
          description={
            search
              ? `No tags matched "${search}".`
              : 'No tags are currently registered in the system.'
          }
        />
      )}

      {!loading && !error && filteredTags.length > 0 && (
        <div className={styles.tagsGrid}>
          {filteredTags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tags/${tag.slug}`}
              className={styles.tagCard}
            >
              <div>
                <div className={styles.tagCardHeader}>
                  <span className={styles.tagName}>#{tag.name}</span>
                  <span className={styles.tagCount}>
                    {tag.usageCount || 0} questions
                  </span>
                </div>
                <p className={styles.tagDescription}>
                  {tag.description ||
                    'No description provided for this academic topic yet.'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

'use client';

import React, { useState, useOptimistic, useTransition } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Plus, Send, AlertCircle } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { createTopic, voteTopic, addComment } from './actions';
import { useRouter } from 'next/navigation';
import TopicForm from './TopicForm';
import { ROLE_LABELS, ROLE_BADGE_COLORS, Role } from '@/lib/roles';

interface Topic {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  profiles: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  votes: {
    vote_type: 'up' | 'down';
    profile_id: string;
  }[];
  comments: {
    id: string;
    content: string;
    created_at: string;
    profiles: {
      username: string | null;
      role: Role | null;
      role_verified: boolean | null;
    } | null;
  }[];
}

interface TopicsClientProps {
  initialTopics: Topic[];
  user: User | null;
}

export default function TopicsClient({
  initialTopics,
  user,
}: TopicsClientProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Optimistic UI for Topics (votes and comments)
  const [optimisticTopics, addOptimisticAction] = useOptimistic(
    initialTopics,
    (state, action: { type: 'vote'; topicId: string; voteType: 'up' | 'down' } | { type: 'comment'; topicId: string; content: string }) => {
      if (action.type === 'vote') {
        return state.map((topic) => {
          if (topic.id !== action.topicId) return topic;

          const existingVote = topic.votes.find((v) => v.profile_id === user?.id);
          let newVotes = [...topic.votes];

          if (existingVote && existingVote.vote_type === action.voteType) {
            // Remove vote
            newVotes = newVotes.filter((v) => v.profile_id !== user?.id);
          } else if (existingVote) {
            // Update vote
            newVotes = newVotes.map((v) =>
              v.profile_id === user?.id ? { ...v, vote_type: action.voteType } : v
            );
          } else if (user) {
            // Add vote
            newVotes.push({ profile_id: user.id, vote_type: action.voteType });
          }

          return { ...topic, votes: newVotes };
        });
      }

      if (action.type === 'comment') {
        return state.map((topic) => {
          if (topic.id !== action.topicId) return topic;

          const newComment = {
            id: 'temp-id-' + Math.random(),
            content: action.content,
            created_at: new Date().toISOString(),
            profiles: { username: user?.user_metadata?.username || 'Já', role: null, role_verified: null }
          };

          return { ...topic, comments: [...topic.comments, newComment] };
        });
      }

      return state;
    }
  );

  const handleVote = async (topicId: string, type: 'up' | 'down') => {
    if (!user) {
      router.push('/login');
      return;
    }

    setError(null);
    startTransition(async () => {
      addOptimisticAction({ type: 'vote', topicId, voteType: type });
      try {
        const result = await voteTopic(topicId, type);
        if (result?.error) {
          setError(result.error);
        } else {
          router.refresh();
        }
      } catch {
        setError('Chyba při hlasování.');
      }
    });
  };

  const handleCreateTopic = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setError(null);
    const formData = new FormData(e.currentTarget);

    try {
      const result = await createTopic(formData);
      if (result?.errors) {
        setError(Object.values(result.errors).flat().join(', '));
      } else if (result?.error) {
        setError(result.error);
      } else {
        setShowForm(false);
        router.refresh();
      }
    } catch {
      setError('Něco se nepovedlo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent<HTMLFormElement>, topicId: string) => {
    e.preventDefault();
    if (!user) return;

    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const content = formData.get('content') as string;

    startTransition(async () => {
      addOptimisticAction({ type: 'comment', topicId, content });
      try {
        const result = await addComment(formData);
        if (result?.error) {
          setError(result.error);
        } else {
          form.reset();
          router.refresh();
        }
      } catch {
        setError('Chyba při přidávání komentáře.');
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-xs underline">Zavřít</button>
        </div>
      )}

      {/* Creation Form Modal */}
      {showForm && (
        <TopicForm
          onSubmit={handleCreateTopic}
          onClose={() => {
            setShowForm(false);
            setError(null);
          }}
          isSubmitting={isSubmitting}
          error={error}
          onErrorClose={() => setError(null)}
        />
      )}

      {/* Topics Feed */}
      <div className="space-y-4">
        {optimisticTopics.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-zinc-500">Zatím nebyla přidána žádná témata.</p>
          </div>
        ) : (
          optimisticTopics.map((topic) => {
            const upVotes = topic.votes.filter(v => v.vote_type === 'up').length;
            const downVotes = topic.votes.filter(v => v.vote_type === 'down').length;
            const userVote = topic.votes.find(v => v.profile_id === user?.id)?.vote_type;

            return (
              <div
                key={topic.id}
                className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-500">
                    {topic.profiles?.username || 'Anonymní uživatel'} • {new Date(topic.created_at).toLocaleDateString('cs-CZ')}
                  </span>
                </div>
                <h3 className="mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {topic.title}
                </h3>
                {topic.description && (
                  <p className="mb-4 text-zinc-600 dark:text-zinc-400">
                    {topic.description}
                  </p>
                )}

                <div className="flex items-center gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                  {/* Voting — pill-style buttons */}
                  {user ? (
                    <>
                      <button
                        onClick={() => handleVote(topic.id, 'up')}
                        disabled={isPending}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                          userVote === 'up'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                        }`}
                      >
                        <ThumbsUp className={`h-3.5 w-3.5 ${userVote === 'up' ? 'fill-current' : ''}`} />
                        <span className="font-bold">{upVotes}</span>
                      </button>
                      <button
                        onClick={() => handleVote(topic.id, 'down')}
                        disabled={isPending}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                          userVote === 'down'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                        }`}
                      >
                        <ThumbsDown className={`h-3.5 w-3.5 ${userVote === 'down' ? 'fill-current' : ''}`} />
                        <span className="font-bold">{downVotes}</span>
                      </button>
                    </>
                  ) : (
                    <span className="flex items-center gap-3 text-sm text-zinc-400">
                      <span className="flex items-center gap-1"><ThumbsUp className="h-4 w-4" />{upVotes}</span>
                      <span className="flex items-center gap-1"><ThumbsDown className="h-4 w-4" />{downVotes}</span>
                      <a href="/login" className="text-blue-600 hover:underline text-xs">Přihlaste se pro hlasování</a>
                    </span>
                  )}

                  <button
                    onClick={() => setCommentingOn(commentingOn === topic.id ? null : topic.id)}
                    className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>{topic.comments.length}</span>
                  </button>
                </div>

                {/* Comments Section */}
                {commentingOn === topic.id && (
                  <div className="mt-4 space-y-4 border-t border-zinc-50 pt-4 dark:border-zinc-800/50">
                    {topic.comments.map((comment) => {
                      const commentRole = comment.profiles?.role ?? null;
                      const commentRoleVerified = comment.profiles?.role_verified ?? false;
                      return (
                        <div key={comment.id} className="text-sm">
                          <span className="inline-flex items-center gap-1.5 font-bold text-zinc-900 dark:text-zinc-100">
                            {comment.profiles?.username || 'Uživatel'}
                            {commentRole && commentRole !== 'citizen' && commentRoleVerified && (
                              <span
                                data-testid="role-badge"
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_BADGE_COLORS[commentRole]}`}
                              >
                                {ROLE_LABELS[commentRole]}
                              </span>
                            )}
                            :
                          </span>{' '}
                          <span className="text-zinc-600 dark:text-zinc-400">{comment.content}</span>
                        </div>
                      );
                    })}

                    {user ? (
                      <form onSubmit={(e) => handleAddComment(e, topic.id)} className="flex gap-2">
                        <input
                          type="text"
                          name="content"
                          placeholder="Napište komentář..."
                          required
                          disabled={isPending}
                          className="flex-1 rounded-full border border-zinc-300 bg-white px-4 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 disabled:opacity-50"
                        />
                        <input type="hidden" name="topic_id" value={topic.id} />
                        <button
                          type="submit"
                          disabled={isPending}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-400"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    ) : (
                      <p className="text-xs text-zinc-500 italic">Pro komentování se musíte přihlásit.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Floating login CTA for logged-out users */}
      {!user && (
        <div
          data-testid="login-cta"
          className="fixed bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-lg bg-white px-5 py-3 shadow-xl dark:bg-zinc-900"
        >
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Pro přidání tématu se{' '}
            <a href="/login" className="text-blue-600 hover:underline">
              přihlaste
            </a>
            .
          </p>
        </div>
      )}

      {/* FAB — floating action button for logged-in users */}
      {user && !showForm && (
        <button
          data-testid="new-topic-fab"
          onClick={() => {
            setError(null);
            setShowForm(true);
          }}
          aria-label="Nové téma"
          className="fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl transition-all hover:scale-105 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}

'use client';

import React, { useState, useOptimistic, useTransition } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Plus, Send, AlertCircle } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { createTopic, voteTopic, addComment } from './actions';
import { useRouter } from 'next/navigation';
import TopicForm from './TopicForm';

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
            profiles: { username: user?.user_metadata?.username || 'Já' }
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
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-xs underline">Zavřít</button>
        </div>
      )}

      {/* Action Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Aktuální témata
        </h2>
        {user ? (
          <button
            onClick={() => {
              setError(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Plus className="h-4 w-4" />
            Nové téma
          </button>
        ) : (
          <p className="text-sm text-zinc-500">
            Pro přidání tématu se <a href="/login" className="text-blue-600 underline">přihlaste</a>.
          </p>
        )}
      </div>

      {/* Creation Form Modal/Overlay */}
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
              <div key={topic.id} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 transition-opacity duration-200">
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

                <div className="flex items-center gap-6 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    {user ? (
                      <>
                        <button
                          onClick={() => handleVote(topic.id, 'up')}
                          disabled={isPending}
                          className={`flex items-center gap-1 rounded-md px-2 py-1 transition-colors ${userVote === 'up' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500'}`}
                        >
                          <ThumbsUp className={`h-4 w-4 ${userVote === 'up' ? 'fill-current' : ''}`} />
                          <span className="text-sm font-bold">{upVotes}</span>
                        </button>
                        <button
                          onClick={() => handleVote(topic.id, 'down')}
                          disabled={isPending}
                          className={`flex items-center gap-1 rounded-md px-2 py-1 transition-colors ${userVote === 'down' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500'}`}
                        >
                          <ThumbsDown className={`h-4 w-4 ${userVote === 'down' ? 'fill-current' : ''}`} />
                          <span className="text-sm font-bold">{downVotes}</span>
                        </button>
                      </>
                    ) : (
                      <span className="flex items-center gap-3 text-sm text-zinc-400">
                        <span className="flex items-center gap-1"><ThumbsUp className="h-4 w-4" />{upVotes}</span>
                        <span className="flex items-center gap-1"><ThumbsDown className="h-4 w-4" />{downVotes}</span>
                        <a href="/login" className="text-blue-600 hover:underline text-xs">Přihlaste se pro hlasování</a>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setCommentingOn(commentingOn === topic.id ? null : topic.id)}
                    className="flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>{topic.comments.length} komentářů</span>
                  </button>
                </div>

                {/* Comments Section */}
                {commentingOn === topic.id && (
                  <div className="mt-4 space-y-4 border-t border-zinc-50 pt-4 dark:border-zinc-800/50">
                    {topic.comments.map((comment) => (
                      <div key={comment.id} className="text-sm">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          {comment.profiles?.username || 'Uživatel'}:
                        </span>{' '}
                        <span className="text-zinc-600 dark:text-zinc-400">{comment.content}</span>
                      </div>
                    ))}
                    
                    {user ? (
                      <form onSubmit={(e) => handleAddComment(e, topic.id)} className="flex gap-2">
                        <input
                          type="text"
                          name="content"
                          placeholder="Napište komentář..."
                          required
                          disabled={isPending}
                          className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 disabled:opacity-50"
                        />
                        <input type="hidden" name="topic_id" value={topic.id} />
                        <button
                          type="submit"
                          disabled={isPending}
                          className="rounded-md bg-zinc-900 px-3 py-1 text-sm text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 disabled:opacity-50"
                        >
                          <Send className="h-4 w-4" />
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
    </div>
  );
}


"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { StickyNote, Trash2, Loader2, Send } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { extractErrorMessage } from "@/lib/api/base";

export interface NoteAuthor {
  id: number;
  fullName: string;
  role: string;
  profilePic: string | null;
}

export interface StudentNoteItem {
  id: string;
  content: string;
  createdAt: string;
  author: NoteAuthor;
}

interface Props {
  studentId: number;
  fetchNotes: (studentId: number) => Promise<StudentNoteItem[]>;
  addNote: (studentId: number, content: string) => Promise<StudentNoteItem>;
  deleteNote: (studentId: number, noteId: string) => Promise<void>;
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  FACULTY: "Faculty",
  STUDENT: "Student",
  ALUMNI: "Alumni",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StudentNotesPanel({ studentId, fetchNotes, addNote, deleteNote }: Props) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<StudentNoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      setNotes(await fetchNotes(studentId));
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setSubmitting(true);
    try {
      const note = await addNote(studentId, content);
      setNotes((prev) => [note, ...prev]);
      setText("");
      textareaRef.current?.focus();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm("Delete this note?")) return;
    setDeletingId(noteId);
    try {
      await deleteNote(studentId, noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  const canDelete = (note: StudentNoteItem) =>
    user?.role === "ADMIN" || note.author.id === user?.id;

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 sm:rounded-2xl sm:p-6">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <StickyNote className="h-4 w-4 text-neutral-500" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Internal Notes
        </h3>
        <span className="ml-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
          Not visible to student
        </span>
      </div>

      {/* Add note form */}
      <form onSubmit={handleAdd} className="mb-6">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a private note about this student…"
          maxLength={2000}
          rows={3}
          className="w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 transition focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-neutral-400">{text.length}/2000</span>
          <button
            type="submit"
            disabled={submitting || !text.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {submitting ? "Saving…" : "Add note"}
          </button>
        </div>
      </form>

      {/* Notes list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
        </div>
      ) : notes.length === 0 ? (
        <p className="text-sm text-neutral-400">No notes yet.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li
              key={note.id}
              className="group rounded-xl border border-neutral-200 bg-neutral-50 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-2.5">
                  {note.author.profilePic ? (
                    <img
                      src={note.author.profilePic}
                      alt=""
                      className="mt-0.5 h-7 w-7 flex-shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-neutral-200 text-[10px] font-bold text-neutral-600">
                      {note.author.fullName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-semibold text-neutral-900">
                        {note.author.fullName}
                      </span>
                      <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600">
                        {ROLE_LABEL[note.author.role] ?? note.author.role}
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        {formatDate(note.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm text-neutral-800">
                      {note.content}
                    </p>
                  </div>
                </div>

                {canDelete(note) && (
                  <button
                    type="button"
                    onClick={() => handleDelete(note.id)}
                    disabled={deletingId === note.id}
                    className="self-start rounded p-1 text-neutral-400 opacity-100 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-shrink-0 sm:opacity-0 sm:group-hover:opacity-100"
                    title="Delete note"
                  >
                    {deletingId === note.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
